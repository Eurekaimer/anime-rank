import { CSSProperties, MouseEvent, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExternalLink, GripVertical } from 'lucide-react'
import { mikanSearchUrl } from '../api'
import type { Anime } from '../types'

type Props = { anime: Anime; overlay?: boolean }

export default function AnimeCard({ anime, overlay = false }: Props) {
  const cardRef = useRef<HTMLElement | null>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(anime.id),
    data: { anime },
    disabled: overlay,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
    zIndex: isDragging || overlay ? 20 : undefined,
  }

  const setRefs = (node: HTMLElement | null) => {
    cardRef.current = node
    setNodeRef(node)
  }

  const onMove = (event: MouseEvent<HTMLElement>) => {
    if (isDragging || overlay) return
    const node = cardRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    node.style.setProperty('--rx', `${(0.5 - y) * 8}deg`)
    node.style.setProperty('--ry', `${(x - 0.5) * 10}deg`)
    node.style.setProperty('--mx', `${x * 100}%`)
    node.style.setProperty('--my', `${y * 100}%`)
  }

  const resetTilt = () => {
    cardRef.current?.style.setProperty('--rx', '0deg')
    cardRef.current?.style.setProperty('--ry', '0deg')
  }

  return (
    <article
      ref={setRefs}
      style={style}
      className={`anime-card${overlay ? ' anime-card--overlay' : ''}`}
      onMouseMove={onMove}
      onMouseLeave={resetTilt}
      {...attributes}
      {...listeners}
    >
      <div className="card-shine" />
      {anime.image ? (
        <img src={anime.image} alt="" crossOrigin="anonymous" draggable={false} />
      ) : (
        <div className="image-fallback">ANIME</div>
      )}
      <div className="card-scrim" />
      <div className="card-topline">
        <span>{anime.platform}</span>
        {anime.score > 0 && <span className="score">★ {anime.score.toFixed(1)}</span>}
      </div>
      <div className="card-copy">
        <h3>{anime.nameCn}</h3>
        {anime.nameCn !== anime.name && <p>{anime.name}</p>}
      </div>
      <a
        className="mikan-link no-export"
        href={mikanSearchUrl(anime.nameCn)}
        target="_blank"
        rel="noreferrer"
        title="在 Mikan 搜索"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <ExternalLink size={13} /> Mikan
      </a>
      <GripVertical className="drag-hint no-export" size={17} />
    </article>
  )
}
