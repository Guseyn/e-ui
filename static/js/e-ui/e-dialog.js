class EDialog extends HTMLDialogElement {
  #activated = false;

  connectedCallback() {
    this.addEventListener('ehtml:activated', () => this.#init(), { once: true })
  }

  #init() {
    if (this.#activated) {
      return
    }
    this.#activated = true

    // Create internal wrapper
    const wrapper = document.createElement('div')
    
    // Create close button
    const closeBtn = document.createElement('div')
    closeBtn.setAttribute('data-close', '')
    
    const iconUrl = this.getAttribute('data-close-icon')
    if (iconUrl) {
      closeBtn.innerHTML = `<img src="${iconUrl}" width="20" height="20">`
    } else {
      closeBtn.textContent = '×'
    }

    closeBtn.onclick = () => this.close()
    wrapper.appendChild(closeBtn)

    // Move existing children into the wrapper
    while (this.firstChild) {
      wrapper.appendChild(this.firstChild)
    }
    this.appendChild(wrapper)

    // Close on backdrop click
    this.addEventListener('click', (e) => {
      if (e.target === this) {
        this.close()
      }
    })
  }

  showModal() {
    this.#lock()
    super.showModal()
  }

  close(returnValue) {
    super.close(returnValue)
    this.#unlock()
  }

  #lock() {
    const y = window.scrollY || document.documentElement.scrollTop
    document.body.dataset.prevScrollY = y
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
  }

  #unlock() {
    const y = parseInt(document.body.dataset.prevScrollY || '0', 10)
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.removeAttribute('data-prev-scroll-y')
    window.scrollTo(0, y)
  }
}

customElements.define('e-dialog', EDialog, { extends: 'dialog' })
