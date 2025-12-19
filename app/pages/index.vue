<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { data: session } = await useFetch('/api/auth/me')

// Filters
const selectedType = ref<'all' | 'lost' | 'found'>('all')
const searchQuery = ref('')
const categoryId = ref<string>('')
const page = ref(1)

const { data: categories } = await useFetch('/api/categories-simple')

// Build query params
const queryParams = computed(() => {
  const params: Record<string, string> = { 
    limit: '12',
    page: page.value.toString()
  }
  if (selectedType.value !== 'all') {
    params.type = selectedType.value
  }
  if (searchQuery.value) {
    params.search = searchQuery.value
  }
  return params
})

// Reset page when filters change
watch([selectedType, searchQuery], () => {
  page.value = 1
})

// Fetch posts
const { data: postsData, pending, refresh } = await useFetch('/api/posts', {
  query: queryParams,
  watch: [queryParams],
})

const posts = computed(() => postsData.value?.data || [])
const totalPages = computed(() => postsData.value?.pagination?.totalPages || 0)

// Like post
async function toggleLike(postId: number, event: Event) {
  event.preventDefault()
  event.stopPropagation()
  
  if (!session.value?.user) {
    navigateTo('/login')
    return
  }
  
  try {
    await $fetch('/api/likes/post', {
      method: 'POST',
      body: { postId },
    })
    refresh()
  } catch (e) {
    console.error('Like failed', e)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <section class="relative overflow-hidden rounded-3xl bg-base-200 px-6 py-16 text-center md:px-12 lg:py-24">
      <div class="relative z-10 mx-auto max-w-2xl space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl">
          校园<span class="text-primary">失物招领</span>平台
        </h1>
        <p class="text-lg opacity-70">
          让每一个遗失的物品都能找到回家的路，让每一次寻找都有温暖的回应。
        </p>
        <div class="flex flex-wrap justify-center gap-4 pt-4">
          <NuxtLink 
            to="/post/new?type=lost" 
            class="btn btn-warning btn-lg min-w-[160px] gap-2 shadow-lg">
            <span class="i-ph-magnifying-glass-bold text-xl" />
            我丢失了
          </NuxtLink>
          <NuxtLink 
            to="/post/new?type=found" 
            class="btn btn-success btn-lg min-w-[160px] gap-2 shadow-lg">
            <span class="i-ph-hand-heart-bold text-xl" />
            我捡到了
          </NuxtLink>
        </div>
      </div>
      
      <!-- Decorative elements -->
      <div class="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
      <div class="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-green-400/10 blur-3xl" />
    </section>

    <!-- Search & Filter Bar -->
    <div class="sticky top-20 z-30 -mx-4 px-4 py-4 backdrop-blur-md bg-base-100/80 md:mx-0 md:px-0 md:rounded-xl border-b md:border border-base-300/40">
      <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
        <!-- Type Tabs -->
        <div class="flex p-1 bg-base-200 rounded-lg w-full md:w-auto">
          <button
            v-for="type in ['all', 'lost', 'found']"
            :key="type"
            @click="selectedType = type as any"
            class="flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all"
            :class="selectedType === type ? 'bg-base-100 shadow ring-1 ring-base-300' : 'opacity-70 hover:opacity-100'"
          >
            {{ type === 'all' ? '全部' : type === 'lost' ? '寻物' : '招领' }}
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:max-w-xs">
          <span class="absolute left-3 top-2.5 opacity-50 i-ph-magnifying-glass" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索物品名称、描述..."
            class="input input-bordered w-full pl-9"
          />
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-[300px] rounded-xl bg-base-200 animate-pulse" />
    </div>

    <!-- Posts Grid -->
    <div v-else-if="posts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="post in posts"
        :key="post.id"
        :to="`/post/${post.id}`"
        class="group relative flex flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 transition-all hover:shadow-lg hover:border-primary/50"
      >
        <!-- Image / Placeholder -->
        <div class="aspect-video w-full overflow-hidden bg-base-200 relative">
          <img
            v-if="post.images?.[0]"
            :src="post.images[0]"
            :alt="post.title"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div v-else class="flex h-full w-full items-center justify-center opacity-20">
            <span class="i-ph-image text-6xl" />
          </div>
          
          <!-- Type Badge -->
          <div class="absolute top-3 left-3">
             <span 
               :class="post.itemType === 'lost' ? 'badge badge-warning' : 'badge badge-success'" 
               class="gap-1 shadow-sm">
                <span :class="post.itemType === 'lost' ? 'i-ph-magnifying-glass-bold' : 'i-ph-hand-heart-bold'" />
                {{ post.itemType === 'lost' ? '寻物' : '招领' }}
             </span>
          </div>
        </div>

        <!-- Content -->
        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h3 class="font-bold line-clamp-1 text-lg group-hover:text-primary transition-colors">
              {{ post.title }}
            </h3>
            <span v-if="post.categoryIcon" class="text-xl" :title="post.categoryName">{{ post.categoryIcon }}</span>
          </div>

          <p class="mb-4 line-clamp-2 text-sm opacity-70 flex-1">
            {{ post.content }}
          </p>

          <div class="p-0 pt-4 mt-auto border-t border-base-300 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs opacity-70">
              <span 
                class="font-medium hover:text-primary hover:opacity-100 transition-colors cursor-pointer" 
                @click.stop.prevent="navigateTo(`/user/${post.authorId}`)">
                {{ post.authorName }}
              </span>
              <span>•</span>
              <span>{{ new Date(post.createdAt).toLocaleDateString('zh-CN') }}</span>
              <span v-if="post.location">• {{ post.location }}</span>
            </div>

            <div class="flex items-center gap-3">
               <button 
                 class="flex items-center gap-1 text-xs font-medium transition-colors hover:text-red-500"
                 :class="post.userLiked ? 'text-red-500' : 'opacity-70'"
                 @click="toggleLike(post.id, $event)"
               >
                 <span :class="post.userLiked ? 'i-ph-heart-fill' : 'i-ph-heart'" />
                 {{ post.likeCount }}
               </button>
               <div class="flex items-center gap-1 text-xs font-medium opacity-70">
                 <span class="i-ph-chat-circle" />
                 {{ post.commentCount }}
               </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <div class="h-24 w-24 rounded-full bg-base-200 flex items-center justify-center mb-6">
        <span class="i-ph-tray text-4xl opacity-50" />
      </div>
      <h3 class="text-xl font-bold mb-2">没有找到相关物品</h3>
      <p class="opacity-70 max-w-sm mx-auto mb-8">
        换个关键词试试，或者去发布一条新的信息。
      </p>
      <NuxtLink to="/post/new" class="btn btn-outline">
        立即发布
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-12">
      <div class="join">
        <button 
          class="join-item btn" 
          :disabled="page <= 1"
          @click="page--"
        >
          «
        </button>
        <button class="join-item btn">第 {{ page }} 页 / 共 {{ totalPages }} 页</button>
        <button 
          class="join-item btn" 
          :disabled="page >= totalPages"
          @click="page++"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>
