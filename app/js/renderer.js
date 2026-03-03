const Renderer = {
    /**
     * Render the main content based on view mode
     * @param {Object} data The complete data object
     * @param {HTMLElement} container The container element
     */
    render(data, container) {
        const viewMode = data.settings?.viewMode || 'grid';
        container.className = `view-${viewMode}`;
        container.innerHTML = '';

        // Render "Native" Categories
            // Create Wrapper for Masonry Layout
            const wrapper = document.createElement('div');
            wrapper.className = 'masonry-wrapper';
            
            // Pass layout class if present on container (fix for layout toggle persistence)
            if (container.classList.contains('layout-1col')) {
               // actually styling handles this via #content.layout-1col .masonry-wrapper
            }

            data.categories.forEach(cat => {
                wrapper.appendChild(this.createCategoryElement(cat, data.settings?.viewMode || 'grid'));
            });
            
            container.appendChild(wrapper);

        // Render Chrome Bookmarks if enabled (handled by caller passing them as a category, or explicit check here)
        // For simplicity, we assume the caller injects Chrome bookmarks into the 'categories' list if enabled,
        // OR we handle it here if passed separately.
        // Based on plan: "Appears as a special category"
    },

    /**
     * Create a category DOM element
     * @param {Object} category 
     * @param {string} viewMode 
     * @returns {HTMLElement}
     */
    createCategoryElement(category, viewMode) {
        const section = document.createElement('section');
        section.className = 'category';

        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = category.name;
        section.appendChild(title);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'items-container';

        category.items.forEach(item => {
            itemsContainer.appendChild(this.createItemElement(item, viewMode));
        });

        // Add "New Item" Ghost Card if not read-only
        if (!category.readonly) {
            const ghost = document.createElement('button');
            ghost.className = 'item ghost-item';
            
            const icon = `
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
            `;

            if (viewMode === 'list') {
                ghost.innerHTML = `<span class="item-icon">${icon}</span> <span class="item-title">Add Shortcut</span>`;
            } else {
                 ghost.innerHTML = `<div class="item-icon" style="display:flex;align-items:center;justify-content:center">${icon}</div><div class="item-title">Add Shortcut</div>`;
            }

            ghost.onclick = () => window.openAddItemModal(category.id);
            itemsContainer.appendChild(ghost);
        }

        section.appendChild(itemsContainer);
        return section;
    },

    /**
     * Create an individual bookmark item element
     * @param {Object} item 
     * @param {string} viewMode 
     * @returns {HTMLElement}
     */
    createItemElement(item, viewMode) {
        const a = document.createElement('a');
        a.className = 'item';
        // Identify folder vs bookmark
        if (!item.url) {
            a.classList.add('folder');
            // Folders use click handler usually, href might be void
            a.href = '#'; 
            a.onclick = (e) => { e.preventDefault(); /* renderFolderView logic handled by caller usually or attached here? */ };
            // Actually, app.js addresses onclick for items? 
            // In renderFolderView (which I haven't found), it might attach events.
            // But usually renderFolderView clears container and calls render.
            // If I change Renderer here, I might break click navigation if logic is external.
            // Let's just add the class for styling first.
        } else {
            a.href = item.url;
        }
        
        // Icon
        const img = document.createElement('img');
        img.className = 'item-icon';
        // Use chrome://favicon for best performance and accuracy, or fallback to item.icon
        // Note: chrome://favicon requires 'favicon' permission
        if (item.url) {
             try {
                const url = new URL(chrome.runtime.getURL("/_favicon/"));
                url.searchParams.set("pageUrl", item.url);
                url.searchParams.set("size", "64");
                img.src = url.toString();
            } catch (e) {
                img.src = item.icon || 'icon.png';
            }
        } else {
             img.src = item.icon || 'icon.png';
        }
       
        img.alt = item.title;
        a.appendChild(img);

        // Info Container (for List view mainly)
        if (viewMode === 'list') {
            const info = document.createElement('div');
            info.className = 'item-info';

            const title = document.createElement('div');
            title.className = 'item-title';
            title.textContent = item.title;
            info.appendChild(title);

            const urlDiv = document.createElement('div');
            urlDiv.className = 'item-url';
            urlDiv.textContent = item.url;
            info.appendChild(urlDiv);

            a.appendChild(info);
        } else {
            // Grid View - Just Title
             const title = document.createElement('div');
            title.className = 'item-title';
            title.textContent = item.title;
            a.appendChild(title);
        }

        return a;
    }
};
