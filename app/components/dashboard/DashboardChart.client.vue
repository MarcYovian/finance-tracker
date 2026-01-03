<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const supabase = useSupabaseClient()

const props = defineProps<{
  period: Period
  range: Range
}>()

type DataRecord = {
  date: Date
  income: number
  expense: number
}

const { width } = useElementSize(cardRef)

const data = ref<DataRecord[]>([])
const loading = ref(false)

const fetchData = async () => {
  loading.value = true

  try {
    const dates = ({
      daily: eachDayOfInterval,
      weekly: eachWeekOfInterval,
      monthly: eachMonthOfInterval
    } as Record<Period, typeof eachDayOfInterval>)[props.period](props.range)

    // Fetch transactions for the period
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, transaction_date')
      .gte('transaction_date', props.range.start.toISOString())
      .lte('transaction_date', props.range.end.toISOString())

    if (error) throw error

    // Aggregate by date
    const aggregated: Record<string, { income: number, expense: number }> = {}

    dates.forEach((date) => {
      const key = format(date, 'yyyy-MM-dd')
      aggregated[key] = { income: 0, expense: 0 }
    })

    transactions?.forEach((t) => {
      const txDate = new Date(t.transaction_date)
      let key: string

      if (props.period === 'monthly') {
        key = format(txDate, 'yyyy-MM-01')
      } else if (props.period === 'weekly') {
        // Find the start of the week
        const weekStart = dates.find(d => d <= txDate && new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000) > txDate)
        key = weekStart ? format(weekStart, 'yyyy-MM-dd') : format(txDate, 'yyyy-MM-dd')
      } else {
        key = format(txDate, 'yyyy-MM-dd')
      }

      if (!aggregated[key]) {
        aggregated[key] = { income: 0, expense: 0 }
      }

      if (t.type === 'income') {
        const agg = aggregated[key]
        if (agg) agg.income += t.amount
      } else if (t.type === 'expense') {
        const agg = aggregated[key]
        if (agg) agg.expense += t.amount
      }
    })

    data.value = dates.map((date) => {
      const key = format(date, 'yyyy-MM-dd')
      return {
        date,
        income: aggregated[key]?.income || 0,
        expense: aggregated[key]?.expense || 0
      }
    })
  } catch (e) {
    console.error('Failed to fetch chart data:', e)
    // Generate empty data for the period
    const dates = ({
      daily: eachDayOfInterval,
      weekly: eachWeekOfInterval,
      monthly: eachMonthOfInterval
    } as Record<Period, typeof eachDayOfInterval>)[props.period](props.range)

    data.value = dates.map(date => ({ date, income: 0, expense: 0 }))
  } finally {
    loading.value = false
  }
}

watch([() => props.period, () => props.range], fetchData, { immediate: true })

const x = (_: DataRecord, i: number) => i
const yIncome = (d: DataRecord) => d.income
const yExpense = (d: DataRecord) => d.expense

const totalIncome = computed(() => data.value.reduce((acc, { income }) => acc + income, 0))
const totalExpense = computed(() => data.value.reduce((acc, { expense }) => acc + expense, 0))

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(value)

const formatDate = (date: Date): string => {
  return ({
    daily: format(date, 'd MMM'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyyy')
  })[props.period]
}

const xTicks = (i: number) => {
  const item = data.value[i]
  if (i === 0 || i === data.value.length - 1 || !item) {
    return ''
  }
  return formatDate(item.date)
}

const template = (d: DataRecord) =>
  `${formatDate(d.date)}<br/>Pemasukan: ${formatNumber(d.income)}<br/>Pengeluaran: ${formatNumber(d.expense)}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: 'px-0! pt-0! pb-3!' }">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Pemasukan vs Pengeluaran
          </p>
          <div class="flex items-center gap-6">
            <div>
              <span class="text-xs text-success">Pemasukan</span>
              <p class="text-xl text-highlighted font-semibold">
                {{ formatNumber(totalIncome) }}
              </p>
            </div>
            <div>
              <span class="text-xs text-error">Pengeluaran</span>
              <p class="text-xl text-highlighted font-semibold">
                {{ formatNumber(totalExpense) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="loading" class="h-96 flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
    </div>

    <VisXYContainer
      v-else
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisArea
        :x="x"
        :y="yIncome"
        color="var(--color-success-500)"
        :opacity="0.1"
      />
      <VisLine :x="x" :y="yIncome" color="var(--color-success-500)" />

      <VisArea
        :x="x"
        :y="yExpense"
        color="var(--color-error-500)"
        :opacity="0.1"
      />
      <VisLine :x="x" :y="yExpense" color="var(--color-error-500)" />

      <VisAxis type="x" :x="x" :tick-format="xTicks" />

      <VisCrosshair color="var(--ui-primary)" :template="template" />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
    --vis-crosshair-line-stroke-color: var(--ui-primary);
    --vis-crosshair-circle-stroke-color: var(--ui-bg);

    --vis-axis-grid-color: var(--ui-border);
    --vis-axis-tick-color: var(--ui-border);
    --vis-axis-tick-label-color: var(--ui-text-dimmed);

    --vis-tooltip-background-color: var(--ui-bg);
    --vis-tooltip-border-color: var(--ui-border);
    --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
