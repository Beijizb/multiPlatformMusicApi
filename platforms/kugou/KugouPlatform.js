const BasePlatform = require('../base/BasePlatform')
const request = require('./util/request')
const path = require('path')
const kugouConfig = require('./config')
const Result = require('../../core/Result')
const { globalLimiter } = require('../../core/ConcurrencyLimiter')

/**
 * 酷狗音乐平台适配器
 * 封装酷狗音乐API到统一接口
 */
class KugouPlatform extends BasePlatform {
  constructor(config = {}) {
    super({
      name: 'kugou',
      ...kugouConfig.getCacheConfig(),
      ...config
    })
  }

  /**
   * 初始化平台
   */
  async doInitialize() {
    const modulePath = path.join(__dirname, 'module')

    // 动态加载模块
    await this.loadModules(modulePath)

    this.logger.debug(`Kugou platform initialized with ${this.modules.size} modules`)
  }

  /**
   * 创建请求函数
   */
  createRequestFunction() {
    return (method, url, data, options = {}) => {
      return request(method, url, data, options)
    }
  }

  /**
   * 模块调用前的验证（可选）
   */
  async beforeModuleCall(query, route) {
    // 酷狗暂时不需要特殊的前置验证
    return true
  }

  /**
   * 重写 callModule 方法以支持酷狗模块格式
   * 酷狗模块返回 { validate, handler } 对象
   */
  async callModule(route, req) {
    const startTime = Date.now()
    const query = { ...req.query, ...req.body }
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

    try {
      if (!this.initialized) {
        throw new Error(`Platform ${this.name} is not initialized`)
      }

      const moduleFunction = this.modules.get(route)
      if (!moduleFunction) {
        throw new Error(`Module ${route} not found in platform ${this.name}`)
      }

      // 准备参数，包含 cookie
      const paramsWithCookie = {
        ...query,
        cookie: req.cookies || {}
      }

      // 调用模块函数获取配置对象
      const moduleConfig = moduleFunction(paramsWithCookie, this.createRequestFunction())

      // 验证参数
      if (moduleConfig.validate) {
        const validationErrors = this.validateModuleParams(query, moduleConfig.validate)
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join('; ')}`)
        }
      }

      // 应用默认值，并保留 cookie
      const params = {
        ...this.applyDefaults(query, moduleConfig.validate || {}),
        cookie: req.cookies || {}
      }

      // 执行处理器
      const result = await globalLimiter.execute(async () => {
        return await moduleConfig.handler(params)
      })

      const responseTime = Date.now() - startTime

      this.logger.request(`/${route}`, responseTime, {
        platform: this.name,
        ip: clientIp
      })

      return Result.success(result.result || result, result.code || 200)

    } catch (error) {
      const responseTime = Date.now() - startTime

      this.logger.request(`/${route}`, responseTime, {
        platform: this.name,
        error: error.message,
        params: query,
        ip: clientIp
      })

      return Result.error(error, 500)
    }
  }

  /**
   * 验证模块参数
   */
  validateModuleParams(query, validateRules) {
    const errors = []

    for (const [paramName, rule] of Object.entries(validateRules)) {
      const value = query[paramName]

      // 检查必填
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(rule.message || `${paramName} is required`)
        continue
      }

      // 如果值不存在且不是必填，跳过后续验证
      if (value === undefined || value === null) {
        continue
      }

      // 类型检查
      if (rule.type) {
        const actualType = typeof value
        if (rule.type === 'number' && actualType !== 'number') {
          // 尝试转换
          const num = Number(value)
          if (isNaN(num)) {
            errors.push(`${paramName} must be a number`)
            continue
          }
        } else if (rule.type === 'string' && actualType !== 'string') {
          errors.push(`${paramName} must be a string`)
          continue
        }
      }

      // 最小值/最小长度
      if (rule.min !== undefined) {
        if (rule.type === 'number' && Number(value) < rule.min) {
          errors.push(`${paramName} must be >= ${rule.min}`)
        } else if (rule.type === 'string' && value.length < rule.min) {
          errors.push(`${paramName} length must be >= ${rule.min}`)
        }
      }

      // 最大值/最大长度
      if (rule.max !== undefined) {
        if (rule.type === 'number' && Number(value) > rule.max) {
          errors.push(`${paramName} must be <= ${rule.max}`)
        } else if (rule.type === 'string' && value.length > rule.max) {
          errors.push(`${paramName} length must be <= ${rule.max}`)
        }
      }
    }

    return errors
  }

  /**
   * 应用默认值
   */
  applyDefaults(query, validateRules) {
    const params = { ...query }

    for (const [paramName, rule] of Object.entries(validateRules)) {
      if (params[paramName] === undefined && rule.default !== undefined) {
        params[paramName] = rule.default
      }

      // 类型转换
      if (params[paramName] !== undefined && rule.type === 'number') {
        params[paramName] = Number(params[paramName])
      }
    }

    return params
  }
}

module.exports = KugouPlatform
