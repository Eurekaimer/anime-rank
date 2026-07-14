import { Download, X } from 'lucide-react'
import type { ExportFormat } from '../types'

type Props = {
  previewUrl: string
  format: ExportFormat
  onFormatChange: (format: ExportFormat) => void
  onDownload: () => void
  onClose: () => void
}

const FORMATS: ExportFormat[] = ['png', 'jpg', 'webp']

export default function ExportModal({ previewUrl, format, onFormatChange, onDownload, onClose }: Props) {
  return (
    <div className="export-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="export-modal" role="dialog" aria-modal="true" aria-label="导出图片预览" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><h2>导出预览</h2><p>待定区不会出现在最终图片中</p></div>
          <button className="modal-close" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </header>
        <div className="preview-stage"><img src={previewUrl} alt="榜单导出预览" /></div>
        <footer>
          <div className="format-picker" aria-label="图片格式">
            {FORMATS.map((item) => (
              <button key={item} className={format === item ? 'active' : ''} onClick={() => onFormatChange(item)}>{item.toUpperCase()}</button>
            ))}
          </div>
          <button className="download-confirm" onClick={onDownload}><Download size={17} />保存 {format.toUpperCase()}</button>
        </footer>
      </section>
    </div>
  )
}
