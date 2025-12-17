import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Get database path from runtime config or use default
const dbPath = process.env.DATABASE_PATH || './lostandfound.db'

// Singleton pattern for database connection
let dbInstance: ReturnType<typeof drizzle> | null = null
let sqliteInstance: Database.Database | null = null

function initDatabase() {
    if (!dbInstance) {
        // Create SQLite connection
        sqliteInstance = new Database(dbPath)

        // Enable WAL mode for better concurrent performance
        sqliteInstance.pragma('journal_mode = WAL')

        // Create Drizzle instance with schema
        dbInstance = drizzle(sqliteInstance, { schema })
    }
    return dbInstance
}

// Export lazy-initialized database
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_, prop) {
        const instance = initDatabase()
        return (instance as any)[prop]
    }
})

// Export schema for convenience
export * from './schema'
