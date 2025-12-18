// 物品分类常量 - 写死在代码里，简单可靠
export const CATEGORIES = [
    { id: 1, name: '电子设备', nameEn: 'electronics', emoji: '📱', icon: 'i-ph-device-mobile' },
    { id: 2, name: '证件卡片', nameEn: 'cards', emoji: '💳', icon: 'i-ph-identification-card' },
    { id: 3, name: '钥匙', nameEn: 'keys', emoji: '🔑', icon: 'i-ph-key' },
    { id: 4, name: '书籍文具', nameEn: 'books', emoji: '📚', icon: 'i-ph-book-open' },
    { id: 5, name: '衣物配饰', nameEn: 'clothing', emoji: '👕', icon: 'i-ph-t-shirt' },
    { id: 6, name: '运动器材', nameEn: 'sports', emoji: '⚽', icon: 'i-ph-basketball' },
    { id: 7, name: '生活用品', nameEn: 'daily', emoji: '☂️', icon: 'i-ph-umbrella' },
    { id: 8, name: '其他', nameEn: 'other', emoji: '❓', icon: 'i-ph-question' },
] as const

export type Category = typeof CATEGORIES[number]

// 根据 ID 获取分类
export function getCategoryById(id: number): Category | undefined {
    return CATEGORIES.find(c => c.id === id)
}

// 根据英文名获取分类
export function getCategoryByNameEn(nameEn: string): Category | undefined {
    return CATEGORIES.find(c => c.nameEn === nameEn)
}
