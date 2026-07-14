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
import { ChevronLeft, ChevronRight, Github, LoaderCircle } from 'lucide-react'
import { fetchSeasonAnime } from './api'
import AnimeCard from './components/AnimeCard'
import ControlPanel from './components/ControlPanel'
import ExportModal from './components/ExportModal'
import TierRow from './components/TierRow'
import { CREATOR_STORAGE_KEY, createEmptyTiers, DEFAULT_TITLE, getDefaultSeason, MIN_ARCHIVE_YEAR, seasonStorageKey, SEASONS, TIER_META } from './constants'
import { useResponsiveColumns } from './hooks/useResponsiveColumns'
import type { Anime, ExportFormat, SortMode, Tier, TierId } from './types'
import { renderBoardToCanvas } from './utils/export'
import { sortPool } from './utils/ranking'

export default function App() {
  const initial = getDefaultSeason()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(initial.month)
  const [tiers, setTiers] = useState<Tier[]>(createEmptyTiers())
  const [active, setActive] = useState<Anime | null>(null)
  const [targetTier, setTargetTier] = useState<TierId | null>(null)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('smart')
  const [poolPage, setPoolPage] = useState(0)
  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [creatorId, setCreatorId] = useState(() => localStorage.getItem(CREATOR_STORAGE_KEY) || '')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('正在连接 Bangumi…')
  const [exporting, setExporting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const boardRef = useRef<HTMLDivElement>(null)
  const poolDropzoneRef = useRef<HTMLDivElement>(null)
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const poolColumns = useResponsiveColumns(poolDropzoneRef, status === 'ready')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }))

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: current + 2 - MIN_ARCHIVE_YEAR }, (_, index) => current + 1 - index)
  }, [])

  const load = async (force = false) => {
    setStatus('loading')
    setMessage('正在连接 Bangumi…')
    try {
      const anime = await fetchSeasonAnime(year, month)
      const saved = !force ? localStorage.getItem(seasonStorageKey(year, month)) : null
      if (saved) {
        const savedTiers = JSON.parse(saved) as Tier[]
        const availableIds = new Set(anime.map((item) => item.id))
        const freshAnime = new Map(anime.map((item) => [item.id, item]))
        const cleanedTiers = savedTiers.map((tier) => ({
          ...tier,
          items: tier.items
            .filter((item) => availableIds.has(item.id))
            .map((item) => freshAnime.get(item.id)!),
        }))
        const known = new Set(cleanedTiers.flatMap((tier) => tier.items.map((item) => item.id)))
        const additions = anime.filter((item) => !known.has(item.id))
        setTiers(cleanedTiers.map((tier) => tier.id === 'pool' ? { ...tier, items: [...tier.items, ...additions] } : tier))
      } else {
        setTiers(createEmptyTiers(anime))
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
    if (status === 'ready') localStorage.setItem(seasonStorageKey(year, month), JSON.stringify(tiers))
  }, [tiers, status, year, month])
  useEffect(() => {
    localStorage.setItem(CREATOR_STORAGE_KEY, creatorId)
  }, [creatorId])

  const itemTierIndex = useMemo(() => {
    const index = new Map<string, TierId>()
    tiers.forEach((tier) => tier.items.forEach((item) => index.set(String(item.id), tier.id)))
    return index
  }, [tiers])

  const tierItemIds = useMemo(() => new Map(
    tiers.map((tier) => [tier.id, new Set(tier.items.map((item) => String(item.id)))]),
  ), [tiers])

  const findTier = useCallback((id: string): TierId | undefined => {
    const direct = TIER_META.find((tier) => tier.id === id)
    return direct?.id || itemTierIndex.get(id)
  }, [itemTierIndex])

  const collisionStrategy: CollisionDetection = useCallback((args) => {
    const tierIds = new Set(TIER_META.map((tier) => tier.id))
    const tierContainers = args.droppableContainers.filter((container) => tierIds.has(String(container.id) as TierId))

    // The entire row is a target. If the pointer is between rows, snap to the nearest row.
    const directTier = pointerWithin({ ...args, droppableContainers: tierContainers })[0]
    const nearestTier = directTier || closestCenter({ ...args, droppableContainers: tierContainers })[0]
    if (!nearestTier) return []

    const tierId = String(nearestTier.id) as TierId
    const itemIds = tierItemIds.get(tierId) || new Set<string>()
    const cardsInTier = args.droppableContainers.filter((container) => itemIds.has(String(container.id)))
    const directCard = pointerWithin({ ...args, droppableContainers: cardsInTier })

    // Preserve precise within-tier ordering when hovering a card; otherwise accept the row.
    return directCard.length
      ? closestCenter({ ...args, droppableContainers: cardsInTier })
      : [nearestTier]
  }, [tierItemIds])

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
      const canvas = await renderBoardToCanvas(boardRef.current)
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

  const seasonName = SEASONS.find((season) => season.month === month)?.label
  const rankedCount = useMemo(() => tiers
    .filter((tier) => tier.id !== 'pool')
    .reduce((sum, tier) => sum + tier.items.length, 0), [tiers])
  const pool = useMemo(() => tiers.find((tier) => tier.id === 'pool')?.items || [], [tiers])
  const pageSize = poolColumns * 2
  const filteredPool = useMemo(() => sortPool(pool, query, sortMode), [pool, query, sortMode])
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

      <ControlPanel
        years={years}
        year={year}
        month={month}
        query={query}
        creatorId={creatorId}
        loading={status === 'loading'}
        exporting={exporting}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onQueryChange={setQuery}
        onCreatorChange={setCreatorId}
        onReset={() => void load(true)}
        onExport={() => void previewExport()}
      />

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
                    <div className="pool-actions">
                      <label className="pool-sort">待定区排序
                        <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
                          <option value="smart">综合推荐</option>
                          <option value="heat">热度优先</option>
                          <option value="score">评分优先</option>
                          <option value="date">开播日期</option>
                          <option value="name">名称</option>
                        </select>
                      </label>
                      <div className="pool-pager">
                        <button onClick={() => setPoolPage((page) => Math.max(0, page - 1))} disabled={safePage === 0} aria-label="上一页"><ChevronLeft size={16} /></button>
                        <b>{safePage + 1} / {pageCount}</b>
                        <button onClick={() => setPoolPage((page) => Math.min(pageCount - 1, page + 1))} disabled={safePage >= pageCount - 1} aria-label="下一页"><ChevronRight size={16} /></button>
                      </div>
                    </div>
                  </div>
                }
              />
            ) : <TierRow key={tier.id} tier={tier} query={query} highlighted={targetTier === tier.id} />)}
          </div>
          <footer className="board-footer">
            <div className="screen-only"><span>ANIME RANK / EUREKAIMER</span><span>DATA · BANGUMI</span></div>
            <div className="export-only export-signature">
              <div><strong>{creatorId ? `BY @${creatorId.replace(/^@/, '')}` : 'ANIME RANK'}</strong><span>eurekaimer.icu</span></div>
              <div><span>github.com/Eurekaimer/anime-rank</span><span>Data by Bangumi</span></div>
            </div>
          </footer>
        </div>
        <DragOverlay>{active ? <AnimeCard anime={active} overlay /> : null}</DragOverlay>
      </DndContext>

      {previewUrl && <ExportModal
        previewUrl={previewUrl}
        format={exportFormat}
        onFormatChange={selectExportFormat}
        onDownload={downloadExport}
        onClose={() => setPreviewUrl(null)}
      />}

      <footer className="page-footer">条目与封面数据来自 Bangumi · 排名保存在本机浏览器</footer>
    </main>
  )
}
