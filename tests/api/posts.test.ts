import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:3000'

describe('Posts API', () => {
    // ============================================
    // 获取帖子列表
    // ============================================
    describe('GET /api/posts', () => {
        it('should return a list of posts with pagination', async () => {
            const response = await fetch(`${BASE_URL}/api/posts`)

            expect(response.ok).toBe(true)
            const data = await response.json()
            // 根据实际 API 格式：{ data: [...], pagination: {...} }
            expect(data.data).toBeDefined()
            expect(Array.isArray(data.data)).toBe(true)
            expect(data.pagination).toBeDefined()
        })

        it('should support pagination', async () => {
            const response = await fetch(`${BASE_URL}/api/posts?page=1&limit=5`)

            expect(response.ok).toBe(true)
            const data = await response.json()
            expect(data.data.length).toBeLessThanOrEqual(5)
            expect(data.pagination.page).toBe(1)
        })

        it('should filter by type (lost)', async () => {
            const response = await fetch(`${BASE_URL}/api/posts?type=lost`)

            expect(response.ok).toBe(true)
            const data = await response.json()
            // 所有返回的帖子都应该是 lost 类型
            data.data.forEach((post: any) => {
                expect(post.type).toBe('lost')
            })
        })

        it('should filter by type (found)', async () => {
            const response = await fetch(`${BASE_URL}/api/posts?type=found`)

            expect(response.ok).toBe(true)
            const data = await response.json()
            data.data.forEach((post: any) => {
                expect(post.type).toBe('found')
            })
        })
    })

    // ============================================
    // 创建帖子（需要认证）
    // ============================================
    describe('POST /api/posts', () => {
        it('should fail without authentication', async () => {
            const response = await fetch(`${BASE_URL}/api/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Test Post',
                    description: 'Test description',
                    type: 'lost',
                    location: 'Test location',
                }),
            })

            expect(response.ok).toBe(false)
            expect(response.status).toBe(401)
        })
    })

    // ============================================
    // 获取单个帖子
    // ============================================
    describe('GET /api/posts/:id', () => {
        it('should return a single post by ID', async () => {
            // 先获取列表拿到一个有效的 ID
            const listResponse = await fetch(`${BASE_URL}/api/posts?limit=1`)
            const listData = await listResponse.json()

            if (listData.data && listData.data.length > 0) {
                const postId = listData.data[0].id
                const response = await fetch(`${BASE_URL}/api/posts/${postId}`)

                expect(response.ok).toBe(true)
                const data = await response.json()
                expect(data.id).toBe(postId)
            }
        })

        it('should return 404 for non-existent post', async () => {
            const response = await fetch(`${BASE_URL}/api/posts/99999999`)

            expect(response.ok).toBe(false)
            expect(response.status).toBe(404)
        })
    })
})
