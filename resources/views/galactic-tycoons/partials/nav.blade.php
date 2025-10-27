<nav class="gt-sidebar-nav" id="gtSidebarNav">
    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
        <span class="toggle-icon">☰</span>
    </button>

    <div class="sidebar-links">
        <a href="{{ route('galactic-tycoons.index') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.index') ? 'active' : '' }}"
           data-tooltip="Home">
            <span class="link-icon">🏠</span>
            <span class="link-text">
                <strong>Home</strong>
                <small>Overzicht</small>
            </span>
        </a>

        <a href="{{ route('galactic-tycoons.prices') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.prices') ? 'active' : '' }}"
           data-tooltip="Market Prices">
            <span class="link-icon">💰</span>
            <span class="link-text">
                <strong>Market Prices</strong>
                <small>Beheer prijzen</small>
            </span>
        </a>

        <a href="{{ route('galactic-tycoons.recipes') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.recipes') ? 'active' : '' }}"
           data-tooltip="Recipes">
            <span class="link-icon">🔧</span>
            <span class="link-text">
                <strong>Recipes</strong>
                <small>Beheer recipes</small>
            </span>
        </a>

        <a href="{{ route('galactic-tycoons.buildings.systems') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.buildings.*') ? 'active' : '' }}"
           data-tooltip="Buildings per System">
            <span class="link-icon">🏭</span>
            <span class="link-text">
                <strong>Buildings</strong>
                <small>Per System</small>
            </span>
        </a>

        <a href="{{ route('galactic-tycoons.buildings.upkeep') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.buildings.upkeep') ? 'active' : '' }}"
           data-tooltip="Worker Upkeep">
            <span class="link-icon">💰</span>
            <span class="link-text">
                <strong>Upkeep</strong>
                <small>Worker Costs</small>
            </span>
        </a>

        <a href="{{ route('galactic-tycoons.buildings.workforce') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.buildings.workforce') ? 'active' : '' }}"
           data-tooltip="Workforce Summary">
            <span class="link-icon">👷</span>
            <span class="link-text">
                <strong>Workforce</strong>
                <small>Balance & Stats</small>
            </span>
        </a>

        <a href="{{ route('galactic-tycoons.calculator') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.calculator') ? 'active' : '' }}"
           data-tooltip="Calculator">
            <span class="link-icon">⚙️</span>
            <span class="link-text">
                <strong>Calculator</strong>
                <small>Bereken kosten</small>
            </span>
        </a>

        <a href="{{ route('galactic-tycoons.planner') }}"
           class="sidebar-link {{ request()->routeIs('galactic-tycoons.planner') ? 'active' : '' }}"
           data-tooltip="Planner">
            <span class="link-icon">🔮</span>
            <span class="link-text">
                <strong>Planner</strong>
                <small>Plan buildings</small>
            </span>
        </a>
    </div>
</nav>
