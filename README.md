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
- **🔘 Companion Nav Button (`mods-nav-btn`)**: Includes an optional standalone sidebar button mod that sits cleanly in your layout without touching or overriding the shipped `workspace-chrome`!

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
2. Copy `mods/mod-manager/` (and optionally `mods/mods-nav-btn/`) into your `~/.config/herdr-app/mods/`.
3. Merge `keys.json` into your `~/.config/herdr-app/keys.json`.
4. Verify the installation with `herdr-app check ~/.config/herdr-app/mods/mod-manager`.

---

### Method 2: Manual Installation

#### 1. Copy the Mod Folders
Clone or download this repository, then copy the folders into your Herdr configuration directory:

- **Windows**: Copy `mods/*` to `%USERPROFILE%\.config\herdr-app\mods\`
- **macOS / Linux**: Copy `mods/*` to `~/.config/herdr-app/mods/`

#### 2. Merge Shortcuts (`keys.json`)
Add the shortcut to your `~/.config/herdr-app/keys.json` under `"global"`:

```json
{
  "global": {
    "alt-m": "mod.open:mod-manager"
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
Press **`Alt+M`** anywhere in Herdr to toggle the window.

### 2. From Command Line or Terminal
```bash
herdr-app do mod.open --name mod-manager
```

### 3. Add Standalone Button to Sidebar (Recommended)
Add a dedicated 34px block in your layout JSON (e.g. `layouts/my-layout.json`) right above the footer block. You get a clean sidebar entry without modifying the shipped `workspace-chrome`:

```json
{
  "id": "sidebar",
  "type": "column",
  "children": [
    { "id": "brand", "content": { "mod": "workspace-chrome" } },
    { "id": "sidebar-lists", ... },
    {
      "id": "sidebar-mods-btn",
      "type": "block",
      "content": { "mod": "mods-nav-btn" },
      "size": { "px": 34 }
    },
    { "id": "sidebar-footer", "content": { "mod": "workspace-chrome", "props": { "footer": true } } }
  ]
}
```

---

## 🛠️ Repository Structure

Mirrors the Herdr home directory layout:

```
herdr-mod-manager/
├── RECIPE.md            # Herdr specification recipe
├── preview.png          # Visual preview screenshot
├── keys.json            # Default keyboard shortcuts (Alt+M)
├── README.md            # Documentation
└── mods/
    ├── mod-manager/     # Standalone Mod Manager window
    │   ├── main.js
    │   ├── mod.json
    │   ├── layers.svg
    │   └── refresh.svg
    └── mods-nav-btn/    # Optional clean sidebar button mod
        ├── main.js
        ├── mod.json
        └── layers.svg
```

---

## 📄 License
MIT License. Feel free to use, customize, and share!
