const kuwoRequest = require('../util/request')

/**
 * 酷我音乐榜单详情
 * @route /toplist/detail
 * @param {string} id - 榜单ID
 * @param {number} limit - 返回数量，默认30
 * @param {number} offset - 偏移量，默认0
 */
module.exports = (query) => {
  return {
    validate: {
      id: {
        required: true,
        type: 'string',
        message: 'id is required'
      },
      limit: {
        type: 'number',
        default: 100,
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
      const { id, limit, offset } = params
      const page = Math.floor(offset / limit) + 1

      try {
        // 使用 WBD 加密 API
        const requestBody = {
          uid: '',
          devId: '',
          sFrom: 'kuwo_sdk',
          user_type: 'AP',
          carSource: 'kwplayercar_ar_6.0.1.0_apk_keluze.apk',
          id: id,
          pn: page - 1,
          rn: limit,
        }

        const rawData = await kuwoRequest.wbdRequest(
          'https://wbd.kuwo.cn/api/bd/bang/bang_info',
          requestBody
        )

        if (rawData.code != 200 || !rawData.data?.musiclist) {
          throw new Error(`Kuwo API error: ${rawData.msg || 'unknown error'}`)
        }

        const data = rawData.data

        // 转换为统一格式
        const songs = (data.musiclist || []).map(song => {
          const songId = song.id

          return {
            id: songId,
            name: song.name,
            artists: [{
              id: song.artistid || 0,
              name: (song.artist || '').replace(/&/g, '、'),
              alias: [],
              picUrl: null
            }],
            album: {
              id: song.albumId || song.albumid || 0,
              name: song.album || '',
              picUrl: song.pic || null
            },
            duration: parseInt(song.duration) * 1000 || 0,
            mvid: 0,
            platform: 'kuwo'
          }
        })

        return {
          result: {
            songs: songs,
            total: parseInt(data.total) || 0
          },
          code: 200
        }
      } catch (error) {
        console.error('Kuwo toplist detail error:', error.message)
        throw new Error(`Kuwo toplist detail failed: ${error.message}`)
      }
    }
  }
}
