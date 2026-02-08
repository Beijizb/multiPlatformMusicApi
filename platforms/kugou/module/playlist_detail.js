const { API_BASE } = require('../config')

/**
 * 酷狗歌单详情
 * @route /playlist_detail
 * @param {string} specialid - 歌单ID
 */
module.exports = (query, request) => {
  return {
    validate: {
      specialid: {
        required: true,
        type: 'string',
        message: 'specialid is required'
      }
    },

    handler: async (params) => {
      const { specialid } = params

      const url = `${API_BASE.mobile}/api/v3/special/info`

      const data = await request('GET', url, {
        specialid: specialid
      })

      if (!data || data.status !== 1 || !data.data) {
        throw new Error('Playlist not found')
      }

      const playlist = data.data

      return {
        result: {
          id: playlist.specialid,
          name: playlist.specialname,
          coverImgUrl: playlist.imgurl?.replace('{size}', '400'),
          description: playlist.intro || '',
          tags: [],
          playCount: playlist.playcount || 0,
          trackCount: playlist.songcount || 0,
          creator: {
            userId: playlist.userid || 0,
            nickname: playlist.nickname || '',
            avatarUrl: playlist.user_avatar || null
          },
          createTime: playlist.publishtime || 0
        },
        code: 200
      }
    }
  }
}
