/**
 * UI Components for Collections website
 */

// Source Type to Icon ID mapping (based on each Source class's GetIconId)
const SOURCE_TYPE_ICONS = {
    'Shop': 65002,        // Gil icon (but we'll show cost items instead)
    'Instance': 60414,    // Duty icon
    'Quest': 61419,       // Quest icon
    'Achievement': 6,     // Achievement icon (small number)
    'Crafting': 62202,    // Crafting icon
    'Event': 61757,       // Event icon
    'MogStation': 61831,  // Mog Station icon
    'Container': 60465,   // Treasure chest icon
    'Submarine': 65035,   // Submarine/Voyages icon
    'PvPSeries': 61806,   // PvP icon
    'PvPRanking': 9058,   // PvP ranking icon
    'Monster': 63003,     // Monster icon
    'Misc': 60414,        // Default
    'Npc': 60414,         // Default
};

// Common currency/cost item name to icon ID mapping
const CURRENCY_ICONS = {
    'Gil': 65002,
    '金幣': 65002,
    // Tomestones
    '亞拉戈神典石:詩學': 65086,
    '亞拉戈神典石:美學': 65086,
    // Scrips
    '紫色工匠票據': 65073,
    '紫色採集票據': 65074,
    '橙色工匠票據': 65028,
    '橙色採集票據': 65029,
    // Seals
    '軍票': 65005,
    '同盟徽章': 65034,
    '怪物狩獵的戰利品': 65034,
    '精英怪物狩獵的戰利品': 65034,
    // MGP
    '金碟遊樂場幣': 65025,
    // PvP
    '狼印戰績': 65019,
    // Beast Tribes
    '蠻族貨幣': 65016,
    // Island Sanctuary
    '開拓工房印記': 65096,
    // Bicolor Gemstones
    '雙色寶石': 65071,
};

// Create item card HTML
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = item.Id;

    const patchDisplay = item.DisplayPatch || (item.PatchAdded >= 999 ? '未知' : item.PatchAdded.toString());

    card.innerHTML = `
        <img src="${item.IconUrl}" alt="${item.Name}" loading="lazy" onerror="this.src='https://xivapi.com/i/000000/000000.png'">
        <div class="item-name">${item.Name || '???'}</div>
        <div class="item-patch">Patch ${patchDisplay}</div>
    `;

    return card;
}

// Create collection tab button
function createTabButton(collection, isActive) {
    const btn = document.createElement('button');
    btn.className = `tab-btn${isActive ? ' active' : ''}`;
    btn.dataset.collection = collection.CollectionName;
    btn.textContent = collection.CollectionName;
    return btn;
}

// Create source filter item
function createSourceFilterItem(categoryKey, categoryInfo, isActive) {
    const item = document.createElement('label');
    item.className = `filter-item${isActive ? ' active' : ''}`;
    item.dataset.category = categoryKey;

    item.innerHTML = `
        <input type="checkbox" ${isActive ? 'checked' : ''}>
        <img src="${getIconUrl(categoryInfo.iconId)}" alt="${categoryInfo.name}" onerror="this.style.display='none'">
        <span>${categoryInfo.name}</span>
    `;

    return item;
}

// Create patch filter button
function createPatchFilterButton(patchDef, isActive) {
    const btn = document.createElement('button');
    btn.className = `patch-btn${isActive ? ' active' : ''}`;
    btn.dataset.patch = patchDef.label;
    btn.textContent = patchDef.label;
    return btn;
}

// Create search result item
function createSearchResultItem(item, collectionName) {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.dataset.itemId = item.Id;
    div.dataset.collection = collectionName;

    div.innerHTML = `
        <img src="${item.IconUrl}" alt="${item.Name}" onerror="this.src='https://xivapi.com/i/000000/000000.png'">
        <span class="result-name">${item.Name}</span>
        <span class="result-collection">${collectionName}</span>
    `;

    return div;
}

// Clean FFXIV special characters (Private Use Area Unicode) from text
function cleanFFXIVText(text) {
    if (!text) return text;
    // Remove FFXIV special icon characters (U+E000 to U+F8FF Private Use Area)
    return text.replace(/[\uE000-\uF8FF]/g, '').trim();
}

// Translate source names to Traditional Chinese
function translateSourceName(name, type) {
    if (!name) return '未知來源';

    // Direct translations
    if (name === 'Mog Station Item') return '水晶商城';
    if (name === 'Craftable') return '製作';

    // Partial translations
    if (name.includes('Subaquatic Voyages')) {
        return name.replace('Subaquatic Voyages', '遠航探索');
    }

    // Clean FFXIV special characters
    return cleanFFXIVText(name);
}

// Render source in modal
function renderSourceItem(source) {
    const div = document.createElement('div');
    div.className = 'source-item';

    const sourceType = source.Type || '';

    // Special handling for Shop sources - show cost items prominently like the plugin
    if (sourceType === 'Shop' && source.Costs && source.Costs.length > 0) {
        return renderShopSource(source);
    }

    // Use source IconUrl if available (includes correct item icons for containers)
    // Fall back to type-based icon only if no IconUrl provided
    let sourceIconUrl = source.IconUrl || getIconUrl(SOURCE_TYPE_ICONS[sourceType] || 60414);

    let detailsHtml = '';

    // Location info
    if (source.Location) {
        detailsHtml += `<div class="source-location">📍 ${source.Location.Territory} (${source.Location.X.toFixed(1)}, ${source.Location.Y.toFixed(1)})</div>`;
    }

    // NPC info
    if (source.NpcName) {
        detailsHtml += `<div>NPC: ${source.NpcName}</div>`;
    }

    const displayName = translateSourceName(source.Name, sourceType);

    div.innerHTML = `
        <div class="source-header">
            <img src="${sourceIconUrl}" alt="" onerror="this.style.display='none'">
            <span class="source-name">${displayName}</span>
            <span class="source-type">${getSourceTypeName(sourceType)}</span>
        </div>
        ${detailsHtml ? `<div class="source-details">${detailsHtml}</div>` : ''}
    `;

    return div;
}

// Render Shop source with cost items displayed like the plugin
function renderShopSource(source) {
    const div = document.createElement('div');
    div.className = 'source-item';

    // Build cost items HTML (shown in header like the plugin)
    const costsHtml = source.Costs.map(cost => {
        // Use IconUrl from JSON if available, otherwise fall back to name mapping or default
        const itemName = cost.ItemName || '';
        const costIconUrl = cost.IconUrl || (CURRENCY_ICONS[itemName] ? getIconUrl(CURRENCY_ICONS[itemName]) : getIconUrl(65002));
        return `<span class="cost-item"><img src="${costIconUrl}" onerror="this.style.display='none'">${itemName || '???'} x${cost.Amount}</span>`;
    }).join('');

    let locationHtml = '';
    if (source.NpcName || source.Location) {
        const npcName = source.NpcName || '未知 NPC';
        const locationName = source.Location ? source.Location.Territory : '未知地點';
        locationHtml = `<div class="source-details">
            <div>at ${npcName}, ${locationName}</div>
            ${source.Location ? `<div class="source-location">📍 (${source.Location.X.toFixed(1)}, ${source.Location.Y.toFixed(1)})</div>` : ''}
        </div>`;
    }

    div.innerHTML = `
        <div class="source-header shop-source">
            <div class="shop-costs">${costsHtml}</div>
            <span class="source-type">商店</span>
        </div>
        ${locationHtml}
    `;

    return div;
}

// Get display name for source type
function getSourceTypeName(type) {
    const typeNames = {
        'Shop': '商店',
        'Instance': '副本',
        'Quest': '任務',
        'Achievement': '成就',
        'Crafting': '製作',
        'Event': '活動',
        'MogStation': '商城',
        'Container': '寶箱',
        'Submarine': '探索',
        'PvPSeries': 'PvP',
        'PvPRanking': 'PvP',
        'Monster': '怪物',
        'Misc': '其他',
        'Npc': 'NPC',
    };
    return typeNames[type] || type;
}

// Render no results message
function renderNoResults(container) {
    container.innerHTML = `
        <div class="no-results">
            <p>找不到符合條件的收藏品</p>
            <small>嘗試調整篩選條件或搜尋關鍵字</small>
        </div>
    `;
}

// Show loading indicator
function showLoading(show) {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.classList.toggle('hidden', !show);
    }
}
