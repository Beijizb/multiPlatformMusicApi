const request = require('../util/request')

/**
 * 酷我音乐歌词
 * @route /lyric
 * @param {string} id - 歌曲ID
 */
module.exports = (query) => {
  return {
    validate: {
      id: {
        required: true,
        type: 'string',
        message: 'id is required'
      }
    },

    handler: async (params) => {
      const { id } = params

      try {
        const data = await request(
          `http://www.kuwo.cn/api/v1/www/music/playUrl?mid=${id}&type=music&httpsStatus=1&plat=web_www`
        )

        if (!data || data.code !== 200) {
          throw new Error(`Kuwo API error: ${data?.msg || 'unknown error'}`)
        }

        // 获取歌词
        const lrcData = await request(
          `http://www.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${id}&httpsStatus=1`
        )

        return {
          result: {
            lyric: lrcData?.data?.lrclist || [],
            lrc: lrcData?.data?.lrclist?.map(item => `[${item.lineLyric}]${item.contentLyric}`).join('\n') || ''
          },
          code: 200
        }
      } catch (error) {
        console.error('Kuwo lyric error:', error.message)
        throw new Error(`Kuwo lyric failed: ${error.message}`)
      }
    }
  }
}
