const bilibiliRequest = require('../util/request')

/**
 * B站视频音频流地址
 * @route /song/url
 * @param {string} id - 视频ID (bvid)
 * @param {string} cid - 视频cid（可选，如果不提供则自动获取）
 */
module.exports = (query) => {
  return {
    validate: {
      id: {
        required: true,
        type: 'string',
        message: 'id is required'
      },
      cid: {
        type: 'string',
        default: null
      }
    },

    handler: async (params) => {
      let { id, cid } = params

      // 获取音质描述
      const getAudioQuality = (id) => {
        const qualityMap = {
          30216: '64K',
          30232: '132K',
          30280: '192K',
          30250: '杜比全景声',
          30251: 'Hi-Res无损'
        }
        return qualityMap[id] || 'Unknown'
      }

      try {
        // 如果没有提供 cid，先获取视频详情
        if (!cid) {
          const requestParams = {}
          if (id.startsWith('BV') || id.startsWith('bv')) {
            requestParams.bvid = id
          } else {
            requestParams.aid = id.replace('av', '')
          }

          const videoData = await bilibiliRequest.simpleRequest(
            'https://api.bilibili.com/x/web-interface/view',
            requestParams
          )

          if (!videoData || videoData.code !== 0) {
            throw new Error(`Failed to get video info: ${videoData?.message}`)
          }

          cid = videoData.data.cid
        }

        // 获取音频流地址
        // fnval=16 表示 DASH 格式
        // qn=64 表示 720P（默认）
        const streamParams = {
          bvid: id.startsWith('BV') || id.startsWith('bv') ? id : undefined,
          avid: id.startsWith('av') ? id.replace('av', '') : undefined,
          cid: cid,
          fnval: 16,  // DASH 格式
          fnver: 0,
          fourk: 1
        }

        // 移除 undefined 的参数
        Object.keys(streamParams).forEach(key =>
          streamParams[key] === undefined && delete streamParams[key]
        )

        const data = await bilibiliRequest.request(
          'https://api.bilibili.com/x/player/wbi/playurl',
          streamParams,
          { needWbi: true }
        )

        if (!data || data.code !== 0) {
          throw new Error(`Bilibili API error: ${data?.message || 'unknown error'}`)
        }

        // 提取音频流
        const dash = data.data.dash
        const audioStreams = dash?.audio || []

        if (audioStreams.length === 0) {
          throw new Error('No audio stream available')
        }

        // 选择最高质量的音频流
        const bestAudio = audioStreams.reduce((best, current) => {
          return (current.id > best.id) ? current : best
        }, audioStreams[0])

        return {
          result: {
            id: id,
            url: bestAudio.baseUrl || bestAudio.base_url,
            backupUrl: bestAudio.backupUrl || bestAudio.backup_url || [],
            quality: getAudioQuality(bestAudio.id),
            size: bestAudio.size || 0,
            type: bestAudio.codecs || 'audio/mp4',
            // 需要 Referer 和 User-Agent
            needReferer: true,
            referer: 'https://www.bilibili.com'
          },
          code: 200
        }
      } catch (error) {
        console.error('Bilibili audio url error:', error.message)
        throw new Error(`Bilibili audio url failed: ${error.message}`)
      }
    }
  }
}
