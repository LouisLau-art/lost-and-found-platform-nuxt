<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const { data: session } = await useFetch('/api/auth/me')
const { toast } = useToast()

// Initialize type from query param
const initialType = route.query.type === 'found' ? 'found' : 'lost'

const form = ref({
  type: initialType as 'lost' | 'found',
  title: '',
  content: '',
  location: '',
  contactInfo: session.value?.user?.email || '',
  categoryId: undefined,
})

const { data: categories } = await useFetch('/api/categories-simple')
const isSubmitting = ref(false)

// Dynamic placeholders
const titlePlaceholder = computed(() =>
  form.value.type === 'lost' ? '例如：丢失黑色钱包' : '例如：捡到一把钥匙'
)
const contentPlaceholder = computed(() =>
  form.value.type === 'lost'
    ? '请详细描述物品特征、丢失的时间和地点等信息...'
    : '请详细描述物品特征、捡到的时间和地点等信息...'
)

// Watch session to update contact info
watch(() => session.value?.user?.email, (email) => {
  if (email && !form.value.contactInfo) {
    form.value.contactInfo = email
  }
})

const imagePreview = ref<string | null>(null)
const imageEmbedding = ref<number[] | null>(null)
const imageTags = ref<string[]>([])
const isAnalyzing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Handle file selection
async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 1. Preview immediately
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // 2. Try AI analysis in background (don't block the user)
  isAnalyzing.value = true
  imageEmbedding.value = null
  imageTags.value = []

  try {
    const formData = new FormData()
    formData.append('image', file)
    
    toast({
       title: '正在进行AI视觉分析...',
       description: file.size > 500000 ? '压缩中...' : '提取图片特征中',
       toast: 'soft-info',
       duration: 5000
    })

    const result = await $fetch<{ success: boolean; embedding?: number[]; tags?: string[]; warning?: string }>('/api/upload/analyze', {
      method: 'POST',
      body: formData
    })

    if (result.success) {
        if (result.embedding && result.embedding.length > 0) {
            imageEmbedding.value = result.embedding
        }
        if (result.tags && result.tags.length > 0) {
            imageTags.value = result.tags
            toast({
                title: 'AI分析完成',
                description: `识别到: ${imageTags.value.join(', ')}`,
                toast: 'soft-success',
                leading: 'i-ph-sparkle-fill'
            })
        } else if (result.warning) {
            toast({
                title: '分析跳过', 
                description: result.warning, 
                toast: 'soft-warning'
            })
        }
    }
  } catch (e) {
    console.error('AI Analysis failed:', e)
    // Silent fail - AI is optional
  } finally {
    isAnalyzing.value = false
  }
}

function removeImage() {
  imagePreview.value = null
  imageEmbedding.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function handleSubmit() {
  if (!session.value?.user) {
    toast({
      title: '请先登录',
      toast: 'soft-yellow',
      leading: 'i-ph-warning-bold',
      closable: true
    })
    navigateTo('/login')
    return
  }

  if (!form.value.title || !form.value.content) {
    toast({
      title: '请填写标题和描述',
      toast: 'soft-yellow',
      leading: 'i-ph-warning-bold',
      closable: true
    })
    return
  }

  isSubmitting.value = true

  try {
    const result = await $fetch<{ success: boolean; post: { id: number } }>('/api/posts', {
      method: 'POST',
      body: {
        title: form.value.title,
        content: form.value.content,
        itemType: form.value.type,
        location: form.value.location || null,
        contactInfo: form.value.contactInfo || null,
        categoryId: form.value.categoryId ? Number(form.value.categoryId) : null,


        images: imagePreview.value ? [imagePreview.value] : [],
        imageEmbedding: imageEmbedding.value,
        imageTags: imageTags.value.length > 0 ? imageTags.value.join(',') : null,
      },
    })

    if (result.success) {
      toast({
        title: '发布成功',
        toast: 'soft-success',
        leading: 'i-ph-check-circle-bold',
        closable: true
      })
      navigateTo(`/post/${result.post.id}`)
    } else {
        throw new Error('Server returned unsuccessful status')
    }
  } catch (e: any) {
    console.error('Submit failed:', e)
    toast({
      title: '发布失败',
      description: e.data?.message || e.message || '未知错误',
      toast: 'soft-red',
      leading: 'i-ph-warning-circle-bold',
      closable: true
    })
    isSubmitting.value = false // Only reset on error. On success, keep it true until navigation completes
  }
  // Remove finally block to prevent blinking if we are navigating away
}

</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4 sm:px-0">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">发布信息</h1>
      <p class="opacity-70">填写物品详情，帮助快速找回或归还</p>
    </div>

    <!-- Login prompt -->
    <div v-if="!session?.user" role="alert" class="alert alert-warning mb-6">
      <span class="i-ph-info text-xl"></span>
      <div>
        <h3 class="font-bold">请先登录</h3>
        <div class="text-xs">您需要登录后才能发布信息</div>
      </div>
      <NuxtLink to="/login" class="btn btn-sm">去登录</NuxtLink>
    </div>

    <!-- Type Selector -->
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div
        class="cursor-pointer rounded-xl border-2 p-6 text-center transition-all hover:scale-[1.02]"
        :class="form.type === 'lost' 
          ? 'border-warning bg-warning text-warning-content shadow-lg scale-[1.02]' 
          : 'border-base-300 hover:border-warning/50 hover:bg-warning/5'"
        @click="form.type = 'lost'"
      >
        <div class="i-ph-magnifying-glass-bold text-4xl mx-auto mb-3" />
        <div class="font-bold text-lg">我丢失了东西</div>
        <div v-if="form.type === 'lost'" class="text-xs mt-2 opacity-80">✓ 已选择</div>
      </div>
      <div
        class="cursor-pointer rounded-xl border-2 p-6 text-center transition-all hover:scale-[1.02]"
        :class="form.type === 'found' 
          ? 'border-success bg-success text-success-content shadow-lg scale-[1.02]' 
          : 'border-base-300 hover:border-success/50 hover:bg-success/5'"
        @click="form.type = 'found'"
      >
        <div class="i-ph-hand-heart-bold text-4xl mx-auto mb-3" />
        <div class="font-bold text-lg">我捡到了东西</div>
        <div v-if="form.type === 'found'" class="text-xs mt-2 opacity-80">✓ 已选择</div>
      </div>
    </div>

    <!-- Form in Card -->
    <div class="card bg-base-100 shadow-xl border border-base-300">
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="space-y-6">

          <!-- Image Upload -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">物品图片</span>
              <span class="label-text-alt opacity-70">支持上传一张图片，帮助辨认</span>
            </label>
            <div class="space-y-3">
              <input 
                type="file" 
                accept="image/*"
                class="file-input file-input-bordered w-full" 
                @change="handleFileSelect"
              />

              <div v-if="imagePreview" class="relative w-full h-48 rounded-lg overflow-hidden border border-base-300 group">
                <img :src="imagePreview" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button type="button" class="btn btn-error btn-sm gap-2" @click="removeImage">
                     <span class="i-ph-trash" />
                     移除图片
                   </button>
                </div>
              </div>
              
              <!-- AI Tags Display -->
              <div v-if="imageTags.length > 0" class="flex flex-wrap gap-2 mt-2">
                 <div class="badge badge-primary gap-1" v-for="tag in imageTags" :key="tag">
                    <span class="i-ph-tag-simple"></span>
                    {{ tag }}
                 </div>
              </div>
              </div>
            </div>


          <!-- Title -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">标题 <span class="text-error">*</span></span>
            </label>
            <input 
              v-model="form.title" 
              type="text" 
              :placeholder="titlePlaceholder" 
              class="input input-bordered w-full input-lg" 
            />
          </div>

          <!-- Category -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">分类</span>
            </label>
            <select v-model="form.categoryId" class="select select-bordered w-full">
              <option disabled :value="undefined">选择物品分类</option>
              <option 
                v-for="cat in (categories as any[])" 
                :key="cat.id" 
                :value="String(cat.id)"
              >
                {{ cat.emoji }} {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Content -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">详细描述 <span class="text-error">*</span></span>
            </label>
            <textarea 
              v-model="form.content"
              :placeholder="contentPlaceholder"
              class="textarea textarea-bordered h-32"
            ></textarea>
          </div>

          <!-- Location -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">地点</span>
            </label>
            <div class="relative">
              <input 
                v-model="form.location"
                type="text"
                placeholder="例如：图书馆三楼"
                class="input input-bordered w-full pl-10"
              />
              <span class="i-ph-map-pin absolute left-3 top-3 text-xl opacity-50" />
            </div>
          </div>

          <!-- Contact -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">联系方式</span>
            </label>
            <div class="relative">
              <input 
                v-model="form.contactInfo"
                type="text"
                placeholder="手机号或微信"
                class="input input-bordered w-full pl-10"
              />
              <span class="i-ph-phone absolute left-3 top-3 text-xl opacity-50" />
            </div>
          </div>

          <!-- Submit -->
          <div class="pt-4">
            <button 
              type="submit" 
              class="btn btn-primary w-full btn-lg"
              :class="{ 'loading': isSubmitting }"
              :disabled="isSubmitting || !session?.user"
            >
              {{ isSubmitting ? '发布中...' : '立即发布' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
