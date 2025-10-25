<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Machines & Buildings - Galactic Tycoons</title>

    @vite(['resources/sass/games/galactic-tycoons/shared.scss', 'resources/js/games/galactic-tycoons/machines.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>🏭 Machines & Buildings</h1>
    </header>

    <div class="gt-main-content">
        <div class="card upkeep-calculator">
            <div class="card-header">
                <h3>💰 Worker Upkeep</h3>
            </div>
            <div class="card-body">
                <p class="upkeep-intro">Berekend voor alle <strong>gebruikte</strong> workers (alleen consumer buildings). Beschikbare maar ongebruikte workers kosten geen resources.</p>

                <div class="upkeep-summary-grid" id="upkeepSummaryGrid">
                    <p class="muted">Loading worker data...</p>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Welke machines/buildings heb je?</h2>
            </div>
            <div class="card-body">
                <div class="tier-tabs" id="tierTabs"></div>
                <div id="machinesList">
                    <p class="muted">Laden van machines...</p>
                </div>
            </div>
        </div>

        <div class="info-card">
            <h3>ℹ️ Info</h3>
            <p>Vink aan welke machines/buildings je bezit. De calculator zal alleen recipes gebruiken waarvoor je de benodigde machine hebt.</p>
            <p>Als je een machine niet hebt, zal de calculator het intermediate product als "te kopen" aanmerken.</p>
            <p><strong>Tiers:</strong> Machines zijn gegroepeerd per tier (1-4). Hogere tiers zijn geavanceerdere machines.</p>
            <p><strong>Workforce:</strong> Colony Barracks voegt workers toe, andere buildings gebruiken workers. Als je te weinig workforce hebt, werken je buildings op percentage.</p>
        </div>
    </div>
</div>
</body>
</html>
