import { db, claims, posts, notifications } from '~~/server/database'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    // Check authentication
    const session = await getUserSession(event)
    if (!session?.user) {
        throw createError({ statusCode: 401, message: '请先登录' })
    }

    const body = await readBody(event)
    const { postId, message } = body

    if (!postId) {
        throw createError({ statusCode: 400, message: '帖子ID为必填项' })
    }

    // Get the post
    const post = await db.select().from(posts).where(eq(posts.id, postId)).get()

    if (!post) {
        throw createError({ statusCode: 404, message: '帖子不存在' })
    }

    // Cannot claim your own post
    if (post.authorId === session.user.id) {
        throw createError({ statusCode: 400, message: '不能认领自己的帖子' })
    }

    // Check if already claimed by this user
    const existingClaim = await db
        .select()
        .from(claims)
        .where(and(
            eq(claims.postId, postId),
            eq(claims.claimerId, session.user.id)
        ))
        .get()

    if (existingClaim) {
        throw createError({ statusCode: 400, message: '您已经提交过认领申请' })
    }

    const now = new Date().toISOString()

    // Create claim
    const result = await db.insert(claims).values({
        postId,
        claimerId: session.user.id,
        message: message || null,
        status: 'pending',
        createdAt: now,
    }).returning()

    // Create notification for post owner
    await db.insert(notifications).values({
        userId: post.authorId,
        title: '新的认领申请',
        content: `有用户申请认领您发布的物品：${post.title}`,
        type: 'claim',
        status: 'unread',
        relatedPostId: postId,
        relatedClaimId: result[0].id,
        createdAt: now,
    })

    return {
        success: true,
        claim: result[0],
    }
})
