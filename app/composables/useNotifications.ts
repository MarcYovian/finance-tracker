import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  type:
    | 'budget_alert'
    | 'recurring_reminder'
    | 'goal_progress'
    | 'low_balance'
    | 'financial_insight'
    | 'security'
  title: string
  message: string
  icon: string
  color: 'error' | 'warning' | 'success' | 'primary' | 'info'
  link: string | null
  is_read: boolean
  created_at: string
  metadata: Record<string, unknown>
}

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
let realtimeChannel: RealtimeChannel | null = null

export const useNotifications = () => {
  const supabase = useSupabaseClient()

  // Helper to get user ID
  const getUserId = async (): Promise<string | null> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    return user?.id || null
  }

  // Fetch all notifications
  const fetchNotifications = async (limit = 50) => {
    const userId = await getUserId()
    if (!userId) return

    loading.value = true
    error.value = null

    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { data, error: fetchError } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (fetchError) throw fetchError

      notifications.value = data as Notification[]
      unreadCount.value = notifications.value.filter(n => !n.is_read).length
    } catch (e: unknown) {
      console.error('[Notifications] Error:', e)
      error.value
        = e instanceof Error ? e.message : 'Failed to fetch notifications'
    } finally {
      loading.value = false
    }
  }

  // Get unread count
  const fetchUnreadCount = async () => {
    const userId = await getUserId()
    if (!userId) return

    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { data, error: countError } = await supabase.rpc(
        'get_unread_notifications_count' as any
      )
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (countError) throw countError
      unreadCount.value = data as number
    } catch (e: unknown) {
      console.error('Failed to fetch unread count:', e)
    }
  }

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { error: updateError } = await supabase.rpc(
        'mark_notification_read' as any,
        { p_notification_id: notificationId }
      )
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (updateError) throw updateError

      // Update local state
      const notification = notifications.value.find(
        n => n.id === notificationId
      )
      if (notification && !notification.is_read) {
        notification.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (e: unknown) {
      console.error('Failed to mark notification as read:', e)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { error: updateError } = await supabase.rpc(
        'mark_all_notifications_read' as any
      )
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (updateError) throw updateError

      // Update local state
      notifications.value.forEach((n) => {
        n.is_read = true
      })
      unreadCount.value = 0
    } catch (e: unknown) {
      console.error('Failed to mark all notifications as read:', e)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { error: deleteError } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (deleteError) throw deleteError

      // Update local state
      const index = notifications.value.findIndex(
        n => n.id === notificationId
      )
      if (index !== -1) {
        const notification = notifications.value[index]
        if (notification && !notification.is_read) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }
    } catch (e: unknown) {
      console.error('Failed to delete notification:', e)
    }
  }

  // Subscribe to real-time notifications
  const subscribeToNotifications = async () => {
    const userId = await getUserId()
    if (!userId || realtimeChannel) return

    realtimeChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          notifications.value.unshift(newNotification)
          if (!newNotification.is_read) {
            unreadCount.value++
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          const index = notifications.value.findIndex(
            n => n.id === deletedId
          )
          if (index !== -1) {
            const notification = notifications.value[index]
            if (notification && !notification.is_read) {
              unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
            notifications.value.splice(index, 1)
          }
        }
      )
      .subscribe()
  }

  // Unsubscribe from real-time
  const unsubscribeFromNotifications = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: Notification['type']) => {
    const icons: Record<Notification['type'], string> = {
      budget_alert: 'i-lucide-alert-triangle',
      recurring_reminder: 'i-lucide-clock',
      goal_progress: 'i-lucide-target',
      low_balance: 'i-lucide-wallet',
      financial_insight: 'i-lucide-bar-chart-3',
      security: 'i-lucide-shield'
    }
    return icons[type] || 'i-lucide-bell'
  }

  // Get color class for notification
  const getNotificationColorClass = (color: Notification['color']) => {
    const colors: Record<Notification['color'], { bg: string, text: string }>
      = {
        error: { bg: 'bg-error/10', text: 'text-error' },
        warning: { bg: 'bg-warning/10', text: 'text-warning' },
        success: { bg: 'bg-success/10', text: 'text-success' },
        primary: { bg: 'bg-primary/10', text: 'text-primary' },
        info: { bg: 'bg-info/10', text: 'text-info' }
      }
    return colors[color] || colors.primary
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    getNotificationIcon,
    getNotificationColorClass
  }
}
