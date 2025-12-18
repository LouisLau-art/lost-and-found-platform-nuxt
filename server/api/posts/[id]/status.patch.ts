import { db, posts } from '~~/server/database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    // Check authentication
    const session = await getUserSession(event)
    if (!session?.user) {
        throw createError({ statusCode: 401, message: '请先登录' })
    }

    const postId = parseInt(getRouterParam(event, 'id') || '')
    if (isNaN(postId)) {
        throw createError({ statusCode: 400, message: '无效的帖子ID' })
    }

    const body = await readBody(event)
    const { status } = body

    // Validate status
    if (!['resolved', 'closed', 'pending'].includes(status)) {
        throw createError({ statusCode: 400, message: '无效的状态值' })
    }

    // Get the post
    const post = await db.select().from(posts).where(eq(posts.id, postId)).get()
    if (!post) {
        throw createError({ statusCode: 404, message: '帖子不存在' })
    }

    // Check if user is the author
    if (post.authorId !== session.user.id) {
        throw createError({ statusCode: 403, message: '只有作者可以修改帖子状态' })
    }

    // Update status
    const now = new Date().toISOString()
    await db.update(posts)
        .set({
            status,
            updatedAt: now
        })
        .where(eq(posts.id, postId))

    return {
        success: true,
        message: status === 'resolved' ? '帖子已标记为已解决' : status === 'closed' ? '帖子已关闭' : '帖子已重新开放'
    }
})
