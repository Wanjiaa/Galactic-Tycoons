@extends('layouts.app')

@section('title', 'Galactic Tycoons Tools')

@section('content')
<div class="gt-container">
    <header class="gt-header">
        <div class="header-content">
            <h1>🌌 Galactic Tycoons Tools</h1>
            <p class="subtitle">Planning & calculation tools for your space empire</p>
        </div>
    </header>

    <div class="tools-grid">
        <div class="tool-card">
            <div class="tool-icon">💰</div>
            <h2 class="tool-title">Market Prices</h2>
            <p class="tool-description">Manage market prices and fetch live data from the game API</p>
            <a href="{{ route('galactic-tycoons.prices') }}" class="tool-button">
                Open Prices →
            </a>
        </div>

        <div class="tool-card">
            <div class="tool-icon">⚙️</div>
            <h2 class="tool-title">Cost Calculator</h2>
            <p class="tool-description">Calculate crafting costs vs market prices for any item</p>
            <a href="{{ route('galactic-tycoons.calculator') }}" class="tool-button">
                Open Calculator →
            </a>
        </div>

        <div class="tool-card">
            <div class="tool-icon">🏭</div>
            <h2 class="tool-title">Buildings</h2>
            <p class="tool-description">Configure your buildings and track production</p>
            <a href="{{ route('galactic-tycoons.buildings') }}" class="tool-button">
                Manage Buildings →
            </a>
        </div>

        <div class="tool-card">
            <div class="tool-icon">🔮</div>
            <h2 class="tool-title">Planner</h2>
            <p class="tool-description">Plan future buildings and calculate costs, weight & workforce</p>
            <a href="{{ route('galactic-tycoons.planner') }}" class="tool-button">
                Open Planner →
            </a>
        </div>

        <div class="tool-card">
            <div class="tool-icon">📜</div>
            <h2 class="tool-title">Recipes</h2>
            <p class="tool-description">Browse all crafting recipes and production chains</p>
            <a href="{{ route('galactic-tycoons.recipes') }}" class="tool-button">
                View Recipes →
            </a>
        </div>
    </div>

    <footer class="gt-footer">
        <p>Made for the Galactic Tycoons community</p>
    </footer>
</div>
@endsection
