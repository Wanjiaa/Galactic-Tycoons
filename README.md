# Galactic Tycoons Tools

A Laravel application providing various calculators and planning tools for the Galactic Tycoons game.

## Features

- **Market Prices**: Manage and track market prices, fetch from external API
- **Cost Calculator**: Calculate crafting costs vs market costs for items
- **Buildings Manager**: Configure your buildings and calculate production
- **Planner**: Plan future buildings and calculate material costs, weight, and workforce impact
- **Recipes Browser**: View all available crafting recipes

## Installation

```bash
# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run development server
php artisan serve
npm run dev
```

## API Integration

The application fetches live market prices from the Galactic Tycoons API:
- Endpoint: `https://rest-api.galaxytycoon.cyou/public/exchange/mat-prices`
- Rate Limit: 100 cost units per 5 minutes per IP
- Laravel proxy handles CORS issues

## Tech Stack

- Laravel 12
- Vite
- Vanilla JavaScript (no framework)
- SASS
- Bootstrap 5 (minimal, mainly for utilities)

## Project Structure

```
app/Http/Controllers/GalacticTycoons/  - Game controllers
resources/js/games/galactic-tycoons/   - Frontend JavaScript
resources/sass/games/galactic-tycoons/ - Styling
resources/views/galactic-tycoons/      - Blade templates
routes/web.php                          - Application routes
```

## License

MIT

# Galactic-Tycoons
