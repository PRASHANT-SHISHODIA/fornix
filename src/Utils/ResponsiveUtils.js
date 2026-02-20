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

// 🔹 Responsive Size for Tablets
const getResponsiveSize = (size) => {
    if (IS_TABLET) {
        return size * 1.5; // Scale up for tablets
    } else if (SCREEN_WIDTH < 375) {
        return size * 0.85; // Small phones
    } else if (SCREEN_WIDTH > 414) {
        return size * 1.15; // Large phones
    }
    return size; // Normal phones
};

// 🔹 Header Transform
const getHeaderTransform = () => {
    if (IS_TABLET) return 2.5;
    if (SCREEN_WIDTH < 375) return 1.6;
    if (SCREEN_WIDTH > 414) return 1.8;
    return 1.7;
};

// 🔹 Search Transform
const getSearchTransform = () => {
    if (IS_TABLET) return 0.45;
    if (SCREEN_WIDTH < 375) return 0.62;
    if (SCREEN_WIDTH > 414) return 0.55;
    return 0.58;
}


// 🔹 Grid Columns Helper
const getGridColumns = () => {
    if (SCREEN_WIDTH >= 1024) return 4; // Large tablets/Desktop
    if (SCREEN_WIDTH >= 768) return 3;  // Tablets
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
