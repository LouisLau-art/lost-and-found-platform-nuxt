<script setup lang="ts">
const { toasts, removeToast } = useToast()

const getAlertClass = (type: string) => {
  switch (type) {
    case 'success': return 'alert-success'
    case 'error': return 'alert-error'
    case 'warning': return 'alert-warning'
    default: return 'alert-info'
  }
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return 'i-ph-check-circle-bold'
    case 'error': return 'i-ph-x-circle-bold'
    case 'warning': return 'i-ph-warning-bold'
    default: return 'i-ph-info-bold'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="toast toast-top toast-end z-50 mt-20">
      <TransitionGroup name="toast">
        <div 
          v-for="t in toasts" 
          :key="t.id"
          :class="['alert shadow-lg', getAlertClass(t.type || 'info')]"
        >
          <span :class="getIcon(t.type || 'info')" />
          <div>
            <h3 class="font-bold">{{ t.title }}</h3>
            <div v-if="t.description" class="text-xs">{{ t.description }}</div>
          </div>
          <button class="btn btn-ghost btn-xs" @click="removeToast(t.id)">
            <span class="i-ph-x" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
