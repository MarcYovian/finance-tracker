<script setup lang="ts">
import type { Range } from '~/types'

const props = defineProps<{
  range: Range
}>()

const supabase = useSupabaseClient()

interface CategorySpending {
  category_id: string
  category_name: string
  category_color: string
  total: number
  percentage: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const { data: spending, pending } = await useAsyncData<CategorySpending[]>('spending-by-category', async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
            amount,
            category:categories(id, name, color)
        `)
    .eq('type', 'expense')
    .gte('transaction_date', props.range.start.toISOString())
    .lte('transaction_date', props.range.end.toISOString())

  if (error) {
    console.error('Failed to fetch spending data:', error)
    return []
  }

  // Aggregate by category
  const categoryTotals: Record<string, { name: string, color: string, total: number }> = {}
  let grandTotal = 0

  data?.forEach((t: { amount: number, category: { id: string, name: string, color: string } | null }) => {
    if (t.category) {
      const catId = t.category.id
      if (!categoryTotals[catId]) {
        categoryTotals[catId] = {
          name: t.category.name,
          color: t.category.color || '#6366f1',
          total: 0
        }
      }
      categoryTotals[catId].total += t.amount
      grandTotal += t.amount
    }
  })

  // Convert to array and calculate percentages
  const result = Object.entries(categoryTotals)
    .map(([id, cat]) => ({
      category_id: id,
      category_name: cat.name,
      category_color: cat.color,
      total: cat.total,
      percentage: grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5) // Top 5 categories

  return result
}, {
  watch: [() => props.range],
  default: () => []
})

const totalExpense = computed(() =>
  spending.value?.reduce((sum, cat) => sum + cat.total, 0) || 0
)

// Generate conic gradient for donut chart
const conicGradient = computed(() => {
  if (!spending.value || spending.value.length === 0) {
    return 'conic-gradient(#e2e8f0 0% 100%)'
  }

  let currentPercent = 0
  const segments = spending.value.map((cat) => {
    const start = currentPercent
    currentPercent += cat.percentage
    return `${cat.category_color} ${start}% ${currentPercent}%`
  })

  // Fill remaining with gray if less than 100%
  if (currentPercent < 100) {
    segments.push(`#e2e8f0 ${currentPercent}% 100%`)
  }

  return `conic-gradient(${segments.join(', ')})`
})

// Default colors for categories that don't have colors
const defaultColors = ['#1773cf', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const getColor = (cat: CategorySpending, index: number) => {
  return cat.category_color || defaultColors[index % defaultColors.length]
}
</script>

<template>
  <UCard class="h-full">
    <template #header>
      <h3 class="text-base font-semibold text-highlighted">
        Pengeluaran per Kategori
      </h3>
    </template>

    <div v-if="pending" class="flex items-center justify-center h-64">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
    </div>

    <div v-else-if="!spending || spending.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-pie-chart" class="size-12 text-muted mx-auto mb-3" />
      <p class="text-muted">
        Belum ada data pengeluaran
      </p>
    </div>

    <div v-else>
      <!-- Donut Chart -->
      <div class="flex items-center justify-center mb-6 relative">
        <div class="size-40 rounded-full" :style="{ background: conicGradient }">
          <div
            class="size-24 bg-default rounded-full absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center shadow-inner"
          >
            <span class="text-lg font-bold text-highlighted">{{ formatCurrency(totalExpense).replace('Rp', 'Rp ') }}</span>
            <span class="text-xs text-muted">Total</span>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-col gap-3">
        <div
          v-for="(cat, index) in spending"
          :key="cat.category_id"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full" :style="{ backgroundColor: getColor(cat, index) }" />
            <span class="text-sm text-muted">{{ cat.category_name }}</span>
          </div>
          <span class="text-sm font-semibold text-highlighted">{{ cat.percentage }}%</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
