const { API_BASE } = require('../config')

/**
 * 酷狗热门搜索
 * @route /search_hot
 */
module.exports = (query, request) => {
  return {
    validate: {},

    handler: async (params) => {
      const url = `${API_BASE.mobile}/api/v3/search/hot`

      const data = await request('GET', url, {})

      if (!data || data.status !== 1) {
        throw new Error('Failed to get hot search')
      }

      const hotList = (data.data?.info || []).map((item, index) => ({
        searchWord: item.keyword || '',
        score: item.count || 0,
        content: item.keyword || '',
        iconUrl: null,
        order: index + 1
      }))

      return {
        result: {
          hots: hotList
        },
        code: 200
      }
    }
  }
}
