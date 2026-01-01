/**
 * Main application logic for Collections website
 */

// Global state
let collectionsData = null;
let blueMageSources = null; // Blue Mage spell sources from thewakingsands
let currentCollection = null;
let filterState = new FilterState();
let currentSort = 'name';
let searchDebounceTimer = null;

// Pagination state for performance
const ITEMS_PER_PAGE = 50;
let currentFilteredItems = [];
let currentRenderedCount = 0;
let isLoadingMore = false;
let infiniteScrollObserver = null;
let currentCollectionData = null;

// DOM Elements
const elements = {
    tabsContainer: null,
    sourceFilters: null,
    patchFilters: null,
    itemsGrid: null,
    itemsCount: null,
    sortSelect: null,
    searchInput: null,
    searchResults: null,
    clearFiltersBtn: null,
    showNoSourceToggle: null,
    modal: null,
    modalClose: null,
    modalIcon: null,
    modalName: null,
    modalPatch: null,
    modalDescription: null,
    modalSources: null,
    loadingIndicator: null,
    loadMoreBtn: null,
    loadMoreContainer: null,
    remainingSpan: null
};

// Initialize the application
async function init() {
    // Cache DOM elements
    cacheElements();

    // Set up event listeners
    setupEventListeners();

    // Load data
    await loadData();

    // Render initial UI
    renderUI();
}

// Cache DOM elements
function cacheElements() {
    elements.tabsContainer = document.getElementById('collection-tabs');
    elements.sourceFilters = document.getElementById('source-filters');
    elements.patchFilters = document.getElementById('patch-filters');
    elements.itemsGrid = document.getElementById('items-grid');
    elements.itemsCount = document.getElementById('items-count');
    elements.sortSelect = document.getElementById('sort-select');
    elements.searchInput = document.getElementById('search-input');
    elements.searchResults = document.getElementById('search-results');
    elements.clearFiltersBtn = document.getElementById('clear-filters');
    elements.showNoSourceToggle = document.getElementById('show-no-source-toggle');
    elements.modal = document.getElementById('item-modal');
    elements.modalClose = document.getElementById('modal-close');
    elements.modalIcon = document.getElementById('modal-icon');
    elements.modalName = document.getElementById('modal-name');
    elements.modalPatch = document.getElementById('modal-patch');
    elements.modalDescription = document.getElementById('modal-description');
    elements.modalSources = document.getElementById('modal-sources');
    elements.loadingIndicator = document.getElementById('loading-indicator');

    // Create load more container dynamically
    createLoadMoreButton();
}

// Set up event listeners
function setupEventListeners() {
    // Tab clicks
    elements.tabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            switchCollection(e.target.dataset.collection);
        }
    });

    // Source filter clicks
    elements.sourceFilters.addEventListener('click', (e) => {
        const filterItem = e.target.closest('.filter-item');
        if (filterItem) {
            const category = filterItem.dataset.category;
            filterState.toggleCategory(category);
            filterItem.classList.toggle('active');
            filterItem.querySelector('input').checked = filterState.activeCategories.has(category);
            renderItems();
        }
    });

    // Patch filter clicks
    elements.patchFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('patch-btn')) {
            const patchLabel = e.target.dataset.patch;
            filterState.togglePatch(patchLabel);
            e.target.classList.toggle('active');
            renderItems();
        }
    });

    // Clear filters
    elements.clearFiltersBtn.addEventListener('click', () => {
        filterState.clearAll();
        elements.searchInput.value = '';
        updateFilterUI();
        renderItems();
    });

    // Show no source toggle
    elements.showNoSourceToggle.addEventListener('change', (e) => {
        filterState.showNoSource = e.target.checked;
        renderItems();
    });

    // Sort change
    elements.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderItems();
    });

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        const query = e.target.value;

        // Debounce search
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query);
            } else {
                elements.searchResults.classList.remove('active');
                filterState.setSearchQuery('');
                renderItems();
            }
        }, 300);
    });

    // Search focus/blur
    elements.searchInput.addEventListener('focus', () => {
        if (elements.searchInput.value.length >= 2) {
            elements.searchResults.classList.add('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            elements.searchResults.classList.remove('active');
        }
    });

    // Search result clicks
    elements.searchResults.addEventListener('click', (e) => {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            const itemId = parseInt(resultItem.dataset.itemId);
            const collectionName = resultItem.dataset.collection;

            // Switch to collection and show item
            switchCollection(collectionName);
            elements.searchResults.classList.remove('active');

            // Find and show item detail
            setTimeout(() => {
                const item = findItemById(itemId, collectionName);
                if (item) {
                    showItemDetail(item);
                }
            }, 100);
        }
    });

    // Item card clicks
    elements.itemsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.item-card');
        if (card) {
            const itemId = parseInt(card.dataset.itemId);
            const item = findItemById(itemId, currentCollection);
            if (item) {
                showItemDetail(item);
            }
        }
    });

    // Modal close
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            closeModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Load JSON data
async function loadData() {
    showLoading(true);

    try {
        // Load main collections data and Blue Mage sources in parallel
        const [collectionsResponse, blueMageResponse] = await Promise.all([
            fetch('data/collections_data.json'),
            fetch('data/bluemage_sources.json').catch(() => null)
        ]);

        if (!collectionsResponse.ok) {
            throw new Error(`HTTP ${collectionsResponse.status}`);
        }
        collectionsData = await collectionsResponse.json();
        console.log('Data loaded:', collectionsData.Collections.length, 'collections');

        // Load Blue Mage sources if available
        if (blueMageResponse && blueMageResponse.ok) {
            const blueMageData = await blueMageResponse.json();
            // Create a map by action ID for quick lookup
            blueMageSources = {};
            for (const spell of blueMageData) {
                blueMageSources[spell.action] = spell;
            }
            console.log('Blue Mage sources loaded:', Object.keys(blueMageSources).length, 'spells');
        }
    } catch (error) {
        console.error('Failed to load data:', error);
        elements.itemsGrid.innerHTML = `
            <div class="no-results">
                <p>無法載入資料</p>
                <small>請確認 data/collections_data.json 檔案存在</small>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// Render initial UI
function renderUI() {
    if (!collectionsData) return;

    // Sort collections by OrderKey and filter out empty ones
    const sortedCollections = [...collectionsData.Collections]
        .filter(c => c.Items && c.Items.length > 0)
        .sort((a, b) => a.OrderKey - b.OrderKey);

    // Render tabs
    elements.tabsContainer.innerHTML = '';
    sortedCollections.forEach((collection, index) => {
        const btn = createTabButton(collection, index === 0);
        elements.tabsContainer.appendChild(btn);
    });

    // Set initial collection
    if (sortedCollections.length > 0) {
        currentCollection = sortedCollections[0].CollectionName;
    }

    // Render source filters
    renderSourceFilters();

    // Render patch filters
    renderPatchFilters();

    // Render items
    renderItems();
}

// Render source category filters
function renderSourceFilters() {
    elements.sourceFilters.innerHTML = '';

    for (const [key, info] of Object.entries(SOURCE_CATEGORIES)) {
        const isActive = filterState.activeCategories.has(key);
        const filterItem = createSourceFilterItem(key, info, isActive);
        elements.sourceFilters.appendChild(filterItem);
    }
}

// Render patch version filters
function renderPatchFilters() {
    elements.patchFilters.innerHTML = '';

    for (const patchDef of PATCH_VERSIONS) {
        const isActive = filterState.activePatches.has(patchDef.label);
        const btn = createPatchFilterButton(patchDef, isActive);
        elements.patchFilters.appendChild(btn);
    }
}

// Update filter UI state
function updateFilterUI() {
    // Update source filters
    elements.sourceFilters.querySelectorAll('.filter-item').forEach(item => {
        const category = item.dataset.category;
        const isActive = filterState.activeCategories.has(category);
        item.classList.toggle('active', isActive);
        item.querySelector('input').checked = isActive;
    });

    // Update patch filters
    elements.patchFilters.querySelectorAll('.patch-btn').forEach(btn => {
        const patchLabel = btn.dataset.patch;
        btn.classList.toggle('active', filterState.activePatches.has(patchLabel));
    });

    // Update show no source toggle
    elements.showNoSourceToggle.checked = filterState.showNoSource;
}

// Switch to a different collection
function switchCollection(collectionName) {
    if (currentCollection === collectionName) return;

    currentCollection = collectionName;

    // Update tab UI
    elements.tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.collection === collectionName);
    });

    // Render items for new collection
    renderItems();
}

// Render items for current collection
function renderItems() {
    if (!collectionsData || !currentCollection) return;

    currentCollectionData = collectionsData.Collections.find(c => c.CollectionName === currentCollection);
    if (!currentCollectionData) return;

    // Filter items
    currentFilteredItems = currentCollectionData.Items.filter(item => filterState.passesFilters(item));

    // Sort items
    const sortFn = SORT_FUNCTIONS[currentSort] || SORT_FUNCTIONS['name'];
    currentFilteredItems.sort(sortFn);

    // Reset pagination
    currentRenderedCount = 0;

    // Update count
    elements.itemsCount.textContent = `顯示 0 / ${currentFilteredItems.length} 項（共 ${currentCollectionData.Items.length} 項）`;

    // Clear grid
    elements.itemsGrid.innerHTML = '';

    if (currentFilteredItems.length === 0) {
        renderNoResults(elements.itemsGrid);
        hideLoadMoreButton();
        return;
    }

    // Render first batch
    renderMoreItems();
}

// Render more items (pagination)
function renderMoreItems() {
    if (isLoadingMore || currentRenderedCount >= currentFilteredItems.length) return;

    isLoadingMore = true;
    updateLoadMoreButtonState(true);

    const startIndex = currentRenderedCount;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, currentFilteredItems.length);

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
        const card = createItemCard(currentFilteredItems[i]);
        fragment.appendChild(card);
    }
    elements.itemsGrid.appendChild(fragment);

    currentRenderedCount = endIndex;

    // Update count display (use cached currentCollectionData)
    elements.itemsCount.textContent = `顯示 ${currentRenderedCount} / ${currentFilteredItems.length} 項（共 ${currentCollectionData.Items.length} 項）`;

    // Show/hide load more button
    if (currentRenderedCount < currentFilteredItems.length) {
        showLoadMoreButton(currentFilteredItems.length - currentRenderedCount);
    } else {
        hideLoadMoreButton();
    }

    isLoadingMore = false;
    updateLoadMoreButtonState(false);
}

// Create load more button
function createLoadMoreButton() {
    const container = document.createElement('div');
    container.id = 'load-more-container';
    container.className = 'load-more-container hidden';
    container.innerHTML = `
        <button id="load-more-btn" class="load-more-btn">載入更多</button>
        <span id="remaining-count" class="remaining-count"></span>
    `;

    // Insert after items-grid
    elements.itemsGrid.parentNode.insertBefore(container, elements.itemsGrid.nextSibling);

    elements.loadMoreContainer = container;
    elements.loadMoreBtn = document.getElementById('load-more-btn');
    elements.remainingSpan = document.getElementById('remaining-count');

    // Event listener
    elements.loadMoreBtn.addEventListener('click', renderMoreItems);

    // Infinite scroll
    setupInfiniteScroll();
}

// Update load more button loading state
function updateLoadMoreButtonState(loading) {
    if (!elements.loadMoreBtn) return;

    if (loading) {
        elements.loadMoreBtn.textContent = '載入中...';
        elements.loadMoreBtn.disabled = true;
        elements.loadMoreBtn.classList.add('loading');
    } else {
        elements.loadMoreBtn.textContent = '載入更多';
        elements.loadMoreBtn.disabled = false;
        elements.loadMoreBtn.classList.remove('loading');
    }
}

// Show load more button
function showLoadMoreButton(remaining) {
    if (elements.loadMoreContainer) {
        elements.loadMoreContainer.classList.remove('hidden');
        if (elements.remainingSpan) {
            elements.remainingSpan.textContent = `（剩餘 ${remaining} 項）`;
        }
    }
}

// Hide load more button
function hideLoadMoreButton() {
    if (elements.loadMoreContainer) {
        elements.loadMoreContainer.classList.add('hidden');
    }
}

// Setup infinite scroll
function setupInfiniteScroll() {
    // Clean up old observer if exists (prevent memory leak)
    if (infiniteScrollObserver) {
        infiniteScrollObserver.disconnect();
        infiniteScrollObserver = null;
    }

    infiniteScrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoadingMore) {
                renderMoreItems();
            }
        });
    }, {
        rootMargin: '200px'
    });

    // Observe the load more container
    if (elements.loadMoreContainer) {
        infiniteScrollObserver.observe(elements.loadMoreContainer);
    }
}

// Perform search across all collections
function performSearch(query) {
    if (!collectionsData) return;

    const searchLower = query.toLowerCase();
    const results = [];

    for (const collection of collectionsData.Collections) {
        for (const item of collection.Items) {
            if (item.Name && item.Name.toLowerCase().includes(searchLower)) {
                results.push({ item, collectionName: collection.CollectionName });
                if (results.length >= 20) break; // Limit results
            }
        }
        if (results.length >= 20) break;
    }

    // Render search results
    elements.searchResults.innerHTML = '';

    if (results.length === 0) {
        elements.searchResults.innerHTML = '<div class="search-result-item"><span class="result-name">找不到結果</span></div>';
    } else {
        for (const { item, collectionName } of results) {
            const resultItem = createSearchResultItem(item, collectionName);
            elements.searchResults.appendChild(resultItem);
        }
    }

    elements.searchResults.classList.add('active');

    // Also filter current collection
    filterState.setSearchQuery(query);
    renderItems();
}

// Find item by ID in a collection
function findItemById(itemId, collectionName) {
    if (!collectionsData) return null;

    const collection = collectionsData.Collections.find(c => c.CollectionName === collectionName);
    if (!collection) return null;

    return collection.Items.find(item => item.Id === itemId);
}

// Show item detail modal
function showItemDetail(item) {
    elements.modalIcon.src = item.IconUrl;
    elements.modalIcon.onerror = function() {
        this.src = 'https://xivapi.com/i/000000/000000.png';
    };

    // Check if this is a Blue Mage spell and get source data
    const blueMageSpell = blueMageSources ? blueMageSources[item.Id] : null;

    // Show spell number for Blue Mage
    let displayName = item.Name || '???';
    if (blueMageSpell) {
        displayName = `No.${blueMageSpell.no} ${displayName}`;
    }
    elements.modalName.textContent = displayName;

    const patchDisplay = item.DisplayPatch || (item.PatchAdded >= 999 ? '未知' : item.PatchAdded.toString());
    elements.modalPatch.textContent = `Patch ${patchDisplay}`;

    // Clean FFXIV formatting tags and convert <br> to newlines
    let description = (item.Description || '').replace(/<br\s*\/?>/gi, '\n');
    description = cleanFFXIVText(description);
    elements.modalDescription.textContent = description;

    // Render sources
    elements.modalSources.innerHTML = '';

    // Use Blue Mage sources if available
    if (blueMageSpell && blueMageSpell.method && blueMageSpell.method.length > 0) {
        for (const method of blueMageSpell.method) {
            const sourceItem = renderBlueMageSource(method);
            elements.modalSources.appendChild(sourceItem);
        }
    } else if (item.Sources && item.Sources.length > 0) {
        for (const source of item.Sources) {
            const sourceItem = renderSourceItem(source);
            elements.modalSources.appendChild(sourceItem);
        }
    } else {
        elements.modalSources.innerHTML = '<p class="no-results">無來源資料</p>';
    }

    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
