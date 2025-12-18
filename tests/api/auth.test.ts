import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const BASE_URL = 'http://localhost:3000'

// 测试数据 - 使用时间戳确保唯一性
const testUser = {
    name: `Test User ${Date.now()}`,
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
}

describe('Auth API', () => {
    // ============================================
    // 注册测试
    // ============================================
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser),
            })

            expect(response.ok).toBe(true)
            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.user).toBeDefined()
            expect(data.user.email).toBe(testUser.email)
        })

        it('should fail with missing required fields', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'incomplete@example.com' }),
            })

            expect(response.ok).toBe(false)
        })

        it('should fail with short password', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Short Pass',
                    username: `shortpass_${Date.now()}`,
                    email: `shortpass_${Date.now()}@example.com`,
                    password: '123', // 太短
                }),
            })

            expect(response.ok).toBe(false)
        })

        it('should fail with duplicate email', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser), // 使用已注册的邮箱
            })

            expect(response.ok).toBe(false)
        })
    })

    // ============================================
    // 登录测试
    // ============================================
    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUser.email,
                    password: testUser.password,
                }),
            })

            expect(response.ok).toBe(true)
            const data = await response.json()
            expect(data.success).toBe(true)
        })

        it('should fail with wrong password', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUser.email,
                    password: 'wrongpassword',
                }),
            })

            expect(response.ok).toBe(false)
        })

        it('should fail with non-existent email', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                }),
            })

            expect(response.ok).toBe(false)
        })
    })
})
