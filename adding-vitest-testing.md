# 为 Nuxt 4 项目添加 Vitest 自动化测试

> 记录为校园失物招领平台添加自动化测试的完整过程

## 📋 背景

在项目开发过程中，我们决定为 Nuxt 4 + TypeScript 项目添加自动化测试，以便在每次代码变更后快速验证核心功能是否正常。

### 项目技术栈
- **框架**: Nuxt 4 (Compatibility Mode)
- **包管理器**: Bun
- **数据库**: SQLite + Drizzle ORM
- **认证**: nuxt-auth-utils

## 🚀 实施过程

### 第一阶段：安装测试依赖

```bash
bun add -D vitest @nuxt/test-utils @vue/test-utils happy-dom
```

安装的包：
- `vitest` - 基于 Vite 的测试框架，速度快
- `@nuxt/test-utils` - Nuxt 官方测试工具
- `@vue/test-utils` - Vue 组件测试工具
- `happy-dom` - 轻量级 DOM 实现

### 第二阶段：尝试 Nuxt 集成测试环境（失败）

最初尝试使用 `@nuxt/test-utils/e2e` 提供的集成测试环境：

```typescript
// ❌ 这种方式遇到了兼容性问题
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Auth API', async () => {
  await setup({ server: true, browser: false })
  // ...
})
```

**遇到的问题**：
```
Error: Cannot bundle built-in module "bun:test" imported from "@nuxt/test-utils"
```

这是因为 `@nuxt/test-utils` 在检测到 Bun 环境时会尝试导入 `bun:test`，但这与 Vitest 不兼容。

### 第三阶段：改用原生 fetch 方案（成功）

最终采用了更简单直接的方案：**使用原生 `fetch` 直接调用 API**。

这种方案的优点：
1. ✅ 不依赖特殊的测试环境
2. ✅ 测试代码更接近真实使用场景
3. ✅ 调试更简单直观

#### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        testTimeout: 60000,
        hookTimeout: 60000,
        environment: 'node',  // 使用 Node 环境
    },
})
```

#### 测试文件示例

```typescript
const BASE_URL = 'http://localhost:3000'

describe('Auth API', () => {
    it('should register a new user', async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            }),
        })
        
        expect(response.ok).toBe(true)
        const data = await response.json()
        expect(data.success).toBe(true)
    })
})
```

### 第四阶段：修复测试失败

初次运行测试时发现 4 个失败，原因是**测试期望的 API 响应格式与实际不符**。

| 问题 | 期望格式 | 实际格式 |
|------|----------|----------|
| GET /api/posts | `{ posts: [...] }` | `{ data: [...], pagination: {...} }` |
| GET /api/claims/my | 直接返回数组 | `{ data: [...] }` |
| 筛选参数 | `?itemType=lost` | `?type=lost` |

**解决方法**：阅读 API 源码，更新测试以匹配实际响应格式。

### 第五阶段：修复项目 Bug

在运行测试过程中，还发现并修复了一个导入路径错误：

```diff
// server/plugins/seed.ts
- import { db, users, categories, posts } from '../server/database'
+ import { db, users, categories, posts } from '../database'
```

## 📊 最终测试覆盖

```
 ✓ tests/api/auth.test.ts    (7 tests)
 ✓ tests/api/posts.test.ts   (9 tests)
 ✓ tests/api/claims.test.ts  (7 tests)

 Test Files  3 passed (3)
      Tests  23 passed (23)
```

| 模块 | 测试内容 |
|------|----------|
| **Auth** | 注册成功、字段验证、密码长度、重复邮箱、登录成功、密码错误、邮箱不存在 |
| **Posts** | 列表获取、分页、筛选、无认证失败、创建成功、缺失字段、无效类型、获取详情、404 |
| **Claims** | 无认证失败、认领自己帖子失败、创建成功、重复认领失败、帖子不存在、获取我的认领、权限验证 |

## 📁 最终文件结构

```
tests/
├── api/
│   ├── auth.test.ts      # 用户认证测试
│   ├── posts.test.ts     # 帖子 API 测试
│   └── claims.test.ts    # 认领 API 测试
vitest.config.ts          # Vitest 配置
package.json              # 添加了 test 命令
```

## 🎯 使用方法

```bash
# 终端 1: 启动开发服务器
bun run dev

# 终端 2: 运行测试
bun run test:run     # 单次运行
bun run test         # 监听模式
```

## 💡 经验总结

1. **从简单方案开始**：不要一开始就追求完美的测试框架集成，原生 fetch 也能很好地完成 API 测试。

2. **测试能发现 Bug**：在编写测试过程中，我们发现了一个导入路径错误，这正是测试的价值所在。

3. **先写测试再验证格式**：API 响应格式可能与预期不同，需要阅读源码确认。

4. **保持测试独立**：每个测试使用唯一的 `Date.now()` 后缀创建测试数据，避免测试间相互影响。

5. **考虑环境兼容性**：Bun + Vitest + Nuxt 的组合可能存在兼容性问题，需要灵活调整方案。

---

*记录时间：2025-12-18*
