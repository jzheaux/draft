# Icon Files

The extension requires icon files in PNG format for different sizes:

- `icon16.png` - 16x16 pixels for the extension toolbar
- `icon48.png` - 48x48 pixels for the extension management page
- `icon128.png` - 128x128 pixels for the Chrome Web Store

## Creating Icons

You can create these icons from the SVG template below:

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#0969da" stroke="#ffffff" stroke-width="4"/>
  
  <!-- Document/Issue icon -->
  <rect x="36" y="32" width="56" height="64" rx="4" fill="#ffffff"/>
  <rect x="40" y="40" width="48" height="2" fill="#0969da"/>
  <rect x="40" y="48" width="48" height="2" fill="#0969da"/>
  <rect x="40" y="56" width="32" height="2" fill="#0969da"/>
  
  <!-- Draft indicator (pencil) -->
  <path d="M72 70 L82 60 L86 64 L76 74 Z" fill="#28a745"/>
  <circle cx="84" cy="62" r="2" fill="#28a745"/>
</svg>
```

To create the PNG files:
1. Save the SVG code to a file named `icon.svg`
2. Use an online SVG to PNG converter or image editing software
3. Create versions at 16x16, 48x48, and 128x128 pixels
4. Save them as `icon16.png`, `icon48.png`, and `icon128.png` in this directory

For now, you can use any simple icon files or the extension will work without icons (Chrome will use a default icon).