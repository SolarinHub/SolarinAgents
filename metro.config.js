const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/*
 * Only push extensions not already in Metro's default assetExts.
 * Defaults include: jpg, jpeg, png, gif, webp, mp4, mp3, ttf, otf.
 * json is a sourceExt and must never appear in assetExts.
 */
defaultConfig.resolver.assetExts.push(
  'woff',
  'woff2',
  'obj',
  'mtl',
  'JPG',
  'JPEG',
  'PNG',
  'GIF',
  'WEBP',
  'pdf'
);

defaultConfig.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.unstable_enablePackageExports = false;

defaultConfig.resolver.resolverMainFields = ['react-native', 'main'];

defaultConfig.resolver.platforms = ['ios', 'android', 'native'];

module.exports = defaultConfig;