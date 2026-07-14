import type { Anime, BangumiPage, BangumiSubject } from './types'

const API = 'https://api.bgm.tv/v0/subjects'

const normalize = (subject: BangumiSubject, platform: 'TV' | 'WEB'): Anime => ({
  id: subject.id,
  name: subject.name,
  nameCn: subject.name_cn || subject.name,
  image: subject.images?.large || subject.images?.common || subject.images?.grid || '',
  score: subject.score || 0,
  rank: subject.rank || 0,
  collectionTotal: subject.collection_total || 0,
  date: subject.date,
  platform,
})

async function fetchCategory(year: number, month: number, category: 1 | 5) {
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
  return page.data.map((item) => normalize(item, category === 1 ? 'TV' : 'WEB'))
}

export async function fetchSeasonAnime(year: number, month: number) {
  const results = await Promise.allSettled([
    fetchCategory(year, month, 1),
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

export const mikanSearchUrl = (title: string) =>
  `https://mikanani.me/Home/Search?searchstr=${encodeURIComponent(title)}`
