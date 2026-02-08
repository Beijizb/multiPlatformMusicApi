const { API_BASE } = require('../config')

/**
 * 酷狗搜索建议
 * @route /search_suggest
 * @param {string} keywords - 搜索关键词
 */
module.exports = (query, request) => {
  return {
    validate: {
      keywords: {
        required: true,
        type: 'string',
        min: 1,
        message: 'keywords is required'
      }
    },

    handler: async (params) => {
      const { keywords } = params

      const url = `${API_BASE.mobile}/api/v3/search/suggest`

      const data = await request('GET', url, {
        keyword: keywords
      })

      if (!data || data.status !== 1) {
        throw new Error('Failed to get search suggestions')
      }

      const suggestions = (data.data?.info || []).map(item => ({
        keyword: item.keyword || '',
        type: item.type || 0
      }))

      return {
        result: {
          allMatch: suggestions
        },
        code: 200
      }
    }
  }
}
