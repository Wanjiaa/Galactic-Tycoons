<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Worker Upkeep - Galactic Tycoons</title>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/buildings-upkeep.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>💰 Worker Upkeep Calculator</h1>
    </header>

    <div class="gt-main-content">
        <!-- System Filter -->
        <div class="card">
            <div class="card-header">
                <h2>Filter per System</h2>
            </div>
            <div class="card-body">
                <div class="planet-filter-tabs" id="upkeepSystemTabs">
                    <!-- Tabs will be dynamically generated -->
                </div>
            </div>
        </div>

        <!-- Upkeep Calculator -->
        <div class="card">
            <div class="card-header">
                <h2>💰 Daily Worker Upkeep Costs</h2>
            </div>
            <div class="card-body">
                <p class="upkeep-intro">Berekend voor alle <strong>gebruikte</strong> workers over alle systems (alleen consumer buildings). Beschikbare
                    maar ongebruikte workers kosten geen resources.</p>
                <div class="upkeep-summary-grid" id="upkeepSummaryGrid">
                    <p class="muted">Loading worker data...</p>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>

