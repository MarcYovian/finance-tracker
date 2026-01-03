<script setup lang="ts">
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()
const { unreadCount, fetchUnreadCount, subscribeToNotifications } = useNotifications()
const user = useSupabaseUser()
const router = useRouter()

// Redirect to login if not authenticated
watch(user, async (newUser) => {
  if (!newUser) {
    router.push('/auth/login')
  } else {
    // Fetch unread count and subscribe to real-time when user is logged in
    await fetchUnreadCount()
    subscribeToNotifications()
  }
}, { immediate: true })

const items = [[{
  label: 'Transaksi Baru',
  icon: 'i-lucide-plus-circle',
  to: '/transactions'
}, {
  label: 'Sumber Dana Baru',
  icon: 'i-lucide-wallet',
  to: '/fund-sources'
}]] satisfies DropdownMenuItem[][]

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 30 }),
  end: new Date()
})
const period = ref<Period>('daily')

// Get user display name
const displayName = computed(() => {
  if (!user.value) return 'User'
  return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'User'
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex flex-col">
            <h1 class="text-xl font-bold text-highlighted">
              Halo, {{ displayName }}! 👋
            </h1>
            <p class="text-sm text-muted">
              Kelola keuanganmu dengan bijak hari ini
            </p>
          </div>
        </template>

        <template #right>
          <HomeDateRangePicker v-model="range" class="hidden md:flex" />

          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip :color="unreadCount > 0 ? 'error' : 'neutral'" :show="unreadCount > 0" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full shadow-lg shadow-primary/20">
              <span class="hidden sm:inline">Tambah</span>
            </UButton>
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Cards -->
        <DashboardStats :range="range" />

        <!-- Charts Row: Cash Flow (2/3) + Spending Chart (1/3) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div class="lg:col-span-2">
            <DashboardChart :period="period" :range="range" />
          </div>
          <div class="lg:col-span-1">
            <DashboardSpendingChart :range="range" />
          </div>
        </div>

        <!-- Transactions + Budgets Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div class="lg:col-span-2">
            <DashboardRecentTransactions :range="range" />
          </div>
          <div class="lg:col-span-1">
            <DashboardBudgets />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
