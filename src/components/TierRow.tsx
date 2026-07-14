import { memo, type ReactNode, type Ref } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import AnimeCard from './AnimeCard'
import type { Tier } from '../types'

type Props = {
  tier: Tier
  query: string
  displayItems?: Tier['items']
  controls?: ReactNode
  highlighted?: boolean
  dropzoneRef?: Ref<HTMLDivElement>
}

function TierRow({ tier, query, displayItems, controls, highlighted, dropzoneRef }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id })
  const visible = (displayItems || tier.items).filter((anime) =>
    `${anime.nameCn} ${anime.name}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <section
      ref={setNodeRef}
      className={`tier-row${tier.id === 'pool' ? ' tier-row--pool' : ''}${isOver || highlighted ? ' tier-row--over' : ''}`}
      style={{ '--tier': tier.color } as React.CSSProperties}
    >
      <header className="tier-label">
        <span className="tier-index">{tier.id === 'pool' ? '∞' : `0${['hot', 'god', 'elite', 'npc', 'trash'].indexOf(tier.id) + 1}`}</span>
        <div>
          <h2>{tier.label}</h2>
          <p>{tier.caption}</p>
        </div>
        <strong>{tier.items.length}</strong>
      </header>
      <div className="tier-content">
        {controls}
        <div ref={dropzoneRef} className="tier-dropzone">
          <SortableContext items={visible.map((item) => String(item.id))} strategy={rectSortingStrategy}>
            {visible.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
          </SortableContext>
          {!visible.length && <div className="empty-slot">拖到这里</div>}
        </div>
      </div>
    </section>
  )
}

export default memo(TierRow)
