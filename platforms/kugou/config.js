/**
 * 酷狗音乐平台配置
 */

// API基础地址
const API_BASE = {
  mobile: 'http://mobilecdn.kugou.com',
  web: 'http://www.kugou.com',
  lyrics: 'http://lyrics.kugou.com'
}

// 缓存配置
const CACHE_CONFIG = {
  enableCache: true,
  defaultTTL: 300000, // 5分钟

  // 路由特定缓存配置
  routes: {
    search: { enabled: true, ttl: 600000 },        // 10分钟
    toplist: { enabled: true, ttl: 1800000 },      // 30分钟
    'song/detail': { enabled: true, ttl: 3600000 }, // 1小时
    'song/url': { enabled: true, ttl: 600000 },     // 10分钟
    lyric: { enabled: true, ttl: 3600000 },         // 1小时
    'artist/songs': { enabled: true, ttl: 1800000 }, // 30分钟
    'album/detail': { enabled: true, ttl: 3600000 }  // 1小时
  }
}

// 请求配置
const REQUEST_CONFIG = {
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'http://www.kugou.com/'
  }
}

/**
 * 获取缓存配置
 */
function getCacheConfig() {
  return { ...CACHE_CONFIG }
}

/**
 * 获取路由特定缓存配置
 */
function getRouteCacheConfigs() {
  return { ...CACHE_CONFIG.routes }
}

module.exports = {
  API_BASE,
  CACHE_CONFIG,
  REQUEST_CONFIG,
  getCacheConfig,
  getRouteCacheConfigs
}
