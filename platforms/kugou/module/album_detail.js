const { API_BASE } = require('../config')

/**
 * 酷狗专辑详情
 * @route /album_detail
 * @param {string} album_id - 专辑ID
 */
module.exports = (query, request) => {
  return {
    validate: {
      album_id: {
        required: true,
        type: 'string',
        message: 'album_id is required'
      }
    },

    handler: async (params) => {
      const { album_id } = params

      const url = `${API_BASE.mobile}/api/v3/album/info`

      const data = await request('GET', url, {
        albumid: album_id
      })

      if (!data || data.status !== 1 || !data.data) {
        throw new Error('Album not found')
      }

      const album = data.data

      return {
        result: {
          id: album.albumid,
          name: album.albumname,
          picUrl: album.imgurl?.replace('{size}', '400'),
          publishTime: album.publishtime,
          company: album.company || '',
          description: album.intro || '',
          artist: {
            id: album.singerid,
            name: album.singername,
            picUrl: null
          },
          songs: []
        },
        code: 200
      }
    }
  }
}
