# 📚 Gandiwa Shortcuts - Bookmark Manager Extension

Ekstensi Chrome untuk mengelola bookmark dengan tampilan modern dan fitur produktivitas.

## ✨ Fitur Utama

### 1. Quick Links (Shortcut Manager)

- Kategori bookmark custom dengan drag & drop
- Tambah, edit, hapus shortcut
- Auto-fetch favicon dari website
- Custom icon URL support
- Context menu (klik kanan)

### 2. Chrome Bookmarks Integration

- Sidebar menampilkan folder Chrome bookmarks
- Folder view dengan grid layout
- Navigasi folder dengan breadcrumb

### 3. Focus Timer (Pomodoro)

- Timer fokus dengan custom duration
- Notifikasi browser saat selesai
- Sound alert (`focus-alert.wav`)
- Marquee title di tab
- Modal notification dengan blur overlay

### 4. Private Notes

- Catatan pribadi di sidebar kanan
- Auto-save ke localStorage
- Monospace font (JetBrains Mono)

### 5. UI/UX Premium

- Dark/Light mode toggle
- Glassmorphism design
- Smooth animations
- Masonry layout (2 kolom)
- Responsive sidebar

---

## 📁 Struktur Folder

```
Bookmark Manager/
├── manifest.json          # Chrome extension manifest
├── newtab.html           # Halaman utama (new tab)
├── logo.png              # Logo extension
├── README.md             # Dokumentasi GitHub
│
└── app/
    ├── js/
    │   ├── app.js        # Logic utama (UI, event handlers)
    │   ├── renderer.js   # Render Chrome bookmarks
    │   ├── state.js      # State management & CRUD
    │   └── storage.js    # Chrome storage abstraction
    │
    ├── css/
    │   ├── variables.css   # CSS variables & theme
    │   ├── layout.css      # Grid & layout
    │   ├── components.css  # UI components
    │   ├── sidebar.css     # Sidebar styling
    │   ├── animations.css  # Keyframes & transitions
    │   └── styles.css      # Legacy styles
    │
    └── assets/
        ├── focus-alert.wav  # Sound notification
        └── favicon.webp     # Default favicon
```

---

## 🔧 File JavaScript

### `app.js` (~47KB)

File utama yang menghandle:

- Tema (Dark/Light mode)
- DateTime display
- Focus Timer logic
- Sidebar toggle
- Private Notes
- Layout toggle (1/2 kolom)
- Bookmark rendering
- Drag & Drop
- Context menu
- Modal handlers (Add/Edit/Delete)
- Focus complete notification

### `state.js` (~10KB)

State management untuk Quick Links:

- `init()` - Load data & migrate
- `addCategory()` - Tambah kategori
- `addItem()` - Tambah shortcut
- `editItem()` - Edit shortcut
- `deleteItem()` - Hapus shortcut
- `moveItem()` - Drag & drop move

### `storage.js` (~2KB)

Abstraksi Chrome storage:

- `load()` - Load dari chrome.storage.local
- `save()` - Save ke chrome.storage.local

### `renderer.js` (~6KB)

Render Chrome bookmarks native:

- `render()` - Render bookmark tree
- Folder navigation
- Breadcrumb handling

---

## 🎨 File CSS

| File             | Ukuran | Fungsi                      |
| ---------------- | ------ | --------------------------- |
| `variables.css`  | 2KB    | CSS variables, theme colors |
| `layout.css`     | 2.5KB  | Grid, flexbox, masonry      |
| `components.css` | 24KB   | Buttons, cards, modals      |
| `sidebar.css`    | 8KB    | Left & right sidebar        |
| `animations.css` | 2KB    | Keyframes, transitions      |

---

## 💾 Data Storage

Data disimpan di `chrome.storage.local` dengan struktur:

```json
{
  "categories": [
    {
      "id": "google",
      "name": "Google",
      "readonly": false,
      "items": [
        {
          "id": "g-1",
          "title": "Gmail",
          "url": "https://gmail.com",
          "icon": "default"
        }
      ]
    }
  ]
}
```

**Icon field:**

- `"default"` → Auto-fetch favicon dari Google
- `"https://..."` → Custom icon URL

---

## ⚙️ Permissions (manifest.json)

```json
{
  "permissions": ["storage", "bookmarks", "notifications"],
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  }
}
```

---

## 🚀 Instalasi Development

1. Buka `chrome://extensions/`
2. Aktifkan "Developer mode"
3. Klik "Load unpacked"
4. Pilih folder `Bookmark Manager/`
5. Buka tab baru untuk test

---

## 📝 Import/Export Data

- **Export**: Klik menu → Export → Download JSON
- **Import**: Klik menu → Import → Pilih file JSON

---

## 🎯 Keyboard Shortcuts

| Shortcut   | Aksi                            |
| ---------- | ------------------------------- |
| Klik kanan | Context menu (Edit/Copy/Delete) |
| Drag item  | Pindah posisi/kategori          |

---

_Developed by Gandiwa Team © 2026_
