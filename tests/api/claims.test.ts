import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:3000'

describe('Claims API', () => {
    // ============================================
    // 获取我的认领（需要认证）
    // ============================================
    describe('GET /api/claims/my', () => {
        it('should fail without authentication', async () => {
            const response = await fetch(`${BASE_URL}/api/claims/my`)

            expect(response.ok).toBe(false)
            expect(response.status).toBe(401)
        })
    })

    // ============================================
    // 创建认领（需要认证）
    // ============================================
    describe('POST /api/claims', () => {
        it('should fail without authentication', async () => {
            const response = await fetch(`${BASE_URL}/api/claims`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: 1,
                    message: 'I think this is mine',
                }),
            })

            expect(response.ok).toBe(false)
            expect(response.status).toBe(401)
        })

        it('should fail for non-existent post', async () => {
            // 即使没有认证，应该返回 401 而不是其他错误
            const response = await fetch(`${BASE_URL}/api/claims`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: 99999999,
                    message: 'Test claim',
                }),
            })

            expect(response.ok).toBe(false)
        })
    })
})
