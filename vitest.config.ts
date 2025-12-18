import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        testTimeout: 60000,
        hookTimeout: 60000,
        environment: 'node', // 使用 Node 环境避免 Bun 兼容性问题
    },
})
