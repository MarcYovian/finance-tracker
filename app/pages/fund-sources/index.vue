<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { FundSource, FundSourceCreate, FundSourceType } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
  if (!newUser) {
    router.push('/auth/login')
  }
}, { immediate: true })

const { fundSources, loading, error, fetchFundSources, createFundSource, updateFundSource, deleteFundSource } = useFundSources()

// Search and filter
const searchQuery = ref('')

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<FundSourceCreate>({
  name: '',
  type: 'bank',
  balance: 0,
  currency: 'IDR',
  description: ''
})

// Fetch data on mount
onMounted(async () => {
  await fetchFundSources()
})

const fundTypes: { label: string, value: FundSourceType }[] = [
  { label: 'Bank', value: 'bank' },
  { label: 'Tunai', value: 'cash' },
  { label: 'Kartu Kredit', value: 'credit_card' },
  { label: 'E-Wallet', value: 'wallet' },
  { label: 'Lainnya', value: 'other' }
]

const getTypeLabel = (type: FundSourceType) => {
  return fundTypes.find(t => t.value === type)?.label || type
}

const getTypeIcon = (type: FundSourceType) => {
  switch (type) {
    case 'bank': return 'i-lucide-building-2'
    case 'cash': return 'i-lucide-banknote'
    case 'credit_card': return 'i-lucide-credit-card'
    case 'wallet': return 'i-lucide-wallet'
    default: return 'i-lucide-circle-dollar-sign'
  }
}

const getTypeBgColor = (type: FundSourceType) => {
  switch (type) {
    case 'bank': return 'bg-blue-600'
    case 'cash': return 'bg-emerald-600'
    case 'credit_card': return 'bg-purple-600'
    case 'wallet': return 'bg-orange-500'
    default: return 'bg-gray-600'
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatLastUpdated(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: idLocale })
}

// Group fund sources by type
const groupedFundSources = computed(() => {
  const filtered = fundSources.value.filter(fund =>
    fund.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    || fund.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )

  const groups: Record<string, { label: string, icon: string, funds: FundSource[], total: number }> = {
    bank: { label: 'Bank & Tabungan', icon: 'i-lucide-building-2', funds: [], total: 0 },
    cash: { label: 'Uang Tunai', icon: 'i-lucide-banknote', funds: [], total: 0 },
    wallet: { label: 'E-Wallet', icon: 'i-lucide-wallet', funds: [], total: 0 },
    credit_card: { label: 'Kartu Kredit', icon: 'i-lucide-credit-card', funds: [], total: 0 },
    other: { label: 'Lainnya', icon: 'i-lucide-circle-dollar-sign', funds: [], total: 0 }
  }

  filtered.forEach((fund) => {
    const group = groups[fund.type] || groups.other
    if (group) {
      group.funds.push(fund)
      group.total += fund.balance
    }
  })

  // Only return groups that have funds
  return Object.entries(groups).filter(([_, group]) => group.funds.length > 0)
})

// Stats
const totalAssets = computed(() => {
  return fundSources.value
    .filter(f => f.type !== 'credit_card')
    .reduce((sum, f) => sum + f.balance, 0)
})

const totalLiabilities = computed(() => {
  return fundSources.value
    .filter(f => f.type === 'credit_card')
    .reduce((sum, f) => sum + f.balance, 0)
})

const netWorth = computed(() => totalAssets.value - totalLiabilities.value)

const openNewModal = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    name: '',
    type: 'bank',
    balance: 0,
    currency: 'IDR',
    description: ''
  }
  isModalOpen.value = true
}

const openEditModal = (fund: FundSource) => {
  isEditing.value = true
  editingId.value = fund.id
  formData.value = {
    name: fund.name,
    type: fund.type,
    balance: fund.balance,
    currency: fund.currency,
    description: fund.description || ''
  }
  isModalOpen.value = true
}

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    toast.add({ title: 'Nama sumber dana harus diisi', color: 'error' })
    return
  }

  let result

  if (isEditing.value && editingId.value) {
    result = await updateFundSource(editingId.value, formData.value)
    if (result) {
      toast.add({ title: 'Sumber dana berhasil diperbarui', color: 'success' })
    }
  } else {
    result = await createFundSource(formData.value)
    if (result) {
      toast.add({ title: 'Sumber dana berhasil ditambahkan', color: 'success' })
    }
  }

  if (result) {
    isModalOpen.value = false
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}

const { confirm } = useConfirmModal()

const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: 'Hapus Sumber Dana',
    message: 'Yakin ingin menghapus sumber dana ini?',
    confirmText: 'Hapus',
    confirmColor: 'error'
  })
  if (!confirmed) return

  const success = await deleteFundSource(id)
  if (success) {
    toast.add({ title: 'Sumber dana berhasil dihapus', color: 'success' })
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="fund-sources">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex flex-col">
            <h1 class="text-xl font-bold text-highlighted">
              Sumber Dana
            </h1>
            <p class="text-xs text-muted hidden sm:block">
              Kelola rekening bank, dompet, dan kartu kredit Anda
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" class="shadow-lg shadow-primary/20" @click="openNewModal">
            <span class="hidden sm:inline">Tambah Akun</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Total Net Worth -->
          <div class="p-6 rounded-xl border border-default bg-default relative overflow-hidden group">
            <UIcon
              name="i-lucide-wallet"
              class="absolute -top-2 -right-2 size-20 text-white/5 group-hover:text-white/10 transition-opacity"
            />
            <p class="text-sm font-medium text-muted mb-2">
              Total Saldo Bersih
            </p>
            <div class="flex items-end gap-3">
              <span class="text-2xl font-bold text-highlighted tracking-tight">
                {{ formatCurrency(netWorth) }}
              </span>
            </div>
          </div>

          <!-- Total Assets -->
          <div class="p-6 rounded-xl border border-default bg-default relative overflow-hidden group">
            <UIcon
              name="i-lucide-trending-up"
              class="absolute -top-2 -right-2 size-20 text-white/5 group-hover:text-white/10 transition-opacity"
            />
            <p class="text-sm font-medium text-muted mb-2">
              Total Aset
            </p>
            <span class="text-2xl font-bold text-highlighted tracking-tight">
              {{ formatCurrency(totalAssets) }}
            </span>
          </div>

          <!-- Total Liabilities -->
          <div class="p-6 rounded-xl border border-default bg-default relative overflow-hidden group">
            <UIcon
              name="i-lucide-credit-card"
              class="absolute -top-2 -right-2 size-20 text-white/5 group-hover:text-white/10 transition-opacity"
            />
            <p class="text-sm font-medium text-muted mb-2">
              Total Kewajiban
            </p>
            <span class="text-2xl font-bold text-highlighted tracking-tight">
              {{ formatCurrency(totalLiabilities) }}
            </span>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
            <UInput
              v-model="searchQuery"
              placeholder="Cari akun berdasarkan nama..."
              icon="i-lucide-search"
              class="w-full"
            />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="p-5 rounded-xl border border-default bg-default animate-pulse">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
              </div>
            </div>
            <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-4" />
            <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="fundSources.length === 0" class="text-center py-16">
          <div class="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-wallet" class="size-10 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-highlighted mb-2">
            Belum ada sumber dana
          </h3>
          <p class="text-muted mb-6 max-w-md mx-auto">
            Tambahkan rekening bank, e-wallet, atau kartu kredit untuk mulai melacak keuangan Anda
          </p>
          <UButton icon="i-lucide-plus" size="lg" @click="openNewModal">
            Tambah Sumber Dana Pertama
          </UButton>
        </div>

        <!-- Grouped Fund Sources -->
        <template v-else>
          <div v-for="[type, group] in groupedFundSources" :key="type" class="space-y-4">
            <!-- Group Header -->
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-highlighted flex items-center gap-2">
                <UIcon :name="group.icon" class="size-5 text-primary" />
                {{ group.label }}
              </h3>
              <span class="text-sm font-medium text-muted">
                {{ formatCurrency(group.total) }}
              </span>
            </div>

            <!-- Account Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="fund in group.funds"
                :key="fund.id"
                class="p-5 rounded-xl border border-default bg-default hover:border-primary/50 transition-all cursor-pointer group"
                @click="openEditModal(fund)"
              >
                <!-- Card Header -->
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="size-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      :class="getTypeBgColor(fund.type)"
                    >
                      <UIcon :name="getTypeIcon(fund.type)" class="size-5" />
                    </div>
                    <div>
                      <h4 class="text-highlighted font-medium text-sm">
                        {{ fund.name }}
                      </h4>
                      <p class="text-muted text-xs">
                        {{ getTypeLabel(fund.type) }}
                      </p>
                    </div>
                  </div>
                  <!-- Action Buttons -->
                  <div class="flex items-center gap-1">
                    <UButton
                      icon="i-lucide-pencil"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      class="opacity-0 group-hover:opacity-100 transition-opacity"
                      @click.stop="openEditModal(fund)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      class="opacity-0 group-hover:opacity-100 transition-opacity"
                      @click.stop="handleDelete(fund.id)"
                    />
                  </div>
                </div>

                <!-- Balance -->
                <div class="mb-4">
                  <p class="text-muted text-xs mb-1">
                    Saldo
                  </p>
                  <p class="text-2xl font-bold text-highlighted tracking-tight">
                    {{ formatCurrency(fund.balance) }}
                  </p>
                </div>

                <!-- Footer -->
                <div class="pt-4 border-t border-default flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="size-2 rounded-full bg-success" />
                    <span class="text-muted text-xs">
                      {{ formatLastUpdated(fund.updated_at || fund.created_at) }}
                    </span>
                  </div>
                  <span class="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                    Aktif
                  </span>
                </div>
              </div>

              <!-- Add New Card (for first group only) -->
              <button
                v-if="type === groupedFundSources[0]?.[0]"
                class="p-5 rounded-xl border border-dashed border-default hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group flex flex-col items-center justify-center gap-3 min-h-[200px]"
                @click="openNewModal"
              >
                <div
                  class="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                >
                  <UIcon name="i-lucide-plus" class="size-6 text-primary" />
                </div>
                <div class="text-center">
                  <p class="text-highlighted font-medium text-sm">
                    Tambah Akun Baru
                  </p>
                  <p class="text-muted text-xs mt-1">
                    Bank, e-wallet, atau kartu kredit
                  </p>
                </div>
              </button>
            </div>
          </div>

          <!-- Add button when no groups match search -->
          <div v-if="groupedFundSources.length === 0 && searchQuery" class="text-center py-12">
            <UIcon name="i-lucide-search-x" class="size-12 text-muted mx-auto mb-3" />
            <p class="text-muted">
              Tidak ada akun yang cocok dengan "{{ searchQuery }}"
            </p>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Add/Edit Modal -->
  <UModal v-model:open="isModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ isEditing ? 'Edit Sumber Dana' : 'Tambah Sumber Dana' }}
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
          <UFormField label="Nama" required>
            <UInput v-model="formData.name" placeholder="Contoh: Bank BCA, GoPay, dll" class="w-full" />
          </UFormField>

          <UFormField label="Tipe" required>
            <USelectMenu
              v-model="formData.type"
              :items="fundTypes"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Saldo" required>
            <CurrencyInput v-model="formData.balance" placeholder="0" />
          </UFormField>

          <UFormField label="Deskripsi">
            <UTextarea v-model="formData.description" placeholder="Deskripsi tambahan (opsional)" class="w-full" />
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
              {{ isEditing ? 'Simpan Perubahan' : 'Tambah' }}
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>
