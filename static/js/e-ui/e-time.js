import {
  setNativeValue, getNativeValue,
  zeroPad,
  typeDigitIntoSegment, commitIncompleteSegment, incrementSegment, isSegmentEmpty,
  buildSegmentOffsetTable, segmentIndexForOffset,
  to24Hour, to12Hour
} from '#e-ui/e-date-time-shared.js'

const SEGMENT_ORDER = ['hour', 'minute', 'meridiem']
const SEGMENT_DEFS = {
  hour: { len: 2, min: 1, max: 12, placeholder: 'h' },
  minute: { len: 2, min: 0, max: 59, placeholder: 'm' },
  meridiem: { len: 2, min: 0, max: 1, placeholder: 'a' }
}
const OFFSETS = buildSegmentOffsetTable([
  { name: 'hour', len: 2 },
  { name: 'minute', len: 2 },
  { name: 'meridiem', len: 2 }
], [':', ' '])

class ETime extends HTMLInputElement {
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
    this.#buffer = { hour: '', minute: '', meridiem: '' }
    this.#activeSegment = 'hour'

    // Initialize from native input value (set by browser or processAttributes)
    // Must be BEFORE #renderDisplay() so we read the original value, not the display format
    const initialValue = getNativeValue(this)
    if (initialValue) {
      this.value = initialValue
    }

    // Render initial display
    this.#renderDisplay()

    // Set native type to "text"
    this.type = 'text'
    this.setAttribute('spellcheck', 'false')

    // Attach event listeners to the input itself
    this.addEventListener('focus', () => this.#onFocus())
    this.addEventListener('click', (e) => this.#onClick(e))
    this.addEventListener('keydown', (e) => this.#onInputKeydown(e))
    this.addEventListener('blur', () => this.#onBlur())
  }

  // ===== Segment state and rendering =====

  #buffer = null // { hour: '', minute: '', meridiem: '' }
  #activeSegment = null // 'hour' | 'minute' | 'meridiem'

  get value() {
    if (isSegmentEmpty(this.#buffer.hour) ||
        isSegmentEmpty(this.#buffer.minute) ||
        !this.#buffer.meridiem) {
      return ''
    }
    const hour24 = to24Hour(parseInt(this.#buffer.hour, 10), this.#buffer.meridiem)
    return `${zeroPad(hour24, 2)}:${zeroPad(parseInt(this.#buffer.minute, 10), 2)}`
  }

  set value(v) {
    if (typeof v !== 'string') {
      this.#clearBuffer()
      this.#renderDisplay()
      return
    }

    // Try 24-hour format: HH:MM
    let match = /^(\d{2}):(\d{2})$/.exec(v)
    if (match) {
      const hour24 = parseInt(match[1], 10)
      const minute = parseInt(match[2], 10)
      const { hour12, meridiem } = to12Hour(hour24)
      this.#buffer = {
        hour: zeroPad(hour12, 2),
        minute: zeroPad(minute, 2),
        meridiem
      }
      this.#renderDisplay()
      return
    }

    // Try 12-hour format: hh:mm am/pm
    match = /^(\d{2}):(\d{2})\s*(am|pm|AM|PM)$/i.exec(v)
    if (match) {
      const hour12 = parseInt(match[1], 10)
      const minute = parseInt(match[2], 10)
      const meridiem = match[3].toUpperCase()
      this.#buffer = {
        hour: zeroPad(hour12, 2),
        minute: zeroPad(minute, 2),
        meridiem
      }
      this.#renderDisplay()
      return
    }

    // Invalid format
    this.#clearBuffer()
    this.#renderDisplay()
    // NOTE: programmatic setter does NOT dispatch input/change
  }

  #clearBuffer() {
    this.#buffer = { hour: '', minute: '', meridiem: '' }
  }

  #segmentDisplay(name) {
    const def = SEGMENT_DEFS[name]
    const buf = this.#buffer[name]

    if (name === 'meridiem') {
      // meridiem displays as 'am' or 'pm' (lowercase, 2 chars)
      if (buf === 'AM') return 'am'
      if (buf === 'PM') return 'pm'
      return 'am' // placeholder
    }

    return buf.padEnd(def.len, def.placeholder)
  }

  #renderDisplay() {
    const displayStr = `${this.#segmentDisplay('hour')}:${this.#segmentDisplay('minute')} ${this.#segmentDisplay('meridiem')}`
    setNativeValue(this, displayStr)
  }

  #highlightActiveSegment() {
    const { start, end } = OFFSETS[this.#activeSegment]
    this.setSelectionRange(start, end)
  }

  // ===== Focus and click handling =====

  #onFocus() {
    this.#activeSegment = 'hour'
    this.#highlightActiveSegment()
  }

  #onClick(e) {
    const pos = this.selectionStart
    const segment = segmentIndexForOffset(OFFSETS, pos)
    if (segment) {
      this.#activeSegment = segment
      this.#highlightActiveSegment()
    }
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
    }
  }

  // ===== Keyboard handling (input segments) =====

  #onInputKeydown(e) {
    if (!this.#activeSegment) return

    const isDigit = /^[0-9]$/.test(e.key)
    const isArrowUp = e.key === 'ArrowUp'
    const isArrowDown = e.key === 'ArrowDown'
    const isArrowLeft = e.key === 'ArrowLeft'
    const isArrowRight = e.key === 'ArrowRight'
    const isTab = e.key === 'Tab'
    const isLetterA = e.key.toLowerCase() === 'a'
    const isLetterP = e.key.toLowerCase() === 'p'

    if (this.#activeSegment === 'meridiem') {
      if (isLetterA) {
        e.preventDefault()
        this.#buffer.meridiem = 'AM'
        this.#renderDisplay()
        this.dispatchEvent(new Event('input', { bubbles: true }))
        return
      } else if (isLetterP) {
        e.preventDefault()
        this.#buffer.meridiem = 'PM'
        this.#renderDisplay()
        this.dispatchEvent(new Event('input', { bubbles: true }))
        return
      } else if (isDigit) {
        // On mobile, allow digits to toggle: 0 = AM, anything else = PM
        e.preventDefault()
        this.#buffer.meridiem = (parseInt(e.key, 10) === 0) ? 'AM' : 'PM'
        this.#renderDisplay()
        this.dispatchEvent(new Event('input', { bubbles: true }))
        return
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // In meridiem segment, only a/p or digits are allowed
        e.preventDefault()
        return
      }
    }

    if (isDigit && this.#activeSegment !== 'meridiem') {
      e.preventDefault()
      this.#typeDigit(parseInt(e.key, 10))
    } else if (isArrowUp || isArrowDown) {
      e.preventDefault()
      this.#onArrowKey(isArrowUp ? 1 : -1)
    } else if (isArrowLeft) {
      e.preventDefault()
      this.#moveSegment(-1)
    } else if (isArrowRight) {
      e.preventDefault()
      this.#moveSegment(1)
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      // Delete one digit from right to left
      const currentValue = this.#buffer[this.#activeSegment]
      if (currentValue.length > 0) {
        this.#buffer[this.#activeSegment] = currentValue.slice(0, -1)
      }
      this.#renderDisplay()
      this.#highlightActiveSegment()
      this.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (isTab) {
      if (e.shiftKey) {
        // Shift+Tab: move to previous segment or out
        if (this.#activeSegment === 'hour') {
          // Let it naturally leave
        } else {
          e.preventDefault()
          this.#commitAndMoveTo(-1)
        }
      } else {
        // Tab: move to next segment or out
        if (this.#activeSegment === 'meridiem') {
          // Let it naturally leave
        } else {
          e.preventDefault()
          this.#commitAndMoveTo(1)
        }
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Prevent typing any other single character (non-digit in hour/minute)
      e.preventDefault()
    }
  }

  #typeDigit(digit) {
    const def = SEGMENT_DEFS[this.#activeSegment]

    // If segment buffer is already at max length, ignore the digit
    // If segment buffer is already at max length, reset it
    if (this.#buffer[this.#activeSegment].length === def.len) {
      this.#buffer[this.#activeSegment] = ''
      this.#renderDisplay()
      this.#highlightActiveSegment()
      this.dispatchEvent(new Event('input', { bubbles: true }))
    }

    const { finalValue, shouldAdvance } = typeDigitIntoSegment(
      this.#buffer[this.#activeSegment],
      digit,
      def.min,
      def.max
    )
    this.#buffer[this.#activeSegment] = finalValue
    this.#renderDisplay()

    if (shouldAdvance && this.#activeSegment !== 'meridiem') {
      const idx = SEGMENT_ORDER.indexOf(this.#activeSegment)
      this.#activeSegment = SEGMENT_ORDER[idx + 1]
      this.#highlightActiveSegment()
    } else {
      this.#highlightActiveSegment()
    }

    this.dispatchEvent(new Event('input', { bubbles: true }))
  }

  #onArrowKey(direction) {
    const wholeValueEmpty = isSegmentEmpty(this.#buffer.hour) &&
                             isSegmentEmpty(this.#buffer.minute) &&
                             !this.#buffer.meridiem

    if (wholeValueEmpty) {
      // Establish baseline: 12:00 AM
      this.#buffer = {
        hour: '12',
        minute: '00',
        meridiem: 'AM'
      }
      this.#renderDisplay()
      this.#highlightActiveSegment()
      return
    }

    const seg = this.#activeSegment

    if (seg === 'meridiem') {
      // Toggle AM <-> PM
      this.#buffer.meridiem = this.#buffer.meridiem === 'AM' ? 'PM' : 'AM'
    } else {
      const def = SEGMENT_DEFS[seg]
      const newValue = incrementSegment(
        this.#buffer[seg],
        direction,
        def.min,
        def.max,
        def.min,
        false
      )
      this.#buffer[seg] = newValue
    }

    this.#renderDisplay()
    this.#highlightActiveSegment()
    this.dispatchEvent(new Event('input', { bubbles: true }))
  }

  #moveSegment(direction) {
    const idx = SEGMENT_ORDER.indexOf(this.#activeSegment)
    const newIdx = clamp(idx + direction, 0, SEGMENT_ORDER.length - 1)
    this.#activeSegment = SEGMENT_ORDER[newIdx]
    this.#highlightActiveSegment()

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max)
    }
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
}

customElements.define('e-time', ETime, { extends: 'input' })
