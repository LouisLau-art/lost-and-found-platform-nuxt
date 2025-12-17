<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const form = ref({
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const { toast } = useToast()

async function handleSubmit() {
  if (!form.value.email || !form.value.password) {
    toast({ 
      title: '请填写邮箱和密码', 
      toast: 'soft-yellow',
      leading: 'i-ph-warning-bold',
      closable: true 
    })
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form.value,
    })
    toast({ 
      title: '登录成功', 
      toast: 'soft-success',
      leading: 'i-ph-check-circle-bold',
      closable: true 
    })
    window.location.href = '/'
  } catch (e: any) {
    toast({ 
      title: '登录失败', 
      description: e.data?.message || '账号或密码错误', 
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
  <div class="max-w-md mx-auto py-12">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-4">
        <span class="i-ph-user-circle text-4xl" />
      </div>
      <h1 class="text-2xl font-bold">欢迎回来</h1>
      <p class="opacity-70">登录您的账号以继续</p>
    </div>
    
    <div class="card bg-base-100 shadow-xl border border-base-300">
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">邮箱 <span class="text-error">*</span></span>
            </label>
            <div class="relative">
              <input 
                v-model="form.email" 
                type="email" 
                placeholder="name@example.com" 
                class="input input-bordered w-full pl-10" 
              />
              <span class="i-ph-envelope absolute left-3 top-3 text-xl opacity-50" />
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">密码 <span class="text-error">*</span></span>
              <span class="label-text-alt">
                <NuxtLink to="#" class="text-xs text-primary hover:underline">忘记密码?</NuxtLink>
              </span>
            </label>
            <div class="relative">
              <input 
                v-model="form.password" 
                type="password" 
                placeholder="••••••••" 
                class="input input-bordered w-full pl-10" 
              />
              <span class="i-ph-lock absolute left-3 top-3 text-xl opacity-50" />
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-full mt-2 btn-lg"
            :class="{ 'loading': isSubmitting }"
            :disabled="isSubmitting"
          >
            登录
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-base-300 text-center text-sm opacity-70">
          还没有账号？
          <NuxtLink to="/register" class="text-primary font-medium hover:underline">立即注册</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
