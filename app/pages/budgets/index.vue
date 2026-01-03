<script setup lang="ts">
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Budget, BudgetCreate, BudgetItemCreate, BudgetPeriod } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
  if (!newUser) {
    router.push('/auth/login')
  }
}, { immediate: true })

const { budgets, loading, error, fetchBudgets, createBudget, updateBudget, deleteBudget } = useBudgets()
const { expenseCategories, fetchCategories } = useCategories()

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<BudgetCreate>({
  name: '',
  period: 'monthly',
  start_date: format(new Date(), 'yyyy-MM-01'),
  end_date: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
  total_limit: 0,
  alert_threshold: 80,
  description: ''
})
const budgetItems = ref<BudgetItemCreate[]>([])

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchBudgets(),
    fetchCategories()
  ])
})

const periodOptions: { label: string, value: BudgetPeriod }[] = [
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Kuartalan', value: 'quarterly' },
  { label: 'Tahunan', value: 'yearly' }
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function _formatDate(dateString: string) {
  return format(new Date(dateString), 'd MMM yyyy', { locale: idLocale })
}

function getCurrentMonth() {
  return format(new Date(), 'MMMM yyyy', { locale: idLocale })
}

const getPeriodLabel = (period: BudgetPeriod) => {
  return periodOptions.find(p => p.value === period)?.label || period
}

const getBudgetProgress = (budget: Budget) => {
  if (!budget.budget_items || budget.budget_items.length === 0) return 0
  const totalSpent = budget.budget_items.reduce((sum, item) => sum + item.spent_amount, 0)
  return Math.round((totalSpent / budget.total_limit) * 100)
}

const getTotalSpent = (budget: Budget) => {
  if (!budget.budget_items || budget.budget_items.length === 0) return 0
  return budget.budget_items.reduce((sum, item) => sum + item.spent_amount, 0)
}

const getRemaining = (budget: Budget) => {
  return budget.total_limit - getTotalSpent(budget)
}

const getProgressColor = (progress: number) => {
  if (progress >= 100) return 'bg-error'
  if (progress >= 80) return 'bg-warning'
  return 'bg-success'
}

const getStatusInfo = (progress: number, remaining: number) => {
  if (progress >= 100) {
    return {
      badge: 'bg-error/10 text-error',
      badgeText: `${progress}% USED`,
      remainingClass: 'text-error font-bold',
      remainingText: `${formatCurrency(Math.abs(remaining))} over`,
      borderClass: 'border-error/30 bg-error/5 hover:border-error/50',
      showWarning: true
    }
  }
  if (progress >= 80) {
    return {
      badge: 'bg-warning/10 text-warning',
      badgeText: `${progress}% USED`,
      remainingClass: 'text-warning',
      remainingText: `${formatCurrency(remaining)} left`,
      borderClass: 'border-warning/30 hover:border-warning/50',
      showWarning: false
    }
  }
  return {
    badge: 'bg-success/10 text-success',
    badgeText: `${progress}% USED`,
    remainingClass: 'text-success',
    remainingText: `${formatCurrency(remaining)} left`,
    borderClass: 'border-default hover:border-primary/50',
    showWarning: false
  }
}

// Category icon mapping
const getCategoryIcon = (categoryName: string | undefined) => {
  if (!categoryName) return 'i-lucide-tag'
  const name = categoryName.toLowerCase()
  if (name.includes('makan') || name.includes('food') || name.includes('groceries')) return 'i-lucide-shopping-cart'
  if (name.includes('rumah') || name.includes('rent') || name.includes('utilities')) return 'i-lucide-home'
  if (name.includes('transport')) return 'i-lucide-car'
  if (name.includes('hiburan') || name.includes('entertainment')) return 'i-lucide-gamepad-2'
  if (name.includes('kesehatan') || name.includes('health')) return 'i-lucide-heart-pulse'
  if (name.includes('belanja') || name.includes('shopping')) return 'i-lucide-shopping-bag'
  if (name.includes('pendidikan') || name.includes('education')) return 'i-lucide-graduation-cap'
  if (name.includes('tagihan') || name.includes('bills')) return 'i-lucide-zap'
  return 'i-lucide-tag'
}

const getCategoryColor = (categoryName: string | undefined) => {
  if (!categoryName) return { bg: 'bg-primary/10', text: 'text-primary' }
  const name = categoryName.toLowerCase()
  if (name.includes('makan') || name.includes('food') || name.includes('groceries'))
    return { bg: 'bg-orange-100 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' }
  if (name.includes('rumah') || name.includes('rent') || name.includes('utilities'))
    return { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' }
  if (name.includes('transport'))
    return { bg: 'bg-teal-100 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' }
  if (name.includes('hiburan') || name.includes('entertainment'))
    return { bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' }
  if (name.includes('kesehatan') || name.includes('health'))
    return { bg: 'bg-red-100 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' }
  if (name.includes('belanja') || name.includes('shopping'))
    return { bg: 'bg-pink-100 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' }
  if (name.includes('pendidikan') || name.includes('education'))
    return { bg: 'bg-indigo-100 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' }
  if (name.includes('tagihan') || name.includes('bills'))
    return { bg: 'bg-yellow-100 dark:bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' }
  return { bg: 'bg-primary/10', text: 'text-primary' }
}

const openNewModal = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    name: '',
    period: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-01'),
    end_date: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
    total_limit: 0,
    alert_threshold: 80,
    description: ''
  }
  budgetItems.value = []
  isModalOpen.value = true
}

const openEditModal = (budget: Budget) => {
  isEditing.value = true
  editingId.value = budget.id
  formData.value = {
    name: budget.name,
    period: budget.period,
    start_date: budget.start_date,
    end_date: budget.end_date,
    total_limit: budget.total_limit,
    alert_threshold: budget.alert_threshold,
    description: budget.description || ''
  }
  // Load existing budget items
  budgetItems.value = budget.budget_items?.map(item => ({
    category_id: item.category_id,
    planned_amount: item.planned_amount
  })) || []
  isModalOpen.value = true
}

const addBudgetItem = () => {
  budgetItems.value.push({
    category_id: '',
    planned_amount: 0
  })
}

const removeBudgetItem = (index: number) => {
  budgetItems.value.splice(index, 1)
}

// Budget allocation tracking
const totalAllocated = computed(() => {
  return budgetItems.value.reduce((sum, item) => sum + (item.planned_amount || 0), 0)
})

const remainingBudget = computed(() => {
  return formData.value.total_limit - totalAllocated.value
})

const isOverBudget = computed(() => {
  return totalAllocated.value > formData.value.total_limit && formData.value.total_limit > 0
})

const allocationPercentage = computed(() => {
  if (formData.value.total_limit <= 0) return 0
  return Math.round((totalAllocated.value / formData.value.total_limit) * 100)
})

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    toast.add({ title: 'Nama budget harus diisi', color: 'error' })
    return
  }

  if (formData.value.total_limit <= 0) {
    toast.add({ title: 'Total limit harus lebih dari 0', color: 'error' })
    return
  }

  // Filter out empty budget items
  const validItems = budgetItems.value.filter(item => item.category_id && item.planned_amount > 0)

  let result
  if (isEditing.value && editingId.value) {
    result = await updateBudget(editingId.value, formData.value, validItems)
    if (result) {
      toast.add({ title: 'Budget berhasil diperbarui', color: 'success' })
    }
  } else {
    result = await createBudget(formData.value, validItems)
    if (result) {
      toast.add({ title: 'Budget berhasil dibuat', color: 'success' })
    }
  }

  if (result) {
    isModalOpen.value = false
    await fetchBudgets(true)
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}

const { confirm } = useConfirmModal()

const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: 'Hapus Budget',
    message: 'Yakin ingin menghapus budget ini?',
    confirmText: 'Hapus',
    confirmColor: 'error'
  })
  if (!confirmed) return

  const success = await deleteBudget(id)
  if (success) {
    toast.add({ title: 'Budget berhasil dihapus', color: 'success' })
  } else if (error.value) {
    toast.add({ title: error.value, color: 'error' })
  }
}

const activeBudgets = computed(() => budgets.value.filter(b => b.is_active))

// Stats computed values
const totalBudgeted = computed(() => {
  return activeBudgets.value.reduce((sum, b) => sum + b.total_limit, 0)
})

const totalSpent = computed(() => {
  return activeBudgets.value.reduce((sum, b) => sum + getTotalSpent(b), 0)
})

const leftToSpend = computed(() => {
  return totalBudgeted.value - totalSpent.value
})

const overallProgress = computed(() => {
  if (totalBudgeted.value === 0) return 0
  return Math.round((totalSpent.value / totalBudgeted.value) * 100)
})
</script>

<template>
  <UDashboardPanel id="budgets">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex flex-col">
            <h1 class="text-xl font-bold text-highlighted">
              Budget Bulanan
            </h1>
            <div class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-calendar" class="size-4" />
              <span class="text-xs">{{ getCurrentMonth() }}</span>
            </div>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" class="shadow-lg shadow-primary/20" @click="openNewModal">
            <span class="hidden sm:inline">Buat Budget</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Total Budgeted -->
          <div class="flex flex-col gap-1 rounded-xl border border-default bg-default p-5 shadow-sm">
            <p class="text-sm font-medium text-muted">
              Total Budget
            </p>
            <div class="flex items-end justify-between">
              <p class="text-xl sm:text-2xl font-bold tracking-tight text-highlighted">
                {{ formatCurrency(totalBudgeted) }}
              </p>
              <div class="text-xs font-medium text-muted">
                {{ activeBudgets.length }} budget aktif
              </div>
            </div>
          </div>

          <!-- Total Spent -->
          <div class="flex flex-col gap-1 rounded-xl border border-default bg-default p-5 shadow-sm">
            <p class="text-sm font-medium text-muted">
              Total Terpakai
            </p>
            <div class="flex items-end justify-between">
              <p class="text-xl sm:text-2xl font-bold tracking-tight text-highlighted">
                {{ formatCurrency(totalSpent) }}
              </p>
              <div
                class="flex items-center gap-1 text-xs font-medium"
                :class="overallProgress >= 80 ? 'text-error' : 'text-muted'"
              >
                <UIcon name="i-lucide-trending-up" class="size-3.5" />
                <span>{{ overallProgress }}% used</span>
              </div>
            </div>
          </div>

          <!-- Left to Spend (Highlighted) -->
          <div
            class="relative flex flex-col gap-1 rounded-xl border p-5 shadow-sm overflow-hidden group"
            :class="leftToSpend >= 0
              ? 'border-success/30 bg-success/5'
              : 'border-error/30 bg-error/5'"
          >
            <div
              class="absolute -right-4 -top-4 size-24 rounded-full blur-2xl transition-all"
              :class="leftToSpend >= 0 ? 'bg-success/10 group-hover:bg-success/20' : 'bg-error/10 group-hover:bg-error/20'"
            />
            <p class="text-sm font-medium text-muted">
              Sisa Budget
            </p>
            <div class="flex items-end justify-between relative z-10">
              <p class="text-xl sm:text-2xl font-bold tracking-tight text-highlighted">
                {{ formatCurrency(Math.abs(leftToSpend)) }}
              </p>
              <div
                class="flex items-center gap-1 text-xs font-medium"
                :class="leftToSpend >= 0 ? 'text-success' : 'text-error'"
              >
                <UIcon
                  :name="leftToSpend >= 0 ? 'i-lucide-trending-down' : 'i-lucide-alert-triangle'"
                  class="size-3.5"
                />
                <span>{{ leftToSpend >= 0 ? 'On Track' : 'Over Budget' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 6" :key="i" class="p-5 rounded-xl border border-default bg-default animate-pulse">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
              </div>
            </div>
            <div class="space-y-3">
              <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
              <div class="h-2 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="activeBudgets.length === 0" class="text-center py-16">
          <div class="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-pie-chart" class="size-10 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-highlighted mb-2">
            Belum ada budget
          </h3>
          <p class="text-muted mb-6 max-w-md mx-auto">
            Buat budget untuk mengontrol dan memantau pengeluaran bulanan Anda
          </p>
          <UButton icon="i-lucide-plus" size="lg" @click="openNewModal">
            Buat Budget Pertama
          </UButton>
        </div>

        <!-- Budget Categories Grid -->
        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-highlighted">
              Kategori Budget
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Budget Cards -->
            <div
              v-for="budget in activeBudgets"
              :key="budget.id"
              class="group flex flex-col justify-between rounded-xl border p-5 transition-all hover:shadow-md"
              :class="getStatusInfo(getBudgetProgress(budget), getRemaining(budget)).borderClass"
            >
              <!-- Header -->
              <div class="mb-4 flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-10 items-center justify-center rounded-lg"
                    :class="getCategoryColor(budget.name).bg"
                  >
                    <UIcon
                      :name="getCategoryIcon(budget.name)"
                      class="size-5"
                      :class="getCategoryColor(budget.name).text"
                    />
                  </div>
                  <div>
                    <p class="font-bold text-highlighted">
                      {{ budget.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ getPeriodLabel(budget.period) }}
                    </p>
                  </div>
                </div>

                <!-- Warning or Actions -->
                <div class="flex items-center gap-1">
                  <div
                    v-if="getStatusInfo(getBudgetProgress(budget), getRemaining(budget)).showWarning"
                    class="flex items-center justify-center rounded-full bg-error/10 p-1 text-error"
                    title="Over Budget"
                  >
                    <UIcon name="i-lucide-alert-triangle" class="size-4" />
                  </div>
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="openEditModal(budget)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="handleDelete(budget.id)"
                  />
                </div>
              </div>

              <!-- Progress Section -->
              <div class="flex flex-col gap-3">
                <div class="flex justify-between text-sm">
                  <span class="font-medium text-highlighted">
                    {{ formatCurrency(getTotalSpent(budget)) }}
                    <span class="text-xs font-normal text-muted">spent</span>
                  </span>
                  <span class="font-medium text-muted">
                    of {{ formatCurrency(budget.total_limit) }}
                  </span>
                </div>

                <!-- Progress Bar -->
                <div
                  class="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
                >
                  <div
                    class="absolute h-full rounded-full transition-all duration-500 ease-out"
                    :class="getProgressColor(getBudgetProgress(budget))"
                    :style="{ width: `${Math.min(getBudgetProgress(budget), 100)}%` }"
                  />
                </div>

                <!-- Status -->
                <div class="flex items-center justify-between">
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    :class="getStatusInfo(getBudgetProgress(budget), getRemaining(budget)).badge"
                  >
                    {{ getStatusInfo(getBudgetProgress(budget), getRemaining(budget)).badgeText }}
                  </span>
                  <span
                    class="text-xs font-medium"
                    :class="getStatusInfo(getBudgetProgress(budget), getRemaining(budget)).remainingClass"
                  >
                    {{ getStatusInfo(getBudgetProgress(budget), getRemaining(budget)).remainingText
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Add New Budget Card -->
            <button
              class="flex flex-col items-center justify-center rounded-xl border border-dashed border-default bg-gray-50 dark:bg-transparent p-5 transition-all hover:border-primary/50 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer group min-h-[180px]"
              @click="openNewModal"
            >
              <div
                class="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 group-hover:bg-primary/20 transition-colors"
              >
                <UIcon name="i-lucide-plus" class="size-6 text-muted group-hover:text-primary" />
              </div>
              <p class="font-bold text-highlighted group-hover:text-primary transition-colors">
                Tambah Budget Baru
              </p>
              <p class="text-xs text-center text-muted mt-1">
                Buat budget untuk kategori pengeluaran baru
              </p>
            </button>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Create Budget Modal -->
  <UModal v-model:open="isModalOpen">
    <template #content>
      <UCard class="max-h-[90vh] overflow-y-auto">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ isEditing ? 'Edit Budget' : 'Buat Budget Baru' }}
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
          <UFormField label="Nama Budget" required>
            <UInput v-model="formData.name" placeholder="Contoh: Makanan & Minuman" class="w-full" />
          </UFormField>

          <UFormField label="Periode" required>
            <USelectMenu
              v-model="formData.period"
              :items="periodOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Tanggal Mulai" required>
              <UInput v-model="formData.start_date" type="date" class="w-full" />
            </UFormField>

            <UFormField label="Tanggal Selesai" required>
              <UInput v-model="formData.end_date" type="date" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Total Limit" required>
            <CurrencyInput v-model="formData.total_limit" placeholder="0" />
          </UFormField>

          <UFormField label="Alert Threshold (%)">
            <UInput
              v-model.number="formData.alert_threshold"
              type="number"
              min="1"
              max="100"
              class="w-full"
            />
          </UFormField>

          <!-- Budget Items -->
          <div class="border-t border-default pt-4">
            <div class="flex items-center justify-between mb-3">
              <label class="font-medium">Item Budget per Kategori</label>
              <UButton
                size="xs"
                variant="soft"
                icon="i-lucide-plus"
                @click="addBudgetItem"
              >
                Tambah Item
              </UButton>
            </div>

            <!-- Allocation Summary -->
            <div
              v-if="formData.total_limit > 0"
              class="mb-4 p-3 rounded-lg"
              :class="isOverBudget ? 'bg-error/10 border border-error/30' : 'bg-primary/5 border border-primary/20'"
            >
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-muted">Limit Budget:</span>
                <span class="font-semibold text-highlighted">{{ formatCurrency(formData.total_limit) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-muted">Total Alokasi:</span>
                <span
                  class="font-semibold"
                  :class="isOverBudget ? 'text-error' : 'text-highlighted'"
                >
                  {{ formatCurrency(totalAllocated) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Sisa:</span>
                <span
                  class="font-bold"
                  :class="isOverBudget ? 'text-error' : 'text-success'"
                >
                  {{ isOverBudget ? '-' : '' }}{{ formatCurrency(Math.abs(remainingBudget)) }}
                  <span class="text-xs font-normal">({{ allocationPercentage }}%)</span>
                </span>
              </div>
              <!-- Progress bar -->
              <div class="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="isOverBudget ? 'bg-error' : allocationPercentage >= 80 ? 'bg-warning' : 'bg-success'"
                  :style="{ width: `${Math.min(allocationPercentage, 100)}%` }"
                />
              </div>
              <!-- Warning -->
              <div v-if="isOverBudget" class="flex items-center gap-2 mt-2 text-xs text-error">
                <UIcon name="i-lucide-alert-triangle" class="size-4" />
                <span>Total alokasi melebihi limit budget</span>
              </div>
            </div>

            <div v-if="budgetItems.length === 0" class="text-sm text-muted text-center py-4">
              Belum ada item budget. Klik "Tambah Item" untuk menambahkan.
            </div>

            <div v-else class="space-y-3">
              <div v-for="(item, index) in budgetItems" :key="index" class="flex items-center gap-2">
                <USelectMenu
                  v-model="item.category_id"
                  :items="expenseCategories.map(c => ({ label: c.name, value: c.id }))"
                  value-key="value"
                  placeholder="Pilih kategori"
                  class="flex-1"
                />
                <CurrencyInput v-model="item.planned_amount" placeholder="Jumlah" />
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="removeBudgetItem(index)"
                />
              </div>
            </div>
          </div>

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
              {{ isEditing ? 'Perbarui' : 'Buat Budget' }}
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>
