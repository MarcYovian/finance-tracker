<script setup lang="ts">
import { format, differenceInDays, differenceInMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { FinancialGoal, FinancialGoalCreate, GoalCategory } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
    if (!newUser) {
        router.push('/auth/login')
    }
}, { immediate: true })

const { goals, loading, error, fetchGoals, createGoal, updateGoal, deleteGoal, updateGoalProgress } = useGoals()

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<FinancialGoalCreate>({
    name: '',
    description: '',
    target_amount: 0,
    current_amount: 0,
    category: 'savings',
    target_date: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
    priority: 0
})

// Progress update modal
const isProgressModalOpen = ref(false)
const progressGoal = ref<FinancialGoal | null>(null)
const progressAmount = ref(0)

// Fetch data on mount
onMounted(async () => {
    await fetchGoals()
})

const categoryOptions: { label: string; value: GoalCategory }[] = [
    { label: 'Tabungan', value: 'savings' },
    { label: 'Investasi', value: 'investment' },
    { label: 'Pelunasan Utang', value: 'debt_payoff' },
    { label: 'Lainnya', value: 'other' }
]

const getCategoryLabel = (category: GoalCategory) => {
    return categoryOptions.find(c => c.value === category)?.label || category
}

const getCategoryIcon = (category: GoalCategory) => {
    switch (category) {
        case 'savings': return 'i-lucide-piggy-bank'
        case 'investment': return 'i-lucide-trending-up'
        case 'debt_payoff': return 'i-lucide-credit-card'
        default: return 'i-lucide-target'
    }
}

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

const getProgress = (goal: FinancialGoal) => {
    return Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
}

const getDaysRemaining = (targetDate: string) => {
    return differenceInDays(new Date(targetDate), new Date())
}

const getMonthsRemaining = (targetDate: string) => {
    const months = differenceInMonths(new Date(targetDate), new Date())
    return Math.max(months, 1) // Minimal 1 bulan
}

// Calculate how much to save per month to reach the goal
const getMonthlySavingsNeeded = (goal: FinancialGoal) => {
    const remaining = goal.target_amount - goal.current_amount
    if (remaining <= 0) return 0 // Goal already reached

    const monthsRemaining = getMonthsRemaining(goal.target_date)
    return Math.ceil(remaining / monthsRemaining)
}

const getProgressColor = (goal: FinancialGoal) => {
    if (goal.status === 'completed') return 'success'
    if (goal.status === 'cancelled') return 'neutral'

    const progress = getProgress(goal)
    const daysRemaining = getDaysRemaining(goal.target_date)

    // Calculate expected progress
    const totalDays = differenceInDays(new Date(goal.target_date), new Date(goal.created_at))
    const daysPassed = totalDays - daysRemaining
    const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0

    if (progress >= expectedProgress) return 'success'
    if (progress >= expectedProgress * 0.7) return 'warning'
    return 'error'
}

const openNewModal = () => {
    isEditing.value = false
    editingId.value = null
    formData.value = {
        name: '',
        description: '',
        target_amount: 0,
        current_amount: 0,
        category: 'savings',
        target_date: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
        priority: 0
    }
    isModalOpen.value = true
}

const openEditModal = (goal: FinancialGoal) => {
    isEditing.value = true
    editingId.value = goal.id
    formData.value = {
        name: goal.name,
        description: goal.description || '',
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        category: goal.category,
        target_date: goal.target_date,
        priority: goal.priority
    }
    isModalOpen.value = true
}

const openProgressModal = (goal: FinancialGoal) => {
    progressGoal.value = goal
    progressAmount.value = goal.current_amount
    isProgressModalOpen.value = true
}

const handleSubmit = async () => {
    if (!formData.value.name.trim()) {
        toast.add({ title: 'Nama goal harus diisi', color: 'error' })
        return
    }

    if (formData.value.target_amount <= 0) {
        toast.add({ title: 'Target amount harus lebih dari 0', color: 'error' })
        return
    }

    let result

    if (isEditing.value && editingId.value) {
        result = await updateGoal(editingId.value, formData.value)
        if (result) {
            toast.add({ title: 'Goal berhasil diperbarui', color: 'success' })
        }
    } else {
        result = await createGoal(formData.value)
        if (result) {
            toast.add({ title: 'Goal berhasil dibuat', color: 'success' })
        }
    }

    if (result) {
        isModalOpen.value = false
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const handleProgressUpdate = async () => {
    if (!progressGoal.value) return

    const result = await updateGoalProgress(progressGoal.value.id, progressAmount.value)
    if (result) {
        toast.add({ title: 'Progress berhasil diperbarui', color: 'success' })
        isProgressModalOpen.value = false
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus goal ini?')) return

    const success = await deleteGoal(id)
    if (success) {
        toast.add({ title: 'Goal berhasil dihapus', color: 'success' })
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const activeGoals = computed(() => goals.value.filter(g => g.status === 'active'))
const completedGoals = computed(() => goals.value.filter(g => g.status === 'completed'))
</script>

<template>
    <UDashboardPanel id="goals">
        <template #header>
            <UDashboardNavbar title="Financial Goals" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Goal
                    </UButton>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <UCard v-if="loading" class="animate-pulse">
                <div class="space-y-4">
                    <div v-for="i in 3" :key="i" class="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </UCard>

            <div v-else-if="goals.length === 0">
                <UCard>
                    <div class="text-center py-12">
                        <UIcon name="i-lucide-target" class="size-16 text-muted mx-auto mb-4" />
                        <h3 class="text-lg font-semibold mb-2">Belum ada financial goal</h3>
                        <p class="text-muted mb-4">Tetapkan target finansial untuk masa depan Anda</p>
                        <UButton icon="i-lucide-plus" @click="openNewModal">
                            Buat Goal Pertama
                        </UButton>
                    </div>
                </UCard>
            </div>

            <div v-else class="space-y-6">
                <!-- Active Goals -->
                <div v-if="activeGoals.length > 0">
                    <h3 class="text-lg font-semibold mb-4">Goal Aktif</h3>
                    <div class="grid gap-4 md:grid-cols-2">
                        <UCard v-for="goal in activeGoals" :key="goal.id"
                            class="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            @click="openEditModal(goal)">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="p-2.5 rounded-full bg-primary/10">
                                        <UIcon :name="getCategoryIcon(goal.category)" class="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 class="font-semibold text-highlighted">{{ goal.name }}</h4>
                                        <p class="text-xs text-muted">{{ getCategoryLabel(goal.category) }}</p>
                                    </div>
                                </div>

                                <div class="flex items-center gap-1">
                                    <UButton icon="i-lucide-plus-circle" color="primary" variant="ghost" size="xs"
                                        @click.stop="openProgressModal(goal)" />
                                    <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                                        @click.stop="handleDelete(goal.id)" />
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-2xl font-bold text-highlighted">
                                        {{ formatCurrency(goal.current_amount) }}
                                    </span>
                                    <span class="text-sm text-muted">
                                        of {{ formatCurrency(goal.target_amount) }}
                                    </span>
                                </div>
                                <UProgress :value="getProgress(goal)" :color="getProgressColor(goal)" size="md" />
                            </div>

                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted">{{ getProgress(goal) }}%</span>
                                <span :class="getDaysRemaining(goal.target_date) < 30 ? 'text-warning' : 'text-muted'">
                                    {{ getDaysRemaining(goal.target_date) }} hari lagi
                                </span>
                            </div>

                            <div class="mt-3 pt-3 border-t border-default">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-muted">Target: {{ formatDate(goal.target_date) }}</span>
                                    <div v-if="getMonthlySavingsNeeded(goal) > 0" class="text-right">
                                        <p class="text-xs text-muted">Tabung per bulan:</p>
                                        <p class="text-sm font-semibold text-primary">
                                            {{ formatCurrency(getMonthlySavingsNeeded(goal)) }}
                                        </p>
                                    </div>
                                    <span v-else class="text-xs text-success font-medium">🎉 Tercapai!</span>
                                </div>
                            </div>
                        </UCard>
                    </div>
                </div>

                <!-- Completed Goals -->
                <div v-if="completedGoals.length > 0">
                    <h3 class="text-lg font-semibold mb-4">Goal Selesai</h3>
                    <div class="grid gap-4 md:grid-cols-2">
                        <UCard v-for="goal in completedGoals" :key="goal.id" class="opacity-75">
                            <div class="flex items-center gap-3 mb-2">
                                <UIcon name="i-lucide-check-circle" class="size-5 text-success" />
                                <h4 class="font-semibold">{{ goal.name }}</h4>
                            </div>
                            <p class="text-sm text-success font-medium">
                                {{ formatCurrency(goal.target_amount) }} tercapai!
                            </p>
                        </UCard>
                    </div>
                </div>
            </div>
        </template>
    </UDashboardPanel>

    <!-- Create/Edit Goal Modal -->
    <UModal v-model:open="isModalOpen">
        <template #content>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">
                            {{ isEditing ? 'Edit Goal' : 'Buat Goal Baru' }}
                        </h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isModalOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                    <UFormField label="Nama Goal" required>
                        <UInput v-model="formData.name" placeholder="Contoh: Dana Darurat 6 Bulan" class="w-full" />
                    </UFormField>

                    <UFormField label="Kategori" required>
                        <USelectMenu v-model="formData.category" :items="categoryOptions" value-key="value"
                            class="w-full" />
                    </UFormField>

                    <UFormField label="Target Amount" required>
                        <CurrencyInput v-model="formData.target_amount" placeholder="0" />
                    </UFormField>

                    <UFormField label="Current Amount">
                        <CurrencyInput v-model="formData.current_amount" placeholder="0" />
                    </UFormField>

                    <UFormField label="Target Date" required>
                        <UInput v-model="formData.target_date" type="date" class="w-full" />
                    </UFormField>

                    <UFormField label="Deskripsi">
                        <UTextarea v-model="formData.description" placeholder="Deskripsi goal (opsional)"
                            class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton type="button" color="neutral" variant="ghost" @click="isModalOpen = false">
                            Batal
                        </UButton>
                        <UButton type="submit" :loading="loading">
                            {{ isEditing ? 'Simpan Perubahan' : 'Buat Goal' }}
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>

    <!-- Progress Update Modal -->
    <UModal v-model:open="isProgressModalOpen">
        <template #content>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">Update Progress</h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost"
                            @click="isProgressModalOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleProgressUpdate" class="space-y-4">
                    <p v-if="progressGoal" class="text-muted">
                        {{ progressGoal.name }}
                    </p>

                    <UFormField label="Current Amount" required>
                        <CurrencyInput v-model="progressAmount" placeholder="0" />
                    </UFormField>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton type="button" color="neutral" variant="ghost" @click="isProgressModalOpen = false">
                            Batal
                        </UButton>
                        <UButton type="submit" :loading="loading">
                            Update
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>
