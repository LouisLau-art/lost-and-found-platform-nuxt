<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { triggerRefresh } = useNotifications()
const { data: notificationsData, refresh, pending } = await useFetch('/api/notifications')

const notifications = computed(() => notificationsData.value?.data || [])
const unreadCount = computed(() => notificationsData.value?.unreadCount || 0)

// Mark notification as read
async function markAsRead(id: number) {
  await $fetch(`/api/notifications/${id}/read`, { method: 'POST' })
  refresh()
  triggerRefresh() // Update header badge
}

// Mark all as read
async function markAllAsRead() {
  await $fetch('/api/notifications/read-all', { method: 'POST' })
  refresh()
  triggerRefresh() // Update header badge
}

// Handle notification click
async function handleNotificationClick(notif: any) {
  // Mark as read if unread
  if (notif.status === 'unread') {
    await markAsRead(notif.id)
  }
  
  // Navigate to related post
  if (notif.relatedPostId) {
    navigateTo(`/post/${notif.relatedPostId}`)
  }
}

// Get icon based on notification type
function getIcon(type: string) {
  switch (type) {
    case 'ai_match': return '🤖'
    case 'claim': return '🖐️'
    case 'comment': return '💬'
    default: return '🔔'
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">
        🔔 消息中心
        <span v-if="unreadCount > 0" class="ml-2 px-2 py-1 rounded-full bg-error text-error-content text-sm">
          {{ unreadCount }}
        </span>
      </h1>
      <button
        v-if="unreadCount > 0"
        class="btn btn-ghost btn-sm"
        @click="markAllAsRead"
      >
        ✅ 全部标为已读
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="text-3xl animate-spin">⏳</span>
    </div>

    <!-- Notifications list -->
    <div v-else-if="notifications.length" class="space-y-3">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        :class="[
          'p-4 rounded-lg border cursor-pointer hover:border-primary transition',
          notif.status === 'unread' ? 'border-primary bg-primary/5' : 'border-base-300 opacity-60'
        ]"
        @click="handleNotificationClick(notif)"
      >
        <div class="flex gap-4">
          <div class="flex-shrink-0 text-2xl">
            {{ getIcon(notif.type) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold">{{ notif.title }}</h3>
              <span v-if="notif.status === 'unread'" class="badge badge-error badge-sm">
                新
              </span>
            </div>
            <p class="text-sm opacity-70">{{ notif.content }}</p>
            <p class="text-xs opacity-50 mt-2">
              {{ new Date(notif.createdAt).toLocaleString('zh-CN') }}
            </p>
          </div>
          <div v-if="notif.status === 'unread'" class="flex-shrink-0">
            <button
              class="btn btn-ghost btn-xs"
              @click.stop="markAsRead(notif.id)"
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <span class="text-6xl opacity-30">🔕</span>
      <p class="mt-4 opacity-50">暂无消息</p>
    </div>
  </div>
</template>
