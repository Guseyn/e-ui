class EUserIcon extends HTMLElement {
  static get observedAttributes() {
    return ['data-user-avatar', 'data-user-initials', 'data-bg-color']
  }

  connectedCallback() {
    this.#render()
  }

  attributeChangedCallback() {
    this.#render()
  }

  #render() {
    const avatar = this.getAttribute('data-user-avatar')
    const initials = this.getAttribute('data-user-initials') || ''
    const bgColor = this.getAttribute('data-bg-color')

    if (bgColor) {
      this.style.backgroundColor = bgColor
    }

    if (avatar && avatar !== '') {
      this.innerHTML = `<img src="${avatar}" alt="${initials}" onerror="this.parentElement.innerHTML='${initials}'">`
    } else {
      this.textContent = initials
    }
  }
}

customElements.define('e-user-icon', EUserIcon)
