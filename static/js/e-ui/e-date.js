import {
  setNativeValue, getNativeValue,
  clamp, zeroPad, daysInMonth,
  typeDigitIntoSegment, commitIncompleteSegment, incrementSegment, isSegmentEmpty,
  buildSegmentOffsetTable, segmentIndexForOffset,
  currentYear, today, formatISODate,
  buildMonthMatrix, getDayNames, getMonthNames
} from '#e-ui/e-date-time-shared.js'

const SEGMENT_ORDER = ['month', 'day', 'year']
const SEGMENT_DEFS = {
  month: { len: 2, min: 1, max: 12, placeholder: 'm' },
  day: { len: 2, min: 1, max: 31, placeholder: 'd' },
  year: { len: 4, min: 1, max: 9999, placeholder: 'y' }
}
const OFFSETS = buildSegmentOffsetTable([
  { name: 'month', len: 2 },
  { name: 'day', len: 2 },
  { name: 'year', len: 4 }
], ['/', '/'])

let popupCounter = 0

class EDate extends HTMLInputElement {
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
    if (this.ehtmlActivated) return
    this.ehtmlActivated = true
    this.#run()
  }

  #run() {
    // Initialize segment buffer and active segment
    this.#buffer = { month: '', day: '', year: '' }
    this.#activeSegment = 'month'
    this.#pointerInteraction = false
    this.#popupOpen = false

    // View month/year (for popup browsing)
    const today_ = today()
    this.#viewMonth = today_.getMonth()
    this.#viewYear = today_.getFullYear()

    // Initialize from native input value (set by browser or processAttributes)
    // Must be BEFORE #renderDisplay() so we read the original value, not the display format
    const initialValue = getNativeValue(this)
    if (initialValue) {
      this.value = initialValue
    }

    // Render initial display
    this.#renderDisplay()

    // Set native type to "text" and add appropriate attributes
    this.type = 'text'
    this.setAttribute('spellcheck', 'false')
    this.setAttribute('aria-haspopup', 'dialog')
    this.setAttribute('aria-expanded', 'false')

    // Build wrapper and popup
    this.#buildWrapperAndPopup()

    // Sync calendar view and selection from initial value
    this.#syncCalendarSelection()

    // Attach event listeners to the input itself
    this.addEventListener('focus', () => this.#onFocus())
    this.addEventListener('click', (e) => this.#onClick(e))
    this.addEventListener('keydown', (e) => this.#onInputKeydown(e))
    this.addEventListener('blur', () => this.#onBlur())
  }

  // ===== Segment state and rendering =====

  #buffer = null // { month: '', day: '', year: '' }
  #activeSegment = null // 'month' | 'day' | 'year'
  #savedActiveSegment = null // saved segment before popup opened
  #viewMonth = null // popup's browsed month (0-11)
  #viewYear = null // popup's browsed year
  #popupOpen = false
  #pointerInteraction = false
  #wrapper = null
  #popup = null
  #rovingBtn = null // reference to the currently focused calendar button (roving tabindex)
  #announcer = null
  #hiddenElements = null // elements hidden while popup is open

  get value() {
    if (isSegmentEmpty(this.#buffer.month) ||
        isSegmentEmpty(this.#buffer.day) ||
        this.#buffer.year.length !== 4) {
      return ''
    }
    return formatISODate(
      parseInt(this.#buffer.year, 10),
      parseInt(this.#buffer.month, 10) - 1, // month is 1-based in buffer, 0-based in formatISODate
      parseInt(this.#buffer.day, 10)
    )
  }

  set value(v) {
    if (typeof v !== 'string') {
      this.#clearBuffer()
      this.#renderDisplay()
      return
    }

    // Try ISO format: YYYY-MM-DD
    let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
    if (match) {
      const [, yyyy, mm, dd] = match
      this.#buffer = { month: mm, day: dd, year: yyyy }
      this.#renderDisplay()
      return
    }

    // Try display format: MM/DD/YYYY
    match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v)
    if (match) {
      const [, mm, dd, yyyy] = match
      this.#buffer = { month: mm, day: dd, year: yyyy }
      this.#renderDisplay()
      return
    }

    // Invalid format
    this.#clearBuffer()
    this.#renderDisplay()
    // NOTE: programmatic setter does NOT dispatch input/change
  }

  #clearBuffer() {
    this.#buffer = { month: '', day: '', year: '' }
  }

  #effectiveMonth() {
    // Returns 0-based month for daysInMonth etc.
    // Falls back to current month if not typed yet
    return this.#buffer.month ? parseInt(this.#buffer.month, 10) - 1 : currentYear()
  }

  #effectiveYear() {
    return this.#buffer.year ? parseInt(this.#buffer.year, 10) : currentYear()
  }

  #segmentDisplay(name) {
    const def = SEGMENT_DEFS[name]
    const buf = this.#buffer[name]
    return buf.padEnd(def.len, def.placeholder)
  }

  #renderDisplay() {
    const displayStr = `${this.#segmentDisplay('month')}/${this.#segmentDisplay('day')}/${this.#segmentDisplay('year')}`
    setNativeValue(this, displayStr)
  }

  #highlightActiveSegment() {
    const { start, end } = OFFSETS[this.#activeSegment]
    this.setSelectionRange(start, end)
  }

  // ===== Focus and click handling =====

  #onFocus() {
    this.#pointerInteraction = false
    this.#activeSegment = 'month'
    this.#highlightActiveSegment()
  }

  #onClick(e) {
    const pos = this.selectionStart
    const segment = segmentIndexForOffset(OFFSETS, pos)
    if (segment) {
      this.#activeSegment = segment
      this.#highlightActiveSegment()
    }
    this.#pointerInteraction = false
  }

  #onBlur() {
    // Commit any incomplete segment when focus leaves
    if (this.#activeSegment && this.#buffer[this.#activeSegment].length === 1) {
      const def = SEGMENT_DEFS[this.#activeSegment]
      this.#buffer[this.#activeSegment] = commitIncompleteSegment(
        this.#buffer[this.#activeSegment],
        def.min,
        def.max
      )
      this.#renderDisplay()
      this.#syncCalendarSelection()
    }
  }

  // ===== Keyboard handling (input segments) =====

  #onInputKeydown(e) {
    if (!this.#activeSegment) {
      this.#closePopup()
      return
    }

    const isDigit = /^[0-9]$/.test(e.key)
    const isArrowUp = e.key === 'ArrowUp'
    const isArrowDown = e.key === 'ArrowDown'
    const isArrowLeft = e.key === 'ArrowLeft'
    const isArrowRight = e.key === 'ArrowRight'
    const isTab = e.key === 'Tab'
    const isBackspace = e.key === 'Backspace'
    const isDelete = e.key === 'Delete'
    const isSpace = e.key === ' '

    if (isDigit) {
      e.preventDefault()
      this.#typeDigit(parseInt(e.key, 10))
    } else if (isArrowUp) {
      e.preventDefault()
      this.#onArrowKey(+1)
    } else if (isArrowDown) {
      e.preventDefault()
      this.#onArrowKey(-1)
    } else if (isArrowLeft) {
      e.preventDefault()
      this.#moveSegment(-1)
    } else if (isArrowRight) {
      e.preventDefault()
      this.#moveSegment(+1)
    } else if (isTab) {
      if (e.shiftKey) {
        // Shift+Tab: move to previous segment or out
        if (this.#activeSegment === 'month') {
          // Let it naturally leave
        } else {
          e.preventDefault()
          this.#commitAndMoveTo(-1)
        }
      } else {
        // Tab: move to next segment or out
        if (this.#activeSegment === 'year') {
          // Let it naturally leave (into popup or next control)
        } else {
          e.preventDefault()
          this.#commitAndMoveTo(1)
        }
      }
    } else if (isBackspace || isDelete) {
      e.preventDefault()
      // Delete one digit from right to left
      const currentValue = this.#buffer[this.#activeSegment]
      if (currentValue.length > 0) {
        this.#buffer[this.#activeSegment] = currentValue.slice(0, -1)
      }
      this.#renderDisplay()
      this.#highlightActiveSegment()
      this.dispatchEvent(new Event('input', { bubbles: true }))
      this.#syncCalendarSelection()
    } else if (isSpace) {
      e.preventDefault()
      if (!this.#popupOpen) {
        this.#openPopup()
      }
      this.#onBlur()
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Prevent typing any other single character (non-digit)
      e.preventDefault()
    }
  }

  #typeDigit(digit) {
    const def = SEGMENT_DEFS[this.#activeSegment]

    // If segment buffer is already at max length, reset it
    if (this.#buffer[this.#activeSegment].length === def.len) {
      this.#buffer[this.#activeSegment] = ''
      this.#renderDisplay()
      this.#highlightActiveSegment()
      this.dispatchEvent(new Event('input', { bubbles: true }))
      this.#syncCalendarSelection()
    }

    // Close popup when user starts typing in the input
    if (this.#popupOpen) {
      this.#closePopup()
    }

    // Special handling for 4-digit year field
    if (this.#activeSegment === 'year') {
      // For year, just accumulate digits without the 2-digit logic
      const newValue = this.#buffer.year + String(digit)
      const yearNum = parseInt(newValue, 10)

      // Clamp to valid range but don't zero-pad yet (keep accumulating)
      const clamped = clamp(yearNum, def.min, def.max)
      this.#buffer.year = String(clamped)
      this.#renderDisplay()
      this.#highlightActiveSegment()
      this.dispatchEvent(new Event('input', { bubbles: true }))
      this.#syncCalendarSelection()
      return
    }

    // For month and day (2-digit segments), use the standard logic
    const { finalValue, shouldAdvance } = typeDigitIntoSegment(
      this.#buffer[this.#activeSegment],
      digit,
      def.min,
      def.max
    )
    this.#buffer[this.#activeSegment] = finalValue
    this.#renderDisplay()

    if (shouldAdvance) {
      const idx = SEGMENT_ORDER.indexOf(this.#activeSegment)
      this.#activeSegment = SEGMENT_ORDER[idx + 1]
      this.#highlightActiveSegment()
    } else {
      this.#highlightActiveSegment()
    }

    this.dispatchEvent(new Event('input', { bubbles: true }))
    this.#syncCalendarSelection()
  }

  #onArrowKey(direction) {
    const wholeValueEmpty = isSegmentEmpty(this.#buffer.month) &&
      isSegmentEmpty(this.#buffer.day) &&
      isSegmentEmpty(this.#buffer.year)

    if (wholeValueEmpty) {
      // Establish baseline
      this.#buffer = {
        month: '01',
        day: '01',
        year: String(currentYear())
      }
      this.#renderDisplay()
      this.#highlightActiveSegment()
      this.#announce(`Date set to ${this.#segmentDisplay('month')}/${this.#segmentDisplay('day')}/${this.#segmentDisplay('year')}`)
      return
    }

    const seg = this.#activeSegment
    const def = SEGMENT_DEFS[seg]
    const max = seg === 'day' ? daysInMonth(this.#effectiveYear(), this.#effectiveMonth()) : def.max

    let newValue
    if (seg === 'year') {
      // Year: free increment, no wrap, but respect min/max attributes if present
      const min = this.getAttribute('min') ? parseInt(this.getAttribute('min').substring(0, 4), 10) : def.min
      const max_ = this.getAttribute('max') ? parseInt(this.getAttribute('max').substring(0, 4), 10) : def.max
      const current = this.#buffer[seg] ? parseInt(this.#buffer[seg], 10) : currentYear()
      newValue = zeroPad(clamp(current + direction, min, max_), 4)
    } else {
      newValue = incrementSegment(
        this.#buffer[seg],
        direction,
        def.min,
        max,
        def.min,
        false
      )
    }

    this.#buffer[seg] = newValue
    this.#renderDisplay()
    this.#highlightActiveSegment()
    this.dispatchEvent(new Event('input', { bubbles: true }))
    this.#syncCalendarSelection()
  }

  #moveSegment(direction) {
    const idx = SEGMENT_ORDER.indexOf(this.#activeSegment)
    const newIdx = clamp(idx + direction, 0, SEGMENT_ORDER.length - 1)
    this.#activeSegment = SEGMENT_ORDER[newIdx]
    this.#highlightActiveSegment()
  }

  #commitAndMoveTo(direction) {
    if (direction < 0) {
      // Tab backward
      if (this.#buffer[this.#activeSegment].length === 1) {
        const def = SEGMENT_DEFS[this.#activeSegment]
        this.#buffer[this.#activeSegment] = commitIncompleteSegment(
          this.#buffer[this.#activeSegment],
          def.min,
          def.max
        )
        this.#renderDisplay()
      }
      this.#moveSegment(-1)
    } else {
      // Tab forward
      if (this.#buffer[this.#activeSegment].length === 1) {
        const def = SEGMENT_DEFS[this.#activeSegment]
        this.#buffer[this.#activeSegment] = commitIncompleteSegment(
          this.#buffer[this.#activeSegment],
          def.min,
          def.max
        )
        this.#renderDisplay()
      }
      this.#moveSegment(1)
    }
    this.#highlightActiveSegment()
  }

  // ===== Popup DOM and positioning =====

  #buildWrapperAndPopup() {
    // Create wrapper and move input into it
    const wrapper = document.createElement('span')
    wrapper.setAttribute('data-e-date-wrapper', '')
    this.parentNode.replaceChild(wrapper, this)

    // Wrap input in e-tooltip only on desktop (not on mobile)
    if (window.innerWidth >= 768) {
      const tooltip = document.createElement('e-tooltip')
      tooltip.setAttribute('data-tip', 'Press Space to open the calendar')
      tooltip.appendChild(this)
      wrapper.appendChild(tooltip)
    } else {
      // On mobile, add input directly to wrapper
      wrapper.appendChild(this)
    }

    this.#wrapper = wrapper

    // Add delegated Escape handler on wrapper
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#popupOpen) {
        e.preventDefault()
        e.stopPropagation()
        this.#closePopup() // This now handles focus restoration
      }
    })

    // Create popup container
    const popup = document.createElement('div')
    popup.setAttribute('is', 'e-date-selector')
    popup.id = `e-date-popup-${popupCounter++}`
    popup.setAttribute('role', 'dialog')
    popup.setAttribute('aria-label', 'Choose date')
    popup.style.display = 'none'

    this.setAttribute('aria-controls', popup.id)

    // Month/Year navigation row
    const navRow = document.createElement('div')
    navRow.setAttribute('is', 'e-row')

    const monthSelect = document.createElement('select')
    monthSelect.setAttribute('aria-label', 'Month')
    monthSelect.setAttribute('data-ignore', '')
    getMonthNames().forEach((name, idx) => {
      const option = document.createElement('option')
      option.value = String(idx)
      option.textContent = name
      monthSelect.appendChild(option)
    })
    monthSelect.addEventListener('change', () => {
      this.#viewMonth = parseInt(monthSelect.value, 10)
      this.#renderGrid()
    })

    const yearInput = document.createElement('input')
    yearInput.type = 'number'
    yearInput.setAttribute('aria-label', 'Year')
    yearInput.setAttribute('data-ignore', '')
    yearInput.value = String(this.#viewYear)
    yearInput.addEventListener('change', () => {
      this.#viewYear = parseInt(yearInput.value, 10) || currentYear()
      this.#renderGrid()
    })
    yearInput.addEventListener('input', () => {
      this.#viewYear = parseInt(yearInput.value, 10) || currentYear()
      this.#renderGrid()
    })

    navRow.appendChild(monthSelect)
    navRow.appendChild(yearInput)

    // Calendar grid
    const table = document.createElement('table')

    const caption = document.createElement('caption')
    caption.className = 'sr-only'
    table.appendChild(caption)

    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    getDayNames().forEach(dayName => {
      const th = document.createElement('th')
      th.scope = 'col'
      th.textContent = dayName
      headerRow.appendChild(th)
    })
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    table.appendChild(tbody)

    // Event delegation for grid cells
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button')
      if (btn && !btn.disabled) {
        const y = parseInt(btn.getAttribute('data-y'), 10)
        const m = parseInt(btn.getAttribute('data-m'), 10)
        const d = parseInt(btn.getAttribute('data-d'), 10)
        this.#commitDate(y, m, d)
      }
    })

    tbody.addEventListener('keydown', (e) => {
      const btn = e.target.closest('button')
      if (!btn) return

      const currentY = parseInt(btn.getAttribute('data-y'), 10)
      const currentM = parseInt(btn.getAttribute('data-m'), 10)
      const currentD = parseInt(btn.getAttribute('data-d'), 10)
      const currentDate = new Date(currentY, currentM, currentD)

      let targetDate = null
      let shouldPrevent = false

      if (e.key === 'ArrowUp') {
        shouldPrevent = true
        targetDate = new Date(currentDate)
        targetDate.setDate(targetDate.getDate() - 7)
      } else if (e.key === 'ArrowDown') {
        shouldPrevent = true
        targetDate = new Date(currentDate)
        targetDate.setDate(targetDate.getDate() + 7)
      } else if (e.key === 'ArrowLeft') {
        shouldPrevent = true
        targetDate = new Date(currentDate)
        targetDate.setDate(targetDate.getDate() - 1)
      } else if (e.key === 'ArrowRight') {
        shouldPrevent = true
        targetDate = new Date(currentDate)
        targetDate.setDate(targetDate.getDate() + 1)
      }

      if (shouldPrevent && targetDate) {
        e.preventDefault()
        const targetY = targetDate.getFullYear()
        const targetM = targetDate.getMonth()
        const targetD = targetDate.getDate()

        // If crossing month boundary, re-render grid
        if (targetM !== this.#viewMonth || targetY !== this.#viewYear) {
          this.#viewMonth = targetM
          this.#viewYear = targetY
          monthSelect.value = String(targetM)
          yearInput.value = String(targetY)
          this.#renderGrid()
        }

        // Focus the target cell (handle disabled)
        const direction = (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 1
        this.#focusDateCellWithFallback(targetY, targetM, targetD, direction)
      }

      // NOTE: Tab/Shift+Tab are NOT intercepted here, allowing natural Tab-out behavior
      // so users can navigate away from the calendar to other UI elements.
      // Only arrow keys navigate within the calendar grid.
    })

    this.#popup = popup

    // Footer row with Clear and Today buttons
    const footerRow = document.createElement('div')
    footerRow.setAttribute('is', 'e-row')

    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.setAttribute('data-primary', '')
    clearBtn.setAttribute('data-fill', 'outlined')
    clearBtn.textContent = 'Clear'
    clearBtn.addEventListener('click', () => {
      this.#clearDate()
    })

    const todayBtn = document.createElement('button')
    todayBtn.type = 'button'
    todayBtn.setAttribute('data-primary', '')
    todayBtn.setAttribute('data-fill', 'solid')
    todayBtn.textContent = 'Today'
    todayBtn.addEventListener('click', () => {
      const today_ = today()
      this.#commitDate(today_.getFullYear(), today_.getMonth(), today_.getDate())
    })

    footerRow.appendChild(clearBtn)
    footerRow.appendChild(todayBtn)

    // Live region for announcements
    const announcer = document.createElement('div')
    announcer.className = 'sr-only'
    announcer.setAttribute('aria-live', 'polite')
    this.#announcer = announcer

    // Assemble popup
    popup.appendChild(navRow)
    popup.appendChild(table)
    popup.appendChild(footerRow)
    popup.appendChild(announcer)

    // Append popup to wrapper (inside dialog)
    wrapper.appendChild(popup)

    // Initial grid render
    this.#renderGrid()
  }

  #renderGrid() {
    const tbody = this.#popup.querySelector('tbody')
    const caption = this.#popup.querySelector('caption')
    const monthSelect = this.#popup.querySelector('select')
    const yearInput = this.#popup.querySelector('input[type="number"]')

    // Update caption
    caption.textContent = `Calendar for ${getMonthNames()[this.#viewMonth]} ${this.#viewYear}`

    // Update controls
    monthSelect.value = String(this.#viewMonth)
    yearInput.value = String(this.#viewYear)

    // Clear existing rows
    tbody.innerHTML = ''

    // Get min/max dates if present
    const minDate = this.getAttribute('min') ? new Date(this.getAttribute('min')) : null
    const maxDate = this.getAttribute('max') ? new Date(this.getAttribute('max')) : null

    // Parse current value
    const currentValue = this.value
    let selectedDate = null
    if (currentValue) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(currentValue)
      if (match) {
        selectedDate = new Date(match[1], parseInt(match[2], 10) - 1, match[3])
      }
    }

    // Build grid with roving tabindex
    const weeks = buildMonthMatrix(this.#viewYear, this.#viewMonth)
    let firstEnabledBtn = null
    let rovingBtn = null // The cell that gets tabIndex=0

    weeks.forEach(week => {
      const tr = document.createElement('tr')
      week.forEach(cell => {
        const td = document.createElement('td')
        const btn = document.createElement('button')
        btn.type = 'button'

        const cellDate = new Date(Date.UTC(cell.y, cell.m, cell.d))
        const isDisabled = cell.outside ||
                           (minDate && cellDate < minDate) ||
                           (maxDate && cellDate > maxDate)
        const isSelected = selectedDate && cellDate.toDateString() === selectedDate.toDateString()
        const isToday = cellDate.toDateString() === new Date().toDateString()

        btn.setAttribute('data-y', String(cell.y))
        btn.setAttribute('data-m', String(cell.m))
        btn.setAttribute('data-d', String(cell.d))

        if (isDisabled) {
          btn.disabled = true
          btn.setAttribute('aria-disabled', 'true')
          btn.tabIndex = -1
        } else {
          btn.tabIndex = -1 // Default to -1, will be changed to 0 for roving cell
          if (!firstEnabledBtn) {
            firstEnabledBtn = btn
          }
          if (isSelected) {
            rovingBtn = btn
          }
          if (!rovingBtn && isToday) {
            rovingBtn = btn
          }
        }

        if (cell.outside) {
          btn.setAttribute('data-outside-month', 'true')
        }

        if (isSelected) {
          btn.setAttribute('data-selected', 'true')
          btn.setAttribute('aria-selected', 'true')
        }

        btn.setAttribute('aria-label', `${getDayNames()[cellDate.getDay()]}, ${getMonthNames()[cellDate.getMonth()]} ${cellDate.getDate()}, ${cellDate.getFullYear()}`)
        btn.textContent = String(cell.d)

        td.appendChild(btn)
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })

    // Set roving tabindex: prefer selected date, then today, then first enabled
    if (!rovingBtn) {
      rovingBtn = firstEnabledBtn
    }
    if (rovingBtn) {
      rovingBtn.tabIndex = 0
      this.#rovingBtn = rovingBtn // Store reference for focus management
    } else if (document.activeElement !== yearInput) {
      monthSelect.focus()
    }
  }

  #focusDateCellWithFallback(y, m, d, direction) {
    let targetDate = new Date(y, m, d)
    let attempts = 0
    const maxAttempts = 62 // Roughly 2 months of searching

    while (attempts < maxAttempts) {
      const btn = this.#popup.querySelector(
        `button[data-y="${targetDate.getFullYear()}"][data-m="${targetDate.getMonth()}"][data-d="${targetDate.getDate()}"]`
      )

      if (btn && !btn.disabled) {
        // Move roving tabindex to this cell
        if (this.#rovingBtn) {
          this.#rovingBtn.tabIndex = -1
        }
        btn.tabIndex = 0
        this.#rovingBtn = btn // Update reference
        btn.focus()
        return
      }

      // Try next day in the given direction
      targetDate.setDate(targetDate.getDate() + direction)
      attempts++
    }
  }

  #commitDate(y, m, d) {
    this.#buffer.month = zeroPad(m + 1, 2) // m is 0-based
    this.#buffer.day = zeroPad(d, 2)
    this.#buffer.year = zeroPad(y, 4)
    this.#renderDisplay()
    this.#announce(`Selected ${getMonthNames()[m]} ${d}, ${y}`)
    this.dispatchEvent(new Event('input', { bubbles: true }))
    this.dispatchEvent(new Event('change', { bubbles: true }))
    this.#closePopup() // This now handles focus restoration
    // Restore the segment that was active before opening the popup
    this.#activeSegment = this.#savedActiveSegment || 'month'
    this.#highlightActiveSegment()
  }

  #clearDate() {
    this.#clearBuffer()
    this.#renderDisplay()
    this.#announce('Date cleared')
    this.dispatchEvent(new Event('input', { bubbles: true }))
    this.dispatchEvent(new Event('change', { bubbles: true }))
    // Stay open, focus back to first segment
    this.#activeSegment = 'month'
    this.#highlightActiveSegment()
    this.focus()
    // Reset view to today
    const today_ = today()
    this.#viewMonth = today_.getMonth()
    this.#viewYear = today_.getFullYear()
    this.#renderGrid()
  }

  // ===== Sync calendar selection to input value =====

  #syncCalendarSelection() {
    const currentValue = this.value
    if (currentValue) {
      // Valid complete date: jump view to that date
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(currentValue)
      if (match) {
        this.#viewYear = parseInt(match[1], 10)
        this.#viewMonth = parseInt(match[2], 10) - 1 // convert to 0-based
      }
    }
    // Re-render grid with updated view (and selection highlight if value is complete)
    this.#renderGrid()
  }

  // ===== Popup open/close =====

  #openPopup() {
    if (this.#popupOpen) {
      return
    }
    // Save the active segment to restore after selecting a date
    this.#savedActiveSegment = this.#activeSegment
    this.#popupOpen = true
    this.#popup.style.display = ''
    this.setAttribute('aria-expanded', 'true')

    // Temporarily allow overflow on parent dialog so popup can appear above
    const dialog = this.closest('dialog[is="e-dialog"]')
    if (dialog) {
      dialog.style.overflow = 'visible'
      // Also handle the inner wrapper that has overflow-y: auto
      const innerWrapper = dialog.querySelector(':scope > div')
      if (innerWrapper) {
        innerWrapper.style.overflow = 'visible'
        innerWrapper.style.overflowY = 'visible'

        // Hide elements that are outside or only partially in the scroll view
        const scrollTop = innerWrapper.scrollTop
        const scrollLeft = innerWrapper.scrollLeft
        const viewportHeight = innerWrapper.clientHeight
        const viewportWidth = innerWrapper.clientWidth

        this.#hiddenElements = [] // Track hidden elements to restore later

        // Check if the date input itself is fully visible
        const inputRect = this.getBoundingClientRect()
        const innerRect = innerWrapper.getBoundingClientRect()
        const inputRelativeTop = inputRect.top - innerRect.top + scrollTop
        const inputRelativeBottom = inputRelativeTop + inputRect.height
        const inputRelativeLeft = inputRect.left - innerRect.left + scrollLeft
        const inputRelativeRight = inputRelativeLeft + inputRect.width

        const inputIsFullyVisible =
          inputRelativeTop >= scrollTop &&
          inputRelativeBottom <= scrollTop + viewportHeight &&
          inputRelativeLeft >= scrollLeft &&
          inputRelativeRight <= scrollLeft + viewportWidth

        // Hide the input if it's not fully visible
        if (!inputIsFullyVisible) {
          this.style.display = 'none'
          this.#hiddenElements.push(this)
        }

        const allElements = innerWrapper.querySelectorAll('input, select, textarea, button, label')

        allElements.forEach(element => {
          // Don't hide the date input (already handled above), popup contents,
          // or any parent elements of the wrapper
          if (element === this || this.#wrapper.contains(element) || element.contains(this.#wrapper)) {
            return
          }

          const rect = element.getBoundingClientRect()

          // Calculate position relative to scroll container
          const relativeTop = rect.top - innerRect.top + scrollTop
          const relativeBottom = relativeTop + rect.height
          const relativeLeft = rect.left - innerRect.left + scrollLeft
          const relativeRight = relativeLeft + rect.width

          // Check if element is completely within scroll viewport
          const isFullyVisible =
            relativeTop >= scrollTop &&
            relativeBottom <= scrollTop + viewportHeight &&
            relativeLeft >= scrollLeft &&
            relativeRight <= scrollLeft + viewportWidth

          // Hide if not fully visible (outside or partially outside)
          if (!isFullyVisible) {
            element.style.display = 'none'
            this.#hiddenElements.push(element)
          }
        })
      }

      // Disable window scrolling
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    }

    // Sync calendar view and selection to current value
    this.#syncCalendarSelection()

    this.#positionPopup()

    // Move focus to the roving tabindex cell (tabIndex=0) so arrow keys work in the calendar
    if (this.#rovingBtn) {
      this.#rovingBtn.focus()
    }

    // Attach listeners only while open
    window.addEventListener('resize', this.#boundPositionPopup)
    window.addEventListener('scroll', this.#boundPositionPopup, { capture: true })
    document.addEventListener('pointerdown', this.#boundOnOutsidePointerdown, { capture: true })
  }

  #closePopup() {
    if (!this.#popupOpen) {
      return
    }
    this.#popupOpen = false
    this.#popup.style.display = 'none'
    this.setAttribute('aria-expanded', 'false')

    // Restore dialog overflow
    const dialog = this.closest('dialog[is="e-dialog"]')
    if (dialog) {
      dialog.style.overflow = ''
      // Restore inner wrapper overflow and scrolling
      const innerWrapper = dialog.querySelector(':scope > div')
      if (innerWrapper) {
        innerWrapper.style.overflow = ''
        innerWrapper.style.overflowY = ''

        // Restore hidden elements
        if (this.#hiddenElements && this.#hiddenElements.length > 0) {
          this.#hiddenElements.forEach(element => {
            element.style.display = ''
          })
          this.#hiddenElements = []
        }
      }
    }

    // Restore window scrolling
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''

    // Remove listeners
    window.removeEventListener('resize', this.#boundPositionPopup)
    window.removeEventListener('scroll', this.#boundPositionPopup, { capture: true })
    document.removeEventListener('pointerdown', this.#boundOnOutsidePointerdown, { capture: true })

    // Restore focus to input so user can continue typing (with delay to ensure it happens after click event)
    setTimeout(() => this.focus(), 0)
  }

  #positionPopup() {
    const rect = this.getBoundingClientRect()
    const estimatedHeight = this.#popup.offsetHeight || 340
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

    this.#popup.style.top = openUpward ? 'auto' : 'calc(100% + 4px)'
    this.#popup.style.bottom = openUpward ? 'calc(100% + 4px)' : 'auto'

    // Correct on next frame if actual height differs from estimate
    requestAnimationFrame(() => {
      const realHeight = this.#popup.offsetHeight
      const stillFits = openUpward ? spaceAbove >= realHeight : spaceBelow >= realHeight
      if (!stillFits) {
        // Flip
        this.#popup.style.top = !openUpward ? 'auto' : 'calc(100% + 4px)'
        this.#popup.style.bottom = !openUpward ? 'calc(100% + 4px)' : 'auto'
      }
    })
  }

  #boundPositionPopup = this.#positionPopup.bind(this)
  #boundOnOutsidePointerdown = this.#onOutsidePointerdown.bind(this)

  #onOutsidePointerdown(e) {
    if (!this.#wrapper.contains(e.target)) {
      this.#closePopup()
    }
  }

  // ===== Accessibility =====

  #announce(message) {
    if (this.#announcer) {
      this.#announcer.textContent = message
    }
  }
}

customElements.define('e-date', EDate, { extends: 'input' })
