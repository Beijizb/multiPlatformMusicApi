const axios = require('axios')
const crypto = require('crypto')

/**
 * B站 API 请求封装
 * 支持 Wbi 签名
 */
class BilibiliRequest {
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
      }
    })

    // Wbi 签名密钥（需要定期更新）
    this.wbiKeys = {
      img_key: '',
      sub_key: ''
    }
  }

  /**
   * 获取 Wbi 签名密钥
   */
  async getWbiKeys() {
    try {
      const response = await this.client.get('https://api.bilibili.com/x/web-interface/nav')
      const { img_url, sub_url } = response.data.data.wbi_img

      this.wbiKeys.img_key = img_url.substring(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.'))
      this.wbiKeys.sub_key = sub_url.substring(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.'))

      return this.wbiKeys
    } catch (error) {
      console.error('Failed to get Wbi keys:', error.message)
      // 使用默认密钥
      return this.wbiKeys
    }
  }

  /**
   * 生成 Wbi 签名
   */
  encWbi(params) {
    const mixinKeyEncTab = [
      46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
      33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
      61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
      36, 20, 34, 44, 52
    ]

    const getMixinKey = (orig) => {
      return mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)
    }

    const { img_key, sub_key } = this.wbiKeys
    const mixin_key = getMixinKey(img_key + sub_key)
    const curr_time = Math.floor(Date.now() / 1000)

    // 添加 wts 参数
    params.wts = curr_time

    // 按照 key 排序
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {})

    // 生成查询字符串
    const query = Object.keys(sortedParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(sortedParams[key])}`)
      .join('&')

    // 计算签名
    const w_rid = crypto.createHash('md5').update(query + mixin_key).digest('hex')

    return { ...sortedParams, w_rid }
  }

  /**
   * 发送请求（带 Wbi 签名）
   */
  async request(url, params = {}, options = {}) {
    try {
      // 如果需要 Wbi 签名
      if (options.needWbi) {
        if (!this.wbiKeys.img_key) {
          await this.getWbiKeys()
        }
        params = this.encWbi(params)
      }

      const response = await this.client({
        url,
        method: options.method || 'GET',
        params,
        ...options
      })

      return response.data
    } catch (error) {
      console.error('Bilibili API request error:', error.message)
      throw error
    }
  }

  /**
   * 简单请求（不需要签名）
   */
  async simpleRequest(url, params = {}, options = {}) {
    try {
      const response = await this.client({
        url,
        method: options.method || 'GET',
        params,
        ...options
      })
      return response.data
    } catch (error) {
      console.error('Bilibili API request error:', error.message)
      throw error
    }
  }
}

// 创建单例
const bilibiliRequest = new BilibiliRequest()

module.exports = bilibiliRequest
module.exports.BilibiliRequest = BilibiliRequest
