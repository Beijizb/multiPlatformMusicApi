const { API_BASE } = require('../config')

/**
 * 酷狗歌手详情
 * @route /artist_detail
 * @param {string} singer_id - 歌手ID
 */
module.exports = (query, request) => {
  return {
    validate: {
      singer_id: {
        required: true,
        type: 'string',
        message: 'singer_id is required'
      }
    },

    handler: async (params) => {
      const { singer_id } = params

      const url = `${API_BASE.mobile}/api/v3/singer/info`

      const data = await request('GET', url, {
        singerid: singer_id
      })

      if (!data || data.status !== 1 || !data.data) {
        throw new Error('Artist not found')
      }

      const artist = data.data

      return {
        result: {
          id: artist.singerid,
          name: artist.singername,
          picUrl: artist.imgurl?.replace('{size}', '400'),
          alias: [],
          briefDesc: artist.intro || '',
          albumSize: artist.albumcount || 0,
          musicSize: artist.songcount || 0
        },
        code: 200
      }
    }
  }
}
