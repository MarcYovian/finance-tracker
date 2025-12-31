<script setup lang="ts">
import type { FundSource, FundSourceCreate, FundSourceType } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
    if (!newUser) {
        router.push('/auth/login')
    }
}, { immediate: true })

const { fundSources, loading, error, fetchFundSources, createFundSource, updateFundSource, deleteFundSource, getTotalBalance } = useFundSources()

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<FundSourceCreate>({
    name: '',
    type: 'bank',
    balance: 0,
    currency: 'IDR',
    description: ''
})

// Fetch data on mount
onMounted(async () => {
    await fetchFundSources()
})

const fundTypes: { label: string; value: FundSourceType }[] = [
    { label: 'Bank', value: 'bank' },
    { label: 'Tunai', value: 'cash' },
    { label: 'Kartu Kredit', value: 'credit_card' },
    { label: 'E-Wallet', value: 'wallet' },
    { label: 'Lainnya', value: 'other' }
]

const getTypeLabel = (type: FundSourceType) => {
    return fundTypes.find(t => t.value === type)?.label || type
}

const getTypeIcon = (type: FundSourceType) => {
    switch (type) {
        case 'bank': return 'i-lucide-building-2'
        case 'cash': return 'i-lucide-banknote'
        case 'credit_card': return 'i-lucide-credit-card'
        case 'wallet': return 'i-lucide-wallet'
        default: return 'i-lucide-circle-dollar-sign'
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

const openNewModal = () => {
    isEditing.value = false
    editingId.value = null
    formData.value = {
        name: '',
        type: 'bank',
        balance: 0,
        currency: 'IDR',
        description: ''
    }
    isModalOpen.value = true
}

const openEditModal = (fund: FundSource) => {
    isEditing.value = true
    editingId.value = fund.id
    formData.value = {
        name: fund.name,
        type: fund.type,
        balance: fund.balance,
        currency: fund.currency,
        description: fund.description || ''
    }
    isModalOpen.value = true
}

const handleSubmit = async () => {
    if (!formData.value.name.trim()) {
        toast.add({ title: 'Nama sumber dana harus diisi', color: 'error' })
        return
    }

    let result

    if (isEditing.value && editingId.value) {
        result = await updateFundSource(editingId.value, formData.value)
        if (result) {
            toast.add({ title: 'Sumber dana berhasil diperbarui', color: 'success' })
        }
    } else {
        result = await createFundSource(formData.value)
        if (result) {
            toast.add({ title: 'Sumber dana berhasil ditambahkan', color: 'success' })
        }
    }

    if (result) {
        isModalOpen.value = false
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus sumber dana ini?')) return

    const success = await deleteFundSource(id)
    if (success) {
        toast.add({ title: 'Sumber dana berhasil dihapus', color: 'success' })
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const columns = [
    { key: 'name', label: 'Nama' },
    { key: 'type', label: 'Tipe' },
    { key: 'balance', label: 'Saldo' },
    { key: 'description', label: 'Deskripsi' },
    { key: 'actions', label: '' }
]
</script>

<template>
    <UDashboardPanel id="fund-sources">
        <template #header>
            <UDashboardNavbar title="Sumber Dana" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Sumber Dana
                    </UButton>
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-muted">Total Saldo:</span>
                        <span class="font-semibold text-highlighted">{{ formatCurrency(getTotalBalance) }}</span>
                    </div>
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <UCard v-if="loading" class="animate-pulse">
                <div class="space-y-4">
                    <div v-for="i in 3" :key="i" class="h-16 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </UCard>

            <UCard v-else-if="fundSources.length === 0">
                <div class="text-center py-12">
                    <UIcon name="i-lucide-wallet" class="size-16 text-muted mx-auto mb-4" />
                    <h3 class="text-lg font-semibold mb-2">Belum ada sumber dana</h3>
                    <p class="text-muted mb-4">Tambahkan rekening bank, dompet, atau sumber dana lainnya</p>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Sumber Dana Pertama
                    </UButton>
                </div>
            </UCard>

            <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <UCard v-for="fund in fundSources" :key="fund.id"
                    class="cursor-pointer hover:ring-2 hover:ring-primary transition-all" @click="openEditModal(fund)">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 rounded-full bg-primary/10">
                                <UIcon :name="getTypeIcon(fund.type)" class="size-5 text-primary" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-highlighted">{{ fund.name }}</h3>
                                <p class="text-xs text-muted">{{ getTypeLabel(fund.type) }}</p>
                            </div>
                        </div>

                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                            @click.stop="handleDelete(fund.id)" />
                    </div>

                    <div class="mt-4">
                        <p class="text-2xl font-bold text-highlighted">
                            {{ formatCurrency(fund.balance) }}
                        </p>
                        <p v-if="fund.description" class="text-sm text-muted mt-1 truncate">
                            {{ fund.description }}
                        </p>
                    </div>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>

    <!-- Add/Edit Modal -->
    <UModal v-model:open="isModalOpen">
        <template #content>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">
                            {{ isEditing ? 'Edit Sumber Dana' : 'Tambah Sumber Dana' }}
                        </h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isModalOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                    <UFormField label="Nama" required>
                        <UInput v-model="formData.name" placeholder="Contoh: Bank BCA, Dompet, dll" class="w-full" />
                    </UFormField>

                    <UFormField label="Tipe" required>
                        <USelectMenu v-model="formData.type" :items="fundTypes" value-key="value" class="w-full" />
                    </UFormField>

                    <UFormField label="Saldo Awal" required>
                        <CurrencyInput v-model="formData.balance" placeholder="0" />
                    </UFormField>

                    <UFormField label="Deskripsi">
                        <UTextarea v-model="formData.description" placeholder="Deskripsi tambahan (opsional)"
                            class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-2 pt-4">
                        <UButton type="button" color="neutral" variant="ghost" @click="isModalOpen = false">
                            Batal
                        </UButton>
                        <UButton type="submit" :loading="loading">
                            {{ isEditing ? 'Simpan Perubahan' : 'Tambah' }}
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>
