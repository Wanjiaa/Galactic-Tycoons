// ========================================
// GALACTIC TYCOONS - Machines Management
// (can be merged with buildings.js if needed)
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/galactic-tycoons/machines';
    const WORKERS_API_URL = '/api/galactic-tycoons/workers';

    let machines = [];
    let workersData = [];
    let prices = {};
    let activeTier = 1; // Track active tier

    // New structure: { "Smelter": { count: 2, levels: [3, 2] }, ... }
    let machineConfig = JSON.parse(localStorage.getItem('gt_machine_config_v1') || '{}');

    console.log('Machines page loaded. Machine config:', machineConfig);

    // Migrate old enabled machines format to new format
    const oldEnabled = JSON.parse(localStorage.getItem('gt_enabled_machines_v1') || '[]');
    if (oldEnabled.length > 0 && Object.keys(machineConfig).length === 0) {
        console.log('Migrating old format to new format...');
        oldEnabled.forEach(name => {
            machineConfig[name] = {count: 1, levels: [1]};
        });
        saveMachineConfig();
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

    function saveMachineConfig() {
        localStorage.setItem('gt_machine_config_v1', JSON.stringify(machineConfig));

        // Also maintain old format for backwards compatibility with calculator
        const enabledMachines = Object.keys(machineConfig).filter(name =>
            machineConfig[name].count > 0
        );
        localStorage.setItem('gt_enabled_machines_v1', JSON.stringify(enabledMachines));

        console.log('Saved machine config:', machineConfig);
    }

    // Fetch machines from server
    async function loadMachines() {
        try {
            console.log('Fetching machines from API:', API_URL);
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

            machines = data;
            console.log('Loaded machines:', machines.length);
            renderMachines();
        } catch (error) {
            console.error('Failed to load machines:', error);
            const container = document.getElementById('machinesList');
            if (container) {
                container.innerHTML = '<p class="muted">❌ Fout bij laden van machines: ' + error.message + '</p>';
            }
        }
    }

    function renderMachines() {
        const container = document.getElementById('machinesList');

        if (!container) {
            console.error('❌ machinesList container not found!');
            return;
        }

        if (machines.length === 0) {
            container.innerHTML = '<p class="muted">Geen machines beschikbaar.</p>';
            return;
        }

        // Sort: Housing (providers) first, then by name
        const sortedMachines = [...machines].sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;

            // Housing (providers) first
            if (a.workforce_type === 'provider' && b.workforce_type !== 'provider') return -1;
            if (a.workforce_type !== 'provider' && b.workforce_type === 'provider') return 1;

            return a.name.localeCompare(b.name);
        });

        container.innerHTML = '';

        const tiers = [...new Set(sortedMachines.map(m => m.tier))];

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
                renderMachines(); // Re-render machines to show active tier
            });
            tabsContainer.appendChild(tab);
        });

        container.appendChild(tabsContainer);

        // Filter machines by active tier
        const tierMachines = sortedMachines.filter(m => m.tier === activeTier);

        if (tierMachines.length === 0) {
            container.innerHTML += '<p class="muted">Geen machines beschikbaar voor deze tier.</p>';
            return;
        }

        const tierGrid = document.createElement('div');
        tierGrid.className = 'machines-grid';

        tierMachines.forEach(machine => {
            const config = machineConfig[machine.name] || {count: 0, levels: []};

            const card = document.createElement('div');
            card.className = 'machine-card';
            if (config.count > 0) card.classList.add('active');

            // Build workforce info
            let workforceInfo = '';
            if (machine.workforce_type === 'provider' && machine.workforce) {
                const badges = [];
                if (machine.workforce.workers) badges.push(`<span class="workforce-badge provider">+${machine.workforce.workers} Workers</span>`);
                workforceInfo = badges.join(' ');
            } else if (machine.workforce_type === 'consumer' && machine.workforce) {
                const badges = [];
                if (machine.workforce.workers) badges.push(`<span class="workforce-badge consumer">${machine.workforce.workers} Workers</span>`);
                workforceInfo = badges.join(' ');
            }

            // Build category badge
            const categoryBadge = machine.category ? `<span class="category-badge">${machine.category}</span>` : '';

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
                    <span class="machine-name">${machine.name}</span>
                    ${categoryBadge}
                </div>
                ${workforceInfo}
                ${levelsDisplay}
                <div class="machine-controls">
                    <div class="control-group">
                        <label>Aantal:</label>
                        <input type="number" min="0" max="10" step="1" value="${config.count}" 
                               class="count-input" data-machine="${machine.name}">
                    </div>
                    <div class="levels-inputs" data-machine="${machine.name}">
                        ${renderLevelInputs(machine.name, config)}
                    </div>
                </div>
            `;

            tierGrid.appendChild(card);
        });

        container.appendChild(tierGrid);

        attachEventListeners();
        updateWorkforceCalculator(); // Initialize workforce calculator
    }

    function renderLevelInputs(machineName, config) {
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
                           class="level-input" data-machine="${machineName}" data-index="${i}">
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
                const machineName = e.target.dataset.machine;
                const count = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                e.target.value = count;

                if (!machineConfig[machineName]) {
                    machineConfig[machineName] = {count: 0, levels: []};
                }

                const oldCount = machineConfig[machineName].count;
                machineConfig[machineName].count = count;

                // Adjust levels array
                if (count > oldCount) {
                    // Add new levels (default to 1)
                    for (let i = oldCount; i < count; i++) {
                        machineConfig[machineName].levels.push(1);
                    }
                } else if (count < oldCount) {
                    // Remove excess levels
                    machineConfig[machineName].levels = machineConfig[machineName].levels.slice(0, count);
                }

                if (count === 0) {
                    delete machineConfig[machineName];
                }

                saveMachineConfig();
                renderMachines(); // Re-render to show/hide level inputs
                updateWorkforceCalculator(); // Update workforce stats
                renderUpkeepCalculator(); // Update upkeep calculator
            });
        });

        // Level inputs
        document.querySelectorAll('.level-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const machineName = e.target.dataset.machine;
                const index = parseInt(e.target.dataset.index);
                const level = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                e.target.value = level;

                if (machineConfig[machineName]) {
                    machineConfig[machineName].levels[index] = level;
                    saveMachineConfig();
                    renderMachines(); // Re-render to update level tags
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

        // Calculate workforce for each machine
        Object.keys(machineConfig).forEach(machineName => {
            const config = machineConfig[machineName];
            if (config.count === 0) return;

            const machine = machines.find(m => m.name === machineName);
            if (!machine || !machine.workforce || !machine.workforce.workers) return;

            const baseWorkers = machine.workforce.workers;

            // Calculate total workers for all instances with their levels
            let totalWorkers = 0;
            config.levels.forEach(level => {
                // Workforce scales with level (simple linear scaling for now)
                totalWorkers += baseWorkers * level;
            });

            if (machine.workforce_type === 'provider') {
                totalProvided += totalWorkers;
                breakdown.providers.push({
                    name: machineName,
                    count: config.count,
                    workers: totalWorkers,
                    levels: config.levels
                });
            } else if (machine.workforce_type === 'consumer') {
                totalNeeded += totalWorkers;
                breakdown.consumers.push({
                    name: machineName,
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
            container.innerHTML = '<p class="muted" style="font-size: 13px; margin-top: 16px;">Selecteer machines om workforce te zien</p>';
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
    console.log('🚀 Initializing machines page...');
    loadMachines();
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

        // Get total USED workers (only consumers, not providers)
        const usedWorkers = getUsedWorkers();

        if (usedWorkers === 0) {
            container.innerHTML = '<p class="muted">Geen workers in gebruik. Selecteer consumer buildings om upkeep te zien.</p>';
            return;
        }

        // Determine which worker types are actually in use
        // For now, we show all worker types since we don't have worker type mapping per building
        // You would need to track which buildings use which worker types
        // As a simplified approach: show the first worker type (Worker) for all consumers

        let html = '<div class="upkeep-workers-stat">';
        html += `<div class="stat-label">Gebruikte Workers (Consumers):</div>`;
        html += `<div class="stat-value">${usedWorkers.toLocaleString()}</div>`;
        html += '</div>';

        html += '<div class="upkeep-cards">';

        // Show upkeep for the first worker type only (assuming all consumers use basic workers)
        // If you have different worker types per building, you'd need to track that
        if (workersData.length > 0) {
            const worker = workersData[0]; // Use first worker type (Worker)

            if (worker.consumables && worker.consumables.length > 0) {
                let totalUpkeepCost = 0;
                let consumablesHtml = '<div class="consumables-list">';

                worker.consumables.forEach(consumable => {
                    // Amount is per day per 100 workers, so calculate actual amount needed
                    const amountPer100 = consumable.amount;
                    const totalAmount = (amountPer100 / 100) * usedWorkers;
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
                                <span class="consumable-amount">${amountPer100}/day/100 workers → ${totalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    })} total</span>
                                <span class="consumable-cost">€${cost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</span>
                            </div>
                        </div>
                    `;
                });

                consumablesHtml += '</div>';

                html += `
                    <div class="upkeep-card">
                        <div class="upkeep-card-header">
                            <h4>${worker.type}</h4>
                            <div class="upkeep-total">€${totalUpkeepCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}/day</div>
                        </div>
                        ${consumablesHtml}
                    </div>
                `;
            }
        }

        html += '</div>';
        container.innerHTML = html;
    }

    function getUsedWorkers() {
        let total = 0;

        // Only count CONSUMER buildings (those that use workers)
        Object.keys(machineConfig).forEach(machineName => {
            const config = machineConfig[machineName];
            if (config.count === 0) return;

            const machine = machines.find(m => m.name === machineName);
            if (!machine || !machine.workforce || !machine.workforce.workers) return;

            // Only count consumers, NOT providers
            if (machine.workforce_type !== 'consumer') return;

            const baseWorkers = machine.workforce.workers;
            config.levels.forEach(level => {
                total += baseWorkers * level;
            });
        });

        return total;
    }
});
