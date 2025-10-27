<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Building Planner - Galactic Tycoons</title>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/planner.js'])

    <script>
        // Make items data available globally for weight calculations
        window.gtItems = @json($items ?? []);
    </script>
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>🔮 Building Planner</h1>
    </header>

    <div class="gt-main-content">
        <div class="info-card">
            <h3>ℹ️ Plan je toekomstige machines</h3>
            <p>Selecteer machines die je wilt bouwen en zie direct de impact op kosten, upkeep en workforce.</p>
            <p><strong>Kosten:</strong> Basis cost + 1 van elk materiaal per level.</p>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>📊 Resultaten</h2>
            </div>
            <div class="card-body">
                <div id="plannerStats">
                    <p class="muted">Voeg buildings toe om de kosten en impact te zien...</p>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>📋 Planning</h2>
            </div>
            <div class="card-body">
                <div class="planner-mode-selector">
                    <button class="mode-btn active" data-mode="new" id="modeNewBtn">➕ Nieuwe Buildings</button>
                    <button class="mode-btn" data-mode="upgrade" id="modeUpgradeBtn">⬆️ Upgrades</button>
                </div>

                <div class="planner-section" id="newBuildingsSection">
                    <div class="tier-tabs" id="plannerTierTabs"></div>
                    <div class="planner-machine-list" id="plannerMachineList">
                        <p class="muted">Laden van machines...</p>
                    </div>
                </div>

                <div class="planner-section hidden" id="upgradeSection">
                    <div class="upgrade-list" id="upgradeList">
                        <p class="muted">Laden van huidige buildings...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
