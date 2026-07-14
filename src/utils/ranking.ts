import type { Anime, SortMode } from '../types'

type RankingContext = {
  seasonMeanScore: number
  maxLogHeat: number
}

const createContext = (anime: Anime[]): RankingContext => {
  const rated = anime.filter((item) => item.score > 0)
  return {
    seasonMeanScore: rated.length
      ? rated.reduce((sum, item) => sum + item.score, 0) / rated.length
      : 6.5,
    maxLogHeat: Math.max(1, ...anime.map((item) => Math.log1p(item.collectionTotal))),
  }
}

export const adjustedRating = (anime: Anime, seasonMeanScore: number) => {
  if (anime.score <= 0) return -1
  const minimumVotes = 8
  return (anime.ratingCount * anime.score + minimumVotes * seasonMeanScore) /
    (anime.ratingCount + minimumVotes)
}

const comprehensiveScore = (anime: Anime, context: RankingContext) => {
  if (anime.score <= 0) return Math.log1p(anime.collectionTotal) / context.maxLogHeat
  const rating = adjustedRating(anime, context.seasonMeanScore)
  const normalizedHeat = Math.log1p(anime.collectionTotal) / context.maxLogHeat * 10
  return rating * .75 + normalizedHeat * .25
}

export const sortPool = (pool: Anime[], query: string, mode: SortMode) => {
  const normalizedQuery = query.trim().toLowerCase()
  const visible = pool.filter((anime) =>
    !normalizedQuery || `${anime.nameCn} ${anime.name}`.toLowerCase().includes(normalizedQuery),
  )
  const context = createContext(pool)

  return visible.sort((a, b) => {
    if (mode === 'score') {
      return adjustedRating(b, context.seasonMeanScore) - adjustedRating(a, context.seasonMeanScore) ||
        b.ratingCount - a.ratingCount
    }
    if (mode === 'heat') return b.collectionTotal - a.collectionTotal || b.score - a.score
    if (mode === 'date') return (a.date || '').localeCompare(b.date || '')
    if (mode === 'name') return a.nameCn.localeCompare(b.nameCn, 'zh-CN')
    return comprehensiveScore(b, context) - comprehensiveScore(a, context) ||
      b.collectionTotal - a.collectionTotal
  })
}
