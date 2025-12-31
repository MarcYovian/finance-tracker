<script setup lang="ts">
definePageMeta({
    layout: false
})

const { resetPassword, loading, error } = useAuth()
const toast = useToast()

const email = ref('')
const emailSent = ref(false)

const handleSubmit = async () => {
    if (!email.value) {
        return
    }

    const success = await resetPassword(email.value)
    if (success) {
        emailSent.value = true
        toast.add({
            title: 'Email terkirim!',
            description: 'Silakan cek inbox email Anda untuk link reset password.',
            color: 'success'
        })
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <UCard class="w-full max-w-md">
            <template #header>
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Lupa Password
                    </h1>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Masukkan email Anda untuk menerima link reset password
                    </p>
                </div>
            </template>

            <div v-if="emailSent" class="text-center py-6">
                <UIcon name="i-lucide-mail-check" class="size-16 text-success mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Email Terkirim!
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Kami telah mengirim link reset password ke <strong>{{ email }}</strong>.
                    Silakan cek inbox email Anda.
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500">
                    Tidak menerima email? Cek folder spam atau
                    <button @click="emailSent = false" class="text-primary hover:underline">
                        coba lagi
                    </button>
                </p>
            </div>

            <form v-else @submit.prevent="handleSubmit" class="space-y-4">
                <UFormField label="Email" name="email" required>
                    <UInput v-model="email" type="email" placeholder="you@example.com" icon="i-lucide-mail" size="lg"
                        class="w-full" />
                </UFormField>

                <UAlert v-if="error" color="error" variant="subtle" :title="error" icon="i-lucide-alert-circle" />

                <UButton type="submit" block size="lg" :loading="loading">
                    Kirim Link Reset
                </UButton>
            </form>

            <template #footer>
                <p class="text-center text-sm text-gray-600 dark:text-gray-400">
                    Ingat password Anda?
                    <NuxtLink to="/auth/login" class="text-primary font-medium hover:underline">
                        Kembali ke login
                    </NuxtLink>
                </p>
            </template>
        </UCard>
    </div>
</template>
