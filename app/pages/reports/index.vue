<script setup lang="ts">
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const user = useSupabaseUser()
const router = useRouter()
const supabase = useSupabaseClient()

// Redirect to login if not authenticated
watch(user, (newUser) => {
  if (!newUser) {
    router.push('/auth/login')
  }
}, { immediate: true })

// Date range state
type DateRangeOption = 'last30' | 'last90' | 'ytd' | 'lastYear' | 'all'
const selectedRange = ref<DateRangeOption>('last30')

const dateRangeOptions = [
  { label: '30 Hari Terakhir', value: 'last30' },
  { label: '90 Hari Terakhir', value: 'last90' },
  { label: 'Tahun Ini', value: 'ytd' },
  { label: 'Tahun Lalu', value: 'lastYear' },
  { label: 'Semua', value: 'all' }
]

const dateRange = computed(() => {
  const now = new Date()
  switch (selectedRange.value) {
    case 'last30':
      return { start: subDays(now, 30), end: now }
    case 'last90':
      return { start: subDays(now, 90), end: now }
    case 'ytd':
      return { start: startOfYear(now), end: now }
    case 'lastYear':
      return { start: startOfYear(subMonths(now, 12)), end: endOfMonth(subMonths(now, 1)) }
    case 'all':
    default:
      return { start: new Date('2020-01-01'), end: now }
  }
})

// Tab state
const activeTab = ref<'overview' | 'cashflow' | 'spending' | 'networth'>('overview')
const tabs = [
  { label: 'Overview', value: 'overview', icon: 'i-lucide-layout-dashboard' },
  { label: 'Cash Flow', value: 'cashflow', icon: 'i-lucide-arrow-left-right' },
  { label: 'Pengeluaran', value: 'spending', icon: 'i-lucide-shopping-cart' },
  { label: 'Net Worth', value: 'networth', icon: 'i-lucide-trending-up' }
]

// Fetch summary data
const loading = ref(true)
const summaryData = ref({
  totalIncome: 0,
  totalExpense: 0,
  netSavings: 0,
  savingsRate: 0,
  incomeChange: 0,
  expenseChange: 0
})

const categorySpending = ref<{ name: string, amount: number, color: string, percentage: number }[]>([])
const monthlyBreakdown = ref<{ month: string, monthKey: string, income: number, expense: number, savings: number, rate: number }[]>([])
const fundBalances = ref<{ name: string, type: string, balance: number, color: string }[]>([])

async function fetchReportData() {
  if (!user.value) return
  loading.value = true

  try {
    const startDate = format(dateRange.value.start, 'yyyy-MM-dd')
    const endDate = format(dateRange.value.end, 'yyyy-MM-dd')

    // Fetch transactions for the period
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, transaction_date, category:categories(name, color)')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false })

    if (error) throw error

    // Calculate totals
    let income = 0
    let expense = 0
    const categoryMap: Record<string, { amount: number, color: string }> = {}

    type TransactionRow = {
      type: string
      amount: number
      transaction_date: string
      category: { name: string, color: string | null } | null
    }

    transactions?.forEach((tx: TransactionRow) => {
      if (tx.type === 'income') {
        income += tx.amount
      } else if (tx.type === 'expense') {
        expense += tx.amount

        // Group by category
        const catName = tx.category?.name || 'Lainnya'
        const catColor = tx.category?.color || '#6366f1'
        if (!categoryMap[catName]) {
          categoryMap[catName] = { amount: 0, color: catColor }
        }
        categoryMap[catName].amount += tx.amount
      }
    })

    summaryData.value = {
      totalIncome: income,
      totalExpense: expense,
      netSavings: income - expense,
      savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
      incomeChange: 12, // TODO: Calculate from previous period
      expenseChange: 5 // TODO: Calculate from previous period
    }

    // Category spending
    const totalExpenseAmount = expense
    categorySpending.value = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color,
        percentage: totalExpenseAmount > 0 ? Math.round((data.amount / totalExpenseAmount) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)

    // Monthly breakdown
    await fetchMonthlyBreakdown()

    // Fund balances for net worth
    await fetchFundBalances()
  } catch (err) {
    console.error('Failed to fetch report data:', err)
  } finally {
    loading.value = false
  }
}

async function fetchMonthlyBreakdown() {
  if (!user.value) return

  const months: { month: string, monthKey: string, income: number, expense: number, savings: number, rate: number }[] = []
  const now = new Date()

  for (let i = 0; i < 6; i++) {
    const monthDate = subMonths(now, i)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)

    const { data } = await supabase
      .from('transactions')
      .select('type, amount')
      .gte('transaction_date', format(start, 'yyyy-MM-dd'))
      .lte('transaction_date', format(end, 'yyyy-MM-dd'))

    let income = 0
    let expense = 0

    type TransactionRow = { type: string, amount: number }
    data?.forEach((tx: TransactionRow) => {
      if (tx.type === 'income') income += tx.amount
      else if (tx.type === 'expense') expense += tx.amount
    })

    months.push({
      month: format(monthDate, 'MMMM yyyy', { locale: idLocale }),
      monthKey: format(monthDate, 'MMM', { locale: idLocale }),
      income,
      expense,
      savings: income - expense,
      rate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0
    })
  }

  monthlyBreakdown.value = months
}

async function fetchFundBalances() {
  if (!user.value) return

  const { data, error } = await supabase
    .from('fund_sources')
    .select('name, type, balance, color')
    .order('balance', { ascending: false })

  if (error) {
    console.error('Failed to fetch fund sources:', error)
    return
  }

  type FundRow = { name: string, type: string, balance: number, color: string | null }
  fundBalances.value = (data as FundRow[])?.map(f => ({
    name: f.name,
    type: f.type,
    balance: f.balance,
    color: f.color || '#6366f1'
  })) || []
}

// Watch for changes
watch([selectedRange, user], () => {
  fetchReportData()
}, { immediate: true })

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function exportCSV() {
  const headers = ['Bulan', 'Pemasukan', 'Pengeluaran', 'Tabungan', 'Rasio Tabungan']
  const rows = monthlyBreakdown.value.map(m =>
    [m.month, m.income, m.expense, m.savings, `${m.rate}%`].join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `laporan-keuangan-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Computed values for charts
const totalNetWorth = computed(() => {
  return fundBalances.value.reduce((sum, f) => sum + f.balance, 0)
})

const maxCashFlow = computed(() => {
  const maxIncome = Math.max(...monthlyBreakdown.value.map(m => m.income))
  const maxExpense = Math.max(...monthlyBreakdown.value.map(m => m.expense))
  return Math.max(maxIncome, maxExpense, 1)
})

// Category colors for chart
const categoryColors = [
  'bg-primary',
  'bg-success',
  'bg-purple-500',
  'bg-orange-400',
  'bg-error',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-yellow-500'
]

const fundTypeColors: Record<string, string> = {
  bank: 'bg-blue-500',
  e_wallet: 'bg-purple-500',
  cash: 'bg-success',
  investment: 'bg-orange-500',
  credit_card: 'bg-error',
  other: 'bg-gray-500'
}

const fundTypeLabels: Record<string, string> = {
  bank: 'Bank',
  e_wallet: 'E-Wallet',
  cash: 'Tunai',
  investment: 'Investasi',
  credit_card: 'Kartu Kredit',
  other: 'Lainnya'
}
</script>

<template>
  <UDashboardPanel id="reports">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex flex-col">
            <h1 class="text-xl font-bold text-highlighted">
              Laporan Keuangan
            </h1>
            <p class="text-xs text-muted hidden sm:block">
              Pantau kesehatan keuangan dan kebiasaan belanja Anda
            </p>
          </div>
        </template>

        <template #right>
          <USelectMenu
            v-model="selectedRange"
            :items="dateRangeOptions"
            value-key="value"
            class="w-32 sm:w-40"
          />
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
            @click="exportCSV"
          >
            <span class="hidden sm:inline">Export CSV</span>
          </UButton>
        </template>
      </UDashboardNavbar>

      <!-- Tabs -->
      <div class="px-4 border-b border-default bg-default">
        <div class="flex gap-4 sm:gap-6 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="flex items-center gap-2 border-b-2 pb-3 pt-3 text-sm font-medium transition-colors whitespace-nowrap"
            :class="activeTab === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-highlighted'"
            @click="activeTab = tab.value as typeof activeTab"
          >
            <UIcon :name="tab.icon" class="size-4" />
            <span class="hidden sm:inline">{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="p-5 rounded-xl border border-default bg-default animate-pulse">
            <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-3" />
            <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32" />
          </div>
        </div>

        <template v-else>
          <!-- ========== OVERVIEW TAB ========== -->
          <template v-if="activeTab === 'overview'">
            <!-- KPI Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Total Income -->
              <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
                <div class="flex justify-between items-start">
                  <p class="text-xs font-bold uppercase tracking-wider text-muted">
                    Total Pemasukan
                  </p>
                  <div class="p-1 rounded bg-success/10">
                    <UIcon name="i-lucide-trending-up" class="size-5 text-success" />
                  </div>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-highlighted mt-2">
                  {{ formatCurrency(summaryData.totalIncome) }}
                </p>
                <p class="text-xs font-medium mt-2 flex items-center gap-1 text-success">
                  <UIcon name="i-lucide-arrow-up" class="size-3.5" />
                  {{ summaryData.incomeChange }}% vs bulan lalu
                </p>
              </div>

              <!-- Total Expenses -->
              <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
                <div class="flex justify-between items-start">
                  <p class="text-xs font-bold uppercase tracking-wider text-muted">
                    Total Pengeluaran
                  </p>
                  <div class="p-1 rounded bg-error/10">
                    <UIcon name="i-lucide-trending-down" class="size-5 text-error" />
                  </div>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-highlighted mt-2">
                  {{ formatCurrency(summaryData.totalExpense) }}
                </p>
                <p class="text-xs font-medium mt-2 flex items-center gap-1 text-error">
                  <UIcon name="i-lucide-arrow-up" class="size-3.5" />
                  {{ summaryData.expenseChange }}% vs bulan lalu
                </p>
              </div>

              <!-- Net Savings -->
              <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
                <div class="flex justify-between items-start">
                  <p class="text-xs font-bold uppercase tracking-wider text-muted">
                    Net Tabungan
                  </p>
                  <div class="p-1 rounded bg-primary/10">
                    <UIcon name="i-lucide-piggy-bank" class="size-5 text-primary" />
                  </div>
                </div>
                <p
                  class="text-xl sm:text-2xl font-bold mt-2"
                  :class="summaryData.netSavings >= 0 ? 'text-highlighted' : 'text-error'"
                >
                  {{ formatCurrency(summaryData.netSavings) }}
                </p>
                <p
                  class="text-xs font-medium mt-2 flex items-center gap-1"
                  :class="summaryData.netSavings >= 0 ? 'text-success' : 'text-error'"
                >
                  <UIcon
                    :name="summaryData.netSavings >= 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
                    class="size-3.5"
                  />
                  {{ summaryData.netSavings >= 0 ? 'Surplus' : 'Defisit' }}
                </p>
              </div>

              <!-- Savings Rate -->
              <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
                <div class="flex justify-between items-start">
                  <p class="text-xs font-bold uppercase tracking-wider text-muted">
                    Rasio Tabungan
                  </p>
                  <div class="p-1 rounded bg-purple-500/10">
                    <UIcon name="i-lucide-pie-chart" class="size-5 text-purple-500" />
                  </div>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-highlighted mt-2">
                  {{ summaryData.savingsRate }}%
                </p>
                <p class="text-xs font-medium mt-2 text-muted">
                  Target: 30%
                </p>
              </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Spending by Category -->
              <div class="lg:col-span-1 rounded-xl border border-default bg-default p-6 shadow-sm">
                <h3 class="text-lg font-bold text-highlighted mb-6">
                  Top Pengeluaran
                </h3>

                <div v-if="categorySpending.length === 0" class="text-center py-8 text-muted">
                  Tidak ada data
                </div>

                <div v-else class="flex flex-col gap-4">
                  <div
                    v-for="(cat, index) in categorySpending.slice(0, 5)"
                    :key="cat.name"
                    class="flex flex-col gap-2"
                  >
                    <div class="flex justify-between text-sm">
                      <span class="text-muted truncate">{{ cat.name }}</span>
                      <span class="text-highlighted font-medium">
                        {{ cat.percentage }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all duration-500"
                        :class="categoryColors[index % categoryColors.length]"
                        :style="{ width: `${cat.percentage}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Monthly Table -->
              <div
                class="lg:col-span-2 rounded-xl border border-default bg-default overflow-hidden shadow-sm"
              >
                <div class="px-6 py-4 border-b border-default">
                  <h3 class="text-lg font-bold text-highlighted">
                    Ringkasan Bulanan
                  </h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left">
                    <thead>
                      <tr
                        class="bg-gray-50 dark:bg-gray-900/50 text-muted text-sm font-medium border-b border-default"
                      >
                        <th class="px-6 py-3">
                          Bulan
                        </th>
                        <th class="px-6 py-3">
                          Pemasukan
                        </th>
                        <th class="px-6 py-3">
                          Pengeluaran
                        </th>
                        <th class="px-6 py-3">
                          Tabungan
                        </th>
                        <th class="px-6 py-3 text-right">
                          Rasio
                        </th>
                      </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-default">
                      <tr
                        v-for="row in monthlyBreakdown"
                        :key="row.month"
                        class="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td class="px-6 py-4 text-highlighted font-medium">
                          {{ row.month }}
                        </td>
                        <td class="px-6 py-4 text-success">
                          +{{ formatCurrency(row.income) }}
                        </td>
                        <td class="px-6 py-4 text-muted">
                          {{ formatCurrency(row.expense) }}
                        </td>
                        <td
                          class="px-6 py-4 font-medium"
                          :class="row.savings >= 0 ? 'text-highlighted' : 'text-error'"
                        >
                          {{ formatCurrency(row.savings) }}
                        </td>
                        <td class="px-6 py-4 text-right">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="row.rate >= 30 ? 'bg-success/10 text-success' : row.rate >= 15 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'"
                          >
                            {{ row.rate }}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </template>

          <!-- ========== CASH FLOW TAB ========== -->
          <template v-if="activeTab === 'cashflow'">
            <div class="rounded-xl border border-default bg-default p-6 shadow-sm">
              <h3 class="text-lg font-bold text-highlighted mb-6">
                Cash Flow Bulanan
              </h3>

              <div v-if="monthlyBreakdown.length === 0" class="text-center py-12 text-muted">
                Tidak ada data
              </div>

              <!-- Cash Flow Bar Chart -->
              <div v-else class="space-y-4">
                <div v-for="row in [...monthlyBreakdown].reverse()" :key="row.month" class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-highlighted font-medium">{{ row.monthKey }}</span>
                    <div class="flex gap-4 text-xs">
                      <span class="text-success">+{{ formatCurrency(row.income) }}</span>
                      <span class="text-error">-{{ formatCurrency(row.expense) }}</span>
                    </div>
                  </div>
                  <div class="flex gap-1 h-4">
                    <!-- Income bar -->
                    <div
                      class="bg-success rounded-l transition-all duration-500"
                      :style="{ width: `${(row.income / maxCashFlow) * 50}%` }"
                    />
                    <!-- Expense bar -->
                    <div
                      class="bg-error rounded-r transition-all duration-500"
                      :style="{ width: `${(row.expense / maxCashFlow) * 50}%` }"
                    />
                  </div>
                </div>

                <!-- Legend -->
                <div class="flex gap-6 pt-4 border-t border-default justify-center">
                  <div class="flex items-center gap-2">
                    <div class="size-3 bg-success rounded" />
                    <span class="text-sm text-muted">Pemasukan</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="size-3 bg-error rounded" />
                    <span class="text-sm text-muted">Pengeluaran</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Monthly Net Change -->
            <div class="rounded-xl border border-default bg-default p-6 shadow-sm">
              <h3 class="text-lg font-bold text-highlighted mb-6">
                Net Change per Bulan
              </h3>

              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div
                  v-for="row in [...monthlyBreakdown].reverse()"
                  :key="row.month"
                  class="text-center p-4 rounded-lg border border-default"
                  :class="row.savings >= 0 ? 'bg-success/5' : 'bg-error/5'"
                >
                  <p class="text-xs text-muted mb-1">
                    {{ row.monthKey }}
                  </p>
                  <p
                    class="text-lg font-bold"
                    :class="row.savings >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ row.savings >= 0 ? '+' : '' }}{{ formatCurrency(row.savings) }}
                  </p>
                </div>
              </div>
            </div>
          </template>

          <!-- ========== SPENDING TAB ========== -->
          <template v-if="activeTab === 'spending'">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Spending by Category (Full) -->
              <div class="rounded-xl border border-default bg-default p-6 shadow-sm">
                <h3 class="text-lg font-bold text-highlighted mb-6">
                  Pengeluaran per Kategori
                </h3>

                <div v-if="categorySpending.length === 0" class="text-center py-8 text-muted">
                  Tidak ada data pengeluaran
                </div>

                <div v-else class="flex flex-col gap-4">
                  <div
                    v-for="(cat, index) in categorySpending"
                    :key="cat.name"
                    class="flex flex-col gap-2"
                  >
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">{{ cat.name }}</span>
                      <span class="text-highlighted font-medium">
                        {{ formatCurrency(cat.amount) }} ({{ cat.percentage }}%)
                      </span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2.5">
                      <div
                        class="h-2.5 rounded-full transition-all duration-500"
                        :class="categoryColors[index % categoryColors.length]"
                        :style="{ width: `${cat.percentage}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Spending Distribution -->
              <div class="rounded-xl border border-default bg-default p-6 shadow-sm">
                <h3 class="text-lg font-bold text-highlighted mb-6">
                  Distribusi Pengeluaran
                </h3>

                <div v-if="categorySpending.length === 0" class="text-center py-8 text-muted">
                  Tidak ada data
                </div>

                <div v-else class="grid grid-cols-2 gap-3">
                  <div
                    v-for="(cat, index) in categorySpending.slice(0, 6)"
                    :key="cat.name"
                    class="p-4 rounded-lg border border-default flex flex-col items-center text-center"
                  >
                    <div
                      class="size-10 rounded-full flex items-center justify-center mb-2"
                      :class="categoryColors[index % categoryColors.length].replace('bg-', 'bg-') + '/20'"
                    >
                      <span class="text-xl font-bold text-highlighted">{{ cat.percentage
                      }}%</span>
                    </div>
                    <p class="text-sm font-medium text-highlighted truncate w-full">
                      {{ cat.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ formatCurrency(cat.amount) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Spending -->
            <div class="rounded-xl border border-error/30 bg-error/5 p-6 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-muted mb-1">
                    Total Pengeluaran Periode Ini
                  </p>
                  <p class="text-3xl font-bold text-highlighted">
                    {{ formatCurrency(summaryData.totalExpense) }}
                  </p>
                </div>
                <div class="p-3 rounded-full bg-error/10">
                  <UIcon name="i-lucide-shopping-cart" class="size-8 text-error" />
                </div>
              </div>
            </div>
          </template>

          <!-- ========== NET WORTH TAB ========== -->
          <template v-if="activeTab === 'networth'">
            <!-- Total Net Worth -->
            <div class="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-muted mb-1">
                    Total Aset Bersih
                  </p>
                  <p class="text-3xl font-bold text-highlighted">
                    {{ formatCurrency(totalNetWorth) }}
                  </p>
                </div>
                <div class="p-3 rounded-full bg-primary/10">
                  <UIcon name="i-lucide-wallet" class="size-8 text-primary" />
                </div>
              </div>
            </div>

            <!-- Assets by Type -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Fund Sources List -->
              <div class="rounded-xl border border-default bg-default p-6 shadow-sm">
                <h3 class="text-lg font-bold text-highlighted mb-6">
                  Sumber Dana
                </h3>

                <div v-if="fundBalances.length === 0" class="text-center py-8 text-muted">
                  Tidak ada sumber dana
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="fund in fundBalances"
                    :key="fund.name"
                    class="flex items-center justify-between p-3 rounded-lg border border-default hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="size-10 rounded-lg flex items-center justify-center"
                        :class="fundTypeColors[fund.type] + '/20'"
                      >
                        <UIcon
                          name="i-lucide-wallet"
                          class="size-5"
                          :class="fundTypeColors[fund.type]?.replace('bg-', 'text-') || 'text-primary'"
                        />
                      </div>
                      <div>
                        <p class="font-medium text-highlighted">
                          {{ fund.name }}
                        </p>
                        <p class="text-xs text-muted">
                          {{ fundTypeLabels[fund.type] || fund.type }}
                        </p>
                      </div>
                    </div>
                    <p class="font-bold text-highlighted">
                      {{ formatCurrency(fund.balance) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Asset Distribution -->
              <div class="rounded-xl border border-default bg-default p-6 shadow-sm">
                <h3 class="text-lg font-bold text-highlighted mb-6">
                  Distribusi Aset
                </h3>

                <div v-if="fundBalances.length === 0" class="text-center py-8 text-muted">
                  Tidak ada data
                </div>

                <div v-else class="space-y-4">
                  <div v-for="fund in fundBalances" :key="fund.name" class="flex flex-col gap-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">{{ fund.name }}</span>
                      <span class="text-highlighted font-medium">
                        {{ totalNetWorth > 0 ? Math.round((fund.balance / totalNetWorth) * 100)
                          : 0 }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all duration-500"
                        :class="fundTypeColors[fund.type] || 'bg-primary'"
                        :style="{ width: `${totalNetWorth > 0 ? (fund.balance / totalNetWorth) * 100 : 0}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
