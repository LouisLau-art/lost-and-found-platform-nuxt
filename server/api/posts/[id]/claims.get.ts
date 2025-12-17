import { db, claims, users } from '~~/server/database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const postId = getRouterParam(event, 'id')
    const session = await getUserSession(event)

    if (!postId) {
        throw createError({ statusCode: 400, message: '帖子ID为必填项' })
    }

    if (!session?.user) {
        throw createError({ statusCode: 401, message: '请先登录' })
    }

    // Get all claims for this post with claimer info
    const postClaims = await db
        .select({
            id: claims.id,
            postId: claims.postId,
            claimerId: claims.claimerId,
            claimerName: users.name,
            claimerUsername: users.username,
            claimerCreditScore: users.creditScore,
            message: claims.message,
            status: claims.status,
            createdAt: claims.createdAt,
        })
        .from(claims)
        .leftJoin(users, eq(claims.claimerId, users.id))
        .where(eq(claims.postId, parseInt(postId)))
        .all()

    return {
        data: postClaims,
    }
})
