const axios = require('axios');
const { cryptoMd5 } = require('./crypto');
const { signKey, signatureAndroidParams, signatureRegisterParams, signatureWebParams } = require('./helper');
const { parseCookieString } = require('./util');
const { appid, clientver, liteAppid, liteClientver } = require('./config.json');

/**
 * 酷狗音乐API请求封装
 * 支持完整的签名和加密机制
 */
class KugouRequest {
  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi'
      }
    });
  }

  /**
   * 创建请求
   */
  async createRequest(options) {
    return new Promise(async (resolve, reject) => {
      const isLite = process.env.platform === 'lite';
      const dfid = options?.cookie?.dfid || '-';
      // 使用一个默认的 mid 值，如果没有提供
      const mid = `${options?.cookie?.KUGOU_API_MID || '334689572176563962868706300678062568191'}`;
      const uuid = '-';
      const token = options?.cookie?.token || '';
      const userid = options?.cookie?.userid || 0;
      const clienttime = Math.floor(Date.now() / 1000);
      const ip = options?.realIP || options?.ip || '';
      const headers = {
        dfid,
        clienttime,
        mid,
        'kg-rc': '1',
        'kg-thash': '5d816a0',
        'kg-rec': 1,
        'kg-rf': 'B9EDA08A64250DEFFBCADDEE00F8F25F'
      };

      if (ip) {
        headers['X-Real-IP'] = ip;
        headers['X-Forwarded-For'] = ip;
      }

      const defaultParams = {
        dfid,
        mid,
        uuid,
        appid: isLite ? liteAppid : appid,
        clientver: isLite ? liteClientver : clientver,
        clienttime,
      };

      if (token) defaultParams['token'] = token;
      if (userid && userid !== 0) defaultParams['userid'] = userid;

      const params = options?.clearDefaultParams
        ? options?.params || {}
        : Object.assign({}, defaultParams, options?.params || {});

      headers['clienttime'] = params.clienttime;

      if (options?.encryptKey) {
        params['key'] = signKey(params['hash'], params['mid'], params['userid'], params['appid']);
      }

      const data = typeof options?.data === 'object' ? JSON.stringify(options.data) : options?.data || '';

      if (!params['signature'] && !options.notSignature) {
        switch (options?.encryptType) {
          case 'register':
            params['signature'] = signatureRegisterParams(params);
            break;
          case 'web':
            params['signature'] = signatureWebParams(params);
            break;
          case 'android':
          default:
            params['signature'] = signatureAndroidParams(params, data);
            break;
        }
      }

      options['params'] = params;
      options['baseURL'] = options?.baseURL || 'https://gateway.kugou.com';
      options['headers'] = Object.assign(
        { 'User-Agent': 'Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi' },
        options?.headers || {},
        { dfid, clienttime: params.clienttime, mid }
      );

      // 检测 URL 是否已经是完整 URL（包含 http:// 或 https://）
      const isFullUrl = options.url && (options.url.startsWith('http://') || options.url.startsWith('https://'));

      const requestOptions = {
        params,
        data: options?.data,
        method: options.method,
        baseURL: isFullUrl ? undefined : options?.baseURL,  // 如果是完整URL，不使用baseURL
        url: options.url,
        headers: Object.assign({}, options?.headers || {}, headers),
        withCredentials: true,
        responseType: options.responseType,
      };

      // 调试日志
      console.log('Kugou API Request:', {
        url: isFullUrl ? requestOptions.url : `${requestOptions.baseURL}${requestOptions.url}`,
        method: requestOptions.method,
        params: requestOptions.params
      });

      if (options.data) requestOptions.data = options.data;
      if (params) requestOptions.params = params;

      if (options.baseURL?.includes('openapicdn')) {
        const url = requestOptions.url;
        const _params = Object.keys(params)
          .map((key) => `${key}=${params[key]}`)
          .join('&');
        requestOptions.url = `${url}?${_params}`;
        requestOptions.params = {};
      }

      const answer = { status: 500, body: {}, cookie: [], headers: {} };
      try {
        const response = await axios(requestOptions);
        const body = response.data;

        answer.cookie = (response.headers['set-cookie'] || []).map((x) => parseCookieString(x));

        if (response.headers['ssa-code']) {
          answer.headers['ssa-code'] = response.headers['ssa-code'];
        }

        try {
          answer.body = JSON.parse(body.toString());
        } catch (error) {
          answer.body = body;
        }

        if (response.data.status === 0 || (response.data?.error_code && response.data.error_code !== 0)) {
          answer.status = 502;
          reject(answer);
        } else {
          answer.status = 200;
          resolve(answer);
        }
      } catch (e) {
        answer.status = 502;
        answer.body = { status: 0, msg: e.message };
        reject(answer);
      }
    });
  }

  /**
   * 简化的请求接口（用于模块调用）
   */
  async request(method, url, data = {}, options = {}) {
    const requestOptions = {
      method: method.toUpperCase(),
      url: url,
      ...options
    };

    if (method.toUpperCase() === 'GET') {
      requestOptions.params = data;
    } else {
      requestOptions.data = data;
    }

    try {
      const result = await this.createRequest(requestOptions);
      return result.body;
    } catch (error) {
      if (error.body) {
        throw new Error(error.body.msg || 'Kugou API request failed');
      }
      throw error;
    }
  }
}

// 创建单例
const kugouRequest = new KugouRequest();

/**
 * 统一请求接口
 */
async function request(method, url, data = {}, options = {}) {
  return await kugouRequest.request(method, url, data, options);
}

/**
 * 导出完整的请求创建函数（用于需要完整功能的模块）
 */
async function createRequest(options) {
  return await kugouRequest.createRequest(options);
}

module.exports = request;
module.exports.createRequest = createRequest;
module.exports.KugouRequest = KugouRequest;
