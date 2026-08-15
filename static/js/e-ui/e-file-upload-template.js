import getNodeScopedState from '#ehtml/getNodeScopedState.js'
import evaluateActions from '#ehtml/evaluateActions.js'

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

function buildFileUploadAccessibleName(node) {
  const parts = []
  if (node.hasAttribute('data-label-text')) {
    parts.push(node.getAttribute('data-label-text'))
  }
  if (node.hasAttribute('data-action-text')) {
    parts.push(node.getAttribute('data-action-text'))
  }
  if (node.hasAttribute('data-details-text')) {
    parts.push(node.getAttribute('data-details-text'))
  }
  if (node.hasAttribute('data-required')) {
    parts.push('Required')
  }
  return parts.join('. ') || 'Choose file'
}

function bindAccessibleFileUploadLabel(label, fileInputField, node) {
  label.setAttribute('data-focusable', '')
  label.tabIndex = 0
  label.setAttribute('aria-label', buildFileUploadAccessibleName(node))

  fileInputField.tabIndex = -1

  if (node.hasAttribute('data-required')) {
    fileInputField.setAttribute('aria-required', 'true')
  }

  label.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fileInputField.click()
    }
  })
}

function showFileUploadError(node, message) {
  if (node.hasAttribute('data-show-errors-in-toast')) {
    showErrorToast(message)
  } else if (node.hasAttribute('data-show-errors-in-toast-in-dialog')) {
    showErrorToastInDialog(message)
  } else {
    alert(message)
  }
}

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
  const accept = node.getAttribute('data-accept') || ''
  fileInputField.setAttribute('accept', accept)
  const fileInputIcon = document.createElement('img')
  const defaultIconSrc = node.getAttribute('data-icon-src')
  fileInputIcon.src = defaultIconSrc
  fileInputIcon.alt = ''
  fileInputIcon.setAttribute('aria-hidden', 'true')

  if (node.hasAttribute('data-action-text')) {
    const actionSpan = document.createElement('span')
    actionSpan.innerText = node.getAttribute('data-action-text')
    label.appendChild(actionSpan)
  }

  if (node.hasAttribute('data-details-text')) {
    const detailsSpan = document.createElement('span')
    detailsSpan.innerText = node.getAttribute('data-details-text')
    label.appendChild(detailsSpan)
  }

  label.appendChild(fileInputField)
  label.appendChild(fileInputIcon)

  bindAccessibleFileUploadLabel(label, fileInputField, node)

  if (node.hasAttribute('multiple')) {
    fileInputField.setAttribute('multiple', 'true')
  }

  node.parentNode.replaceChild(
    label, node
  )

  const maxSizeInMb = node.getAttribute('data-max-size-in-mb') * 1
  const acceptedTypes = accept.split(',').map((type) => type.trim()).filter(Boolean)

  function runFileLoadStart(fileName) {
    if (node.hasAttribute('data-actions-on-file-load-start')) {
      evaluateActions(
        node.getAttribute('data-actions-on-file-load-start'),
        node,
        {
          fileName,
          ...getNodeScopedState(node)
        }
      )
    }
  }

  function runFileLoadEnd(fileName) {
    if (node.hasAttribute('data-actions-on-file-load-end')) {
      evaluateActions(
        node.getAttribute('data-actions-on-file-load-end'),
        node,
        {
          fileName,
          ...getNodeScopedState(node)
        }
      )
    }
  }

  function runFileLoadProgress(percentage, fileName) {
    if (node.hasAttribute('data-actions-on-file-load-progress')) {
      const action = node.getAttribute('data-actions-on-file-load-progress')
      evaluateActions(
        action,
        node,
        {
          percentage,
          fileName,
          ...getNodeScopedState(node)
        }
      )
    }
  }

  function clearFileNames() {
    const fileNameSpanFromPrevSelection = label.querySelector('b[data-name="file-names"]')
    if (fileNameSpanFromPrevSelection) {
      label.removeChild(fileNameSpanFromPrevSelection)
    }
  }

  function updateFileNameDisplay(fileName, appendFile) {
    if (node.hasAttribute('data-hide-upload-file-name')) {
      return
    }
    const fileNameSpanFromPrevSelection = label.querySelector('b[data-name="file-names"]')
    let previousFileNames
    if (fileNameSpanFromPrevSelection) {
      previousFileNames = fileNameSpanFromPrevSelection.innerText
      label.removeChild(fileNameSpanFromPrevSelection)
    }
    const fileNameSpan = document.createElement('b')
    fileNameSpan.setAttribute('data-name', 'file-names')
    label.appendChild(fileNameSpan)
    if (appendFile && previousFileNames) {
      fileNameSpan.innerText = previousFileNames + ', ' + fileName
    } else {
      fileNameSpan.innerText = fileName
    }
  }

  function restoreDefaultIcon() {
    if (accept.includes('image') && fileInputIcon && defaultIconSrc) {
      fileInputIcon.src = defaultIconSrc
    }
  }

  function validateFiles(files) {
    if (!files || files.length === 0) {
      return true
    }
    if (node.hasAttribute('data-max-number-of-files')) {
      const maxFiles = node.getAttribute('data-max-number-of-files') * 1
      if (files.length > maxFiles) {
        showFileUploadError(node, `Max number of files is ${maxFiles}`)
        return false
      }
    }
    const maxSize = maxSizeInMb * 1024 * 1024
    for (const file of files) {
      if (acceptedTypes.length && !acceptedTypes.includes(file.type)) {
        showFileUploadError(node, `Only ${accept} are allowed.`)
        return false
      }
      if (maxSizeInMb && file.size > maxSize) {
        showFileUploadError(node, `File too large. Max ${maxSizeInMb}MB.`)
        return false
      }
    }
    return true
  }

  fileInputField.addEventListener('change', (e) => {
    const files = [...e.target.files]
    if (!validateFiles(files)) {
      fileInputField.value = ''
      fileInputField.filesInfo = undefined
      e.stopImmediatePropagation()
      clearFileNames()
      restoreDefaultIcon()
    }
  }, true)

  fileInputField.addEventListener('ehtml:file-read-start', (e) => {
    runFileLoadStart(e.detail.fileName)
  })

  fileInputField.addEventListener('ehtml:file-read-progress', (e) => {
    runFileLoadProgress(e.detail.percentage, e.detail.fileName)
  })

  fileInputField.addEventListener('ehtml:file-read-end', (e) => {
    const { fileName, index, fileInfo } = e.detail
    updateFileNameDisplay(fileName, index > 0)
    if (accept.includes('image') && fileInfo?.content) {
      fileInputIcon.src = fileInfo.content
    }
    runFileLoadEnd(fileName)
  })

  fileInputField.addEventListener('ehtml:file-read-cleared', () => {
    clearFileNames()
    restoreDefaultIcon()
  })

  fileInputField.addEventListener('ehtml:file-read-error', (e) => {
    showFileUploadError(node, `Could not read file ${e.detail.fileName || ''}`)
    fileInputField.value = ''
    fileInputField.filesInfo = undefined
    clearFileNames()
    restoreDefaultIcon()
  })

  if (fileInputField.form) {
    fileInputField.form.addEventListener('reset', () => {
      clearFileNames()
      restoreDefaultIcon()
    })
  }

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

    const files = node.hasAttribute('multiple')
      ? [...e.dataTransfer.files]
      : (e.dataTransfer.files[0] ? [e.dataTransfer.files[0]] : [])

    if (!validateFiles(files)) {
      fileInputField.value = ''
      fileInputField.filesInfo = undefined
      return
    }

    const dataTransfer = new DataTransfer()
    for (const file of files) {
      dataTransfer.items.add(file)
    }
    fileInputField.files = dataTransfer.files
    fileInputField.dispatchEvent(new Event('change', { bubbles: true }))
  })
}
