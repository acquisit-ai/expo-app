const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 添加路径别名支持
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

// 只支持移动端平台
config.resolver.platforms = ['ios', 'android'];

// 确保正确处理 TypeScript 文件
config.resolver.sourceExts.push('ts', 'tsx');

module.exports = config;