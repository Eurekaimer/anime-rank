import type { Anime, BangumiPage, BangumiSubject } from './types'

const API = 'https://api.bgm.tv/v0/subjects'
const NON_JAPANESE_TAGS = [
  '国产', '国漫', '中国', '中国动画', '国创', '动态漫', '动态漫画', 'donghua',
]
const JAPANESE_TITLE_ALLOWLIST = /辉夜|輝夜|かぐや|kaguya|サイバーパンク|cyberpunk\s*[:：-]?\s*edgerunners|赛博朋克.*边缘行者/i

const isSpecialJapaneseTitle = (subject: BangumiSubject) =>
  JAPANESE_TITLE_ALLOWLIST.test(`${subject.name} ${subject.name_cn}`)

const isJapaneseCandidate = (subject: BangumiSubject) =>
  isSpecialJapaneseTitle(subject) || !(subject.tags || []).some((tag) => {
    const name = tag.name.toLowerCase()
    return NON_JAPANESE_TAGS.some((blocked) => name.includes(blocked))
  })

const normalize = (subject: BangumiSubject, platform: Anime['platform']): Anime => ({
  id: subject.id,
  name: subject.name,
  nameCn: subject.name_cn || subject.name,
  image: `https://api.bgm.tv/v0/subjects/${subject.id}/image?type=common`,
  score: subject.score || 0,
  rank: subject.rank || 0,
  collectionTotal: subject.collection_total || 0,
  date: subject.date,
  platform,
})

async function fetchCategory(year: number, month: number, category: 1 | 3 | 5) {
  const params = new URLSearchParams({
    type: '2',
    cat: String(category),
    sort: 'date',
    year: String(year),
    month: String(month),
    limit: '100',
    offset: '0',
  })

  const response = await fetch(`${API}?${params}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Bangumi API 返回 ${response.status}`)
  const page = (await response.json()) as BangumiPage
  return page.data
    .filter(isJapaneseCandidate)
    .map((item) => normalize(item, category === 1 ? 'TV' : category === 3 ? 'MOVIE' : 'WEB'))
}

export async function fetchSeasonAnime(year: number, month: number) {
  const results = await Promise.allSettled([
    fetchCategory(year, month, 1),
    fetchCategory(year, month, 3),
    // Keep Japanese WEB productions; Chinese animation is filtered by Bangumi tags.
    fetchCategory(year, month, 5),
  ])
  const available = results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  )
  if (!available.length) throw new Error('暂时无法连接 Bangumi，请稍后重试')

  const unique = new Map<number, Anime>()
  available.forEach((anime) => unique.set(anime.id, anime))
  return [...unique.values()].sort(
    (a, b) => b.collectionTotal - a.collectionTotal || a.nameCn.localeCompare(b.nameCn),
  )
}

export const bangumiSubjectUrl = (id: number) => `https://bgm.tv/subject/${id}`
