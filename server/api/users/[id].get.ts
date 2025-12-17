import { db, users } from '~~/server/database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required'
        })
    }

    const user = await db
        .select({
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            creditScore: users.creditScore,
            isAdmin: users.isAdmin,
        })
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .get()

    if (!user) {
        throw createError({
            statusCode: 404,
            message: 'User not found'
        })
    }

    return user
})
