<script setup lang="ts">
import type { DashboardSummary, Range } from '~/types'

const props = defineProps<{
  range: Range
}>()

const supabase = useSupabaseClient()

// Expose refresh function early (will be assigned after async data loads)
const refreshFn = ref<(() => Promise<void>) | null>(null)
defineExpose({ refresh: () => refreshFn.value?.() })

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const { data: summary, refresh } = await useAsyncData<DashboardSummary>('dashboard-summary', async () => {
  const { data, error } = await supabase.rpc('get_dashboard_summary')

  if (error) {
    console.error('Failed to fetch dashboard summary:', error)
    return {
      total_balance: 0,
      total_income: 0,
      total_expense: 0,
      net_flow: 0,
      active_budgets_count: 0,
      active_goals_count: 0,
      fund_sources_count: 0,
      income_change: 0,
      expense_change: 0
    }
  }

  return data?.[0] || {
    total_balance: 0,
    total_income: 0,
    total_expense: 0,
    net_flow: 0,
    active_budgets_count: 0,
    active_goals_count: 0,
    fund_sources_count: 0,
    income_change: 0,
    expense_change: 0
  }
}, {
  watch: [() => props.range],
  default: () => ({
    total_balance: 0,
    total_income: 0,
    total_expense: 0,
    net_flow: 0,
    active_budgets_count: 0,
    active_goals_count: 0,
    fund_sources_count: 0,
    income_change: 0,
    expense_change: 0
  })
})

// Assign refresh function
refreshFn.value = refresh

const stats = computed(() => [
  {
    title: 'Total Saldo',
    value: formatCurrency(summary.value?.total_balance || 0),
    icon: 'i-lucide-wallet',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    change: summary.value?.net_flow || 0,
    changePercent: 12.5, // TODO: Calculate from historical data
    changeLabel: 'vs bulan lalu',
    to: '/fund-sources'
  },
  {
    title: 'Pemasukan Bulan Ini',
    value: formatCurrency(summary.value?.total_income || 0),
    icon: 'i-lucide-trending-up',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    change: summary.value?.income_change || 0,
    changePercent: 5.2, // TODO: Calculate from historical data
    changeLabel: 'vs bulan lalu',
    to: '/transactions?type=income'
  },
  {
    title: 'Pengeluaran Bulan Ini',
    value: formatCurrency(summary.value?.total_expense || 0),
    icon: 'i-lucide-credit-card',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    change: summary.value?.expense_change || 0,
    changePercent: -2.1, // Negative = good for expenses
    changeLabel: 'vs bulan lalu',
    to: '/transactions?type=expense'
  }
])
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
    <NuxtLink
      v-for="(stat, index) in stats"
      :key="index"
      :to="stat.to"
      class="p-6 rounded-xl border border-default bg-default shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
    >
      <div class="flex justify-between items-start mb-4">
        <div class="flex flex-col gap-1">
          <p class="text-sm font-medium text-muted">{{ stat.title }}</p>
          <h3 class="text-2xl lg:text-3xl font-bold text-highlighted tracking-tight">
            {{ stat.value }}
          </h3>
        </div>
        <div class="p-2.5 rounded-xl" :class="stat.iconBg">
          <UIcon :name="stat.icon" class="size-6" :class="stat.iconColor" />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="flex items-center text-xs font-semibold px-2 py-0.5 rounded"
          :class="[
            stat.changePercent >= 0
              ? 'text-success bg-success/10'
              : 'text-error bg-error/10'
          ]"
        >
          <UIcon
            :name="stat.changePercent >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="size-3.5 mr-0.5"
          />
          {{ Math.abs(stat.changePercent) }}%
        </span>
        <span class="text-xs text-muted">{{ stat.changeLabel }}</span>
      </div>
    </NuxtLink>
  </div>
</template>
