export const useColorMode = () => {
    const colorMode = useState('color-mode', () => 'light')

    // Initialize from localStorage on client side
    if (process.client) {
        const stored = localStorage.getItem('color-mode')
        if (stored) {
            colorMode.value = stored
            document.documentElement.setAttribute('data-theme', stored)
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            colorMode.value = prefersDark ? 'dark' : 'light'
            document.documentElement.setAttribute('data-theme', colorMode.value)
        }
    }

    const preference = computed({
        get: () => colorMode.value,
        set: (value: string) => {
            colorMode.value = value
            if (process.client) {
                localStorage.setItem('color-mode', value)
                document.documentElement.setAttribute('data-theme', value)
            }
        }
    })

    return {
        preference,
        value: colorMode
    }
}
