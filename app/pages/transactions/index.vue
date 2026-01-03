<script setup lang="ts">
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Transaction, TransactionType, TransactionCreate } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
  if (!newUser) {
    router.push('/auth/login')
  }
}, { immediate: true })

const { transactions, loading, error, fetchTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions()
const { categories, fetchCategories } = useCategories()
const { fundSources, fetchFundSources } = useFundSources()

// Filters
const typeFilter = ref<TransactionType | ''>('')
const categoryFilter = ref<string>('')
const searchQuery = ref('')

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<TransactionCreate>({
  type: 'expense',
  amount: 0,
  description: '',
  category_id: null,
  source_fund_id: null,
  destination_fund_id: null,
  transaction_date: new Date().toISOString(),
  notes: ''
})

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchTransactions({ limit: 50 }),
    fetchCategories(),
    fetchFundSources()
  ])
})

// Filtered transactions
const filteredTransactions = computed(() => {
  let result = transactions.value

  if (typeFilter.value) {
    result = result.filter(t => t.type === typeFilter.value)
  }

  if (categoryFilter.value) {
    result = result.filter(t => t.category_id === categoryFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.description?.toLowerCase().includes(query)
      || t.notes?.toLowerCase().includes(query)
    )
  }

  return result
})

// Filtered categories based on selected type - grouped by parent
const groupedCategoryOptions = computed(() => {
  const typeFilter = formData.value.type
  if (!typeFilter || typeFilter === 'transfer') return []

  // Get categories of the selected type
  const typeCategories = categories.value.filter(c => c.type === typeFilter)

  // Separate parents and children
  const parents = typeCategories.filter(c => !c.parent_id)
  const children = typeCategories.filter(c => c.parent_id)

  // Build grouped options
  const options: { label: string, value: string, disabled?: boolean, icon?: string }[] = []

  parents.forEach((parent) => {
    const parentChildren = children.filter(c => c.parent_id === parent.id)

    if (parentChildren.length > 0) {
      // Parent as header (disabled)
      options.push({
        label: `📁 ${parent.name}`,
        value: `header-${parent.id}`,
        disabled: true
      })
      // Children as selectable options
      parentChildren.forEach((child) => {
        options.push({
          label: `    ${child.name}`,
          value: child.id
        })
      })
    } else {
      // Parent without children - make it selectable
      options.push({
        label: parent.name,
        value: parent.id
      })
    }
  })

  // Add orphan children (children whose parent is not in this type)
  const orphans = children.filter(c => !parents.some(p => p.id === c.parent_id))
  orphans.forEach((child) => {
    options.push({
      label: child.name,
      value: child.id
    })
  })

  return options
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function _formatDate(dateString: string) {
  return format(new Date(dateString), 'd MMM yyyy, HH:mm', { locale: idLocale })
}

function formatDateShort(dateString: string) {
  return format(new Date(dateString), 'd MMM', { locale: idLocale })
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'income': return 'Pemasukan'
    case 'expense': return 'Pengeluaran'
    case 'transfer': return 'Transfer'
    default: return type
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'income': return 'success'
    case 'expense': return 'error'
    case 'transfer': return 'info'
    default: return 'neutral'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'income': return 'i-lucide-arrow-down-left'
    case 'expense': return 'i-lucide-arrow-up-right'
    case 'transfer': return 'i-lucide-arrow-left-right'
    default: return 'i-lucide-circle'
  }
}

const openNewModal = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    type: 'expense',
    amount: 0,
    description: '',
    category_id: null,
    source_fund_id: null,
    destination_fund_id: null,
    transaction_date: new Date().toISOString().slice(0, 16),
    notes: ''
  }
  isModalOpen.value = true
}

const openEditModal = (transaction: Transaction) => {
  isEditing.value = true
  editingId.value = transaction.id

  // For income, the fund is actually destination_fund
  let sourceFundId = transaction.source_fund_id
  if (transaction.type === 'income' && transaction.destination_fund_id) {
    sourceFundId = transaction.destination_fund_id
  }

  formData.value = {
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description || '',
    category_id: transaction.category_id,
    source_fund_id: sourceFundId,
    destination_fund_id: transaction.destination_fund_id,
    transaction_date: new Date(transaction.transaction_date).toISOString().slice(0, 16),
    notes: transaction.notes || ''
  }
  isModalOpen.value = true
}

const handleSubmit = async () => {
  if (!formData.value.amount || formData.value.amount <= 0) {
    toast.add({ title: 'Jumlah harus lebih dari 0', color: 'error' })
    return
  }

  // Validate based on type
  if (formData.value.type === 'income' && !formData.value.source_fund_id) {
    toast.add({ title: 'Pilih sumber dana tujuan', color: 'error' })
    return
  }

  if (formData.value.type === 'expense' && !formData.value.source_fund_id) {
    toast.add({ title: 'Pilih sumber dana', color: 'error' })
    return
  }

  if (formData.value.type === 'transfer' && (!formData.value.source_fund_id || !formData.value.destination_fund_id)) {
    toast.add({ title: 'Pilih sumber dana asal dan tujuan', color: 'error' })
    return
  }

  // Adjust fund mapping based on type
  const payload: TransactionCreate = {
    ...formData.value,
    transaction_date: new Date(formData.value.transaction_date).toISOString()
  }

  // For income, the fund is destination
  if (formData.value.type === 'income') {
    payload.destination_fund_id = formData.value.source_fund_id
    payload.source_fund_id = null
  }

  let result
  if (isEditing.value && editingId.value) {
    result = await updateTransaction(editingId.value, payload as Parameters<typeof updateTransaction>[1])
    if (result) {
      toast.add({ title: 'Transaksi berhasil diperbarui', color: 'success' })
    }
  } else {
    result = await createTransaction(payload)
    if (result) {
      toast.add({ title: 'Transaksi berhasil ditambahkan', color: 'success' })
    }
  }

  if (result) {
    isModalOpen.value = false
    await fetchFundSources() // Refresh balances
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}

const { confirm } = useConfirmModal()

const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: 'Hapus Transaksi',
    message: 'Yakin ingin menghapus transaksi ini?',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    confirmColor: 'error'
  })
  if (!confirmed) return

  const success = await deleteTransaction(id)
  if (success) {
    toast.add({ title: 'Transaksi berhasil dihapus', color: 'success' })
    await fetchFundSources() // Refresh balances
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="transactions">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <h1 class="text-xl font-bold text-highlighted">
            Transaksi
          </h1>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" @click="openNewModal">
            <span class="hidden sm:inline">Tambah Transaksi</span>
          </UButton>
        </template>
      </UDashboardNavbar>

      <!-- Toolbar - Responsive -->
      <div class="px-4 py-3 border-b border-default bg-default">
        <div class="flex flex-col sm:flex-row gap-3">
          <UInput
            v-model="searchQuery"
            placeholder="Cari transaksi..."
            icon="i-lucide-search"
            class="w-full sm:w-64"
          />

          <div class="flex gap-2 flex-1 sm:flex-none">
            <USelectMenu
              v-model="typeFilter"
              :items="[
                { label: 'Semua Tipe', value: '' },
                { label: 'Pemasukan', value: 'income' },
                { label: 'Pengeluaran', value: 'expense' },
                { label: 'Transfer', value: 'transfer' }
              ]"
              value-key="value"
              class="flex-1 sm:w-36"
            />

            <USelectMenu
              v-model="categoryFilter"
              :items="[
                { label: 'Semua Kategori', value: '' },
                ...categories.map(c => ({ label: c.name, value: c.id }))
              ]"
              value-key="value"
              class="flex-1 sm:w-40"
            />
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="p-4 rounded-xl border border-default bg-default animate-pulse">
          <div class="flex items-center gap-4">
            <div class="size-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
              <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            </div>
            <div class="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTransactions.length === 0" class="text-center py-16">
        <div class="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-lucide-receipt" class="size-10 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-highlighted mb-2">
          Belum ada transaksi
        </h3>
        <p class="text-muted mb-6">
          Mulai catat transaksi keuangan Anda
        </p>
        <UButton icon="i-lucide-plus" @click="openNewModal">
          Tambah Transaksi Pertama
        </UButton>
      </div>

      <!-- Transaction List -->
      <div v-else class="space-y-2">
        <div
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          class="group p-3 sm:p-4 rounded-xl border border-default bg-default hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Icon -->
            <div
              class="size-10 sm:size-12 rounded-lg flex items-center justify-center shrink-0"
              :class="{
                'bg-success/10': transaction.type === 'income',
                'bg-error/10': transaction.type === 'expense',
                'bg-info/10': transaction.type === 'transfer'
              }"
            >
              <UIcon
                :name="getTypeIcon(transaction.type)"
                class="size-5 sm:size-6"
                :class="{
                  'text-success': transaction.type === 'income',
                  'text-error': transaction.type === 'expense',
                  'text-info': transaction.type === 'transfer'
                }"
              />
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-highlighted truncate">
                    {{ transaction.description || getTypeLabel(transaction.type) }}
                  </p>
                  <div class="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted">
                    <span>{{ formatDateShort(transaction.transaction_date) }}</span>
                    <span class="hidden sm:inline">•</span>
                    <UBadge
                      :color="getTypeColor(transaction.type)"
                      variant="subtle"
                      size="xs"
                      class="hidden sm:inline-flex"
                    >
                      {{ getTypeLabel(transaction.type) }}
                    </UBadge>
                    <span v-if="transaction.category" class="hidden md:inline">
                      • {{ transaction.category.name }}
                    </span>
                  </div>
                  <!-- Mobile: Show fund info -->
                  <p class="text-xs text-muted mt-1 sm:hidden">
                    <span v-if="transaction.source_fund">{{ transaction.source_fund.name }}</span>
                    <span v-if="transaction.type === 'transfer'" class="mx-1">→</span>
                    <span v-if="transaction.destination_fund">{{ transaction.destination_fund.name
                    }}</span>
                  </p>
                </div>

                <!-- Amount -->
                <div class="text-right shrink-0">
                  <p
                    class="font-bold text-sm sm:text-base"
                    :class="{
                      'text-success': transaction.type === 'income',
                      'text-error': transaction.type === 'expense',
                      'text-info': transaction.type === 'transfer'
                    }"
                  >
                    {{ transaction.type === 'expense' ? '-' : '+' }}{{
                      formatCurrency(transaction.amount) }}
                  </p>
                  <!-- Desktop: Show fund info -->
                  <p class="text-xs text-muted mt-1 hidden sm:block">
                    <span v-if="transaction.source_fund">{{ transaction.source_fund.name }}</span>
                    <span v-if="transaction.type === 'transfer'" class="mx-1">→</span>
                    <span v-if="transaction.destination_fund">{{ transaction.destination_fund.name
                    }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                class="opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100"
                @click="openEditModal(transaction)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                class="opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100"
                @click="handleDelete(transaction.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Add/Edit Transaction Modal -->
  <UModal v-model:open="isModalOpen">
    <template #content>
      <UCard class="max-h-[90vh] overflow-y-auto">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ isEditing ? 'Edit Transaksi' : 'Tambah Transaksi' }}
            </h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <UFormField label="Tipe Transaksi" required>
            <USelectMenu
              v-model="formData.type"
              :items="[
                { label: 'Pemasukan', value: 'income' },
                { label: 'Pengeluaran', value: 'expense' },
                { label: 'Transfer', value: 'transfer' }
              ]"
              value-key="value"
              class="w-full"
              :disabled="isEditing"
            />
          </UFormField>

          <UFormField label="Jumlah" required>
            <CurrencyInput v-model="formData.amount" placeholder="0" />
          </UFormField>

          <UFormField label="Deskripsi">
            <UInput v-model="formData.description" placeholder="Deskripsi transaksi" class="w-full" />
          </UFormField>

          <UFormField v-if="formData.type !== 'transfer'" label="Kategori">
            <USelectMenu
              v-model="formData.category_id"
              :items="groupedCategoryOptions"
              value-key="value"
              placeholder="Pilih kategori"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="formData.type === 'transfer' ? 'Dari Sumber Dana' : (formData.type === 'income' ? 'Ke Sumber Dana' : 'Dari Sumber Dana')"
            required
          >
            <USelectMenu
              v-model="formData.source_fund_id"
              :items="fundSources.map(f => ({ label: `${f.name} (${formatCurrency(f.balance)})`, value: f.id }))"
              value-key="value"
              placeholder="Pilih sumber dana"
              class="w-full"
            />
          </UFormField>

          <UFormField v-if="formData.type === 'transfer'" label="Ke Sumber Dana" required>
            <USelectMenu
              v-model="formData.destination_fund_id"
              :items="fundSources.filter(f => f.id !== formData.source_fund_id).map(f => ({ label: `${f.name} (${formatCurrency(f.balance)})`, value: f.id }))"
              value-key="value"
              placeholder="Pilih sumber dana tujuan"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Tanggal" required>
            <UInput v-model="formData.transaction_date" type="datetime-local" class="w-full" />
          </UFormField>

          <UFormField label="Catatan">
            <UTextarea v-model="formData.notes" placeholder="Catatan tambahan" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              @click="isModalOpen = false"
            >
              Batal
            </UButton>
            <UButton type="submit" :loading="loading">
              {{ isEditing ? 'Perbarui' : 'Simpan' }}
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>
