# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tab Session Manager is a Chrome/Edge browser extension (Manifest V3) that allows users to save and restore browser tabs, tab groups, and entire windows with their original state (position, size, groups, pinned status).

The extension is written in Italian and all UI text, comments, and user-facing messages are in Italian.

## Architecture

### Core Components

**popup.html** - Main UI with two sections:
- Save section: Input field + 5 action buttons (save current tab, all tabs, window, group, or select specific tabs)
- Sessions list: Displays saved sessions with restore/update/delete/rename/reorder controls
- Modal overlay: Tab selector interface for choosing specific tabs to save

**popup.js** - Single file containing all logic (~1000 lines):
- Session Management: `saveSession()`, `restoreSession()`, `restoreWindow()`, `updateSession()`, `deleteSession()`
- Save Operations: `saveCurrentTab()`, `saveAllTabs()`, `saveWindow()`, `saveTabGroup()`
- Interactive Selection: `openTabSelector()`, `saveSelectedTabs()` for manual tab selection
- Session Organization: `renameSession()`, `moveSession()` for reordering
- UI Utilities: `showToast()` for notifications, `formatDate()` for relative timestamps, `loadSessions()` for rendering
- Modal Management: Open/close/select-all logic for tab selector

**popup.css** - Modern glassmorphism design with purple gradient theme, toast notifications, and modal styling

**manifest.json** - Manifest V3 configuration requiring `tabs`, `tabGroups`, and `storage` permissions

### Data Model

Sessions stored in `chrome.storage.local` as array of session objects:

```javascript
{
  id: string,              // Timestamp-based unique ID
  name: string,            // User-provided or auto-generated name
  timestamp: number,       // Creation/update time
  isWindow: boolean,       // Flag for window sessions
  windowState: {           // Only for window sessions
    state: string,         // "normal", "maximized", etc.
    width: number,
    height: number,
    top: number,
    left: number,
    focused: boolean,
    incognito: boolean
  },
  tabs: [{
    url: string,
    title: string,
    pinned: boolean,
    groupId: number,       // -1 if not in a group
    index: number,         // Original position
    active: boolean        // Only for window sessions
  }],
  groups: {                // Optional, keyed by groupId
    [groupId]: {
      title: string,
      color: string,
      collapsed: boolean
    }
  }
}
```

### Key Behaviors

**Save Operations:**
- All save operations close the tabs/windows after saving (except Update)
- Duplicate name check: Only custom names (without " - " timestamp pattern) trigger replacement prompts
- Sessions are prepended to the array (newest first)
- Tab groups are preserved with all metadata (title, color, collapsed state)

**Restore Operations:**
- Regular sessions restore tabs in current window
- Window sessions (`isWindow: true`) create a new window with original dimensions/position
- Invalid URLs (chrome://, edge://, about:, chrome-extension://) are filtered out with warnings
- Tabs restored in original index order, groups recreated with original properties
- Originally active tab is reactivated after restoration

**Update Operation:**
- Unique feature: Updates session without closing current tabs/windows
- Multi-window support: If multiple windows exist, prompts user to select which window to use
- Preserves session ID and name, updates timestamp and tab state

**Session Organization:**
- Rename: Click pencil icon to change session name
- Reorder: Up/down arrows to change position in list
- Visual indicators: 🪟 emoji prefix for window sessions

## Development Commands

This is a browser extension with no build process. To develop:

1. **Load Extension:**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

2. **Debug Extension:**
   - Right-click the extension popup → "Inspect" to open DevTools
   - Console logs are extensively used (see DEBUG_GUIDE.md)
   - All restore operations log detailed debug info with "=== DEBUG ===" headers

3. **Reload After Changes:**
   - Go to `chrome://extensions/` or `edge://extensions/`
   - Click the refresh icon on the extension card
   - Or use Ctrl+R (Cmd+R on Mac) on the extensions page

## Important Implementation Details

**URL Filtering:**
- Browser internal URLs must be filtered: `chrome://`, `edge://`, `about:`, `chrome-extension://`
- Filter logic in popup.js:298-312 and popup.js:406-420

**Window State Normalization:**
- Cannot set `state` property with custom width/height
- If saved dimensions invalid, fallback to 1200x800 (popup.js:441-449)
- Position (top/left) only set if non-negative

**Group Recreation:**
- Groups recreated by calling `chrome.tabs.group()` then `chrome.tabGroups.update()`
- Original groupId mapping tracked via `originalGroupId` property on created tabs
- Group recreation can fail silently (non-critical, wrapped in try-catch)

**Tab Selection Modal:**
- All tabs initially checked
- Click anywhere on tab item to toggle selection (not just checkbox)
- Select-all checkbox shows indeterminate state when partially selected
- Modal closes on background click or cancel button

**Error Handling:**
- All major operations wrapped in try-catch
- Errors logged to console with context
- Toast notifications show success/failure to user
- Operations continue even if individual tabs/groups fail

## Code Style Notes

- All user-facing text in Italian
- Console logs in English with descriptive prefixes
- Async/await throughout (no Promise chains)
- Event listeners added dynamically after rendering sessions
- Data attributes used for passing IDs/state to event handlers
- No external dependencies or build tools
