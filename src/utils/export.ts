import { toCanvas } from 'html-to-image'

const afterLayout = () => new Promise<void>((resolve) =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
)

export async function renderBoardToCanvas(sourceBoard: HTMLDivElement) {
  const exportBoard = sourceBoard.cloneNode(true) as HTMLDivElement
  exportBoard.classList.add('exporting-board')
  Object.assign(exportBoard.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${sourceBoard.getBoundingClientRect().width}px`,
    maxWidth: 'none',
    height: 'auto',
  })

  const sourceInputs = sourceBoard.querySelectorAll('input')
  const clonedInputs = exportBoard.querySelectorAll('input')
  sourceInputs.forEach((input, index) => {
    if (clonedInputs[index]) clonedInputs[index].value = input.value
  })

  document.body.appendChild(exportBoard)
  try {
    await afterLayout()
    return await toCanvas(exportBoard, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#ffffff',
      width: exportBoard.scrollWidth,
      height: exportBoard.scrollHeight,
      filter: (node) => !(node instanceof HTMLElement && node.classList.contains('no-export')),
    })
  } finally {
    exportBoard.remove()
  }
}
