import {
    defineConfig,
    presetUno,
    presetIcons,
    presetTypography,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'
import { presetDaisy } from '@ameinhardt/unocss-preset-daisy'

export default defineConfig({
    presets: [
        presetUno(),
        presetDaisy({
            themes: ['light', 'dark', 'cupcake', 'emerald', 'corporate', 'synthwave', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'],
            rtl: false,
        }),
        presetIcons({
            scale: 1.2,
        }),
        presetTypography(),
    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
    ],
})
