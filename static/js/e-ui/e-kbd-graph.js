export default class EKBDGraph extends HTMLElement {
  constructor() {
    super()
    this.ehtmlActivated = false
    this.cursorSelectedElement = null
  }

  connectedCallback() {
    this.addEventListener('ehtml:activated', this.onEHTMLActivated, { once: true })
  }

  onEHTMLActivated() {
    if (this.ehtmlActivated) {
      return
    }
    this.ehtmlActivated = true
    this.run()
  }

  run() {
    if (!this.hasAttribute('data-first-element')) {
      throw new Error('e-kdb-graph must have `data-first-element` attribute')
    }

    const firstElementSelector = this.getAttribute('data-first-element')
    const firstElement = this.querySelector(firstElementSelector)
    this.setCursorToElement(firstElement)

    window.addEventListener('keydown', (event) => {
      if (event.key.startsWith('Arrow')) {
        const cursorSelectedElementIsFocusedAndInput = this.isFocused(this.cursorSelectedElement) &&
          this.isInput(this.cursorSelectedElement)
        const preventDefault = !cursorSelectedElementIsFocusedAndInput
        if (preventDefault) {
          event.preventDefault()
        }
        
        const direction = event.key.split('Arrow')[1].toLowerCase()
        const fromElement = this.cursorSelectedElement
        const toElementSelector = fromElement.getAttribute(`data-${direction}`)
        let toElement
        if (toElementSelector) {
          toElement = this.querySelector(toElementSelector)
          if (toElement) {
            fromElement.removeAttribute('data-cursor-selected')
            this.setCursorToElement(toElement)
          }
        }
      } else if (event.key === 'Enter') {
        if (this.cursorSelectedElement && this.cursorSelectedElement.hasAttribute('data-click-on-enter')) {
          this.cursorSelectedElement.click()
        }
        if (this.cursorSelectedElement && this.isInput(this.cursorSelectedElement)) {
          this.cursorSelectedElement.focus()
        }
      } else if (event.key === 'Escape') {
        if (this.cursorSelectedElement && this.isInput(this.cursorSelectedElement)) {
          this.cursorSelectedElement.blur()
        }
      }
    })
  }

  setCursorToElement(elm) {
    if (elm) {
      this.cursorSelectedElement = elm
      elm.setAttribute('data-cursor-selected', 'true')
    }
  }

  isFocused(elm) {
    return elm === document.activeElement
  }

  isInput(elm) {
    return elm.tagName.toLowerCase() === 'input'
  }
}

customElements.define('e-kbd-graph', EKBDGraph)
