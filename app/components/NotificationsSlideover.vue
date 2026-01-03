<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const { isNotificationsSlideoverOpen } = useDashboard()
const {
  notifications,
  unreadCount,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getNotificationIcon,
  getNotificationColorClass
} = useNotifications()

const router = useRouter()
const supabase = useSupabaseClient()

// Fetch notifications when slideover opens
watch(isNotificationsSlideoverOpen, async (open) => {
  if (open) {
    // Get user directly from supabase to avoid SSR timing issues
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      await fetchNotifications()
      subscribeToNotifications()
    }
  }
})

// Also try to fetch on mount if user is already logged in
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id) {
    subscribeToNotifications()
  }
})

onUnmounted(() => {
  unsubscribeFromNotifications()
})

const handleNotificationClick = async (notification: typeof notifications.value[0]) => {
  // Mark as read
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }

  // Navigate to link if exists
  if (notification.link) {
    isNotificationsSlideoverOpen.value = false
    router.push(notification.link)
  }
}

const handleDelete = async (e: Event, notificationId: string) => {
  e.stopPropagation()
  await deleteNotification(notificationId)
}
</script>

<template>
  <USlideover v-model:open="isNotificationsSlideoverOpen" title="Notifikasi">
    <template #header>
      <div class="flex items-center justify-between w-full pr-8">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold text-highlighted">
            Notifikasi
          </h3>
          <span v-if="unreadCount > 0" class="px-2 py-0.5 text-xs font-medium bg-error text-white rounded-full">
            {{ unreadCount }}
          </span>
        </div>
        <UButton
          v-if="unreadCount > 0"
          size="xs"
          variant="ghost"
          color="primary"
          @click="markAllAsRead"
        >
          Tandai semua dibaca
        </UButton>
      </div>
    </template>

    <template #body>
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="flex items-start gap-3 animate-pulse">
          <div class="size-10 rounded-full bg-muted/20" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-muted/20 rounded w-3/4" />
            <div class="h-3 bg-muted/20 rounded w-1/2" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <UIcon name="i-lucide-bell-off" class="size-8 text-muted" />
        </div>
        <h4 class="font-medium text-highlighted mb-1">
          Tidak ada notifikasi
        </h4>
        <p class="text-sm text-muted">
          Anda akan menerima notifikasi saat ada aktivitas penting
        </p>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-1 -mx-3">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="px-3 py-3 rounded-lg hover:bg-elevated/50 cursor-pointer transition-all group relative"
          :class="{ 'bg-primary/5': !notification.is_read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div
              class="size-10 rounded-full flex items-center justify-center flex-shrink-0"
              :class="getNotificationColorClass(notification.color).bg"
            >
              <UIcon
                :name="notification.icon || getNotificationIcon(notification.type)"
                class="size-5"
                :class="getNotificationColorClass(notification.color).text"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="font-medium text-highlighted text-sm line-clamp-1">
                  {{ notification.title }}
                </p>
                <!-- Unread indicator -->
                <div v-if="!notification.is_read" class="size-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              </div>

              <p class="text-sm text-muted line-clamp-2 mt-0.5">
                {{ notification.message }}
              </p>

              <p class="text-xs text-dimmed mt-1">
                {{ formatTimeAgo(new Date(notification.created_at)) }}
              </p>
            </div>

            <!-- Delete Button -->
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              @click="(e: Event) => handleDelete(e, notification.id)"
            />
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
