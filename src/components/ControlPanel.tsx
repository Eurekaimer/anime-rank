import { AtSign, Download, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import { SEASONS } from '../constants'

type Props = {
  years: number[]
  year: number
  month: number
  query: string
  creatorId: string
  loading: boolean
  exporting: boolean
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onQueryChange: (query: string) => void
  onCreatorChange: (creator: string) => void
  onReset: () => void
  onExport: () => void
}

export default function ControlPanel(props: Props) {
  return (
    <section className="control-panel no-export">
      <div className="select-group">
        <label>年份<select value={props.year} onChange={(event) => props.onYearChange(Number(event.target.value))}>{props.years.map((year) => <option key={year}>{year}</option>)}</select></label>
        <label>季度<select value={props.month} onChange={(event) => props.onMonthChange(Number(event.target.value))}>{SEASONS.map((season) => <option key={season.month} value={season.month}>{season.label}季 · {season.month}月</option>)}</select></label>
      </div>
      <label className="search"><Search size={17} /><input value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="搜索番剧…" /></label>
      <label className="creator-field"><AtSign size={16} /><input value={props.creatorId} onChange={(event) => props.onCreatorChange(event.target.value)} maxLength={32} placeholder="填写署名 ID" aria-label="填写人 ID" /></label>
      <button className="ghost-button" onClick={props.onReset} disabled={props.loading}><RefreshCw size={16} />重置</button>
      <button className="export-button" onClick={props.onExport} disabled={props.exporting || props.loading}>
        {props.exporting ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}预览导出
      </button>
    </section>
  )
}
