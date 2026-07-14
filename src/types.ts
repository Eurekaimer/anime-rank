export type Anime = {
  id: number
  name: string
  nameCn: string
  image: string
  score: number
  rank: number
  collectionTotal: number
  date?: string
  platform: 'TV' | 'WEB'
}

export type TierId = 'hot' | 'god' | 'elite' | 'npc' | 'trash' | 'pool'

export type Tier = {
  id: TierId
  label: string
  caption: string
  color: string
  items: Anime[]
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
  tags?: { name: string; count: number }[]
}

export type BangumiPage = {
  data: BangumiSubject[]
  total: number
}
