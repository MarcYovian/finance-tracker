<script setup lang="ts">
definePageMeta({
    layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const success = ref(false)
const sessionReady = ref(false)
const sessionError = ref<string | null>(null)

// Handle the token exchange when page loads
onMounted(async () => {
    // Check if there's an access_token in the URL hash (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
        // Set the session with the tokens from the URL
        const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        })

        if (setError) {
            sessionError.value = 'Link reset password tidak valid atau sudah kadaluarsa. Silakan request ulang.'
        } else {
            sessionReady.value = true
        }
    } else {
        // Check if user already has an active session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            sessionReady.value = true
        } else {
            sessionError.value = 'Tidak ada sesi aktif. Silakan request reset password dari halaman lupa password.'
        }
    }
})

const validatePasswords = () => {
    passwordError.value = null

    if (password.value.length < 6) {
        passwordError.value = 'Password minimal 6 karakter'
        return false
    }

    if (password.value !== confirmPassword.value) {
        passwordError.value = 'Password tidak sama'
        return false
    }

    return true
}

const handleSubmit = async () => {
    if (!validatePasswords()) {
        return
    }

    loading.value = true
    error.value = null

    try {
        const { error: updateError } = await supabase.auth.updateUser({
            password: password.value,
        })

        if (updateError) {
            error.value = updateError.message
            return
        }

        success.value = true
        toast.add({
            title: 'Password berhasil diubah!',
            description: 'Anda akan dialihkan ke halaman login.',
            color: 'success'
        })

        // Sign out and redirect to login after 2 seconds
        await supabase.auth.signOut()
        setTimeout(() => {
            router.push('/auth/login')
        }, 2000)
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <UCard class="w-full max-w-md">
            <template #header>
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Reset Password
                    </h1>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Masukkan password baru Anda
                    </p>
                </div>
            </template>

            <!-- Success State -->
            <div v-if="success" class="text-center py-6">
                <UIcon name="i-lucide-check-circle" class="size-16 text-success mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Password Berhasil Diubah!
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Mengalihkan ke halaman login...
                </p>
            </div>

            <!-- Session Error State -->
            <div v-else-if="sessionError" class="text-center py-6">
                <UIcon name="i-lucide-alert-triangle" class="size-16 text-warning mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Sesi Tidak Valid
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {{ sessionError }}
                </p>
                <UButton to="/auth/forgot-password" variant="soft">
                    Request Reset Password
                </UButton>
            </div>

            <!-- Loading Session State -->
            <div v-else-if="!sessionReady" class="text-center py-6">
                <UIcon name="i-lucide-loader-2" class="size-12 text-primary mx-auto mb-4 animate-spin" />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Memverifikasi link reset password...
                </p>
            </div>

            <!-- Form State -->
            <form v-else @submit.prevent="handleSubmit" class="space-y-4">
                <UFormField label="Password Baru" name="password" required>
                    <UInput v-model="password" type="password" placeholder="••••••••" icon="i-lucide-lock" size="lg"
                        class="w-full" />
                </UFormField>

                <UFormField label="Konfirmasi Password" name="confirmPassword" required>
                    <UInput v-model="confirmPassword" type="password" placeholder="••••••••" icon="i-lucide-lock"
                        size="lg" class="w-full" />
                </UFormField>

                <UAlert v-if="passwordError" color="error" variant="subtle" :title="passwordError"
                    icon="i-lucide-alert-circle" />

                <UAlert v-if="error" color="error" variant="subtle" :title="error" icon="i-lucide-alert-circle" />

                <UButton type="submit" block size="lg" :loading="loading">
                    Ubah Password
                </UButton>
            </form>

            <template #footer>
                <p class="text-center text-sm text-gray-600 dark:text-gray-400">
                    <NuxtLink to="/auth/login" class="text-primary font-medium hover:underline">
                        Kembali ke login
                    </NuxtLink>
                </p>
            </template>
        </UCard>
    </div>
</template>
