/**
 * Example utility: Primary color picker
 * Allows users to dynamically change the --e-primary CSS variable
 */

document.addEventListener('DOMContentLoaded', () => {
  const colorPicker = document.querySelector('input[type="color"][aria-label="Primary color"]')
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--e-primary', e.target.value)
    })
  }
})
