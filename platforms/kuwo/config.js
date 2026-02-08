module.exports = {
  // API 基础地址
  baseURL: 'http://www.kuwo.cn',

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 600 // 10分钟
  },

  // 默认参数
  defaults: {
    httpsStatus: 1,
    pn: 1,  // 页码
    rn: 30  // 每页数量
  }
}
