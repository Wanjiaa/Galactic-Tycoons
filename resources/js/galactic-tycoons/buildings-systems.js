// ========================================
// GALACTIC TYCOONS - Buildings per System
// Manage buildings across multiple systems
// ========================================

import './sidebar-nav.js';
import systemsData from './data/systems.json';

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '/api/galactic-tycoons/buildings';

    let buildings = [];
    let prices = {};
    let activeTier = 1;
    let activeSystem = 0;
    let availableSystems = systemsData;

    let galaxyConfig = JSON.parse(localStorage.getItem('gt_galaxy_config_v2') || `{"hqLevel": 1, "starterSystemId": 1, "systems": [{"systemId": 1, "name": "${availableSystems[0].name}", "buildings": {}}]}`);

    // Migrate old config
    const oldConfig = JSON.parse(localStorage.getItem('gt_building_config_v1') || 'null');
    if (oldConfig && galaxyConfig.systems && galaxyConfig.systems.length === 1 && Object.keys(galaxyConfig.systems[0].buildings).length === 0) {
        console.log('Migrating old config...');
        galaxyConfig.systems[0].buildings = oldConfig;
        saveGalaxyConfig();
        localStorage.removeItem('gt_building_config_v1');
    }

    // Backwards compatibility: migrate "planets" to "systems"
    if (galaxyConfig.planets && !galaxyConfig.systems) {
        console.log('Migrating planets to systems...');
        galaxyConfig.systems = galaxyConfig.planets.map(planet => ({
            systemId: planet.planetId || planet.id || 1,
            name: planet.name,
            buildings: planet.buildings
        }));
        delete galaxyConfig.planets;
        saveGalaxyConfig();
    }

    function getMaxSystems() {
        return galaxyConfig.hqLevel;
    }

    function loadPrices() {
        const storedPrices = localStorage.getItem('gt_prices_v1');
        if (storedPrices) {
            try {
                prices = JSON.parse(storedPrices);
            } catch (e) {
                console.error('Failed to parse prices:', e);
                prices = {};
            }
        }
    }

    loadPrices();

    function saveGalaxyConfig() {
        localStorage.setItem('gt_galaxy_config_v2', JSON.stringify(galaxyConfig));
        console.log('Saved galaxy config:', galaxyConfig);

        // Backwards compatibility
        if (galaxyConfig.systems && galaxyConfig.systems[0]) {
            localStorage.setItem('gt_building_config_v1', JSON.stringify(galaxyConfig.systems[0].buildings));
        }
    }

    function exportConfig() {
        const dataStr = JSON.stringify(galaxyConfig, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `galactic-tycoons-systems-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function importConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!imported.hqLevel || !imported.systems || !Array.isArray(imported.systems)) {
                    alert('❌ Invalid configuration file format');
                    return;
                }

                if (confirm(`Import configuration with HQ Level ${imported.hqLevel} and ${imported.systems.length} system(s)?`)) {
                    galaxyConfig = imported;
                    activeSystem = 0;
                    saveGalaxyConfig();
                    renderSystemTabs();
                    renderBuildings();
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

    async function loadBuildings() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (!Array.isArray(data)) throw new Error('Invalid data format');

            buildings = data;
            console.log('Loaded buildings:', buildings.length);
            renderSystemTabs();
            renderBuildings();
        } catch (error) {
            console.error('Failed to load buildings:', error);
            const container = document.getElementById('buildingsList');
            if (container) {
                container.innerHTML = '<p class="muted">❌ Error loading buildings: ' + error.message + '</p>';
            }
        }
    }

    function renderSystemTabs() {
        const container = document.getElementById('systemTabs');
        if (!container) return;

        const maxSystems = getMaxSystems();
        let html = '<div class="planet-tabs-container">';

        // Render existing systems
        if (galaxyConfig.systems) {
            galaxyConfig.systems.forEach((system, index) => {
                const isActive = index === activeSystem;
                const buildingCount = Object.keys(system.buildings || {}).reduce((sum, name) =>
                    sum + ((system.buildings[name].count) || 0), 0);

                html += `
                    <div class="planet-tab ${isActive ? 'active' : ''}" data-system-index="${index}">
                        <div class="planet-tab-header">
                            <span class="planet-name">${system.name}</span>
                        </div>
                        <div class="planet-stats">
                            <span class="planet-buildings-count">${buildingCount} buildings</span>
                        </div>
                    </div>
                `;
            });
        }

        // Add system button
        if (galaxyConfig.systems && galaxyConfig.systems.length < maxSystems) {
            const nextSystemData = availableSystems.find(s => s.hq_level_required === galaxyConfig.systems.length + 1) ||
                                   availableSystems[galaxyConfig.systems.length];
            const nextSystemName = nextSystemData ? nextSystemData.name : `System ${galaxyConfig.systems.length + 1}`;

            html += `
                <div class="planet-tab add-planet-tab" id="addSystemBtn">
                    <span class="add-planet-icon">➕</span>
                    <span class="add-planet-text">Add ${nextSystemName}</span>
                </div>
            `;
        }

        // Locked systems
        if (galaxyConfig.systems) {
            for (let i = galaxyConfig.systems.length; i < maxSystems; i++) {
                const lockedSystemData = availableSystems.find(s => s.hq_level_required === i + 1) || availableSystems[i];
                const lockedSystemName = lockedSystemData ? lockedSystemData.name : `System ${i + 1}`;

                html += `
                    <div class="planet-tab locked-planet">
                        <span class="locked-icon">🔒</span>
                        <span class="locked-text">${lockedSystemName}</span>
                        <span class="locked-hint">HQ Lvl ${i + 1}</span>
                    </div>
                `;
            }
        }

        html += '</div>';
        container.innerHTML = html;

        // Event listeners
        document.querySelectorAll('.planet-tab:not(.add-planet-tab):not(.locked-planet)').forEach(tab => {
            tab.addEventListener('click', () => {
                const index = parseInt(tab.dataset.systemIndex);
                activeSystem = index;
                renderSystemTabs();
                renderBuildings();
            });
        });

        document.getElementById('addSystemBtn')?.addEventListener('click', addSystem);
    }

    function addSystem() {
        const systemNumber = galaxyConfig.systems.length + 1;
        const systemData = availableSystems.find(s => s.hq_level_required === systemNumber) || availableSystems[systemNumber - 1];

        const newSystem = {
            systemId: systemData.id,
            name: systemData.name,
            buildings: {}
        };
        galaxyConfig.systems.push(newSystem);
        activeSystem = galaxyConfig.systems.length - 1;
        saveGalaxyConfig();
        renderSystemTabs();
        renderBuildings();
    }

    function getCurrentSystemBuildings() {
        return galaxyConfig.systems && galaxyConfig.systems[activeSystem] ?
               galaxyConfig.systems[activeSystem].buildings : {};
    }

    function setCurrentSystemBuildings(buildings) {
        if (galaxyConfig.systems && galaxyConfig.systems[activeSystem]) {
            galaxyConfig.systems[activeSystem].buildings = buildings;
        }
    }

    function renderBuildings() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        if (buildings.length === 0) {
            container.innerHTML = '<p class="muted">Geen buildings beschikbaar.</p>';
            return;
        }

        const buildingConfig = getCurrentSystemBuildings();
        const systemName = galaxyConfig.systems && galaxyConfig.systems[activeSystem] ?
                          galaxyConfig.systems[activeSystem].name : 'Unknown';

        // Sort buildings
        const sortedBuildings = [...buildings].sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            if (a.workforce_type === 'provider' && b.workforce_type !== 'provider') return -1;
            if (a.workforce_type !== 'provider' && b.workforce_type === 'provider') return 1;
            return a.name.localeCompare(b.name);
        });

        container.innerHTML = `<h3>📍 ${systemName}</h3>`;

        // Tier tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tier-tabs';

        const tiers = [...new Set(sortedBuildings.map(b => b.tier))].sort();
        tiers.forEach(tier => {
            const isActive = tier === activeTier;
            const tab = document.createElement('button');
            tab.className = `tier-tab ${isActive ? 'active' : ''}`;
            tab.textContent = `Tier ${tier}`;
            tab.addEventListener('click', () => {
                activeTier = tier;
                renderBuildings();
            });
            tabsContainer.appendChild(tab);
        });

        container.appendChild(tabsContainer);

        // Filter by tier
        const tierBuildings = sortedBuildings.filter(m => m.tier === activeTier);

        if (tierBuildings.length === 0) {
            container.innerHTML += '<p class="muted">Geen buildings voor deze tier.</p>';
            return;
        }

        const tierGrid = document.createElement('div');
        tierGrid.className = 'machines-grid';

        tierBuildings.forEach(building => {
            const config = buildingConfig[building.name] || {count: 0, levels: []};
            const card = document.createElement('div');
            card.className = 'machine-card';
            if (config.count > 0) card.classList.add('active');

            let workforceInfo = '';
            if (building.workforce_type === 'provider' && building.workforce) {
                workforceInfo = `<span class="workforce-badge provider">+${building.workforce.workers} Workers</span>`;
            } else if (building.workforce_type === 'consumer' && building.workforce) {
                workforceInfo = `<span class="workforce-badge consumer">${building.workforce.workers} Workers</span>`;
            }

            const categoryBadge = building.category ? `<span class="category-badge">${building.category}</span>` : '';

            let levelsDisplay = '';
            if (config.count > 0) {
                const levelTags = config.levels.map(lvl => `<span class="level-tag">Lvl ${lvl}</span>`).join(' ');
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
        document.querySelectorAll('.count-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const buildingName = e.target.dataset.building;
                const count = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                e.target.value = count;

                const buildingConfig = getCurrentSystemBuildings();
                if (!buildingConfig[buildingName]) {
                    buildingConfig[buildingName] = {count: 0, levels: []};
                }

                const oldCount = buildingConfig[buildingName].count;
                buildingConfig[buildingName].count = count;

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

                setCurrentSystemBuildings(buildingConfig);
                saveGalaxyConfig();
                renderBuildings();
                renderSystemTabs();
            });
        });

        document.querySelectorAll('.level-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const buildingName = e.target.dataset.building;
                const index = parseInt(e.target.dataset.index);
                const level = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                e.target.value = level;

                const buildingConfig = getCurrentSystemBuildings();
                if (buildingConfig[buildingName]) {
                    buildingConfig[buildingName].levels[index] = level;
                    setCurrentSystemBuildings(buildingConfig);
                    saveGalaxyConfig();
                    renderBuildings();
                }
            });
        });
    }

    // Initialize
    console.log('🚀 Initializing Buildings per System page...');
    loadBuildings();

    // Export/Import
    document.getElementById('exportConfigBtn')?.addEventListener('click', exportConfig);
    document.getElementById('importConfigInput')?.addEventListener('change', importConfig);
});

