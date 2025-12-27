class ETab extends HTMLElement {
  constructor() {
    super()
  }
}

class ETabs extends HTMLElement {
  constructor() {
    super()
    this.#nav = null
  }

  connectedCallback() {
    this.#setup()
    const initial = parseInt(this.getAttribute('data-current-tab')) || 0
    this.selectTab(initial)
  }

  #setup() {
    this.#nav = document.createElement('nav')
    const tabs = this.querySelectorAll('e-tab')
    
    tabs.forEach((tab, index) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = tab.getAttribute('data-title') || `Tab ${index + 1}`
      btn.onclick = () => this.selectTab(index)
      this.#nav.appendChild(btn)
    })

    this.prepend(this.#nav)
  }

  selectTab(index) {
    const tabs = this.querySelectorAll('e-tab')
    const buttons = this.#nav.querySelectorAll('button')

    if (index < 0 || index >= tabs.length) {
      return
    }

    tabs.forEach((tab, i) => {
      const isActive = i === index
      tab.setAttribute('data-active', isActive)
      if (buttons[i]) {
        buttons[i].setAttribute('data-active', isActive)
      }
    })

    this.setAttribute('data-current-tab', index)
  }
}

customElements.define('e-tab', ETab)
customElements.define('e-tabs', ETabs)
