const SYNC_URL = 'http://localhost:3000/bookmarks';

const Storage = {
    /**
     * Load data from sync server with fallback to chrome.storage.local
     * @returns {Promise<Object>} The entire data object
     */
    async load() {
        // 1. Coba ambil data dari server sinkronisasi lokal
        try {
            console.log('[Storage.load] Mencoba memuat dari server sinkronisasi...');
            const response = await fetch(SYNC_URL);
            if (response.ok) {
                const serverData = await response.json();
                
                // Ambil data lokal saat ini untuk mempertahankan wallpaper profil ini
                const localItems = await new Promise((resolve) => {
                    chrome.storage.local.get(null, resolve);
                });
                
                // Jika ada wallpaper kustom tersimpan lokal, pertahankan nilainya
                if (localItems && localItems.settings && localItems.settings.wallpaper) {
                    serverData.settings = serverData.settings || {};
                    serverData.settings.wallpaper = localItems.settings.wallpaper;
                }

                console.log('[Storage.load] Berhasil memuat dari server sinkronisasi. Categories:', serverData.categories?.length || 0);
                
                // Simpan cache ke local storage
                await new Promise((resolve) => {
                    chrome.storage.local.set(serverData, resolve);
                });
                return serverData;
            }
        } catch (e) {
            console.warn('[Storage.load] Server sinkronisasi offline. Menggunakan cache lokal.', e.message);
        }

        // 2. Fallback ke chrome.storage.local jika server offline
        return new Promise((resolve) => {
            chrome.storage.local.get(null, async (items) => {
                if (!items || Object.keys(items).length === 0) {
                    // 3. Jika local storage juga kosong, muat default dari file bookmarks-data.json bawaan ekstensi
                    console.log('[Storage.load] Cache lokal kosong. Memuat preset default dari ekstensi...');
                    try {
                        const response = await fetch(chrome.runtime.getURL('bookmarks-data.json'));
                        if (response.ok) {
                            const defaultData = await response.json();
                            // Cache data bawaan ini
                            await new Promise((res) => chrome.storage.local.set(defaultData, res));
                            resolve(defaultData);
                            return;
                        }
                    } catch (err) {
                        console.error('[Storage.load] Gagal memuat preset default:', err);
                    }
                    resolve({ settings: { viewMode: 'grid' }, categories: [] });
                } else {
                    console.log('[Storage.load] Berhasil memuat dari cache lokal. Categories:', items.categories?.length || 0);
                    resolve(items);
                }
            });
        });
    },

    /**
     * Save data to chrome.storage.local and POST to sync server
     * @param {Object} data The data to save
     * @returns {Promise<void>}
     */
    async save(data) {
        console.log('[Storage.save] Menyimpan ke cache lokal. Categories:', data.categories?.map(c => c.id + ':' + c.items?.length));
        
        // 1. Simpan ke local storage (selalu simpan cache lengkap beserta wallpaper)
        await new Promise((resolve) => {
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    console.error('[Storage.save] ERROR Local Storage:', chrome.runtime.lastError);
                    alert('Warning: Could not save cache locally! ' + chrome.runtime.lastError.message);
                }
                resolve();
            });
        });

        // 2. Coba kirim data ke server sinkronisasi lokal secara asinkron (kecualikan wallpaper agar file disk tetap kecil)
        try {
            const syncData = JSON.parse(JSON.stringify(data));
            if (syncData.settings) {
                delete syncData.settings.wallpaper;
            }

            const response = await fetch(SYNC_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(syncData)
            });
            if (response.ok) {
                console.log('[Storage.save] Sinkronisasi ke server berhasil!');
            } else {
                console.warn('[Storage.save] Server menolak data. Status:', response.status);
            }
        } catch (e) {
            console.warn('[Storage.save] Server sinkronisasi offline. Perubahan hanya disimpan di profil ini.', e.message);
        }
    },

    /**
     * Update a specific setting
     * @param {string} key The setting key
     * @param {any} value The new value
     */
    async updateSetting(key, value) {
        const data = await this.load();
        data.settings[key] = value;
        await this.save(data);
    }
};
