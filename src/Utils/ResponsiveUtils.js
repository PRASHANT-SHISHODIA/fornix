import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🔹 Device Type Detection
const isTablet = () => {
    let pixelDensity = PixelRatio.get();
    const adjustedWidth = SCREEN_WIDTH * pixelDensity;
    const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
    if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
        return true;
    } else return pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920);
};

const IS_TABLET = isTablet() || (SCREEN_WIDTH > 600); // Simple width check as fallback

// 🔹 Base dimensions
const baseWidth = 375;
const baseHeight = 812;

// 🔹 Scaling Functions
const scale = size => (SCREEN_WIDTH / baseWidth) * size;
const verticalScale = size => (SCREEN_HEIGHT / baseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const getResponsiveSize = (size) => {
    if (IS_TABLET) {
        return size * (SCREEN_WIDTH / 768); // Proportional scale for tablets starting at 768
    }
    const scaleFactor = SCREEN_WIDTH / baseWidth; // continuous scaling
    return size * Math.max(0.85, Math.min(scaleFactor, 1.25));
};

// 🔹 Header Transform
const getHeaderTransform = () => {
    if (IS_TABLET) return 2.5 * (SCREEN_WIDTH / 768);
    const scaleFactor = SCREEN_WIDTH / baseWidth;
    return 1.7 * Math.max(0.9, Math.min(scaleFactor, 1.15));
};

// 🔹 Search Transform
const getSearchTransform = () => {
    if (IS_TABLET) return 0.45 * (768 / SCREEN_WIDTH);
    const scaleFactor = SCREEN_WIDTH / baseWidth;
    // inverse scaling: larger width -> smaller search transform
    return 0.58 * Math.max(0.8, Math.min(1 / scaleFactor, 1.1));
}

// 🔹 Grid Columns Helper
const getGridColumns = () => {
    if (SCREEN_WIDTH >= 1024) return 4; // Large tablets/Desktop
    if (SCREEN_WIDTH >= 600) return 3;  // Tablets and foldables
    return 2; // Phones
};

export {
    scale,
    verticalScale,
    moderateScale,
    getResponsiveSize,
    getGridColumns,
    getHeaderTransform,
    getSearchTransform,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    IS_TABLET
};
