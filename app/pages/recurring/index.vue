<script setup lang="ts">
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { RecurringPattern, RecurringPatternCreate, Frequency } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
    if (!newUser) {
        router.push('/auth/login')
    }
}, { immediate: true })

const { patterns, loading, error, fetchPatterns, createPattern, updatePattern, deletePattern, togglePattern } = useRecurring()
const { categories, fetchCategories } = useCategories()
const { fundSources, fetchFundSources } = useFundSources()

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<RecurringPatternCreate>({
    name: '',
    frequency: 'monthly',
    interval: 1,
    amount: 0,
    category_id: null,
    source_fund_id: null,
    destination_fund_id: null,
    transaction_type: 'expense',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: null
})

// Fetch data on mount
onMounted(async () => {
    await Promise.all([
        fetchPatterns(),
        fetchCategories(),
        fetchFundSources()
    ])
})

const frequencyOptions: { label: string; value: Frequency }[] = [
    { label: 'Harian', value: 'daily' },
    { label: 'Mingguan', value: 'weekly' },
    { label: '2 Mingguan', value: 'biweekly' },
    { label: 'Bulanan', value: 'monthly' },
    { label: 'Kuartalan', value: 'quarterly' },
    { label: 'Tahunan', value: 'yearly' }
]

const getFrequencyLabel = (frequency: Frequency) => {
    return frequencyOptions.find(f => f.value === frequency)?.label || frequency
}

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'income': return 'Pemasukan'
        case 'expense': return 'Pengeluaran'
        case 'transfer': return 'Transfer'
        default: return type
    }
}

const getTypeColor = (type: string) => {
    switch (type) {
        case 'income': return 'success'
        case 'expense': return 'error'
        case 'transfer': return 'info'
        default: return 'neutral'
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

const filteredCategories = computed(() => {
    if (!formData.value.transaction_type || formData.value.transaction_type === 'transfer') {
        return categories.value
    }
    return categories.value.filter(c => c.type === formData.value.transaction_type)
})

const openNewModal = () => {
    isEditing.value = false
    editingId.value = null
    formData.value = {
        name: '',
        frequency: 'monthly',
        interval: 1,
        amount: 0,
        category_id: null,
        source_fund_id: null,
        destination_fund_id: null,
        transaction_type: 'expense',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: null
    }
    isModalOpen.value = true
}

const openEditModal = (pattern: RecurringPattern) => {
    isEditing.value = true
    editingId.value = pattern.id
    formData.value = {
        name: pattern.name,
        frequency: pattern.frequency,
        interval: pattern.interval,
        amount: pattern.amount,
        category_id: pattern.category_id,
        source_fund_id: pattern.source_fund_id,
        destination_fund_id: pattern.destination_fund_id,
        transaction_type: pattern.transaction_type,
        description: pattern.description || '',
        start_date: pattern.start_date,
        end_date: pattern.end_date
    }
    isModalOpen.value = true
}

const handleSubmit = async () => {
    if (!formData.value.name.trim()) {
        toast.add({ title: 'Nama harus diisi', color: 'error' })
        return
    }

    if (formData.value.amount <= 0) {
        toast.add({ title: 'Jumlah harus lebih dari 0', color: 'error' })
        return
    }

    let result

    if (isEditing.value && editingId.value) {
        result = await updatePattern(editingId.value, formData.value)
        if (result) {
            toast.add({ title: 'Pola berhasil diperbarui', color: 'success' })
        }
    } else {
        result = await createPattern(formData.value)
        if (result) {
            toast.add({ title: 'Pola berhasil dibuat', color: 'success' })
        }
    }

    if (result) {
        isModalOpen.value = false
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const handleToggle = async (id: string, isActive: boolean) => {
    const success = await togglePattern(id, isActive)
    if (success) {
        toast.add({
            title: isActive ? 'Pola diaktifkan' : 'Pola dinonaktifkan',
            color: 'success'
        })
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pola ini?')) return

    const success = await deletePattern(id)
    if (success) {
        toast.add({ title: 'Pola berhasil dihapus', color: 'success' })
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}
</script>

<template>
    <UDashboardPanel id="recurring">
        <template #header>
            <UDashboardNavbar title="Transaksi Berulang" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Pola Baru
                    </UButton>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <UCard v-if="loading" class="animate-pulse">
                <div class="space-y-4">
                    <div v-for="i in 3" :key="i" class="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </UCard>

            <UCard v-else-if="patterns.length === 0">
                <div class="text-center py-12">
                    <UIcon name="i-lucide-repeat" class="size-16 text-muted mx-auto mb-4" />
                    <h3 class="text-lg font-semibold mb-2">Belum ada transaksi berulang</h3>
                    <p class="text-muted mb-4">Atur transaksi otomatis seperti gaji atau langganan</p>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Pola Pertama
                    </UButton>
                </div>
            </UCard>

            <div v-else class="space-y-4">
                <UCard v-for="pattern in patterns" :key="pattern.id" :class="{ 'opacity-60': !pattern.is_active }">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start gap-4">
                            <UToggle :model-value="pattern.is_active"
                                @update:model-value="handleToggle(pattern.id, $event)" />

                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="font-semibold text-highlighted">{{ pattern.name }}</h3>
                                    <UBadge :color="getTypeColor(pattern.transaction_type)" variant="subtle" size="xs">
                                        {{ getTypeLabel(pattern.transaction_type) }}
                                    </UBadge>
                                </div>

                                <p class="text-sm text-muted mb-2">
                                    {{ formatCurrency(pattern.amount) }} • {{ getFrequencyLabel(pattern.frequency) }}
                                    <span v-if="pattern.interval > 1"> setiap {{ pattern.interval }}x</span>
                                </p>

                                <div class="flex items-center gap-4 text-xs text-muted">
                                    <span v-if="pattern.category">
                                        <UIcon name="i-lucide-tag" class="size-3 mr-1" />
                                        {{ pattern.category.name }}
                                    </span>
                                    <span v-if="pattern.source_fund">
                                        <UIcon name="i-lucide-wallet" class="size-3 mr-1" />
                                        {{ pattern.source_fund.name }}
                                    </span>
                                    <span>
                                        <UIcon name="i-lucide-calendar" class="size-3 mr-1" />
                                        Next: {{ formatDate(pattern.next_execution_date) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm"
                                @click="openEditModal(pattern)" />
                            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                                @click="handleDelete(pattern.id)" />
                        </div>
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isModalOpen">
        <template #content>
            <UCard class="max-h-[90vh] overflow-y-auto">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">
                            {{ isEditing ? 'Edit Pola Berulang' : 'Buat Pola Baru' }}
                        </h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isModalOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                    <UFormField label="Nama" required>
                        <UInput v-model="formData.name" placeholder="Contoh: Gaji Bulanan" class="w-full" />
                    </UFormField>

                    <UFormField label="Tipe Transaksi" required>
                        <USelectMenu v-model="formData.transaction_type" :items="[
                            { label: 'Pemasukan', value: 'income' },
                            { label: 'Pengeluaran', value: 'expense' },
                            { label: 'Transfer', value: 'transfer' }
                        ]" value-key="value" class="w-full" />
                    </UFormField>

                    <UFormField label="Jumlah" required>
                        <CurrencyInput v-model="formData.amount" placeholder="0" />
                    </UFormField>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="Frekuensi" required>
                            <USelectMenu v-model="formData.frequency" :items="frequencyOptions" value-key="value"
                                class="w-full" />
                        </UFormField>

                        <UFormField label="Interval">
                            <UInput v-model.number="formData.interval" type="number" min="1" class="w-full" />
                        </UFormField>
                    </div>

                    <UFormField v-if="formData.transaction_type !== 'transfer'" label="Kategori">
                        <USelectMenu v-model="formData.category_id"
                            :items="filteredCategories.map(c => ({ label: c.name, value: c.id }))" value-key="value"
                            placeholder="Pilih kategori" class="w-full" />
                    </UFormField>

                    <UFormField :label="formData.transaction_type === 'income' ? 'Ke Sumber Dana' : 'Dari Sumber Dana'">
                        <USelectMenu v-model="formData.source_fund_id"
                            :items="fundSources.map(f => ({ label: f.name, value: f.id }))" value-key="value"
                            placeholder="Pilih sumber dana" class="w-full" />
                    </UFormField>

                    <UFormField v-if="formData.transaction_type === 'transfer'" label="Ke Sumber Dana">
                        <USelectMenu v-model="formData.destination_fund_id"
                            :items="fundSources.filter(f => f.id !== formData.source_fund_id).map(f => ({ label: f.name, value: f.id }))"
                            value-key="value" placeholder="Pilih sumber dana tujuan" class="w-full" />
                    </UFormField>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="Tanggal Mulai" required>
                            <UInput v-model="formData.start_date" type="date" class="w-full" />
                        </UFormField>

                        <UFormField label="Tanggal Selesai (Opsional)">
                            <UInput v-model="formData.end_date" type="date" class="w-full" />
                        </UFormField>
                    </div>

                    <UFormField label="Deskripsi">
                        <UTextarea v-model="formData.description" placeholder="Deskripsi (opsional)" class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton type="button" color="neutral" variant="ghost" @click="isModalOpen = false">
                            Batal
                        </UButton>
                        <UButton type="submit" :loading="loading">
                            {{ isEditing ? 'Simpan Perubahan' : 'Buat Pola' }}
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>
