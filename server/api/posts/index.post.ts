import { db, posts, notifications, users, categories } from '~~/server/database'
import { eq, desc, and, not } from 'drizzle-orm'
import { findSimilarPosts } from '~~/server/utils/ai'

export default defineEventHandler(async (event) => {
    // Check authentication
    const session = await getUserSession(event)
    if (!session?.user) {
        throw createError({ statusCode: 401, message: '请先登录' })
    }

    const body = await readBody(event)
    const { title, content, itemType, location, itemTime, contactInfo, images, categoryId } = body

    // Validate required fields
    if (!title || !content || !itemType) {
        throw createError({
            statusCode: 400,
            message: '标题、内容和类型为必填项',
        })
    }

    if (!['lost', 'found'].includes(itemType)) {
        throw createError({
            statusCode: 400,
            message: '类型必须是 lost 或 found',
        })
    }

    const now = new Date().toISOString()

    // Create the post
    const result = await db.insert(posts).values({
        title,
        content,
        itemType,
        location: location || null,
        itemTime: itemTime || null,
        contactInfo: contactInfo || null,
        images: images ? JSON.stringify(images) : null,
        // Save image embedding if provided (supports AI visual search)
        imageEmbedding: body.imageEmbedding ? (typeof body.imageEmbedding === 'string' ? body.imageEmbedding : JSON.stringify(body.imageEmbedding)) : null,
        imageTags: body.imageTags || null,
        categoryId: categoryId || null,
        authorId: session.user.id,
        status: 'pending',
        isClaimed: false,
        createdAt: now,
    }).returning()

    const newPost = result[0]

    // AI Auto-Match: Find potential matches and notify users
    // Run in background to not block response
    setTimeout(async () => {
        try {
            const oppositeType = itemType === 'lost' ? 'found' : 'lost'

            // Get candidate posts of opposite type
            const candidates = await db
                .select({
                    id: posts.id,
                    title: posts.title,
                    content: posts.content,
                    authorId: posts.authorId,
                })
                .from(posts)
                .where(and(
                    eq(posts.itemType, oppositeType),
                    eq(posts.status, 'pending'),
                    not(eq(posts.authorId, session.user.id))
                ))
                .limit(50)
                .all()

            if (candidates.length === 0) return

            // Find matches using AI
            const queryText = `${title} ${content}`
            const matches = await findSimilarPosts(
                queryText,
                candidates.map(p => ({ id: p.id, title: p.title, content: p.content })),
                3, // Top 3 matches
                0.5 // Higher threshold (50%+) for notifications
            )

            // Create notifications for matched post owners
            for (const match of matches) {
                const matchedPost = candidates.find(c => c.id === match.id)
                if (!matchedPost) continue

                const matchPercent = Math.round(match.score * 100)
                const notifTitle = itemType === 'lost'
                    ? '🎉 可能找到了您丢失的物品！'
                    : '📢 有人可能是这个物品的失主！'

                await db.insert(notifications).values({
                    userId: matchedPost.authorId,
                    title: notifTitle,
                    content: `新发布的「${title}」与您的帖子匹配度达 ${matchPercent}%，点击查看详情`,
                    type: 'ai_match',
                    status: 'unread',
                    relatedPostId: newPost.id,
                    extraData: JSON.stringify({
                        matchScore: matchPercent,
                        yourPostId: matchedPost.id
                    }),
                    createdAt: now,
                })
            }
        } catch (e) {
            console.error('AI match failed:', e)
        }
    }, 100)

    return {
        success: true,
        post: newPost,
    }
})
