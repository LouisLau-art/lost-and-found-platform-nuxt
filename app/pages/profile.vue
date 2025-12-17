<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const route = useRoute()
const { data: session } = await useFetch('/api/auth/me')

// Check if viewing another user's profile
const viewingUserId = route.query.userId ? Number(route.query.userId) : session.value?.user?.id
const isOwnProfile = computed(() => viewingUserId === session.value?.user?.id)

// Fetch user data (either current user or specified user)
const { data: userData } = await useFetch(`/api/users/${viewingUserId}`)
const user = computed(() => userData.value || session.value?.user)

// User's posts
const { data: myPostsData } = await useFetch('/api/posts', {
  query: { authorId: String(viewingUserId), limit: '20' }
})
const myPosts = computed(() => myPostsData.value?.data || [])

// User's claims (only show for own profile)
const { data: myClaimsData } = isOwnProfile.value ? await useFetch('/api/claims/my') : { data: ref(null) }
const myClaims = computed(() => myClaimsData?.value?.data || [])

const activeTab = ref('posts')
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    
    <!-- User Profile Header -->
    <div class="flex items-center gap-6 p-6 rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <div class="relative">
        <div class="avatar">
          <div class="w-24 rounded-full">
            <img v-if="user?.avatar" :src="user.avatar" :alt="user.name" />
            <div v-else class="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-4xl">
              {{ user?.name?.[0] }}
            </div>
          </div>
        </div>
        <div class="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-4 border-base-100"></div>
      </div>
      
      <div class="flex-1 space-y-1">
        <h1 class="text-2xl font-bold">{{ user?.name }}</h1>
        <p class="opacity-70 flex items-center gap-2">
          <span>@{{ user?.username }}</span>
          <span class="w-1 h-1 rounded-full bg-base-content/50"></span>
          <span>{{ user?.email }}</span>
        </p>
        <div class="flex gap-2 mt-3">
          <div class="badge badge-secondary gap-1">
            <span class="i-ph-star-fill text-warning" />
            信用分: {{ user?.creditScore }}
          </div>
          <div class="badge badge-outline">{{ user?.isAdmin ? '管理员' : '普通用户' }}</div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4">
      <div class="p-6 rounded-xl border border-base-300 bg-base-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-primary/10 text-primary">
            <span class="i-ph-file-text-bold text-2xl" />
          </div>
          <div>
            <div class="text-sm opacity-70">已发布</div>
            <div class="text-2xl font-bold">{{ myPosts.length }}</div>
          </div>
        </div>
      </div>
      
      <div class="p-6 rounded-xl border border-base-300 bg-base-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-success/10 text-success">
            <span class="i-ph-hand-pointing-bold text-2xl" />
          </div>
          <div>
            <div class="text-sm opacity-70">已认领</div>
            <div class="text-2xl font-bold">{{ myClaims.length }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- content tabs -->
    <div class="w-full">
      <div role="tablist" class="tabs tabs-bordered">
        <a role="tab" class="tab tab-lg" :class="{ 'tab-active': activeTab === 'posts' }" @click="activeTab = 'posts'">我的发布</a>
        <a role="tab" class="tab tab-lg" :class="{ 'tab-active': activeTab === 'claims' }" @click="activeTab = 'claims'">我的认领</a>
      </div>

      <div class="mt-6">
        <!-- Posts Tab -->
        <div v-if="activeTab === 'posts'" class="space-y-4">
          <div v-if="myPosts.length" class="grid gap-4">
            <NuxtLink
              v-for="post in myPosts"
              :key="post.id"
              :to="`/post/${post.id}`"
              class="group flex items-center justify-between p-4 rounded-lg border border-base-300 bg-base-100 hover:border-primary/50 transition-all"
            >
              <div class="flex items-center gap-4">
                <div 
                  class="flex h-10 w-10 items-center justify-center rounded-full"
                  :class="post.itemType === 'lost' ? 'bg-warning/10 text-warning-content' : 'bg-success/10 text-success-content'"
                >
                  <span :class="post.itemType === 'lost' ? 'i-ph-magnifying-glass-bold' : 'i-ph-hand-heart-bold'" />
                </div>
                <div>
                  <h3 class="font-medium group-hover:text-primary transition-colors">{{ post.title }}</h3>
                  <div class="text-sm opacity-70 mt-0.5">
                    {{ new Date(post.createdAt).toLocaleDateString('zh-CN') }}
                    <span class="mx-1">·</span>
                    {{ post.contactInfo }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="badge" :class="post.status === 'resolved' ? 'badge-primary' : 'badge-ghost'">
                  {{ post.status === 'resolved' ? '已解决' : '进行中' }}
                </div>
                <span class="i-ph-caret-right opacity-50" />
              </div>
            </NuxtLink>
          </div>
          <div v-else class="text-center py-12 border border-dashed border-base-300 rounded-xl">
            <div class="i-ph-notebook text-4xl opacity-50 mx-auto mb-3" />
            <p class="opacity-70">暂无发布记录</p>
            <NuxtLink to="/post/new" class="btn btn-link mt-2">去发布</NuxtLink>
          </div>
        </div>
        
        <!-- Claims Tab -->
        <div v-if="activeTab === 'claims'">
           <div v-if="myClaims.length" class="grid gap-4">
            <div
              v-for="claim in myClaims"
              :key="claim.id"
              class="p-4 rounded-lg border border-base-300 bg-base-100"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="font-medium">申请认领: {{ claim.postTitle }}</div>
                <div 
                  class="badge" 
                  :class="claim.status === 'approved' ? 'badge-success' : claim.status === 'rejected' ? 'badge-error' : 'badge-ghost'"
                >
                  {{ claim.status === 'approved' ? '通过' : claim.status === 'rejected' ? '拒绝' : '审核中' }}
                </div>
              </div>
              <p class="text-sm opacity-70 bg-base-200 p-2 rounded">
                "{{ claim.message }}"
              </p>
              <div class="text-xs opacity-50 mt-2 text-right">
                {{ new Date(claim.createdAt).toLocaleString('zh-CN') }}
              </div>
            </div>
           </div>
           <div v-else class="text-center py-12 border border-dashed border-base-300 rounded-xl">
             <div class="i-ph-hand-pointing text-4xl opacity-50 mx-auto mb-3" />
             <p class="opacity-70">暂无认领记录</p>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
