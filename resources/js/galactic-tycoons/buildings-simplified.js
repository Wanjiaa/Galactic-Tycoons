// ========================================
// GALACTIC TYCOONS - Multi-Planet Buildings Management (Simplified)
// Manage buildings across multiple planets with simple HQ level selector
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/galactic-tycoons/buildings';
    const WORKERS_API_URL = '/api/galactic-tycoons/workers';

    let buildings = [];
    let workersData = [];
    let prices = {};
    let activeTier = 0; // Start at tier 0 to show HQ
    let activePlanet = 0;
    let activeWorkerTab = 0;

    // Multi-planet structure
    let galaxyConfig = JSON.parse(localStorage.getItem('gt_galaxy_config_v2') || '{"hqLevel": 1, "planets": [{"name": "Home Planet", "buildings": {}}]}');

    // Migrate old single-planet config
    const oldConfig = JSON.parse(localStorage.getItem('gt_building_config_v1') || 'null');
    if (oldConfig && galaxyConfig.planets.length === 1 && Object.keys(galaxyConfig.planets[0].buildings).length === 0) {
        console.log('Migrating old single-planet config to multi-planet...');
        galaxyConfig.planets[0].buildings = oldConfig;
        saveGalaxyConfig();
    }

    console.log('Buildings (Multi-Planet) page loaded. Galaxy config:', galaxyConfig);

    // Setup summary tabs
    function setupSummaryTabs() {
        const tabs = document.querySelectorAll('.summary-tab');
        const contents = document.querySelectorAll('.summary-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                document.getElementById(`${targetTab}Tab`).classList.add('active');
            });
        });
    }

    // Get max planets based on HQ level
    function getMaxPlanets() {
        return galaxyConfig.hqLevel;
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

    function saveGalaxyConfig() {
        localStorage.setItem('gt_galaxy_config_v2', JSON.stringify(galaxyConfig));
        console.log('Saved galaxy config:', galaxyConfig);

        // Also save to old key for backwards compatibility
        if (galaxyConfig.planets[0]) {
            localStorage.setItem('gt_building_config_v1', JSON.stringify(galaxyConfig.planets[0].buildings));
        }
    }

    // Export galaxy configuration
    function exportConfig() {
        const dataStr = JSON.stringify(galaxyConfig, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `galactic-tycoons-planets-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import galaxy configuration
    function importConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!imported.hqLevel || !imported.planets || !Array.isArray(imported.planets)) {
                    alert('❌ Invalid configuration file format');
                    return;
                }

                if (confirm(`Import configuration with HQ Level ${imported.hqLevel} and ${imported.planets.length} planet(s)?`)) {
                    galaxyConfig = imported;
                    activePlanet = 0;
                    saveGalaxyConfig();
                    renderPlanetTabs();
                    renderBuildings();
                    updateWorkforceCalculator();
                    renderUpkeepCalculator();
                    alert('✅ Configuration imported successfully!');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('❌ Failed to import configuration: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
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

            // Setup import/export buttons
            document.getElementById('exportConfigBtn')?.addEventListener('click', exportConfig);
            document.getElementById('importConfigInput')?.addEventListener('change', importConfig);

            renderPlanetTabs();
            renderBuildings();
        } catch (error) {
            console.error('Failed to load buildings:', error);
            const container = document.getElementById('buildingsList');
            if (container) {
                container.innerHTML = '<p class="muted">❌ Fout bij laden van buildings: ' + error.message + '</p>';
            }
        }
    }

    // Render planet tabs
    function renderPlanetTabs() {
        const container = document.getElementById('planetTabs');
        if (!container) return;

        const maxPlanets = getMaxPlanets();

        let html = '<div class="planet-tabs-container">';

        // Render existing planets
        galaxyConfig.planets.forEach((planet, index) => {
            const isActive = index === activePlanet;
            const buildingCount = Object.keys(planet.buildings).reduce((sum, name) => sum + (planet.buildings[name].count || 0), 0);

            html += `
                <div class="planet-tab ${isActive ? 'active' : ''}" data-planet-index="${index}">
                    <div class="planet-tab-header">
                        <span class="planet-name">${planet.name}</span>
                        <button class="planet-rename-btn" data-planet-index="${index}" title="Rename planet">✏️</button>
                    </div>
                    <div class="planet-stats">
                        <span class="planet-buildings-count">${buildingCount} buildings</span>
                    </div>
                </div>
            `;
        });

        // Show "Add Planet" button if under max
        if (galaxyConfig.planets.length < maxPlanets) {
            html += `
                <div class="planet-tab add-planet-tab" id="addPlanetBtn">
                    <span class="add-planet-icon">➕</span>
                    <span class="add-planet-text">Add Planet ${galaxyConfig.planets.length + 1}</span>
                </div>
            `;
        }

        // Show locked planets
        for (let i = galaxyConfig.planets.length; i < maxPlanets; i++) {
            html += `
                <div class="planet-tab locked-planet">
                    <span class="locked-icon">🔒</span>
                    <span class="locked-text">Planet ${i + 1}</span>
                    <span class="locked-hint">Requires HQ Lvl ${i + 1}</span>
                </div>
            `;
        }

        html += '</div>';

        container.innerHTML = html;

        // Attach event listeners
        document.querySelectorAll('.planet-tab:not(.add-planet-tab):not(.locked-planet)').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('planet-rename-btn')) return;
                const index = parseInt(tab.dataset.planetIndex);
                activePlanet = index;
                renderPlanetTabs();
                renderBuildings();
            });
        });

        document.querySelectorAll('.planet-rename-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.planetIndex);
                renamePlanet(index);
            });
        });

        document.getElementById('addPlanetBtn')?.addEventListener('click', addPlanet);
    }

    function addPlanet() {
        const planetNumber = galaxyConfig.planets.length + 1;
        const newPlanet = {
            name: `Planet ${String.fromCharCode(64 + planetNumber)}`,
            buildings: {}
        };
        galaxyConfig.planets.push(newPlanet);
        activePlanet = galaxyConfig.planets.length - 1;
        saveGalaxyConfig();
        renderPlanetTabs();
        renderBuildings();
    }

    function renamePlanet(index) {
        const planet = galaxyConfig.planets[index];
        const newName = prompt(`Rename planet:`, planet.name);
        if (newName && newName.trim()) {
            planet.name = newName.trim();
            saveGalaxyConfig();
            renderPlanetTabs();
        }
    }

    function getCurrentPlanetBuildings() {
        return galaxyConfig.planets[activePlanet]?.buildings || {};
    }

    function setCurrentPlanetBuildings(buildings) {
        if (galaxyConfig.planets[activePlanet]) {
            galaxyConfig.planets[activePlanet].buildings = buildings;
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

        const buildingConfig = getCurrentPlanetBuildings();
        const planetName = galaxyConfig.planets[activePlanet]?.name || 'Unknown';

        // Sort buildings
        const sortedBuildings = [...buildings].sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            if (a.workforce_type === 'provider' && b.workforce_type !== 'provider') return -1;
            if (a.workforce_type !== 'provider' && b.workforce_type === 'provider') return 1;
            return a.name.localeCompare(b.name);
        });

        container.innerHTML = '';

        // Planet header
        const planetHeader = document.createElement('div');
        planetHeader.className = 'planet-header';
        planetHeader.innerHTML = `
            <h3>🪐 ${planetName}</h3>
            <div class="planet-actions">
                <button class="btn btn-sm btn-danger" id="clearPlanetBtn">🗑️ Clear All Buildings</button>
            </div>
        `;
        container.appendChild(planetHeader);

        // Get unique tiers (including 0)
        const tiers = [...new Set(sortedBuildings.map(m => m.tier))].sort((a, b) => a - b);

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
                renderBuildings();
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

        // Special handling for tier 0 (HQ)
        if (activeTier === 0) {
            const hqInfo = document.createElement('div');
            hqInfo.className = 'hq-level-selector';
            hqInfo.innerHTML = `
                <div class="hq-info-box">
                    <div class="hq-info-row">
                        <label for="hqLevelInput">🏛️ Headquarters Level:</label>
                        <select id="hqLevelInput" class="hq-level-select">
                            ${Array.from({length: 10}, (_, i) => i + 1).map(level => 
                                `<option value="${level}" ${level === galaxyConfig.hqLevel ? 'selected' : ''}>Level ${level}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="hq-info-row">
                        <span class="hq-info-text">
                            <strong>Max Planeten:</strong> ${galaxyConfig.hqLevel} 
                            <span class="muted">(${galaxyConfig.planets.length} actief)</span>
                        </span>
                    </div>
                    <p class="hq-help-text">💡 Je HQ level bepaalt hoeveel planeten je kunt hebben. HQ level = max planeten.</p>
                </div>
            `;
            container.appendChild(hqInfo);

            // Attach HQ level change handler
            document.getElementById('hqLevelInput')?.addEventListener('change', (e) => {
                const oldLevel = galaxyConfig.hqLevel;
                const newLevel = parseInt(e.target.value);

                galaxyConfig.hqLevel = newLevel;

                // Automatically add planets if HQ level increased
                if (newLevel > oldLevel && galaxyConfig.planets.length < newLevel) {
                    const planetsToAdd = newLevel - galaxyConfig.planets.length;
                    for (let i = 0; i < planetsToAdd; i++) {
                        const planetNumber = galaxyConfig.planets.length + 1;
                        galaxyConfig.planets.push({
                            name: `Planet ${String.fromCharCode(64 + planetNumber)}`,
                            buildings: {}
                        });
                    }
                    console.log(`Added ${planetsToAdd} planet(s) due to HQ level increase`);
                }

                saveGalaxyConfig();
                renderPlanetTabs();
                renderBuildings();
            });
        }

        // Render buildings grid
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
        updateWorkforceCalculator();
        renderUpkeepCalculator();

        // Clear planet button
        document.getElementById('clearPlanetBtn')?.addEventListener('click', () => {
            if (confirm(`Are you sure you want to clear all buildings on ${planetName}?`)) {
                setCurrentPlanetBuildings({});
                saveGalaxyConfig();
                renderBuildings();
                updateWorkforceCalculator();
                renderUpkeepCalculator();
            }
        });
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

                const buildingConfig = getCurrentPlanetBuildings();

                if (!buildingConfig[buildingName]) {
                    buildingConfig[buildingName] = {count: 0, levels: []};
                }

                const oldCount = buildingConfig[buildingName].count;
                buildingConfig[buildingName].count = count;

                // Adjust levels array
                if (count > oldCount) {
                    for (let i = oldCount; i < count; i++) {
                        buildingConfig[buildingName].levels.push(1);
                    }
                } else if (count < oldCount) {
                    buildingConfig[buildingName].levels = buildingConfig[buildingName].levels.slice(0, count);
                }

                if (count === 0) {
                    delete buildingConfig[buildingName];
                }

                setCurrentPlanetBuildings(buildingConfig);
                saveGalaxyConfig();
                renderBuildings();
                renderPlanetTabs();
                updateWorkforceCalculator();
                renderUpkeepCalculator();
            });
        });

        // Level inputs
        document.querySelectorAll('.level-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const buildingName = e.target.dataset.building;
                const index = parseInt(e.target.dataset.index);
                const level = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                e.target.value = level;

                const buildingConfig = getCurrentPlanetBuildings();

                if (buildingConfig[buildingName]) {
                    buildingConfig[buildingName].levels[index] = level;
                    setCurrentPlanetBuildings(buildingConfig);
                    saveGalaxyConfig();
                    renderBuildings();
                    updateWorkforceCalculator();
                    renderUpkeepCalculator();
                }
            });
        });
    }

    // Calculate and update workforce statistics across ALL planets
    function updateWorkforceCalculator() {
        let totalProvided = 0;
        let totalNeeded = 0;
        const breakdown = {
            providers: [],
            consumers: []
        };

        // Calculate for ALL planets
        galaxyConfig.planets.forEach((planet, planetIndex) => {
            Object.keys(planet.buildings).forEach(buildingName => {
                const config = planet.buildings[buildingName];
                if (config.count === 0) return;

                const building = buildings.find(m => m.name === buildingName);
                if (!building || !building.workforce || !building.workforce.workers) return;

                const baseWorkers = building.workforce.workers;

                let totalWorkers = 0;
                config.levels.forEach(level => {
                    totalWorkers += baseWorkers * level;
                });

                const planetLabel = `${planet.name}`;

                if (building.workforce_type === 'provider') {
                    totalProvided += totalWorkers;
                    breakdown.providers.push({
                        name: buildingName,
                        planet: planetLabel,
                        count: config.count,
                        workers: totalWorkers,
                        levels: config.levels
                    });
                } else if (building.workforce_type === 'consumer') {
                    totalNeeded += totalWorkers;
                    breakdown.consumers.push({
                        name: buildingName,
                        planet: planetLabel,
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

        // Render breakdown
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
                            <span class="item-planet">${item.planet}</span>
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
                            <span class="item-planet">${item.planet}</span>
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

    // Helper function to get worker type name from index
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

        // Group workers by worker_index across ALL planets
        const workersByIndex = {};

        galaxyConfig.planets.forEach(planet => {
            Object.keys(planet.buildings).forEach(buildingName => {
                const config = planet.buildings[buildingName];
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
        });

        // Calculate total used workers
        const totalUsedWorkers = Object.values(workersByIndex).reduce((sum, count) => sum + count, 0);

        if (totalUsedWorkers === 0) {
            container.innerHTML = '<p class="muted">Geen workers in gebruik. Selecteer consumer buildings om upkeep te zien.</p>';
            return;
        }

        // Get worker types that are actually in use
        const usedWorkerIndices = Object.keys(workersByIndex).map(idx => parseInt(idx)).sort();

        let html = '<div class="upkeep-workers-stat">';
        html += `<div class="stat-label">Gebruikte Workers (All Planets):</div>`;
        html += `<div class="stat-value">${totalUsedWorkers.toLocaleString()}</div>`;
        html += '</div>';

        // Worker type tabs
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

        // Display active worker type details
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

                const essentialBadge = consumable.essential
                    ? '<span class="essential-badge">Essential</span>'
                    : '';

                const bonusInfo = consumable.bonusPercent
                    ? `<span class="bonus-badge">+${consumable.bonusPercent}%</span>`
                    : '';

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
                            <span class="consumable-cost">€${cost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}</span>
                        </div>
                    </div>
                `;
            });

            html += '</div>';

            html += '<div class="upkeep-total-section">';
            html += `<span class="total-label">Total Daily Upkeep (${getWorkerTypeName(workerData.typeIndex)}):</span>`;
            html += `<span class="total-value">€${totalUpkeepCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}/day</span>`;
            html += '</div>';

            html += '</div>';
        }

        html += '</div>';

        // Grand total across all worker types
        if (usedWorkerIndices.length > 1) {
            let allWorkersCost = 0;
            usedWorkerIndices.forEach(workerIndex => {
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
                    <span class="grand-total-value">€${allWorkersCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</span>
                </div>
            `;
        }

        container.innerHTML = html;

        // Attach tab click listeners
        document.querySelectorAll('.upkeep-worker-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                activeWorkerTab = parseInt(tab.dataset.workerIndex);
                renderUpkeepCalculator();
            });
        });
    }

    // Initialize
    console.log('🚀 Initializing multi-planet buildings page...');
    loadBuildings();
    loadWorkers();
    setupSummaryTabs();
});

