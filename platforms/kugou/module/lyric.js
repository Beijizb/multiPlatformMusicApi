const { API_BASE } = require('../config')

/**
 * 酷狗歌词
 * @route /lyric
 * @param {string} id - 歌曲hash
 */
module.exports = (query, request) => {
  return {
    validate: {
      id: {
        required: true,
        type: 'string',
        message: 'id (song hash) is required'
      }
    },

    handler: async (params) => {
      const { id } = params

      // 第一步：获取歌曲信息，包含歌词ID
      const infoUrl = `${API_BASE.mobile}/api/v3/song/info`
      const infoData = await request('GET', infoUrl, { hash: id })

      if (!infoData || infoData.status !== 1 || !infoData.data) {
        return {
          lrc: null,
          code: 404,
          message: 'Song not found'
        }
      }

      const song = infoData.data

      // 第二步：获取歌词
      if (!song.lyrics) {
        return {
          lrc: { lyric: '' },
          code: 200
        }
      }

      const lyricUrl = `${API_BASE.lyrics}/search`
      const lyricData = await request('GET', lyricUrl, {
        ver: 1,
        man: 'yes',
        client: 'mobi',
        keyword: `${song.songname} - ${song.singername}`,
        duration: song.duration,
        hash: id
      })

      if (!lyricData || !lyricData.candidates || lyricData.candidates.length === 0) {
        return {
          lrc: { lyric: '' },
          code: 200
        }
      }

      // 获取第一个候选歌词
      const candidate = lyricData.candidates[0]
      const lyricContentUrl = `${API_BASE.lyrics}/download`
      const lyricContent = await request('GET', lyricContentUrl, {
        id: candidate.id,
        accesskey: candidate.accesskey,
        fmt: 'lrc',
        charset: 'utf8',
        client: 'mobi'
      })

      // 解析歌词内容
      let lyricText = ''
      if (typeof lyricContent === 'string') {
        lyricText = lyricContent
      } else if (lyricContent && lyricContent.content) {
        // Base64解码
        lyricText = Buffer.from(lyricContent.content, 'base64').toString('utf-8')
      }

      return {
        lrc: {
          lyric: lyricText
        },
        code: 200
      }
    }
  }
}
