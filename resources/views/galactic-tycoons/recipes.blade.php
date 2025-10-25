<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Crafting Recipes - Galactic Tycoons</title>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/recipes.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>🔧 Crafting Recipes</h1>
    </header>

    <div class="gt-main-content">
        <div class="card">
            <div class="card-header">
                <h2>Recipes Beheer</h2>
                <div class="button-row">
                    <button class="btn btn-small btn-primary" id="addRecipe">+ Toevoegen</button>
                    <button class="btn btn-small btn-secondary" id="seedRecipes">📝 Demo Data</button>
                    <button class="btn btn-small btn-danger" id="clearRecipes">🗑 Alles Wissen</button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table id="recipesTable">
                        <thead>
                        <tr>
                            <th>Output</th>
                            <th style="width:100px">Qty</th>
                            <th style="width:120px">Timer (sec)</th>
                            <th>Machine/Building</th>
                            <th>Ingredients</th>
                            <th style="width:80px">Acties</th>
                        </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="info-card">
            <h3>ℹ️ Hoe werkt het?</h3>
            <ul>
                <li><strong>Output:</strong> Het item dat geproduceerd wordt</li>
                <li><strong>Qty:</strong> Hoeveel van het output item per craft</li>
                <li><strong>Timer:</strong> Hoeveel seconden het duurt om te craften</li>
                <li><strong>Machine:</strong> Welke machine/building vereist is</li>
                <li><strong>Ingredients:</strong> Format: "2 iron, 10 concrete, 5 water"</li>
            </ul>
        </div>
    </div>
</div>
</body>
</html>