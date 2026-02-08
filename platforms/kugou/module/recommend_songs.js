const { createRequest } = require('../util/request')
const { API_BASE } = require('../config')

/**
 * 酷狗每日推荐歌曲
 * @route /recommend/songs
 */
module.exports = (query, request) => {
  return {
    validate: {},

    handler: async (params) => {
      const url = `${API_BASE.mobile}/api/v3/recommend/song`

      const data = await createRequest({
        url: url,
        method: 'GET',
        params: {
          pagesize: 30
        },
        encryptType: 'android',
        cookie: params.cookie || {}
      })

      if (!data || data.status !== 1) {
        throw new Error('Failed to get recommend songs')
      }

      const songs = (data.data?.info || []).map(song => ({
        id: song.hash,
        name: song.songname,
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
          songs: songs
        },
        code: 200
      }
    }
  }
}
