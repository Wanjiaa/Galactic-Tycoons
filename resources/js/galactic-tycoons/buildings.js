// ========================================
// GALACTIC TYCOONS - Buildings Management
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/galactic-tycoons/buildings';
    const WORKERS_API_URL = '/api/galactic-tycoons/workers';

    let buildings = [];
    let workersData = [];
    let prices = {};
    let activeTier = 1; // Track active tier

    // New structure: { "Smelter": { count: 2, levels: [3, 2] }, ... }
    let buildingConfig = JSON.parse(localStorage.getItem('gt_building_config_v1') || '{}');

    console.log('Buildings page loaded. Building config:', buildingConfig);

    // Migrate old enabled machines format to new format
    const oldEnabled = JSON.parse(localStorage.getItem('gt_enabled_machines_v1') || '[]');
    if (oldEnabled.length > 0 && Object.keys(buildingConfig).length === 0) {
        console.log('Migrating old format to new format...');
        oldEnabled.forEach(name => {
            buildingConfig[name] = {count: 1, levels: [1]};
        });
        saveBuildingConfig();
    }

    // Load prices from localStorage
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

    loadPrices();

    function saveBuildingConfig() {
        localStorage.setItem('gt_building_config_v1', JSON.stringify(buildingConfig));

        // Also maintain old format for backwards compatibility with calculator
        const enabledBuildings = Object.keys(buildingConfig).filter(name =>
            buildingConfig[name].count > 0
        );
        localStorage.setItem('gt_enabled_machines_v1', JSON.stringify(enabledBuildings));

        console.log('Saved building config:', buildingConfig);
    }

    // Fetch buildings from server
    async function loadBuildings() {
        try {
            console.log('Fetching buildings from API:', API_URL);
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error + ' (path: ' + (data.path || 'unknown') + ')');
            }

            if (!Array.isArray(data)) {
                throw new Error('API returned invalid data format');
            }

            buildings = data;
            console.log('Loaded buildings:', buildings.length);
            renderBuildings();
        } catch (error) {
            console.error('Failed to load buildings:', error);
            const container = document.getElementById('buildingsList');
            if (container) {
                container.innerHTML = '<p class="muted">❌ Fout bij laden van buildings: ' + error.message + '</p>';
            }
        }
    }

    function renderBuildings() {
        const container = document.getElementById('buildingsList');

        if (!container) {
            console.error('❌ buildingsList container not found!');
            return;
        }

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

        container.innerHTML = '';

        const tiers = [...new Set(sortedBuildings.map(m => m.tier))];

        // Create tier tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tier-tabs';

        tiers.forEach(tier => {
            const isActive = tier === activeTier;
            const tab = document.createElement('div');
            tab.className = `tier-tab ${isActive ? 'active' : ''}`;
            tab.textContent = `Tier ${tier}`;
            tab.addEventListener('click', () => {
                activeTier = tier;
                renderBuildings(); // Re-render buildings to show active tier
            });
            tabsContainer.appendChild(tab);
        });

        container.appendChild(tabsContainer);

        // Filter buildings by active tier
        const tierBuildings = sortedBuildings.filter(m => m.tier === activeTier);

        if (tierBuildings.length === 0) {
            container.innerHTML += '<p class="muted">Geen buildings beschikbaar voor deze tier.</p>';
            return;
        }

        const tierGrid = document.createElement('div');
        tierGrid.className = 'machines-grid';

        tierBuildings.forEach(building => {
            const config = buildingConfig[building.name] || {count: 0, levels: []};

            const card = document.createElement('div');
            card.className = 'machine-card';
            if (config.count > 0) card.classList.add('active');

            // Build workforce info
            let workforceInfo = '';
            if (building.workforce_type === 'provider' && building.workforce) {
                const badges = [];
                if (building.workforce.workers) badges.push(`<span class="workforce-badge provider">+${building.workforce.workers} Workers</span>`);
                workforceInfo = badges.join(' ');
            } else if (building.workforce_type === 'consumer' && building.workforce) {
                const badges = [];
                if (building.workforce.workers) badges.push(`<span class="workforce-badge consumer">${building.workforce.workers} Workers</span>`);
                workforceInfo = badges.join(' ');
            }

            // Build category badge
            const categoryBadge = building.category ? `<span class="category-badge">${building.category}</span>` : '';

            // Build levels display
            let levelsDisplay = '';
            if (config.count > 0) {
                const levelTags = config.levels.map((lvl, idx) =>
                    `<span class="level-tag">Lvl ${lvl}</span>`
                ).join(' ');
                levelsDisplay = `<div class="levels-display">${levelTags}</div>`;
            }

            card.innerHTML = `
                <div class="machine-header">
                    <span class="machine-name">${building.name}</span>
                    ${categoryBadge}
                </div>
                ${workforceInfo}
                ${levelsDisplay}
                <div class="machine-controls">
                    <div class="control-group">
                        <label>Aantal:</label>
                        <input type="number" min="0" max="10" step="1" value="${config.count}" 
                               class="count-input" data-building="${building.name}">
                    </div>
                    <div class="levels-inputs" data-building="${building.name}">
                        ${renderLevelInputs(building.name, config)}
                    </div>
                </div>
            `;

            tierGrid.appendChild(card);
        });

        container.appendChild(tierGrid);

        attachEventListeners();
        updateWorkforceCalculator(); // Initialize workforce calculator
    }

    function renderLevelInputs(buildingName, config) {
        if (config.count === 0) {
            return '<p class="muted" style="font-size: 12px; margin: 8px 0 0 0;">Stel eerst aantal in</p>';
        }

        let html = '<div class="levels-grid">';
        for (let i = 0; i < config.count; i++) {
            const level = config.levels[i] || 1;
            html += `
                <div class="level-input-group">
                    <label>#${i + 1} Level:</label>
                    <input type="number" min="1" max="10" step="1" value="${level}" 
                           class="level-input" data-building="${buildingName}" data-index="${i}">
                </div>
            `;
        }
        html += '</div>';
        return html;
    }

    function attachEventListeners() {
        // Count inputs
        document.querySelectorAll('.count-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const buildingName = e.target.dataset.building;
                const count = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                e.target.value = count;

                if (!buildingConfig[buildingName]) {
                    buildingConfig[buildingName] = {count: 0, levels: []};
                }

                const oldCount = buildingConfig[buildingName].count;
                buildingConfig[buildingName].count = count;

                // Adjust levels array
                if (count > oldCount) {
                    // Add new levels (default to 1)
                    for (let i = oldCount; i < count; i++) {
                        buildingConfig[buildingName].levels.push(1);
                    }
                } else if (count < oldCount) {
                    // Remove excess levels
                    buildingConfig[buildingName].levels = buildingConfig[buildingName].levels.slice(0, count);
                }

                if (count === 0) {
                    delete buildingConfig[buildingName];
                }

                saveBuildingConfig();
                renderBuildings(); // Re-render to show/hide level inputs
                updateWorkforceCalculator(); // Update workforce stats
                renderUpkeepCalculator(); // Update upkeep calculator
            });
        });

        // Level inputs
        document.querySelectorAll('.level-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const buildingName = e.target.dataset.building;
                const index = parseInt(e.target.dataset.index);
                const level = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                e.target.value = level;

                if (buildingConfig[buildingName]) {
                    buildingConfig[buildingName].levels[index] = level;
                    saveBuildingConfig();
                    renderBuildings(); // Re-render to update level tags
                    updateWorkforceCalculator(); // Update workforce stats
                    renderUpkeepCalculator(); // Update upkeep calculator
                }
            });
        });
    }

    // Calculate and update workforce statistics
    function updateWorkforceCalculator() {
        let totalProvided = 0;
        let totalNeeded = 0;
        const breakdown = {
            providers: [],
            consumers: []
        };

        // Calculate workforce for each building
        Object.keys(buildingConfig).forEach(buildingName => {
            const config = buildingConfig[buildingName];
            if (config.count === 0) return;

            const building = buildings.find(m => m.name === buildingName);
            if (!building || !building.workforce || !building.workforce.workers) return;

            const baseWorkers = building.workforce.workers;

            // Calculate total workers for all instances with their levels
            let totalWorkers = 0;
            config.levels.forEach(level => {
                // Workforce scales with level (simple linear scaling for now)
                totalWorkers += baseWorkers * level;
            });

            if (building.workforce_type === 'provider') {
                totalProvided += totalWorkers;
                breakdown.providers.push({
                    name: buildingName,
                    count: config.count,
                    workers: totalWorkers,
                    levels: config.levels
                });
            } else if (building.workforce_type === 'consumer') {
                totalNeeded += totalWorkers;
                breakdown.consumers.push({
                    name: buildingName,
                    count: config.count,
                    workers: totalWorkers,
                    levels: config.levels
                });
            }
        });

        const balance = totalProvided - totalNeeded;
        const efficiency = totalNeeded > 0 ? Math.min(100, Math.floor((totalProvided / totalNeeded) * 100)) : 100;

        // Update display
        document.getElementById('workforceAvailable').textContent = totalProvided.toLocaleString();
        document.getElementById('workforceNeeded').textContent = totalNeeded.toLocaleString();
        document.getElementById('workforceBalanceValue').textContent = balance.toLocaleString();
        document.getElementById('workforceEfficiencyValue').textContent = efficiency + '%';

        // Update balance styling
        const balanceEl = document.getElementById('workforceBalance');
        balanceEl.classList.remove('positive', 'negative', 'neutral');
        if (balance > 0) {
            balanceEl.classList.add('positive');
        } else if (balance < 0) {
            balanceEl.classList.add('negative');
        } else {
            balanceEl.classList.add('neutral');
        }

        // Update efficiency styling
        const efficiencyEl = document.getElementById('workforceEfficiency');
        efficiencyEl.classList.remove('excellent', 'good', 'warning', 'critical');
        if (efficiency >= 100) {
            efficiencyEl.classList.add('excellent');
        } else if (efficiency >= 80) {
            efficiencyEl.classList.add('good');
        } else if (efficiency >= 50) {
            efficiencyEl.classList.add('warning');
        } else {
            efficiencyEl.classList.add('critical');
        }

        // Render breakdown
        renderWorkforceBreakdown(breakdown);
    }

    function renderWorkforceBreakdown(breakdown) {
        const container = document.getElementById('workforceBreakdown');

        if (breakdown.providers.length === 0 && breakdown.consumers.length === 0) {
            container.innerHTML = '<p class="muted" style="font-size: 13px; margin-top: 16px;">Selecteer buildings om workforce te zien</p>';
            return;
        }

        let html = '<div class="breakdown-section">';

        if (breakdown.providers.length > 0) {
            html += '<h4 class="breakdown-title">🏠 Housing (Providers)</h4>';
            breakdown.providers.forEach(item => {
                const levelText = item.levels.length > 1
                    ? `${item.count}x (levels: ${item.levels.join(', ')})`
                    : `${item.count}x (level ${item.levels[0]})`;
                html += `
                    <div class="breakdown-item provider">
                        <span class="item-name">${item.name}</span>
                        <span class="item-detail">${levelText}</span>
                        <span class="item-workers">+${item.workers.toLocaleString()}</span>
                    </div>
                `;
            });
        }

        if (breakdown.consumers.length > 0) {
            html += '<h4 class="breakdown-title">🏭 Buildings (Consumers)</h4>';
            breakdown.consumers.forEach(item => {
                const levelText = item.levels.length > 1
                    ? `${item.count}x (levels: ${item.levels.join(', ')})`
                    : `${item.count}x (level ${item.levels[0]})`;
                html += `
                    <div class="breakdown-item consumer">
                        <span class="item-name">${item.name}</span>
                        <span class="item-detail">${levelText}</span>
                        <span class="item-workers">${item.workers.toLocaleString()}</span>
                    </div>
                `;
            });
        }

        html += '</div>';
        container.innerHTML = html;
    }

    // Initialize
    console.log('🚀 Initializing buildings page...');
    loadBuildings();
    loadWorkers();

    // ========================================
    // WORKER UPKEEP CALCULATOR
    // ========================================
    async function loadWorkers() {
        try {
            console.log('Fetching workers from API:', WORKERS_API_URL);
            const response = await fetch(WORKERS_API_URL);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            if (!Array.isArray(data)) {
                throw new Error('API returned invalid data format');
            }

            workersData = data;
            console.log('Loaded workers:', workersData.length);
            renderUpkeepCalculator();
        } catch (error) {
            console.error('Failed to load workers:', error);
            const container = document.getElementById('upkeepSummaryGrid');
            if (container) {
                container.innerHTML = '<p class="muted">❌ Failed to load worker data</p>';
            }
        }
    }

    function renderUpkeepCalculator() {
        const container = document.getElementById('upkeepSummaryGrid');
        if (!container) return;

        // Group workers by worker_index (0, 1, 2, 3)
        const workersByIndex = {};

        Object.keys(buildingConfig).forEach(buildingName => {
            const config = buildingConfig[buildingName];
            if (config.count === 0) return;

            const building = buildings.find(m => m.name === buildingName);
            if (!building || !building.workforce || !building.workforce.workers) return;

            // Only count consumers, NOT providers
            if (building.workforce_type !== 'consumer') return;

            const workerIndex = building.workforce.worker_index;
            if (workerIndex === undefined) {
                console.warn(`Building ${buildingName} has no worker_index`);
                return;
            }

            const baseWorkers = building.workforce.workers;

            let totalWorkers = 0;
            config.levels.forEach(level => {
                totalWorkers += baseWorkers * level;
            });

            if (!workersByIndex[workerIndex]) {
                workersByIndex[workerIndex] = 0;
            }
            workersByIndex[workerIndex] += totalWorkers;
        });

        // Calculate total used workers
        const totalUsedWorkers = Object.values(workersByIndex).reduce((sum, count) => sum + count, 0);

        if (totalUsedWorkers === 0) {
            container.innerHTML = '<p class="muted">Geen workers in gebruik. Selecteer consumer buildings om upkeep te zien.</p>';
            return;
        }

        let html = '<div class="upkeep-workers-stat">';
        html += `<div class="stat-label">Gebruikte Workers (Consumers):</div>`;
        html += `<div class="stat-value">${totalUsedWorkers.toLocaleString()}</div>`;
        html += '</div>';

        html += '<div class="upkeep-cards">';

        let grandTotalCost = 0;

        // Show upkeep for each worker index that is in use
        Object.keys(workersByIndex).sort().forEach(workerIndex => {
            const workerCount = workersByIndex[workerIndex];
            const index = parseInt(workerIndex);

            // Get worker data from workers.json by index
            const workerData = workersData[index];

            if (!workerData) {
                console.warn(`No worker data found at index ${index}`);
                return;
            }

            let totalUpkeepCost = 0;
            let consumablesHtml = '<div class="consumables-list">';

            if (workerData.consumables && workerData.consumables.length > 0) {
                workerData.consumables.forEach(consumable => {
                    // Amount is per day per 100 workers, DIVIDED BY 10
                    const amountPer100 = consumable.amount / 10;
                    const totalAmount = (amountPer100 / 100) * workerCount;
                    const price = prices[consumable.material] || 0;
                    const cost = totalAmount * price;
                    totalUpkeepCost += cost;

                    const essentialBadge = consumable.essential
                        ? '<span class="essential-badge">Essential</span>'
                        : '';

                    const bonusInfo = consumable.bonusPercent
                        ? `<span class="bonus-badge">+${consumable.bonusPercent}%</span>`
                        : '';

                    consumablesHtml += `
                        <div class="consumable-item ${consumable.essential ? 'essential' : ''}">
                            <div class="consumable-header">
                                <span class="consumable-name">${consumable.material}</span>
                                <div class="badges">
                                    ${essentialBadge}
                                    ${bonusInfo}
                                </div>
                            </div>
                            <div class="consumable-details">
                                <span class="consumable-amount">${amountPer100.toFixed(1)}/day/100 workers → ${totalAmount.toFixed(1)} total</span>
                                <span class="consumable-cost">€${cost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</span>
                            </div>
                        </div>
                    `;
                });
            }

            consumablesHtml += '</div>';

            grandTotalCost += totalUpkeepCost;

            html += `
                <div class="upkeep-card">
                    <div class="upkeep-card-header">
                        <h4>${workerData.type} (${workerCount.toLocaleString()} workers)</h4>
                        <div class="upkeep-total">€${totalUpkeepCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}/day</div>
                    </div>
                    ${consumablesHtml}
                </div>
            `;
        });

        html += '</div>';

        // Add grand total if there are multiple worker types
        if (Object.keys(workersByIndex).length > 1) {
            html += `
                <div class="upkeep-grand-total">
                    <span class="grand-total-label">Total Daily Upkeep:</span>
                    <span class="grand-total-value">€${grandTotalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</span>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    function getUsedWorkers() {
        let total = 0;

        // Only count CONSUMER buildings (those that use workers)
        Object.keys(buildingConfig).forEach(buildingName => {
            const config = buildingConfig[buildingName];
            if (config.count === 0) return;

            const building = buildings.find(m => m.name === buildingName);
            if (!building || !building.workforce || !building.workforce.workers) return;

            // Only count consumers, NOT providers
            if (building.workforce_type !== 'consumer') return;

            const baseWorkers = building.workforce.workers;
            config.levels.forEach(level => {
                total += baseWorkers * level;
            });
        });

        return total;
    }
});

