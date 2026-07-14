import { RefObject, useEffect, useState } from 'react'

export function useResponsiveColumns(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [columns, setColumns] = useState(6)

  useEffect(() => {
    const node = ref.current
    if (!enabled || !node || typeof ResizeObserver === 'undefined') return

    const update = (width: number) => {
      const nextColumns = Math.max(2, Math.floor((width - 20) / 109))
      setColumns((current) => current === nextColumns ? current : nextColumns)
    }

    update(node.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, ref])

  return columns
}
