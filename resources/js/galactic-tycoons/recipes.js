// ========================================
// GALACTIC TYCOONS - Recipes Management
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';

const API_URL = '/api/galactic-tycoons/recipes';
const MACHINES_API_URL = '/api/galactic-tycoons/machines';

let recipes = [];
let availableMachines = [];

// Fetch machines from server
async function loadMachines() {
    try {
        const response = await fetch(MACHINES_API_URL);
        const data = await response.json();

        if (Array.isArray(data)) {
            availableMachines = data;
            console.log('Loaded machines for dropdown:', availableMachines.length);
        } else {
            console.warn('Failed to load machines, using empty array');
            availableMachines = [];
        }
    } catch (error) {
        console.error('Failed to load machines:', error);
        availableMachines = [];
    }
}

// Fetch recipes from server
async function loadRecipes() {
    try {
        const response = await fetch(API_URL);
        recipes = await response.json();
        renderRecipes();
    } catch (error) {
        console.error('Failed to load recipes:', error);
        recipes = [];
        renderRecipes();
    }
}

// Save recipes to server
async function saveRecipes() {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({recipes})
        });
    } catch (error) {
        console.error('Failed to save recipes:', error);
    }
}

// Convert ingredients array to display string
function ingredientsToString(ingredients) {
    if (!ingredients || !Array.isArray(ingredients)) return '';
    return ingredients.map(ing => `${ing.amount} ${ing.resource}`).join(', ');
}

// Convert display string to ingredients array
function stringToIngredients(text) {
    if (!text) return [];
    return text.split(',').map(s => s.trim()).filter(Boolean).map(seg => {
        const m = seg.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
        if (!m) return null;
        return {resource: m[2].trim(), amount: parseFloat(m[1])};
    }).filter(Boolean);
}

// Create machine dropdown HTML
function createMachineDropdown(selectedMachine, idx) {
    const sortedMachines = [...availableMachines].sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
    });

    let options = '<option value="">-- Kies machine --</option>';

    // Group by tier
    const tiers = [...new Set(sortedMachines.map(m => m.tier))];

    tiers.forEach(tier => {
        const tierMachines = sortedMachines.filter(m => m.tier === tier);
        options += `<optgroup label="Tier ${tier}">`;

        tierMachines.forEach(machine => {
            const selected = machine.name === selectedMachine ? 'selected' : '';
            const category = machine.category ? ` (${machine.category})` : '';
            options += `<option value="${machine.name}" ${selected}>${machine.name}${category}</option>`;
        });

        options += '</optgroup>';
    });

    return `<select data-idx="${idx}" data-field="machine">${options}</select>`;
}

function renderRecipes() {
    const tbody = document.querySelector('#recipesTable tbody');
    tbody.innerHTML = '';

    recipes.forEach((r, idx) => {
        const ingredientsStr = ingredientsToString(r.ingredients);
        const machineDropdown = createMachineDropdown(r.machine, idx);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input value="${r.output || ''}" placeholder="Output naam" data-idx="${idx}" data-field="output"></td>
            <td><input type="number" step="0.0001" value="${r.qtyOut ?? ''}" placeholder="1" data-idx="${idx}" data-field="qtyOut"></td>
            <td><input type="number" step="1" value="${r.craftTime ?? ''}" placeholder="Timer (sec)" data-idx="${idx}" data-field="craftTime"></td>
            <td>${machineDropdown}</td>
            <td><input value="${ingredientsStr}" placeholder="2 iron, 10 concrete" data-idx="${idx}" data-field="ingredients"></td>
            <td><button class="btn btn-small btn-danger" data-delete="${idx}">✕</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Event listeners for inputs
    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const field = e.target.dataset.field;

            if (field === 'qtyOut' || field === 'craftTime') {
                recipes[idx][field] = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
            } else if (field === 'ingredients') {
                recipes[idx][field] = stringToIngredients(e.target.value);
            } else {
                recipes[idx][field] = e.target.value.trim();
            }
            saveRecipes();
        });
    });

    // Event listeners for selects (machine dropdown)
    tbody.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const field = e.target.dataset.field;
            recipes[idx][field] = e.target.value;
            saveRecipes();
        });
    });

    tbody.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.delete);
            recipes.splice(idx, 1);
            saveRecipes();
            renderRecipes();
        });
    });
}

document.getElementById('addRecipe').addEventListener('click', () => {
    recipes.push({output: '', qtyOut: 1, craftTime: 0, machine: '', ingredients: []});
    saveRecipes();
    renderRecipes();
});

document.getElementById('clearRecipes').addEventListener('click', () => {
    if (confirm('Alle recipes wissen?')) {
        recipes = [];
        saveRecipes();
        renderRecipes();
    }
});

document.getElementById('seedRecipes').addEventListener('click', async () => {
    recipes = [
        {
            output: 'Iron', qtyOut: 3, craftTime: 10, machine: 'Smelter', ingredients: [
                {resource: 'Iron Ore', amount: 5}, {resource: 'Oxygen', amount: 4}
            ]
        },
        {
            output: 'Steel', qtyOut: 2, craftTime: 15, machine: 'Smelter', ingredients: [
                {resource: 'Iron', amount: 3}, {resource: 'Carbon', amount: 1}
            ]
        },
        {
            output: 'Glass', qtyOut: 5, craftTime: 8, machine: 'Refinery', ingredients: [
                {resource: 'Sand', amount: 10}
            ]
        }
    ];
    await saveRecipes();
    renderRecipes();
});

// Initialize - load machines first, then recipes
async function init() {
    await loadMachines();
    await loadRecipes();
}

init();
