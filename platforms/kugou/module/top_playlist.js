const { API_BASE } = require('../config')

/**
 * 酷狗推荐歌单
 * @route /top_playlist
 * @param {number} page - 页码，默认1
 * @param {number} pagesize - 每页数量，默认30
 */
module.exports = (query, request) => {
  return {
    validate: {
      page: {
        type: 'number',
        default: 1,
        min: 1
      },
      pagesize: {
        type: 'number',
        default: 30,
        min: 1,
        max: 100
      }
    },

    handler: async (params) => {
      const { page, pagesize } = params

      const url = `${API_BASE.mobile}/api/v3/special/recommend`

      const data = await request('GET', url, {
        page: page,
        pagesize: pagesize
      })

      if (!data || data.status !== 1) {
        throw new Error('Failed to get top playlists')
      }

      const playlists = (data.data?.info || []).map(playlist => ({
        id: playlist.specialid,
        name: playlist.specialname,
        coverImgUrl: playlist.imgurl?.replace('{size}', '400'),
        playCount: playlist.playcount || 0,
        trackCount: playlist.songcount || 0,
        creator: {
          userId: playlist.userid || 0,
          nickname: playlist.nickname || '',
          avatarUrl: null
        }
      }))

      return {
        result: {
          playlists: playlists,
          total: data.data?.total || 0,
          hasMore: page * pagesize < (data.data?.total || 0)
        },
        code: 200
      }
    }
  }
}
