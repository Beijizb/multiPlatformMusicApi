const { API_BASE } = require('../config')

/**
 * 酷狗专辑歌曲列表
 * @route /album_songs
 * @param {string} album_id - 专辑ID
 * @param {number} page - 页码，默认1
 * @param {number} pagesize - 每页数量，默认30
 */
module.exports = (query, request) => {
  return {
    validate: {
      album_id: {
        required: true,
        type: 'string',
        message: 'album_id is required'
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
      const { album_id, page, pagesize } = params

      const url = `${API_BASE.mobile}/api/v3/album/song`

      const data = await request('GET', url, {
        albumid: album_id,
        page: page,
        pagesize: pagesize
      })

      if (!data || data.status !== 1) {
        throw new Error('Failed to get album songs')
      }

      const songs = (data.data?.info || []).map(song => ({
        id: song.hash,
        name: song.filename?.split(' - ')[1] || song.filename,
        artists: [{
          id: song.singerId || 0,
          name: song.singername || '',
          alias: [],
          picUrl: null
        }],
        album: {
          id: album_id,
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
          total: data.data?.total || 0
        },
        code: 200
      }
    }
  }
}
