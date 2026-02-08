const { API_BASE } = require('../config')

/**
 * 酷狗歌曲详情
 * @route /song/detail
 * @param {string} ids - 歌曲hash，多个用逗号分隔
 */
module.exports = (query, request) => {
  return {
    validate: {
      ids: {
        required: true,
        type: 'string',
        message: 'ids is required'
      }
    },

    handler: async (params) => {
      const { ids } = params
      const hashList = ids.split(',')

      const url = `${API_BASE.mobile}/api/v3/song/info`

      // 获取每首歌的详情
      const songPromises = hashList.map(hash =>
        request('GET', url, { hash: hash.trim() })
      )

      const results = await Promise.all(songPromises)

      const songs = results.map(data => {
        if (!data || data.status !== 1 || !data.data) {
          return null
        }

        const song = data.data
        return {
          id: song.hash,
          name: song.songname || song.song_name,
          artists: [{
            id: song.singerid || 0,
            name: song.singername || song.author_name,
            alias: [],
            picUrl: null
          }],
          album: {
            id: song.album_id || 0,
            name: song.album_name || '',
            picUrl: song.img || null
          },
          duration: (song.duration || song.timelength) * 1000,
          mvid: song.mvhash || 0,
          platform: 'kugou'
        }
      }).filter(song => song !== null)

      return {
        songs: songs,
        code: 200
      }
    }
  }
}
