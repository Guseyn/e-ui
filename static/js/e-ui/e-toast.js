class EToast extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    this.#timer = null
    this.#setup()
  }

  #setup() {
    const content = this.innerHTML
    const iconSrc = this.getAttribute('data-icon')
    const closeSrc = this.getAttribute('data-close-icon')

    this.innerHTML = ''

    if (iconSrc) {
      const img = document.createElement('img')
      img.src = iconSrc
      this.appendChild(img)
    }

    const body = document.createElement('div')
    body.innerHTML = content
    this.appendChild(body)

    if (closeSrc) {
      const btn = document.createElement('button')
      btn.type = 'button'
      const closeImg = document.createElement('img')
      closeImg.src = closeSrc
      btn.appendChild(closeImg)
      btn.onclick = () => this.close()
      this.appendChild(btn)
    }
  }

  #closeOthers() {
    // Find any toast currently in the 'opening' state and close it
    document.querySelectorAll('e-toast[data-state="opening"]').forEach(toast => {
      if (toast !== this) {
        toast.close()
      }
    })
  }

  open() {
    this.#closeOthers()

    if (this.#timer) {
      clearTimeout(this.#timer)
    }

    this.setAttribute('data-state', 'opening')

    const delay = parseFloat(this.getAttribute('data-hide-after-n-seconds'));
    if (!isNaN(delay) && delay > 0) {
      this.#timer = setTimeout(() => {
        this.close()
      }, delay * 1000);
    }
  }

  close() {
    if (this.getAttribute('data-state') !== 'opening') {
      return
    }

    if (this.#timer) {
      clearTimeout(this.#timer)
    }
    
    this.setAttribute('data-state', 'closing')
    
    this.onanimationend = (e) => {
      if (e.animationName === 'e-toast-out') {
        this.removeAttribute('data-state')
      }
    }
  }
}

customElements.define('e-toast', EToast)
