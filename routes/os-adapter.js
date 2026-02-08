/**
 * OS 项目 API 路由适配器
 * 将 D:\test\os 项目的 API 路径映射到 multiPlatformMusicApi 的接口
 */

const Result = require('../core/Result')

/**
 * 注册 OS 项目兼容路由
 * @param {Express} app - Express 应用实例
 * @param {Function} handleResourceAPI - 资源API处理函数
 * @param {Object} platformFactory - 平台工厂实例
 */
function registerOSCompatibleRoutes(app, handleResourceAPI, platformFactory) {

  // ==================== 网易云音乐 API ====================

  // 搜索
  app.all('/search', async (req, res, next) => {
    // 如果已经有 platform 参数，跳过（让原有路由处理）
    if (req.query.platform || req.body?.platform) {
      return next()
    }
    // 合并 body 参数到 query（os 项目使用 POST 请求）
    if (req.body) {
      req.query = { ...req.query, ...req.body }
    }
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'search')
  })

  // 歌曲URL
  app.all('/song', async (req, res, next) => {
    if (req.query.platform || req.body?.platform) {
      return next()
    }
    // 合并 body 参数到 query
    if (req.body) {
      req.query = { ...req.query, ...req.body }
    }
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'song/url')
  })

  // 榜单列表
  app.all('/toplists', async (req, res) => {
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'toplist')
  })

  // 每日推荐歌曲
  app.all('/recommend/songs', async (req, res, next) => {
    if (req.query.platform || req.body?.platform) {
      return next()
    }
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'recommend/songs')
  })

  // 每日推荐歌单
  app.all('/recommend/resource', async (req, res, next) => {
    if (req.query.platform || req.body?.platform) {
      return next()
    }
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'recommend/resource')
  })

  // 私人FM
  app.all('/personal_fm', async (req, res) => {
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'personal/fm')
  })

  // 专属歌单
  app.all('/personalized', async (req, res, next) => {
    if (req.query.platform || req.body?.platform) {
      return next()
    }
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'personalized')
  })

  // 聚合推荐接口
  app.all('/recommend/for_you', async (req, res) => {
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'recommend/for/you')
  })

  // 歌单详情
  app.all('/playlist', async (req, res, next) => {
    if (req.query.platform || req.body?.platform) {
      return next()
    }
    req.query.platform = 'netease'
    await handleResourceAPI(req, res, 'playlist/detail')
  })

  // ==================== QQ音乐 API ====================

  // QQ音乐搜索
  app.all('/qq/search', async (req, res) => {
    req.query.platform = 'qqmusic'
    await handleResourceAPI(req, res, 'search')
  })

  // QQ音乐歌曲URL
  app.all('/qq/song', async (req, res) => {
    req.query.platform = 'qqmusic'
    await handleResourceAPI(req, res, 'song/url')
  })

  // ==================== 酷狗音乐 API ====================

  // 酷狗搜索
  app.all('/kugou/search', async (req, res) => {
    req.query.platform = 'kugou'
    await handleResourceAPI(req, res, 'search')
  })

  // 酷狗歌曲URL
  app.all('/kugou/song', async (req, res) => {
    req.query.platform = 'kugou'
    await handleResourceAPI(req, res, 'song/url')
  })

  // ==================== 酷我音乐 API ====================

  // 酷我搜索
  app.all('/kuwo/search', async (req, res) => {
    req.query.platform = 'kuwo'
    await handleResourceAPI(req, res, 'search')
  })

  // 酷我歌曲URL
  app.all('/kuwo/song', async (req, res) => {
    req.query.platform = 'kuwo'
    await handleResourceAPI(req, res, 'song/url')
  })

  // ==================== 健康检查 ====================

  // 健康检查（os项目用于检测后端是否可用）
  app.get('/health', (req, res) => {
    const platforms = platformFactory.getAvailablePlatforms()
    res.json(Result.success({
      status: 'healthy',
      version: '1.0.0',
      platforms: platforms,
      timestamp: Date.now()
    }))
  })

  console.log('✅ OS 项目兼容路由已注册')
}

module.exports = {
  registerOSCompatibleRoutes
}
