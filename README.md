# GitHub Draft Issues Extension

A Chrome extension that adds draft issue functionality to GitHub repositories. Create, manage, and store draft issues locally without posting them to the repository.

## Features

- **Draft Issue Button**: Adds a "Draft Issue" button next to the "New Issue" button on GitHub repository pages
- **Local Storage**: Stores all drafts locally in your browser
- **Hash Navigation**: Access drafts via URL hash segments:
  - `#drafts` - View all drafts for the current repository
  - `#drafts/123` - View a specific draft by ID
- **Full CRUD Operations**: Create, read, update, and delete draft issues
- **Repository-Specific**: Drafts are organized by repository
- **Import/Export**: Backup and restore your drafts

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and active

### Chrome Web Store

*Coming soon*

## Usage

### Creating a Draft Issue

1. Navigate to any GitHub repository
2. Go to the Issues tab
3. Click the "Draft Issue" button next to "New Issue"
4. Fill in the title and description
5. Click "Save Draft"

### Viewing Drafts

#### All Drafts
- On any repository page, add `#drafts` to the URL
- Or use the extension popup to view all drafts

#### Specific Draft
- Use the URL format: `https://github.com/owner/repo/issues#drafts/draft-id`
- Click on any draft from the drafts list

### Managing Drafts

- **Edit**: Click the "Edit" button on any draft
- **Delete**: Click the "Delete" button and confirm
- **Export**: Use the extension popup to export all drafts as JSON
- **Import**: Use the extension popup to import drafts from a JSON file

## Technical Details

### Storage

Drafts are stored locally using Chrome's storage API. The data structure is:

```json
{
  "github_draft_issues": {
    "owner/repo": {
      "draft-id-1": {
        "id": "draft-id-1",
        "title": "Issue Title",
        "body": "Issue Description",
        "repository": "owner/repo",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    }
  }
}
```

### Files

- `manifest.json` - Extension configuration
- `content-script.js` - Main functionality for GitHub page interaction
- `background.js` - Service worker for extension management
- `popup.html/js` - Extension popup interface
- `styles.css` - CSS styles for the extension UI

### Permissions

The extension requires the following permissions:
- `storage` - To save drafts locally
- `activeTab` - To interact with the current GitHub page
- `https://github.com/*` - To run on GitHub pages

## Development

### Testing

1. Load the extension in Chrome
2. Navigate to any GitHub repository
3. Test creating, editing, and deleting drafts
4. Test hash navigation
5. Test import/export functionality

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Privacy

This extension stores all data locally in your browser. No data is sent to external servers or shared with third parties. Drafts are only accessible to you on the device where the extension is installed.

## License

Licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## Support

For issues, feature requests, or questions, please open an issue on the [GitHub repository](https://github.com/jzheaux/draft).
