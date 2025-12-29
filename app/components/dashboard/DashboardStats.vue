<script setup lang="ts">
import type { DashboardSummary, Range } from '~/types'

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
            fund_sources_count: 0
        }
    }

    return data?.[0] || {
        total_balance: 0,
        total_income: 0,
        total_expense: 0,
        net_flow: 0,
        active_budgets_count: 0,
        active_goals_count: 0,
        fund_sources_count: 0
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
        fund_sources_count: 0
    })
})

const stats = computed(() => [
    {
        title: 'Total Saldo',
        icon: 'i-lucide-wallet',
        value: formatCurrency(summary.value?.total_balance || 0),
        color: 'primary',
        to: '/fund-sources'
    },
    {
        title: 'Pemasukan',
        icon: 'i-lucide-trending-up',
        value: formatCurrency(summary.value?.total_income || 0),
        color: 'success',
        to: '/transactions?type=income'
    },
    {
        title: 'Pengeluaran',
        icon: 'i-lucide-trending-down',
        value: formatCurrency(summary.value?.total_expense || 0),
        color: 'error',
        to: '/transactions?type=expense'
    },
    {
        title: 'Arus Kas Bersih',
        icon: 'i-lucide-activity',
        value: formatCurrency(summary.value?.net_flow || 0),
        color: (summary.value?.net_flow || 0) >= 0 ? 'success' : 'error',
        to: '/transactions'
    }
])

defineExpose({ refresh })
</script>

<template>
    <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
        <UPageCard v-for="(stat, index) in stats" :key="index" :icon="stat.icon" :title="stat.title" :to="stat.to"
            variant="subtle" :ui="{
                container: 'gap-y-1.5',
                wrapper: 'items-start',
                leading: `p-2.5 rounded-full bg-${stat.color}/10 ring ring-inset ring-${stat.color}/25 flex-col`,
                title: 'font-normal text-muted text-xs uppercase'
            }" class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1">
            <div class="flex items-center gap-2">
                <span class="text-2xl font-semibold text-highlighted">
                    {{ stat.value }}
                </span>
            </div>
        </UPageCard>
    </UPageGrid>
</template>
