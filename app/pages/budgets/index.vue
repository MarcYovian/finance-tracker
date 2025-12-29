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

const { budgets, loading, error, fetchBudgets, createBudget, deleteBudget } = useBudgets()
const { expenseCategories, fetchCategories } = useCategories()

// Modal state
const isModalOpen = ref(false)
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

const periodOptions: { label: string; value: BudgetPeriod }[] = [
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

function formatDate(dateString: string) {
    return format(new Date(dateString), 'd MMM yyyy', { locale: idLocale })
}

const getPeriodLabel = (period: BudgetPeriod) => {
    return periodOptions.find(p => p.value === period)?.label || period
}

const getBudgetProgress = (budget: Budget) => {
    if (!budget.budget_items || budget.budget_items.length === 0) return 0
    const totalSpent = budget.budget_items.reduce((sum, item) => sum + item.spent_amount, 0)
    return Math.min(Math.round((totalSpent / budget.total_limit) * 100), 100)
}

const getTotalSpent = (budget: Budget) => {
    if (!budget.budget_items || budget.budget_items.length === 0) return 0
    return budget.budget_items.reduce((sum, item) => sum + item.spent_amount, 0)
}

const getProgressColor = (progress: number, threshold: number) => {
    if (progress >= 100) return 'error'
    if (progress >= threshold) return 'warning'
    return 'success'
}

const openNewModal = () => {
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

const addBudgetItem = () => {
    budgetItems.value.push({
        category_id: '',
        planned_amount: 0
    })
}

const removeBudgetItem = (index: number) => {
    budgetItems.value.splice(index, 1)
}

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

    const result = await createBudget(formData.value, validItems)

    if (result) {
        toast.add({ title: 'Budget berhasil dibuat', color: 'success' })
        isModalOpen.value = false
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus budget ini?')) return

    const success = await deleteBudget(id)
    if (success) {
        toast.add({ title: 'Budget berhasil dihapus', color: 'success' })
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const activeBudgets = computed(() => budgets.value.filter(b => b.is_active))
</script>

<template>
    <UDashboardPanel id="budgets">
        <template #header>
            <UDashboardNavbar title="Budgets" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Buat Budget Baru
                    </UButton>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <UCard v-if="loading" class="animate-pulse">
                <div class="space-y-4">
                    <div v-for="i in 3" :key="i" class="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </UCard>

            <UCard v-else-if="activeBudgets.length === 0">
                <div class="text-center py-12">
                    <UIcon name="i-lucide-pie-chart" class="size-16 text-muted mx-auto mb-4" />
                    <h3 class="text-lg font-semibold mb-2">Belum ada budget</h3>
                    <p class="text-muted mb-4">Buat budget untuk mengontrol pengeluaran Anda</p>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Buat Budget Pertama
                    </UButton>
                </div>
            </UCard>

            <div v-else class="space-y-4">
                <UCard v-for="budget in activeBudgets" :key="budget.id">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-highlighted">{{ budget.name }}</h3>
                            <p class="text-sm text-muted">
                                {{ getPeriodLabel(budget.period) }} • {{ formatDate(budget.start_date) }} - {{
                                formatDate(budget.end_date) }}
                            </p>
                        </div>

                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                            @click="handleDelete(budget.id)" />
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-muted">Progress</span>
                            <span class="text-sm font-medium">
                                {{ formatCurrency(getTotalSpent(budget)) }} / {{ formatCurrency(budget.total_limit) }}
                            </span>
                        </div>
                        <UProgress :value="getBudgetProgress(budget)"
                            :color="getProgressColor(getBudgetProgress(budget), budget.alert_threshold)" size="md" />
                    </div>

                    <!-- Budget Items Summary -->
                    <div v-if="budget.budget_items && budget.budget_items.length > 0" class="space-y-2">
                        <div v-for="item in budget.budget_items.slice(0, 3)" :key="item.id"
                            class="flex items-center justify-between text-sm">
                            <span>{{ item.category?.name || 'Kategori' }}</span>
                            <span :class="item.spent_amount > item.planned_amount ? 'text-error' : 'text-muted'">
                                {{ formatCurrency(item.spent_amount) }} / {{ formatCurrency(item.planned_amount) }}
                            </span>
                        </div>

                        <NuxtLink v-if="budget.budget_items.length > 3" :to="`/budgets/${budget.id}`"
                            class="text-sm text-primary hover:underline">
                            Lihat {{ budget.budget_items.length - 3 }} kategori lainnya →
                        </NuxtLink>
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>

    <!-- Create Budget Modal -->
    <UModal v-model:open="isModalOpen">
        <template #content>
            <UCard class="max-h-[90vh] overflow-y-auto">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">Buat Budget Baru</h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isModalOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                    <UFormField label="Nama Budget" required>
                        <UInput v-model="formData.name" placeholder="Contoh: Budget November 2024" class="w-full" />
                    </UFormField>

                    <UFormField label="Periode" required>
                        <USelectMenu v-model="formData.period" :items="periodOptions" value-key="value"
                            class="w-full" />
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
                        <UInput v-model.number="formData.total_limit" type="number" placeholder="0" class="w-full" />
                    </UFormField>

                    <UFormField label="Alert Threshold (%)">
                        <UInput v-model.number="formData.alert_threshold" type="number" min="1" max="100"
                            class="w-full" />
                    </UFormField>

                    <!-- Budget Items -->
                    <div class="border-t pt-4">
                        <div class="flex items-center justify-between mb-3">
                            <label class="font-medium">Item Budget per Kategori</label>
                            <UButton size="xs" variant="soft" icon="i-lucide-plus" @click="addBudgetItem">
                                Tambah Item
                            </UButton>
                        </div>

                        <div v-if="budgetItems.length === 0" class="text-sm text-muted text-center py-4">
                            Belum ada item budget. Klik "Tambah Item" untuk menambahkan.
                        </div>

                        <div v-else class="space-y-3">
                            <div v-for="(item, index) in budgetItems" :key="index" class="flex items-center gap-2">
                                <USelectMenu v-model="item.category_id"
                                    :items="expenseCategories.map(c => ({ label: c.name, value: c.id }))"
                                    value-key="value" placeholder="Pilih kategori" class="flex-1" />
                                <UInput v-model.number="item.planned_amount" type="number" placeholder="Jumlah"
                                    class="w-32" />
                                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                                    @click="removeBudgetItem(index)" />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton type="button" color="neutral" variant="ghost" @click="isModalOpen = false">
                            Batal
                        </UButton>
                        <UButton type="submit" :loading="loading">
                            Buat Budget
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>
