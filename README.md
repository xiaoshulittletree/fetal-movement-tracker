# Fetal Movement Tracker

A Progressive Web App (PWA) for tracking fetal movements with adaptive timing. Perfect for expecting parents who want to monitor their baby's movements without needing developer accounts.

## Features

- **Adaptive Timing**: Starts with 20 minutes, extends to 40 minutes if less than 3 movements, then to 60 minutes if still insufficient
- **Cross-Platform**: Works on iOS Safari, WeChat browser, and Feishu browser
- **PWA Support**: Can be installed on mobile home screens
- **Data Export**: Export session data to CSV or JSON format
- **Offline Support**: Works without internet connection
- **Local Storage**: All data stored locally on your device

## How It Works

1. **Start Session**: Begin a 20-minute tracking session
2. **Record Movements**: Tap the "Record Movement" button each time you feel the baby move
3. **Adaptive Extension**: 
   - If less than 3 movements in 20 minutes → extends to 40 minutes
   - If still less than 3 movements in 40 minutes → extends to 60 minutes
4. **Export Data**: Download your tracking history as CSV or JSON files

## Deployment to GitHub Pages

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `fetal-movement-tracker`

### Step 2: Upload Files
1. Clone your repository locally
2. Copy all the files from this project to your repository folder
3. Commit and push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

Your app will be available at: `https://yourusername.github.io/repository-name`

## Usage Instructions

### On iOS Safari:
1. Open the app in Safari
2. Tap the share button (square with arrow)
3. Select "Add to Home Screen"
4. The app will now appear on your home screen like a native app

### On WeChat:
1. Open WeChat
2. Go to "Discover" → "Mini Programs"
3. Search for your app URL or scan a QR code
4. The app will work within WeChat's browser

### On Feishu:
1. Open Feishu
2. Navigate to the app URL
3. The app will work within Feishu's browser

## File Structure

```
fetal-movement-tracker/
├── index.html          # Main HTML file
├── app.js             # JavaScript logic
├── manifest.json      # PWA manifest
├── sw.js             # Service worker
└── README.md         # This file
```

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **Storage**: LocalStorage for session data
- **PWA Features**: Service worker, manifest, offline support
- **Responsive Design**: Works on all mobile devices
- **Export Formats**: CSV and JSON

## Privacy

All data is stored locally on your device. No data is sent to any servers or third parties.

## Browser Compatibility

- ✅ iOS Safari 11+
- ✅ Chrome 67+
- ✅ Firefox 67+
- ✅ WeChat Browser
- ✅ Feishu Browser
- ✅ Samsung Internet

## Troubleshooting

### App won't install on iOS:
- Make sure you're using Safari (not Chrome or other browsers)
- Try refreshing the page before adding to home screen

### Data not saving:
- Check that your browser supports LocalStorage
- Try clearing browser cache and refreshing

### Export not working:
- Make sure you have some session data to export
- Try using a different browser

## Support

This is a simple, self-contained app designed for personal use. All data is stored locally on your device for privacy. 
