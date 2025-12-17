<script setup lang="ts">
const props = defineProps<{
  show: boolean
  claimId: number
}>()

const emit = defineEmits(['close', 'success'])

const rating = ref(5)
const comment = ref('')
const isSubmitting = ref(false)
const { toast } = useToast()

async function submitReview() {
  if (rating.value < 1) return
  
  isSubmitting.value = true
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        claimId: props.claimId,
        score: rating.value,
        comment: comment.value
      }
    })
    
    toast({
      title: '评价成功',
      description: '感谢您的反馈！',
      toast: 'soft-success',
      leading: 'i-ph-check-circle-bold',
      closable: true
    })
    
    emit('success')
    emit('close')
  } catch (e: any) {
    toast({
      title: '评价失败',
      description: e.data?.message || '未知错误',
      toast: 'soft-red',
      leading: 'i-ph-warning-circle-bold',
      closable: true
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">📝 评价交易体验</h3>
      
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium opacity-70">评分</label>
          <div class="rating rating-lg gap-1">
            <input 
              v-for="i in 5" 
              :key="i" 
              type="radio" 
              name="rating-2" 
              class="mask mask-star-2 bg-orange-400" 
              :checked="i === rating"
              @click="rating = i" 
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
           <label class="text-sm font-medium opacity-70">评价内容</label>
           <textarea 
             v-model="comment"
             class="textarea textarea-bordered w-full h-24"
             placeholder="写下您对本次交易的感受..."
           ></textarea>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="emit('close')">取消</button>
        <button 
          class="btn btn-primary" 
          :class="{ 'loading': isSubmitting }"
          @click="submitReview"
        >
          提交评价
        </button>
      </div>
    </div>
  </div>
</template>
