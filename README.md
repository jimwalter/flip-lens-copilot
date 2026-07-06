# Flip Lens - Chrome Extension

Quick screenshot-to-Google-Lens search for estate sale items and furniture flipping.

## Features
- ✨ One-click screenshot selection
- 🔍 Instant Google Lens image search
- ⚡ Zero friction workflow
- 🎯 Drag-to-select interface

## Installation

1. Clone this repo
2. Download `html2canvas` library: `npm install html2canvas` (or include from CDN)
3. Open `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select this folder

## Usage

1. Visit any estate sale website
2. Click the Flip Lens icon
3. Click and drag over the item you want to search
4. Google Lens opens in a new tab with results

## Project Structure

```
flip-lens-copilot/
├── manifest.json           # Extension configuration
├── background.js           # Service worker
├── content.js              # Selection & screenshot logic
├── lens-search.html        # Results page
├── lens-search.js          # Results page logic
├── PRODUCT_SPEC.md         # Full product spec
└── images/                 # Icons (16x16, 48x48, 128x128)
```

## Development Notes

- Manifest V3 compatible
- No external APIs required
- Client-side only (no backend)
- Uses `html2canvas` for region capture

## Next Steps

- [ ] Add placeholder icons
- [ ] Test on various estate sale sites
- [ ] Optimize image compression
- [ ] Add keyboard shortcut support
- [ ] Implement error handling UI
