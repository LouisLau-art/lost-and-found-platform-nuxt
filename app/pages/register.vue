<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const form = ref({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)
const { toast } = useToast()

async function handleSubmit() {
  if (!form.value.name || !form.value.username || !form.value.email || !form.value.password) {
    toast({ 
      title: '请填写所有必填项', 
      toast: 'soft-yellow',
      leading: 'i-ph-warning-bold',
      closable: true 
    })
    return
  }

  if (form.value.password.length < 6) {
    toast({ 
      title: '密码至少需要6个字符', 
      toast: 'soft-yellow',
      leading: 'i-ph-warning-bold',
      closable: true 
    })
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    toast({ 
      title: '两次输入的密码不一致', 
      toast: 'soft-yellow',
      leading: 'i-ph-warning-bold',
      closable: true
    })
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.value.name,
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
      },
    })
    toast({ 
      title: '注册成功', 
      toast: 'soft-success',
      leading: 'i-ph-check-circle-bold',
      closable: true
    })
    window.location.href = '/'
  } catch (e: any) {
    toast({ 
      title: '注册失败', 
      description: e.data?.message || '请检查输入信息', 
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
        <span class="i-ph-rocket-launch text-4xl" />
      </div>
      <h1 class="text-2xl font-bold">创建账号</h1>
      <p class="opacity-70">加入校园失物招领平台</p>
    </div>
    
    <div class="card bg-base-100 shadow-xl border border-base-300">
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">姓名 <span class="text-error">*</span></span>
              </label>
              <input v-model="form.name" type="text" placeholder="真实姓名" class="input input-bordered w-full" />
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">用户名 <span class="text-error">*</span></span>
              </label>
               <input v-model="form.username" type="text" placeholder="username" class="input input-bordered w-full" />
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">邮箱 <span class="text-error">*</span></span>
            </label>
             <div class="relative">
               <input v-model="form.email" type="email" placeholder="name@example.com" class="input input-bordered w-full pl-10" />
               <span class="i-ph-envelope absolute left-3 top-3 text-xl opacity-50" />
             </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">密码 <span class="text-error">*</span></span>
            </label>
             <div class="relative">
               <input v-model="form.password" type="password" placeholder="至少6位" class="input input-bordered w-full pl-10" />
               <span class="i-ph-lock absolute left-3 top-3 text-xl opacity-50" />
             </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">确认密码 <span class="text-error">*</span></span>
            </label>
             <div class="relative">
               <input v-model="form.confirmPassword" type="password" placeholder="重复密码" class="input input-bordered w-full pl-10" />
               <span class="i-ph-lock absolute left-3 top-3 text-xl opacity-50" />
             </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-full mt-2 btn-lg"
            :class="{ 'loading': isSubmitting }"
            :disabled="isSubmitting"
          >
            注册
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-base-300 text-center text-sm opacity-70">
          已有账号？
          <NuxtLink to="/login" class="text-primary font-medium hover:underline">立即登录</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
