<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Buildings per System - Galactic Tycoons</title>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/buildings-systems.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>🏭 Buildings per System</h1>
        <div class="header-actions">
            <button class="btn btn-secondary" id="exportConfigBtn">📤 Export All Buildings</button>
            <label class="btn btn-secondary" for="importConfigInput">📥 Import All Buildings</label>
            <input type="file" id="importConfigInput" accept=".json" style="display: none;">
        </div>
    </header>

    <div class="gt-main-content">
        <!-- System Tabs -->
        <div class="card">
            <div class="card-header">
                <h2>🌍 Select System</h2>
            </div>
            <div class="card-body">
                <div id="systemTabs">
                    <p class="muted">Loading systems...</p>
                </div>
            </div>
        </div>

        <!-- Buildings List (per selected system) -->
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

