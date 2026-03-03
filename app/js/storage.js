const Storage = {
    /**
     * Load data from chrome.storage.local
     * @returns {Promise<Object>} The entire data object
     */
    async load() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (items) => {
                if (Object.keys(items).length === 0) {
                    // Empty storage - user must import data
                    console.log('[Storage.load] Empty storage. Please import data.');
                    resolve({ settings: { viewMode: 'grid' }, categories: [] });
                } else {
                    console.log('[Storage.load] Loaded from storage. Categories:', items.categories?.length || 0);
                    resolve(items);
                }
            });
        });
    },

    /**
     * Save data to chrome.storage.local
     * @param {Object} data The data to save
     * @returns {Promise<void>}
     */
    async save(data) {
        console.log('[Storage.save] Saving data. Categories:', data.categories?.map(c => c.id + ':' + c.items?.length));
        return new Promise((resolve) => {
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    console.error('[Storage.save] ERROR:', chrome.runtime.lastError);
                    alert('Warning: Could not save changes! ' + chrome.runtime.lastError.message);
                    resolve();
                } else {
                    console.log('[Storage.save] Success!');
                    resolve();
                }
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
    }
};
