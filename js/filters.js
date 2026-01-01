/**
 * Source category definitions and filtering logic
 * Based on Collections plugin's ContentFiltersWidget
 */

// Source categories with icons (from Collections plugin)
const SOURCE_CATEGORIES = {
    Gil: { name: '金幣', iconId: 65002 },
    Scrips: { name: '工票', iconId: 65028 },
    MGP: { name: '金碟幣', iconId: 65025 },
    PvP: { name: 'PvP', iconId: 61806 },
    Duty: { name: '副本', iconId: 60414 },
    Quest: { name: '任務', iconId: 61419 },
    Event: { name: '活動', iconId: 61757 },
    Tomestones: { name: '神典石', iconId: 65086 },
    DeepDungeon: { name: '深層迷宮', iconId: 61824 },
    BeastTribes: { name: '蠻族', iconId: 65016 },
    MogStation: { name: '商城', iconId: 61831 },
    Achievement: { name: '成就', iconId: 6 },
    CompanySeals: { name: '軍票', iconId: 65005 },
    IslandSanctuary: { name: '無人島', iconId: 65096 },
    HuntSeals: { name: '狩獵', iconId: 65034 },
    TreasureHunts: { name: '挖寶', iconId: 115 },
    Crafting: { name: '製作', iconId: 62202 },
    Voyages: { name: '遠航探索', iconId: 65035 }
};

// Major patch versions for filtering
const PATCH_VERSIONS = [
    { label: '7.x', minPatch: 7.0, maxPatch: 7.99 },
    { label: '6.x', minPatch: 6.0, maxPatch: 6.99 },
    { label: '5.x', minPatch: 5.0, maxPatch: 5.99 },
    { label: '4.x', minPatch: 4.0, maxPatch: 4.99 },
    { label: '3.x', minPatch: 3.0, maxPatch: 3.99 },
    { label: '2.x', minPatch: 2.0, maxPatch: 2.99 },
    { label: '未知', minPatch: 999, maxPatch: 9999 }
];

// Helper to get icon URL
function getIconUrl(iconId) {
    const folder = Math.floor(iconId / 1000) * 1000;
    const folderStr = folder.toString().padStart(6, '0');
    const iconStr = iconId.toString().padStart(6, '0');
    return `https://xivapi.com/i/${folderStr}/${iconStr}.png`;
}

// Filter state management
class FilterState {
    constructor() {
        this.activeCategories = new Set();
        this.activePatches = new Set();
        this.searchQuery = '';
        this.showNoSource = false; // 預設隱藏無來源項目
    }

    toggleShowNoSource() {
        this.showNoSource = !this.showNoSource;
        return this.showNoSource;
    }

    toggleCategory(category) {
        if (this.activeCategories.has(category)) {
            this.activeCategories.delete(category);
        } else {
            this.activeCategories.add(category);
        }
    }

    togglePatch(patchLabel) {
        if (this.activePatches.has(patchLabel)) {
            this.activePatches.delete(patchLabel);
        } else {
            this.activePatches.add(patchLabel);
        }
    }

    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase().trim();
    }

    clearAll() {
        this.activeCategories.clear();
        this.activePatches.clear();
        this.searchQuery = '';
        // 不重置 showNoSource，保持使用者的選擇
    }

    hasActiveFilters() {
        return this.activeCategories.size > 0 ||
               this.activePatches.size > 0 ||
               this.searchQuery.length > 0;
    }

    /**
     * Check if an item passes all active filters
     */
    passesFilters(item) {
        // No source filter - hide items without sources by default
        if (!this.showNoSource && (!item.Sources || item.Sources.length === 0)) {
            return false;
        }

        // Search filter
        if (this.searchQuery) {
            const nameMatch = item.Name?.toLowerCase().includes(this.searchQuery);
            const descMatch = item.Description?.toLowerCase().includes(this.searchQuery);
            if (!nameMatch && !descMatch) {
                return false;
            }
        }

        // Patch filter
        if (this.activePatches.size > 0) {
            const patchValue = item.PatchAdded;
            let patchMatch = false;

            for (const patchLabel of this.activePatches) {
                const patchDef = PATCH_VERSIONS.find(p => p.label === patchLabel);
                if (patchDef && patchValue >= patchDef.minPatch && patchValue <= patchDef.maxPatch) {
                    patchMatch = true;
                    break;
                }
            }

            if (!patchMatch) {
                return false;
            }
        }

        // Source category filter
        if (this.activeCategories.size > 0) {
            if (!item.Sources || item.Sources.length === 0) {
                return false;
            }

            let categoryMatch = false;
            for (const source of item.Sources) {
                if (source.Categories) {
                    for (const cat of source.Categories) {
                        if (this.activeCategories.has(cat)) {
                            categoryMatch = true;
                            break;
                        }
                    }
                }
                if (categoryMatch) break;
            }

            if (!categoryMatch) {
                return false;
            }
        }

        return true;
    }
}

// Sort functions
const SORT_FUNCTIONS = {
    'name': (a, b) => (a.Name || '').localeCompare(b.Name || '', 'zh-TW'),
    'patch-desc': (a, b) => b.PatchAdded - a.PatchAdded,
    'patch-asc': (a, b) => a.PatchAdded - b.PatchAdded,
    'id': (a, b) => a.Id - b.Id
};
