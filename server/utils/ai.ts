// AI Search utilities using Transformers.js
// Using WASM backend for better Bun compatibility
import { resolve } from 'path'

// 强制禁用 onnxruntime-node，使用 WASM 后端
// 必须在导入 @xenova/transformers 之前设置
process.env.ONNX_DISABLE_NODE = '1'

// Models
const TEXT_MODEL = 'Xenova/all-MiniLM-L6-v2'
const VISION_MODEL = 'Xenova/clip-vit-base-patch32'

// 模型缓存路径 - 使用项目根目录下的 .models 文件夹，避免被 node_modules 操作清除
const MODEL_CACHE_PATH = resolve(process.cwd(), '.models')

let textEmbedder: any = null
let visionEmbedder: any = null
let isInitialized = false
let initError: Error | null = null

async function getEmbedder(type: 'text' | 'vision' = 'text') {
    if (initError) throw initError

    // Check specific embedder
    if (type === 'text' && textEmbedder) return textEmbedder
    if (type === 'vision' && visionEmbedder) return visionEmbedder

    try {
        // Dynamic import to avoid SSR issues
        const { pipeline, env } = await import('@xenova/transformers')

        // Force WASM backend to avoid onnxruntime-node issues
        env.backends.onnx.wasm.numThreads = 1
        // 禁用 webgpu 和其他后端，只使用 wasm
        if (env.backends.onnx.webgpu) {
            env.backends.onnx.webgpu.disabled = true
        }
        env.allowLocalModels = true
        env.localModelPath = MODEL_CACHE_PATH
        env.cacheDir = MODEL_CACHE_PATH
        env.useBrowserCache = false
        // Use domestic mirror for faster downloads in China
        env.remoteHost = 'https://hf-mirror.com/'
        env.remotePathTemplate = '{model}/resolve/{revision}/'

        console.log(`🤖 Initializing AI ${type} model (this may take a moment)...`)
        console.log(`🌍 Model Source: ${env.remoteHost}`)

        if (type === 'text') {
            textEmbedder = await pipeline('feature-extraction', TEXT_MODEL, {
                quantized: true,
                progress_callback: (progress: any) => {
                    if (progress.status === 'progress') {
                        console.log(`📥 Downloading Text Model: ${Math.round(progress.progress)}%`)
                    }
                }
            })
            return textEmbedder
        }

        if (type === 'vision') {
            visionEmbedder = await pipeline('image-feature-extraction', VISION_MODEL, {
                quantized: true,
                progress_callback: (progress: any) => {
                    if (progress.status === 'progress') {
                        console.log(`📥 Downloading Vision Model: ${Math.round(progress.progress)}%`)
                    }
                }
            })
            return visionEmbedder
        }

        isInitialized = true
        console.log('✅ AI models initialized successfully')
    } catch (error) {
        initError = error as Error
        console.error('❌ Failed to initialize AI model:', error)
        throw error
    }
}

/**
 * Generate embedding vector for text
 */
export async function getTextEmbedding(text: string): Promise<number[]> {
    try {
        const embedder = await getEmbedder('text')
        const output = await embedder(text, { pooling: 'mean', normalize: true })
        return Array.from(output.data)
    } catch (error) {
        console.error('Failed to generate text embedding:', error)
        throw error
    }
}

/**
 * Generate embedding vector for image
 * @param imageInput - Buffer or URL of the image
 */
export async function getImageEmbedding(imageInput: Buffer | string): Promise<number[]> {
    try {
        const embedder = await getEmbedder('vision')

        // Import RawImage for proper image handling
        const { RawImage } = await import('@xenova/transformers')

        let image
        if (Buffer.isBuffer(imageInput)) {
            // Convert Buffer to RawImage using Uint8Array
            const uint8Array = new Uint8Array(imageInput)
            image = await RawImage.fromBlob(new Blob([uint8Array]))
        } else {
            // Assume it's a URL or path
            image = await RawImage.read(imageInput)
        }

        // Run inference
        const output = await embedder(image, { pooling: 'mean', normalize: true })
        return Array.from(output.data)
    } catch (error) {
        console.error('Failed to generate image embedding:', error)
        throw error
    }
}

/**
 * Generate tags for an image using Zero-Shot Classification
 * Uses the provided image embedding to find best matching labels
 */
// Pre-defined Candidate Labels for Lost & Found (校园常见物品)
const CANDIDATE_LABELS = [
    // 电子设备
    'phone', 'laptop', 'tablet', 'headphones', 'earbuds', 'charger', 'usb drive', 'power bank', 'mouse', 'keyboard',
    // 证件卡片
    'wallet', 'credit card', 'id card', 'student card', 'passport', 'bus card',
    // 钥匙
    'keys', 'key chain', 'access card',
    // 包类
    'backpack', 'bag', 'handbag', 'pencil case', 'luggage',
    // 书籍文具
    'book', 'notebook', 'textbook', 'pen', 'pencil', 'calculator',
    // 衣物配饰
    'jacket', 'coat', 'hat', 'cap', 'scarf', 'gloves', 'shoes', 'glasses', 'sunglasses', 'watch', 'jewelry', 'ring', 'necklace', 'bracelet',
    // 生活用品
    'umbrella', 'water bottle', 'thermos', 'lunch box', 'cup', 'mug',
    // 运动器材
    'basketball', 'football', 'tennis racket', 'badminton racket', 'sports shoes',
    // 颜色描述
    'black object', 'white object', 'blue object', 'red object', 'green object', 'pink object', 'yellow object'
]

// 英文标签到中文的映射
const LABEL_TO_CHINESE: Record<string, string> = {
    // 电子设备
    'phone': '手机', 'laptop': '笔记本电脑', 'tablet': '平板', 'headphones': '耳机', 'earbuds': '耳塞',
    'charger': '充电器', 'usb drive': 'U盘', 'power bank': '充电宝', 'mouse': '鼠标', 'keyboard': '键盘',
    // 证件卡片
    'wallet': '钱包', 'credit card': '银行卡', 'id card': '身份证', 'student card': '学生证',
    'passport': '护照', 'bus card': '公交卡',
    // 钥匙
    'keys': '钥匙', 'key chain': '钥匙链', 'access card': '门禁卡',
    // 包类
    'backpack': '双肩包', 'bag': '包', 'handbag': '手提包', 'pencil case': '笔袋', 'luggage': '行李箱',
    // 书籍文具
    'book': '书', 'notebook': '笔记本', 'textbook': '教材', 'pen': '笔', 'pencil': '铅笔', 'calculator': '计算器',
    // 衣物配饰
    'jacket': '夹克', 'coat': '外套', 'hat': '帽子', 'cap': '鸭舌帽', 'scarf': '围巾', 'gloves': '手套',
    'shoes': '鞋子', 'glasses': '眼镜', 'sunglasses': '墨镜', 'watch': '手表', 'jewelry': '首饰',
    'ring': '戒指', 'necklace': '项链', 'bracelet': '手链',
    // 生活用品
    'umbrella': '雨伞', 'water bottle': '水杯', 'thermos': '保温杯', 'lunch box': '饭盒', 'cup': '杯子', 'mug': '马克杯',
    // 运动器材
    'basketball': '篮球', 'football': '足球', 'tennis racket': '网球拍', 'badminton racket': '羽毛球拍', 'sports shoes': '运动鞋',
    // 颜色
    'black': '黑色', 'white': '白色', 'blue': '蓝色', 'red': '红色', 'green': '绿色', 'pink': '粉色', 'yellow': '黄色'
}

// Zero-shot classifier instance
let zeroShotClassifier: any = null

export async function generateImageTags(imageBuffer: Buffer): Promise<string[]> {
    try {
        // Initialize zero-shot classifier if needed
        if (!zeroShotClassifier) {
            console.log('🏷️ Initializing zero-shot image classifier...')
            const { pipeline, env } = await import('@xenova/transformers')

            env.backends.onnx.wasm.numThreads = 1
            env.allowLocalModels = true
            env.localModelPath = MODEL_CACHE_PATH
            env.cacheDir = MODEL_CACHE_PATH
            env.useBrowserCache = false
            env.remoteHost = 'https://hf-mirror.com/'
            env.remotePathTemplate = '{model}/resolve/{revision}/'

            zeroShotClassifier = await pipeline('zero-shot-image-classification', VISION_MODEL, {
                quantized: true,
                progress_callback: (progress: any) => {
                    if (progress.status === 'progress') {
                        console.log(`📥 Downloading Classifier: ${Math.round(progress.progress)}%`)
                    }
                }
            })
            console.log('✅ Zero-shot classifier ready')
        }

        // Convert Buffer to Blob for the classifier
        const { RawImage } = await import('@xenova/transformers')
        const uint8Array = new Uint8Array(imageBuffer)
        const image = await RawImage.fromBlob(new Blob([uint8Array]))

        // Run zero-shot classification
        const results = await zeroShotClassifier(image, CANDIDATE_LABELS)

        console.log('🔍 Zero-shot results:', results.slice(0, 5).map((r: any) => `${r.label} (${r.score.toFixed(2)})`).join(', '))

        // Return top labels with score > 0.1, translated to Chinese
        const topTags = results
            .filter((r: any) => r.score > 0.1)
            .slice(0, 5)
            .map((r: any) => {
                const label = r.label.replace(' object', '')
                // 翻译为中文，如果没有映射则返回原文
                return LABEL_TO_CHINESE[label] || label
            })

        return topTags
    } catch (error) {
        console.error('Failed to generate tags:', error)
        return []
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Find similar posts using semantic search (Text)
 */
export async function findSimilarPosts(
    queryText: string,
    posts: { id: number; title: string; content: string }[],
    topK: number = 10,
    threshold: number = 0.3
): Promise<{ id: number; score: number }[]> {
    try {
        const queryEmbedding = await getTextEmbedding(queryText)

        const results: { id: number; score: number }[] = []

        for (const post of posts) {
            const postText = `${post.title} ${post.content}`
            const postEmbedding = await getTextEmbedding(postText)
            const score = cosineSimilarity(queryEmbedding, postEmbedding)

            if (score >= threshold) {
                results.push({ id: post.id, score })
            }
        }

        // Sort by score descending and take top K
        return results.sort((a, b) => b.score - a.score).slice(0, topK)
    } catch (error) {
        console.error('Error in findSimilarPosts:', error)
        // Fallback: return posts sorted by ID if AI fails
        return posts.slice(0, topK).map((p, i) => ({
            id: p.id,
            score: 1 - (i * 0.1) // Fake descending scores
        }))
    }
}


