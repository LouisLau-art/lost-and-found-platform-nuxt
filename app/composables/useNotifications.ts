// Global state for notification refresh
const refreshCallbacks = new Set<() => void>()

export function useNotifications() {
    // Register a callback to be called when notifications should refresh
    function onRefresh(callback: () => void) {
        refreshCallbacks.add(callback)
        onUnmounted(() => {
            refreshCallbacks.delete(callback)
        })
    }

    // Trigger all registered refresh callbacks
    function triggerRefresh() {
        refreshCallbacks.forEach(cb => cb())
    }

    return {
        onRefresh,
        triggerRefresh,
    }
}
