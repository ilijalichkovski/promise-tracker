# Promise Tracker Chrome Extension

A Chrome extension that helps you track promises made in text conversations and web content. Never forget a commitment again!

## Features

- Track promises made in any text on the web and add manual promises
- Categorize promises by type (personal, work, social, etc.)
- Set due dates and reminders
- Mark promises as completed or broken

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/ilijalichkovski/promise-tracker.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the `promise-tracker` directory

5. The Promise Tracker extension should now appear in your Chrome toolbar

We will be uploading the extension to the Chrome Web Store as well for streamlined installation.

## Project Structure

```
promise-tracker/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── content.js         # Content script for webpage interaction
├── background.js      # Background service worker
└── images/            # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Usage

1. Select any text on a webpage that contains a promise
2. Right-click and choose "Track Promise" from the context menu
3. Fill in the promise details in the popup form
4. View and manage your promises through the extension popup

## Development

The extension is built using vanilla JavaScript and follows Chrome Extension Manifest V3 specifications. To modify the extension:

1. Make your changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test your changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.