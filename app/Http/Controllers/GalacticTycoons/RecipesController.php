<?php

namespace App\Http\Controllers\GalacticTycoons;

use App\Http\Controllers\Controller;

class RecipesController extends Controller
{
    public function index()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');

        $recipes = $this->loadJsonFile($dataPath . '/recipes.json');
        $items = $this->loadJsonFile($dataPath . '/items.json');
        $machines = $this->loadJsonFile($dataPath . '/buildings.json');

        return view('galactic-tycoons.recipes', [
            'recipes' => $recipes,
            'items' => $items,
            'machines' => $machines,
        ]);
    }

    public function get()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        $recipes = $this->loadJsonFile($dataPath . '/recipes.json');

        return response()->json($recipes);
    }

    public function getMachines()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        $machines = $this->loadJsonFile($dataPath . '/machines.json');

        return response()->json($machines);
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
