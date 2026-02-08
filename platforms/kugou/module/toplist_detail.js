const { API_BASE } = require('../config')

/**
 * 酷狗榜单详情
 * @route /toplist/detail
 * @param {string} id - 榜单ID
 * @param {number} limit - 返回数量，默认100
 * @param {number} offset - 偏移量，默认0
 */
module.exports = (query, request) => {
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

      const url = `${API_BASE.mobile}/api/v3/rank/song`

      const data = await request('GET', url, {
        rankid: id,
        page: page,
        pagesize: limit,
        _: Date.now()
      })

      if (!data || data.status !== 1 || !data.data) {
        throw new Error('Failed to fetch Kugou toplist detail')
      }

      // 转换歌曲列表
      const songs = (data.data.info || []).map(song => ({
        id: song.hash,
        name: song.filename?.split(' - ')[1] || song.songname,
        artists: [{
          id: 0,
          name: song.filename?.split(' - ')[0] || song.singername,
          alias: [],
          picUrl: null
        }],
        album: {
          id: 0,
          name: song.album_name || '',
          picUrl: null
        },
        duration: song.duration * 1000,
        platform: 'kugou'
      }))

      return {
        playlist: {
          id: id,
          name: data.data.rankname || '',
          coverImgUrl: data.data.imgurl?.replace('{size}', '400'),
          trackCount: data.data.count || 0,
          tracks: songs
        },
        songs: songs,
        total: data.data.count || 0,
        code: 200
      }
    }
  }
}
