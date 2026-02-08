const { createRequest } = require('../util/request')

/**
 * 酷狗音乐热门搜索（测试用）
 * @route /search_hot_test
 */
module.exports = (query, request) => {
  return {
    validate: {},

    handler: async (params) => {
      try {
        const result = await createRequest({
          url: '/v3/search/hot',
          method: 'GET',
          params: {},
          encryptType: 'android',
          headers: { 'x-router': 'complexsearch.kugou.com' }
        })

        console.log('Hot search result:', JSON.stringify(result, null, 2))

        if (!result || !result.body) {
          throw new Error('No response from Kugou API')
        }

        return {
          result: result.body,
          code: 200
        }
      } catch (error) {
        console.error('Hot search error:', error)
        throw new Error(`Hot search failed: ${error.message || error}`)
      }
    }
  }
}
