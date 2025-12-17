import { db, claims, posts, notifications } from '~~/server/database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const claimId = getRouterParam(event, 'claimId')
    const session = await getUserSession(event)
    const body = await readBody(event)
    const { action } = body // 'approve' or 'reject'

    if (!claimId) {
        throw createError({ statusCode: 400, message: '认领ID为必填项' })
    }

    if (!session?.user) {
        throw createError({ statusCode: 401, message: '请先登录' })
    }

    if (!['approve', 'reject'].includes(action)) {
        throw createError({ statusCode: 400, message: '操作必须是 approve 或 reject' })
    }

    // Get the claim
    const claim = await db
        .select()
        .from(claims)
        .where(eq(claims.id, parseInt(claimId)))
        .get()

    if (!claim) {
        throw createError({ statusCode: 404, message: '认领申请不存在' })
    }

    // Get the post
    const post = await db
        .select()
        .from(posts)
        .where(eq(posts.id, claim.postId))
        .get()

    if (!post) {
        throw createError({ statusCode: 404, message: '帖子不存在' })
    }

    // Only post author can approve/reject
    if (post.authorId !== session.user.id) {
        throw createError({ statusCode: 403, message: '只有帖子作者可以审核认领申请' })
    }

    if (claim.status !== 'pending') {
        throw createError({ statusCode: 400, message: '该申请已被处理' })
    }

    const now = new Date().toISOString()
    const newStatus = action === 'approve' ? '已通过' : '已拒绝'

    // Update claim status
    await db
        .update(claims)
        .set({
            status: action === 'approve' ? 'approved' : 'rejected',
            updatedAt: now
        })
        .where(eq(claims.id, parseInt(claimId)))

    // If approved, mark post as resolved
    if (action === 'approve') {
        await db
            .update(posts)
            .set({
                status: 'resolved',
                isClaimed: true
            })
            .where(eq(posts.id, claim.postId))
    }

    // Create notification for claimer about the result
    const notifTitle = action === 'approve'
        ? '✅ 认领申请已通过！'
        : '❌ 认领申请被拒绝'
    const notifContent = action === 'approve'
        ? `您的认领申请已通过！物品：${post.title}`
        : `您的认领申请被拒绝。物品：${post.title}`

    await db.insert(notifications).values({
        userId: claim.claimerId,
        title: notifTitle,
        content: notifContent,
        type: 'claim_result',
        status: 'unread',
        relatedPostId: post.id,
        relatedClaimId: claim.id,
        extraData: JSON.stringify({ action }),
        createdAt: now,
    })

    // Send "Please Rate" notifications to BOTH parties (Only if approved)
    if (action === 'approve') {
        // For Claimer (Louis)
        await db.insert(notifications).values({
            userId: claim.claimerId,
            title: '📝 请评价您的体验',
            content: `请对物品 "${post.title}" 的发布者进行评价，您的反馈对社区很重要！`,
            type: 'review_reminder',
            status: 'unread',
            relatedPostId: post.id,
            relatedClaimId: claim.id,
            createdAt: now,
        })

        // For Owner (Jerry)
        await db.insert(notifications).values({
            userId: post.authorId,
            title: '📝 请评价您的体验',
            content: `请对物品 "${post.title}" 的认领者进行评价，您的反馈对社区很重要！`,
            type: 'review_reminder',
            status: 'unread',
            relatedPostId: post.id,
            relatedClaimId: claim.id,
            createdAt: now,
        })
    }

    return {
        success: true,
        status: newStatus,
    }
})
