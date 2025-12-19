<script setup lang="ts">
const colorMode = useColorMode()
const { data: session, refresh: refreshSession } = await useFetch('/api/auth/me')

const isLoggedIn = computed(() => !!session.value?.user)

// Unread notifications count with auto-refresh
const unreadCount = ref(0)
const { onRefresh } = useNotifications()

// Function to fetch unread count
async function fetchUnreadCount() {
  if (!isLoggedIn.value) return
  try {
    const data = await $fetch('/api/notifications')
    unreadCount.value = (data as any)?.data?.filter((n: any) => n.status === 'unread').length || 0
  } catch (e) {
    // Silently ignore errors
  }
}

// Fetch initial count and setup refresh mechanisms
if (isLoggedIn.value) {
  await fetchUnreadCount()
  
  // Register for global refresh events (triggered by other components)
  onRefresh(fetchUnreadCount)
  
  // Setup polling for real-time updates (every 30 seconds)
  if (import.meta.client) {
    const pollInterval = setInterval(fetchUnreadCount, 30000)
    
    // Cleanup on unmount
    onUnmounted(() => {
      clearInterval(pollInterval)
    })
  }
}

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  window.location.href = '/'
}

function toggleColorMode() {
  colorMode.preference.value = colorMode.preference.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen bg-base-100 transition-colors duration-300 flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-base-300 bg-base-100/80 backdrop-blur">
      <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold text-primary transition hover:opacity-80">
          <span class="i-ph-magnifying-glass-bold text-2xl" />
          <span>失物招领</span>
        </NuxtLink>
        
        <!-- Navigation -->
        <nav class="flex items-center gap-2 md:gap-3">
          <NuxtLink 
            to="/post/new" 
            class="btn btn-primary btn-sm hidden sm:flex gap-1">
            <span class="i-ph-plus-bold" />
            发布
          </NuxtLink>
          
          <!-- Mobile Publish Icon -->
          <NuxtLink 
            to="/post/new" 
            class="btn btn-primary btn-sm btn-square sm:hidden">
            <span class="i-ph-plus-bold" />
          </NuxtLink>

          <template v-if="isLoggedIn">
            <!-- Notifications -->
            <div class="tooltip tooltip-bottom" data-tip="消息通知">
              <NuxtLink to="/notifications" class="btn btn-ghost btn-sm btn-square indicator">
                <span v-if="unreadCount > 0" class="indicator-item badge badge-error badge-sm text-xs">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
                <span class="i-ph-bell text-xl" />
              </NuxtLink>
            </div>
            
            <!-- User Dropdown -->
            <div class="dropdown dropdown-end">
              <label tabindex="0" class="btn btn-ghost btn-sm gap-2 px-2 cursor-pointer">
                <div class="avatar">
                  <div class="w-6 rounded-full">
                    <img 
                      v-if="session?.user?.avatar"
                      :src="session.user.avatar" 
                      :alt="session.user.name" />
                    <div v-else class="bg-primary text-primary-content flex items-center justify-center">
                      <span class="i-ph-user" />
                    </div>
                  </div>
                </div>
                <span class="hidden sm:inline">{{ session?.user?.name }}</span>
                <span class="i-ph-caret-down text-xs opacity-70" />
              </label>
              <ul tabindex="0" class="dropdown-content z-[100] menu p-2 shadow-xl bg-base-100/95 backdrop-blur-md rounded-box w-52 mt-2 border border-base-300">
                <li class="menu-title">
                  <span>我的账户</span>
                </li>
                <li>
                  <NuxtLink to="/profile">
                    <span class="i-ph-user-circle" />
                    个人中心
                  </NuxtLink>
                </li>
                <div class="divider my-0"></div>
                <li>
                  <a @click="handleLogout" class="text-error">
                    <span class="i-ph-sign-out" />
                    退出登录
                  </a>
                </li>
              </ul>
            </div>
          </template>
          
          <template v-else>
            <div class="flex items-center gap-2">
              <NuxtLink to="/login" class="btn btn-ghost btn-sm">登录</NuxtLink>
              <NuxtLink to="/register" class="btn btn-outline btn-sm">注册</NuxtLink>
            </div>
          </template>

          <div class="w-px h-6 bg-base-300 mx-1"></div>

          <!-- Theme toggle -->
          <ClientOnly>
            <div class="tooltip tooltip-bottom" :data-tip="colorMode.preference.value === 'dark' ? '切换亮色模式' : '切换暗色模式'">
              <button
                class="btn btn-ghost btn-sm btn-square"
                @click="toggleColorMode">
                <span :class="colorMode.preference.value === 'dark' ? 'i-ph-moon-bold' : 'i-ph-sun-bold'" class="text-xl" />
              </button>
            </div>
          </ClientOnly>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 container mx-auto px-4 py-8 w-full max-w-7xl">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-base-300 py-8 mt-auto bg-base-200/50">
      <div class="container mx-auto px-4 text-center opacity-70 text-sm">
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <p>&copy; 2025 校园失物招领平台</p>
          <span class="hidden sm:inline opacity-30">|</span>
          <p>Built with Nuxt + DaisyUI</p>
        </div>
      </div>
    </footer>
    
    <!-- Toast Notifications -->
    <AppToast />
  </div>
</template>
