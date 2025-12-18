import { CATEGORIES, type Category } from '~~/server/utils/categories'

export default defineEventHandler(() => {
    // 返回简化版分类（id, name, emoji）
    return CATEGORIES.map((c: Category) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji
    }))
})

