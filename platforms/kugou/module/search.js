const { createRequest } = require('../util/request')

/**
 * 酷狗音乐搜索
 * @route /search
 * @param {string} keywords - 搜索关键词
 * @param {number} limit - 返回数量，默认30
 * @param {number} offset - 偏移量，默认0
 */
module.exports = (query, request) => {
  return {
    validate: {
      keywords: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
        message: 'keywords is required and must be 1-100 characters'
      },
      limit: {
        type: 'number',
        default: 30,
        min: 1,
        max: 100
      },
      offset: {
        type: 'number',
        default: 0,
        min: 0
      }
    },

    handler: async (params) => {
      const { keywords, limit, offset } = params
      const page = Math.floor(offset / limit) + 1

      try {
        const dataMap = {
          albumhide: 0,
          iscorrection: 1,
          keyword: keywords,
          nocollect: 0,
          page: page,
          pagesize: limit,
          platform: 'AndroidFilter',
        }

        const result = await createRequest({
          url: 'http://mobilecdn.kugou.com/api/v3/search/song',
          method: 'GET',
          params: dataMap,
          encryptType: 'android',
          headers: { 'x-router': 'complexsearch.kugou.com' },
          cookie: params.cookie || {}
        })

        if (!result || !result.body) {
          throw new Error('No response from Kugou API')
        }

        if (result.body.status !== 1) {
          throw new Error(`Kugou API error: status=${result.body.status}, error_code=${result.body.error_code}, msg=${result.body.error_msg || result.body.msg || 'unknown'}`)
        }

        const data = result.body.data

        if (!data) {
          throw new Error('No data in response')
        }

        // 转换为统一格式
        const songs = (data.info || []).map(song => ({
          id: song.hash,
          name: song.songname,
          artists: [{
            id: song.singerId || 0,
            name: song.singername,
            alias: [],
            picUrl: null
          }],
          album: {
            id: song.album_id || 0,
            name: song.album_name || '',
            picUrl: null
          },
          duration: song.duration * 1000,
          mvid: song.mvhash || 0,
          platform: 'kugou'
        }))

        return {
          result: {
            songs: songs,
            songCount: data.total || 0,
            hasMore: page * limit < (data.total || 0)
          },
          code: 200
        }
      } catch (error) {
        console.error('Kugou search error details:', {
          message: error.message,
          status: error.status,
          body: error.body
        })
        throw new Error(`Kugou search failed: ${error.message || error}`)
      }
    }
  }
}
