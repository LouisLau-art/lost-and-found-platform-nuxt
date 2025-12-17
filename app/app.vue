<script setup lang="ts">
useHead({
  title: '校园失物招领平台',
  meta: [
    { name: 'description', content: '让每一个遗失的物品都能找到回家的路' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico' }
  ]
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
body {
  @apply bg-base-100 text-base-content antialiased;
}
</style>
