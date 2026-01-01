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

// Huiji Wiki URL mapping by collection type
// Maps collection name to mapping key
const HUIJI_COLLECTION_MAPPING = {
    'Mounts': 'mounts',
    'Minions': 'minions',
    'Blue Mage': null,  // No wiki link for Blue Mage
    'Triple Triad': 'tripleTriad',
    'Orchestrions': 'orchestrions',
    'Emotes': 'emotes',
    'Bardings': 'bardings',
    'Fashion Accessories': 'fashionAccessories',
    'Glasses': 'glasses',
    'Glamour': 'items',
    'Framer Kits': 'items',
    'Hairstyles': 'hairstyles',
};

// Get Huiji Wiki URL for an item
function getHuijiWikiUrl(item, collectionName) {
    if (!huijiMapping) return null;

    const mappingKey = HUIJI_COLLECTION_MAPPING[collectionName];
    if (!mappingKey) return null;

    const scName = huijiMapping[mappingKey]?.[item.Id];
    if (!scName) return null;

    // Mounts don't need 物品: prefix, they use direct mount page
    if (collectionName === 'Mounts') {
        return `https://ff14.huijiwiki.com/wiki/${encodeURIComponent(scName)}`;
    }

    // Everything else uses 物品: prefix
    return `https://ff14.huijiwiki.com/wiki/${encodeURIComponent('物品:' + scName)}`;
}

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

// Collection name translations
const COLLECTION_NAMES = {
    'Glamour': '裝備',
    'Mounts': '坐騎',
    'Minions': '寵物',
    'Emotes': '表情',
    'Hairstyles': '髮型',
    'Triple Triad': '幻卡',
    'Blue Mage': '青魔',
    'Bardings': '鳥鞍',
    'Orchestrions': '樂譜',
    'Framer Kits': '肖像',
    'Fashion Accessories': '時尚',
    'Glasses': '眼鏡'
};

// Create collection tab button
function createTabButton(collection, isActive) {
    const btn = document.createElement('button');
    btn.className = `tab-btn${isActive ? ' active' : ''}`;
    btn.dataset.collection = collection.CollectionName;
    btn.textContent = COLLECTION_NAMES[collection.CollectionName] || collection.CollectionName;
    return btn;
}

// Show About page
function showAboutPage() {
    // Hide sidebar
    document.querySelector('.sidebar').style.display = 'none';

    // Update header
    document.getElementById('items-count').textContent = '關於本站';

    // Hide sort options
    document.querySelector('.sort-options').style.display = 'none';

    // Show about content
    const grid = document.getElementById('items-grid');
    grid.innerHTML = `
        <div class="about-page">
            <h2>FFXIV 繁體中文收藏查詢站</h2>
            <p class="about-description">
                這是一個為繁體中文玩家打造的 Final Fantasy XIV 收藏品查詢工具。<br>
                你可以在這裡查詢坐騎、寵物、幻卡、樂譜、時裝等各種收藏品的取得來源。<br>
                資料來自 <a href="https://ffxivcollect.com" target="_blank" rel="noopener">FFXIV Collect</a>，並翻譯為繁體中文顯示。
            </p>
            <div class="about-links">
                <a href="https://discord.gg/X556xjySDG" target="_blank" rel="noopener">
                    加入 Discord 社群
                </a>
                <a href="https://portaly.cc/thecy" target="_blank" rel="noopener">
                    ☕ 支持作者
                </a>
            </div>
        </div>
    `;
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

// Create patch filter button with expansion icon
function createPatchFilterButton(patchDef, isActive) {
    const btn = document.createElement('button');
    btn.className = `patch-btn${isActive ? ' active' : ''}`;
    btn.dataset.patch = patchDef.label;

    // Add expansion icon if available
    if (patchDef.iconId) {
        const iconUrl = getIconUrl(patchDef.iconId);
        btn.innerHTML = `<img src="${iconUrl}" alt="${patchDef.label}" onerror="this.style.display='none'"><span>${patchDef.label}</span>`;
    } else {
        btn.textContent = patchDef.label;
    }

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

// Clean FFXIV special characters and formatting tags from text
function cleanFFXIVText(text) {
    if (!text) return text;
    // Remove FFXIV special icon characters (U+E000 to U+F8FF Private Use Area)
    let cleaned = text.replace(/[\uE000-\uF8FF]/g, '');
    // Remove FFXIV formatting tags like <colortype(504)>, <edgecolortype(505)>, etc.
    cleaned = cleaned.replace(/<\/?[a-zA-Z]+(\([^)]*\))?>/g, '');
    return cleaned.trim();
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

// Get Huiji Wiki URL for a source (Instance, Achievement, Quest, Container)
// Returns { url, isSearch } - isSearch indicates if this is a search URL (fallback)
function getSourceWikiUrl(source) {
    const sourceType = source.Type;
    const sourceName = source.Name;
    if (!sourceName) return null;

    // Only support these source types
    if (!['Instance', 'Achievement', 'Quest', 'Container'].includes(sourceType)) {
        return null;
    }

    // Clean the name (remove FFXIV special characters)
    const cleanName = cleanFFXIVText(sourceName);
    if (!cleanName) return null;

    // Try exact match first if mapping is available
    if (huijiMapping && huijiMapping.sources) {
        let scName = null;

        switch (sourceType) {
            case 'Instance':
                scName = huijiMapping.sources.instances?.[cleanName];
                if (scName) {
                    return {
                        url: `https://ff14.huijiwiki.com/wiki/${encodeURIComponent(scName)}`,
                        isSearch: false
                    };
                }
                break;
            case 'Achievement':
                // Achievement uses search page
                const achieveMatch = cleanName.match(/^([^:：]+)/);
                if (achieveMatch) {
                    scName = huijiMapping.sources.achievements?.[achieveMatch[1]];
                }
                if (!scName) {
                    scName = huijiMapping.sources.achievements?.[cleanName];
                }
                if (scName) {
                    return {
                        url: `https://ff14.huijiwiki.com/wiki/AchievementSearch?name=${encodeURIComponent(scName)}`,
                        isSearch: true
                    };
                }
                break;
            case 'Quest':
                // Quest uses 任务: prefix
                scName = huijiMapping.sources.quests?.[cleanName];
                if (scName) {
                    return {
                        url: `https://ff14.huijiwiki.com/wiki/${encodeURIComponent('任务:' + scName)}`,
                        isSearch: false
                    };
                }
                break;
            case 'Container':
                scName = huijiMapping.sources.items?.[cleanName];
                if (scName) {
                    return {
                        url: `https://ff14.huijiwiki.com/wiki/${encodeURIComponent('物品:' + scName)}`,
                        isSearch: false
                    };
                }
                break;
        }
    }

    // Fallback: use search URL with cleaned name
    // Extract just the main name part for better search results
    let searchName = cleanName;

    // For achievements, extract just the title (before colon/description)
    if (sourceType === 'Achievement') {
        const match = cleanName.match(/^([^:：]+)/);
        if (match) searchName = match[1];
    }

    return {
        url: `https://ff14.huijiwiki.com/wiki/Special:搜索/${encodeURIComponent(searchName)}`,
        isSearch: true
    };
}

// Render source wiki link button
function renderSourceWikiLink(source) {
    const wikiResult = getSourceWikiUrl(source);
    if (!wikiResult) return '';

    const { url, isSearch } = wikiResult;
    const title = isSearch ? '搜尋 Wiki' : '查看 Wiki';
    const className = isSearch ? 'source-wiki-link search' : 'source-wiki-link';

    // Use search icon for search links, external link icon for direct links
    const icon = isSearch
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
           </svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
           </svg>`;

    return `<a href="${url}" target="_blank" rel="noopener" class="${className}" title="${title}">${icon}</a>`;
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
    const wikiLinkHtml = renderSourceWikiLink(source);

    div.innerHTML = `
        <div class="source-header">
            <img src="${sourceIconUrl}" alt="" onerror="this.style.display='none'">
            <span class="source-name">${displayName}</span>
            ${wikiLinkHtml}
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

// Blue Mage source type icons and translations
const BLUEMAGE_SOURCE_TYPES = {
    'dungeon': { name: '副本', icon: 60414 },
    'trail': { name: '討伐', icon: 61804 },
    'raid': { name: '大型任務', icon: 61802 },
    'map': { name: '野外', icon: 60501 },
    'fate': { name: 'FATE', icon: 60722 },
    'special': { name: '特殊', icon: 61419 },
    'masked': { name: '假面狂歡', icon: 61824 }
};

// Render Blue Mage source from thewakingsands data
function renderBlueMageSource(method) {
    const div = document.createElement('div');
    div.className = 'source-item';

    const typeInfo = BLUEMAGE_SOURCE_TYPES[method.type] || { name: method.type, icon: 60414 };
    const iconUrl = getIconUrl(typeInfo.icon);

    let locationText = '';
    let mobText = '';

    // Handle different method types
    if (method.type === 'special') {
        locationText = method.text || '特殊方式習得';
    } else if (method.type === 'map') {
        locationText = method.map || '';
        if (method.rank) {
            locationText += ` (${method.rank}級狩獵怪)`;
        }
        if (method.position && method.position.length >= 2) {
            locationText += ` (${method.position[0]}, ${method.position[1]})`;
        }
    } else if (method.type === 'fate') {
        locationText = method.map || '';
        if (method.name) {
            locationText += ` - ${method.name}`;
        }
    } else {
        locationText = method.name || '';
    }

    if (method.mob) {
        mobText = `怪物: ${method.mob}`;
    }

    let noteText = '';
    if (method.note) {
        noteText = `<div class="source-note">💡 ${method.note}</div>`;
    }

    div.innerHTML = `
        <div class="source-header">
            <img src="${iconUrl}" alt="" onerror="this.style.display='none'">
            <span class="source-name">${locationText}</span>
            <span class="source-type">${typeInfo.name}</span>
        </div>
        <div class="source-details">
            ${mobText ? `<div>${mobText}</div>` : ''}
            ${method.level ? `<div>Lv.${method.level}</div>` : ''}
            ${noteText}
        </div>
    `;

    return div;
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
