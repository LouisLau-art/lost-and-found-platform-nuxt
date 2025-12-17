import { db, posts, users, categories, comments, likes } from '~~/server/database'
import { eq, desc, and, like, or, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const session = await getUserSession(event)
    const currentUserId = session?.user?.id

    const {
        page = '1',
        limit = '12',
        type,
        category,
        status,
        search,
        authorId,
    } = query as Record<string, string>

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // Build query conditions
    const conditions = []

    if (type) {
        conditions.push(eq(posts.itemType, type))
    }

    if (category) {
        conditions.push(eq(posts.categoryId, parseInt(category)))
    }

    if (status) {
        conditions.push(eq(posts.status, status))
    }

    if (authorId) {
        conditions.push(eq(posts.authorId, parseInt(authorId)))
    }

    if (search) {
        conditions.push(
            or(
                like(posts.title, `%${search}%`),
                like(posts.content, `%${search}%`)
            )
        )
    }

    // Get total count
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const allPosts = whereClause
        ? await db.select().from(posts).where(whereClause).all()
        : await db.select().from(posts).all()

    const total = allPosts.length

    // Get paginated posts with author info and category icon
    const postsWithAuthor = await db
        .select({
            id: posts.id,
            title: posts.title,
            content: posts.content,
            status: posts.status,
            itemType: posts.itemType,
            location: posts.location,
            itemTime: posts.itemTime,
            images: posts.images,
            isClaimed: posts.isClaimed,
            createdAt: posts.createdAt,
            authorId: posts.authorId,
            authorName: users.name,
            authorUsername: users.username,
            categoryId: posts.categoryId,
            categoryName: categories.name,
            categoryIcon: categories.icon,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(whereClause)
        .orderBy(desc(posts.createdAt))
        .limit(limitNum)
        .offset(offset)
        .all()

    // Get comment counts, like counts, and first 3 comments for each post
    const postsWithStats = await Promise.all(
        postsWithAuthor.map(async (post) => {
            // Get comment count
            const commentCountResult = await db
                .select({ count: count() })
                .from(comments)
                .where(eq(comments.postId, post.id))
                .get()

            // Get like count
            const likeCountResult = await db
                .select({ count: count() })
                .from(likes)
                .where(eq(likes.postId, post.id))
                .get()

            // Check if current user liked this post
            let userLiked = false
            if (currentUserId) {
                const userLike = await db
                    .select()
                    .from(likes)
                    .where(and(eq(likes.postId, post.id), eq(likes.userId, currentUserId)))
                    .get()
                userLiked = !!userLike
            }

            // Get first 3 comments with author
            const topComments = await db
                .select({
                    id: comments.id,
                    content: comments.content,
                    createdAt: comments.createdAt,
                    authorName: users.name,
                })
                .from(comments)
                .leftJoin(users, eq(comments.authorId, users.id))
                .where(eq(comments.postId, post.id))
                .orderBy(desc(comments.createdAt))
                .limit(3)
                .all()

            return {
                ...post,
                images: post.images ? JSON.parse(post.images) : [],
                commentCount: commentCountResult?.count || 0,
                likeCount: likeCountResult?.count || 0,
                userLiked,
                topComments,
            }
        })
    )

    return {
        data: postsWithStats,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    }
})
