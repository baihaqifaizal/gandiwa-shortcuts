const Storage = {
    /**
     * Load data in parallel with non-blocking caching for blazing fast performance
     * @returns {Promise<Object>} The merged data object
     */
    async load() {
        try {
            const [localItems, response] = await Promise.all([
                new Promise((resolve) => chrome.storage.local.get(null, resolve)),
                fetch(chrome.runtime.getURL('bookmarks-data.json'))
            ]);

            if (response.ok) {
                const fileData = await response.json();
                
                if (localItems && localItems.settings && localItems.settings.wallpaper) {
                    fileData.settings = fileData.settings || {};
                    fileData.settings.wallpaper = localItems.settings.wallpaper;
                }

                // Cache non-blocking in background
                chrome.storage.local.set(fileData);
                return fileData;
            }
            return localItems || { settings: { viewMode: 'grid' }, categories: [] };
        } catch (err) {
            console.error('[Storage.load] Fast load error:', err);
            return new Promise((resolve) => chrome.storage.local.get(null, resolve));
        }
    },

    /**
     * Save data directly to chrome.storage.local
     * @param {Object} data The data to save
     * @returns {Promise<void>}
     */
    async save(data) {
        console.log('[Storage.save] Menyimpan ke local storage. Categories:', data.categories?.map(c => c.id + ':' + c.items?.length));
        
        await new Promise((resolve) => {
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    console.error('[Storage.save] ERROR Local Storage:', chrome.runtime.lastError);
                    alert('Warning: Could not save cache locally! ' + chrome.runtime.lastError.message);
                }
                resolve();
            });
        });
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
    },

    /**
     * Export current data as downloadable bookmarks-data.json file
     */
    async exportJSON() {
        const data = await this.load();
        const exportData = JSON.parse(JSON.stringify(data));
        if (exportData.settings) {
            delete exportData.settings.wallpaper;
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookmarks-data.json';
        a.click();
        URL.revokeObjectURL(url);
    }
};
