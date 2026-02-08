const { API_BASE } = require('../config')

/**
 * 酷狗榜单列表
 * @route /toplist
 */
module.exports = (query, request) => {
  return {
    validate: {},

    handler: async (params) => {
      const url = `${API_BASE.mobile}/api/v3/rank/list`

      const data = await request('GET', url, {
        version: 9108,
        plat: 0,
        _: Date.now()
      })

      if (!data || data.status !== 1 || !data.data) {
        throw new Error('Failed to fetch Kugou toplists')
      }

      // 转换为统一格式
      const toplists = (data.data.info || []).map(list => ({
        id: list.rankid,
        name: list.rankname,
        coverUrl: list.imgurl?.replace('{size}', '400'),
        description: list.intro || '',
        updateFrequency: '每日更新',
        trackCount: 0
      }))

      return {
        toplists: toplists,
        total: toplists.length,
        code: 200
      }
    }
  }
}
