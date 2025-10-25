<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Buildings - Galactic Tycoons</title>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/buildings.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>🏭 Buildings</h1>
    </header>

    <div class="gt-main-content">
        <div class="card upkeep-calculator">
            <div class="card-header">
                <h3>💰 Worker Upkeep</h3>
            </div>
            <div class="card-body">
                <p class="upkeep-intro">Berekend voor alle <strong>gebruikte</strong> workers (alleen consumer buildings). Beschikbare
                    maar ongebruikte workers kosten geen resources.</p>

                <div class="upkeep-summary-grid" id="upkeepSummaryGrid">
                    <p class="muted">Loading worker data...</p>
                </div>
            </div>
        </div>

        <div class="card workforce-summary">
            <div class="card-header">
                <h3>👷 Workforce Summary</h3>
            </div>
            <div class="card-body">
                <div class="workforce-stats">
                    <div class="stat-item">
                        <div class="stat-label">Available Workers</div>
                        <div class="stat-value" id="workforceAvailable">0</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Workers Needed</div>
                        <div class="stat-value" id="workforceNeeded">0</div>
                    </div>
                    <div class="stat-item" id="workforceBalance">
                        <div class="stat-label">Balance</div>
                        <div class="stat-value" id="workforceBalanceValue">0</div>
                    </div>
                    <div class="stat-item" id="workforceEfficiency">
                        <div class="stat-label">Efficiency</div>
                        <div class="stat-value" id="workforceEfficiencyValue">100%</div>
                    </div>
                </div>
                <div id="workforceBreakdown"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Welke buildings heb je?</h2>
            </div>
            <div class="card-body">
                <div class="tier-tabs" id="tierTabs"></div>
                <div id="buildingsList">
                    <p class="muted">Laden van buildings...</p>
                </div>
            </div>
        </div>

        <div class="info-card">
            <h3>ℹ️ Info</h3>
            <p>Vink aan welke buildings je bezit. De calculator zal alleen recipes gebruiken waarvoor je de benodigde building hebt.</p>
            <p>Als je een building niet hebt, zal de calculator het intermediate product als "te kopen" aanmerken.</p>
            <p><strong>Tiers:</strong> Buildings zijn gegroepeerd per tier (1-4). Hogere tiers zijn geavanceerdere buildings.</p>
            <p><strong>Workforce:</strong> Housing buildings voegen workers toe, andere buildings gebruiken workers. Als je te weinig workforce hebt, werken je buildings op percentage.</p>
        </div>
    </div>
</div>
</body>
</html>
