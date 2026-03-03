const State = {
    data: null,
    
    /**
     * Initialize state
     */
    async init() {
        this.data = await Storage.load();
        
        // Ensure data integrity
        this.data = this.data || {};
        this.data.categories = this.data.categories || [];
        this.data.settings = this.data.settings || {};
        
        // Default Settings
        if (this.data.settings.showChromeBookmarks === undefined) {
             this.data.settings.showChromeBookmarks = true;
        }

        // Clean up any potential 'undefined' items in categories that might cause render issues
        if (this.data.categories) {
            this.data.categories = this.data.categories.filter(c => c && c.items);
            
            // Normalize item structure (migration for old data)
            let needsSave = false;
            this.data.categories.forEach(cat => {
                cat.items.forEach(item => {
                    // Ensure icon field exists and is not null
                    if (item.icon === null || item.icon === undefined) {
                        item.icon = 'default';
                        needsSave = true;
                    }
                });
            });
            if (needsSave) {
                console.log('[State.init] Migrating old data...');
                await Storage.save(this.data);
                console.log('[State.init] Migration saved.');
            }
        }

        // Always load chrome bookmarks if needed for sidebar tree
        await this.loadChromeBookmarks();
    },


    /**
     * Set Application Wallpaper
     * @param {string|null} base64Image 
     */
    async setWallpaper(base64Image) {
        this.data.settings.wallpaper = base64Image;
        await Storage.updateSetting('wallpaper', base64Image);
    },

    /**
     * Load native Chrome bookmarks and add them as a read-only category
     */
    chromeTree: null,

    /**
     * Load native Chrome bookmarks and add them as a read-only category
     */
    async loadChromeBookmarks() {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree((tree) => {
                const root = tree[0];
                // We assume root children [0]=Bar, [1]=Other usually.
                // Store the whole root children array to be rendered in sidebar
                this.chromeTree = root.children || [];
                resolve();
            });
        });
    },

    processChromeNodes(nodes) {
        if (!nodes) return [];
        return nodes.map(node => ({
            id: node.id,
            title: node.title,
            url: node.url, // Undefined for folders
            icon: null,
            children: node.children ? this.processChromeNodes(node.children) : null,
            isFolder: !node.url
        }));
    },

    /**
     * Add a new category
     * @param {string} name 
     */
    async addCategory(name) {
        const newCategory = {
            id: 'mw-' + Date.now(),
            name: name,
            items: []
        };
        this.data.categories.push(newCategory);
        await Storage.save(this.data);
    },

    /**
     * Add Item to category
     * @param {string} categoryId 
     * @param {string} title 
     * @param {string} url 
     */
    async addItem(categoryId, title, url, icon = '') {
        console.log('[State.addItem] Adding to category:', categoryId, 'Title:', title);
        console.log('[State.addItem] Current categories:', this.data.categories.map(c => c.id + ':' + c.items.length));
        
        const category = this.data.categories.find(c => c.id === categoryId);
        if (category) {
            const newItem = {
                id: 'itm-' + Date.now(),
                title,
                url,
                icon: (icon && icon.trim()) ? icon.trim() : 'default'
            };
            category.items.push(newItem);
            console.log('[State.addItem] Item added:', newItem.id);
            console.log('[State.addItem] Saving... Categories now:', this.data.categories.map(c => c.id + ':' + c.items.length));
            await Storage.save(this.data);
            console.log('[State.addItem] Save complete.');
        } else {
            console.error('[State.addItem] Category not found:', categoryId);
        }
    },

    /**
     * Delete Item from category
     * @param {string} categoryId 
     * @param {string} itemId 
     * @returns {boolean} success
     */
    async deleteItem(categoryId, itemId) {
        console.log('State.deleteItem called with:', categoryId, itemId);
        
        const category = this.data.categories.find(c => c.id === categoryId);
        console.log('Found category:', category);
        
        if (category) {
            const initialLength = category.items.length;
            console.log('Initial items length:', initialLength);
            
            category.items = category.items.filter(item => item.id !== itemId);
            console.log('New items length:', category.items.length);
            
            if (category.items.length < initialLength) {
                await Storage.save(this.data);
                console.log('Data saved successfully');
                return true;
            }
        }
        console.log('Delete failed - category not found or item not found');
        return false;
    },

    /**
     * Edit Item in category
     * @param {string} categoryId 
     * @param {string} itemId 
     * @param {object} updates - {title, url, icon}
     * @returns {boolean} success
     */
    async editItem(categoryId, itemId, updates) {
        console.log('editItem called:', { categoryId, itemId, updates });
        const category = this.data.categories.find(c => c.id === categoryId);
        console.log('Found category:', category?.name);
        if (category) {
            const item = category.items.find(i => i.id === itemId);
            console.log('Found item:', item?.title);
            if (item) {
                if (updates.title !== undefined) item.title = updates.title;
                if (updates.url !== undefined) item.url = updates.url;
                if (updates.icon !== undefined) {
                    item.icon = (updates.icon && updates.icon.trim()) ? updates.icon.trim() : 'default';
                }
                
                await Storage.save(this.data);
                console.log('Item updated successfully');
                return true;
            }
        }
        console.log('editItem failed - category or item not found');
        return false;
    },

    /**
     * Delete a category
     * @param {string} categoryId 
     */
    async deleteCategory(categoryId) {
        this.data.categories = this.data.categories.filter(c => c.id !== categoryId);
        await Storage.save(this.data);
    },

    async importData(jsonData) {
        if (!jsonData || !jsonData.categories) {
            throw new Error('Invalid data structure');
        }
        
        // Preserve current wallpaper
        const currentWallpaper = this.data.settings?.wallpaper;

        this.data = jsonData;
        
        // Restore wallpaper and ensure settings exist
        this.data.settings = this.data.settings || {};
        this.data.settings.wallpaper = currentWallpaper;
        
        await Storage.save(this.data);
    },

    /**
     * Export data to JSON file
     */
    exportData() {
        // Clean data before export (remove readonly categories mostly)
        const exportable = JSON.parse(JSON.stringify(this.data));
        exportable.categories = exportable.categories.filter(c => !c.readonly);
        
        // Exclude wallpaper from export
        if (exportable.settings) {
            delete exportable.settings.wallpaper;
        }

        const blob = new Blob([JSON.stringify(exportable, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "bookmarks-data.json";
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Move item within a category or between categories
     * @param {string} sourceCatId 
     * @param {string} sourceItemId 
     * @param {string} targetCatId 
     * @param {string} targetItemId 
     */
    async moveItem(sourceCatId, sourceItemId, targetCatId, targetItemId) {
        console.log('[State.moveItem] Move:', sourceItemId, 'from', sourceCatId, 'to', targetCatId);
        console.log('[State.moveItem] Before - Categories:', this.data.categories.map(c => c.id + ':' + c.items.length));
        
        const sourceCat = this.data.categories.find(c => c.id === sourceCatId);
        const targetCat = this.data.categories.find(c => c.id === targetCatId);
        
        if (!sourceCat || !targetCat) {
            console.error('[State.moveItem] Category not found! Source:', !!sourceCat, 'Target:', !!targetCat);
            return false;
        }
        
        const itemIndex = sourceCat.items.findIndex(i => i.id === sourceItemId);
        if (itemIndex === -1) {
            console.error('[State.moveItem] Item not found in source!');
            return false;
        }
        
        const [movedItem] = sourceCat.items.splice(itemIndex, 1);
        console.log('[State.moveItem] Removed item from source. Source now has:', sourceCat.items.length);
        
        if (targetItemId) {
            const targetIndex = targetCat.items.findIndex(i => i.id === targetItemId);
            if (targetIndex !== -1) {
                targetCat.items.splice(targetIndex, 0, movedItem);
            } else {
                targetCat.items.push(movedItem);
            }
        } else {
            targetCat.items.push(movedItem);
        }
        console.log('[State.moveItem] Added item to target. Target now has:', targetCat.items.length);
        console.log('[State.moveItem] After - Categories:', this.data.categories.map(c => c.id + ':' + c.items.length));
        
        console.log('[State.moveItem] Saving...');
        await Storage.save(this.data);
        console.log('[State.moveItem] Save complete.');
        return true;
    }
};
