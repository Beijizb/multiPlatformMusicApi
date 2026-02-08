const path = require('path')
const fs = require('fs')
const BasePlatform = require('../base/BasePlatform')
const Result = require('../../core/Result')
const { globalLimiter } = require('../../core/ConcurrencyLimiter')

/**
 * 酷我音乐平台适配器
 */
class KuwoPlatform extends BasePlatform {
  constructor(config = {}) {
    super({
      name: 'kuwo',
      displayName: '酷我音乐',
      ...config
    })
  }

  /**
   * 初始化平台
   */
  async initialize() {
    if (this.initialized) {
      return true
    }

    try {
      // 加载模块
      const moduleDir = path.join(__dirname, 'module')
      const moduleFiles = fs.readdirSync(moduleDir).filter(file => file.endsWith('.js'))

      for (const file of moduleFiles) {
        const moduleName = file.replace('.js', '')
        const modulePath = path.join(moduleDir, file)
        const moduleFunction = require(modulePath)
        this.modules.set(moduleName, moduleFunction)
      }

      this.initialized = true
      this.logger.debug(`Kuwo platform initialized with ${this.modules.size} modules`)
      return true
    } catch (error) {
      this.logger.error('Kuwo platform initialization failed', error)
      throw error
    }
  }

  /**
   * 重写 callModule 方法以支持酷我模块格式
   * 酷我模块返回 { validate, handler } 对象
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

      // 调用模块函数获取配置对象
      const moduleConfig = moduleFunction(query)

      // 验证参数
      if (moduleConfig.validate) {
        const validationErrors = this.validateModuleParams(query, moduleConfig.validate)
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join('; ')}`)
        }
      }

      // 应用默认值
      const params = this.applyDefaults(query, moduleConfig.validate || {})

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
      if (rule.type === 'number' && isNaN(Number(value))) {
        errors.push(`${paramName} must be a number`)
        continue
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${paramName} must be a string`)
        continue
      }

      // 范围检查
      if (rule.type === 'number') {
        const numValue = Number(value)
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${paramName} must be >= ${rule.min}`)
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${paramName} must be <= ${rule.max}`)
        }
      }

      if (rule.type === 'string') {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push(`${paramName} length must be >= ${rule.min}`)
        }
        if (rule.max !== undefined && value.length > rule.max) {
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

module.exports = KuwoPlatform
