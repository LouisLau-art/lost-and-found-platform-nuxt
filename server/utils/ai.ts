// AI Search utilities using Transformers.js
// Using WASM backend for better Bun compatibility

// Models
const TEXT_MODEL = 'Xenova/all-MiniLM-L6-v2'
const VISION_MODEL = 'Xenova/clip-vit-base-patch32'

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
        env.allowLocalModels = true
        env.localModelPath = './.cache/huggingface'
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
// Pre-defined Candidate Labels for Lost & Found
const CANDIDATE_LABELS = [
    'wallet', 'keys', 'phone', 'laptop', 'backpack', 'bag',
    'credit card', 'id card', 'passport', 'umbrella',
    'jacket', 'shoes', 'glasses', 'watch', 'jewelry', 'book',
    'water bottle', 'headphones',
    // Colors
    'black object', 'white object', 'blue object', 'red object', 'green object'
]

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
            env.localModelPath = './.cache/huggingface'
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

        // Return top labels with score > 0.1
        const topTags = results
            .filter((r: any) => r.score > 0.1)
            .slice(0, 5)
            .map((r: any) => r.label.replace(' object', ''))

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


