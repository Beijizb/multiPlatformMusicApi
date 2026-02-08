const { API_BASE } = require('../config')

/**
 * 酷狗歌手歌曲列表
 * @route /artist_songs
 * @param {string} singer_id - 歌手ID
 * @param {number} page - 页码，默认1
 * @param {number} pagesize - 每页数量，默认30
 */
module.exports = (query, request) => {
  return {
    validate: {
      singer_id: {
        required: true,
        type: 'string',
        message: 'singer_id is required'
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
      const { singer_id, page, pagesize } = params

      const url = `${API_BASE.mobile}/api/v3/singer/song`

      const data = await request('GET', url, {
        singerid: singer_id,
        page: page,
        pagesize: pagesize,
        sorttype: 1
      })

      if (!data || data.status !== 1) {
        throw new Error('Failed to get artist songs')
      }

      const songs = (data.data?.info || []).map(song => ({
        id: song.hash,
        name: song.songname,
        artists: [{
          id: singer_id,
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
