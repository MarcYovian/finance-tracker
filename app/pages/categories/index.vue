<script setup lang="ts">
import type { Category, CategoryCreate } from '~/types'

const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect to login if not authenticated
watch(user, (newUser) => {
    if (!newUser) {
        router.push('/auth/login')
    }
}, { immediate: true })

const { categories, incomeCategories, expenseCategories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories()

// Tab state
const activeTab = ref<'income' | 'expense'>('expense')

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<CategoryCreate>({
    name: '',
    type: 'expense',
    parent_id: null,
    color: '#6366f1',
    icon: null,
    description: ''
})

// Fetch data on mount
onMounted(async () => {
    await fetchCategories()
})

const displayedCategories = computed(() => {
    return activeTab.value === 'income' ? incomeCategories.value : expenseCategories.value
})

const parentCategories = computed(() => {
    return displayedCategories.value.filter(c => !c.parent_id)
})

const colorOptions = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]

const openNewModal = () => {
    isEditing.value = false
    editingId.value = null
    formData.value = {
        name: '',
        type: activeTab.value,
        parent_id: null,
        color: '#6366f1',
        icon: null,
        description: ''
    }
    isModalOpen.value = true
}

const openEditModal = (category: Category) => {
    isEditing.value = true
    editingId.value = category.id
    formData.value = {
        name: category.name,
        type: category.type,
        parent_id: category.parent_id || null,
        color: category.color || '#6366f1',
        icon: category.icon,
        description: category.description || ''
    }
    isModalOpen.value = true
}

const handleSubmit = async () => {
    if (!formData.value.name.trim()) {
        toast.add({ title: 'Nama kategori harus diisi', color: 'error' })
        return
    }

    let result

    if (isEditing.value && editingId.value) {
        result = await updateCategory(editingId.value, formData.value)
        if (result) {
            toast.add({ title: 'Kategori berhasil diperbarui', color: 'success' })
        }
    } else {
        result = await createCategory(formData.value)
        if (result) {
            toast.add({ title: 'Kategori berhasil ditambahkan', color: 'success' })
        }
    }

    if (result) {
        isModalOpen.value = false
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return

    const success = await deleteCategory(id)
    if (success) {
        toast.add({ title: 'Kategori berhasil dihapus', color: 'success' })
    } else if (error.value) {
        toast.add({ title: error.value, color: 'error' })
    }
}

const getChildCategories = (parentId: string) => {
    return displayedCategories.value.filter(c => c.parent_id === parentId)
}
</script>

<template>
    <UDashboardPanel id="categories">
        <template #header>
            <UDashboardNavbar title="Kategori" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Kategori
                    </UButton>
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UTabs v-model="activeTab" :items="[
                        { label: 'Pengeluaran', value: 'expense' },
                        { label: 'Pemasukan', value: 'income' }
                    ]" class="-mb-px" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <UCard v-if="loading" class="animate-pulse">
                <div class="space-y-4">
                    <div v-for="i in 4" :key="i" class="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
            </UCard>

            <UCard v-else-if="displayedCategories.length === 0">
                <div class="text-center py-12">
                    <UIcon name="i-lucide-tags" class="size-16 text-muted mx-auto mb-4" />
                    <h3 class="text-lg font-semibold mb-2">Belum ada kategori {{ activeTab === 'income' ? 'pemasukan' :
                        'pengeluaran' }}</h3>
                    <p class="text-muted mb-4">Buat kategori untuk mengorganisir transaksi Anda</p>
                    <UButton icon="i-lucide-plus" @click="openNewModal">
                        Tambah Kategori Pertama
                    </UButton>
                </div>
            </UCard>

            <div v-else class="space-y-4">
                <UCard v-for="parent in parentCategories" :key="parent.id">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: parent.color || '#6366f1' }" />
                            <div>
                                <h3 class="font-semibold text-highlighted">{{ parent.name }}</h3>
                                <p v-if="parent.description" class="text-xs text-muted">{{ parent.description }}</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm"
                                @click="openEditModal(parent)" />
                            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                                @click="handleDelete(parent.id)" />
                        </div>
                    </div>

                    <!-- Child categories -->
                    <div v-if="getChildCategories(parent.id).length > 0" class="mt-4 pl-6 space-y-2">
                        <div v-for="child in getChildCategories(parent.id)" :key="child.id"
                            class="flex items-center justify-between py-2 border-l-2 pl-4"
                            :style="{ borderColor: child.color || '#6366f1' }">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full"
                                    :style="{ backgroundColor: child.color || '#6366f1' }" />
                                <span>{{ child.name }}</span>
                            </div>

                            <div class="flex items-center gap-2">
                                <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs"
                                    @click="openEditModal(child)" />
                                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                                    @click="handleDelete(child.id)" />
                            </div>
                        </div>
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
                            {{ isEditing ? 'Edit Kategori' : 'Tambah Kategori' }}
                        </h3>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isModalOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                    <UFormField label="Nama" required>
                        <UInput v-model="formData.name" placeholder="Nama kategori" class="w-full" />
                    </UFormField>

                    <UFormField label="Tipe" required>
                        <USelectMenu v-model="formData.type" :items="[
                            { label: 'Pengeluaran', value: 'expense' },
                            { label: 'Pemasukan', value: 'income' }
                        ]" value-key="value" class="w-full" />
                    </UFormField>

                    <UFormField label="Kategori Induk">
                        <USelectMenu v-model="formData.parent_id" :items="[
                            { label: 'Tidak ada (Kategori Utama)', value: null },
                            ...parentCategories.filter(c => c.id !== editingId).map(c => ({ label: c.name, value: c.id }))
                        ]" value-key="value" class="w-full" />
                    </UFormField>

                    <UFormField label="Warna">
                        <div class="flex flex-wrap gap-2">
                            <button v-for="color in colorOptions" :key="color" type="button"
                                class="w-8 h-8 rounded-full border-2 transition-all"
                                :class="formData.color === color ? 'border-primary scale-110' : 'border-transparent'"
                                :style="{ backgroundColor: color }" @click="formData.color = color" />
                        </div>
                    </UFormField>

                    <UFormField label="Deskripsi">
                        <UTextarea v-model="formData.description" placeholder="Deskripsi kategori (opsional)"
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
