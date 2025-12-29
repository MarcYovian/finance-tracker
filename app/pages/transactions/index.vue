<script setup lang="ts">
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Transaction, TransactionType, TransactionCreate } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const { isNotificationsSlideoverOpen } = useDashboard()
const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
    if (!newUser) {
        router.push('/auth/login')
    }
}, { immediate: true })

const { transactions, loading, error, fetchTransactions, createTransaction, deleteTransaction } = useTransactions()
const { categories, fetchCategories } = useCategories()
const { fundSources, fetchFundSources } = useFundSources()

// Filters
const typeFilter = ref<TransactionType | ''>('')
const categoryFilter = ref<string>('')
const searchQuery = ref('')

// Modal state
const isModalOpen = ref(false)
const formData = ref<TransactionCreate>({
    type: 'expense',
    amount: 0,
    description: '',
    category_id: null,
    source_fund_id: null,
    destination_fund_id: null,
    transaction_date: new Date().toISOString(),
    notes: ''
})

// Fetch data on mount
onMounted(async () => {
    await Promise.all([
        fetchTransactions({ limit: 50 }),
        fetchCategories(),
        fetchFundSources()
    ])
})

// Filtered transactions
const filteredTransactions = computed(() => {
    let result = transactions.value

    if (typeFilter.value) {
        result = result.filter(t => t.type === typeFilter.value)
    }

    if (categoryFilter.value) {
        result = result.filter(t => t.category_id === categoryFilter.value)
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(t =>
            t.description?.toLowerCase().includes(query) ||
            t.notes?.toLowerCase().includes(query)
        )
    }

    return result
})

// Filtered categories based on selected type
const filteredCategories = computed(() => {
    if (!formData.value.type || formData.value.type === 'transfer') {
        return categories.value
    }
    return categories.value.filter(c => c.type === formData.value.type)
})

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

function formatDate(dateString: string) {
    return format(new Date(dateString), 'd MMM yyyy, HH:mm', { locale: idLocale })
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

const openNewModal = () => {
    formData.value = {
        type: 'expense',
        amount: 0,
        description: '',
        category_id: null,
        source_fund_id: null,
        destination_fund_id: null,
        transaction_date: new Date().toISOString().slice(0, 16),
        notes: ''
    }
    isModalOpen.value = true
}

const handleSubmit = async () => {
    if (!formData.value.amount || formData.value.amount <= 0) {
        toast.add({ title: 'Jumlah harus lebih dari 0', color: 'error' })
        return
    }

    // Validate based on type
    if (formData.value.type === 'income' && !formData.value.source_fund_id) {
        toast.add({ title: 'Pilih sumber dana tujuan', color: 'error' })
        return
    }

    if (formData.value.type === 'expense' && !formData.value.source_fund_id) {
        toast.add({ title: 'Pilih sumber dana', color: 'error' })
        return
    }

    if (formData.value.type === 'transfer' && (!formData.value.source_fund_id || !formData.value.destination_fund_id)) {
        toast.add({ title: 'Pilih sumber dana asal dan tujuan', color: 'error' })
        return
    }

    // Adjust fund mapping based on type
    const payload: TransactionCreate = {
        ...formData.value,
        transaction_date: new Date(formData.value.transaction_date).toISOString()
    }

    // For income, the fund is destination
    if (formData.value.type === 'income') {
        payload.destination_fund_id = formData.value.source_fund_id
        payload.source_fund_id = null
    }

    const result = await createTransaction(payload)

    if (result) {
        toast.add({ title: 'Transaksi berhasil ditambahkan', color: 'success' })
        isModalOpen.value = false
        await fetchFundSources() // Refresh balances
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return

    const success = await deleteTransaction(id)
    if (success) {
        toast.add({ title: 'Transaksi berhasil dihapus', color: 'success' })
        await fetchFundSources() // Refresh balances
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const columns: TableColumn<Transaction>[] = [
    { accessorKey: 'transaction_date', header: 'Tanggal' },
    { accessorKey: 'type', header: 'Tipe' },
    { accessorKey: 'description', header: 'Deskripsi' },
    { accessorKey: 'category', header: 'Kategori' },
    { accessorKey: 'amount', header: 'Jumlah' },
    { accessorKey: 'fund', header: 'Sumber Dana' },
    { accessorKey: 'actions', header: '' }
]
</script>

<template>
    <UDashboardPanel id="transactions">
        <template #header>
            <UDashboardNavbar title="Transaksi" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Transaksi
                    </UButton>
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UInput v-model="searchQuery" placeholder="Cari transaksi..." icon="i-lucide-search" class="w-64" />

                    <USelectMenu v-model="typeFilter" :items="[
                        { label: 'Semua Tipe', value: '' },
                        { label: 'Pemasukan', value: 'income' },
                        { label: 'Pengeluaran', value: 'expense' },
                        { label: 'Transfer', value: 'transfer' }
                    ]" value-key="value" class="w-40" />

                    <USelectMenu v-model="categoryFilter" :items="[
                        { label: 'Semua Kategori', value: '' },
                        ...categories.map(c => ({ label: c.name, value: c.id }))
                    ]" value-key="value" class="w-48" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <UCard v-if="loading" class="animate-pulse">
                <div class="space-y-4">
                    <div v-for="i in 5" :key="i" class="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </UCard>

            <UCard v-else-if="filteredTransactions.length === 0">
                <div class="text-center py-12">
                    <UIcon name="i-lucide-receipt" class="size-16 text-muted mx-auto mb-4" />
                    <h3 class="text-lg font-semibold mb-2">Belum ada transaksi</h3>
                    <p class="text-muted mb-4">Mulai catat transaksi keuangan Anda</p>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Transaksi Pertama
                    </UButton>
                </div>
            </UCard>

            <UCard v-else :ui="{ body: 'p-0!' }">
                <UTable :data="filteredTransactions" :columns="columns">
                    <template #transaction_date-cell="{ row }">
                        <span class="text-sm">{{ formatDate(row.original.transaction_date) }}</span>
                    </template>

                    <template #type-cell="{ row }">
                        <UBadge :color="getTypeColor(row.original.type)" variant="subtle">
                            {{ getTypeLabel(row.original.type) }}
                        </UBadge>
                    </template>

                    <template #description-cell="{ row }">
                        <span class="font-medium">{{ row.original.description || '-' }}</span>
                    </template>

                    <template #category-cell="{ row }">
                        <span v-if="row.original.category">
                            {{ row.original.category.name }}
                        </span>
                        <span v-else class="text-muted">-</span>
                    </template>

                    <template #amount-cell="{ row }">
                        <span class="font-semibold" :class="{
                            'text-success': row.original.type === 'income',
                            'text-error': row.original.type === 'expense',
                            'text-info': row.original.type === 'transfer'
                        }">
                            {{ row.original.type === 'expense' ? '-' : '+' }}{{ formatCurrency(row.original.amount) }}
                        </span>
                    </template>

                    <template #fund-cell="{ row }">
                        <div class="text-sm">
                            <span v-if="row.original.source_fund">{{ row.original.source_fund.name }}</span>
                            <span v-if="row.original.type === 'transfer'" class="text-muted mx-1">→</span>
                            <span v-if="row.original.destination_fund">{{ row.original.destination_fund.name }}</span>
                        </div>
                    </template>

                    <template #actions-cell="{ row }">
                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                            @click="handleDelete(row.original.id)" />
                    </template>
                </UTable>
            </UCard>
        </template>
    </UDashboardPanel>

    <!-- Add Transaction Modal -->
    <UModal v-model:open="isModalOpen">
        <template #content>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">Tambah Transaksi</h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isModalOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                    <UFormField label="Tipe Transaksi" required>
                        <USelectMenu v-model="formData.type" :items="[
                            { label: 'Pemasukan', value: 'income' },
                            { label: 'Pengeluaran', value: 'expense' },
                            { label: 'Transfer', value: 'transfer' }
                        ]" value-key="value" class="w-full" />
                    </UFormField>

                    <UFormField label="Jumlah" required>
                        <UInput v-model.number="formData.amount" type="number" placeholder="0" class="w-full" />
                    </UFormField>

                    <UFormField label="Deskripsi">
                        <UInput v-model="formData.description" placeholder="Deskripsi transaksi" class="w-full" />
                    </UFormField>

                    <UFormField v-if="formData.type !== 'transfer'" label="Kategori">
                        <USelectMenu v-model="formData.category_id"
                            :items="filteredCategories.map(c => ({ label: c.name, value: c.id }))" value-key="value"
                            placeholder="Pilih kategori" class="w-full" />
                    </UFormField>

                    <UFormField
                        :label="formData.type === 'transfer' ? 'Dari Sumber Dana' : (formData.type === 'income' ? 'Ke Sumber Dana' : 'Dari Sumber Dana')"
                        required>
                        <USelectMenu v-model="formData.source_fund_id"
                            :items="fundSources.map(f => ({ label: `${f.name} (${formatCurrency(f.balance)})`, value: f.id }))"
                            value-key="value" placeholder="Pilih sumber dana" class="w-full" />
                    </UFormField>

                    <UFormField v-if="formData.type === 'transfer'" label="Ke Sumber Dana" required>
                        <USelectMenu v-model="formData.destination_fund_id"
                            :items="fundSources.filter(f => f.id !== formData.source_fund_id).map(f => ({ label: `${f.name} (${formatCurrency(f.balance)})`, value: f.id }))"
                            value-key="value" placeholder="Pilih sumber dana tujuan" class="w-full" />
                    </UFormField>

                    <UFormField label="Tanggal" required>
                        <UInput v-model="formData.transaction_date" type="datetime-local" class="w-full" />
                    </UFormField>

                    <UFormField label="Catatan">
                        <UTextarea v-model="formData.notes" placeholder="Catatan tambahan" class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton type="button" color="neutral" variant="ghost" @click="isModalOpen = false">
                            Batal
                        </UButton>
                        <UButton type="submit" :loading="loading">
                            Simpan
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>
