export default class EConfirm extends HTMLElement {
  #dialog
  #messageEl
  #confirmBtn
  #cancelBtn
  #pending = null

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
    this.#setup()
  }

  #setup() {
    this.#dialog = document.createElement('dialog')
    this.#dialog.setAttribute('is', 'e-dialog')
    this.#dialog.setAttribute('data-size', 'small')
    this.#dialog.setAttribute('data-no-backdrop-close', '')

    const stack = document.createElement('div')
    stack.setAttribute('is', 'e-stack')
    stack.setAttribute('data-gap', 'lg')
    stack.setAttribute('data-padding', 'lg')

    this.#messageEl = document.createElement('span')
    this.#messageEl.setAttribute('is', 'e-bold')
    this.#messageEl.setAttribute('data-font-size', 'lg')
    this.#messageEl.className = 'e-confirm-message'

    const row = document.createElement('div')
    row.setAttribute('is', 'e-row')
    row.setAttribute('data-gap', 'md')
    row.setAttribute('data-justify-content', 'flex-end')

    this.#cancelBtn = document.createElement('button')
    this.#cancelBtn.type = 'button'
    this.#cancelBtn.setAttribute('data-primary', '')
    this.#cancelBtn.setAttribute('data-fill', 'outlined')
    this.#cancelBtn.textContent = 'Cancel'
    this.#cancelBtn.addEventListener('click', () => {
      this.#dialog.close('cancel')
    })

    this.#confirmBtn = document.createElement('button')
    this.#confirmBtn.type = 'button'
    this.#confirmBtn.setAttribute('data-primary', '')
    this.#confirmBtn.setAttribute('data-fill', 'danger')
    this.#confirmBtn.textContent = 'Confirm'
    this.#confirmBtn.addEventListener('click', () => {
      this.#dialog.close('confirm')
    })

    row.appendChild(this.#cancelBtn)
    row.appendChild(this.#confirmBtn)
    stack.appendChild(this.#messageEl)
    stack.appendChild(row)
    this.#dialog.appendChild(stack)
    this.appendChild(this.#dialog)

    this.#dialog.addEventListener('close', () => {
      const confirmed = this.#dialog.returnValue === 'confirm'
      if (this.#pending) {
        this.#pending(confirmed)
        this.#pending = null
      }
    })

    if (window.activateNode) {
      window.activateNode(this.#dialog)
    }
  }

  call(message, confirmText = 'Confirm', cancelText = 'Cancel') {
    if (this.#pending) {
      this.#pending(false)
      this.#pending = null
    }

    return new Promise((resolve) => {
      // we don't resolve it here, 
      // (how it often happens in majority of cases using resolve in Promise)
      // we resolve it when user either confirms or cancels
      this.#pending = resolve
      this.#messageEl.textContent = message
      this.#confirmBtn.textContent = confirmText
      this.#cancelBtn.textContent = cancelText
      this.#dialog.showModal()
    })
  }
}

customElements.define('e-confirm', EConfirm)
