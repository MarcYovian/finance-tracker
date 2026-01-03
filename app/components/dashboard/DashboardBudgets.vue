<script setup lang="ts">
import type { Budget } from '~/types'

const supabase = useSupabaseClient()

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

interface BudgetWithProgress extends Budget {
  spent: number
  percentage: number
  status: 'on_track' | 'near_limit' | 'over_budget'
}

const { data: budgets, pending } = await useAsyncData<BudgetWithProgress[]>('dashboard-budgets', async () => {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
            *,
            budget_items(
                spent_amount,
                planned_amount,
                category:categories(name, icon)
            )
        `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  if (error) {
    console.error('Failed to fetch budgets:', error)
    return []
  }

  return (data || []).map((budget: Budget) => {
    const totalSpent = budget.budget_items?.reduce((sum, item) => sum + (item.spent_amount || 0), 0) || 0
    const percentage = budget.total_limit > 0 ? Math.round((totalSpent / budget.total_limit) * 100) : 0

    let status: 'on_track' | 'near_limit' | 'over_budget' = 'on_track'
    if (percentage >= 100) {
      status = 'over_budget'
    } else if (percentage >= 80) {
      status = 'near_limit'
    }

    return {
      ...budget,
      spent: totalSpent,
      percentage: Math.min(percentage, 100),
      status
    }
  })
}, {
  default: () => []
})

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'on_track':
      return { label: 'Aman', color: 'text-success', bgColor: 'bg-success', icon: 'i-lucide-check' }
    case 'near_limit':
      return { label: 'Hampir Limit', color: 'text-warning', bgColor: 'bg-warning', icon: 'i-lucide-alert-triangle' }
    case 'over_budget':
      return { label: 'Melebihi Budget', color: 'text-error', bgColor: 'bg-error', icon: 'i-lucide-x' }
    default:
      return { label: 'Aman', color: 'text-success', bgColor: 'bg-success', icon: 'i-lucide-check' }
  }
}

const getCategoryIcon = (budget: BudgetWithProgress) => {
  // Get icon from first budget item's category
  const icon = budget.budget_items?.[0]?.category?.icon
  return icon || 'i-lucide-wallet'
}
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-base font-semibold text-highlighted">
            Budget Bulanan
          </h3>
          <p class="text-xs text-muted">
            Tracking pengeluaran
          </p>
        </div>
        <UButton
          to="/budgets"
          icon="i-lucide-settings-2"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </div>
    </template>

    <div v-if="pending" class="flex-1 space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse space-y-2">
        <div class="flex justify-between">
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
        </div>
        <div class="h-2 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>

    <div v-else-if="!budgets || budgets.length === 0" class="flex-1 flex flex-col items-center justify-center py-6">
      <UIcon name="i-lucide-pie-chart" class="size-12 text-muted mb-3" />
      <p class="text-muted text-sm mb-3">
        Belum ada budget aktif
      </p>
      <UButton
        to="/budgets"
        variant="soft"
        size="sm"
        icon="i-lucide-plus"
      >
        Buat Budget
      </UButton>
    </div>

    <div v-else class="flex-1 flex flex-col gap-5">
      <div v-for="budget in budgets" :key="budget.id" class="flex flex-col gap-2">
        <div class="flex justify-between items-end">
          <div class="flex items-center gap-2">
            <div
              class="size-8 rounded flex items-center justify-center"
              :class="getStatusConfig(budget.status).color"
              :style="{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }"
            >
              <UIcon :name="getCategoryIcon(budget)" class="size-4" />
            </div>
            <span class="font-medium text-sm text-highlighted">{{ budget.name }}</span>
          </div>
          <span class="text-sm font-semibold" :class="budget.status === 'over_budget' ? 'text-error' : 'text-highlighted'">
            {{ formatCurrency(budget.spent) }}
            <span class="text-xs font-normal text-muted">/ {{ formatCurrency(budget.total_limit) }}</span>
          </span>
        </div>

        <div class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="getStatusConfig(budget.status).bgColor"
            :style="{ width: `${budget.percentage}%` }"
          />
        </div>

        <div class="flex justify-between items-center text-xs">
          <span :class="getStatusConfig(budget.status).color" class="font-medium">
            {{ getStatusConfig(budget.status).label }}
          </span>
          <span class="text-muted">
            {{ budget.status === 'over_budget' ? '-' : '' }}{{ formatCurrency(Math.abs(budget.total_limit - budget.spent)) }}
            {{ budget.status === 'over_budget' ? 'over' : 'tersisa' }}
          </span>
        </div>
      </div>

      <UButton
        to="/budgets"
        variant="outline"
        color="neutral"
        class="mt-auto"
        block
      >
        <UIcon name="i-lucide-plus" class="size-4 mr-2" />
        Lihat Semua Budget
      </UButton>
    </div>
  </UCard>
</template>
