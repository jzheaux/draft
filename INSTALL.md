# Installation Guide

## Quick Start

1. **Download the Extension**
   - Clone this repository or download as ZIP
   - Extract to a folder on your computer

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder

3. **Verify Installation**
   - You should see "GitHub Draft Issues" in your extensions list
   - Navigate to any GitHub repository
   - Go to the Issues tab
   - Look for the "Draft Issue" button next to "New Issue"

## Usage Examples

### Creating Your First Draft

1. Go to https://github.com/octocat/Hello-World/issues
2. Click "Draft Issue" 
3. Enter a title like "Test Draft Issue"
4. Add some description text
5. Click "Save Draft"

### Viewing Drafts

- Navigate to: https://github.com/octocat/Hello-World/issues#drafts
- You'll see all your drafts for this repository

### Viewing a Specific Draft

- Click on any draft title to go to its detail view
- Or manually go to: https://github.com/octocat/Hello-World/issues#drafts/[draft-id]

## Troubleshooting

### "Draft Issue" Button Not Showing

- Make sure you're on a GitHub repository's issues page
- Refresh the page
- Check that the extension is enabled in `chrome://extensions/`

### Drafts Not Saving

- Check that Chrome has storage permissions for the extension
- Try opening Chrome DevTools and look for console errors

### Extension Not Loading

- Make sure all files are present in the extension folder
- Check `chrome://extensions/` for any error messages
- Try reloading the extension

## Features to Test

- [ ] Create a new draft issue
- [ ] Edit an existing draft
- [ ] Delete a draft
- [ ] View all drafts (#drafts)
- [ ] View specific draft (#drafts/123)
- [ ] Export drafts (from popup)
- [ ] Import drafts (from popup)
- [ ] Test on multiple repositories

## Browser Support

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)

## Security Notes

- All data is stored locally in your browser
- No data is sent to external servers
- Drafts are private to your browser session