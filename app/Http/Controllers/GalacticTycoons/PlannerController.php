<?php

namespace App\Http\Controllers\GalacticTycoons;

use App\Http\Controllers\Controller;

class PlannerController extends Controller
{
    public function index()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        
        $items = $this->loadJsonFile($dataPath . '/items.json');

        return view('galactic-tycoons.planner', [
            'items' => $items,
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
