const { API_BASE } = require('../config')

/**
 * 酷狗歌曲播放地址
 * @route /song/url
 * @param {string} id - 歌曲hash
 */
module.exports = (query, request) => {
  return {
    validate: {
      id: {
        required: true,
        type: 'string',
        message: 'id (song hash) is required'
      }
    },

    handler: async (params) => {
      const { id } = params

      const url = `${API_BASE.mobile}/api/v3/song/url`

      const data = await request('GET', url, {
        hash: id,
        album_id: '',
        _: Date.now()
      })

      if (!data || data.status !== 1 || !data.data) {
        return {
          data: null,
          code: 404,
          message: 'Song URL not found'
        }
      }

      return {
        data: data.data.play_url || null,
        code: 200
      }
    }
  }
}
