import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  closestCenter,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toCanvas } from 'html-to-image'
import { ChevronLeft, ChevronRight, Download, Github, LoaderCircle, RefreshCw, Search, X } from 'lucide-react'
import { fetchSeasonAnime } from './api'
import AnimeCard from './components/AnimeCard'
import TierRow from './components/TierRow'
import type { Anime, Tier, TierId } from './types'

const TIER_META: Omit<Tier, 'items'>[] = [
  { id: 'hot', label: '夯', caption: '断层领先，季度唯一真神', color: '#a84d36' },
  { id: 'god', label: '顶级', caption: '本季度的绝对答案', color: '#bd684e' },
  { id: 'elite', label: '人上人', caption: '值得每周追更', color: '#9a7658' },
  { id: 'npc', label: 'NPC', caption: '能看，但存在感有限', color: '#77736b' },
  { id: 'trash', label: '拉完了', caption: '建议及时止损', color: '#4f4d48' },
  { id: 'pool', label: '待定区', caption: '每页两行，拖动开始评价', color: '#697066' },
]

const seasons = [
  { month: 1, label: '冬' },
  { month: 4, label: '春' },
  { month: 7, label: '夏' },
  { month: 10, label: '秋' },
]

const defaultSeason = () => {
  const now = new Date()
  const month = now.getMonth() + 1
  return seasons.reduce((current, season) => (season.month <= month ? season : current), seasons[0])
}

const makeTiers = (anime: Anime[]): Tier[] => TIER_META.map((tier) => ({
  ...tier,
  items: tier.id === 'pool' ? anime : [],
}))

const storageKey = (year: number, month: number) => `anime-rank:${year}-${month}`
type SortMode = 'heat' | 'score' | 'date' | 'name'
type ExportFormat = 'png' | 'jpg' | 'webp'

export default function App() {
  const initial = defaultSeason()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(initial.month)
  const [tiers, setTiers] = useState<Tier[]>(makeTiers([]))
  const [active, setActive] = useState<Anime | null>(null)
  const [targetTier, setTargetTier] = useState<TierId | null>(null)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('heat')
  const [poolPage, setPoolPage] = useState(0)
  const [poolColumns, setPoolColumns] = useState(6)
  const [title, setTitle] = useState('本季度新番夯拉榜')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('正在连接 Bangumi…')
  const [exporting, setExporting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const boardRef = useRef<HTMLDivElement>(null)
  const poolDropzoneRef = useRef<HTMLDivElement>(null)
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }))

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 9 }, (_, index) => current + 1 - index)
  }, [])

  const load = async (force = false) => {
    setStatus('loading')
    setMessage('正在连接 Bangumi…')
    try {
      const anime = await fetchSeasonAnime(year, month)
      const saved = !force ? localStorage.getItem(storageKey(year, month)) : null
      if (saved) {
        const savedTiers = JSON.parse(saved) as Tier[]
        const availableIds = new Set(anime.map((item) => item.id))
        const cleanedTiers = savedTiers.map((tier) => ({
          ...tier,
          items: tier.items.filter((item) => availableIds.has(item.id)),
        }))
        const known = new Set(cleanedTiers.flatMap((tier) => tier.items.map((item) => item.id)))
        const additions = anime.filter((item) => !known.has(item.id))
        setTiers(cleanedTiers.map((tier) => tier.id === 'pool' ? { ...tier, items: [...tier.items, ...additions] } : tier))
      } else {
        setTiers(makeTiers(anime))
      }
      setStatus('ready')
      setMessage(`已载入 ${anime.length} 部 ${year} 年 ${month} 月开播动画`)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '数据载入失败')
    }
  }

  useEffect(() => { void load() }, [year, month])
  useEffect(() => { setPoolPage(0) }, [year, month, query, sortMode, poolColumns])
  useEffect(() => {
    const node = poolDropzoneRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const updateColumns = (width: number) => {
      // A portrait card is 100px wide; reserve roughly 9px between cards.
      setPoolColumns(Math.max(2, Math.floor((width - 20) / 109)))
    }
    updateColumns(node.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => updateColumns(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [status])
  useEffect(() => {
    if (status === 'ready') localStorage.setItem(storageKey(year, month), JSON.stringify(tiers))
  }, [tiers, status, year, month])

  const findTier = (id: string): TierId | undefined => {
    const direct = tiers.find((tier) => tier.id === id)
    if (direct) return direct.id
    return tiers.find((tier) => tier.items.some((item) => String(item.id) === id))?.id
  }

  const collisionStrategy: CollisionDetection = useCallback((args) => {
    const tierIds = new Set(TIER_META.map((tier) => tier.id))
    const tierContainers = args.droppableContainers.filter((container) => tierIds.has(String(container.id) as TierId))

    // The entire row is a target. If the pointer is between rows, snap to the nearest row.
    const directTier = pointerWithin({ ...args, droppableContainers: tierContainers })[0]
    const nearestTier = directTier || closestCenter({ ...args, droppableContainers: tierContainers })[0]
    if (!nearestTier) return []

    const tierId = String(nearestTier.id) as TierId
    const itemIds = new Set(
      (tiers.find((tier) => tier.id === tierId)?.items || []).map((item) => String(item.id)),
    )
    const cardsInTier = args.droppableContainers.filter((container) => itemIds.has(String(container.id)))
    const directCard = pointerWithin({ ...args, droppableContainers: cardsInTier })

    // Preserve precise within-tier ordering when hovering a card; otherwise accept the row.
    return directCard.length
      ? closestCenter({ ...args, droppableContainers: cardsInTier })
      : [nearestTier]
  }, [tiers])

  const onDragStart = ({ active: dragItem }: DragStartEvent) => {
    setActive(tiers.flatMap((tier) => tier.items).find((item) => String(item.id) === dragItem.id) || null)
  }

  const onDragOver = ({ over }: DragOverEvent) => {
    setTargetTier(over ? findTier(String(over.id)) || null : null)
  }

  const onDragEnd = ({ active: from, over }: DragEndEvent) => {
    setActive(null)
    setTargetTier(null)
    if (!over) return
    const fromTier = findTier(String(from.id))
    const toTier = findTier(String(over.id))
    if (!fromTier || !toTier) return

    setTiers((current) => {
      const next = current.map((tier) => ({ ...tier, items: [...tier.items] }))
      const source = next.find((tier) => tier.id === fromTier)!
      const target = next.find((tier) => tier.id === toTier)!
      const oldIndex = source.items.findIndex((item) => String(item.id) === from.id)
      if (fromTier === toTier) {
        const newIndex = target.items.findIndex((item) => String(item.id) === over.id)
        source.items = arrayMove(source.items, oldIndex, newIndex < 0 ? source.items.length - 1 : newIndex)
      } else {
        const [moved] = source.items.splice(oldIndex, 1)
        const newIndex = target.items.findIndex((item) => String(item.id) === over.id)
        target.items.splice(newIndex < 0 ? target.items.length : newIndex, 0, moved)
      }
      return next
    })
  }

  const previewExport = async () => {
    if (!boardRef.current) return
    setExporting(true)
    try {
      const canvas = await toCanvas(boardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true
          return !node.classList.contains('no-export') && !node.classList.contains('tier-row--pool')
        },
      })
      exportCanvasRef.current = canvas
      setExportFormat('png')
      setPreviewUrl(canvas.toDataURL('image/png'))
    } catch {
      setMessage('图片导出失败：可能有封面跨域限制，请刷新后重试')
    } finally {
      setExporting(false)
    }
  }

  const selectExportFormat = (format: ExportFormat) => {
    const canvas = exportCanvasRef.current
    if (!canvas) return
    const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`
    setExportFormat(format)
    setPreviewUrl(canvas.toDataURL(mime, .94))
  }

  const downloadExport = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.download = `anime-rank-${year}-${month}.${exportFormat}`
    link.href = previewUrl
    link.click()
  }

  const seasonName = seasons.find((season) => season.month === month)?.label
  const rankedCount = tiers.filter((tier) => tier.id !== 'pool').reduce((sum, tier) => sum + tier.items.length, 0)
  const pool = tiers.find((tier) => tier.id === 'pool')?.items || []
  const pageSize = poolColumns * 2
  const filteredPool = pool
    .filter((anime) => `${anime.nameCn} ${anime.name}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'score') return b.score - a.score || b.collectionTotal - a.collectionTotal
      if (sortMode === 'date') return (a.date || '').localeCompare(b.date || '')
      if (sortMode === 'name') return a.nameCn.localeCompare(b.nameCn, 'zh-CN')
      return b.collectionTotal - a.collectionTotal || b.score - a.score
    })
  const pageCount = Math.max(1, Math.ceil(filteredPool.length / pageSize))
  const safePage = Math.min(poolPage, pageCount - 1)
  const poolPageItems = filteredPool.slice(safePage * pageSize, (safePage + 1) * pageSize)

  return (
    <main>
      <div className="ambient ambient--one" /><div className="ambient ambient--two" />
      <nav className="topbar">
        <a className="brand" href="./"><span>AR</span> ANIME RANK</a>
        <a className="github-link" href="https://github.com/Eurekaimer/anime-rank" target="_blank" rel="noreferrer">
          <Github size={17} /> GitHub
        </a>
      </nav>

      <section className="hero">
        <div className="eyebrow">SEASONAL ANIME TIER LIST</div>
        <h1>从夯到拉，排出你的季度答案。</h1>
        <p>选择季度，把每一部新番拖到它应在的位置。</p>
      </section>

      <section className="control-panel no-export">
        <div className="select-group">
          <label>年份<select value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>季度<select value={month} onChange={(e) => setMonth(Number(e.target.value))}>{seasons.map((item) => <option key={item.month} value={item.month}>{item.label}季 · {item.month}月</option>)}</select></label>
        </div>
        <label className="search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索番剧…" /></label>
        <label className="sort-select">排序<select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}><option value="heat">按热度</option><option value="score">按评分</option><option value="date">按开播日期</option><option value="name">按名称</option></select></label>
        <button className="ghost-button" onClick={() => void load(true)} disabled={status === 'loading'}><RefreshCw size={16} />重置</button>
        <button className="export-button" onClick={() => void previewExport()} disabled={exporting || status !== 'ready'}>
          {exporting ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}预览导出
        </button>
      </section>

      <div className={`status status--${status}`}>{status === 'loading' && <LoaderCircle className="spin" size={15} />}{message}</div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={() => { setActive(null); setTargetTier(null) }}
        onDragEnd={onDragEnd}
      >
        <div className="board" ref={boardRef}>
          <header className="board-header">
            <div>
              <span>{year} · {seasonName}季</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="榜单标题" />
            </div>
            <div className="board-stat"><strong>{rankedCount}</strong><span>RANKED</span></div>
          </header>
          <div className="tier-list">
            {tiers.map((tier) => tier.id === 'pool' ? (
              <TierRow
                key={tier.id}
                tier={tier}
                query=""
                displayItems={poolPageItems}
                highlighted={targetTier === tier.id}
                dropzoneRef={poolDropzoneRef}
                controls={
                  <div className="pool-toolbar no-export">
                    <span>显示 {filteredPool.length ? safePage * pageSize + 1 : 0}–{Math.min((safePage + 1) * pageSize, filteredPool.length)} / {filteredPool.length} · 每行 {poolColumns} 部</span>
                    <div>
                      <button onClick={() => setPoolPage((page) => Math.max(0, page - 1))} disabled={safePage === 0} aria-label="上一页"><ChevronLeft size={16} /></button>
                      <b>{safePage + 1} / {pageCount}</b>
                      <button onClick={() => setPoolPage((page) => Math.min(pageCount - 1, page + 1))} disabled={safePage >= pageCount - 1} aria-label="下一页"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                }
              />
            ) : <TierRow key={tier.id} tier={tier} query={query} highlighted={targetTier === tier.id} />)}
          </div>
          <footer className="board-footer"><span>ANIME RANK / EUREKAIMER</span><span>DATA · BANGUMI</span></footer>
        </div>
        <DragOverlay>{active ? <AnimeCard anime={active} overlay /> : null}</DragOverlay>
      </DndContext>

      {previewUrl && (
        <div className="export-modal-backdrop" role="presentation" onMouseDown={() => setPreviewUrl(null)}>
          <section className="export-modal" role="dialog" aria-modal="true" aria-label="导出图片预览" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><h2>导出预览</h2><p>待定区不会出现在最终图片中</p></div>
              <button className="modal-close" onClick={() => setPreviewUrl(null)} aria-label="关闭"><X size={19} /></button>
            </header>
            <div className="preview-stage"><img src={previewUrl} alt="榜单导出预览" /></div>
            <footer>
              <div className="format-picker" aria-label="图片格式">
                {(['png', 'jpg', 'webp'] as ExportFormat[]).map((format) => (
                  <button key={format} className={exportFormat === format ? 'active' : ''} onClick={() => selectExportFormat(format)}>{format.toUpperCase()}</button>
                ))}
              </div>
              <button className="download-confirm" onClick={downloadExport}><Download size={17} />保存 {exportFormat.toUpperCase()}</button>
            </footer>
          </section>
        </div>
      )}

      <footer className="page-footer">条目与封面数据来自 Bangumi · 排名保存在本机浏览器</footer>
    </main>
  )
}
