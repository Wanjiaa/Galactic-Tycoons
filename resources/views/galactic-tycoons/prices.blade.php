<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Market Prices - Galactic Tycoons</title>

    <script>
        // Debug: Log raw PHP data
        console.log('PHP $recipes count:', <?php
                                           echo count($recipes ?? []); ?>);
        console.log('PHP $items count:', <?php
                                         echo count($items ?? []); ?>);

        <?php
        if (!empty($recipes) && count($recipes) > 0): ?>
        console.log('First recipe from PHP:', <?php
                                                  echo json_encode($recipes[0] ?? null); ?>);
        <?php
        endif; ?>

            window.gtRecipes = @json($recipes ?? []);
        window.gtItems = @json($items ?? []);

        console.log('Recipes loaded:', window.gtRecipes ? window.gtRecipes.length : 0);
        console.log('Items loaded:', window.gtItems ? window.gtItems.length : 0);

        if (window.gtRecipes && window.gtRecipes.length > 0) {
            console.log('First recipe in JS:', window.gtRecipes[0]);
            console.log('Recipe has output field?', 'output' in window.gtRecipes[0]);
        }
    </script>

    @vite(['resources/sass/galactic-tycoons/shared.scss', 'resources/js/galactic-tycoons/prices.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>💰 Market Prices</h1>
    </header>

    <div class="gt-main-content">
        <div class="card">
            <div class="card-header">
                <h2>Bulk Import</h2>
            </div>
            <div class="card-body">
                <textarea id="pastePrices" placeholder="Bv: Hydrogen 65,00&#10;Nitrogen 200,00&#10;Argon -"></textarea>
                <div class="button-row">
                    <button class="btn btn-primary" id="applyPaste">✓ Importeren</button>
                    <button class="btn btn-success" id="fetchFromAPI">🌐 Haal Prijzen Op van API</button>
                    <button class="btn btn-danger" id="clearPrices">🗑 Alles Wissen</button>
                </div>
                <div id="apiStatus" class="api-status"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Prijzen Beheer</h2>
                <button class="btn btn-small btn-primary" id="addPrice">+ Toevoegen</button>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table id="pricesTable">
                        <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Marktprijs</th>
                            <th>Productiekosten</th>
                            <th style="width:80px">Acties</th>
                        </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
