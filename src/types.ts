export type Anime = {
  id: number
  name: string
  nameCn: string
  image: string
  score: number
  rank: number
  collectionTotal: number
  ratingCount: number
  date?: string
  platform: 'TV' | 'MOVIE' | 'WEB'
}

export type TierId = 'hot' | 'god' | 'elite' | 'npc' | 'trash' | 'pool'

export type Tier = {
  id: TierId
  label: string
  caption: string
  color: string
  items: Anime[]
}

export type SortMode = 'smart' | 'heat' | 'score' | 'date' | 'name'
export type ExportFormat = 'png' | 'jpg' | 'webp'

export type Season = {
  month: number
  label: string
}

export type BangumiSubject = {
  id: number
  name: string
  name_cn: string
  date?: string
  images?: { common?: string; large?: string; grid?: string }
  score?: number
  rank?: number
  collection_total?: number
  rating?: {
    score: number
    rank: number
    total: number
  }
  collection?: {
    wish: number
    collect: number
    doing: number
    on_hold: number
    dropped: number
  }
  tags?: { name: string; count: number }[]
}

export type BangumiPage = {
  data: BangumiSubject[]
  total: number
}
