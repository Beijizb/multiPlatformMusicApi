const kuwoRequest = require('../util/request')

// 榜单列表（参考 lx-music 项目）
const boardList = [
  { id: 'kw__93', name: '飙升榜', bangid: '93' },
  { id: 'kw__17', name: '新歌榜', bangid: '17' },
  { id: 'kw__16', name: '热歌榜', bangid: '16' },
  { id: 'kw__158', name: '抖音热歌榜', bangid: '158' },
  { id: 'kw__292', name: '铃声榜', bangid: '292' },
  { id: 'kw__284', name: '热评榜', bangid: '284' },
  { id: 'kw__290', name: 'ACG新歌榜', bangid: '290' },
  { id: 'kw__286', name: '台湾KKBOX榜', bangid: '286' },
  { id: 'kw__104', name: '华语榜', bangid: '104' },
  { id: 'kw__182', name: '粤语榜', bangid: '182' },
  { id: 'kw__22', name: '欧美榜', bangid: '22' },
  { id: 'kw__184', name: '韩语榜', bangid: '184' },
  { id: 'kw__183', name: '日语榜', bangid: '183' },
]

/**
 * 酷我音乐榜单列表
 * @route /toplist
 */
module.exports = (query) => {
  return {
    validate: {},

    handler: async (params) => {
      try {
        // 直接返回预定义的榜单列表
        const toplists = boardList.map(item => ({
          id: item.bangid,
          name: item.name,
          coverImgUrl: null,
          updateFrequency: '每日更新',
          description: item.name,
          playCount: 0
        }))

        return {
          result: {
            toplists: toplists,
            total: toplists.length
          },
          code: 200
        }
      } catch (error) {
        console.error('Kuwo toplist error:', error.message)
        throw new Error(`Kuwo toplist failed: ${error.message}`)
      }
    }
  }
}
