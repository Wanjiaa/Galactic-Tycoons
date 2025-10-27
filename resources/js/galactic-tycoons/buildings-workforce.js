// ========================================
// GALACTIC TYCOONS - Workforce Summary
// Balance workers across systems
// ========================================

import './sidebar-nav.js';

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/galactic-tycoons/buildings';

    let buildings = [];
    let workforceSystemFilter = 'all';

    let galaxyConfig = JSON.parse(localStorage.getItem('gt_galaxy_config_v2') || '{"hqLevel": 1, "systems": [{"name": "Genesis Core", "buildings": {}}]}');

    // Backwards compatibility
    if (galaxyConfig.planets && !galaxyConfig.systems) {
        galaxyConfig.systems = galaxyConfig.planets;
        delete galaxyConfig.planets;
    }

    // Setup system filter tabs
    function setupSystemFilters() {
        const workforceTabsContainer = document.getElementById('workforceSystemTabs');
        if (workforceTabsContainer) {
            renderSystemFilterTabs(workforceTabsContainer, workforceSystemFilter, (value) => {
                workforceSystemFilter = value;
                updateWorkforceCalculator();
            });
        }
    }

    function renderSystemFilterTabs(container, activeValue, onChangeCallback) {
        let html = '';
        html += `<div class="planet-filter-tab ${activeValue === 'all' ? 'active' : ''}" data-filter="all">🌍 Alle Systems</div>`;

        if (galaxyConfig.systems) {
            galaxyConfig.systems.forEach((system, index) => {
                const isActive = activeValue == index;
                html += `<div class="planet-filter-tab ${isActive ? 'active' : ''}" data-filter="${index}">${system.name}</div>`;
            });
        }

        container.innerHTML = html;

        container.querySelectorAll('.planet-filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const filterValue = tab.dataset.filter;
                onChangeCallback(filterValue);
                container.querySelectorAll('.planet-filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    async function loadBuildings() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error('Invalid data format');

            buildings = data;
            console.log('Loaded buildings:', buildings.length);
            updateWorkforceCalculator();
        } catch (error) {
            console.error('Failed to load buildings:', error);
        }
    }

    function updateWorkforceCalculator() {
        let totalProvided = 0;
        let totalNeeded = 0;
        const breakdown = {
            providers: [],
            consumers: []
        };

        // Filter systems based on filter
        const systemsToProcess = workforceSystemFilter === 'all' ?
            (galaxyConfig.systems || []) :
            [galaxyConfig.systems[parseInt(workforceSystemFilter)]];

        systemsToProcess.forEach((system) => {
            if (!system || !system.buildings) return;

            Object.keys(system.buildings).forEach(buildingName => {
                const config = system.buildings[buildingName];
                if (config.count === 0) return;

                const building = buildings.find(m => m.name === buildingName);
                if (!building || !building.workforce || !building.workforce.workers) return;

                const baseWorkers = building.workforce.workers;
                let totalWorkers = 0;
                config.levels.forEach(level => {
                    totalWorkers += baseWorkers * level;
                });

                const systemLabel = system.name;

                if (building.workforce_type === 'provider') {
                    totalProvided += totalWorkers;
                    breakdown.providers.push({
                        name: buildingName,
                        system: systemLabel,
                        count: config.count,
                        workers: totalWorkers,
                        levels: config.levels
                    });
                } else if (building.workforce_type === 'consumer') {
                    totalNeeded += totalWorkers;
                    breakdown.consumers.push({
                        name: buildingName,
                        system: systemLabel,
                        count: config.count,
                        workers: totalWorkers,
                        levels: config.levels
                    });
                }
            });
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
        balanceEl?.classList.remove('positive', 'negative', 'neutral');
        if (balance > 0) {
            balanceEl?.classList.add('positive');
        } else if (balance < 0) {
            balanceEl?.classList.add('negative');
        } else {
            balanceEl?.classList.add('neutral');
        }

        // Update efficiency styling
        const efficiencyEl = document.getElementById('workforceEfficiency');
        efficiencyEl?.classList.remove('excellent', 'good', 'warning', 'critical');
        if (efficiency >= 100) {
            efficiencyEl?.classList.add('excellent');
        } else if (efficiency >= 80) {
            efficiencyEl?.classList.add('good');
        } else if (efficiency >= 50) {
            efficiencyEl?.classList.add('warning');
        } else {
            efficiencyEl?.classList.add('critical');
        }

        renderWorkforceBreakdown(breakdown);
    }

    function renderWorkforceBreakdown(breakdown) {
        const container = document.getElementById('workforceBreakdown');
        if (!container) return;

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
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-planet">${item.system}</span>
                        </div>
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
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-planet">${item.system}</span>
                        </div>
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
    console.log('🚀 Initializing Workforce Summary page...');
    loadBuildings();
    setupSystemFilters();

    // Listen for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'gt_galaxy_config_v2') {
            location.reload();
        }
    });
});
