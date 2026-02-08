const bilibiliRequest = require('../util/request')

/**
 * B站视频搜索
 * @route /search
 * @param {string} keywords - 搜索关键词
 * @param {number} limit - 返回数量，默认20
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
        default: 20,
        min: 1,
        max: 50
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

      // 解析时长字符串 "01:23" -> 83秒
      const parseDuration = (durationStr) => {
        if (typeof durationStr === 'number') return durationStr
        if (!durationStr) return 0

        const parts = durationStr.split(':').map(Number)
        if (parts.length === 2) {
          return parts[0] * 60 + parts[1]
        } else if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2]
        }
        return 0
      }

      try {
        // 使用综合搜索 API，只获取视频结果
        const data = await bilibiliRequest.request(
          'https://api.bilibili.com/x/web-interface/wbi/search/type',
          {
            keyword: keywords,
            search_type: 'video',
            page: page,
            page_size: limit,
            order: 'totalrank', // 综合排序
            duration: 0,        // 全部时长
            tids: 0            // 全部分区
          },
          { needWbi: true }
        )

        if (!data || data.code !== 0) {
          throw new Error(`Bilibili API error: ${data?.message || 'unknown error'}`)
        }

        const result = data.data?.result || []

        // 转换为统一格式
        const songs = result.map(video => ({
          id: video.bvid || `av${video.aid}`,
          name: video.title.replace(/<[^>]+>/g, ''), // 移除HTML标签
          artists: [{
            id: video.mid || 0,
            name: video.author || 'Unknown',
            alias: [],
            picUrl: video.upic || null
          }],
          album: {
            id: video.aid || 0,
            name: video.typename || '视频',
            picUrl: `https:${video.pic}` || null
          },
          duration: parseDuration(video.duration) * 1000,
          mvid: video.aid || 0,
          platform: 'bilibili',
          // B站特有字段
          bvid: video.bvid,
          aid: video.aid,
          play: video.play || 0,
          video_review: video.video_review || 0,
          description: video.description || ''
        }))

        return {
          result: {
            songs: songs,
            songCount: data.data?.numResults || 0,
            hasMore: page * limit < (data.data?.numResults || 0)
          },
          code: 200
        }
      } catch (error) {
        console.error('Bilibili search error:', error.message)
        throw new Error(`Bilibili search failed: ${error.message}`)
      }
    }
  }
}
