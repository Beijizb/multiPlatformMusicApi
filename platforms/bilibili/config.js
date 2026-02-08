module.exports = {
  // API 基础地址
  baseURL: 'https://api.bilibili.com',

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 600 // 10分钟
  },

  // 默认参数
  defaults: {
    page: 1,
    pageSize: 20
  },

  // 搜索类型
  searchType: {
    video: 'video',      // 视频
    bangumi: 'media_bangumi', // 番剧
    pgc: 'media_ft',     // 影视
    live: 'live',        // 直播
    article: 'article',  // 专栏
    user: 'bili_user'    // 用户
  }
}
