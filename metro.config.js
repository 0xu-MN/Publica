const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Disable lazy bundling to avoid URIError in react-native-css-interop
config.server = {
  ...config.server,
  experimentalImportBundleSupport: false,
};

module.exports = withNativeWind(config, { input: "./global.css" });
