// ========================================
// GALACTIC TYCOONS - Prices Management
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';

const LS_KEY = 'gt_prices_v1';
// Use Laravel proxy endpoint instead of direct API call to avoid CORS
const API_PROXY_URL = '/api/galactic-tycoons/prices/fetch-from-api';

// Load recipes data (passed from backend)
let recipesData = [];
let itemsData = [];
let activeTier = 1; // Default active tier

const readLS = () => {
    try {
        const v = localStorage.getItem(LS_KEY);
        return v ? JSON.parse(v) : {};
    } catch {
        return {};
    }
};

const writeLS = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data));

// Read prices from localStorage as a map: {name: price}
let pricesMap = readLS();

// Build the full prices list from items.json merged with localStorage
function buildPricesList() {
    if (!itemsData || itemsData.length === 0) {
        return [];
    }

    return itemsData.map(item => ({
        name: item.name,
        tier: item.tier,
        price: pricesMap[item.name] !== undefined ? pricesMap[item.name] : null
    }));
}

// Calculate production cost for an item
function calculateProductionCost(itemName) {
    const itemRecipes = recipesData.filter(r => r.output === itemName);

    if (itemRecipes.length === 0) {
        return null;
    }

    const costs = [];

    for (const recipe of itemRecipes) {
        let totalCost = 0;
        let missingPrices = [];
        let ingredientDetails = [];

        // Skip recipes without ingredients (raw materials)
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
            continue;
        }

        for (const ingredient of recipe.ingredients) {
            const resourceName = ingredient.resource;
            const amount = ingredient.amount;

            if (pricesMap[resourceName] !== undefined && pricesMap[resourceName] !== null) {
                const unitPrice = pricesMap[resourceName];
                const cost = unitPrice * amount;
                totalCost += cost;
                ingredientDetails.push({
                    resource: resourceName,
                    amount: amount,
                    unitPrice: unitPrice,
                    totalCost: cost
                });
            } else {
                missingPrices.push(resourceName);
            }
        }

        const qtyOut = recipe.qtyOut;
        const costPerUnit = qtyOut > 0 ? totalCost / qtyOut : 0;

        costs.push({
            machine: recipe.machine,
            totalCost: totalCost,
            qtyOut: qtyOut,
            costPerUnit: costPerUnit,
            ingredients: ingredientDetails,
            missingPrices: missingPrices,
            craftTime: recipe.craftTime
        });
    }

    // If no valid recipes with costs, return null
    if (costs.length === 0) {
        return null;
    }

    // Sort by cost per unit
    costs.sort((a, b) => a.costPerUnit - b.costPerUnit);

    return {
        min: costs[0] || null,
        max: costs[costs.length - 1] || null,
        allRecipes: costs
    };
}

// Format price with 2 decimals and $ sign
function formatPrice(price) {
    return price !== null ? `$${price.toFixed(2)}` : '-';
}

// Create hover tooltip for production cost (plain text, no HTML)
function createProductionCostTooltip(productionCost) {
    if (!productionCost) return '';

    const {min, max, allRecipes} = productionCost;

    if (!min) return '';

    let tooltip = '';

    if (allRecipes.length === 1) {
        const recipe = allRecipes[0];
        tooltip += `${recipe.machine}\n`;
        tooltip += `Output: ${recipe.qtyOut}x\n`;
        tooltip += `Cost per unit: ${formatPrice(recipe.costPerUnit)}\n\n`;
        tooltip += 'Ingrediënten:\n';
        recipe.ingredients.forEach(ing => {
            tooltip += `  ${ing.amount}x ${ing.resource} @ ${formatPrice(ing.unitPrice)} = ${formatPrice(ing.totalCost)}\n`;
        });
        tooltip += `\nTotal: ${formatPrice(recipe.totalCost)} / ${recipe.qtyOut} = ${formatPrice(recipe.costPerUnit)} per unit`;
        if (recipe.missingPrices.length > 0) {
            tooltip += `\n\nMissing prices: ${recipe.missingPrices.join(', ')}`;
        }
    } else {
        tooltip += `Min Cost Recipe:\n`;
        tooltip += `${min.machine} (${min.qtyOut}x output)\n`;
        tooltip += `Cost: ${formatPrice(min.costPerUnit)} per unit\n`;
        min.ingredients.forEach(ing => {
            tooltip += `  ${ing.amount}x ${ing.resource}\n`;
        });

        tooltip += `\nMax Cost Recipe:\n`;
        tooltip += `${max.machine} (${max.qtyOut}x output)\n`;
        tooltip += `Cost: ${formatPrice(max.costPerUnit)} per unit\n`;
        max.ingredients.forEach(ing => {
            tooltip += `  ${ing.amount}x ${ing.resource}\n`;
        });
    }

    return tooltip;
}

function renderPrices() {
    const tbody = document.querySelector('#pricesTable tbody');
    if (!tbody) {
        console.error('Table tbody not found');
        return;
    }

    const prices = buildPricesList();

    // Get unique tiers and create tabs
    const tiers = [...new Set(prices.map(p => p.tier))].sort((a, b) => a - b);

    // Create or update tier tabs
    let tabsContainer = document.querySelector('.prices-tier-tabs');
    if (!tabsContainer) {
        tabsContainer = document.createElement('div');
        tabsContainer.className = 'prices-tier-tabs tier-tabs';
        const table = document.getElementById('pricesTable');
        table.parentNode.insertBefore(tabsContainer, table);
    }

    tabsContainer.innerHTML = '';
    tiers.forEach(tier => {
        const tab = document.createElement('div');
        tab.className = `tier-tab ${tier === activeTier ? 'active' : ''}`;
        tab.textContent = `Tier ${tier}`;
        tab.addEventListener('click', () => {
            activeTier = tier;
            renderPrices();
        });
        tabsContainer.appendChild(tab);
    });

    // Filter prices by active tier
    const filteredPrices = prices.filter(p => p.tier === activeTier);

    tbody.innerHTML = '';

    filteredPrices.forEach((p, idx) => {
        const tr = document.createElement('tr');

        // Calculate production cost
        const productionCost = calculateProductionCost(p.name);
        let productionCostCell = '';

        if (productionCost && productionCost.min) {
            const min = productionCost.min.costPerUnit;
            const max = productionCost.max.costPerUnit;
            const tooltip = createProductionCostTooltip(productionCost);

            if (productionCost.allRecipes.length === 1) {
                const recipe = productionCost.allRecipes[0];
                // Show cost per unit with output quantity
                productionCostCell = `<span class="production-cost" title="${tooltip}">${formatPrice(min)} (${recipe.qtyOut}x)</span>`;
            } else {
                productionCostCell = `<span class="production-cost" title="${tooltip}">${formatPrice(min)} - ${formatPrice(max)}</span>`;
            }
        } else {
            productionCostCell = '<span class="production-cost-none">-</span>';
        }

        // Don't show tier badge since we have tier tabs now
        tr.innerHTML = `
            <td><span class="item-name">${p.name}</span></td>
            <td><input type="number" step="0.01" value="${p.price ?? ''}" placeholder="Prijs" data-name="${p.name}" data-field="price"></td>
            <td class="production-cost-cell">${productionCostCell}</td>
            <td><button class="btn btn-small btn-danger" data-delete="${p.name}">✕</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Event listeners
    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const name = e.target.dataset.name;
            const value = e.target.value.trim();

            if (value === '') {
                delete pricesMap[name];
            } else {
                pricesMap[name] = parseFloat(value) || 0;
            }

            writeLS(pricesMap);
            renderPrices(); // Re-render to update production costs
        });
    });

    tbody.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.dataset.delete;
            delete pricesMap[name];
            writeLS(pricesMap);
            renderPrices();
        });
    });
}

// Fetch prices from API via Laravel proxy endpoint
async function fetchPricesFromAPI() {
    const statusEl = document.getElementById('apiStatus');

    if (statusEl) {
        statusEl.textContent = '⏳ Ophalen van prijzen...';
        statusEl.className = 'api-status loading';
    }

    try {
        const response = await fetch(API_PROXY_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        // Check if API returned an error (even with 200 status)
        if (!response.ok || data.error) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!data.prices || !Array.isArray(data.prices)) {
            throw new Error('API response bevat geen prijzen data');
        }

        const newPrices = {};
        let updatedCount = 0;

        data.prices.forEach(item => {
            if (item.matName && item.currentPrice !== null && item.currentPrice !== undefined) {
                newPrices[item.matName] = item.currentPrice;
                updatedCount++;
            }
        });

        if (updatedCount === 0) {
            throw new Error('Geen geldige prijzen ontvangen van API');
        }

        // Merge with existing prices (API prices take precedence)
        pricesMap = {...pricesMap, ...newPrices};
        writeLS(pricesMap);
        renderPrices();

        if (statusEl) {
            statusEl.textContent = `✅ ${updatedCount} prijzen succesvol opgehaald van externe API`;
            statusEl.className = 'api-status success';
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'api-status';
            }, 8000);
        }

        console.log(`Successfully loaded ${updatedCount} prices from API`);
        alert(`✅ Prijzen succesvol opgehaald!\n\n${updatedCount} items bijgewerkt.`);

    } catch (error) {
        console.error('Failed to fetch prices from API:', error);

        let errorMessage = error.message;
        let userFriendlyMessage = '';

        // Provide user-friendly error messages
        if (errorMessage.includes('Kan niet verbinden') || errorMessage.includes('Could not resolve host')) {
            userFriendlyMessage = '⚠️ De externe API is momenteel niet bereikbaar.\n\n' +
                'Mogelijke oorzaken:\n' +
                '• De API server is offline\n' +
                '• De domeinnaam is gewijzigd of verlopen\n' +
                '• Er is geen internetverbinding\n\n' +
                '💡 Oplossing: Gebruik de handmatige "Bulk Import" functie hieronder.';
        } else if (errorMessage.includes('API momenteel niet beschikbaar')) {
            userFriendlyMessage = '⚠️ De API reageert maar is momenteel niet beschikbaar.\n\n' +
                '💡 Probeer het later opnieuw of gebruik de handmatige import.';
        } else {
            userFriendlyMessage = `⚠️ Fout bij ophalen van prijzen:\n\n${errorMessage}\n\n` +
                '💡 Gebruik de handmatige "Bulk Import" functie als alternatief.';
        }

        if (statusEl) {
            statusEl.innerHTML = `❌ API niet bereikbaar. <strong>Gebruik handmatige import hieronder.</strong>`;
            statusEl.className = 'api-status error';
        }

        alert(userFriendlyMessage);
    }
}

// Initialize - load recipes from window object (set by blade template)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - initializing prices page');

    if (window.gtRecipes) {
        recipesData = window.gtRecipes;
        console.log('Loaded recipes:', recipesData.length);
    } else {
        console.warn('No recipes data found in window.gtRecipes');
    }

    if (window.gtItems) {
        itemsData = window.gtItems;
        console.log('Loaded items:', itemsData.length);
    } else {
        console.warn('No items data found in window.gtItems');
    }

    // Add event listeners
    const addPriceBtn = document.getElementById('addPrice');
    if (addPriceBtn) {
        addPriceBtn.addEventListener('click', () => {
            console.log('Add price clicked - functionality disabled, use bulk import instead');
            alert('Gebruik de bulk import om prijzen toe te voegen. Alle items uit items.json worden automatisch getoond.');
        });
    }

    const applyPasteBtn = document.getElementById('applyPaste');
    if (applyPasteBtn) {
        applyPasteBtn.addEventListener('click', () => {
            console.log('Apply paste clicked');
            const raw = document.getElementById('pastePrices').value.trim();
            if (!raw) {
                alert('Plak eerst je lijst.');
                return;
            }

            // Parse format with flexible handling:
            // "Hydrogen 64,00$" or "Hydrogen\t64,00$" or "Hydrogen 65,00" or "Argon -"
            // "Iron	210	245,00$" (with stock quantity between name and price)
            const lines = raw.split(/\r?\n/);
            const newPrices = {};
            let skippedCount = 0;
            let updatedCount = 0;

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                // Split by tab or multiple spaces
                const parts = trimmed.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p);
                if (parts.length < 2) continue;

                // Last part should be the price
                const priceToken = parts[parts.length - 1];

                // Check if price is missing/unknown - SKIP these items
                if (priceToken === '-' || priceToken.toLowerCase() === 'n/a') {
                    skippedCount++;
                    continue;
                }

                // Check if second-to-last part is a number without $ (= stock quantity to ignore)
                let nameEndIndex = parts.length - 1;
                if (parts.length >= 3) {
                    const secondToLast = parts[parts.length - 2];
                    // If it's a pure number (no $ or special chars), it's likely the stock quantity
                    if (/^\d+$/.test(secondToLast)) {
                        nameEndIndex = parts.length - 2;
                        console.log(`Ignoring stock quantity ${secondToLast} for item`);
                    }
                }

                // Everything before the price (and optional stock) is the name
                const name = parts.slice(0, nameEndIndex).join(' ').trim();

                if (!name) continue;

                // Clean price: remove $, spaces, convert European format (1.500,00) to standard
                let priceStr = priceToken
                    .replace(/\$/g, '')           // Remove $
                    .replace(/\s/g, '')           // Remove spaces
                    .trim();

                // Check if it's European format (dots as thousands, comma as decimal)
                // Example: 1.500,00 or 64,00
                if (priceStr.includes(',')) {
                    // Remove thousand separators (dots) and replace comma with dot
                    priceStr = priceStr.replace(/\./g, '').replace(',', '.');
                }

                const price = parseFloat(priceStr);

                if (isNaN(price)) {
                    console.warn(`Could not parse price for "${name}": "${priceToken}"`);
                    skippedCount++;
                } else {
                    newPrices[name] = price;
                    updatedCount++;
                    console.log(`Parsed: "${name}" = $${price}`);
                }
            }

            if (updatedCount === 0) {
                alert('Kon geen prijzen parsen. Controleer het formaat.');
                return;
            }

            // Merge with existing prices
            pricesMap = {...pricesMap, ...newPrices};
            writeLS(pricesMap);
            renderPrices();

            let message = `Prijzenlijst bijgewerkt: ${updatedCount} items.`;
            if (skippedCount > 0) {
                message += ` ${skippedCount} items zonder prijs genegeerd.`;
            }
            alert(message);
        });
    } else {
        console.error('Apply paste button not found');
    }

    const clearPricesBtn = document.getElementById('clearPrices');
    if (clearPricesBtn) {
        clearPricesBtn.addEventListener('click', () => {
            console.log('Clear prices clicked');
            if (confirm('Alle prijzen wissen?')) {
                pricesMap = {};
                writeLS(pricesMap);
                renderPrices();
            }
        });
    } else {
        console.error('Clear prices button not found');
    }

    // API fetch button
    const fetchFromAPIBtn = document.getElementById('fetchFromAPI');
    if (fetchFromAPIBtn) {
        fetchFromAPIBtn.addEventListener('click', () => {
            console.log('Fetch from API clicked');
            fetchPricesFromAPI();
        });
    } else {
        console.error('Fetch from API button not found');
    }

    // Initial render
    console.log('Initial render with', itemsData.length, 'items and', Object.keys(pricesMap).length, 'prices in localStorage');

    // Debug: check a few production costs
    if (itemsData.length > 0 && recipesData.length > 0) {
        const testItems = ['Concrete', 'Iron', 'Prefab Kit', 'Glass'];
        testItems.forEach(itemName => {
            const item = itemsData.find(i => i.name === itemName);
            if (item) {
                // Find recipes for this item
                const recipes = recipesData.filter(r => r.output === itemName);
                console.log(`\n=== ${itemName} ===`);
                console.log(`Found ${recipes.length} recipe(s)`);

                recipes.forEach((recipe, idx) => {
                    console.log(`  Recipe ${idx + 1}:`);
                    console.log(`    Machine: ${recipe.machine}`);
                    console.log(`    Ingredients: ${recipe.ingredients.length}`);

                    if (recipe.ingredients.length > 0) {
                        recipe.ingredients.forEach(ing => {
                            const hasPrice = pricesMap[ing.resource] !== undefined;
                            console.log(`      - ${ing.amount}x ${ing.resource} (price: ${hasPrice ? pricesMap[ing.resource] : 'MISSING'})`);
                        });
                    } else {
                        console.log(`      No ingredients (raw material)`);
                    }
                });

                const cost = calculateProductionCost(itemName);
                console.log(`  Result: ${cost ? 'calculated' : 'null'}`);
                if (cost && cost.min) {
                    console.log(`    Cost per unit: $${cost.min.costPerUnit.toFixed(2)}`);
                    console.log(`    Missing prices: ${cost.min.missingPrices.join(', ') || 'none'}`);
                }
            }
        });

        // Show what's in localStorage
        console.log('\n=== localStorage prices ===');
        console.log(pricesMap);

        // Check if price keys match item names
        const priceKeys = Object.keys(pricesMap);
        const itemNames = itemsData.map(i => i.name);
        const matchingKeys = priceKeys.filter(key => itemNames.includes(key));
        console.log(`\nPrice keys matching items: ${matchingKeys.length}/${priceKeys.length}`);

        if (matchingKeys.length < priceKeys.length) {
            const unmatchedKeys = priceKeys.filter(key => !itemNames.includes(key));
            console.warn('Unmatched price keys (first 10):', unmatchedKeys.slice(0, 10));
        }
    }

    renderPrices();
});
