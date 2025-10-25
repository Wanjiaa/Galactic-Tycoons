<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Machine Planner - Galactic Tycoons</title>

    <script>
        // Pass items data to JavaScript for weight calculations
        window.gtItems = @json($items ?? []);
        console.log('Planner: Loaded items with weights:', window.gtItems.length);
    </script>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/planner.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>🔮 Machine Planner</h1>
    </header>

    <div class="gt-main-content">
        <div class="card">
            <div class="card-header">
                <h2>Plan je toekomstige machines</h2>
            </div>
            <div class="card-body">
                <div class="planner-instructions">
                    <p>Selecteer machines die je wilt bouwen en zie direct de impact op kosten, upkeep en workforce.</p>
                </div>

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
