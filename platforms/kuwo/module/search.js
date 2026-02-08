const kuwoRequest = require('../util/request')

/**
 * 酷我音乐搜索
 * @route /search
 * @param {string} keywords - 搜索关键词
 * @param {number} limit - 返回数量，默认30
 * @param {number} offset - 偏移量，默认0
 */
module.exports = (query) => {
  return {
    validate: {
      keywords: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
        message: 'keywords is required and must be 1-100 characters'
      },
      limit: {
        type: 'number',
        default: 30,
        min: 1,
        max: 100
      },
      offset: {
        type: 'number',
        default: 0,
        min: 0
      }
    },

    handler: async (params) => {
      const { keywords, limit, offset } = params
      const page = Math.floor(offset / limit) + 1

      try {
        // 使用旧的移动端搜索 API
        const url = `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(keywords)}&pn=${page - 1}&rn=${limit}&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1`

        const data = await kuwoRequest.simpleRequest(url)

        if (!data || (data.TOTAL !== '0' && data.SHOW === '0')) {
          throw new Error('Kuwo API returned invalid data')
        }

        // 转换为统一格式
        const songs = (data.abslist || []).map(song => {
          const songId = song.MUSICRID ? song.MUSICRID.replace('MUSIC_', '') : song.DC_TARGETID

          return {
            id: songId,
            name: song.SONGNAME || song.NAME,
            artists: [{
              id: song.ARTISTID || 0,
              name: (song.ARTIST || song.MАРТIST || '').replace(/&/g, '、'),
              alias: [],
              picUrl: song.web_albumpic_short ?
                'https://img1.kuwo.cn/star/albumcover/' + song.web_albumpic_short.replace('120/', '500/') : null
            }],
            album: {
              id: song.ALBUMID || 0,
              name: song.ALBUM || '',
              picUrl: song.web_albumpic_short ?
                'https://img1.kuwo.cn/star/albumcover/' + song.web_albumpic_short.replace('120/', '500/') : null
            },
            duration: parseInt(song.DURATION) * 1000 || 0,
            mvid: song.MVFLAG === '1' ? songId : 0,
            platform: 'kuwo'
          }
        })

        return {
          result: {
            songs: songs,
            songCount: parseInt(data.TOTAL) || 0,
            hasMore: page * limit < (parseInt(data.TOTAL) || 0)
          },
          code: 200
        }
      } catch (error) {
        console.error('Kuwo search error:', error.message)
        throw new Error(`Kuwo search failed: ${error.message}`)
      }
    }
  }
}
