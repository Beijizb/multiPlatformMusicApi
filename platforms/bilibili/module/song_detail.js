const bilibiliRequest = require('../util/request')

/**
 * B站视频详情
 * @route /song/detail
 * @param {string} id - 视频ID (bvid 或 aid)
 */
module.exports = (query) => {
  return {
    validate: {
      id: {
        required: true,
        type: 'string',
        message: 'id is required'
      }
    },

    handler: async (params) => {
      const { id } = params

      try {
        // 判断是 bvid 还是 aid
        const requestParams = {}
        if (id.startsWith('BV') || id.startsWith('bv')) {
          requestParams.bvid = id
        } else {
          requestParams.aid = id.replace('av', '')
        }

        const data = await bilibiliRequest.simpleRequest(
          'https://api.bilibili.com/x/web-interface/view',
          requestParams
        )

        if (!data || data.code !== 0) {
          throw new Error(`Bilibili API error: ${data?.message || 'unknown error'}`)
        }

        const video = data.data

        return {
          result: {
            id: video.bvid,
            name: video.title,
            artists: [{
              id: video.owner.mid,
              name: video.owner.name,
              alias: [],
              picUrl: video.owner.face
            }],
            album: {
              id: video.aid,
              name: video.tname,
              picUrl: video.pic
            },
            duration: video.duration * 1000,
            bvid: video.bvid,
            aid: video.aid,
            cid: video.cid,
            pages: video.pages,
            description: video.desc,
            platform: 'bilibili'
          },
          code: 200
        }
      } catch (error) {
        console.error('Bilibili video detail error:', error.message)
        throw new Error(`Bilibili video detail failed: ${error.message}`)
      }
    }
  }
}
