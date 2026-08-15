/**
 * Shared pure-function helpers for e-date and e-time custom elements.
 * No class definitions, no DOM, no event wiring — just data transformation and utilities.
 */

/**
 * Native HTMLInputElement.prototype.value descriptor, captured once.
 * Used to bypass our own value accessors and read/write the literal displayed text.
 */
export const nativeValueDescriptor = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value'
)

/**
 * Read the native value (literal text in the box) without recursing through our override.
 */
export function getNativeValue(inputElement) {
  return nativeValueDescriptor.get.call(inputElement)
}

/**
 * Write the native value (literal text in the box) without recursing through our override.
 */
export function setNativeValue(inputElement, text) {
  nativeValueDescriptor.set.call(inputElement, text)
}

/**
 * Clamp a number to [min, max].
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Zero-pad a number to a minimum digit width.
 * @param {number} num The number to pad
 * @param {number} width Minimum digit width (e.g., 2 for "01", 4 for "2026")
 * @returns {string} Zero-padded string
 */
export function zeroPad(num, width) {
  return String(num).padStart(width, '0')
}

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Get the number of days in a given month/year.
 * @param {number} year
 * @param {number} month 0-11
 * @returns {number} 28, 29, 30, or 31
 */
export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Wrap a number within a range [min, max], cycling at boundaries.
 * @param {number} value The value to wrap
 * @param {number} min Minimum (inclusive)
 * @param {number} max Maximum (inclusive)
 * @returns {number} The wrapped value
 */
export function wrap(value, min, max) {
  const range = max - min + 1
  return min + ((value - min + range) % range)
}

/**
 * Segment definition type for building offset tables.
 * @typedef {Object} SegmentDef
 * @property {string} name - Segment name (e.g., 'month', 'day', 'hour')
 * @property {number} len - Width in characters (e.g., 2 for 'mm')
 */

/**
 * Build a segment offset table from a list of segment definitions.
 * Computes character ranges (start/end indices) for each segment in a fixed template.
 * For example, given [{ name: 'month', len: 2 }, { name: 'day', len: 2 }, { name: 'year', len: 4 }]
 * with separators '/' between month-day and day-year, builds:
 * { month: { start: 0, end: 2 }, day: { start: 3, end: 5 }, year: { start: 6, end: 10 } }
 *
 * @param {Array<SegmentDef>} segments
 * @param {string|Array<string>} separators Single separator or array of separators between segments
 * @returns {Object} Map of segment names to { start, end } ranges
 */
export function buildSegmentOffsetTable(segments, separators = '/') {
  const seps = Array.isArray(separators) ? separators : Array(segments.length - 1).fill(separators)
  const offsets = {}
  let pos = 0

  segments.forEach((seg, i) => {
    const start = pos
    const end = start + seg.len
    offsets[seg.name] = { start, end }
    pos = end
    if (i < segments.length - 1) {
      pos += seps[i] ? seps[i].length : 1
    }
  })

  return offsets
}

/**
 * Map a character position (e.g., from selectionStart) to a segment name.
 * Boundary-inclusive toward the earlier segment (e.g., position 2 in "mm/dd" belongs to month).
 *
 * @param {Object} offsets Segment offset table from buildSegmentOffsetTable
 * @param {number} pos Character position (0-based)
 * @returns {string|null} Segment name, or null if position is out of bounds
 */
export function segmentIndexForOffset(offsets, pos) {
  const names = Object.keys(offsets)
  for (const name of names) {
    const { start, end } = offsets[name]
    if (pos < end) {
      return name
    }
  }
  return names[names.length - 1] || null
}

/**
 * Digit-typing auto-advance algorithm.
 * Implements the rule: first digit can auto-commit if no valid 2-digit completion remains.
 * Returns whether the segment should advance to the next one.
 *
 * @param {string} bufferValue Current buffer value ('' or single digit or full)
 * @param {number} newDigit The digit being typed (0-9)
 * @param {number} minVal Minimum valid value for this segment
 * @param {number} maxVal Maximum valid value for this segment
 * @returns {Object} { finalValue: string, shouldAdvance: boolean }
 */
export function typeDigitIntoSegment(bufferValue, newDigit, minVal, maxVal) {
  if (bufferValue === '') {
    // Empty buffer: first digit
    const asTens = newDigit * 10
    const asOnes = newDigit

    // Check if any 2-digit completion starting with this digit can be valid
    const canFormValidTens = asTens + 9 >= minVal && asTens <= maxVal
    const canFormValidOnes = asOnes >= minVal && asOnes <= maxVal

    if (!canFormValidTens) {
      // No valid 2-digit number starting with this digit; treat it as ones with leading zero
      return {
        finalValue: zeroPad(asOnes, 2),
        shouldAdvance: true
      }
    } else {
      // Valid completions exist; store single digit, wait for second
      return {
        finalValue: String(newDigit),
        shouldAdvance: false
      }
    }
  } else if (bufferValue.length === 1) {
    // Already one digit; add the second
    const candidate = parseInt(bufferValue + String(newDigit), 10)
    const clamped = clamp(candidate, minVal, maxVal)
    return {
      finalValue: zeroPad(clamped, 2),
      shouldAdvance: true
    }
  } else {
    // Already full (2 digits or more); restart
    return typeDigitIntoSegment('', newDigit, minVal, maxVal)
  }
}

/**
 * Force-commit an incomplete segment buffer (e.g., on Tab away from a 1-digit month).
 * Uses the same leading-zero interpretation as the auto-advance rule.
 *
 * @param {string} bufferValue Current buffer ('', single digit, or full)
 * @param {number} minVal Minimum valid value
 * @param {number} maxVal Maximum valid value
 * @returns {string} Committed value, zero-padded to 2 digits
 */
export function commitIncompleteSegment(bufferValue, minVal, maxVal) {
  if (bufferValue === '') return ''
  if (bufferValue.length === 1) {
    const asOnes = parseInt(bufferValue, 10)
    return zeroPad(clamp(asOnes, minVal, maxVal), 2)
  }
  return bufferValue
}

/**
 * Check if a segment buffer is empty or logically empty (no complete value).
 */
export function isSegmentEmpty(bufferValue) {
  return !bufferValue || bufferValue === ''
}

/**
 * Increment or decrement a segment with wrap-around.
 * If the buffer is empty, returns a sensible default (not an increment).
 *
 * @param {string} bufferValue Current buffer value ('' or digit string)
 * @param {number} direction +1 (up) or -1 (down)
 * @param {number} minVal Minimum valid value
 * @param {number} maxVal Maximum valid value
 * @param {number} defaultValue Value to use if buffer is empty (for seeding)
 * @param {boolean} noWrap If true, clamp instead of wrap at boundaries (for year)
 * @returns {string} New value, zero-padded to 2 digits
 */
export function incrementSegment(
  bufferValue,
  direction,
  minVal,
  maxVal,
  defaultValue = minVal,
  noWrap = false
) {
  let currentValue = bufferValue ? parseInt(bufferValue, 10) : defaultValue

  if (noWrap) {
    // Clamp: for year, just increment freely or clamp to bounds
    const next = currentValue + direction
    return zeroPad(clamp(next, minVal, maxVal), bufferValue.length || 2)
  } else {
    // Wrap: for month (1-12), day (1-31), etc.
    const nextValue = wrap(currentValue + direction, minVal, maxVal)
    return zeroPad(nextValue, 2)
  }
}

/**
 * Get the current real year (for baseline seeding).
 */
export function currentYear() {
  return new Date().getFullYear()
}

/**
 * Get the current real month (0-11, for baseline seeding).
 */
export function currentMonth() {
  return new Date().getMonth()
}

/**
 * Get the current real date.
 */
export function today() {
  return new Date()
}

/**
 * Format a date as "YYYY-MM-DD" (ISO 8601 date string).
 */
export function formatISODate(year, month0Based, day) {
  return `${zeroPad(year, 4)}-${zeroPad(month0Based + 1, 2)}-${zeroPad(day, 2)}`
}

/**
 * Convert 12-hour (1-12) + meridiem (AM/PM) to 24-hour (0-23).
 */
export function to24Hour(hour12, meridiem) {
  const h = parseInt(hour12, 10)
  if (meridiem === 'AM') {
    return h === 12 ? 0 : h
  } else {
    return h === 12 ? 12 : h + 12
  }
}

/**
 * Convert 24-hour (0-23) to 12-hour (1-12) + meridiem (AM/PM).
 */
export function to12Hour(hour24) {
  const h = parseInt(hour24, 10)
  const meridiem = h < 12 ? 'AM' : 'PM'
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  return { hour12, meridiem }
}

/**
 * Parse a native time string "HH:mm" into hour24 and minute.
 */
export function parseTimeString(timeStr) {
  const match = /^(\d{2}):(\d{2})$/.exec(timeStr)
  if (!match) return null
  return { hour24: parseInt(match[1], 10), minute: parseInt(match[2], 10) }
}

/**
 * Build a month matrix (calendar grid) for a given year and month.
 * Returns an array of weeks, each week is an array of date objects.
 * Includes padding days from adjacent months.
 *
 * @param {number} year
 * @param {number} month 0-11
 * @returns {Array<Array<{y: number, m: number, d: number, outside: boolean}>>} Grid of date cells
 */
export function buildMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday
  const daysThisMonth = daysInMonth(year, month)

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysLastMonth = daysInMonth(prevYear, prevMonth)

  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  const cells = []

  // Padding days from previous month
  for (let i = 0; i < firstDay; i++) {
    cells.push({
      y: prevYear,
      m: prevMonth,
      d: daysLastMonth - firstDay + 1 + i,
      outside: true
    })
  }

  // Days of this month
  for (let d = 1; d <= daysThisMonth; d++) {
    cells.push({
      y: year,
      m: month,
      d,
      outside: false
    })
  }

  // Padding days from next month
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({
      y: nextYear,
      m: nextMonth,
      d: nextDay++,
      outside: true
    })
  }

  // Chunk into weeks
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return weeks
}

/**
 * Get all day names (Sunday-first).
 */
export function getDayNames() {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}

/**
 * Get all month names.
 */
export function getMonthNames() {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
}
