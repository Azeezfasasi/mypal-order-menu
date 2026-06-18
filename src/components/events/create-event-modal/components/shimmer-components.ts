/**
 * Image Generation Shimmer Components
 *
 * This file contains shimmer components used during AI flyer generation
 * to provide visual feedback to users while their images are being created.
 */

// Enhanced shimmer with multi-stage animation
export { default as ImageGenerationShimmer } from "./ImageGenerationShimmer";

// Simple shimmer with basic animation
export { default as SimpleImageShimmer } from "./SimpleImageShimmer";

/**
 * Usage:
 *
 * // Enhanced version with stages
 * import { ImageGenerationShimmer } from './components';
 *
 * {isGenerating && <ImageGenerationShimmer />}
 *
 * // Simple version
 * import { SimpleImageShimmer } from './components';
 *
 * {isGenerating && <SimpleImageShimmer message="Custom message..." />}
 */
