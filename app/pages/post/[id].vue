<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const postId = route.params.id
const { toast } = useToast()

const { data: post, error, refresh } = await useFetch(`/api/posts/${postId}`)
const { data: session } = await useFetch('/api/auth/me')
const { data: matches } = await useFetch('/api/ai/match', { query: { postId } })

// Check if current user has already claimed this post
const { data: userClaims } = await useFetch('/api/claims/my')
const hasUserClaimed = computed(() => {
  if (!session.value?.user || !userClaims.value?.data) return false
  return userClaims.value.data.some((claim: any) => claim.postId === Number(postId))
})

// Fetch claims for this post (if current user is the author)
const { data: postClaimsData, refresh: refreshClaims } = await useFetch(`/api/posts/${postId}/claims`)
const postClaims = computed(() => postClaimsData.value?.data || [])
const pendingClaims = computed(() => postClaims.value.filter((c: any) => c.status === 'pending'))

const newComment = ref('')
const isSubmittingComment = ref(false)
const isSubmittingClaim = ref(false)
const claimMessage = ref('')
const showClaimDialog = ref(false)
const processingClaimId = ref<number | null>(null)
const showReviewModal = ref(false)

const isAuthor = computed(() => session.value?.user?.id === post.value?.authorId)
const isLoggedIn = computed(() => !!session.value?.user)

// Determine if there is an approved claim relevant to the current user
const approvedClaimId = computed(() => {
  if (isAuthor.value) {
     const claim = postClaimsData.value?.data?.find((c: any) => c.status === 'approved')
     return claim?.id
  }
  // Check user claims
  const claim = userClaims.value?.data?.find((c: any) => c.postId === Number(postId) && c.status === 'approved')
  return claim?.id
})

// Check if already reviewed
const { data: reviewCheck, refresh: refreshReviewCheck } = await useFetch('/api/reviews/check', {
  query: { claimId: approvedClaimId },
  immediate: !!approvedClaimId.value,
  watch: [approvedClaimId]
})

function handleReviewSuccess() {
  refreshReviewCheck()
  refresh() 
}

async function submitComment() {
  if (!newComment.value.trim()) return
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  
  isSubmittingComment.value = true
  try {
    await $fetch('/api/comments', {
      method: 'POST',
      body: {
        postId: post.value?.id,
        content: newComment.value,
      },
    })
    
    newComment.value = ''
    refresh()
    toast({
      title: '评论发布成功',
      description: '您的评论已添加',
      toast: 'soft-success',
      leading: 'i-ph-check-circle-bold',
      showProgress: true,
      closable: true
    })
  } catch (e: any) {
    toast({
      title: '评论失败',
      description: e.data?.message || '未知错误',
      toast: 'soft-red',
      leading: 'i-ph-warning-circle-bold',
      showProgress: true,
      closable: true
    })
  } finally {
    isSubmittingComment.value = false
  }
}

async function submitClaim() {
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  
  // Message is now optional - users can submit without writing anything
  
  isSubmittingClaim.value = true
  try {
    await $fetch('/api/claims', {
      method: 'POST',
      body: {
        postId: post.value?.id,
        message: claimMessage.value,
      },
    })
    showClaimDialog.value = false
    claimMessage.value = ''
    
    // Refresh to update claim status
    window.location.reload()
    
    toast({
      title: '申请提交成功',
      description: '请等待发布者审核',
      toast: 'soft-success',
      leading: 'i-ph-check-circle-bold',
      showProgress: true,
      closable: true
    })
  } catch (e: any) {
    toast({
      title: '提交失败',
      description: e.data?.message || '未知错误',
      toast: 'soft-red',
      leading: 'i-ph-warning-circle-bold',
      showProgress: true,
      closable: true
    })
  } finally {
    isSubmittingClaim.value = false
  }
}

async function togglePostLike() {
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  
  try {
    await $fetch('/api/likes/post', {
      method: 'POST',
      body: { postId: post.value?.id },
    })
    refresh()
  } catch (e) {
    // Silent fail or toast
  }
}

async function toggleCommentLike(commentId: number) {
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  
  try {
    await $fetch('/api/likes/comment', {
      method: 'POST',
      body: { commentId },
    })
    refresh()
  } catch (e) {
    // Silent fail
  }
}

async function processClaim(claimId: number, action: 'approve' | 'reject') {
  processingClaimId.value = claimId
  
  try {
    await $fetch(`/api/claims/${claimId}/process`, {
      method: 'POST',
      body: { action },
    })
    
    toast({
      title: action === 'approve' ? '已通过认领申请' : '已拒绝认领申请',
      description: action === 'approve' ? '帖子已标记为已解决' : '申请人已收到通知',
      toast: 'soft-success',
      leading: 'i-ph-check-circle-bold',
     closable: true
    })
    
    // Refresh data
    await refreshClaims()
    await refresh()
  } catch (e: any) {
    toast({
      title: '操作失败',
      description: e.data?.message || '未知错误',
      toast: 'soft-red',
      leading: 'i-ph-warning-circle-bold',
      closable: true
    })
  } finally {
    processingClaimId.value = null
  }
}

</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
    <!-- Error State -->
    <div v-if="error" class="text-center py-20 bg-base-200/50 rounded-xl border border-dashed border-base-300">
      <div class="i-ph-warning-circle text-6xl opacity-50 mx-auto mb-4" />
      <p class="text-lg font-medium">{{ error.data?.message || '帖子不存在' }}</p>
      <NuxtLink to="/" class="btn btn-outline mt-4">返回首页</NuxtLink>
    </div>

    <!-- Post Content -->
    <div v-else-if="post" class="space-y-6">
      
      <!-- Main Card -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <!-- Header Info -->
        <div class="card-body">
          <div class="flex flex-wrap items-center gap-3 mb-2">
             <div 
               class="badge badge-lg gap-1 font-bold"
               :class="post.itemType === 'lost' ? 'badge-warning' : 'badge-success'"
             >
                <span :class="post.itemType === 'lost' ? 'i-ph-magnifying-glass-bold' : 'i-ph-hand-heart-bold'" />
                {{ post.itemType === 'lost' ? '寻物' : '招领' }}
             </div>
             <div 
               class="badge badge-outline"
               :class="post.status === 'resolved' ? 'badge-success' : post.status === 'closed' ? 'badge-error' : 'badge-ghost'"
             >
               {{ post.status === 'resolved' ? '已解决' : post.status === 'closed' ? '已关闭' : '进行中' }}
             </div>
             <span class="text-xs opacity-50 ml-auto">
               ID: #{{ post.id }}
             </span>
          </div>
          
          <h1 class="card-title text-3xl font-bold mb-4 leading-tight">{{ post.title }}</h1>
          
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm opacity-70">
            <NuxtLink :to="`/user/${post.authorId}`" class="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <div class="avatar placeholder">
                <div class="w-6 rounded-full bg-neutral text-neutral-content">
                  <img v-if="post.authorAvatar" :src="post.authorAvatar" :alt="post.authorName" />
                  <span v-else class="text-xs">{{ post.authorName?.[0] }}</span>
                </div>
              </div>
              <span class="font-medium">{{ post.authorName }}</span>
              <span class="text-xs">(@{{ post.authorUsername }})</span>
            </NuxtLink>
            
            <div class="flex items-center gap-1" title="信用分">
              <span class="i-ph-star-fill text-warning" />
              <span>{{ post.authorCreditScore }}</span>
            </div>
            
            <div class="flex items-center gap-1">
              <span class="i-ph-calendar-blank" />
              <span>{{ new Date(post.createdAt).toLocaleString('zh-CN') }}</span>
            </div>
          </div>

          <div class="divider my-2"></div>

          <!-- Review Alert -->
          <div v-if="approvedClaimId && reviewCheck && !reviewCheck.hasReviewed" class="alert alert-success shadow-sm mb-6">
            <span class="i-ph-star-fill text-xl"></span>
            <div class="flex-1">
                <h3 class="font-bold">交易已完成</h3>
                <div class="text-xs">请评价对方，帮助社区建立信任！</div>
            </div>
            <button class="btn btn-sm bg-base-100 hover:bg-base-200 border-0" @click="showReviewModal = true">去评价</button>
          </div>

          <!-- content & images -->
          <div class="space-y-6">
            <div v-if="post.images?.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <img
                v-for="(img, i) in post.images"
                :key="i"
                :src="img"
                :alt="`图片 ${i + 1}`"
                class="w-full aspect-square object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-90 transition-opacity"
              />
            </div>

            <div class="prose dark:prose-invert max-w-none">
              <p class="whitespace-pre-wrap text-lg leading-relaxed">{{ post.content }}</p>
            </div>
            
            <div class="flex flex-wrap gap-4 pt-4">
                <div v-if="post.location" class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-base-200 text-sm font-medium">
                  <span class="i-ph-map-pin text-primary" />
                  {{ post.location }}
                </div>
                <div v-if="post.categoryName" class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-base-200 text-sm font-medium">
                  <span class="i-ph-tag text-primary" />
                  {{ post.categoryName }}
                </div>
                <div v-if="post.contactInfo" class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-base-200 text-sm font-medium">
                  <span class="i-ph-phone text-primary" />
                  {{ post.contactInfo }}
                </div>
                <!-- AI Image Tags Display -->
                <div v-if="post.imageTags" class="w-full mt-2 pt-2 border-t border-base-200">
                    <div class="flex flex-wrap gap-2 text-xs">
                        <span class="opacity-70 flex items-center gap-1">
                            <span class="i-ph-robot text-primary"></span> AI Tagging:
                        </span>
                        <span 
                            v-for="tag in post.imageTags.split(',')" 
                            :key="tag" 
                            class="badge badge-sm badge-neutral gap-1"
                        >
                            {{ tag }}
                        </span>
                    </div>
                </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-4">
               <button 
                 class="btn btn-ghost gap-2"
                 :class="post.userLiked ? 'text-error' : ''"
                 @click="togglePostLike"
               >
                  <span :class="post.userLiked ? 'i-ph-heart-fill text-xl' : 'i-ph-heart text-xl'" />
                  {{ post.likeCount || 0 }} 赞
               </button>
               <div class="flex items-center gap-2 opacity-70 px-4 py-2">
                  <span class="i-ph-chat-circle text-xl" />
                  {{ post.comments?.length || 0 }} 评论
               </div>
            </div>
            
            <button
              v-if="!isAuthor && post.status === 'pending'"
              class="btn shadow-sm"
              :class="hasUserClaimed ? 'btn-disabled opacity-50' : 'btn-primary'"
              :disabled="hasUserClaimed"
              @click="isLoggedIn ? (hasUserClaimed ? null : showClaimDialog = true) : navigateTo('/login')"
            >
              <span :class="hasUserClaimed ? 'i-ph-check-circle mr-2' : 'i-ph-hand-pointing mr-2'" />
              {{ hasUserClaimed ? '已提交申请' : '认领物品' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Claim Requests (Author Only) -->
      <div v-if="isAuthor && pendingClaims.length > 0" class="rounded-xl border border-orange-500/20 bg-orange-500/5 overflow-hidden">
        <div class="px-6 py-4 border-b border-orange-500/10 flex items-center gap-2">
          <span class="i-ph-hand-stop-fill text-orange-500 text-xl" />
          <h3 class="font-bold text-lg">待审核的认领申请</h3>
          <span class="badge badge-warning ml-auto">{{ pendingClaims.length }}</span>
        </div>
        <div class="p-6 space-y-4">
          <div
            v-for="claim in pendingClaims"
            :key="claim.id"
            class="card bg-base-100 border border-base-300 shadow-sm"
          >
            <div class="card-body p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 flex-1">
                  <!-- Avatar -->
                  <div class="avatar">
                    <div class="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img v-if="claim.claimerAvatar" :src="claim.claimerAvatar" :alt="claim.claimerName" />
                      <div v-else class="bg-neutral text-neutral-content flex items-center justify-center text-lg">
                        {{ claim.claimerName?.[0] }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Claim Info -->
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <NuxtLink :to="`/user/${claim.claimerId}`" class="font-bold hover:text-primary">
                        {{ claim.claimerName }}
                      </NuxtLink>
                      <span class="text-xs opacity-50">@{{ claim.claimerUsername }}</span>
                      <div class="flex items-center gap-1 text-xs">
                        <span class="i-ph-star-fill text-warning" />
                        <span>{{ claim.claimerCreditScore }}</span>
                      </div>
                    </div>
                    
                    <div v-if="claim.message" class="bg-base-200 p-3 rounded-lg mb-2">
                      <p class="text-sm opacity-90">"{{ claim.message }}"</p>
                    </div>
                    <div v-else class="text-xs opacity-50 mb-2">
                      未填写留言
                    </div>
                    
                    <div class="text-xs opacity-50">
                      申请时间：{{ new Date(claim.createdAt).toLocaleString('zh-CN') }}
                    </div>
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="flex flex-col gap-2 flex-shrink-0">
                  <button
                    class="btn btn-success btn-sm gap-1"
                    :class="{ 'loading': processingClaimId === claim.id }"
                    :disabled="processingClaimId !== null"
                    @click="processClaim(claim.id, 'approve')"
                  >
                    <span class="i-ph-check-bold" />
                    通过
                  </button>
                  <button
                    class="btn btn-error btn-sm gap-1"
                    :class="{ 'loading': processingClaimId === claim.id }"
                    :disabled="processingClaimId !== null"
                    @click="processClaim(claim.id, 'reject')"
                  >
                    <span class="i-ph-x-bold" />
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Matches -->
      <div v-if="matches?.matches?.length" class="rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
        <div class="px-6 py-4 border-b border-purple-500/10 flex items-center gap-2">
          <span class="i-ph-sparkle-fill text-purple-500 text-xl" />
          <h3 class="font-bold text-lg">AI 智能匹配</h3>
          <span class="text-xs opacity-50 ml-auto">可能相关的其他信息</span>
        </div>
        
        <div class="p-4 space-y-3">
          <NuxtLink
            v-for="match in matches.matches"
            :key="match.id"
            :to="`/post/${match.id}`"
            class="block p-4 rounded-lg border border-base-300 bg-base-100 hover:border-purple-500/50 hover:shadow-md transition-all group"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="font-medium truncate group-hover:text-purple-600 transition-colors">{{ match.title }}</div>
                <div class="text-sm opacity-70 line-clamp-1">{{ match.content }}</div>
              </div>
              <div class="badge badge-accent badge-soft">{{ match.matchScore }}% 相似</div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2 mb-6">
            <span class="i-ph-chats-circle" />
            评论 ({{ post.comments?.length || 0 }})
          </h2>
        
          <div class="space-y-6">
             <!-- Comment Form -->
            <div v-if="isLoggedIn" class="flex gap-4 mb-8">
              <div class="avatar placeholder">
                <div class="w-10 rounded-full bg-neutral text-neutral-content">
                   <img v-if="session?.user?.avatar" :src="session.user.avatar" />
                   <span v-else>{{ session?.user?.name?.[0] }}</span>
                </div>
              </div>
              <div class="flex-1 space-y-3">
                <textarea
                  v-model="newComment"
                  placeholder="写下你的评论..."
                  class="textarea textarea-bordered w-full"
                  rows="3"
                ></textarea>
                <div class="flex justify-end">
                  <button
                    class="btn btn-primary"
                    :class="{ 'loading': isSubmittingComment }"
                    :disabled="!newComment.trim() || isSubmittingComment"
                    @click="submitComment"
                  >
                    发表评论
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else class="alert alert-info mb-6">
               <span class="i-ph-info text-xl"></span>
               <div>
                 <h3 class="font-bold">请先登录</h3>
                 <div class="text-xs">登录后即可参与评论讨论</div>
               </div>
               <NuxtLink to="/login" class="btn btn-sm btn-outline">去登录</NuxtLink>
            </div>

            <!-- Comments List -->
            <div class="space-y-6">
              <div
                v-for="comment in post.comments"
                :key="comment.id"
                class="group flex gap-4"
              >
                <div class="avatar placeholder mt-1">
                  <div class="w-8 rounded-full bg-neutral text-neutral-content">
                    <img v-if="comment.authorAvatar" :src="comment.authorAvatar" :alt="comment.authorName" />
                    <span v-else class="text-xs">{{ comment.authorName?.[0] }}</span>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm">{{ comment.authorName }}</span>
                      <span class="text-xs opacity-50">{{ new Date(comment.createdAt).toLocaleDateString('zh-CN') }}</span>
                    </div>
                  </div>
                  
                  <p class="opacity-90 leading-relaxed">{{ comment.content }}</p>
                  
                  <div class="flex items-center gap-4 mt-2">
                    <button
                      class="flex items-center gap-1 text-xs transition-colors hover:text-error"
                       :class="comment.userLiked ? 'text-error' : 'opacity-70'"
                      @click="toggleCommentLike(comment.id)"
                    >
                      <span :class="comment.userLiked ? 'i-ph-heart-fill' : 'i-ph-heart'" />
                      {{ comment.likeCount || 0 }} 赞
                    </button>
                    <button class="text-xs opacity-70 hover:opacity-100">回复</button>
                  </div>
                </div>
              </div>
              
              <div v-if="!post.comments?.length" class="text-center py-12">
                <div class="i-ph-chat-teardrop-dots text-4xl opacity-30 mx-auto mb-3" />
                <p class="opacity-50">暂无评论，快来抢沙发吧！</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Claim Dialog -->
    <div class="modal" :class="{ 'modal-open': showClaimDialog }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">提交认领申请</h3>
        <p class="py-4 opacity-70">请详细描述物品特征、丢失时间地点等细节，以证明物品所有权。</p>
        
        <div class="py-4">
             <textarea
              v-model="claimMessage"
              placeholder="例如：手机壳背面有个皮卡丘贴纸，锁屏是..."
              class="textarea textarea-bordered w-full h-32"
            ></textarea>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showClaimDialog = false">取消</button>
          <button 
            class="btn btn-primary" 
            :class="{ 'loading': isSubmittingClaim }"
            @click="submitClaim"
          >
            提交申请
          </button>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <ReviewModal 
      v-if="approvedClaimId && showReviewModal"
      :show="showReviewModal" 
      :claim-id="approvedClaimId"
      @close="showReviewModal = false"
      @success="handleReviewSuccess"
    />
  </div>
</template>
