import { getImageEmbedding, generateImageTags } from '~~/server/utils/ai'
import sharp from 'sharp'

// Process image for AI (resize to CLIP input size)
async function processImageForAI(buffer: Buffer): Promise<Buffer> {
    const maxDimension = 224 // CLIP uses 224x224 images internally

    try {
        const processed = await sharp(buffer)
            .resize(maxDimension, maxDimension, {
                fit: 'cover',
                withoutEnlargement: false
            })
            .png()
            .toBuffer()

        console.log(`📐 Processed image to ${maxDimension}x${maxDimension}, size: ${(processed.length / 1024).toFixed(0)}KB`)
        return processed
    } catch (e) {
        console.error('Image processing error:', e)
        throw e
    }
}

export default defineEventHandler(async (event) => {
    try {
        const files = await readMultipartFormData(event)
        if (!files || files.length === 0) {
            throw createError({ statusCode: 400, message: 'No image uploaded' })
        }

        const imageFile = files.find(f => f.name === 'image' || f.filename)
        if (!imageFile) {
            throw createError({ statusCode: 400, message: 'No image file found' })
        }

        console.log(`🖼️ Received image: ${imageFile.filename || 'unknown'} (${(imageFile.data.length / 1024).toFixed(0)}KB)`)

        // Process image for AI
        let processedBuffer: Buffer
        try {
            processedBuffer = await processImageForAI(imageFile.data)
        } catch (processError) {
            console.error('⚠️ Image processing failed:', processError)
            return {
                success: true,
                embedding: [],
                tags: [],
                warning: 'Image processing failed'
            }
        }

        let embedding: number[] = []
        let tags: string[] = []

        try {
            // Set timeout
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('AI analysis timeout')), 60000)
            )

            // Generate embedding
            embedding = await Promise.race([
                getImageEmbedding(processedBuffer),
                timeoutPromise
            ])
            console.log(`✅ Embedding generated: ${embedding.length} dimensions`)

            // Generate tags using zero-shot classification (pass the buffer, not embedding)
            try {
                tags = await Promise.race([
                    generateImageTags(processedBuffer),
                    new Promise<string[]>((_, reject) =>
                        setTimeout(() => reject(new Error('Tag generation timeout')), 30000)
                    )
                ])
                console.log(`✨ Tags generated: ${tags.join(', ')}`)
            } catch (tagError) {
                console.warn('⚠️ Tag generation failed:', tagError)
                tags = []
            }

        } catch (aiError: any) {
            console.error('⚠️ AI analysis failed or timed out:', aiError.message)
            return {
                success: true,
                embedding: [],
                tags: [],
                warning: 'AI analysis timed out'
            }
        }

        return {
            success: true,
            embedding: embedding,
            tags: tags
        }
    } catch (e: any) {
        console.error('❌ Image processing failed:', e)
        return {
            success: true,
            embedding: [],
            tags: [],
            error: e.message || 'Failed to process image'
        }
    }
})
