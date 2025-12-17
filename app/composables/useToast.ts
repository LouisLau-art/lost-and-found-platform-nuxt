// Simple toast notification composable for DaisyUI

interface ToastOptions {
    title: string
    description?: string
    type?: 'success' | 'error' | 'warning' | 'info'
    // DaisyUI alert style mapping
    toast?: string
    leading?: string
    closable?: boolean
    showProgress?: boolean
    duration?: number
}

interface Toast {
    id: number
    title: string
    description?: string
    type: 'success' | 'error' | 'warning' | 'info'
}

const toasts = ref<Toast[]>([])
let toastId = 0

// Map toast style string to simple types
function mapToastType(options: ToastOptions): 'success' | 'error' | 'warning' | 'info' {
    if (options.type) return options.type
    if (options.toast) {
        if (options.toast.includes('success') || options.toast.includes('green')) return 'success'
        if (options.toast.includes('red') || options.toast.includes('error')) return 'error'
        if (options.toast.includes('yellow') || options.toast.includes('warning')) return 'warning'
    }
    return 'info'
}

export const useToast = () => {
    const toast = (options: ToastOptions) => {
        const id = ++toastId
        const newToast: Toast = {
            id,
            title: options.title,
            description: options.description,
            type: mapToastType(options)
        }

        toasts.value.push(newToast)

        // Auto remove after duration
        const duration = options.duration || 3000
        setTimeout(() => {
            removeToast(id)
        }, duration)

        return id
    }

    const removeToast = (id: number) => {
        const index = toasts.value.findIndex(t => t.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    return {
        toast,
        toasts,
        removeToast
    }
}
