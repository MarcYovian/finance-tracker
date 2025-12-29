<script setup lang="ts">
definePageMeta({
  layout: false
})

const { signUp, loading, error } = useAuth()
const router = useRouter()
const toast = useToast()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const formError = ref<string | null>(null)

const handleSubmit = async () => {
  formError.value = null

  if (password.value !== confirmPassword.value) {
    formError.value = 'Password tidak sama'
    return
  }

  if (password.value.length < 6) {
    formError.value = 'Password minimal 6 karakter'
    return
  }

  const success = await signUp(email.value, password.value, displayName.value)
  if (success) {
    toast.add({
      title: 'Pendaftaran berhasil!',
      description: 'Silakan cek email Anda untuk verifikasi.',
      color: 'success'
    })
    await router.push('/auth/login')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Finance Tracker
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Buat akun baru
          </p>
        </div>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormField label="Nama" name="displayName">
          <UInput
            v-model="displayName"
            type="text"
            placeholder="Nama Anda"
            icon="i-lucide-user"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            icon="i-lucide-mail"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="Minimal 6 karakter"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Konfirmasi Password" name="confirmPassword" required>
          <UInput
            v-model="confirmPassword"
            type="password"
            placeholder="Ulangi password"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="formError || error"
          color="error"
          variant="subtle"
          :title="formError || error || ''"
          icon="i-lucide-alert-circle"
        />

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
        >
          Daftar
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          Sudah punya akun?
          <NuxtLink to="/auth/login" class="text-primary font-medium hover:underline">
            Masuk di sini
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
