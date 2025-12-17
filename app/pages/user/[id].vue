<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const userId = Number(route.params.id)
const { data: session } = await useFetch('/api/auth/me')
const isOwnProfile = computed(() => userId === session.value?.user?.id)

// Fetch user data with error handling
const { data: userData, error: userError } = await useFetch(`/api/users/${userId}`, {
  // Don't throw on error, handle it in template
  server: true,
  lazy: false
})

const user = computed(() => userData.value)

// User's posts
const { data: postsData } = await useFetch('/api/posts', {
  query: { authorId: String(userId), limit: '50' },
  // Only fetch if user exists
  immediate: !!userData.value
})
const posts = computed(() => postsData.value?.data || [])

// User's claims (only for own profile)
const { data: claimsData } = isOwnProfile.value ? await useFetch('/api/claims/my') : { data: ref(null) }
const claims = computed(() => claimsData?.value?.data || [])

// Stats
const stats = computed(() => ({
  totalPosts: posts.value.length,
  resolvedPosts: posts.value.filter((p: any) => p.status === 'resolved').length,
  totalClaims: claims.value.length,
  approvedClaims: claims.value.filter((c: any) => c.status === 'approved').length,
}))

const activeTab = ref('posts')

// Debug log
if (process.client) {
  console.log('User ID:', userId)
  console.log('User Data:', userData.value)
  console.log('User Error:', userError.value)
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 py-8">
    <!-- User not found -->
    <div v-if="!user" class="text-center py-20">
      <div class="i-ph-user-circle-x text-6xl opacity-30 mx-auto mb-4" />
      <h2 class="text-2xl font-bold mb-2">用户不存在</h2>
      <p class="opacity-70 mb-6">该用户可能已被删除或不存在</p>
      <NuxtLink to="/" class="btn btn-primary">返回首页</NuxtLink>
    </div>

    <!-- User Profile -->
    <div v-else class="space-y-8">
      <!-- Profile Header -->
      <div class="card bg-base-100 shadow-xl border border-base-300">
        <div class="card-body">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
            <!-- Avatar -->
            <div class="avatar">
              <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                <div v-else class="bg-neutral text-neutral-content flex items-center justify-center text-4xl">
                  {{ user.name?.[0] }}
                </div>
              </div>
            </div>

            <!-- User Info -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-3xl font-bold">{{ user.name }}</h1>
                <div v-if="user.isAdmin" class="badge badge-error gap-1">
                  <span class="i-ph-shield-check-fill" />
                  管理员
                </div>
              </div>
              <p class="text-lg opacity-70 mb-3">@{{ user.username }}</p>
              
              <!-- Stats -->
              <div class="flex flex-wrap gap-4">
                <div class="stat bg-base-200 rounded-lg p-4 min-w-[120px]">
                  <div class="stat-title text-xs">信用分</div>
                  <div class="stat-value text-2xl flex items-center gap-2">
                    <span class="i-ph-star-fill text-warning" />
                    {{ user.creditScore }}
                  </div>
                </div>
                <div class="stat bg-base-200 rounded-lg p-4 min-w-[120px]">
                  <div class="stat-title text-xs">发布</div>
                  <div class="stat-value text-2xl">{{ stats.totalPosts }}</div>
                  <div class="stat-desc">{{ stats.resolvedPosts }} 已解决</div>
                </div>
                <div v-if="isOwnProfile" class="stat bg-base-200 rounded-lg p-4 min-w-[120px]">
                  <div class="stat-title text-xs">认领</div>
                  <div class="stat-value text-2xl">{{ stats.totalClaims }}</div>
                  <div class="stat-desc">{{ stats.approvedClaims }} 已通过</div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="isOwnProfile" class="flex flex-col gap-2">
              <NuxtLink to="/profile" class="btn btn-outline btn-sm">
                <span class="i-ph-gear" />
                编辑资料
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="card bg-base-100 shadow-xl border border-base-300">
        <div class="card-body">
          <!-- Tab Headers -->
          <div role="tablist" class="tabs tabs-bordered">
            <a 
              role="tab" 
              class="tab tab-lg" 
              :class="{ 'tab-active': activeTab === 'posts' }" 
              @click="activeTab = 'posts'"
            >
              <span class="i-ph-newspaper mr-2" />
              发布记录 ({{ posts.length }})
            </a>
            <a 
              v-if="isOwnProfile"
              role="tab" 
              class="tab tab-lg" 
              :class="{ 'tab-active': activeTab === 'claims' }" 
              @click="activeTab = 'claims'"
            >
              <span class="i-ph-hand-pointing mr-2" />
              认领记录 ({{ claims.length }})
            </a>
          </div>

          <!-- Tab Content -->
          <div class="mt-6">
            <!-- Posts Tab -->
            <div v-if="activeTab === 'posts'" class="space-y-4">
              <div v-if="posts.length" class="grid gap-4">
                <NuxtLink
                  v-for="post in posts"
                  :key="post.id"
                  :to="`/post/${post.id}`"
                  class="group flex items-center justify-between p-4 rounded-lg border border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div 
                      class="flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0"
                      :class="post.itemType === 'lost' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'"
                    >
                      <span :class="post.itemType === 'lost' ? 'i-ph-magnifying-glass-bold text-xl' : 'i-ph-hand-heart-bold text-xl'" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-lg group-hover:text-primary transition-colors truncate">
                        {{ post.title }}
                      </h3>
                      <div class="flex items-center gap-3 text-sm opacity-70 mt-1">
                        <span>{{ new Date(post.createdAt).toLocaleDateString('zh-CN') }}</span>
                        <span v-if="post.location" class="flex items-center gap-1">
                          <span class="i-ph-map-pin" />
                          {{ post.location }}
                        </span>
                        <span class="flex items-center gap-1">
                          <span class="i-ph-heart" />
                          {{ post.likeCount }}
                        </span>
                        <span class="flex items-center gap-1">
                          <span class="i-ph-chat-circle" />
                          {{ post.commentCount }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <div 
                      class="badge" 
                      :class="post.status === 'resolved' ? 'badge-success' : post.status === 'closed' ? 'badge-error' : 'badge-ghost'"
                    >
                      {{ post.status === 'resolved' ? '已解决' : post.status === 'closed' ? '已关闭' : '进行中' }}
                    </div>
                    <span class="i-ph-caret-right opacity-50" />
                  </div>
                </NuxtLink>
              </div>
              <div v-else class="text-center py-12 border border-dashed border-base-300 rounded-xl">
                <div class="i-ph-notebook text-4xl opacity-30 mx-auto mb-3" />
                <p class="opacity-70">{{ isOwnProfile ? '你还没有发布任何帖子' : '该用户还没有发布任何帖子' }}</p>
                <NuxtLink v-if="isOwnProfile" to="/post/new" class="btn btn-primary mt-4">立即发布</NuxtLink>
              </div>
            </div>

            <!-- Claims Tab (Own Profile Only) -->
            <div v-if="activeTab === 'claims' && isOwnProfile">
              <div v-if="claims.length" class="grid gap-4">
                <div
                  v-for="claim in claims"
                  :key="claim.id"
                  class="p-4 rounded-lg border border-base-300 bg-base-100"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div class="font-medium">申请认领: {{ claim.postTitle }}</div>
                    <div 
                      class="badge" 
                      :class="claim.status === 'approved' ? 'badge-success' : claim.status === 'rejected' ? 'badge-error' : 'badge-warning'"
                    >
                      {{ claim.status === 'approved' ? '已通过' : claim.status === 'rejected' ? '已拒绝' : '审核中' }}
                    </div>
                  </div>
                  <p class="text-sm opacity-70 bg-base-200 p-3 rounded">
                    "{{ claim.message }}"
                  </p>
                  <div class="text-xs opacity-50 mt-2 text-right">
                    {{ new Date(claim.createdAt).toLocaleString('zh-CN') }}
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-12 border border-dashed border-base-300 rounded-xl">
                <div class="i-ph-hand-pointing text-4xl opacity-30 mx-auto mb-3" />
                <p class="opacity-70">暂无认领记录</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
