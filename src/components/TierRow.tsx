import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import AnimeCard from './AnimeCard'
import type { Tier } from '../types'

export default function TierRow({ tier, query }: { tier: Tier; query: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id })
  const visible = tier.items.filter((anime) =>
    `${anime.nameCn} ${anime.name}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <section
      className={`tier-row${isOver ? ' tier-row--over' : ''}`}
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
      <div ref={setNodeRef} className="tier-dropzone">
        <SortableContext items={tier.items.map((item) => String(item.id))} strategy={rectSortingStrategy}>
          {visible.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
        </SortableContext>
        {!visible.length && <div className="empty-slot">拖到这里</div>}
      </div>
    </section>
  )
}
