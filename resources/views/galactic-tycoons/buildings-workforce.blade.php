<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Workforce Summary - Galactic Tycoons</title>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/buildings-workforce.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>👷 Workforce Summary</h1>
    </header>

    <div class="gt-main-content">
        <!-- System Filter -->
        <div class="card">
            <div class="card-header">
                <h2>Filter per System</h2>
            </div>
            <div class="card-body">
                <div class="planet-filter-tabs" id="workforceSystemTabs">
                    <!-- Tabs will be dynamically generated -->
                </div>
            </div>
        </div>

        <!-- Workforce Stats -->
        <div class="card">
            <div class="card-header">
                <h2>👷 Workforce Balance</h2>
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
    </div>
</div>
</body>
</html>

