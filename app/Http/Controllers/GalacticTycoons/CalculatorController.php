<?php

namespace App\Http\Controllers\GalacticTycoons;

use App\Http\Controllers\Controller;

class CalculatorController extends Controller
{
    public function index()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        
        $recipes = $this->loadJsonFile($dataPath . '/recipes.json');
        $items = $this->loadJsonFile($dataPath . '/items.json');
        $machines = $this->loadJsonFile($dataPath . '/machines.json');

        return view('galactic-tycoons.calculator', [
            'recipes' => $recipes,
            'items' => $items,
            'machines' => $machines,
        ]);
    }

    private function loadJsonFile(string $path): array
    {
        if (!file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);
        $decoded = json_decode($content, true);

        return is_array($decoded) ? $decoded : [];
    }
}

