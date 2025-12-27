class ESidebar extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    this.setAttribute('data-state', 'closed')
    this.#setupDesktopHover()
    this.#setupMobile()
  }

  #setupDesktopHover() {
    this.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) {
        this.open()
      }
    })
    this.addEventListener('mouseleave', () => {
      if (window.innerWidth > 768) {
        this.close()
      }
    });
  }

  #setupMobile() {
    const corner = this.getAttribute('data-mobile-menu-icon-corner') || 'left'
    const iconUrl = this.getAttribute('data-mobile-menu-icon') || 'https://api.iconify.design/heroicons:bars-3-20-solid.svg'
    
    const btn = document.createElement('button');
    btn.className = 'e-sidebar-mobile-toggle'
    btn.setAttribute('data-corner', corner)
    btn.innerHTML = `<img src="${iconUrl}" width="20">`
    
    btn.onclick = (e) => {
      e.stopPropagation()
      this.getAttribute('data-state') === 'open' ? this.close() : this.open()
    };

    document.body.appendChild(btn);

    // Close on click outside (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && 
          this.getAttribute('data-state') === 'open' && 
          !this.contains(e.target) && 
          !btn.contains(e.target)) {
        this.close();
      }
    })
  }

  open() {
    this.setAttribute('data-state', 'open')
  }

  close() {
    this.setAttribute('data-state', 'closed')
  }
}

customElements.define('e-sidebar', ESidebar)
