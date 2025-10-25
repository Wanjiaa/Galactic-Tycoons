// ========================================
// GALACTIC TYCOONS - Calculator
// Advanced calculator with dependency tree resolution
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';

// ========================================
// GALACTIC TYCOONS - Cost Calculator
// Using data from window.gtRecipes (passed from backend)
// Multi-item selection + Market cost comparison
// ========================================

const LS_KEYS = {
    prices: 'gt_prices_v1',
    enabledMachines: 'gt_enabled_machines_v1',
    state: 'gt_state_v1',
    selectedItems: 'gt_selected_items_v1'
};

const readLS = (k, fb) => {
    try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : fb;
    } catch {
        return fb;
    }
};

const writeLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// Load prices from localStorage (same format as prices page)
let pricesMap = readLS(LS_KEYS.prices, {});
let recipes = [];
let machineConfig = readLS('gt_building_config_v1', {});
let enabledMachines = readLS(LS_KEYS.enabledMachines, []);
let haveMap = {};
let selectedItems = readLS(LS_KEYS.selectedItems, []); // Array of {name: string, quantity: number}
let itemsData = {}; // Weight lookup by item name

const itemName = document.getElementById('itemName');
const itemOptions = document.getElementById('itemOptions');
const qtyMake = document.getElementById('qtyMake');
const selectedItemsList = document.getElementById('selectedItemsList');
const resultTBody = document.querySelector('#resultTable tbody');
const totalToBuy = document.getElementById('totalToBuy');
const totalCraft = document.getElementById('totalCraft');
const totalMarket = document.getElementById('totalMarket');
const savingsAmount = document.getElementById('savingsAmount');
const totalCost = document.getElementById('totalCost');
const totalTime = document.getElementById('totalTime');
const totalTimeRow = document.getElementById('totalTimeRow');
const activeRecipeBox = document.getElementById('activeRecipeBox');

// Load items data for weight calculations
function loadItemsData() {
    if (window.gtItems && Array.isArray(window.gtItems)) {
        window.gtItems.forEach(item => {
            itemsData[item.name] = {
                tier: item.tier,
                weight: item.weight || 0
            };
        });
        console.log('Loaded items data for weight calculations:', Object.keys(itemsData).length);
    }
}

// Initialize - load recipes from window object (set by blade template)
document.addEventListener('DOMContentLoaded', () => {
    console.log('Calculator initialized');

    loadItemsData();

    if (window.gtRecipes) {
        recipes = window.gtRecipes;
        console.log('Loaded recipes:', recipes.length);
    } else {
        console.warn('No recipes data found in window.gtRecipes');
        recipes = [];
    }

    refreshItemOptions();
    renderSelectedItems();
    compute();
});

function round4(v) {
    return Math.round(Number(v) || 0).toLocaleString();
}

function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function priceLookup(name) {
    const price = pricesMap[name];
    return (price !== undefined && price !== null && !isNaN(price)) ? Number(price) : null;
}

function refreshItemOptions() {
    const names = Array.from(new Set(recipes.map(r => (r.output || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    itemOptions.innerHTML = names.map(n => `<option value="${n}"></option>`).join('');
}

// Add item to selected list
document.getElementById('addItemBtn').addEventListener('click', () => {
    const prod = (itemName.value || '').trim();
    const qty = Math.max(1, Math.floor(Number(qtyMake.value) || 1));

    if (!prod) return;

    // Check if item already exists
    const existingIndex = selectedItems.findIndex(item => item.name.toLowerCase() === prod.toLowerCase());

    if (existingIndex >= 0) {
        // Update quantity
        selectedItems[existingIndex].quantity += qty;
    } else {
        // Add new item
        selectedItems.push({name: prod, quantity: qty});
    }

    writeLS(LS_KEYS.selectedItems, selectedItems);
    itemName.value = '';
    qtyMake.value = 1;
    renderSelectedItems();
    compute();
});

// Render selected items list
function renderSelectedItems() {
    if (!selectedItemsList) return;

    if (selectedItems.length === 0) {
        selectedItemsList.innerHTML = '<p class="muted">Geen items geselecteerd. Voeg items toe om kosten te berekenen.</p>';
        return;
    }

    let html = '<div class="selected-items-grid">';

    selectedItems.forEach((item, index) => {
        // Get weight for this item
        const itemWeight = itemsData[item.name]?.weight || 0;
        const totalItemWeight = itemWeight * item.quantity;

        html += `
            <div class="selected-item-card">
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <span class="quantity">${item.quantity}x</span>
                    ${itemWeight > 0 ? `<span class="item-weight">📦 ${totalItemWeight.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} t</span>` : ''}
                </div>
                <div class="item-actions">
                    <input type="number" min="1" value="${item.quantity}" 
                           class="qty-input" data-index="${index}">
                    <button class="btn-icon btn-danger" data-index="${index}" title="Verwijder">✕</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    selectedItemsList.innerHTML = html;

    // Attach event listeners
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const newQty = Math.max(1, Math.floor(Number(e.target.value) || 1));
            selectedItems[index].quantity = newQty;
            writeLS(LS_KEYS.selectedItems, selectedItems);
            renderSelectedItems();
            compute();
        });
    });

    document.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            selectedItems.splice(index, 1);
            writeLS(LS_KEYS.selectedItems, selectedItems);
            renderSelectedItems();
            compute();
        });
    });
}

function compute() {
    // Check if we're doing a full compute or just updating values
    const isInitialCompute = resultTBody.children.length === 0 ||
        resultTBody.children[0]?.colSpan === 7;

    let totalBuy = 0, totalCraftCost = 0, totalMarketCost = 0, totalCraftTime = 0, totalWeight = 0;
    const baseResourceMap = {};
    const outputsSet = new Set(recipes.map(r => (r.output || '').toLowerCase()));

    if (selectedItems.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8" class="muted text-center">Voeg items toe om kosten te berekenen</td>';
        resultTBody.innerHTML = '';
        resultTBody.appendChild(tr);
        totalToBuy.textContent = '0';
        totalCraft.textContent = '$0';
        totalMarket.textContent = '$0';
        savingsAmount.textContent = '$0';

        // Update weight display
        const totalWeightEl = document.getElementById('totalWeight');
        if (totalWeightEl) totalWeightEl.textContent = '0 t';

        return;
    }

    // Process each selected item
    selectedItems.forEach(selectedItem => {
        const prod = selectedItem.name;
        const qMake = selectedItem.quantity;

        // Find available recipes
        const availableRecipes = recipes.filter(r =>
            (r.output || '').toLowerCase() === prod.toLowerCase() &&
            (enabledMachines.includes(r.machine) || !r.machine)
        );

        if (availableRecipes.length === 0) {
            // Can't craft - add market cost if available
            const marketPrice = priceLookup(prod);
            if (marketPrice !== null) {
                totalMarketCost += marketPrice * qMake;
            }
            return;
        }

        const variant = availableRecipes[0];
        const ings = variant.ingredients || [];
        const batchesNeeded = Math.ceil(qMake / (variant.qtyOut || 1));

        // Calculate crafting time
        const craftTime = (variant.craftTime || 0) * batchesNeeded;
        totalCraftTime += craftTime;

        // Add market cost for this output item
        const marketPrice = priceLookup(prod);
        if (marketPrice !== null) {
            totalMarketCost += marketPrice * qMake;
        }

        // Expand ingredients recursively
        function expandIngredient(name, qtyNeeded, depth = 0) {
            const lowerName = name.toLowerCase();
            const isIntermediate = outputsSet.has(lowerName);

            const availableRecipe = recipes.find(r =>
                (r.output || '').toLowerCase() === lowerName &&
                (enabledMachines.includes(r.machine) || !r.machine)
            );

            if (isIntermediate && availableRecipe && depth < 10) {
                const subIngs = availableRecipe.ingredients || [];
                const batchesNeeded = Math.ceil(qtyNeeded / (availableRecipe.qtyOut || 1));
                const subCraftTime = (availableRecipe.craftTime || 0) * batchesNeeded;
                totalCraftTime += subCraftTime;

                const results = [];
                for (const subIng of subIngs) {
                    const subQty = (subIng.amount || 0) * batchesNeeded;
                    results.push(...expandIngredient(subIng.resource, subQty, depth + 1));
                }
                return results;
            } else {
                return [{ingredient: name, need: Math.ceil(qtyNeeded)}];
            }
        }

        // Aggregate base resources
        for (const ing of ings) {
            const qtyNeeded = (ing.amount || 0) * batchesNeeded;
            const expanded = expandIngredient(ing.resource, qtyNeeded);
            for (const item of expanded) {
                const key = item.ingredient.toLowerCase();
                if (!baseResourceMap[key]) {
                    baseResourceMap[key] = {ingredient: item.ingredient, need: 0};
                }
                baseResourceMap[key].need += item.need;
            }
        }
    });

    const baseRows = Object.values(baseResourceMap);

    // Calculate costs and weight
    for (const r of baseRows) {
        r.need = Math.ceil(r.need);
        const have = Math.floor(Number(haveMap[r.ingredient] || 0));
        const toBuy = Math.max(0, r.need - have);
        const price = priceLookup(r.ingredient);
        const sub = price !== null ? toBuy * price : 0;
        const marketCost = price !== null ? r.need * price : 0;

        // Add weight calculation
        const itemWeight = itemsData[r.ingredient]?.weight || 0;
        const resourceWeight = itemWeight * r.need;

        r.have = have;
        r.toBuy = toBuy;
        r.price = price;
        r.sub = sub;
        r.marketCost = marketCost;
        r.weight = resourceWeight;

        totalBuy += toBuy;
        totalCraftCost += sub;
        totalWeight += resourceWeight;
    }

    // If this is not initial compute, just update the values without re-rendering
    if (!isInitialCompute && resultTBody.children.length === baseRows.length) {
        baseRows.sort((a, b) => a.ingredient.localeCompare(b.ingredient));

        // Update existing rows
        Array.from(resultTBody.children).forEach((tr, index) => {
            const r = baseRows[index];
            if (!r) return;

            const cells = tr.children;
            // Update: Nodig, Te Kopen, Weight, Craft Kost, Market Kost
            cells[1].textContent = round4(r.need);
            // cells[2] is the input - don't touch it!
            cells[3].textContent = round4(r.toBuy);
            cells[4].textContent = r.weight.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }) + ' t';
            cells[5].textContent = r.price !== null ? '$' + r.price.toFixed(2) : '<span class="muted">onbekend</span>';
            cells[6].textContent = r.price !== null ? '$' + r.sub.toFixed(2) : '$0';

            const savings = r.price !== null ? (r.marketCost - r.sub) : 0;
            const savingsClass = savings > 0 ? 'positive' : savings < 0 ? 'negative' : '';
            cells[7].className = savingsClass;
            cells[7].textContent = r.price !== null ? '$' + r.marketCost.toFixed(2) : '$0';
        });
    } else {
        // Full re-render (initial load or items changed)
        resultTBody.innerHTML = '';
        baseRows.sort((a, b) => a.ingredient.localeCompare(b.ingredient));

        for (const r of baseRows) {
            const tr = document.createElement('tr');
            const savings = r.price !== null ? (r.marketCost - r.sub) : 0;
            const savingsClass = savings > 0 ? 'positive' : savings < 0 ? 'negative' : '';

            tr.innerHTML = `
                <td>${r.ingredient}</td>
                <td>${round4(r.need)}</td>
                <td><input class="have-input" type="number" step="1" min="0" value="${r.have}" data-ingredient="${r.ingredient}"></td>
                <td>${round4(r.toBuy)}</td>
                <td>${r.weight.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })} t</td>
                <td>${r.price !== null ? '$' + r.price.toFixed(2) : '<span class="muted">onbekend</span>'}</td>
                <td>${r.price !== null ? '$' + r.sub.toFixed(2) : '<span class="muted">$0</span>'}</td>
                <td class="${savingsClass}">${r.price !== null ? '$' + r.marketCost.toFixed(2) : '<span class="muted">$0</span>'}</td>
            `;

            const inp = tr.querySelector('input.have-input');
            inp.addEventListener('input', () => {
                haveMap[r.ingredient] = Math.floor(Number(inp.value) || 0);
                compute(); // Will now do partial update
            });

            resultTBody.appendChild(tr);
        }
    }

    const savings = totalMarketCost - totalCraftCost;

    totalToBuy.textContent = round4(totalBuy);
    totalCraft.textContent = '$' + totalCraftCost.toFixed(2);
    totalMarket.textContent = '$' + totalMarketCost.toFixed(2);
    savingsAmount.textContent = (savings >= 0 ? '+$' : '-$') + Math.abs(savings).toFixed(2);

    // Update weight display
    const totalWeightEl = document.getElementById('totalWeight');
    if (totalWeightEl) {
        totalWeightEl.textContent = totalWeight.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + ' t';
    }

    // Color code savings
    const savingsEl = document.getElementById('savingsRow');
    if (savingsEl) {
        savingsEl.className = savings > 0 ? 'positive' : savings < 0 ? 'negative' : '';
    }

    if (totalCraftTime > 0) {
        totalTimeRow.style.display = '';
        totalTime.textContent = formatTime(Math.round(totalCraftTime));
    }

    writeLS(LS_KEYS.state, {haveMap});
}

document.getElementById('computeBtn').addEventListener('click', compute);

document.getElementById('resetHaveBtn').addEventListener('click', () => {
    haveMap = {};
    compute();
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
    selectedItems = [];
    writeLS(LS_KEYS.selectedItems, selectedItems);
    renderSelectedItems();
    compute();
});

// Listen for storage changes
window.addEventListener('storage', (e) => {
    if (e.key === LS_KEYS.prices) {
        pricesMap = readLS(LS_KEYS.prices, {});
        compute();
    }
    if (e.key === LS_KEYS.enabledMachines) {
        enabledMachines = readLS(LS_KEYS.enabledMachines, []);
        compute();
    }
});

// Initialize
async function init() {
    const st = readLS(LS_KEYS.state, {});
    haveMap = st.haveMap || {};
    compute();
}

init();
