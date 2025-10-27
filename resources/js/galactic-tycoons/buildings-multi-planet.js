// ========================================
// GALACTIC TYCOONS - Multi-Planet Buildings Management
// Manage buildings across multiple planets with HQ system
// ========================================

// Import sidebar navigation
import './sidebar-nav.js';
import systemsData from './data/systems.json';

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/galactic-tycoons/buildings';
    const WORKERS_API_URL = '/api/galactic-tycoons/workers';

    let buildings = [];
    let workersData = [];
    let prices = {};
    let activeTier = 1;
    let activeSystem = 0; // Index of active system (0 = System 1, 1 = System 2, etc.)
    let availableSystems = systemsData; // All system definitions

    // Multi-planet structure:
    //   starterPlanetId: 1,
    // {
    //     { planetId: 1, name: "Gaia Prime", buildings: { "Smelter": { count: 2, levels: [3, 2] } } },
    //     { planetId: 2, name: "Titan's Reach", buildings: { "Mine": { count: 1, levels: [5] } } }
    //     { name: "Planet Alpha", buildings: { "Smelter": { count: 2, levels: [3, 2] } } },
    //     { name: "Planet Beta", buildings: { "Mine": { count: 1, levels: [5] } } }
    let galaxyConfig = JSON.parse(localStorage.getItem('gt_galaxy_config_v2') || `{"hqLevel": 1, "starterPlanetId": 1, "planets": [{"planetId": 1, "name": "${availablePlanets[0].name}", "buildings": {}}]}`);
    // }
    let galaxyConfig = JSON.parse(localStorage.getItem('gt_galaxy_config_v2') || '{"hqLevel": 1, "planets": [{"name": "Home Planet", "buildings": {}}]}');

    // Migrate old single-planet config to multi-planet
    const oldConfig = JSON.parse(localStorage.getItem('gt_building_config_v1') || 'null');
    if (oldConfig && galaxyConfig.planets.length === 1 && Object.keys(galaxyConfig.planets[0].buildings).length === 0) {
        console.log('Migrating old single-planet config to multi-planet...');
        galaxyConfig.planets[0].buildings = oldConfig;
        saveGalaxyConfig();
        localStorage.removeItem('gt_building_config_v1'); // Clean up old key
    }

    console.log('Buildings (Multi-Planet) page loaded. Galaxy config:', galaxyConfig);

    // Active planet filters for upkeep and workforce
    // Setup planet filter tabs (uniform styling across all 3 sections)
    let workforcePlanetFilter = 'all';
        const upkeepTabsContainer = document.getElementById('upkeepPlanetTabs');
        const workforceTabsContainer = document.getElementById('workforcePlanetTabs');
    function setupPlanetFilters() {
        if (upkeepTabsContainer) {
            renderPlanetFilterTabs(upkeepTabsContainer, upkeepPlanetFilter, (value) => {
                upkeepPlanetFilter = value;

            upkeepFilter.addEventListener('change', (e) => {
                upkeepPlanetFilter = e.target.value;
                renderUpkeepCalculator();
        if (workforceTabsContainer) {
            renderPlanetFilterTabs(workforceTabsContainer, workforcePlanetFilter, (value) => {
                workforcePlanetFilter = value;
                updateWorkforceCalculator();
            });
        }
    }

    // Render planet filter tabs with uniform styling
    function renderPlanetFilterTabs(container, activeValue, onChangeCallback) {
        let html = '';

        // "All Planets" tab
        html += `<div class="planet-filter-tab ${activeValue === 'all' ? 'active' : ''}" data-filter="all">🌍 Alle Planeten</div>`;

        // Individual planet tabs
        galaxyConfig.planets.forEach((planet, index) => {
            const isActive = activeValue == index;
            html += `<div class="planet-filter-tab ${isActive ? 'active' : ''}" data-filter="${index}">${planet.name}</div>`;
        });

        container.innerHTML = html;
                workforceFilter.appendChild(option);
        // Attach event listeners
        container.querySelectorAll('.planet-filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const filterValue = tab.dataset.filter;
                onChangeCallback(filterValue);

                // Update active state
                container.querySelectorAll('.planet-filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            workforceFilter.addEventListener('change', (e) => {
        });
                updateWorkforceCalculator();
            });
        }
    }

    // Setup summary tabs
    function setupSummaryTabs() {
        const tabs = document.querySelectorAll('.summary-tab');
        const contents = document.querySelectorAll('.summary-tab-content');
        const buildingsConfigCard = document.querySelector('.card:has(#buildingsList)');

        if (tabs.length === 0 || contents.length === 0) {
            console.warn('Summary tabs not found, skipping setup');
            return;
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                const targetContent = document.getElementById(`${targetTab}Tab`);

                if (!targetContent) {
                    console.warn(`Target tab content not found: ${targetTab}Tab`);
                    return;
                }

                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                targetContent.classList.add('active');

                // Show/hide Buildings Configuratie card based on active tab
                if (buildingsConfigCard) {
                    if (targetTab === 'buildings') {
                        buildingsConfigCard.style.display = 'block';
                    } else {
                        buildingsConfigCard.style.display = 'none';
                    }
                }
            });
        });

        // Initially hide buildings config card if not on buildings tab
        if (buildingsConfigCard) {
            const activeTab = document.querySelector('.summary-tab.active');
            if (!activeTab || activeTab.dataset.tab !== 'buildings') {
                buildingsConfigCard.style.display = 'none';
            }
        }
    }

    // HQ upgrade cost calculation
    // Base cost for Level 1: Amenities=5, Kits=4, Prefabs=6 (free - everyone starts with this)
    // Lvl 1→2: 10,8,12 | Lvl 2→3: 21,17,25 | Lvl 3→4: 34,28,41 | etc.
    function getHQUpgradeCost(fromLevel, toLevel = fromLevel + 1) {
        const costs = {
            1: { amenities: 5, constructionKits: 4, prefabKits: 6 },  // Base (free - starter)
            2: { amenities: 10, constructionKits: 8, prefabKits: 12 },
            3: { amenities: 21, constructionKits: 17, prefabKits: 25 },
            4: { amenities: 34, constructionKits: 28, prefabKits: 41 },
            5: { amenities: 51, constructionKits: 41, prefabKits: 62 },
            6: { amenities: 71, constructionKits: 57, prefabKits: 85 },
            7: { amenities: 98, constructionKits: 79, prefabKits: 118 },
        };

        // For levels beyond 7, use exponential formula
        if (toLevel > 7) {
            const baseAmenities = 10;
            const baseKits = 8;
            const basePrefabs = 12;
            const growthFactor = 1.55;

            return {
                amenities: Math.floor(baseAmenities * Math.pow(growthFactor, toLevel - 2)),
                constructionKits: Math.floor(baseKits * Math.pow(growthFactor, toLevel - 2)),
                prefabKits: Math.floor(basePrefabs * Math.pow(growthFactor, toLevel - 2))
            };
        }

        return costs[toLevel] || { amenities: 0, constructionKits: 0, prefabKits: 0 };
    }

    // Calculate total cost to upgrade HQ from current level to target level
    function getTotalHQUpgradeCost(fromLevel, toLevel) {
        let totalCost = { amenities: 0, constructionKits: 0, prefabKits: 0 };

        for (let level = fromLevel + 1; level <= toLevel; level++) {
            const cost = getHQUpgradeCost(level - 1, level);
            totalCost.amenities += cost.amenities;
            totalCost.constructionKits += cost.constructionKits;
            totalCost.prefabKits += cost.prefabKits;
        }

        return totalCost;
    // Get max systems based on HQ level (HQ level = max systems)
    function getMaxSystems() {
    // Get max planets based on HQ level (HQ level = max planets)
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

                // Validate structure
                if (!imported.hqLevel || !imported.planets || !Array.isArray(imported.planets)) {
                    alert('❌ Invalid configuration file format');
                    return;
                }

                if (confirm(`Import configuration with HQ Level ${imported.hqLevel} and ${imported.planets.length} planet(s)?`)) {
                    galaxyConfig = imported;
                    activePlanet = 0; // Reset to first planet
                    saveGalaxyConfig();
                    renderPlanetTabs();
                    renderHQPanel();
                    renderBuildings();
                    updateWorkforceCalculator();
                    alert('✅ Configuration imported successfully!');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('❌ Failed to import configuration: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
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
            renderHQPanel();
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

    // Render HQ management panel
    function renderHQPanel() {
        const container = document.getElementById('hqPanel');
        if (!container) return;

        const currentLevel = galaxyConfig.hqLevel;
        const maxLevel = 10;
        const maxPlanets = getMaxPlanets();
        const currentPlanets = galaxyConfig.planets.length;

        const upgradeCost = currentLevel < maxLevel ? getHQUpgradeCost(currentLevel, currentLevel + 1) : null;
        const totalCostToMax = getTotalHQUpgradeCost(currentLevel, maxLevel);

        let html = `
            <div class="hq-header">
                <h3>🏛️ Headquarters Management</h3>
                <div class="hq-level-display">
                    <span class="hq-level-badge">Level ${currentLevel}</span>
                    <span class="hq-planets-info">${currentPlanets}/${maxPlanets} Planets Active</span>
                </div>
            </div>
        `;

        if (currentLevel < maxLevel) {
            const amenityPrice = prices['Amenities'] || 0;
            const kitPrice = prices['Construction Kit'] || 0;
            const prefabPrice = prices['Prefab Kit'] || 0;

            const upgradeMoneyCost =
                (upgradeCost.amenities * amenityPrice) +
                (upgradeCost.constructionKits * kitPrice) +
                (upgradeCost.prefabKits * prefabPrice);

            html += `
                <div class="hq-upgrade-section">
                    <h4>⬆️ Upgrade to Level ${currentLevel + 1}</h4>
                    <div class="hq-upgrade-cost">
                        <div class="cost-item">
                            <span class="material-name">Amenities</span>
                            <span class="material-amount">${upgradeCost.amenities}x</span>
                            <span class="material-cost">€${(upgradeCost.amenities * amenityPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="cost-item">
                            <span class="material-name">Construction Kit</span>
                            <span class="material-amount">${upgradeCost.constructionKits}x</span>
                            <span class="material-cost">€${(upgradeCost.constructionKits * kitPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="cost-item">
                            <span class="material-name">Prefab Kit</span>
                            <span class="material-amount">${upgradeCost.prefabKits}x</span>
                            <span class="material-cost">€${(upgradeCost.prefabKits * prefabPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="cost-total">
                            <strong>Total Cost:</strong>
                            <span class="total-value">€${upgradeMoneyCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                    <div class="hq-upgrade-benefits">
                        <p>✨ Benefits: Unlock Planet ${currentLevel + 1}</p>
                    </div>
                </div>
            `;
        } else {
            html += `<div class="hq-max-level"><p>🏆 HQ is at maximum level!</p></div>`;
        }

        html += `
            <div class="hq-actions">
                <button class="btn btn-secondary" id="exportConfigBtn">📤 Export Configuration</button>
                <label class="btn btn-secondary" for="importConfigInput">📥 Import Configuration</label>
                <input type="file" id="importConfigInput" accept=".json" style="display: none;">
            </div>
        `;

        container.innerHTML = html;

        // Attach event listeners
        document.getElementById('exportConfigBtn')?.addEventListener('click', exportConfig);
        document.getElementById('importConfigInput')?.addEventListener('change', importConfig);
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
                        <span class="planet-name">${planet.name}</span>
                    <div class="planet-stats">
                        <span class="planet-buildings-count">${buildingCount} buildings</span>
                    </div>
                </div>
            `;
        });

        // Show "Add Planet" button if under max
        if (galaxyConfig.planets.length < maxPlanets) {
            const nextPlanetData = availablePlanets.find(p => p.hq_level_required === galaxyConfig.planets.length + 1) || availablePlanets[galaxyConfig.planets.length];
            const nextPlanetName = nextPlanetData ? nextPlanetData.name : `Planet ${galaxyConfig.planets.length + 1}`;

            const nextPlanetData = availablePlanets.find(p => p.hq_level_required === galaxyConfig.planets.length + 1) || availablePlanets[galaxyConfig.planets.length];
            const nextPlanetData = availablePlanets.find(p => p.hq_level_required === galaxyConfig.planets.length + 1) || availablePlanets[galaxyConfig.planets.length];
            const nextPlanetName = nextPlanetData ? nextPlanetData.name : `Planet ${galaxyConfig.planets.length + 1}`;
                    <span class="add-planet-text">Add ${nextPlanetName}</span>
            const nextPlanetName = nextPlanetData ? nextPlanetData.name : `Planet ${galaxyConfig.planets.length + 1}`;

            html += `
                    <span class="add-planet-text">Add ${nextPlanetName}</span>
                    <span class="add-planet-icon">➕</span>
                    <span class="add-planet-text">Add ${nextPlanetName}</span>
                </div>
            const lockedPlanetData = availablePlanets.find(p => p.hq_level_required === i + 1) || availablePlanets[i];
            const lockedPlanetName = lockedPlanetData ? lockedPlanetData.name : `Planet ${i + 1}`;

            `;
        }

                    <span class="locked-text">${lockedPlanetName}</span>
                    <span class="locked-hint">HQ Lvl ${i + 1}</span>
            const lockedPlanetName = lockedPlanetData ? lockedPlanetData.name : `Planet ${i + 1}`;

        for (let i = galaxyConfig.planets.length; i < maxPlanets; i++) {
            if (i >= maxPlanets) break;
            const lockedPlanetData = availablePlanets.find(p => p.hq_level_required === i + 1) || availablePlanets[i];
                    <span class="locked-text">${lockedPlanetName}</span>
                    <span class="locked-hint">HQ Lvl ${i + 1}</span>
            html += `
                <div class="planet-tab locked-planet">
                    <span class="locked-icon">🔒</span>
            tab.addEventListener('click', () => {
                </div>
            `;
        }

                setupPlanetFilters(); // Update filter tabs when switching planets
            // Housing (providers) first
            if (a.workforce_type === 'provider' && b.workforce_type !== 'provider') return -1;
            if (a.workforce_type !== 'provider' && b.workforce_type === 'provider') return 1;

            return a.name.localeCompare(b.name);
        });
    // Planet names are now fixed from planets.json
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
            const hqBuilding = tierBuildings.find(b => b.name.toLowerCase().includes('headquarters') || b.name.toLowerCase().includes('hq'));

            if (hqBuilding) {
                const hqInfo = document.createElement('div');
                hqInfo.className = 'hq-level-selector';
                hqInfo.innerHTML = `
                    <div class="hq-info-box">
                        <div class="hq-header-section">
                            <h3>🏛️ ${hqBuilding.name}</h3>
                            <p class="hq-description">Je HQ level bepaalt het maximum aantal planeten dat je kunt hebben.</p>
                        </div>
                        <div class="hq-info-row">
                            <label for="hqLevelInput">Level:</label>
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
                        <p class="hq-help-text">💡 Bij level increase worden automatisch nieuwe planeten toegevoegd.</p>
                    </div>
                `;
                container.appendChild(hqInfo);

                // Attach HQ level change handler
                document.getElementById('hqLevelInput')?.addEventListener('change', (e) => {
                    const oldLevel = galaxyConfig.hqLevel;
                    const newLevel = parseInt(e.target.value);

                    if (newLevel > oldLevel) {
                        // Automatically add planets if HQ level increased
                        const planetsToAdd = newLevel - galaxyConfig.planets.length;
                        if (planetsToAdd > 0) {
                            for (let i = 0; i < planetsToAdd; i++) {
                                const planetNumber = galaxyConfig.planets.length + 1;
                                galaxyConfig.planets.push({
                                    name: `Planet ${String.fromCharCode(64 + planetNumber)}`,
                                    buildings: {}
                                });
                            }
                            console.log(`✨ Added ${planetsToAdd} planet(s) due to HQ level increase from ${oldLevel} to ${newLevel}`);
                        }
                    }

                    galaxyConfig.hqLevel = newLevel;
                    saveGalaxyConfig();
                    renderPlanetTabs();
                    renderBuildings();
                    updateWorkforceCalculator();
                });
            }

            // Don't render HQ as a regular building card
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
        updateWorkforceCalculator();

        // Clear planet button
        document.getElementById('clearPlanetBtn')?.addEventListener('click', () => {
            if (confirm(`Are you sure you want to clear all buildings on ${planetName}?`)) {
                setCurrentPlanetBuildings({});
                saveGalaxyConfig();
                renderBuildings();
                updateWorkforceCalculator();
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
                renderPlanetTabs(); // Update building count in tab
                updateWorkforceCalculator();
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

    // Initialize
    console.log('🚀 Initializing multi-planet buildings page...');
    loadBuildings();
    loadWorkers();
    setupSummaryTabs();
    setupPlanetFilters();

    // ========================================
    // WORKER UPKEEP CALCULATOR WITH TABS
    // ========================================

    let activeWorkerTab = 0; // Index of active worker type tab

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
        let grandTotalCost = 0;
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

            html += '</div>'; // consumables-list

            html += '<div class="upkeep-total-section">';
            html += `<span class="total-label">Total Daily Upkeep (${getWorkerTypeName(workerData.typeIndex)}):</span>`;
            html += `<span class="total-value">€${totalUpkeepCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}/day</span>`;
            html += '</div>';

            html += '</div>'; // upkeep-card

            grandTotalCost = totalUpkeepCost;
        }

        html += '</div>'; // upkeep-content

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
});
