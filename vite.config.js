import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/sass/galactic-tycoons/shared.scss',
                'resources/sass/galactic-tycoons/calculator.scss',
                'resources/sass/galactic-tycoons/index.scss',
                'resources/js/galactic-tycoons/prices.js',
                'resources/js/galactic-tycoons/recipes.js',
                'resources/js/galactic-tycoons/buildings.js',
                'resources/js/galactic-tycoons/calculator.js',
                'resources/js/galactic-tycoons/planner.js',
                'resources/js/galactic-tycoons/machines.js',
            ],
            refresh: true,
        }),
    ],
});
