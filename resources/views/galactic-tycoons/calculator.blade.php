<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Cost Calculator - Galactic Tycoons</title>

    <script>
        // Pass data from PHP to JavaScript
        window.gtRecipes = @json($recipes ?? []);
        window.gtItems = @json($items ?? []);
        window.gtMachines = @json($machines ?? []);

        console.log('Calculator data loaded:');
        console.log('- Recipes:', window.gtRecipes.length);
        console.log('- Items:', window.gtItems.length);
        console.log('- Machines:', window.gtMachines.length);
    </script>

    @vite(['resources/sass/galactic-tycoons/calculator.scss', 'resources/js/galactic-tycoons/calculator.js'])
</head>
<body>
@include('galactic-tycoons.partials.nav')

<div class="gt-page-content">
    <header class="gt-page-header">
        <h1>⚙️ Cost Calculator</h1>
    </header>

    <div class="gt-main-content">
        <div class="card">
            <div class="card-header">
                <h2>Item Selectie</h2>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-field">
                        <label>Output Item</label>
                        <input id="itemName" list="itemOptions" placeholder="Selecteer een item..."/>
                        <datalist id="itemOptions"></datalist>
                    </div>
                    <div class="form-field" style="max-width:140px">
                        <label>Aantal</label>
                        <input id="qtyMake" type="number" min="1" step="1" value="1"/>
                    </div>
                </div>
                <div class="button-row">
                    <button class="btn btn-primary" id="addItemBtn">➕ Voeg Item Toe</button>
                    <button class="btn btn-secondary" id="clearAllBtn">🗑️ Wis Alles</button>
                </div>

                <div class="selected-items-section">
                    <h3>Geselecteerde Items</h3>
                    <div id="selectedItemsList">
                        <p class="muted">Geen items geselecteerd. Voeg items toe om kosten te berekenen.</p>
                    </div>
                </div>

                <div id="activeRecipeBox" class="info-box" style="display:none"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>📊 Cost Breakdown</h2>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table id="resultTable">
                        <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Nodig</th>
                            <th>Voorraad</th>
                            <th>Te Kopen</th>
                            <th>Gewicht</th>
                            <th>Prijs/stuk</th>
                            <th>Craft Kost</th>
                            <th>Market Kost</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td colspan="8" class="muted text-center">Voeg items toe om kosten te berekenen</td>
                        </tr>
                        </tbody>
                        <tfoot>
                        <tr>
                            <td colspan="2"><strong>TOTAAL TE KOPEN</strong></td>
                            <td id="totalToBuy">0</td>
                            <td colspan="3"><strong>TOTALE CRAFT KOST</strong></td>
                            <td class="success" id="totalCraft">$0</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colspan="6"><strong>TOTALE MARKET KOST</strong></td>
                            <td colspan="2" class="info" id="totalMarket">$0</td>
                        </tr>
                        <tr id="savingsRow">
                            <td colspan="6"><strong>BESPARING (Craft vs Market)</strong></td>
                            <td colspan="2" class="success" id="savingsAmount">$0</td>
                        </tr>
                        <tr id="totalWeightRow">
                            <td colspan="6"><strong>📦 TOTAAL GEWICHT (Transport)</strong></td>
                            <td colspan="2" class="info" id="totalWeight">0 t</td>
                        </tr>
                        <tr id="totalTimeRow" style="display:none">
                            <td colspan="7"><strong>TOTALE CRAFTING TIJD</strong></td>
                            <td class="info" id="totalTime">0s</td>
                        </tr>
                        <tr>
                            <td colspan="8" style="text-align: center; padding-top: 12px;">
                                <button class="btn btn-secondary" id="resetHaveBtn">↺ Reset Voorraad</button>
                                <button class="btn btn-primary" id="computeBtn">🔄 Herbereken</button>
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
