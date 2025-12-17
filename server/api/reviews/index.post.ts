import { db, ratings, claims, posts, users } from '~~/server/database'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)
    if (!session?.user) {
        throw createError({ statusCode: 401, message: '请先登录' })
    }

    const body = await readBody(event)
    const { claimId, score, comment } = body

    if (!claimId || !score) {
        throw createError({ statusCode: 400, message: '参数不完整' })
    }

    // Get claim
    const claim = await db.select().from(claims).where(eq(claims.id, claimId)).get()
    if (!claim) throw createError({ statusCode: 404, message: '认领申请不存在' })

    // Get post to know author
    const post = await db.select().from(posts).where(eq(posts.id, claim.postId)).get()
    if (!post) throw createError({ statusCode: 404, message: '帖子不存在' })

    // Identify roles and target (ratee)
    let rateeId: number
    if (session.user.id === claim.claimerId) {
        // Current user is claimer, rating the owner
        rateeId = post.authorId
    } else if (session.user.id === post.authorId) {
        // Current user is owner, rating the claimer
        rateeId = claim.claimerId
    } else {
        throw createError({ statusCode: 403, message: '您无权评价此交易' })
    }

    // Check if already reviewed
    const existing = await db.select().from(ratings).where(and(
        eq(ratings.claimId, claimId),
        eq(ratings.raterId, session.user.id)
    )).get()

    if (existing) {
        throw createError({ statusCode: 400, message: '您已经评价过了' })
    }

    // Insert Review
    await db.insert(ratings).values({
        claimId,
        raterId: session.user.id,
        rateeId,
        score,
        comment: comment || null,
        createdAt: new Date().toISOString()
    })

    // Recalculate Credit Score
    // Formula: Average * 20 (Target: 0-100)
    const result = await db.select({
        avg: sql<number>`avg(${ratings.score})`
    }).from(ratings).where(eq(ratings.rateeId, rateeId)).get()

    // Default to 3 stars (60) if something weird, but existing review ensures result
    const avgScore = result?.avg || 3
    const newCreditScore = Math.round(avgScore * 20)

    await db.update(users)
        .set({ creditScore: newCreditScore })
        .where(eq(users.id, rateeId))

    return {
        success: true,
        message: '评价成功',
        newCreditScore
    }
})
