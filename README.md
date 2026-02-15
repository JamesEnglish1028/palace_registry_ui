# Palace Library Registry Viewer

A responsive web application for browsing and searching libraries from the Palace Project registry. Built with React, TypeScript, and Tailwind CSS, optimized for mobile devices.

## Features

- 🔍 **Search Libraries** - Search by library name or description
- 🗺️ **State Filtering** - Filter libraries by US state
- 🌙 **Dark Mode Support** - Toggle between light and dark themes via URL parameter
- 📱 **Mobile Optimized** - Responsive design optimized for mobile devices
- ⚡ **Fast Loading** - Efficient data fetching with loading states
- 🎨 **Clean UI** - Modern interface with Tailwind CSS styling
- ♿ **Accessible** - Proper ARIA labels and semantic HTML
- 🔗 **Multi-App Integration** - Open libraries in Palace, MeBooks, or Thorium
- 📖 **Universal Palace Button** - Smart integration for iOS, macOS, and WebView
- 📚 **Web Reader Integration** - Direct integration with MeBooks web-based EPUB/PDF reader

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Palace Project API** - Library data source

## Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd palace_registry_ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - For dark mode: `http://localhost:3000/?theme=dark`

## Live Demo

🌐 **[View Live Demo on GitHub Pages](https://jamesenglish1028.github.io/https-github.com-JamesEnglish1028-palace_registry_ui/)**

The app is automatically deployed to GitHub Pages when changes are pushed to the main branch.

## Building for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

The built files will be in the `dist/` directory.

## Usage

### Basic Usage
- Browse all available Palace Project libraries
- Use the search box to find libraries by name or description
- Select a state from the dropdown to filter results
- Click **"Palace"** to open library in Palace app (iOS/macOS/WebView)
- Click **"MeBooks"** to read books in web-based reader with full OPDS support
- Click **"Thorium"** to open library in Thorium Desktop

### Button Functionality
- **Palace Button**: Universal integration
  - **Native Mode** (`?native=true`): Communicates with parent WebView
  - **Web Mode**: Uses `palace://` URL scheme to launch Palace app
- **MeBooks Button**: Web-based reading platform
  - **Direct Integration**: Opens catalog in MeBooks web reader
  - **Full OPDS Support**: Browse, borrow, and read EPUB/PDF books
  - **Offline Reading**: Books stored locally in browser storage
- **Thorium Button**: Converts HTTP to `opds://` for Thorium Desktop

### Dark Mode
Add `?theme=dark` to the URL to enable dark mode:
```
http://localhost:3000/?theme=dark
```

### Native App Integration
Add `?native=true` to enable native app communication mode:
```
http://localhost:3000/?native=true
```

**Combine with theming:**
```
http://localhost:3000/?native=true&theme=dark
http://localhost:3000/?native=true&theme=light
```

When in native mode, the **"Palace"** button will communicate with the native app using multiple methods:
- **PostMessage**: Messages sent to parent frame (WebView)
- **iOS WebKit Bridge**: `webkit.messageHandlers.palaceApp`
- **Android Interface**: `window.Android.addLibrary()`

When in web mode, the **"Palace"** button uses:
- **Custom URL Scheme**: `palace://addLibrary?url=...&name=...` (iOS/macOS)

The **"Thorium"** button uses:
- **OPDS URL Scheme**: Converts `https://` to `opds://` for Thorium Desktop

### Mobile Usage
The app is optimized for mobile devices with:
- Touch-friendly interface
- Responsive layout
- Properly sized touch targets
- Mobile-optimized typography

## Project Structure

```
├── components/
│   ├── LibraryCard.tsx    # Individual library display component
│   └── SearchInput.tsx    # Search input component
├── services/
│   └── libraryService.ts  # API service for fetching library data
├── public/
│   └── palace-logo.png    # Palace Project logo
├── App.tsx               # Main application component
├── types.ts              # TypeScript type definitions
├── index.tsx             # Application entry point
└── index.html           # HTML template
```

## API Integration

The app fetches library data from the Palace Project registry API:
- **Endpoint:** `https://registry.palaceproject.io/libraries`
- **CORS Proxy:** Uses `corsproxy.io` to handle CORS restrictions
- **Data Format:** OPDS catalog format with library metadata

## Native App Integration

### For Native App Developers

The web app can communicate with native mobile apps through several methods:

#### 1. URL Parameters
- Add `?native=true` to enable native app mode
- **Theme Integration**: Both parameters work together
  - Light mode: `?native=true` or `?native=true&theme=light`
  - Dark mode: `?native=true&theme=dark`
- **Automatic Theme Matching**: Native apps can detect system theme and set accordingly

#### 2. Communication Methods

**Palace URL Scheme (iOS/macOS):**
```javascript
palace://addLibrary?url=<catalogUrl>&name=<libraryName>
```

**MeBooks Web Reader Integration:**
```javascript
https://your-mebooks-app.com/?import=<catalogUrl>&name=<libraryName>
```

**Thorium OPDS Scheme:**
```javascript
opds://example.com/catalog  // Converted from https://example.com/catalog
```

**iOS WebKit Message Handler:**
```javascript
window.webkit.messageHandlers.palaceApp.postMessage({
  action: 'addLibrary',
  url: catalogUrl,
  name: libraryName
});
```

**Android WebView Interface:**
```javascript
window.Android.addLibrary(catalogUrl, libraryName);
```

**PostMessage (WebView):**
```javascript
window.parent.postMessage({
  type: 'ADD_LIBRARY',
  url: catalogUrl,
  name: libraryName,
  timestamp: Date.now()
}, '*');
```

#### 3. App Integration Overview

The web app now supports **three reading platforms**:

**Palace Integration:**
- **iOS/macOS**: Uses `palace://` URL scheme
- **WebView**: Uses JavaScript bridges for native app communication
- **Universal**: One button works across all Palace app platforms

**MeBooks Web Reader Integration:**
- **Web-Based**: Full-featured EPUB/PDF reader in browser
- **OPDS 1 & 2**: Complete catalog browsing and book management
- **Offline-First**: Books stored locally with IndexedDB
- **Authentication**: Supports Basic Auth, OAuth, SAML for library access
- **Cross-Platform**: Works on any modern web browser

**Thorium Desktop Integration:**
- **Desktop Only**: Uses `opds://` URL scheme
- **Cross-Platform**: Works on Windows, macOS, Linux
- **Direct Launch**: Opens library catalog directly in Thorium

#### 4. Web Reader Integration (MeBooks)

**Using the MeBooks Integration Library:**

The registry includes a lightweight JavaScript library for easy MeBooks integration:

**Step 1: Include the script**
```html
```

**Step 2: Initialize**
```javascript
// Or use default MeBooks URL:
```

**Step 3: Use**
```javascript
// Import catalog with one line
await mebooks.importCatalog(catalogUrl, catalogName);

// With options
await mebooks.importCatalog(catalogUrl, catalogName, {
  theme: 'dark',           // Optional: set theme
  autoNavigate: true,      // Optional: auto-navigate to catalog
  newWindow: true          // Optional: open in new window (default: true)
});

// Or generate a link
const link = mebooks.getCatalogLink(catalogUrl, catalogName);
```

**Alternative: Manual URL Parameter Handling**

If you prefer not to use the integration library:

**URL Parameters:**
- `import`: OPDS catalog URL to automatically add to user's library
- `name`: Display name for the catalog

**Example Implementation:**
```javascript
// In your web reader app (MeBooks, etc.)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const importUrl = params.get('import');
  const catalogName = params.get('name');
  
  if (importUrl && catalogName) {
    // Auto-add OPDS catalog to user's library
    addOPDSCatalog(importUrl, catalogName);
    
    // Optional: Navigate to the new catalog
    navigateToCatalog(importUrl);
  }
}, []);

const addOPDSCatalog = async (url: string, name: string) => {
  // Add to user's catalog list
  const catalog = {
    id: generateId(),
    name,
    url,
    type: 'opds',
    dateAdded: new Date().toISOString()
  };
  
  // Save to localStorage or IndexedDB
  await saveCatalog(catalog);
};
```

**Benefits:**
- **Seamless Discovery**: Users can discover and start reading in one click
- **No Manual Setup**: Catalog automatically appears in reader app
- **Cross-Platform**: Works with any web-based OPDS reader
- **Bookmarkable**: Users can bookmark specific catalogs
- **Type-Safe**: Integration library provides full TypeScript support

#### 5. Native App Setup

**iOS (Swift):**
```swift
// Load WebView with theme detection
let baseUrl = "https://jamesenglish1028.github.io/https-github.com-JamesEnglish1028-palace_registry_ui/"
let isDarkMode = traitCollection.userInterfaceStyle == .dark
let theme = isDarkMode ? "dark" : "light"
let url = "\(baseUrl)?native=true&theme=\(theme)"
webView.load(URLRequest(url: URL(string: url)!))

// Register URL scheme in Info.plist
// Handle in AppDelegate or SceneDelegate
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if url.scheme == "palace" && url.host == "addLibrary" {
        // Parse URL parameters and add library
        return true
    }
    return false
}

// WebView message handler
webView.configuration.userContentController.add(self, name: "palaceApp")
```

**Android (Kotlin):**
```kotlin
// Load WebView with theme detection
val baseUrl = "https://jamesenglish1028.github.io/https-github.com-JamesEnglish1028-palace_registry_ui/"
val isDarkMode = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
val theme = if (isDarkMode) "dark" else "light"
val url = "$baseUrl?native=true&theme=$theme"
webView.loadUrl(url)

// WebView JavaScript interface
webView.addJavascriptInterface(WebAppInterface(), "Android")

class WebAppInterface {
    @JavascriptInterface
    fun addLibrary(url: String, name: String) {
        // Handle library addition
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Palace Project ecosystem. Please refer to the Palace Project licensing terms.

## Support

For issues related to:
- **This app:** Create an issue in this repository
- **Palace Project:** Visit [The Palace Project](https://thepalaceproject.org)
- **Library access:** Contact your local library directly

## Render Deployment

Render deployment files are included:
- `render.yaml` (Blueprint config)
- `DEPLOY_RENDER.md` (step-by-step guide)

For quick setup, follow `/Users/jamesenglish/Desktop/Projects/Registry UI/https-github.com-JamesEnglish1028-palace_registry_ui/DEPLOY_RENDER.md`.
