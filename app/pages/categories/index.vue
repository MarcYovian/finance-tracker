<script setup lang="ts">
import type { Category, CategoryCreate } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

// Redirect to login if not authenticated
watch(user, (newUser) => {
  if (!newUser) {
    router.push('/auth/login')
  }
}, { immediate: true })

const { incomeCategories, expenseCategories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories()

// Tab state
const activeTab = ref<'income' | 'expense'>('expense')

// Expanded state for collapsible
const expandedCategories = ref<Set<string>>(new Set())

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<CategoryCreate>({
  name: '',
  type: 'expense',
  parent_id: null,
  color: '#6366f1',
  icon: 'i-lucide-tag',
  description: '',
  sort_order: null
})

// Category stats
interface CategoryStats {
  [key: string]: {
    total: number
    count: number
  }
}
const categoryStats = ref<CategoryStats>({})

// Fetch data on mount
onMounted(async () => {
  await fetchCategories()
  await fetchCategoryStats()
})

// Fetch category stats (total amount and count per category)
const fetchCategoryStats = async () => {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .gte('transaction_date', startOfMonth.toISOString())
    .not('category_id', 'is', null)

  if (error) {
    console.error('Failed to fetch category stats:', error)
    return
  }

  const stats: CategoryStats = {}
  data?.forEach((tx: { category_id: string | null, amount: number }) => {
    if (tx.category_id) {
      if (!stats[tx.category_id]) {
        stats[tx.category_id] = { total: 0, count: 0 }
      }
      stats[tx.category_id]!.total += tx.amount
      stats[tx.category_id]!.count += 1
    }
  })

  categoryStats.value = stats
}

const displayedCategories = computed(() => {
  return activeTab.value === 'income' ? incomeCategories.value : expenseCategories.value
})

const parentCategories = computed(() => {
  return displayedCategories.value
    .filter(c => !c.parent_id)
    .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
})

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]

const iconOptions = [
  { label: 'Tag', value: 'i-lucide-tag' },
  { label: 'Makanan', value: 'i-lucide-utensils' },
  { label: 'Belanja', value: 'i-lucide-shopping-bag' },
  { label: 'Transport', value: 'i-lucide-car' },
  { label: 'Rumah', value: 'i-lucide-home' },
  { label: 'Listrik', value: 'i-lucide-zap' },
  { label: 'Hiburan', value: 'i-lucide-gamepad-2' },
  { label: 'Kesehatan', value: 'i-lucide-heart-pulse' },
  { label: 'Pendidikan', value: 'i-lucide-graduation-cap' },
  { label: 'Gaji', value: 'i-lucide-briefcase' },
  { label: 'Investasi', value: 'i-lucide-trending-up' },
  { label: 'Hadiah', value: 'i-lucide-gift' },
  { label: 'Kopi', value: 'i-lucide-coffee' },
  { label: 'Wifi', value: 'i-lucide-wifi' },
  { label: 'Fuel', value: 'i-lucide-fuel' },
  { label: 'Lainnya', value: 'i-lucide-more-horizontal' }
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const toggleExpand = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

const isExpanded = (categoryId: string) => {
  return expandedCategories.value.has(categoryId)
}

const getChildCategories = (parentId: string) => {
  return displayedCategories.value
    .filter(c => c.parent_id === parentId)
    .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
}

const getCategoryTotal = (category: Category): number => {
  // Get stats for this category
  let total = categoryStats.value[category.id]?.total || 0

  // Also add children totals
  const children = getChildCategories(category.id)
  children.forEach((child) => {
    total += categoryStats.value[child.id]?.total || 0
  })

  return total
}

const getCategoryCount = (category: Category): number => {
  let count = categoryStats.value[category.id]?.count || 0

  const children = getChildCategories(category.id)
  children.forEach((child) => {
    count += categoryStats.value[child.id]?.count || 0
  })

  return count
}

const openNewModal = (parentId: string | null = null) => {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    name: '',
    type: activeTab.value,
    parent_id: parentId,
    color: '#6366f1',
    icon: 'i-lucide-tag',
    description: '',
    sort_order: null
  }
  isModalOpen.value = true
}

const openEditModal = (category: Category) => {
  isEditing.value = true
  editingId.value = category.id
  formData.value = {
    name: category.name,
    type: category.type,
    parent_id: category.parent_id || null,
    color: category.color || '#6366f1',
    icon: category.icon || 'i-lucide-tag',
    description: category.description || '',
    sort_order: category.sort_order || null
  }
  isModalOpen.value = true
}

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    toast.add({ title: 'Nama kategori harus diisi', color: 'error' })
    return
  }

  let result

  if (isEditing.value && editingId.value) {
    result = await updateCategory(editingId.value, formData.value)
    if (result) {
      toast.add({ title: 'Kategori berhasil diperbarui', color: 'success' })
    }
  } else {
    result = await createCategory(formData.value)
    if (result) {
      toast.add({ title: 'Kategori berhasil ditambahkan', color: 'success' })
    }
  }

  if (result) {
    isModalOpen.value = false
    await fetchCategoryStats()
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}

const { confirm } = useConfirmModal()

const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: 'Hapus Kategori',
    message: 'Yakin ingin menghapus kategori ini?',
    confirmText: 'Hapus',
    confirmColor: 'error'
  })
  if (!confirmed) return

  const success = await deleteCategory(id)
  if (success) {
    toast.add({ title: 'Kategori berhasil dihapus', color: 'success' })
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}

// Expand all by default on first load
watch(parentCategories, (newParents) => {
  if (expandedCategories.value.size === 0 && newParents.length > 0) {
    newParents.forEach(p => expandedCategories.value.add(p.id))
  }
}, { immediate: true })
</script>

<template>
  <UDashboardPanel id="categories">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex flex-col">
            <h1 class="text-xl font-bold text-highlighted">
              Kategori
            </h1>
            <p class="text-xs text-muted hidden sm:block">
              Kelola kategori pemasukan dan pengeluaran
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" class="shadow-lg shadow-primary/20" @click="openNewModal()">
            <span class="hidden sm:inline">Tambah Kategori</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Type Toggle Cards -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          <!-- Expense Toggle -->
          <button
            class="p-3 sm:p-5 rounded-xl border-2 transition-all text-left"
            :class="activeTab === 'expense'
              ? 'border-error bg-error/5 ring-2 ring-error/20'
              : 'border-default bg-default hover:border-error/50'"
            @click="activeTab = 'expense'"
          >
            <div class="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div
                class="size-8 sm:size-10 rounded-lg flex items-center justify-center"
                :class="activeTab === 'expense' ? 'bg-error/20' : 'bg-error/10'"
              >
                <UIcon name="i-lucide-arrow-up-right" class="size-4 sm:size-5 text-error" />
              </div>
              <div>
                <h3 class="font-semibold text-highlighted text-sm sm:text-base">
                  Pengeluaran
                </h3>
                <p class="text-xs text-muted">
                  {{ expenseCategories.length }} kategori
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span
                class="text-sm sm:text-lg font-bold"
                :class="activeTab === 'expense' ? 'text-error' : 'text-highlighted'"
              >
                {{ formatCurrency(expenseCategories.reduce((sum, c) => sum + getCategoryTotal(c), 0)) }}
              </span>
              <span class="text-xs text-muted hidden sm:inline">bulan ini</span>
            </div>
          </button>

          <!-- Income Toggle -->
          <button
            class="p-3 sm:p-5 rounded-xl border-2 transition-all text-left"
            :class="activeTab === 'income'
              ? 'border-success bg-success/5 ring-2 ring-success/20'
              : 'border-default bg-default hover:border-success/50'"
            @click="activeTab = 'income'"
          >
            <div class="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div
                class="size-8 sm:size-10 rounded-lg flex items-center justify-center"
                :class="activeTab === 'income' ? 'bg-success/20' : 'bg-success/10'"
              >
                <UIcon name="i-lucide-arrow-down-left" class="size-4 sm:size-5 text-success" />
              </div>
              <div>
                <h3 class="font-semibold text-highlighted text-sm sm:text-base">
                  Pemasukan
                </h3>
                <p class="text-xs text-muted">
                  {{ incomeCategories.length }} kategori
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span
                class="text-sm sm:text-lg font-bold"
                :class="activeTab === 'income' ? 'text-success' : 'text-highlighted'"
              >
                {{ formatCurrency(incomeCategories.reduce((sum, c) => sum + getCategoryTotal(c), 0)) }}
              </span>
              <span class="text-xs text-muted hidden sm:inline">bulan ini</span>
            </div>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 4" :key="i" class="p-4 rounded-xl border border-default bg-default animate-pulse">
            <div class="flex items-center gap-4">
              <div class="size-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="displayedCategories.length === 0" class="text-center py-16">
          <div class="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-tags" class="size-10 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-highlighted mb-2">
            Belum ada kategori {{ activeTab === 'income' ? 'pemasukan' : 'pengeluaran' }}
          </h3>
          <p class="text-muted mb-6 max-w-md mx-auto">
            Buat kategori untuk mengorganisir transaksi Anda dengan lebih baik
          </p>
          <UButton icon="i-lucide-plus" size="lg" @click="openNewModal()">
            Tambah Kategori Pertama
          </UButton>
        </div>

        <!-- Categories List -->
        <div v-else class="space-y-3">
          <div
            v-for="parent in parentCategories"
            :key="parent.id"
            class="rounded-xl border border-default bg-default overflow-hidden"
          >
            <!-- Parent Category Header -->
            <div
              class="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              @click="toggleExpand(parent.id)"
            >
              <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <!-- Icon -->
                <div
                  class="size-10 sm:size-12 rounded-xl shrink-0 flex items-center justify-center"
                  :style="{ backgroundColor: `${parent.color || '#6366f1'}20` }"
                >
                  <UIcon
                    :name="parent.icon || 'i-lucide-tag'"
                    class="size-5 sm:size-6"
                    :style="{ color: parent.color || '#6366f1' }"
                  />
                </div>

                <!-- Info -->
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-highlighted text-sm sm:text-base truncate">
                    {{
                      parent.name }}
                  </h3>
                  <p class="text-xs text-muted">
                    {{ getCategoryCount(parent) }} transaksi
                    <span v-if="getChildCategories(parent.id).length > 0" class="hidden sm:inline">
                      • {{ getChildCategories(parent.id).length }} sub
                    </span>
                  </p>
                  <!-- Mobile: Show amount below info -->
                  <p class="text-sm font-bold text-highlighted sm:hidden mt-1">
                    {{ formatCurrency(getCategoryTotal(parent)) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 sm:gap-4">
                <!-- Total Amount (Desktop) -->
                <div class="text-right hidden sm:block">
                  <p class="font-bold text-highlighted text-lg">
                    {{ formatCurrency(getCategoryTotal(parent)) }}
                  </p>
                  <p class="text-xs text-muted">
                    bulan ini
                  </p>
                </div>

                <!-- Actions (Always visible on mobile, hover on desktop) -->
                <div
                  class="flex items-center gap-0.5 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <UButton
                    icon="i-lucide-plus"
                    color="primary"
                    variant="ghost"
                    size="xs"
                    title="Tambah sub-kategori"
                    @click.stop="openNewModal(parent.id)"
                  />
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click.stop="openEditModal(parent)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click.stop="handleDelete(parent.id)"
                  />
                </div>

                <!-- Expand Icon -->
                <UIcon
                  :name="isExpanded(parent.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="size-5 text-muted transition-transform shrink-0"
                />
              </div>
            </div>

            <!-- Children Categories -->
            <div
              v-if="isExpanded(parent.id) && getChildCategories(parent.id).length > 0"
              class="border-t border-default bg-gray-50/50 dark:bg-gray-900/30"
            >
              <div
                v-for="(child, index) in getChildCategories(parent.id)"
                :key="child.id"
                class="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group"
                :class="{ 'border-t border-default': index > 0 }"
              >
                <div class="flex items-center gap-2 sm:gap-3 pl-4 sm:pl-8 min-w-0 flex-1">
                  <!-- Connector line -->
                  <div
                    class="w-3 sm:w-4 border-l-2 border-b-2 h-3 sm:h-4 rounded-bl-lg shrink-0"
                    :style="{ borderColor: child.color || parent.color || '#6366f1' }"
                  />

                  <!-- Icon -->
                  <div
                    class="size-7 sm:size-8 rounded-lg shrink-0 flex items-center justify-center"
                    :style="{ backgroundColor: `${child.color || parent.color || '#6366f1'}15` }"
                  >
                    <UIcon
                      :name="child.icon || parent.icon || 'i-lucide-tag'"
                      class="size-3.5 sm:size-4"
                      :style="{ color: child.color || parent.color || '#6366f1' }"
                    />
                  </div>

                  <!-- Info -->
                  <div class="min-w-0 flex-1">
                    <span class="font-medium text-highlighted text-xs sm:text-sm truncate block">{{
                      child.name }}</span>
                    <div class="flex items-center gap-2">
                      <p class="text-xs text-muted">
                        {{ categoryStats[child.id]?.count || 0 }} transaksi
                      </p>
                      <!-- Mobile amount -->
                      <span class="text-xs font-semibold text-highlighted sm:hidden">
                        {{ formatCurrency(categoryStats[child.id]?.total || 0) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 sm:gap-4">
                  <!-- Amount (Desktop) -->
                  <span class="font-semibold text-highlighted text-sm hidden sm:block">
                    {{ formatCurrency(categoryStats[child.id]?.total || 0) }}
                  </span>

                  <!-- Actions (Always visible on mobile) -->
                  <div
                    class="flex items-center gap-0.5 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <UButton
                      icon="i-lucide-pencil"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      @click="openEditModal(child)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      @click="handleDelete(child.id)"
                    />
                  </div>
                </div>
              </div>

              <!-- Add Sub-category Button -->
              <button
                class="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 pl-10 sm:pl-16 text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors border-t border-default"
                @click="openNewModal(parent.id)"
              >
                <UIcon name="i-lucide-plus" class="size-4" />
                <span class="text-xs sm:text-sm">Tambah sub-kategori</span>
              </button>
            </div>
          </div>

          <!-- Add Parent Category Button -->
          <button
            class="w-full p-4 rounded-xl border border-dashed border-default hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted hover:text-primary"
            @click="openNewModal()"
          >
            <UIcon name="i-lucide-plus" class="size-5" />
            <span class="font-medium">Tambah Kategori Baru</span>
          </button>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Add/Edit Modal -->
  <UModal v-model:open="isModalOpen">
    <template #content>
      <UCard class="max-h-[90vh] overflow-y-auto">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ isEditing ? 'Edit Kategori' : 'Tambah Kategori' }}
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
            <UInput v-model="formData.name" placeholder="Nama kategori" class="w-full" />
          </UFormField>

          <UFormField label="Tipe" required>
            <USelectMenu
              v-model="formData.type"
              :items="[
                { label: 'Pengeluaran', value: 'expense' },
                { label: 'Pemasukan', value: 'income' }
              ]"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Kategori Induk">
            <USelectMenu
              v-model="formData.parent_id"
              :items="[
                { label: 'Tidak ada (Kategori Utama)', value: null },
                ...parentCategories.filter(c => c.id !== editingId).map(c => ({ label: c.name, value: c.id }))
              ]"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Warna">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in colorOptions"
                :key="color"
                type="button"
                class="w-8 h-8 rounded-full border-2 transition-all"
                :class="formData.color === color ? 'border-primary scale-110' : 'border-transparent'"
                :style="{ backgroundColor: color }"
                @click="formData.color = color"
              />
            </div>
          </UFormField>

          <UFormField label="Icon">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="icon in iconOptions"
                :key="icon.value"
                type="button"
                class="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all"
                :class="formData.icon === icon.value ? 'border-primary bg-primary/10' : 'border-default bg-default hover:bg-gray-100 dark:hover:bg-gray-800'"
                :title="icon.label"
                @click="formData.icon = icon.value"
              >
                <UIcon
                  :name="icon.value"
                  class="size-5"
                  :class="formData.icon === icon.value ? 'text-primary' : 'text-muted'"
                />
              </button>
            </div>
          </UFormField>

          <UFormField label="Urutan (Sort Order)">
            <UInput
              v-model.number="formData.sort_order"
              type="number"
              placeholder="0"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Deskripsi">
            <UTextarea
              v-model="formData.description"
              placeholder="Deskripsi kategori (opsional)"
              class="w-full"
            />
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
