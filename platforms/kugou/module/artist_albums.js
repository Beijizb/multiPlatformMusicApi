const { API_BASE } = require('../config')

/**
 * 酷狗歌手专辑列表
 * @route /artist_albums
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

      const url = `${API_BASE.mobile}/api/v3/singer/album`

      const data = await request('GET', url, {
        singerid: singer_id,
        page: page,
        pagesize: pagesize
      })

      if (!data || data.status !== 1) {
        throw new Error('Failed to get artist albums')
      }

      const albums = (data.data?.info || []).map(album => ({
        id: album.albumid,
        name: album.albumname,
        picUrl: album.imgurl?.replace('{size}', '400'),
        publishTime: album.publishtime,
        size: album.songcount || 0,
        artist: {
          id: singer_id,
          name: album.singername || '',
          picUrl: null
        }
      }))

      return {
        result: {
          albums: albums,
          total: data.data?.total || 0,
          hasMore: page * pagesize < (data.data?.total || 0)
        },
        code: 200
      }
    }
  }
}
