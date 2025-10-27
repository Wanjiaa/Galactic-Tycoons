<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Buildings - Galactic Tycoons</title>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/buildings-multi-planet.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>🏭 Multi-System Buildings</h1>
        <div class="header-actions">
            <button class="btn btn-secondary" id="exportConfigBtn">📤 Export All Buildings</button>
            <label class="btn btn-secondary" for="importConfigInput">📥 Import All Buildings</label>
            <input type="file" id="importConfigInput" accept=".json" style="display: none;">
        </div>
    </header>

    <div class="gt-main-content">
        <!-- Tabbed Summary Section -->
        <div class="card">
            <div class="card-header">
                <div class="summary-tabs">
                    <button class="summary-tab active" data-tab="upkeep">💰 Worker Upkeep</button>
                    <button class="summary-tab" data-tab="workforce">👷 Workforce Summary</button>
                    <button class="summary-tab" data-tab="buildings">🏭 Buildings per System</button>
                </div>
            </div>
            <div class="card-body">
                <!-- Workforce Tab -->
                <div class="summary-tab-content" id="workforceTab">
                    <div class="planet-filter-tabs" id="workforceSystemTabs">
                        <!-- Tabs will be dynamically generated -->
                    </div>
                    <p class="upkeep-intro">Berekend voor alle <strong>gebruikte</strong> workers over alle systems (alleen consumer buildings). Beschikbare
                        maar ongebruikte workers kosten geen resources.</p>
                    <div class="upkeep-summary-grid" id="upkeepSummaryGrid">
                        <p class="muted">Loading worker data...</p>
                    </div>
                </div>

                <!-- Workforce Tab -->
                <div class="summary-tab-content" id="workforceTab">
                    <div class="planet-filter-section">
                        <label>Filter op planeet:</label>
                        <select id="workforcePlanetFilter" class="planet-filter-select">
                    <div class="planet-filter-tabs" id="workforcePlanetTabs">
                        <!-- Tabs will be dynamically generated -->
                            <div class="stat-value" id="workforceBalanceValue">0</div>
                        </div>
                        <div class="stat-item" id="workforceEfficiency">
                            <div class="stat-label">Efficiency</div>
                            <div class="stat-value" id="workforceEfficiencyValue">100%</div>
                        </div>
                    </div>
                    <div id="workforceBreakdown"></div>
                </div>

                <!-- Buildings per Planet Tab -->
                <div class="summary-tab-content" id="buildingsTab">
                    <div id="planetTabs">
                        <p class="muted">Loading planets...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Buildings List (per selected planet) -->
        <div class="card">
            <div class="card-header">
                <h2>🏗️ Buildings Configuratie</h2>
            </div>
            <div class="card-body">
                <div id="buildingsList">
                    <p class="muted">Laden van buildings...</p>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
