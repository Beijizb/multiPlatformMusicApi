const request = require('../util/request')

/**
 * 酷我音乐歌曲播放地址
 * @route /song/url
 * @param {string} id - 歌曲ID
 * @param {string} br - 音质，默认128kmp3
 */
module.exports = (query) => {
  return {
    validate: {
      id: {
        required: true,
        type: 'string',
        message: 'id is required'
      },
      br: {
        type: 'string',
        default: '128kmp3'
      }
    },

    handler: async (params) => {
      const { id, br } = params

      try {
        const data = await request(
          `http://www.kuwo.cn/api/v1/www/music/playUrl?mid=${id}&type=music&httpsStatus=1&plat=web_www&from=&br=${br}`
        )

        if (!data || data.code !== 200) {
          throw new Error(`Kuwo API error: ${data?.msg || 'unknown error'}`)
        }

        return {
          result: {
            id: id,
            url: data.data?.url || null,
            br: br,
            size: data.data?.size || 0,
            type: data.data?.type || 'mp3'
          },
          code: 200
        }
      } catch (error) {
        console.error('Kuwo song url error:', error.message)
        throw new Error(`Kuwo song url failed: ${error.message}`)
      }
    }
  }
}
