# 🎮 Galactic Tycoons Calculator Suite

A Laravel application providing comprehensive calculators and planning tools for the Galactic Tycoons game.

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Tools Overview](#-tools-overview)
- [Data Management](#-data-management)
- [Development](#-development)
- [API Integration](#-api-integration)
- [Tech Stack](#-tech-stack)

## ✨ Features

### Core Tools

- 💰 **Market Prices** - Manage market prices with bulk import and external API sync
- 🔧 **Crafting Recipes** - Manage recipes with crafting timers and machine requirements
- 🏭 **Buildings Manager** - Configure buildings with multiple instances and levels
- ⚙️ **Cost Calculator** - Calculate crafting costs vs market costs with time estimates
- 🔮 **Planner** - Plan future buildings and calculate material costs, weight, and workforce

### Key Features

- ✅ **Real-time Sync** - Multi-tab support via localStorage events
- ✅ **Crafting Timers** - Track production time for all recipes
- ✅ **Workforce Calculator** - Balance workers (providers vs consumers)
- ✅ **Dependency Tree** - Recursive calculation to raw materials
- ✅ **Weight Tracking** - Calculate total weight for logistics planning
- ✅ **Dark Theme UI** - Modern, responsive interface

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
cd /GalacticTycoons

# Install dependencies
composer install
npm install
# Setup environment
cp .env.example .env
php artisan key:generate

# Create SQLite database
touch database/database.sqlite

# Run migrations (if any)
php artisan migrate

# Start development servers
php artisan serve &
npm run dev
```

The application will be available at: **http://localhost:8000**

### First Time Setup

1. Navigate to **Market Prices** and click "Demo Data" to load sample prices
2. Go to **Recipes** and load demo recipes with timers
3. Visit **Buildings** to select which buildings you own
4. Use the **Calculator** to start calculating costs

## 📁 Project Structure

```
GalacticTycoons/
├── app/Http/Controllers/GalacticTycoons/
│   ├── GalacticTycoonsController.php      # Main menu
│   ├── PricesController.php               # Market prices management
│   ├── RecipesController.php              # Recipes with timers
│   ├── BuildingsController.php            # Buildings configuration
│   ├── CalculatorController.php           # Cost calculator
│   └── PlannerController.php              # Building planner
│
├── resources/
│   ├── views/galactic-tycoons/
│   │   ├── index.blade.php                # Overview page
│   │   ├── prices.blade.php               # Prices management
│   │   ├── recipes.blade.php              # Recipes management
│   │   ├── buildings.blade.php            # Buildings selection
│   │   ├── calculator.blade.php           # Cost calculator
│   │   ├── planner.blade.php              # Building planner
│   │   └── partials/
│   │       └── nav.blade.php              # Sidebar navigation
│   │
│   ├── js/galactic-tycoons/
│   │   ├── prices.js                      # Prices logic
│   │   ├── recipes.js                     # Recipes logic
│   │   ├── buildings.js                   # Buildings logic
│   │   ├── machines.js                    # Machines selection (legacy)
│   │   ├── calculator.js                  # Calculator with timers
│   │   ├── planner.js                     # Planner logic
│   │   └── sidebar-nav.js                 # Navigation handler
│   │
│   └── sass/galactic-tycoons/
│       ├── shared.scss                    # Shared styles
│       ├── calculator.scss                # Calculator specific
│       ├── _sidebar-nav.scss              # Sidebar navigation
│       ├── _base.scss                     # Base styles
│       ├── _cards.scss                    # Card components
│       ├── _buttons.scss                  # Button styles
│       ├── _forms.scss                    # Form elements
│       ├── _tables.scss                   # Table styles
│       ├── _utilities.scss                # Utility classes
│       ├── _workforce-calculator.scss     # Workforce styles
│       └── _production-costs.scss         # Production styles
│
├── routes/
│   ├── web.php                            # Main routes file
│   └── games.php                          # Game-specific routes
│
├── database/
│   └── database.sqlite                    # SQLite database
│
├── public/
│   └── build/                             # Compiled assets (Vite)
│
└── vite.config.js                         # Vite configuration
```

## 🛠️ Tools Overview

### 1. 💰 Market Prices (`/galactic-tycoons/prices`)

Manage market prices for all resources.

**Features:**
- Bulk import via textarea (format: "Hydrogen 65,00")
- Manual add/edit individual prices
- Fetch prices from external API
- Demo data for testing
- Real-time sync across tabs

**LocalStorage:** `gt_prices_v1`

---

### 2. 🔧 Crafting Recipes (`/galactic-tycoons/recipes`)

Manage crafting recipes with machines and timers.

**Features:**
- Output item + quantity
- Crafting timer in seconds
- Machine/Building requirement
- Multiple ingredients per recipe
- Support for recipe variants
- Demo recipes with timers

**Recipe Format:**
```javascript
{
  output: 'Iron',
  qtyOut: 3,
  craftTime: 10,  // seconds
  machine: 'Smelting Facility',
  ingredientsText: '5 Iron Ore, 4 Oxygen'
}
```

**LocalStorage:** `gt_recipes_v1`

---

### 3. 🏭 Buildings Manager (`/galactic-tycoons/buildings`)

Configure your buildings with multiple instances and levels.

**Features:**
- Multiple instances per building type
- Individual level tracking per instance
- Workforce calculation (providers vs consumers)
- Worker upkeep cost calculation
- Efficiency percentage display
- Tier-based organization (1-4)

**New Config Format:**
```javascript
{
  "Smelter": {
    count: 2,
    levels: [3, 2]  // Two Smelters: level 3 and level 2
  }
}
```

**LocalStorage:** `gt_building_config_v1`

---

### 4. ⚙️ Cost Calculator (`/galactic-tycoons/calculator`)

Calculate raw material costs and crafting time.

**Features:**
- Recursive dependency tree calculation
- Cost breakdown to raw materials
- Inventory tracking ("Heb ik al")
- Total crafting time calculation
- Weight calculation for logistics
- Comparison: craft vs buy
- Only uses recipes from owned buildings

**Timer Display:**
- Shows crafting time per active recipe
- Calculates total time including intermediates
- Format: "2m 30s" or "45s"

**LocalStorage:** `gt_state_v1`

---

### 5. 🔮 Building Planner (`/galactic-tycoons/planner`)

Plan future buildings and calculate requirements.

**Features:**
- Add buildings to build queue
- Specify level for each building
- Calculate total material costs
- Calculate total weight
- Workforce impact calculation
- Tier-based building selection

**LocalStorage:** `gt_planner_v1`

---

## 💾 Data Management

### LocalStorage Keys

| Key                      | Purpose                                    |
|--------------------------|-------------------------------------------|
| `gt_prices_v1`           | Market prices                             |
| `gt_recipes_v1`          | Crafting recipes (with timers)            |
| `gt_building_config_v1`  | Building configuration (instances/levels) |
| `gt_enabled_machines_v1` | Enabled machines (legacy, maintained)     |
| `gt_state_v1`            | Calculator state (item, qty, inventory)   |
| `gt_planner_v1`          | Planner building queue                    |
| `gt_sidebar_collapsed`   | Sidebar state (collapsed/expanded)        |

### Data Sync

All tools listen to `storage` events for real-time multi-tab synchronization:

- ✅ Price changes instantly visible in Calculator
- ✅ New recipes automatically appear in Buildings list
- ✅ Building changes immediately update Calculator
- ✅ Full multi-tab support

### Backward Compatibility

The system maintains backward compatibility:
- Old `gt_enabled_machines_v1` format auto-migrates to new `gt_building_config_v1`
- Legacy data preserved during migration
- Seamless transition for existing users

---

## 🔧 Development

### Running Development Environment

```bash
# Start Laravel development server
php artisan serve

# Start Vite dev server (hot reload)
npm run dev
```

### Building for Production

```bash
# Compile and minify assets
npm run build
```

### File Watching

Vite provides instant hot reload for:
- ✅ SCSS files - Hot reload without page refresh
- ✅ JavaScript - Instant module replacement
- ✅ Blade templates - Page refresh

### Adding New Features

#### 1. Add a New Tool

1. Create controller in `app/Http/Controllers/GalacticTycoons/`
2. Add route in `routes/web.php`
3. Create blade view in `resources/views/galactic-tycoons/`
4. Add JavaScript in `resources/js/galactic-tycoons/`
5. Add styles in `resources/sass/galactic-tycoons/`
6. Update `vite.config.js` with new entry points
7. Add link to sidebar navigation

#### 2. Modify Existing Tool

1. Edit relevant JavaScript file
2. Update SCSS if needed
3. Changes auto-reload via Vite

---

## 🌐 API Integration

### External API

**Galactic Tycoons Market API:**
- Endpoint: `https://rest-api.galactictycoons.com/public/exchange/mat-prices`
- Rate Limit: 100 cost units per 5 minutes per IP
- Laravel proxy at `/api/galactic-tycoons/prices/fetch` handles CORS

### Internal API Endpoints

| Endpoint                                      | Method | Purpose                    |
|-----------------------------------------------|--------|----------------------------|
| `/api/galactic-tycoons/prices`                | GET    | Get all prices             |
| `/api/galactic-tycoons/prices/fetch`          | POST   | Fetch from external API    |
| `/api/galactic-tycoons/recipes`               | GET    | Get all recipes            |
| `/api/galactic-tycoons/buildings`             | GET    | Get all buildings          |
| `/api/galactic-tycoons/workers`               | GET    | Get worker data            |
| `/api/galactic-tycoons/planner/building-costs`| GET    | Get building construction costs|

---

## 🎨 Design System

### Theme

**Dark Theme Colors:**
```scss
--bg: #0b0c10          // Main background
--card: #12141a         // Card background
--card-hover: #1a1d26   // Hover state
--accent: #6ee7b7       // Mint green accent
--text: #e6e9ef         // Primary text
--text-muted: #9aa4b2   // Secondary text
--line: #22252e         // Borders/dividers
```

### Components

- **Cards** - Rounded corners, subtle borders, hover effects
- **Buttons** - Solid/outline variants with accent color
- **Tables** - Striped rows, hover highlighting
- **Forms** - Clean inputs with focus states
- **Sidebar** - Collapsible navigation with icons
- **Tooltips** - Context-aware hover information

---

## 💻 Tech Stack

### Backend
- **Laravel 12** - PHP framework
- **SQLite** - Lightweight database

### Frontend
- **Vite** - Modern build tool with HMR
- **Vanilla JavaScript** - No framework dependencies
- **SASS** - CSS preprocessing
- **Minimal Bootstrap 5** - Utility classes only

### Development
- **Hot Module Replacement** - Instant updates
- **Source Maps** - Easy debugging
- **Asset Optimization** - Minification and tree-shaking

---

## 📝 Changelog

### v3.0 - Buildings Overhaul (Current)

- ✅ Multiple building instances support
- ✅ Individual level tracking per instance
- ✅ Workforce summary with balance calculation
- ✅ Worker upkeep cost calculator
- ✅ Improved sidebar navigation
- ✅ Fixed icon alignment issues
- ✅ Better collapsed sidebar state

### v2.0 - Restructure

- ✅ Standalone project structure
- ✅ Crafting timers in recipes
- ✅ Total crafting time in calculator
- ✅ Multi-tab sync via storage events
- ✅ Improved UI/UX consistency

### v1.0 - Initial Release

- ✅ Basic calculator functionality
- ✅ Price management
- ✅ Recipe browser
- ✅ Machine selection

---

## 🐛 Troubleshooting

### Common Issues

**Problem:** Assets not loading
```bash
# Clear cache and rebuild
npm run build
php artisan cache:clear
```

**Problem:** LocalStorage data lost
- Check browser settings for localStorage
- Ensure not in private/incognito mode
- Data is stored per domain

**Problem:** API rate limit exceeded
- Wait 5 minutes before retrying
- Use demo data for development
- Consider caching responses locally

---

## 📄 License

MIT License - Feel free to use and modify for your own projects.

---

## 🙏 Credits

Built for the Galactic Tycoons community to make resource management and planning easier.

**Game:** [Galactic Tycoons](https://galactictycoons.com/)  
**Developer:** Marco Baele

---

## 🔗 Quick Links

- [Report a Bug](https://github.com/your-repo/issues)
- [Request a Feature](https://github.com/your-repo/issues)
- [Game Website](https://galactictycoons.com/)

---

**Happy Crafting! 🚀**
