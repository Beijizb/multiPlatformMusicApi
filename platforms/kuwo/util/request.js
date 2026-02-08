const axios = require('axios')
const crypto = require('crypto')

/**
 * 酷我音乐 API 请求封装
 * 参考 lx-music 项目的实现
 */
class KuwoRequest {
  constructor() {
    this.client = axios.create({
      timeout: 60000,
      headers: {
        'User-Agent': 'okhttp/3.10.0'
      }
    })

    // WBD 加密配置
    this.wbdConfig = {
      aesMode: 'aes-128-ecb',
      aesKey: Buffer.from('cFcnPcf6Kb85RC1y3V6M5A==', 'base64'),
      appId: 'y67sprxhhpws'
    }
  }

  /**
   * AES 加密
   */
  aesEncrypt(data) {
    const cipher = crypto.createCipheriv('aes-128-ecb', this.wbdConfig.aesKey, '')
    cipher.setAutoPadding(false)

    // 手动添加 padding
    const blockSize = 16
    const paddingLength = blockSize - (data.length % blockSize)
    const paddedData = Buffer.concat([data, Buffer.alloc(paddingLength, paddingLength)])

    return Buffer.concat([cipher.update(paddedData), cipher.final()]).toString('base64')
  }

  /**
   * AES 解密
   */
  aesDecrypt(encryptedData) {
    const decipher = crypto.createDecipheriv('aes-128-ecb', this.wbdConfig.aesKey, '')
    decipher.setAutoPadding(false)

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(decodeURIComponent(encryptedData), 'base64')),
      decipher.final()
    ])

    // 移除 padding
    const paddingLength = decrypted[decrypted.length - 1]
    return decrypted.slice(0, decrypted.length - paddingLength).toString('utf8')
  }

  /**
   * 创建签名
   */
  createSign(data, time) {
    const str = `${this.wbdConfig.appId}${data}${time}`
    return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
  }

  /**
   * 构建 WBD 加密参数
   */
  buildWbdParam(jsonData) {
    const data = Buffer.from(JSON.stringify(jsonData)).toString('base64')
    const time = Date.now()
    const encodeData = this.aesEncrypt(Buffer.from(data, 'base64'))
    const sign = this.createSign(encodeData, time)

    return `data=${encodeURIComponent(encodeData)}&time=${time}&appId=${this.wbdConfig.appId}&sign=${sign}`
  }

  /**
   * 解码 WBD 响应
   */
  decodeWbdData(base64Result) {
    const decrypted = this.aesDecrypt(base64Result)
    return JSON.parse(decrypted)
  }

  /**
   * WBD API 请求
   */
  async wbdRequest(url, requestBody) {
    const fullUrl = `${url}?${this.buildWbdParam(requestBody)}`

    try {
      const response = await this.client.get(fullUrl)
      const rawData = this.decodeWbdData(response.data)
      return rawData
    } catch (error) {
      console.error('Kuwo WBD API request error:', error.message)
      throw error
    }
  }

  /**
   * 普通 API 请求（用于搜索等旧接口）
   */
  async simpleRequest(url, options = {}) {
    try {
      const response = await this.client({
        url,
        method: options.method || 'GET',
        ...options
      })
      return response.data
    } catch (error) {
      console.error('Kuwo API request error:', error.message)
      throw error
    }
  }
}

// 创建单例
const kuwoRequest = new KuwoRequest()

module.exports = kuwoRequest
module.exports.KuwoRequest = KuwoRequest

