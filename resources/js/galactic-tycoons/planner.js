// ========================================
// GALACTIC TYCOONS - Building Planner
// Plan future buildings and calculate costs
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/galactic-tycoons/buildings';
    const WORKERS_API_URL = '/api/galactic-tycoons/workers';

    let buildings = [];
    let workersData = [];
    let prices = {};
    let itemsData = {}; // Weight lookup by item name
    let plannedBuildings = {};
    let activeTier = 1; // Track active tier
    let plannerMode = 'new'; // 'new' or 'upgrade'
    let buildingConfig = {}; // Current buildings from buildings page

    console.log('🔮 Building Planner loaded');

    // Load items data for weight calculations
    function loadItemsData() {
        if (window.gtItems && Array.isArray(window.gtItems)) {
            window.gtItems.forEach(item => {
                itemsData[item.name] = {
                    tier: item.tier,
                    weight: item.weight
                };
            });
            console.log('Loaded items data for weight calculations:', Object.keys(itemsData).length);
        }
    }

    loadItemsData();

    function loadPrices() {
        const storedPrices = localStorage.getItem('gt_prices_v1');
        if (storedPrices) {
            try {
                prices = JSON.parse(storedPrices);
                console.log('Loaded prices from localStorage:', Object.keys(prices).length, 'items');
            } catch (e) {
                console.error('Failed to parse prices from localStorage:', e);
                prices = {};
            }
        }
    }

    // Load current building config
    function loadBuildingConfig() {
        const stored = localStorage.getItem('gt_building_config_v1');
        if (stored) {
            try {
                buildingConfig = JSON.parse(stored);
                console.log('Loaded building config:', buildingConfig);
            } catch (e) {
                console.error('Failed to parse building config:', e);
                buildingConfig = {};
            }
        }
    }

    loadPrices();
    loadBuildingConfig();

    // Load buildings
    async function loadBuildings() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error('Invalid data format');

            buildings = data;
            console.log('Loaded buildings:', buildings.length);
            renderBuildingList();
            renderUpgradeList();
        } catch (error) {
            console.error('Failed to load buildings:', error);
            const container = document.getElementById('plannerMachineList');
            if (container) {
                container.innerHTML = '<p class="muted">❌ Failed to load buildings</p>';
            }
        }
    }

    // Load workers
    async function loadWorkers() {
        try {
            const response = await fetch(WORKERS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error('Invalid data format');

            workersData = data;
            console.log('Loaded workers:', workersData.length);
        } catch (error) {
            console.error('Failed to load workers:', error);
        }
    }

    // Setup mode selector
    function setupModeSelector() {
        const newBtn = document.getElementById('modeNewBtn');
        const upgradeBtn = document.getElementById('modeUpgradeBtn');
        const newSection = document.getElementById('newBuildingsSection');
        const upgradeSection = document.getElementById('upgradeSection');

        newBtn.addEventListener('click', () => {
            plannerMode = 'new';
            newBtn.classList.add('active');
            upgradeBtn.classList.remove('active');
            newSection.classList.remove('hidden');
            upgradeSection.classList.add('hidden');
            calculateResults();
        });

        upgradeBtn.addEventListener('click', () => {
            plannerMode = 'upgrade';
            upgradeBtn.classList.add('active');
            newBtn.classList.remove('active');
            upgradeSection.classList.remove('hidden');
            newSection.classList.add('hidden');
            calculateResults();
        });
    }

    function renderBuildingList() {
        const container = document.getElementById('plannerMachineList');
        if (!container) return;

        if (buildings.length === 0) {
            container.innerHTML = '<p class="muted">Geen buildings beschikbaar.</p>';
            return;
        }

        // Sort: Housing (providers) first, then by name
        const sortedBuildings = [...buildings].sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;

            // Housing (providers) first
            if (a.workforce_type === 'provider' && b.workforce_type !== 'provider') return -1;
            if (a.workforce_type !== 'provider' && b.workforce_type === 'provider') return 1;

            return a.name.localeCompare(b.name);
        });

        const tiers = [...new Set(sortedBuildings.map(m => m.tier))].sort((a, b) => a - b);

        // Create tier tabs
        const tabsContainer = document.getElementById('plannerTierTabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            tiers.forEach(tier => {
                const isActive = tier === activeTier;
                const tab = document.createElement('div');
                tab.className = `tier-tab ${isActive ? 'active' : ''}`;
                tab.textContent = `Tier ${tier}`;
                tab.addEventListener('click', () => {
                    activeTier = tier;
                    renderBuildingList();
                });
                tabsContainer.appendChild(tab);
            });
        }

        // Filter buildings by active tier
        const tierBuildings = sortedBuildings.filter(m => m.tier === activeTier);

        let html = '<div class="planner-tier-grid">';

        tierBuildings.forEach(building => {
            const planned = plannedBuildings[building.name] || {count: 0, level: 1};

            html += `
                <div class="planner-machine-card" data-building="${building.name}">
                    <div class="machine-info">
                        <strong>${building.name}</strong>
                        <span class="machine-category">${building.category || ''}</span>
                    </div>
                    <div class="machine-inputs">
                        <label>Aantal:</label>
                        <input type="number" min="0" max="10" value="${planned.count}" 
                               class="planner-count-input" data-building="${building.name}">
                        <label>Level:</label>
                        <input type="number" min="1" max="10" value="${planned.level}" 
                               class="planner-level-input" data-building="${building.name}">
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Attach event listeners
        document.querySelectorAll('.planner-count-input, .planner-level-input').forEach(input => {
            input.addEventListener('input', handlePlannerInput);
        });

        calculateResults();
    }

    function renderUpgradeList() {
        const container = document.getElementById('upgradeList');
        if (!container) return;

        const currentBuildings = Object.keys(buildingConfig).filter(name => buildingConfig[name].count > 0);

        if (currentBuildings.length === 0) {
            container.innerHTML = '<p class="muted">Je hebt nog geen buildings. Ga naar de Buildings pagina om buildings toe te voegen.</p>';
            return;
        }

        let html = '<div class="upgrade-list-container">';

        currentBuildings.forEach(buildingName => {
            const config = buildingConfig[buildingName];
            const building = buildings.find(m => m.name === buildingName);
            if (!building) return;

            // Check if any upgrades are planned
            const hasUpgrades = config.levels.some((currentLevel, index) => {
                const targetLevel = (plannedBuildings[`${buildingName}_${index}`] || {}).targetLevel || currentLevel;
                return targetLevel > currentLevel;
            });

            // Calculate total upgrades for this building
            let totalUpgradeLevels = 0;
            config.levels.forEach((currentLevel, index) => {
                const targetLevel = (plannedBuildings[`${buildingName}_${index}`] || {}).targetLevel || currentLevel;
                totalUpgradeLevels += (targetLevel - currentLevel);
            });

            html += `<div class="upgrade-card ${hasUpgrades ? 'has-upgrades' : ''}">
                <div class="upgrade-header">
                    <div class="upgrade-title">
                        <strong>${buildingName}</strong>
                        <span class="tier-badge tier-${building.tier}">Tier ${building.tier}</span>
                    </div>
                    ${hasUpgrades ? `<span class="upgrade-badge">⬆️ ${totalUpgradeLevels} LEVEL${totalUpgradeLevels > 1 ? 'S' : ''} UPGRADE</span>` : '<span class="no-upgrade-badge">Geen upgrade</span>'}
                </div>
                <div class="upgrade-instances">`;

            config.levels.forEach((currentLevel, index) => {
                const targetLevel = (plannedBuildings[`${buildingName}_${index}`] || {}).targetLevel || currentLevel;
                const isUpgrading = targetLevel > currentLevel;
                const levelDiff = targetLevel - currentLevel;

                html += `
                    <div class="upgrade-instance ${isUpgrading ? 'is-upgrading' : ''}">
                        <span class="instance-label">${buildingName} #${index + 1}</span>
                        <div class="upgrade-controls">
                            <span class="current-level">Lvl ${currentLevel}</span>
                            <span class="arrow">${isUpgrading ? '⬆️' : '→'}</span>
                            <input type="number" min="${currentLevel}" max="10" value="${targetLevel}"
                                   class="upgrade-target-input ${isUpgrading ? 'upgrading' : ''}" 
                                   data-building="${buildingName}" 
                                   data-index="${index}"
                                   data-current-level="${currentLevel}"
                                   title="Target level voor ${buildingName} #${index + 1}">
                            ${isUpgrading ? `<span class="upgrade-indicator">+${levelDiff} level${levelDiff > 1 ? 's' : ''}</span>` : ''}
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        html += '</div>';
        container.innerHTML = html;

        // Attach event listeners
        document.querySelectorAll('.upgrade-target-input').forEach(input => {
            input.addEventListener('input', handleUpgradeInput);
        });
    }

    function handleUpgradeInput(e) {
        const buildingName = e.target.dataset.building;
        const index = parseInt(e.target.dataset.index);
        const currentLevel = parseInt(e.target.dataset.currentLevel);
        const targetLevel = Math.max(currentLevel, Math.min(10, parseInt(e.target.value) || currentLevel));

        e.target.value = targetLevel;

        const key = `${buildingName}_${index}`;
        if (!plannedBuildings[key]) {
            plannedBuildings[key] = {};
        }
        plannedBuildings[key] = {
            buildingName,
            index,
            currentLevel,
            targetLevel,
            isUpgrade: true
        };

        // Re-render the upgrade list to update visual indicators
        renderUpgradeList();
        calculateResults();
    }

    function handlePlannerInput(e) {
        const buildingName = e.target.dataset.building;
        const isCount = e.target.classList.contains('planner-count-input');
        const value = parseInt(e.target.value) || (isCount ? 0 : 1);

        if (!plannedBuildings[buildingName]) {
            plannedBuildings[buildingName] = {count: 0, level: 1};
        }

        if (isCount) {
            plannedBuildings[buildingName].count = Math.max(0, Math.min(10, value));
            e.target.value = plannedBuildings[buildingName].count;
        } else {
            plannedBuildings[buildingName].level = Math.max(1, Math.min(10, value));
            e.target.value = plannedBuildings[buildingName].level;
        }

        console.log('Planner input changed:', buildingName, plannedBuildings[buildingName]);
        calculateResults();
    }

    function calculateResults() {
        const statsContainer = document.getElementById('plannerStats');
        if (!statsContainer) return;

        let totalBuildCost = 0;
        let totalWorkforceImpact = 0;
        let totalWeight = 0;
        let buildMaterialsNeeded = {};
        let workforceBreakdown = {providers: 0, consumers: 0};

        console.log('Calculating results for:', plannedBuildings);

        // Calculate for NEW buildings
        Object.entries(plannedBuildings).forEach(([buildingName, plan]) => {
            if (plan.isUpgrade) return; // Handle upgrades separately
            if (!plan.count || plan.count === 0) return;

            const building = buildings.find(m => m.name === buildingName);
            if (!building) {
                console.warn('Building not found:', buildingName);
                return;
            }

            console.log('Processing new building:', buildingName, 'count:', plan.count, 'level:', plan.level);

            // Calculate construction materials with level scaling
            // Formula: base_cost + (level - 1) per resource type
            if (building.ingredients) {
                Object.entries(building.ingredients).forEach(([material, baseAmount]) => {
                    // Each level adds 1 of each resource type
                    const amountPerBuilding = baseAmount + (plan.level - 1);
                    const totalAmount = amountPerBuilding * plan.count;
                    const price = prices[material] || 0;
                    const cost = totalAmount * price;

                    console.log(`  Material ${material}: base=${baseAmount}, per building=${amountPerBuilding}, total=${totalAmount}, cost=${cost}`);

                    totalBuildCost += cost;

                    if (!buildMaterialsNeeded[material]) {
                        buildMaterialsNeeded[material] = {amount: 0, cost: 0, weight: 0};
                    }
                    buildMaterialsNeeded[material].amount += totalAmount;
                    buildMaterialsNeeded[material].cost += cost;

                    // Add weight calculation
                    const itemWeight = itemsData[material]?.weight || 0;
                    const materialWeight = itemWeight * totalAmount;
                    buildMaterialsNeeded[material].weight += materialWeight;
                    totalWeight += materialWeight;
                });
            }

            // Workforce impact
            if (building.workforce && building.workforce.workers) {
                const workers = building.workforce.workers * plan.count * plan.level;
                totalWorkforceImpact += building.workforce_type === 'provider' ? workers : -workers;

                if (building.workforce_type === 'provider') {
                    workforceBreakdown.providers += workers;
                } else {
                    workforceBreakdown.consumers += workers;
                }
            }
        });

        // Calculate for UPGRADES
        Object.entries(plannedBuildings).forEach(([key, plan]) => {
            if (!plan.isUpgrade) return;

            const building = buildings.find(m => m.name === plan.buildingName);
            if (!building) {
                console.warn('Building not found for upgrade:', plan.buildingName);
                return;
            }

            console.log('Processing upgrade:', plan.buildingName, 'from level', plan.currentLevel, 'to', plan.targetLevel);

            // Calculate upgrade costs (difference between levels)
            if (building.ingredients) {
                const currentLevel = plan.currentLevel;
                const targetLevel = plan.targetLevel;

                // Cost difference: sum of costs from current+1 to target level
                for (let level = currentLevel + 1; level <= targetLevel; level++) {
                    Object.entries(building.ingredients).forEach(([material, baseAmount]) => {
                        // Cost for this level: base + (level - 1)
                        const amountForLevel = baseAmount + (level - 1);
                        const price = prices[material] || 0;
                        const cost = amountForLevel * price;
                        totalBuildCost += cost;

                        if (!buildMaterialsNeeded[material]) {
                            buildMaterialsNeeded[material] = {amount: 0, cost: 0, weight: 0};
                        }
                        buildMaterialsNeeded[material].amount += amountForLevel;
                        buildMaterialsNeeded[material].cost += cost;

                        // Add weight
                        const itemWeight = itemsData[material]?.weight || 0;
                        const materialWeight = itemWeight * amountForLevel;
                        buildMaterialsNeeded[material].weight += materialWeight;
                        totalWeight += materialWeight;
                    });
                }

                // Workforce impact from upgrade
                if (building.workforce && building.workforce.workers) {
                    const levelDiff = targetLevel - currentLevel;
                    const workers = building.workforce.workers * levelDiff;
                    totalWorkforceImpact += building.workforce_type === 'provider' ? workers : -workers;

                    if (building.workforce_type === 'provider') {
                        workforceBreakdown.providers += workers;
                    } else {
                        workforceBreakdown.consumers += workers;
                    }
                }
            }
        });

        console.log('Total materials needed:', buildMaterialsNeeded);
        console.log('Total cost:', totalBuildCost, 'Weight:', totalWeight);

        // Render results
        let html = '<div class="planner-summary-grid">';

        // Build cost
        html += `
            <div class="planner-stat">
                <span class="stat-label">💰 Totale Bouwkosten:</span>
                <span class="stat-value">€${totalBuildCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
        `;

        // Total weight for transport
        html += `
            <div class="planner-stat weight-stat">
                <span class="stat-label">📦 Totaal Gewicht:</span>
                <span class="stat-value">${totalWeight.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} t</span>
            </div>
        `;

        // Workforce impact
        const impactClass = totalWorkforceImpact > 0 ? 'positive' : totalWorkforceImpact < 0 ? 'negative' : 'neutral';
        html += `
            <div class="planner-stat ${impactClass}">
                <span class="stat-label">👷 Workforce Impact:</span>
                <span class="stat-value">${totalWorkforceImpact > 0 ? '+' : ''}${totalWorkforceImpact.toLocaleString()}</span>
            </div>
        `;

        // Providers/Consumers breakdown
        html += `
            <div class="planner-stat">
                <span class="stat-label">🏠 Housing Toegevoegd:</span>
                <span class="stat-value">+${workforceBreakdown.providers.toLocaleString()}</span>
            </div>
            <div class="planner-stat">
                <span class="stat-label">🏭 Workers Nodig:</span>
                <span class="stat-value">${workforceBreakdown.consumers.toLocaleString()}</span>
            </div>
        `;

        html += '</div>';

        // Materials breakdown with weight
        if (Object.keys(buildMaterialsNeeded).length > 0) {
            html += '<div class="materials-breakdown">';
            html += '<h4>📦 Benodigde Materialen:</h4>';
            html += '<div class="materials-list">';

            Object.entries(buildMaterialsNeeded)
                .sort((a, b) => b[1].cost - a[1].cost)
                .forEach(([material, data]) => {
                    html += `
                        <div class="material-item">
                            <div class="material-name-weight">
                                <span class="material-name">${material}</span>
                                <span class="material-weight">${data.weight.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    })} t</span>
                            </div>
                            <span class="material-amount">${data.amount.toLocaleString()}x</span>
                            <span class="material-cost">€${data.cost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</span>
                        </div>
                    `;
                });

            html += '</div>';
            html += '</div>';
        }

        // Calculate upkeep for new workers
        if (workforceBreakdown.consumers > 0 && workersData.length > 0) {
            html += '<div class="upkeep-projection">';
            html += '<h4>💸 Geschatte Extra Upkeep (per worker type):</h4>';
            html += '<div class="upkeep-projection-list">';

            workersData.forEach(worker => {
                let totalUpkeep = 0;
                if (worker.consumables) {
                    worker.consumables.forEach(consumable => {
                        const amountPer100 = consumable.amount / 10;
                        const actualAmount = (amountPer100 / 100) * workforceBreakdown.consumers;
                        const price = prices[consumable.material] || 0;
                        totalUpkeep += actualAmount * price;
                    });
                }

                html += `
                    <div class="upkeep-projection-item">
                        <span class="worker-type">${worker.type}:</span>
                        <span class="upkeep-cost">€${totalUpkeep.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}/day</span>
                    </div>
                `;
            });

            html += '</div>';
            html += '</div>';
        }

        statsContainer.innerHTML = html;
    }

    // Initialize
    loadBuildings();
    loadWorkers();
    setupModeSelector();
});
