const { API_BASE } = require('../config')

/**
 * 酷狗歌单歌曲列表
 * @route /playlist_track_all
 * @param {string} specialid - 歌单ID
 * @param {number} page - 页码，默认1
 * @param {number} pagesize - 每页数量，默认30
 */
module.exports = (query, request) => {
  return {
    validate: {
      specialid: {
        required: true,
        type: 'string',
        message: 'specialid is required'
      },
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
      const { specialid, page, pagesize } = params

      const url = `${API_BASE.mobile}/api/v3/special/song`

      const data = await request('GET', url, {
        specialid: specialid,
        page: page,
        pagesize: pagesize
      })

      if (!data || data.status !== 1) {
        throw new Error('Failed to get playlist tracks')
      }

      const songs = (data.data?.info || []).map(song => ({
        id: song.hash,
        name: song.songname || song.filename,
        artists: [{
          id: song.singerid || 0,
          name: song.singername || '',
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
          total: data.data?.total || 0,
          hasMore: page * pagesize < (data.data?.total || 0)
        },
        code: 200
      }
    }
  }
}
