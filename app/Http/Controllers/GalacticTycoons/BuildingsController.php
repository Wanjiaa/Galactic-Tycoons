<?php

namespace App\Http\Controllers\GalacticTycoons;

use App\Http\Controllers\Controller;

class BuildingsController extends Controller
{
    public function index()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        
        $buildings = $this->loadJsonFile($dataPath . '/buildings.json');
        $items = $this->loadJsonFile($dataPath . '/items.json');

        return view('galactic-tycoons.buildings', [
            'buildings' => $buildings,
            'items' => $items,
        ]);
    }

    public function systems()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');

        $buildings = $this->loadJsonFile($dataPath . '/buildings.json');
        $items = $this->loadJsonFile($dataPath . '/items.json');

        return view('galactic-tycoons.buildings-systems', [
            'buildings' => $buildings,
            'items' => $items,
        ]);
    }

    public function upkeep()
    {
        return view('galactic-tycoons.buildings-upkeep');
    }

    public function workforce()
    {
        return view('galactic-tycoons.buildings-workforce');
    }

    public function get()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        $buildings = $this->loadJsonFile($dataPath . '/buildings.json');
        
        return response()->json($buildings);
    }

    public function getWorkers()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        $workers = $this->loadJsonFile($dataPath . '/workers.json');
        
        return response()->json($workers);
    }

    public function getPrices()
    {
        return response()->json([]);
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

