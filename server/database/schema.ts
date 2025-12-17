import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ============ Users ============
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    creditScore: integer('credit_score').notNull().default(60),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(), // ISO string
    updatedAt: text('updated_at'),
})

// ============ Categories ============
export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    nameEn: text('name_en').notNull(),
    description: text('description'),
    icon: text('icon'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
})

// ============ Posts ============
export const posts = sqliteTable('posts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    status: text('status').notNull().default('pending'), // pending, resolved, closed
    itemType: text('item_type').notNull(), // lost, found
    location: text('location'),
    itemTime: text('item_time'),
    contactInfo: text('contact_info'),
    images: text('images'), // JSON array string
    imageTags: text('image_tags'), // AI-generated tags
    imageEmbedding: text('image_embedding'), // AI-generated vector (JSON array)
    isClaimed: integer('is_claimed', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
    authorId: integer('author_id').notNull().references(() => users.id),
    categoryId: integer('category_id').references(() => categories.id),
})

// ============ Comments ============
export const comments = sqliteTable('comments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    content: text('content').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
    postId: integer('post_id').notNull().references(() => posts.id),
    authorId: integer('author_id').notNull().references(() => users.id),
})

// ============ Claims ============
export const claims = sqliteTable('claims', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    status: text('status').notNull().default('pending'), // pending, approved, rejected, confirmed
    message: text('message'),
    ownerReply: text('owner_reply'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
    confirmedAt: text('confirmed_at'),
    postId: integer('post_id').notNull().references(() => posts.id),
    claimerId: integer('claimer_id').notNull().references(() => users.id),
})

// ============ Notifications ============
export const notifications = sqliteTable('notifications', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    type: text('type').notNull(),
    status: text('status').notNull().default('unread'), // unread, read
    relatedPostId: integer('related_post_id').references(() => posts.id),
    relatedClaimId: integer('related_claim_id').references(() => claims.id),
    relatedCommentId: integer('related_comment_id').references(() => comments.id),
    extraData: text('extra_data'), // JSON
    createdAt: text('created_at').notNull(),
    readAt: text('read_at'),
    userId: integer('user_id').notNull().references(() => users.id),
})

// ============ Ratings ============
export const ratings = sqliteTable('rating', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    score: integer('score').notNull(), // 1-5
    comment: text('comment'),
    createdAt: text('created_at').notNull(),
    claimId: integer('claim_id').notNull().references(() => claims.id),
    raterId: integer('rater_id').notNull().references(() => users.id),
    rateeId: integer('ratee_id').notNull().references(() => users.id),
})

// ============ Notification Settings ============
export const notificationSettings = sqliteTable('notificationsettings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().unique().references(() => users.id),
    emailNotifications: integer('email_notifications', { mode: 'boolean' }).notNull().default(true),
    pushNotifications: integer('push_notifications', { mode: 'boolean' }).notNull().default(true),
    claimNotifications: integer('claim_notifications', { mode: 'boolean' }).notNull().default(true),
    commentNotifications: integer('comment_notifications', { mode: 'boolean' }).notNull().default(true),
    systemNotifications: integer('system_notifications', { mode: 'boolean' }).notNull().default(true),
    doNotDisturb: integer('do_not_disturb', { mode: 'boolean' }).notNull().default(false),
    quietHoursStart: integer('quiet_hours_start'),
    quietHoursEnd: integer('quiet_hours_end'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
})

// ============ Claim Status Log ============
export const claimStatusLog = sqliteTable('claimstatuslog', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    claimId: integer('claim_id').notNull().references(() => claims.id),
    postId: integer('post_id').notNull().references(() => posts.id),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    actorUserId: integer('actor_user_id').notNull().references(() => users.id),
    actorRole: text('actor_role').notNull(),
    note: text('note'),
    createdAt: text('created_at').notNull(),
})

// ============ Likes ============
export const likes = sqliteTable('likes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    postId: integer('post_id').references(() => posts.id),
    commentId: integer('comment_id').references(() => comments.id),
    createdAt: text('created_at').notNull(),
})

// Type exports for use in application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Category = typeof categories.$inferSelect
export type Comment = typeof comments.$inferSelect
export type Claim = typeof claims.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type Rating = typeof ratings.$inferSelect
export type Like = typeof likes.$inferSelect
