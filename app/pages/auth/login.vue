<script setup lang="ts">
definePageMeta({
  layout: false
})

const { signIn, loading, error } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  const success = await signIn(email.value, password.value)
  if (success) {
    await router.push('/')
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
            Masuk ke akun Anda
          </p>
        </div>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
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
            placeholder="••••••••"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
          icon="i-lucide-alert-circle"
        />

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
        >
          Masuk
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          Belum punya akun?
          <NuxtLink to="/auth/register" class="text-primary font-medium hover:underline">
            Daftar sekarang
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
