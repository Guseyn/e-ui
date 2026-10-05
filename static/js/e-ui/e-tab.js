class ETab extends HTMLElement {
  constructor() {
    super()
    this.ehtmlActivated = false
  }

  connectedCallback() {
    this.addEventListener(
      'ehtml:activated',
      this.#onEHTMLActivated,
      { once: true }
    )
  }

  #onEHTMLActivated() {
    if (this.ehtmlActivated) {
      return
    }
    this.ehtmlActivated = true
  }
}

class ETabs extends HTMLElement {
  #nav = null

  constructor() {
    super()
    this.ehtmlActivated = false
  }

  connectedCallback() {
    this.addEventListener(
      'ehtml:activated',
      () => this.#onEHTMLActivated(),
      { once: true }
    )
  }

  #onEHTMLActivated() {
    if (this.ehtmlActivated) {
      return
    }
    this.ehtmlActivated = true
    window.addEventListener('hashchange', () => {
      // A hash that names no tab of this one (a heading, another tabs) is not ours to change
      const tabIndexByUrlHash = this.#hashToTabIndex()
      if (tabIndexByUrlHash !== -1) {
        this.selectTab(tabIndexByUrlHash)
      }
    })
    this.#run()
  }

  #run() {
    // we queue the logic, 
    // so we can use conditional templates like <template is="e-if">
    queueMicrotask(() => {
      this.#nav = document.createElement('nav')
      const tabs = this.#getSelfTabs()
      
      tabs.forEach((tab, index) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = tab.getAttribute('data-title') || `Tab ${index + 1}`
        btn.onclick = () => this.selectTab(index)
        this.#nav.appendChild(btn)
      })

      this.prepend(this.#nav)

      /*
      The tab a URL names is opened and scrolled to. Otherwise the default one
      is opened without touching the hash: the URL may name something else on
      the page, and only a click on a tab should replace it.
      */
      const tabIndexByUrlHash = this.hasAttribute('data-apply-hash-navigation')
        ? this.#hashToTabIndex()
        : -1
      if (tabIndexByUrlHash !== -1) {
        this.selectTab(tabIndexByUrlHash)
        this.scrollIntoView()
      } else if (this.hasAttribute('data-current-tab')) {
        this.selectTab(parseInt(this.getAttribute('data-current-tab')), { updateHash: false })
      } else {
        this.selectTab(0, { updateHash: false })
      }

      /*
      Until now no tab was shown, so opening one moves everything below it.
      If the URL names an element elsewhere on the page, it is scrolled to again.
      */
      if (tabIndexByUrlHash === -1 && window.location.hash) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        if (target) {
          target.scrollIntoView()
        }
      }
    })
  }

  selectTab(index, { updateHash = true } = {}) {
    const tabs = this.#getSelfTabs()
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

    if (updateHash && this.hasAttribute('data-apply-hash-navigation')) {
      const selectedTab = tabs[index]
      window.location.hash = this.#titleToHash(
        selectedTab.getAttribute('data-title') || `Tab ${index + 1}`
      )
    }
  }

  #getSelfTabs() {
    return Array(...this.querySelectorAll('e-tab')).filter(tab => tab.closest('e-tabs') === this)
  }

  #titleToHash(title) {
    return encodeURIComponent(title.toLowerCase().replaceAll(/\s+/g, '-'))
  }

  #hashToTabIndex() {
    const hash = window.location.hash
    const tabs = this.#getSelfTabs()
    const tabHashes = []
    tabs.forEach((tab, index) => {
      const hash = this.#titleToHash(tab.getAttribute('data-title') || `Tab ${index + 1}`)
      tabHashes.push(`#${hash}`)
    })
    return tabHashes.indexOf(hash)
  }
}

customElements.define('e-tab', ETab)
customElements.define('e-tabs', ETabs)
