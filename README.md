# Herdr Mod Manager

A clean, standalone visual mod and overlay manager for the **[Herdr app](https://github.com/herdr/herdr-app)**.

![Herdr Mod Manager Preview](./preview.png)

## 🌟 Features

- **🪟 Standalone Window Overlay**: Opens cleanly as a draggable, floating window without dimming or disrupting your workspace.
- **⚡ Interactive Switches**: Elegant iOS/macOS-styled toggle switches to quickly enable or deactivate mods.
- **🔄 Instant Layout Hot-Swapping**: Automatically detects slots (like `files`, `changes`, `spaces`, `chrome`, `status`) and swaps custom mods in and out of your active layout without manual JSON editing.
- **📦 Package Isolation (`mods/` ⇄ `mods-disabled/`)**: Safely disable custom mods by isolating them into `mods-disabled/` and restore them anytime with a single click.
- **📑 Filter Tabs & Instant Search**: Filter by **All**, **In Active Layout**, **Custom**, **Disabled**, and **Shipped** mods, with instant full-text search across titles, descriptions, and file paths.
- **📋 Shipped Mod Duplication**: Shipped mods in Herdr are read-only; duplicate any mod with a custom name to begin editing your own version.
- **🔄 Rotating Refresh**: Dedicated icon button to instantly re-scan the mods directories.

---

## 🚀 Installation (Herdr Standard)

This mod strictly follows the **[Herdr App Mod Sharing Specification](https://github.com/herdr/herdr-app#layouts-and-mods-other-people-made)**.

### Method 1: Ask Your Agent (Official & Recommended)
Tell any AI coding agent working in Herdr:

> *"Add mod `s16777216/herdr-mod-manager`"*
>
> or
>
> *"Install mod from `https://github.com/s16777216/herdr-mod-manager`"*

Your agent will follow Herdr's official protocol:
1. Read `RECIPE.md` to inspect safety, permissions, and dependencies.
2. Copy `mods/mod-manager/` into your `~/.config/herdr-app/mods/mod-manager/`.
3. Merge `keys.json` into your `~/.config/herdr-app/keys.json`.
4. Verify the installation with `herdr-app check ~/.config/herdr-app/mods/mod-manager`.

---

### Method 2: Manual Installation

#### 1. Copy the Mod Folder
Clone or download this repository, then copy `mods/mod-manager` to your Herdr configuration directory:

- **Windows**: `%USERPROFILE%\.config\herdr-app\mods\mod-manager`
- **macOS / Linux**: `~/.config/herdr-app/mods/mod-manager`

#### 2. Merge Shortcuts (`keys.json`)
Add the following shortcut to your `~/.config/herdr-app/keys.json` under `"global"`:

```json
{
  "global": {
    "ctrl-shift-m": "mod.open:mod-manager"
  }
}
```

#### 3. Verify
Run the official Herdr verification command:
```bash
herdr-app check ~/.config/herdr-app/mods/mod-manager
```

---

## 🎮 How to Open

### 1. Keyboard Shortcut
Press **`Ctrl+Shift+M`** anywhere in Herdr.

### 2. From Command Line or Terminal
```bash
herdr-app do mod.open --name mod-manager
```

### 3. Add to Sidebar (e.g. in `mods/my-workspace-chrome/main.js`)
```javascript
import { run } from "herdr";

// Add a button calling:
run("mod.open", { name: "mod-manager" });
```

---

## 🛠️ Repository Structure

Mirrors the Herdr home directory layout:

```
herdr-mod-manager/
├── RECIPE.md            # Herdr specification recipe
├── preview.png          # Visual preview screenshot
├── keys.json            # Default keyboard shortcuts
├── README.md            # Documentation
└── mods/
    └── mod-manager/
        ├── main.js      # Mod Manager standalone View
        ├── mod.json     # Overlay window definition
        ├── layers.svg   # Window icon
        └── refresh.svg  # Refresh icon
```

---

## 📄 License
MIT License. Feel free to use, customize, and share!
