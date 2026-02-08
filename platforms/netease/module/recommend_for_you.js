// 聚合推荐接口 - 一次性获取所有推荐数据
// 参考 D:\test\os 项目的实现

module.exports = (query, request) => {
  const personalizedLimit = parseInt(query.personalizedLimit) || 12
  const newsongLimit = parseInt(query.newsongLimit) || 10
  const MUSIC_U = query.MUSIC_U || ''

  // 并发请求所有推荐数据
  return Promise.allSettled([
    // 1. 每日推荐歌曲
    request('/api/v1/discovery/recommend/songs', { limit: 100 }, {
      crypto: 'eapi',
      useCheckToken: false,
      MUSIC_U
    }).then(res => res.body),

    // 2. 私人FM
    request('/api/v1/radio/get', {}, {
      crypto: 'weapi',
      useCheckToken: true,
      MUSIC_U
    }).then(res => res.body),

    // 3. 每日推荐歌单
    request('/api/v1/discovery/recommend/resource', {}, {
      crypto: 'weapi',
      useCheckToken: false,
      MUSIC_U
    }).then(res => res.body),

    // 4. 专属歌单
    request('/api/personalized/playlist', {
      limit: personalizedLimit,
      total: true,
      n: 1000
    }, {
      crypto: 'weapi',
      useCheckToken: false,
      MUSIC_U
    }).then(res => res.body),

    // 5. 个性化新歌
    request('/api/personalized/newsong', {
      limit: newsongLimit
    }, {
      crypto: 'weapi',
      useCheckToken: false,
      MUSIC_U
    }).then(res => res.body).catch(() => ({ code: 200, result: [] }))
  ]).then(results => {
    // 提取结果，失败的接口返回空数组
    const [
      dailySongsResult,
      fmResult,
      dailyPlaylistsResult,
      personalizedPlaylistsResult,
      personalizedNewsongsResult
    ] = results

    // 构建返回数据
    const responseData = {
      dailySongs: dailySongsResult.status === 'fulfilled'
        ? (dailySongsResult.value?.recommend || dailySongsResult.value?.data?.dailySongs || [])
        : [],

      fm: fmResult.status === 'fulfilled'
        ? (fmResult.value?.data || [])
        : [],

      dailyPlaylists: dailyPlaylistsResult.status === 'fulfilled'
        ? (dailyPlaylistsResult.value?.recommend || [])
        : [],

      personalizedPlaylists: personalizedPlaylistsResult.status === 'fulfilled'
        ? (personalizedPlaylistsResult.value?.result || [])
        : [],

      personalizedNewsongs: personalizedNewsongsResult.status === 'fulfilled'
        ? (personalizedNewsongsResult.value?.result || [])
        : [],

      // 雷达歌单（预置ID列表）
      radarPlaylists: [
        { id: 3136952023, name: '私人雷达' },
        { id: 8402996200, name: '会员雷达' },
        { id: 5320167908, name: '时光雷达' },
        { id: 5327906368, name: '乐迷雷达' },
        { id: 5362359247, name: '宝藏雷达' },
        { id: 5300458264, name: '新歌雷达' },
        { id: 5341776086, name: '神秘雷达' }
      ]
    }

    return {
      code: 200,
      status: 200,
      data: responseData
    }
  })
}
