import { db, ratings } from '~~/server/database'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)
    if (!session?.user) return { hasReviewed: false }

    const { claimId } = getQuery(event)
    if (!claimId) return { hasReviewed: false }

    const review = await db.select().from(ratings).where(and(
        eq(ratings.claimId, Number(claimId)),
        eq(ratings.raterId, session.user.id)
    )).get()

    return { hasReviewed: !!review }
})
