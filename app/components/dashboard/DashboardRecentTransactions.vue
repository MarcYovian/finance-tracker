<script setup lang="ts">
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Transaction, Range } from '~/types'

const props = defineProps<{
  range: Range
}>()

const supabase = useSupabaseClient()

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const { data: transactions, pending } = await useAsyncData<Transaction[]>('recent-transactions', async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, icon, color),
      source_fund:fund_sources!transactions_source_fund_fkey(id, name),
      destination_fund:fund_sources!transactions_destination_fund_fkey(id, name)
    `)
    .order('transaction_date', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Failed to fetch recent transactions:', error)
    return []
  }

  return data as Transaction[]
}, {
  watch: [() => props.range],
  default: () => []
})

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'income':
      return 'i-lucide-arrow-down-left'
    case 'expense':
      return 'i-lucide-arrow-up-right'
    case 'transfer':
      return 'i-lucide-arrow-left-right'
    default:
      return 'i-lucide-circle'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'income':
      return 'text-success'
    case 'expense':
      return 'text-error'
    case 'transfer':
      return 'text-info'
    default:
      return 'text-muted'
  }
}

const getTypeBg = (type: string) => {
  switch (type) {
    case 'income':
      return 'bg-success/10'
    case 'expense':
      return 'bg-error/10'
    case 'transfer':
      return 'bg-info/10'
    default:
      return 'bg-gray-100 dark:bg-gray-800'
  }
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'd MMM yyyy', { locale: id })
}
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-highlighted">
          Transaksi Terkini
        </h3>
        <UButton
          to="/transactions"
          variant="link"
          color="primary"
          size="sm"
        >
          Lihat Semua
        </UButton>
      </div>
    </template>

    <div v-if="pending" class="flex-1">
      <div class="space-y-4">
        <div v-for="i in 4" :key="i" class="flex items-center gap-4 animate-pulse">
          <div class="size-10 rounded bg-gray-200 dark:bg-gray-800" />
          <div class="flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2" />
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          </div>
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
        </div>
      </div>
    </div>

    <div v-else-if="transactions?.length === 0" class="flex-1 flex flex-col items-center justify-center py-8">
      <UIcon name="i-lucide-receipt" class="size-12 text-muted mb-3" />
      <p class="text-muted mb-3">
        Belum ada transaksi
      </p>
      <UButton
        to="/transactions"
        variant="soft"
        size="sm"
        icon="i-lucide-plus"
      >
        Tambah Transaksi
      </UButton>
    </div>

    <!-- Table Layout -->
    <div v-else class="flex-1 overflow-x-auto -mx-6">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-default bg-gray-50 dark:bg-gray-900/50">
            <th class="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
              Transaksi
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">
              Tanggal
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">
              Kategori
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">
              Jumlah
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="transaction in transactions"
            :key="transaction.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="size-9 rounded flex items-center justify-center" :class="getTypeBg(transaction.type)">
                  <UIcon
                    :name="getTypeIcon(transaction.type)"
                    class="size-4"
                    :class="getTypeColor(transaction.type)"
                  />
                </div>
                <div>
                  <span class="font-medium text-highlighted text-sm">
                    {{ transaction.description || transaction.category?.name || 'Transaksi' }}
                  </span>
                  <p class="text-xs text-muted sm:hidden">
                    {{ formatDate(transaction.transaction_date) }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-muted text-sm hidden sm:table-cell">
              {{ formatDate(transaction.transaction_date) }}
            </td>
            <td class="px-6 py-4 hidden md:table-cell">
              <span
                v-if="transaction.category"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {{ transaction.category.name }}
              </span>
              <span v-else class="text-muted text-xs">-</span>
            </td>
            <td class="px-6 py-4 text-right">
              <span class="font-semibold text-sm" :class="getTypeColor(transaction.type)">
                {{ transaction.type === 'expense' ? '-' : '+' }}{{ formatCurrency(transaction.amount) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
