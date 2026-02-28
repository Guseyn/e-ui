class EFileUploadTemplate extends HTMLTemplateElement {
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
    initializeFileUpload(this)
  }
}

customElements.define('e-file-upload', EFileUploadTemplate, { extends: 'template' })

function initializeFileUpload(node) {
  const label = document.createElement('label')
  if (node.hasAttribute('data-label-text')) {
    const textNode = document.createElement('b')
    textNode.textContent = node.getAttribute('data-label-text')
    label.appendChild(textNode)
  }
  if (node.hasAttribute('data-set-height')) {
    label.setAttribute('data-set-height', '')
  }
  const fileInputField = document.createElement('input')
  fileInputField.setAttribute('type', 'file')
  fileInputField.setAttribute('name', node.getAttribute('data-name'))
  if (node.hasAttribute('data-required')) {
    fileInputField.setAttribute('required', '')
  }
  if (node.hasAttribute('data-validation-absence-error-message')) {
    fileInputField.setAttribute(
      'data-validation-absence-error-message',
      node.getAttribute('data-validation-absence-error-message')
    )
  }
  if (node.hasAttribute('data-ignore')) {
    fileInputField.setAttribute('data-ignore', 'true')
  }
  const accept = node.getAttribute('data-accept')
  fileInputField.setAttribute('accept', accept)
  const fileInputIcon = document.createElement('img')
  fileInputIcon.setAttribute('src', node.getAttribute('data-icon-src'))
  const actionSpan = document.createElement('span')
  actionSpan.innerText = node.getAttribute('data-action-text')
  const detailsSpan = document.createElement('span')
  detailsSpan.innerText = node.getAttribute('data-details-text')
  label.appendChild(fileInputField)
  label.appendChild(fileInputIcon)
  label.appendChild(actionSpan)
  label.appendChild(detailsSpan)

  const fileNameSpan = document.createElement('b')
  label.appendChild(fileNameSpan)

  if (node.internalState && node.internalState['preuploadedFiles']) {
    if (preuploadedFiles.length > 0) {
      fileNameSpan.innerHTML = preuploadedFiles.map(file => `<a href="${file.url}${queryForPreuploadedFiles}">${file.filename}</a>`).join('<br>')
    }
  }

  if (node.hasAttribute('multiple')) {
    fileInputField.setAttribute('multiple', 'true')
  }

  node.parentNode.replaceChild(
    label, node
  )

  const maxSizeInMb = node.getAttribute('data-max-size-in-mb') * 1

  fileInputField.addEventListener('change', (e) => {
    if (node.hasAttribute('multiple')) {
      const files = [...e.target.files]
      if (node.hasAttribute('data-max-number-of-files')) {
        if (files.length > (node.getAttribute('data-max-number-of-files') * 1)) {
          if (node.hasAttribute('data-show-errors-in-toast')) {
            showErrorToast(`Max number of files is ${node.getAttribute('data-max-number-of-files')}`)
            fileInputField.value = ""
          } else if (node.hasAttribute('data-show-errors-in-toast-in-dialog')) {
            showErrorToastInDialog(`Max number of files is ${node.getAttribute('data-max-number-of-files')}`)
            fileInputField.value = ""
          } else {
            alert(`Max number of files is ${node.getAttribute('data-max-number-of-files')}`)
          }
          return
        }
      }
      files.forEach((file, index) => {
        if (index > 0) {
          laodFile(file, maxSizeInMb, true)
        } else {
          laodFile(file, maxSizeInMb)
        }
      })
    } else {
      const file = e.target.files[0]
      laodFile(file, maxSizeInMb)
    }
  })

  label.addEventListener('dragover', (e) => {
    e.preventDefault()
    label.classList.add('dragover')
  })

  label.addEventListener('dragleave', () => {
    label.classList.remove('dragover')
  })

  label.addEventListener('drop', (e) => {
    e.preventDefault()
    label.classList.remove('dragover')

    if (node.hasAttribute('multiple')) {
      const files = [...e.dataTransfer.files]
      if (node.hasAttribute('data-max-number-of-files')) {
        if (files.length > (node.getAttribute('data-max-number-of-files') * 1)) {
          if (node.hasAttribute('data-show-errors-in-toast')) {
            showErrorToast(`Max number of files is ${node.getAttribute('data-max-number-of-files')}`)
            fileInputField.value = ""
          } else if (node.hasAttribute('data-show-errors-in-toast-in-dialog')) {
            showErrorToastInDialog(`Max number of files is ${node.getAttribute('data-max-number-of-files')}`)
            fileInputField.value = ""
          } else {
            alert(`Max number of files is ${node.getAttribute('data-max-number-of-files')}`)
          }
          return
        }
      }
      files.forEach((file, index) => {
        if (index > 0) {
          laodFile(file, maxSizeInMb, true)
        } else {
          laodFile(file, maxSizeInMb)
        }
      })
    } else {
      const file = e.dataTransfer.files[0]
      laodFile(file, maxSizeInMb)
    }
  })

  function laodFile(file, maxSizeInMb, appendFile) {
    if (!file) {
      return
    }

    const maxSize = maxSizeInMb * 1024 * 1024
    if (!accept.split(', ').includes(file.type)) {
      if (node.hasAttribute('data-show-errors-in-toast')) {
        showErrorToast(`Only ${accept} are allowed.`)
        fileInputField.value = ""
      } else if (node.hasAttribute('data-show-errors-in-toast-in-dialog')) {
        showErrorToastInDialog(`Only ${accept} are allowed.`)
        fileInputField.value = ""
      } else {    
        alert(`Only ${accept} are allowed.`)
      }
      return
    }

    if (file.size > maxSize) {
      if (node.hasAttribute('data-show-errors-in-toast')) {
        showErrorToast(`File too large. Max ${maxSizeInMb}MB.`)
        fileInputField.value = ""
      } else if (node.hasAttribute('data-show-errors-in-toast-in-dialog')) {
        showErrorToastInDialog(`File too large. Max ${maxSizeInMb}MB.`)
        fileInputField.value = ""
      } else { 
        alert(`File too large. Max ${maxSizeInMb}MB.`)
      }
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (appendFile) {
        fileNameSpan.innerText += ', ' + file.name
      } else {
        fileNameSpan.innerText = file.name
      }
      if (accept.includes('image')) {
        fileInputIcon.src = e.target.result
      }
    }
    reader.readAsDataURL(file)
  }
}
