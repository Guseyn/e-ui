# Release 1.0.1

- **e-sidebar**: mobile menu button uses `aria-label`, `aria-expanded`, `aria-controls`; decorative menu icon marked `aria-hidden`
- **e-dialog**: close control is a `<button>` with `aria-label="Close dialog"`; decorative close icon marked `aria-hidden`
- **e-toast**: decorative type icon marked `aria-hidden`; close button has `aria-label="Close notification"`
- **e-week-picker-template**: prev/next week buttons have `aria-label`; decorative icons marked `aria-hidden`
- **e-file-upload-template**: decorative upload icon marked `aria-hidden`
- **e-calendar-template**: calendar events are keyboard-focusable with `aria-label`, Enter/Space activation, and focus-visible expand styles
- **e-ui.css**: `data-focusable` focus-visible styles for `e-user-avatar` and `img[role="button"]`; dialog close button reset styles for `<button>` element
