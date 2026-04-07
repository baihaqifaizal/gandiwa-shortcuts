document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('content');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');
    function toggleTheme() {
        const isLight = document.body.classList.contains('light-mode');
        
        if (isLight) {
            // Switch to dark
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
            iconSun.style.display = 'block';
            iconMoon.style.display = 'none';
        } else {
            // Switch to light
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            iconSun.style.display = 'none';
            iconMoon.style.display = 'block';
        }
    }
    
    // Load theme (default: dark)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        iconSun.style.display = 'none';
        iconMoon.style.display = 'block';
    }
    
    // Attach theme toggle event
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    
    // --- DateTime Display Logic ---
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    function updateDateTime() {
        const now = new Date();
        
        // Format time: HH:MM
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}`;
        
        // Format date: DD Month YYYY
        const day = now.getDate();
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();
        dateDisplay.textContent = `${day} ${month} ${year}`;
    }
    
    // Update datetime immediately and every minute
    updateDateTime();
    setInterval(updateDateTime, 60000);

    // --- Focus Timer Logic ---
    const focusInput = document.getElementById('focus-input');
    const focusToggleBtn = document.getElementById('focus-toggle-btn');
    const iconPlay = document.getElementById('icon-play');
    const iconStop = document.getElementById('icon-stop');
    
    let focusInterval = null;
    let focusTimeLeft = 25 * 60; // default seconds
    let isFocusRunning = false;

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function showFocusCompleteNotification() {
        const originalTitle = document.title;
        let marqueeInterval = null;
        
        // Start marquee in tab title
        const marqueeText = '🎉 Focus Session Complete! Time for a break. ';
        let marqueeIndex = 0;
        marqueeInterval = setInterval(() => {
            document.title = marqueeText.substring(marqueeIndex) + marqueeText.substring(0, marqueeIndex);
            marqueeIndex = (marqueeIndex + 1) % marqueeText.length;
        }, 200);
        
        // Browser notification
        if (Notification.permission === 'granted') {
            new Notification('Focus Session Complete! 🎉', {
                body: 'Great job! Time for a break.',
                icon: 'icons/icon128.png'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Focus Session Complete! 🎉', {
                        body: 'Great job! Time for a break.',
                        icon: 'icons/icon128.png'
                    });
                }
            });
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'focus-toast-overlay';
        document.body.appendChild(overlay);
        
        // Create toast container
        const toast = document.createElement('div');
        toast.className = 'focus-toast';
        toast.innerHTML = `
            <div class="focus-toast-icon">🎉</div>
            <div class="focus-toast-content">
                <div class="focus-toast-title">Focus Session Complete!</div>
                <div class="focus-toast-message">Great job! Time for a break.</div>
            </div>
            <button class="focus-toast-btn">OK</button>
        `;
        document.body.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            toast.classList.add('show');
        });
        
        // Play notification sound
        try {
            const audio = new Audio('app/assets/focus-alert.wav');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
        
        // Dismiss on OK click
        toast.querySelector('.focus-toast-btn').addEventListener('click', () => {
            // Stop marquee and restore title
            clearInterval(marqueeInterval);
            document.title = originalTitle;
            
            overlay.classList.remove('show');
            toast.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                toast.remove();
            }, 500);
        });
    }

    function stopFocusTimer(reset = false) {
        clearInterval(focusInterval);
        isFocusRunning = false;
        focusInput.readOnly = false;
        focusInput.classList.remove('active');
        iconPlay.style.display = 'block';
        iconStop.style.display = 'none';
        
        if (reset) {
             // Reset logic if needed, or just leave at paused time?
             // User prompt: "waktu > play stop". 
             // Usually stop means reset or pause. Let's pause for now, edit to reset.
        }
    }

    function startFocusTimer() {
        // Parse input: "25" or "25:00"
        let val = focusInput.value.trim();
        if (val.includes(':')) {
            const parts = val.split(':');
            focusTimeLeft = (parseInt(parts[0]) * 60) + (parseInt(parts[1]) || 0);
        } else {
            focusTimeLeft = parseInt(val) * 60;
        }

        if (isNaN(focusTimeLeft) || focusTimeLeft <= 0) {
            focusTimeLeft = 25 * 60;
        }

        isFocusRunning = true;
        focusInput.readOnly = true;
        focusInput.classList.add('active');
        iconPlay.style.display = 'none';
        iconStop.style.display = 'block';
        
        // Immediate update
        focusInput.value = formatTime(focusTimeLeft);

        focusInterval = setInterval(() => {
            focusTimeLeft--;
            if (focusTimeLeft <= 0) {
                stopFocusTimer();
                focusInput.value = "00:00";
                showFocusCompleteNotification();
                return;
            }
            focusInput.value = formatTime(focusTimeLeft);
        }, 1000);
    }

    if (focusToggleBtn) {
        focusToggleBtn.addEventListener('click', () => {
            if (isFocusRunning) {
                stopFocusTimer();
            } else {
                startFocusTimer();
            }
        });
    }

    // Optional: Auto-format input on blur to "MM:00" if just number
    if (focusInput) {
        focusInput.addEventListener('blur', () => {
            if (!isFocusRunning) {
                let val = focusInput.value.trim();
                // If just numbers, append :00
                if (/^\d+$/.test(val)) {
                    focusInput.value = `${val}:00`;
                }
            }
        });
        
        // Enter key to start
        focusInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                startFocusTimer();
                focusInput.blur();
            }
        });
    }
    
    // --- Controls Toggle Logic ---
    const controlsContainer = document.getElementById('controls-container');
    const controlsToggleBtn = document.getElementById('controls-toggle-btn');
    
    function toggleControls() {
        controlsContainer.classList.toggle('collapsed');
        const isCollapsed = controlsContainer.classList.contains('collapsed');
        localStorage.setItem('controlsCollapsed', isCollapsed ? 'true' : 'false');
    }
    
    // Load controls state (default: ALWAYS collapsed on page load)
    // Controls state is not persisted - always starts collapsed
    controlsContainer.classList.add('collapsed');
    
    // Attach toggle event
    controlsToggleBtn.addEventListener('click', toggleControls);
    
    // --- Sidebar Toggle Logic ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // --- Notes Toggle Logic ---
    const rightSidebar = document.getElementById('right-sidebar');
    const notesToggleBtn = document.getElementById('notes-toggle-btn');
    
    if (notesToggleBtn && rightSidebar) {
        // Load notes state (default: collapsed)
        const notesState = localStorage.getItem('notesCollapsed');
        if (notesState === 'false') {
            rightSidebar.classList.remove('collapsed');
        } else {
            rightSidebar.classList.add('collapsed');
        }

        notesToggleBtn.addEventListener('click', () => {
            rightSidebar.classList.toggle('collapsed');
            const isCollapsed = rightSidebar.classList.contains('collapsed');
            localStorage.setItem('notesCollapsed', isCollapsed ? 'true' : 'false');
            
            // Reapply layout to ensure masonry layout adjusts if necessary
            if (window.updateLayoutUI) {
                setTimeout(window.updateLayoutUI, 50);
            }
        });
    }
    
    // --- Notes Persistence Logic ---
    const privateNotes = document.getElementById('private-notes');
    
    // Load saved notes
    const savedNotes = localStorage.getItem('privateNotes');
    if (savedNotes) {
        privateNotes.value = savedNotes;
    }
    
    // Auto-save and Auto-resize on typing
    function autoResizeNotes() {
        privateNotes.style.height = 'auto';
        privateNotes.style.height = privateNotes.scrollHeight + 'px';
    }

    privateNotes.addEventListener('input', () => {
        localStorage.setItem('privateNotes', privateNotes.value);
        autoResizeNotes();
    });

    // Initial resize if content exists
    if (privateNotes.value) {
        setTimeout(autoResizeNotes, 100);
    }

    // --- Layout Toggle Logic ---
    const layoutToggleBtn = document.getElementById('layout-toggle-btn');
    const iconLayout1 = document.getElementById('icon-layout-1');
    const iconLayout2 = document.getElementById('icon-layout-2');

    function updateLayoutUI() {
        const columns = localStorage.getItem('layoutColumns') || '2';
        const contentEl = document.getElementById('content');
        if (!contentEl) return;

        if (columns === '1') {
            contentEl.classList.add('layout-1col');
            if (iconLayout1) iconLayout1.style.display = 'block';
            if (iconLayout2) iconLayout2.style.display = 'none';
        } else {
            contentEl.classList.remove('layout-1col');
            if (iconLayout1) iconLayout1.style.display = 'none';
            if (iconLayout2) iconLayout2.style.display = 'block';
        }
    }

    if (layoutToggleBtn) {
        layoutToggleBtn.addEventListener('click', () => {
            let current = localStorage.getItem('layoutColumns') || '2';
            let next = current === '2' ? '1' : '2';
            localStorage.setItem('layoutColumns', next);
            updateLayoutUI();
        });
    }

    // Expose to global for use in other render functions
    window.updateLayoutUI = updateLayoutUI;

    // Initial load
    updateLayoutUI();

    // Initialize State (Moved to end)

    // --- Renderer ---
    const Renderer = {
        render(data, container) {
            if (!container) return;
            
            // Preserve layout class before clearing
            const hasLayout1Col = container.classList.contains('layout-1col');
            
            container.innerHTML = '';
            
            // Restore layout class
            if (hasLayout1Col) {
                container.classList.add('layout-1col');
            }
            
            if (data.categories.length === 0) {
                container.innerHTML = '<div style="text-align:center; opacity:0.5; padding:40px;">No Collections yet. Create one!</div>';
                return;
            }
            
            // Create masonry wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'masonry-wrapper';

            data.categories.forEach(cat => {
                wrapper.appendChild(this.createCategoryElement(cat, data.settings?.viewMode || 'grid'));
            });
            
            container.appendChild(wrapper);
            
            // Reapply layout after render
            if (window.updateLayoutUI) window.updateLayoutUI();
        },

        createCategoryElement(cat, viewMode) {
            const el = document.createElement('div');
            el.className = 'category';
            if (viewMode === 'grid') el.classList.add('view-grid');
            else el.classList.add('view-list');

            const header = document.createElement('div');
            header.className = 'category-header'; // Added class
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '16px';

            const title = document.createElement('h2');
            title.className = 'category-title';
            title.textContent = cat.name;
            title.style.marginBottom = '0'; 
            header.appendChild(title);

            if (!cat.readonly) {
                const delBtn = document.createElement('button');
                delBtn.className = 'icon-btn delete-category-btn'; // Added class
                delBtn.style.width = '24px';
                delBtn.style.height = '24px';
                delBtn.style.minWidth = '24px';
                delBtn.style.background = 'transparent'; // Transparent bg
                delBtn.title = 'Delete Category';
                delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                
                delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if(confirm(`Delete category "${cat.name}"?`)) {
                        await State.deleteCategory(cat.id);
                        Renderer.render(State.data, document.getElementById('content'));
                    }
                };
                header.appendChild(delBtn);
            }

            el.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'items-container'; 
            
            cat.items.forEach(item => {
                try {
                    const itemElem = this.createItemElement(item, cat.id, cat.readonly);
                    if (itemElem) grid.appendChild(itemElem);
                } catch (err) {
                    console.error('Error rendering item:', item, err);
                }
            });

            // Drop zone for empty areas/end of list
            grid.addEventListener('dragover', (e) => {
                if (!cat.readonly) {
                    e.preventDefault();
                    grid.classList.add('drag-over');
                }
            });
            grid.addEventListener('dragleave', () => grid.classList.remove('drag-over'));
            grid.addEventListener('drop', async (e) => {
                if (cat.readonly) return;
                const dragTarget = e.target.closest('.item');
                if (dragTarget) return; // Handled by item drop listener

                e.preventDefault();
                grid.classList.remove('drag-over');
                const dataRaw = e.dataTransfer.getData('text/plain');
                if (!dataRaw) return;
                
                try {
                    const data = JSON.parse(dataRaw);
                    await State.moveItem(data.categoryId, data.itemId, cat.id, null);
                    Renderer.render(State.data, container);
                } catch (err) { console.error(err); }
            });

            // Add "New Shortcut" button if not Readonly
            if (!cat.readonly) {
                const addBtn = document.createElement('button');
                addBtn.className = 'item add-item-btn';
                // HTML structure for add button matching item style
                addBtn.innerHTML = `
                    <div class="item-icon" style="background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <div class="item-title">Add</div>
                `;
                addBtn.onclick = () => window.openAddItemModal(cat.id);
                grid.appendChild(addBtn);
            }

            el.appendChild(grid);
            return el;
        },

        createItemElement(item, categoryId, isReadonly) {
            const isFolder = item.isFolder || (item.children && !item.url);
            
            const el = document.createElement('a');
            el.className = 'item';
            
            // Add data-item-id for easy DOM selection
            if (item.id) {
                el.dataset.itemId = item.id;
            }
            
            if (isFolder) {
                el.href = '#';
                el.onclick = (e) => {
                    e.preventDefault();
                    // We need to access renderFolderView. It's defined globally below or we can attach it to window.
                    // Or we can just import it if it was a module, but here it's in the same scope?
                    // No, Renderer is inside DOMContentLoaded. renderFolderView is sibling.
                    // We will trust it is available or move renderFolderView to Renderer.
                    if (typeof window.renderFolderView === 'function') {
                        window.renderFolderView(item);
                    } else {
                        console.error('renderFolderView not found');
                    }
                };
            } else {
                el.href = item.url;
            }
            
            // Icon logic
            let iconUrl = item.icon;
            
            if (isFolder) {
                 // Folder Icon
                 const folderIcon = document.createElement('div');
                 folderIcon.className = 'item-icon';
                 folderIcon.style.background = 'rgba(255,255,255,0.1)';
                 folderIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
                 folderIcon.style.display = 'flex';
                 folderIcon.style.alignItems = 'center';
                 folderIcon.style.justifyContent = 'center';
                 el.appendChild(folderIcon);
            } else {
                const img = document.createElement('img');
                img.className = 'item-icon';
                
                const setFallback = () => {
                     // Globe SVG
                     img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjODg4ODg4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48bGluZSB4MT0iMiIgeTE9IjEyIiB4Mj0iMjIiIHkyPSIxMiIvPjxwYXRoIGQ9Ik0xMiAyYTE1LjMgMTUuMyAwIDAgMSA0IDEwIDE1LjMgMTUuMyAwIDAgMS00IDEwIDE1LjMgMTUuMyAwIDAgMS00LTEwIDE1LjMgMTUuMyAwIDAgMSA0LTEweiIvPjwvc3ZnPg==';
                     img.style.opacity = '0.7';
                };
                
                const loadAutoFavicon = () => {
                    img.style.opacity = '1';
                    // Use domain_url with full URL for most accurate results
                    // Add cache-buster to force refresh on each page load
                    const cacheBuster = Date.now();
                    img.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(item.url)}&_=${cacheBuster}`;
                    img.onerror = () => {
                        // Fallback to domain-only
                        try {
                            const urlObj = new URL(item.url);
                            img.src = `https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}&_=${cacheBuster}`;
                            img.onerror = setFallback;
                        } catch (e) {
                            setFallback();
                        }
                    };
                };

                // Check if custom icon URL exists
                if (typeof item.icon === 'string' && item.icon !== 'default' && item.icon.trim().length > 0) {
                    img.src = item.icon;
                    img.onerror = loadAutoFavicon;
                } else {
                    // Auto-fetch favicon from URL
                    try {
                        loadAutoFavicon();
                    } catch (e) {
                        setFallback();
                    }
                }
                
                el.appendChild(img);
            }

            const title = document.createElement('div');
            title.className = 'item-title';
            title.textContent = item.title;
            el.appendChild(title);

            // Add Draggable support
            if (!isReadonly && !item.isChromeBookmark) {
                el.draggable = true;
                
                el.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        categoryId,
                        itemId: item.id
                    }));
                    el.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });

                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                    document.querySelectorAll('.item').forEach(i => i.classList.remove('drag-over'));
                });

                el.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    el.classList.add('drag-over');
                    e.dataTransfer.dropEffect = 'move';
                });
                
                el.addEventListener('dragleave', () => {
                    el.classList.remove('drag-over');
                });

                el.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    el.classList.remove('drag-over');
                    
                    const dataRaw = e.dataTransfer.getData('text/plain');
                    if (!dataRaw) return;
                    
                    try {
                        const data = JSON.parse(dataRaw);
                        
                        // Skip if dropping on itself
                        if (data.itemId === item.id) return;
                        
                        console.log('[Drop on Item] Moving', data.itemId, 'from', data.categoryId, 'to', categoryId, 'before', item.id);
                        
                        await State.moveItem(data.categoryId, data.itemId, categoryId, item.id);
                        Renderer.render(State.data, container);
                    } catch (err) {
                        console.error('[Drop on Item] Error:', err);
                    }
                });
            }

            // URL specific for list view handling (hidden in grid via css)
            if (!isFolder) {
                const urlDiv = document.createElement('div');
                urlDiv.className = 'item-url';
                urlDiv.textContent = item.url;
                el.appendChild(urlDiv);
            }

            // Add context menu support for non-folder items
            if (!isFolder && categoryId) {
                el.dataset.isChromeBookmark = item.isChromeBookmark || false;
                
                el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    window.showContextMenu(e.clientX, e.clientY, categoryId, item.id, item.isChromeBookmark);
                });
            }

            return el;
        }
    };

    // Make renderFolderView global for Renderer to call
    window.renderFolderView = renderFolderView;


    // --- Sidebar Logic ---
    async function renderSidebar() {
        const sidebarNav = document.getElementById('sidebar-nav');
        sidebarNav.innerHTML = '';

        // 1. Dashboard / Quick Links Home
        const allItem = createSidebarItem('Quick Links', 'grid', true); // Default active
        allItem.onclick = () => {
            document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            allItem.classList.add('active');
            renderDashboard(); // Show Quick Links
        };
        sidebarNav.appendChild(allItem);

        // 2. Chrome Bookmarks Tree (The "File Explorer")
        if (State.data.settings.showChromeBookmarks && State.chromeTree) {
             const header = document.createElement('div');
             header.className = 'sidebar-header';
             header.textContent = 'Chrome Bookmarks';
             sidebarNav.appendChild(header);
             
             State.chromeTree.forEach(node => {
                 sidebarNav.appendChild(renderTreeStart(node));
             });
        }
    }

    function createSidebarItem(label, iconType, isActive = false) {
        const el = document.createElement('div');
        el.className = `sidebar-item ${isActive ? 'active' : ''}`;
        
        let iconSvg = '';
        if (iconType === 'grid') iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
        else if (iconType === 'folder') iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
        
        el.innerHTML = `${iconSvg} <span>${label}</span>`;
        return el;
    }

    function renderTreeStart(node, depth = 0) {
        const li = document.createElement('li');
        li.style.listStyle = 'none';
        
        // Node Line
        const row = document.createElement('div');
        row.className = 'sidebar-item';
        
        // Toggle arrow if children exist AND there are sub-folders to show
        // Chrome API: Folders have 'children', bookmarks do not.
        // We only show folders in the sidebar tree.
        const subFolders = node.children ? node.children.filter(c => c.children) : [];
        const hasSubFolders = subFolders.length > 0;
        
        // Default Expand Rule: Only expand top-level roots (depth 0, e.g. Bookmarks Bar)
        // Collapse everything else by default.
        const isExpanded = depth < 1; 

        if (hasSubFolders) {
             const arrow = document.createElement('div');
             arrow.className = isExpanded ? 'tree-toggle' : 'tree-toggle collapsed';
             arrow.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
             arrow.onclick = (e) => {
                 e.stopPropagation();
                 arrow.classList.toggle('collapsed');
                 const childrenContainer = li.querySelector('.tree-children');
                 if (childrenContainer) childrenContainer.classList.toggle('hidden');
             };
             row.appendChild(arrow);
        } else {
             // Spacer for alignment
             const spacer = document.createElement('div');
             spacer.style.width = '16px'; // Match arrow width approx
             row.appendChild(spacer);
        }

        // Icon
        const iconDiv = document.createElement('div');
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';
        iconDiv.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
        
        const span = document.createElement('span');
        span.textContent = node.title || 'Untitled';
        span.style.marginLeft = '8px';
        
        row.appendChild(iconDiv);
        row.appendChild(span);
        
        row.onclick = () => {
             document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
             row.classList.add('active');
             // TODO: Render specific folder view. For now, filter to chrome bookmarks generally or implement deep link
             // Since main view is 'Dashboard', maybe we just show Items of this folder?
             renderFolderView(node); 
        };

        li.appendChild(row);

        // Children
        if (hasSubFolders) {
            const ul = document.createElement('ul');
            ul.className = isExpanded ? 'tree-children' : 'tree-children hidden';
            subFolders.forEach(child => {
                ul.appendChild(renderTreeStart(child, depth + 1));
            });
            li.appendChild(ul);
        }

        return li;
    }

    // New Function to render specific folder in Main Content
    function renderFolderView(node) {
        const content = document.getElementById('content');
        content.innerHTML = '';
        
        // Create a 'category' container with special class for bookmark folders
        const catEl = document.createElement('div');
        catEl.className = 'category bookmark-folder-view';
        
        const headers = document.createElement('div');
        headers.className = 'category-header';

        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = node.title;
        
        headers.appendChild(title);
        catEl.appendChild(headers);
        
        const gridWrapper = document.createElement('div');
        gridWrapper.className = State.data.settings.viewMode === 'list' ? 'view-list' : 'view-grid';
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'items-container';
        gridWrapper.appendChild(itemsContainer);

        // Fetch FRESH children
        chrome.bookmarks.getChildren(node.id, (children) => {
            if (children && children.length > 0) {
                children.forEach(child => {
                     // Check if folder by seeing if it's not a url (or check object props)
                     // Chrome API `getChildren` returns nodes. Folders have no 'url' usually.
                     // But strictly, `getChildren` result objects don't have `children` array populated unless `getSubTree` is used.
                     // So we check 'url' property. If missing, it's a folder.
                    const isFolder = !child.url; 
                    
                    const itemData = {
                        id: child.id,
                        title: child.title,
                        url: child.url || '#',
                        icon: null,
                        isFolder: isFolder,
                        isChromeBookmark: true // Flag untuk Chrome Bookmarks
                    };

                    const itemEl = Renderer.createItemElement(itemData, 'chrome-bookmark', false);
                    itemsContainer.appendChild(itemEl);
                });
            } else {
                const empty = document.createElement('div');
                empty.textContent = "Folder is empty";
                empty.style.padding = "20px";
                empty.style.color = "var(--text-secondary)";
                itemsContainer.appendChild(empty);
            }
        });
        
        catEl.appendChild(gridWrapper);
        content.appendChild(catEl);
        if (window.updateLayoutUI) window.updateLayoutUI();
    }
    // Remove old createBookmarkElement as we use Renderer.createItemElement now
    window.renderFolderView = renderFolderView;

    // Helper: Render Category View (Offline)
    function renderCategoryView(catId) {
        const cat = State.data.categories.find(c => c.id === catId);
        if (!cat) return;
        
        const content = document.getElementById('content');
        content.innerHTML = '';
        
        // We need 'createCategoryElement' from existing text? 
        // It was part of render logic inside renderDashboard usually.
        // I need to extract that logic or duplicate it.
        // Let's rely on renderDashboard logic effectively but just for one.
        // For now, we'll just render the category using the Renderer.
        // This assumes Renderer.render can handle rendering a single category.
        // If not, a dedicated function like createCategoryElement would be needed.
        Renderer.render({ 
            categories: [cat], 
            settings: State.data.settings 
        }, content);
        if (window.updateLayoutUI) window.updateLayoutUI();
    }

    // Helper: Render Dashboard (All Bookmarks)
    function renderDashboard() {
        Renderer.render(State.data, container);
        if (window.updateLayoutUI) window.updateLayoutUI();
    }

    // Event Listeners
    const wallpaperInput = document.getElementById('input-wallpaper');
    if (wallpaperInput) {
        wallpaperInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const base64 = ev.target.result;
                    await State.setWallpaper(base64);
                    document.body.style.backgroundImage = `url(${base64})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const backupWallpaperBtn = document.getElementById('backup-wallpaper-btn');
    if (backupWallpaperBtn) {
        backupWallpaperBtn.addEventListener('click', () => {
            const wallpaper = State.data.settings?.wallpaper;
            if (!wallpaper) {
                alert('Tidak ada wallpaper yang disetel.');
                return;
            }
            
            // Extract extension if possible
            let ext = 'jpg';
            const match = wallpaper.match(/^data:image\/(\w+);base64,/);
            if (match && match[1]) {
                ext = match[1];
            }
            
            const a = document.createElement('a');
            a.href = wallpaper;
            a.download = `backup-wallpaper.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    const importInput = document.getElementById('input-import');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    try {
                        const jsonData = JSON.parse(ev.target.result);
                        if (confirm('Import data akan menimpa koleksi saat ini. Lanjutkan?')) {
                            await State.importData(jsonData);
                            window.location.reload();
                        }
                    } catch (err) {
                        console.error('Import Error:', err);
                        alert('Format JSON tidak valid!');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    // Initialize Application
    await State.init();
    renderSidebar();
    renderDashboard();
    
    if (State.data.settings.wallpaper) {
        document.body.style.backgroundImage = `url(${State.data.settings.wallpaper})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    }


    // --- Modal & Edit Logic ---

    // Elements
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCategory = document.getElementById('modal-category');
    const modalItem = document.getElementById('modal-item');
    const modalEditItem = document.getElementById('modal-edit-item');
    const btnAddCategory = document.getElementById('add-category-btn');
    const btnExport = document.getElementById('export-btn');
    const btnCancel = document.querySelectorAll('.btn-cancel');

    // Global helper for Renderer
    window.openAddItemModal = (catId) => {
        document.getElementById('item-cat-id').value = catId;
        openModal(modalItem);
        document.getElementById('item-title').focus();
    };

    function openModal(modal) {
        modalOverlay.classList.add('open');
        modal.style.display = 'block';
        // Hide others
        [modalCategory, modalItem, modalEditItem].forEach(m => {
            if (m !== modal) m.style.display = 'none';
        });
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
        setTimeout(() => {
            modalCategory.style.display = 'none';
            modalItem.style.display = 'none';
            modalEditItem.style.display = 'none';
        }, 200);
    }

    // Listeners - Modal only closes via Cancel button, not by clicking outside
    // modalOverlay click listener removed to prevent accidental close

    btnCancel.forEach(btn => btn.addEventListener('click', closeModal));

    btnAddCategory.addEventListener('click', () => {
        openModal(modalCategory);
        document.getElementById('cat-name').focus();
    });

    btnExport.addEventListener('click', () => {
        State.exportData();
    });

    // Form Submissions
    document.getElementById('form-category').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name').value;
        if (name) {
            await State.addCategory(name);
            Renderer.render(State.data, container);
            closeModal();
            e.target.reset();
        }
    });

    document.getElementById('form-item').addEventListener('submit', async (e) => {
        e.preventDefault();
        const catId = document.getElementById('item-cat-id').value;
        const title = document.getElementById('item-title').value;
        let url = document.getElementById('item-url').value;
        const icon = document.getElementById('item-icon')?.value || '';
        
        if (catId && title && url) {
            if (!url.startsWith('http')) url = 'https://' + url;
            await State.addItem(catId, title, url, icon);
            Renderer.render(State.data, container);
            closeModal();
            e.target.reset();
        }
    });

    // --- Context Menu Logic ---
    const contextMenu = document.getElementById('context-menu');
    const contextOpenNewTab = document.getElementById('context-open-new-tab');
    const contextCopyLink = document.getElementById('context-copy-link'); // Added
    const contextEdit = document.getElementById('context-edit');
    const contextDelete = document.getElementById('context-delete');
    
    console.log('Context menu elements:', {
        contextMenu,
        contextOpenNewTab,
        contextEdit,
        contextDelete
    });
    
    let currentContextItem = { categoryId: null, itemId: null, itemData: null, isChromeBookmark: false };

    // Show context menu at mouse position
    window.showContextMenu = (x, y, categoryId, itemId, isChromeBookmark = false) => {
        console.log('showContextMenu called:', {categoryId, itemId, isChromeBookmark});
        
        // Find item data
        let item = null;
        if (!isChromeBookmark) {
            const category = State.data.categories.find(c => c.id === categoryId);
            item = category ? category.items.find(i => i.id === itemId) : null;
        }
        
        currentContextItem = { categoryId, itemId, itemData: item, isChromeBookmark };
        
        // Position menu
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        
        // Show menu with animation
        contextMenu.classList.remove('hidden');
        setTimeout(() => contextMenu.classList.add('show'), 10);
    };

    // Hide context menu
    const hideContextMenu = () => {
        contextMenu.classList.remove('show');
        setTimeout(() => {
            contextMenu.classList.add('hidden');
            currentContextItem = { categoryId: null, itemId: null, itemData: null, isChromeBookmark: false };
        }, 200);
    };

    // Handle open in new tab
    contextOpenNewTab.addEventListener('click', () => {
        if (currentContextItem.itemData && currentContextItem.itemData.url) {
            window.open(currentContextItem.itemData.url, '_blank');
        }
        hideContextMenu();
    });

    // Handle Copy Link
    contextCopyLink.addEventListener('click', () => {
        if (currentContextItem.itemData && currentContextItem.itemData.url) {
            navigator.clipboard.writeText(currentContextItem.itemData.url)
                .then(() => {
                    // Optional: Show some feedback like a toast
                    console.log('Link copied to clipboard');
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        }
        hideContextMenu();
    });

    // Handle edit action
    contextEdit.addEventListener('click', () => {
        if (currentContextItem.categoryId && currentContextItem.itemId && currentContextItem.itemData) {
            openEditItemModal(
                currentContextItem.categoryId, 
                currentContextItem.itemId,
                currentContextItem.itemData
            );
        }
        hideContextMenu();
    });

    // Handle delete action
    contextDelete.addEventListener('click', async () => {
        console.log('Delete clicked', currentContextItem);
        
        if (currentContextItem.itemId) {
            console.log('Deleting item:', currentContextItem.categoryId, currentContextItem.itemId, 'isChromeBookmark:', currentContextItem.isChromeBookmark);
            
            let success = false;
            
            if (currentContextItem.isChromeBookmark) {
                // Delete Chrome Bookmark using Chrome API
                try {
                    await new Promise((resolve, reject) => {
                        chrome.bookmarks.remove(currentContextItem.itemId, () => {
                            if (chrome.runtime.lastError) {
                                console.error('Chrome bookmark delete error:', chrome.runtime.lastError);
                                reject(chrome.runtime.lastError);
                            } else {
                                console.log('Chrome bookmark deleted successfully');
                                resolve();
                            }
                        });
                    });
                    success = true;
                    
                    // Instant UI update - remove element from DOM
                    const itemElement = document.querySelector(`[data-item-id="${currentContextItem.itemId}"]`);
                    if (itemElement) {
                        itemElement.style.transition = 'all 0.3s ease';
                        itemElement.style.opacity = '0';
                        itemElement.style.transform = 'scale(0.8)';
                        setTimeout(() => itemElement.remove(), 300);
                    }
                    
                    // Reload Chrome bookmarks tree in background
                    await State.loadChromeBookmarks();
                } catch (error) {
                    console.error('Failed to delete Chrome bookmark:', error);
                    success = false;
                }
            } else {
                // Delete Quick Links bookmark using State
                success = await State.deleteItem(
                    currentContextItem.categoryId, 
                    currentContextItem.itemId
                );
            }
            
            console.log('Delete success:', success);
            
            if (success && !currentContextItem.isChromeBookmark) {
                console.log('Re-rendering UI');
                Renderer.render(State.data, container);
            }
        } else {
            console.error('Missing itemId', currentContextItem);
        }
        hideContextMenu();
    });

    // Close context menu when clicking outside
    let contextMenuJustOpened = false;
    
    // Store original showContextMenu and wrap it
    const originalShowContextMenu = window.showContextMenu;
    window.showContextMenu = (x, y, categoryId, itemId, isChromeBookmark = false) => {
        contextMenuJustOpened = true;
        originalShowContextMenu(x, y, categoryId, itemId, isChromeBookmark);
        // Reset flag after a short delay
        setTimeout(() => { contextMenuJustOpened = false; }, 100);
    };
    
    document.addEventListener('mousedown', (e) => {
        if (contextMenuJustOpened) return;
        if (!contextMenu.contains(e.target) && !contextMenu.classList.contains('hidden')) {
            hideContextMenu();
        }
    });

    // Close context menu on scroll
    document.addEventListener('scroll', hideContextMenu, true);

    // --- Edit Item Modal Logic ---
    function openEditItemModal(categoryId, itemId, itemData) {
        document.getElementById('edit-cat-id').value = categoryId;
        document.getElementById('edit-item-id').value = itemId;
        document.getElementById('edit-item-title').value = itemData.title || '';
        document.getElementById('edit-item-url').value = itemData.url || '';
        // Show empty if icon is 'default' or falsy
        const iconValue = (itemData.icon && itemData.icon !== 'default') ? itemData.icon : '';
        document.getElementById('edit-item-icon').value = iconValue;
        
        openModal(modalEditItem);
        document.getElementById('edit-item-title').focus();
    }

    // Edit Item Form Submission
    document.getElementById('form-edit-item').addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryId = document.getElementById('edit-cat-id').value;
        const itemId = document.getElementById('edit-item-id').value;
        const title = document.getElementById('edit-item-title').value;
        let url = document.getElementById('edit-item-url').value;
        const icon = document.getElementById('edit-item-icon').value;
        
        if (categoryId && itemId && title && url) {
            if (!url.startsWith('http')) url = 'https://' + url;
            
            const success = await State.editItem(categoryId, itemId, {
                title,
                url,
                icon: icon || null
            });
            
            if (success) {
                Renderer.render(State.data, container);
                closeModal();
                e.target.reset();
            }
        }
    });
});
