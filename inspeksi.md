# Hasil Inspeksi & Rencana Mitigasi Gandiwa Shortcuts (Multi-Profile)

Dokumen ini berisi hasil analisis dan rencana mitigasi untuk mempermudah penggunaan ekstensi di 10 akun/profil Chrome yang berbeda tanpa menggunakan penyimpanan cloud.

---

## 1. Analisis Masalah

### Masalah 1: Instalasi Manual di 10 Akun Chrome
- **Kondisi Saat Ini**: Chrome memisahkan data ekstensi dan instalasi per profil pengguna. Anda harus masuk ke setiap profil, membuka `chrome://extensions/`, mengaktifkan Developer Mode, dan mengklik "Load unpacked".
- **Fakta Teknis**: Proses awal "Load unpacked" memang harus dilakukan satu kali per profil karena kebijakan keamanan Chrome (tidak ada mekanisme resmi untuk menginstal ekstensi unpack secara massal di banyak profil sekaligus tanpa kebijakan Enterprise).
- **Mitigasi**: Sekali ekstensi diinstal dengan mengarahkan ke folder fisik yang sama (`d:\04_DEVELOPMENT\Gandiwa Extension`), setiap perubahan kode sumber (HTML, CSS, JS) akan langsung diterapkan di seluruh profil tanpa perlu melakukan instalasi ulang atau reload manual di setiap profil.

### Masalah 2: Sinkronisasi Bookmark (Tambah/Hapus di 10 Akun)
- **Kondisi Saat Ini**: Bookmark disimpan di `chrome.storage.local` milik masing-masing profil secara terisolasi. Jika Anda mengedit bookmark di Profil A, Profil B tidak akan mengetahuinya.
- **Fakta Teknis**: Chrome sandbox melarang ekstensi untuk menulis data langsung ke file lokal di disk komputer. Namun, ekstensi **bisa membaca** file yang dibundel di dalam foldernya sendiri menggunakan `fetch(chrome.runtime.getURL('bookmarks-data.json'))`.
- **Mitigasi**:
  - Mengubah alur muat data (`Storage.load`): Ekstensi akan selalu membaca file `bookmarks-data.json` lokal yang ada di folder proyek sebagai basis data utama.
  - Untuk memudahkan penyuntingan, jika Anda melakukan perubahan dari UI ekstensi, kita akan menyediakan fitur **"Copy JSON"** atau **"Export JSON"** instan. Anda cukup menempelkannya ke file `bookmarks-data.json` yang sedang terbuka di editor kode Anda. Begitu file disimpan, semua 10 akun Chrome akan langsung menampilkan perubahan tersebut pada tab baru berikutnya.

### Masalah 3: Dampak terhadap Konsumsi Penyimpanan (Storage)
- **Fakta Teknis**: 
  - **Source Code**: Folder kode ekstensi hanya ada 1 di disk (`d:\04_DEVELOPMENT\Gandiwa Extension`), sehingga tidak memakan ruang ekstra.
  - **Data Bookmark**: File JSON bookmark berukuran sangat kecil (file `bookmarks-data.json` saat ini hanya ~9.4 KB). Jika diduplikasi di 10 profil Chrome melalui `chrome.storage.local`, totalnya hanya ~94 KB. Ini sangat kecil dan tidak akan memengaruhi kinerja penyimpanan komputer Anda.
  - **Pengecualian**: Jika Anda menyimpan gambar latar belakang (wallpaper) kustom dalam format Base64 ke dalam pengaturan, ukuran penyimpanan per profil akan meningkat sesuai ukuran gambar tersebut.

---

## 2. Rencana Perubahan Kode (Mitigasi Offline)

### Perubahan pada `app/js/storage.js`
Mengubah metode `load()` untuk melakukan fetch ke file lokal jika data di `chrome.storage.local` kosong, atau membuat opsi sinkronisasi langsung dengan file lokal.

```javascript
// Konsep perubahan pada Storage.load
async load() {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, async (items) => {
            // Jika storage kosong atau diatur untuk selalu membaca file lokal
            if (Object.keys(items).length === 0 || items.useLocalJsonFile) {
                try {
                    const response = await fetch(chrome.runtime.getURL('bookmarks-data.json'));
                    const localData = await response.json();
                    resolve(localData);
                } catch (e) {
                    console.error('Gagal memuat file lokal bookmarks-data.json:', e);
                    resolve({ settings: { viewMode: 'grid' }, categories: [] });
                }
            } else {
                resolve(items);
            }
        });
    });
}
```

### Penambahan Tombol "Salin JSON" di UI
Menambahkan opsi di menu pengaturan untuk menyalin seluruh struktur data JSON terbaru ke clipboard dengan satu klik. Pengguna tinggal melakukan paste ke file `bookmarks-data.json` di editor kode untuk memperbarui data di semua profil.
