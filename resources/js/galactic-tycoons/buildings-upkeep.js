// ========================================
// GALACTIC TYCOONS - Worker Upkeep Calculator
// Calculate daily worker upkeep costs
// ========================================

import './sidebar-nav.js';

// Import JSON data
import buildingsDataRaw from './data/buildings.json?raw';
import workersDataRaw from './data/workers.json?raw';

const buildingsData = JSON.parse(buildingsDataRaw);
const workersData = JSON.parse(workersDataRaw);

document.addEventListener('DOMContentLoaded', function () {
    let buildings = buildingsData;
    let workersDataArray = workersData;
    let prices = {};
    let activeWorkerTab = 0;
    let upkeepSystemFilter = 'all';

    let galaxyConfig = JSON.parse(localStorage.getItem('gt_galaxy_config_v2') || '{"hqLevel": 1, "systems": [{"name": "Genesis Core", "buildings": {}}]}');

    // Backwards compatibility
    if (galaxyConfig.planets && !galaxyConfig.systems) {
        galaxyConfig.systems = galaxyConfig.planets;
        delete galaxyConfig.planets;
    }

    function loadPrices() {
        const storedPrices = localStorage.getItem('gt_prices_v1');
        if (storedPrices) {
            try {
                prices = JSON.parse(storedPrices);
            } catch (e) {
                prices = {};
            }
        }
    }

    loadPrices();

    // Setup system filter tabs
    function setupSystemFilters() {
        const upkeepTabsContainer = document.getElementById('upkeepSystemTabs');
        if (upkeepTabsContainer) {
            renderSystemFilterTabs(upkeepTabsContainer, upkeepSystemFilter, (value) => {
                upkeepSystemFilter = value;
                renderUpkeepCalculator();
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
            renderUpkeepCalculator();
        } catch (error) {
            console.error('Failed to load buildings:', error);
        }
    }

    async function loadWorkers() {
        try {
            const response = await fetch(WORKERS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error('Invalid data format');

            workersData = data;
            workersData = data;
            console.log('Loaded workers:', workersData.length);
            renderUpkeepCalculator();
        } catch (error) {
            console.error('Failed to load workers:', error);
            const container = document.getElementById('upkeepSummaryGrid');
            if (container) {
                container.innerHTML = '<p class="muted">❌ Failed to load worker data</p>';
            }
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
            renderUpkeepCalculator();
        } catch (error) {
            console.error('Failed to load buildings:', error);
        }
    }

    async function loadWorkers() {
        try {
            const response = await fetch(WORKERS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error('Invalid data format');

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

    function getWorkerTypeName(typeIndex) {
        const typeNames = {
            0: 'Worker',
            1: 'Technician',
            2: 'Engineer',
            3: 'Scientist',
            4: 'Expert'
        };
        return typeNames[typeIndex] || `Worker Type ${typeIndex}`;
    }

    function renderUpkeepCalculator() {
        const container = document.getElementById('upkeepSummaryGrid');
        if (!container) return;

        const workersByIndex = {};

        // Filter systems based on filter
        const systemsToProcess = upkeepSystemFilter === 'all' ?
            (galaxyConfig.systems || []) :
            [galaxyConfig.systems[parseInt(upkeepSystemFilter)]];

        systemsToProcess.forEach(system => {
            if (!system || !system.buildings) return;

            Object.keys(system.buildings).forEach(buildingName => {
                const config = system.buildings[buildingName];
                if (config.count === 0) return;

                const building = buildings.find(m => m.name === buildingName);
                if (!building || !building.workforce || !building.workforce.workers) return;
                const workerData = workersDataArray[workerIndex];

                const workerIndex = building.workforce.worker_index;
                if (workerIndex === undefined) return;

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
        const workerData = workersDataArray[displayWorkerIndex];

        const totalUsedWorkers = Object.values(workersByIndex).reduce((sum, count) => sum + count, 0);

        if (totalUsedWorkers === 0) {
            container.innerHTML = '<p class="muted">Geen workers in gebruik. Selecteer consumer buildings om upkeep te zien.</p>';
            return;
        }

        const usedWorkerIndices = Object.keys(workersByIndex).map(idx => parseInt(idx)).sort();

        let html = '<div class="upkeep-workers-stat">';
        html += `<div class="stat-label">Gebruikte Workers:</div>`;
        html += `<div class="stat-value">${totalUsedWorkers.toLocaleString()}</div>`;
        html += '</div>';

        if (usedWorkerIndices.length > 1) {
            html += '<div class="upkeep-worker-tabs">';
            usedWorkerIndices.forEach(workerIndex => {
                const workerData = workersData[workerIndex];
                const workerCount = workersByIndex[workerIndex];
                const isActive = workerIndex === activeWorkerTab;

                html += `
                    <div class="upkeep-worker-tab ${isActive ? 'active' : ''}" data-worker-index="${workerIndex}">
                        <span class="tab-name">${workerData ? getWorkerTypeName(workerData.typeIndex) : `Type ${workerIndex}`}</span>
                        <span class="tab-count">${workerCount.toLocaleString()} workers</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        const displayWorkerIndex = usedWorkerIndices.includes(activeWorkerTab) ? activeWorkerTab : usedWorkerIndices[0];
        const workerCount = workersByIndex[displayWorkerIndex];
        const workerData = workersData[displayWorkerIndex];

        html += '<div class="upkeep-content">';

        if (workerData && workerData.consumables && workerData.consumables.length > 0) {
            let totalUpkeepCost = 0;

            html += '<div class="upkeep-card">';
            html += '<div class="upkeep-card-header">';
            html += `<h4>${getWorkerTypeName(workerData.typeIndex)}</h4>`;
            html += `<div class="worker-count-display">${workerCount.toLocaleString()} workers</div>`;
            html += '</div>';

            html += '<div class="consumables-list">';

            workerData.consumables.forEach(consumable => {
                const amountPer100 = consumable.amount / 10;
                const totalAmount = (amountPer100 / 100) * workerCount;
                const price = prices[consumable.material] || 0;
                const cost = totalAmount * price;
                totalUpkeepCost += cost;

                const essentialBadge = consumable.essential ? '<span class="essential-badge">Essential</span>' : '';
                const data = workersDataArray[workerIndex];

                html += `
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
                            <span class="consumable-cost">€${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                    </div>
                `;
            });

            html += '</div>';

            html += '<div class="upkeep-total-section">';
            html += `<span class="total-label">Total Daily Upkeep (${getWorkerTypeName(workerData.typeIndex)}):</span>`;
            html += `<span class="total-value">€${totalUpkeepCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/day</span>`;
            html += '</div>';

            html += '</div>';
        }

        html += '</div>';

    console.log('Loaded buildings:', buildings.length);
    console.log('Loaded workers:', workersDataArray.length);
            usedWorkerIndices.forEach(workerIndex => {
    renderUpkeepCalculator();
                const count = workersByIndex[workerIndex];
                const data = workersData[workerIndex];
                if (data && data.consumables) {
                    data.consumables.forEach(consumable => {
                        const amountPer100 = consumable.amount / 10;
                        const totalAmount = (amountPer100 / 100) * count;
                        const price = prices[consumable.material] || 0;
                        allWorkersCost += totalAmount * price;
                    });
                }
            });

            html += `
                <div class="upkeep-grand-total">
                    <span class="grand-total-label">Total Daily Upkeep (All Worker Types):</span>
                    <span class="grand-total-value">€${allWorkersCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            `;
        }

        container.innerHTML = html;

        document.querySelectorAll('.upkeep-worker-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                activeWorkerTab = parseInt(tab.dataset.workerIndex);
                renderUpkeepCalculator();
            });
        });
    }

    // Initialize
    console.log('🚀 Initializing Worker Upkeep page...');
    loadBuildings();
    loadWorkers();
    setupSystemFilters();

    // Listen for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'gt_galaxy_config_v2' || e.key === 'gt_prices_v1') {
            location.reload();
        }
    });
});

