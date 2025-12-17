import { db, categories } from '~~/server/database'

export default defineEventHandler(async () => {
    const allCategories = await db.select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon
    }).from(categories).all()
    return allCategories
})
