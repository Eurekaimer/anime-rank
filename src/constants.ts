import type { Anime, Season, Tier } from './types'

export const TIER_META: Omit<Tier, 'items'>[] = [
  { id: 'hot', label: '夯', caption: '断层领先，季度唯一真神', color: '#a84d36' },
  { id: 'god', label: '顶级', caption: '本季度的绝对答案', color: '#bd684e' },
  { id: 'elite', label: '人上人', caption: '值得每周追更', color: '#9a7658' },
  { id: 'npc', label: 'NPC', caption: '能看，但存在感有限', color: '#77736b' },
  { id: 'trash', label: '拉完了', caption: '建议及时止损', color: '#4f4d48' },
  { id: 'pool', label: '待定区', caption: '每页两行，拖动开始评价', color: '#697066' },
]

export const SEASONS: Season[] = [
  { month: 1, label: '冬' },
  { month: 4, label: '春' },
  { month: 7, label: '夏' },
  { month: 10, label: '秋' },
]

export const DEFAULT_TITLE = '本季度新番夯拉榜'
export const MIN_ARCHIVE_YEAR = 2000
export const CREATOR_STORAGE_KEY = 'anime-rank:creator-id'

export const createEmptyTiers = (anime: Anime[] = []): Tier[] => TIER_META.map((tier) => ({
  ...tier,
  items: tier.id === 'pool' ? anime : [],
}))

export const seasonStorageKey = (year: number, month: number) => `anime-rank:${year}-${month}`

export const getDefaultSeason = () => {
  const month = new Date().getMonth() + 1
  return SEASONS.reduce((current, season) => (season.month <= month ? season : current), SEASONS[0])
}
