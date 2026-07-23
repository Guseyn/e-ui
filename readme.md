<img src="https://raw.githubusercontent.com/Guseyn/e-ui/master/static/images/logo.svg?sanitize=true">

**v 1.0.7**

UI library for SaaS applications. **e-ui** provides a design system (CSS) and interactive custom elements (JavaScript) that work alongside [EHTML](https://e-html.org) — a declarative, no-build-step HTML framework.

- **CSS:** `static/css/e-ui.css` — design tokens, utilities, typography, layout, forms, and component styles
- **JS:** `static/js/e-ui/` — custom elements and EHTML template extensions
- **Examples:** `static/html/` — runnable demo pages (start the dev server with `npm start`)

## Quick start

**e-ui is designed to be used with [EHTML](https://e-html.org).** EHTML activates templates, binds data, and runs actions; e-ui components listen for EHTML's `ehtml:activated` event before initializing.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <script type="importmap">
  {
    "imports": {
      "#ehtml/": "/js/ehtml/",
      "#ehtml/main": "/js/ehtml/main.js",
      "#e-ui/": "/js/e-ui/"
    }
  }
  </script>
  <script type="module">
    import '#ehtml/main'
    import '#e-ui/e-toast.js'
    import '#e-ui/e-dialog.js'
    import '#e-ui/e-confirm.js'
  </script>
  <link rel="stylesheet" href="/css/e-ui.css">
</head>
<body>
  <!-- your markup -->
</body>
</html>
```

```bash
npm start
```

Open [http://localhost:8004/html/index.html](http://localhost:8004/html/index.html) for the example gallery.

### Design tokens

Override CSS variables on `:root` to theme an app (for example, set `--e-primary` from your brand color):

```css
:root {
  --e-primary: #3551A4;
  --e-bg: #f6f7fb;
  --e-surface-bg: #ffffff;
  --e-spacing-sm … --e-spacing-3xl;
  --e-font-size-xs … --e-font-size-3xl;
  --e-sidebar-collapsed: 4.5rem;
  --e-sidebar-expanded: 20rem;
}
```

### Utility attributes

Apply spacing, flex, color, and sizing without custom CSS. Works on any element or `[is^="e-"]`:

```html
<div is="e-stack" data-gap="md" data-padding="lg" data-align-items="center">
  <span is="e-muted" data-font-size="sm">Subtitle</span>
</div>
```

Common utilities: `data-padding`, `data-margin`, `data-gap`, `data-flex-direction`, `data-justify-content`, `data-align-items`, `data-width` (`xs`–`xl`, `full`), `data-font-size`, `data-font-weight`, `data-color`, `data-background`, `data-border-radius`, `data-columns`.

---

## Typography

Styled text elements use the `is` attribute on native HTML tags. Only `e-ui.css` is required — no JS imports.

Live demo: [typography-layout.html](static/html/examples/typography-layout.html) · Screenshot: [typography.png](static/images/typography.png)

### Headings

Use `is="e-h"` on any heading level. Size comes from the tag (`h1`–`h6`).

```html
<h1 is="e-h">Page title</h1>
<h2 is="e-h">Section title</h2>
<h3 is="e-h">Subsection</h3>
<h6 is="e-h" data-color="muted" data-text-case="upper">Eyebrow label</h6>
```

### Paragraphs and quotes

```html
<p is="e-p">Body copy uses the typography font stack and relaxed line height.</p>

<blockquote is="e-quote">
  A blockquote for testimonials or callouts.
</blockquote>

<pre is="e-pre">const greeting = 'Hello'</pre>
```

### Text spans

| `is` value | Purpose |
|------------|---------|
| `e-text` | Default body text color |
| `e-muted` | Secondary / de-emphasized text |
| `e-light` | Text on dark backgrounds |
| `e-bold` | Bold emphasis |
| `e-caption` | Small uppercase label |
| `e-error`, `e-danger` | Error message color |
| `e-helper` | Helper text below fields (block) |

```html
<span is="e-text">Default text</span>
<span is="e-muted">Muted description</span>
<span is="e-bold">Important</span>
<span is="e-caption">Section label</span>
<span is="e-error">This field is required</span>
<span is="e-helper">Shown below an input</span>
```

### Labels, tags, and chips

```html
<span is="e-badge">3</span>
<span is="e-tag">Draft</span>
<span is="e-chip">Removable chip <img src="/images/close.svg" alt=""></span>
```

`span[is="stack"]` is an inline vertical stack for compact multi-line labels:

```html
<span is="stack">
  <span is="e-bold">Jane Doe</span>
  <span is="e-muted">Instructor</span>
</span>
```

### Inline code and highlight

```html
<p is="e-p">Run <code is="e-code">npm start</code> locally.</p>
<p is="e-p">Search for <mark is="e-mark">keyword</mark> in results.</p>
```

### Links

```html
<a is="e-link" href="#">Text link</a>
<a is="e-link" data-underlined href="#">Underlined link</a>
```

### Dividers

```html
<hr is="e-divider">
<hr is="e-divider" data-dashed>
<hr is="e-divider" data-primary-color>
<hr is="e-divider-text" data-text="Or continue with">
```

---

## Layout

Flex, grid, and page-structure primitives. Combine with utility attributes (`data-gap`, `data-padding`, `data-width`, etc.).

Live demo: [typography-layout.html](static/html/examples/typography-layout.html) · Screenshot: [layout.png](static/images/layout.png)

### Flex and grid

| `is` value | Element | Behavior |
|------------|---------|----------|
| `e-stack` | `div` | Column flex container |
| `e-row` | `div` | Row flex container (stacks on mobile unless `data-keep-flex-direction-row-in-mobile`) |
| `e-grid` | `div` | 3-column grid (1 column below 980px) |
| `e-box` | `div` | Plain block wrapper |
| `e-spacer` | `div` | Flex grow spacer |

```html
<div is="e-stack" data-gap="md">
  <div is="e-row" data-gap="sm" data-justify-content="space-between">
    <span is="e-bold">Title</span>
    <div is="e-spacer"></div>
    <button data-primary>Action</button>
  </div>
</div>

<div is="e-grid" data-gap="lg" data-columns="2">
  <div is="e-card" data-padding="lg">Column A</div>
  <div is="e-card" data-padding="lg">Column B</div>
</div>
```

### Surfaces

```html
<div is="e-card" data-padding="lg">Bordered card with shadow</div>
<div is="e-panel" data-padding="lg">Full-width elevated panel</div>
<div is="e-info" data-padding="md">Muted info notice box</div>
```

### Page regions

```html
<header is="e-header"><!-- fixed mobile header --></header>

<main is="e-main" data-centralized>
  <section is="e-section"><!-- content --></section>
</main>

<footer is="e-footer" data-justify-content="center">© 2026</footer>
```

`data-centralized` on `e-main` applies max-width and horizontal padding from `--e-main-max-width`.

---

## CSS-only components

These patterns need only `e-ui.css`. They are separate from typography and layout primitives above.

### Buttons

Live demo: [forms-buttons.html](static/html/examples/forms-buttons.html) · Screenshot: [forms-buttons.png](static/images/forms-buttons.png)

```html
<button data-primary>Solid</button>
<button data-primary data-fill="outlined">Outlined</button>
<button data-primary data-fill="danger">Danger</button>
<button is="e-with-icon" title="Add">
  <img src="/images/plus.svg" alt="">
</button>

<a is="e-link-button" href="#">Link button</a>
<a is="e-link-button" data-variant="outline" href="#">Outline link button</a>
```

### Forms

Live demo: [forms-buttons.html](static/html/examples/forms-buttons.html) · Screenshot: [forms-buttons.png](static/images/forms-buttons.png)

```html
<form is="e-form" data-width="sm">
  <label>
    Email
    <input type="email" name="email" required>
  </label>
  <label data-flex-direction="row">
    <input type="checkbox" name="remember">
    Remember me
  </label>
  <label>
    Role
    <select name="role"><option>Admin</option></select>
  </label>
  <label>
    Notes
    <textarea name="notes" rows="3"></textarea>
  </label>
  <button data-primary type="submit">Save</button>
</form>
```

Use `data-no-style` on `e-form` to skip the card-like wrapper. Group fields with `fieldset[is="e-fieldset"]` and `legend[is="e-legend"]`.

File inputs inside `e-form` pick up drag-and-drop styling automatically when generated by the `e-file-upload` template (see [Custom elements](#custom-elements)).

### Tables

```html
<table is="e-table">
  <thead>
    <tr><th>Name</th><th>Role</th></tr>
  </thead>
  <tbody>
    <tr><td>Alice</td><td>Admin</td></tr>
  </tbody>
</table>
```

### Lists

```html
<ul is="e-list" data-type="bullet" data-divided="true">
  <li is="e-list-item">Item one</li>
  <li is="e-list-item" data-interactive="true">Clickable item</li>
</ul>
```

### User avatar

Live demo: [chips-kbd.html](static/html/examples/chips-kbd.html) · Screenshot: [user-avatar.png](static/images/user-avatar.png)

Circular avatar with initials or background image. With EHTML, `data-text` is evaluated into the element on activation.

```html
<div
  is="e-user-avatar"
  data-size="md"
  style="background-color: #3551A4;"
  data-text="JD">
</div>

<div
  is="e-user-avatar"
  data-size="md"
  style="background: url(/avatar.jpg) center center / cover no-repeat; color: transparent;"
  data-text="JD">
</div>
```

Size with `data-size`, `data-width`, or `data-height` (`3xs`–`3xl`).

### Tooltip

Live demo: [forms-buttons.html](static/html/examples/forms-buttons.html) · Screenshot: [forms-buttons.png](static/images/tooltip.png)

`e-tooltip` is styled by CSS only — wrap the trigger element and set `data-tip`:

```html
<e-tooltip data-tip="Copy URL" data-direction="to-right">
  <img src="/images/copy.svg" alt="Copy">
</e-tooltip>
```

### Scrollable regions

Use the `e-scrollable` tag for overflow containers (also used internally by multiselect dropdown):

```html
<e-scrollable data-show-scrollbar data-padding="sm">
  <!-- long content -->
</e-scrollable>
```

### Keyboard hint appearance

Live demo: [chips-kbd.html](static/html/examples/chips-kbd.html) · Screenshot: [forms-buttons.png](static/images/kbd.png)

`kbd[is="e-kbd"]` is styled by CSS. To bind a global shortcut, import `e-kbd.js` — see [Custom elements](#custom-elements).

```html
<kbd is="e-kbd">Ctrl + K</kbd>
<kbd is="e-kbd" data-absolute>⇧ + S</kbd>
```

---

## Custom elements

These require JS module imports and EHTML activation. Most expose `data-action`, `data-onopen`, or `data-onclose` strings evaluated by EHTML.

| Module | Element | Description |
|--------|---------|-------------|
| `e-toast.js` | `<e-toast>` | Toast notifications |
| `e-dialog.js` | `dialog[is="e-dialog"]` | Modal dialogs |
| `e-confirm.js` | `<e-confirm>` | Promise-based confirm dialog |
| `e-sidebar.js` | `<e-sidebar>` | App sidebar |
| `e-tab.js` | `<e-tabs>`, `<e-tab>` | Tab navigation |
| `e-kbd.js` | `kbd[is="e-kbd"]` | Keyboard shortcuts via `data-action` |
| `e-kbd-graph.js` | `<e-kbd-graph>` | Arrow-key focus graph |
| `e-selectable-chip.js` | `<e-selectable-chip>` | Toggle chip |
| `e-autoclick-button.js` | `button[is="e-autoclick"]` | Auto-click on activation |
| `e-file-upload-template.js` | `<template is="e-file-upload">` | File upload drop zone |
| `e-multiselect-dropdown-template.js` | `<template is="e-multiselect-dropdown">` | Searchable multiselect |
| `e-week-picker-template.js` | `<template is="e-week-picker">` | Week navigation |

> `e-multiselect-dropdown` requires `e-kbd.js` to be imported before its template module.

### `e-toast`

Live demo: [dialog-toast.html](static/html/examples/dialog-toast.html) · Screenshot: [toast.png](static/images/toast.png)

```html
<e-toast
  data-type="success"
  data-position="top-right"
  data-hide-after-n-seconds="5"
  data-close-icon="/images/close.svg"
></e-toast>
```

```javascript
document.querySelector('e-toast').open('Saved successfully!')
```

**API:** `.open(content?, delay?)`, `.close()`

| Attribute | Values |
|-----------|--------|
| `data-type` | `success`, `error`, `warning`, `info` |
| `data-position` | `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| `data-hide-after-n-seconds` | Auto-close delay |
| `data-icon`, `data-close-icon` | Image URLs |

### `e-dialog`

Screenshot: [dialog.png](static/images/dialog.png)

```html
<dialog id="my-dialog" is="e-dialog" data-size="normal" data-close-icon="/images/close.svg">
  <div data-padding="lg">
    <h2 is="e-h">Confirm</h2>
    <p is="e-p">Are you sure?</p>
    <button data-primary onclick="document.querySelector('#my-dialog').close()">OK</button>
  </div>
</dialog>
```

**API:** `.showModal()`, `.close()` — backdrop click and Escape close; body scroll is locked while open.

| Attribute | Description |
|-----------|-------------|
| `data-close-icon` | Close button image URL |
| `data-open-on-load` | Open when activated |
| `data-onopen`, `data-onclose` | EHTML action strings |
| `data-size` | `small`, `normal`, `large`, `full` |

### `e-confirm`

Live demo: [sidebar-tabs.html](static/html/examples/confirm.html) · Screenshot: [sidebar.png](static/images/confirm.png)

Promise-based confirmation dialog built on `e-dialog`. Place one `<e-confirm>` in the page and call `.call()` whenever you need a yes/no decision.

> Requires `e-dialog.js` to be imported (in addition to `e-confirm.js`).

```html
<script type="module">
  import '#e-ui/e-dialog.js'
  import '#e-ui/e-confirm.js'
  import '#ehtml/main'
</script>

<e-confirm id="confirm"></e-confirm>
```

```javascript
const confirmed = await document.querySelector('#confirm').call(
  'Delete this item? This cannot be undone.',
  'Delete',
  'Keep'
)

if (confirmed) {
  // user pressed Confirm
} else {
  // user pressed Cancel, Escape, or a newer call superseded this one
}
```

**API:** `.call(message, confirmText = 'Confirm', cancelText = 'Cancel')` → `Promise<boolean>`

| Argument | Default | Description |
|----------|---------|-------------|
| `message` | — | Body text shown in the dialog (`white-space: pre-wrap`) |
| `confirmText` | `'Confirm'` | Label for the danger (confirm) button |
| `cancelText` | `'Cancel'` | Label for the outlined cancel button |

**Behavior:**
- Opens a small `e-dialog` with `data-no-backdrop-close` (backdrop click does not dismiss)
- Resolves `true` when Confirm is clicked, `false` when Cancel is clicked or the dialog is otherwise closed (e.g. Escape)
- If `.call()` is invoked while a previous call is still open, the previous promise resolves to `false` and the new message is shown
- The host element uses `display: contents` so it does not affect layout

Example in `onclick` event:

```html
onclick="
  (async () => {
    const confirmed = await document.querySelector('#confirm').call(
      'Delete this item? This cannot be undone.',
      'Delete',
      'Keep'
    )
    if (!confirmed) {
      return
    }
    this.form.submit(this)
  })()
"
```

### `e-sidebar`

Live demo: [sidebar-tabs.html](static/html/examples/sidebar-tabs.html) · Screenshot: [sidebar.png](static/images/sidebar.png)

```html
<div is="overlay"></div>
<header is="e-header">Mobile header</header>

<e-sidebar
  data-side="left"
  data-mobile-header='header[is="e-header"]'
  data-mobile-menu-icon="/images/menu-icon.svg"
  data-mobile-body-overlay="div[is='overlay']"
>
  <header><!-- logo --></header>
  <nav>
    <a href="#" data-selected="true"><img src="/icon.svg"><span>Home</span></a>
  </nav>
  <footer><!-- user --></footer>
</e-sidebar>
```

**API:** `.open()`, `.close()`

### `e-tabs` / `e-tab`

Live demo: [sidebar-tabs.html](static/html/examples/sidebar-tabs.html) · Screenshot: [tabs.png](static/images/tabs.png)

```html
<e-tabs data-apply-hash-navigation>
  <e-tab data-title="Overview"><p is="e-p">Tab 1</p></e-tab>
  <e-tab data-title="Settings"><p is="e-p">Tab 2</p></e-tab>
</e-tabs>
```

**API:** `e-tabs.selectTab(index)`

### `e-kbd`

Import `e-kbd.js`. Text content defines the shortcut; `data-action` runs EHTML actions on match.

Live demo: [chips-kbd.html](static/html/examples/chips-kbd.html) · Screenshot: [kbd.png](static/images/kbd.png)

```html
<kbd is="e-kbd" data-action="document.querySelector('e-toast').open('Shortcut!')">
  Ctrl + K
</kbd>
```

| Attribute | Description |
|-----------|-------------|
| `data-action` | EHTML action string |
| `data-trigger-in-inputs` | Fire while focus is in an input |
| `data-absolute` | Badge positioning |

### `e-kbd-graph`

```html
<e-kbd-graph data-first-element="button:first-of-type">
  <button data-right="button:nth-of-type(2)" data-click-on-enter>One</button>
  <button data-left="button:first-of-type">Two</button>
</e-kbd-graph>
```

Link focus with `data-left`, `data-right`, `data-up`, `data-down`.

### `e-selectable-chip`

Live demo: [chips-kbd.html](static/html/examples/chips-kbd.html) · Screenshot: [chips.png](static/images/chips.png)

```html
<e-selectable-chip data-value="jazz" data-selected="true">Jazz</e-selectable-chip>
```

**API:** `.select()`, `.unselect()`

### `e-autoclick`

```html
<button is="e-autoclick" data-condition-to-click="true" data-primary>Submit</button>
```

Clicks itself once when EHTML activates and the condition is truthy.

### EHTML templates

Templates use `data-internal-state` for dynamic data and are replaced with interactive UI on activation.

#### `e-file-upload`

Live demo: [file-upload.html](static/html/examples/file-upload.html) · Screenshot: [file-upload.png](static/images/fileupload.png)

```html
<template
  is="e-file-upload"
  data-name="avatar"
  data-accept="image/png, image/jpeg"
  data-icon-src="/images/upload-image.svg"
  data-label-text="Profile photo"
  data-action-text="Click or drag a file here"
  data-details-text="PNG or JPG up to 2 MB"
  data-max-size-in-mb="2"
  data-show-errors-in-toast
  data-set-height
></template>
```

Use `multiple`, `data-max-number-of-files`, and `data-required` as needed. When using `data-show-errors-in-toast`, define `window.showErrorToast(message)` in your page script.

#### `e-multiselect-dropdown`

Live demo: [multiselect-dropdown.html](static/html/examples/multiselect-dropdown.html) · Screenshot: [multiselect.png](static/images/multiselect.png)

```html
<template
  is="e-multiselect-dropdown"
  data-internal-state="${{
    values: ['Jazz', 'Rock', 'Classical'],
    selectedValues: ['Jazz'],
    valueDisplayFunction: function (internalState, value) { return value }
  }}"
  data-name="genres"
  data-label="Select genres"
  data-selected-chip-close-icon="/images/close.svg"
>
  <template></template>
</template>
```

Add `data-always-on` to keep the checkbox list visible without a search-triggered dropdown.

#### `e-week-picker`

```html
<template
  is="e-week-picker"
  data-prev-icon="/images/chevron-left.svg"
  data-next-icon="/images/chevron-right.svg"
  data-on-week-change="/* EHTML actions */"
></template>
```

---

## Development

```bash
# Start static file server
npm start

# Sync EHTML source from sibling repo
npm run ehtml:update

# Sync nodes.js helpers
npm run nodes:update
```

## License

MIT
