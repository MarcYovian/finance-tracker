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

const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMM yyyy, HH:mm', { locale: id })
}
</script>

<template>
    <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-highlighted">
                    Transaksi Terkini
                </h3>
                <UButton to="/transactions" variant="ghost" color="neutral" size="sm"
                    trailing-icon="i-lucide-arrow-right">
                    Lihat Semua
                </UButton>
            </div>
        </template>

        <div v-if="pending" class="space-y-4">
            <div v-for="i in 5" :key="i" class="flex items-center gap-4 animate-pulse">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div class="flex-1">
                    <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2" />
                    <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                </div>
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            </div>
        </div>

        <div v-else-if="transactions?.length === 0" class="text-center py-8">
            <UIcon name="i-lucide-receipt" class="size-12 text-muted mx-auto mb-3" />
            <p class="text-muted">Belum ada transaksi</p>
            <UButton to="/transactions" variant="soft" size="sm" class="mt-3">
                Tambah Transaksi
            </UButton>
        </div>

        <div v-else class="divide-y divide-default">
            <div v-for="transaction in transactions" :key="transaction.id"
                class="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="[
                    transaction.type === 'income' ? 'bg-success/10' : '',
                    transaction.type === 'expense' ? 'bg-error/10' : '',
                    transaction.type === 'transfer' ? 'bg-info/10' : ''
                ]">
                    <UIcon :name="getTypeIcon(transaction.type)" :class="['size-5', getTypeColor(transaction.type)]" />
                </div>

                <div class="flex-1 min-w-0">
                    <p class="font-medium text-highlighted truncate">
                        {{ transaction.description || transaction.category?.name || 'Transaksi' }}
                    </p>
                    <p class="text-xs text-muted">
                        {{ formatDate(transaction.transaction_date) }}
                    </p>
                </div>

                <div class="text-right">
                    <p class="font-semibold" :class="getTypeColor(transaction.type)">
                        {{ transaction.type === 'expense' ? '-' : '+' }}{{ formatCurrency(transaction.amount) }}
                    </p>
                    <p class="text-xs text-muted truncate max-w-[100px]">
                        {{ transaction.source_fund?.name || transaction.destination_fund?.name || '' }}
                    </p>
                </div>
            </div>
        </div>
    </UCard>
</template>
