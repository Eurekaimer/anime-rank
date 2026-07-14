import { toCanvas } from 'html-to-image'

const afterLayout = () => new Promise<void>((resolve) =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
)

export async function renderBoardToCanvas(sourceBoard: HTMLDivElement) {
  const sandbox = document.createElement('div')
  const exportBoard = sourceBoard.cloneNode(true) as HTMLDivElement
  exportBoard.classList.add('exporting-board')
  Object.assign(sandbox.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${sourceBoard.getBoundingClientRect().width}px`,
    pointerEvents: 'none',
  })
  Object.assign(exportBoard.style, {
    position: 'relative',
    left: '0',
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

  sandbox.appendChild(exportBoard)
  document.body.appendChild(sandbox)
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
    sandbox.remove()
  }
}
