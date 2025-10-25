<?php

namespace App\Http\Controllers\GalacticTycoons;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PricesController extends Controller
{
    /**
     * Show the prices management page
     */
    public function index()
    {
        $dataPath = resource_path('js/galactic-tycoons/data');
        
        $recipes = $this->loadJsonFile($dataPath . '/recipes.json');
        $items = $this->loadJsonFile($dataPath . '/items.json');

        return view('galactic-tycoons.prices', [
            'recipes' => $recipes,
            'items' => $items,
        ]);
    }

    /**
     * Fetch prices from external Galactic Tycoons API
     * Acts as a proxy to avoid CORS issues
     */
    public function fetchFromApi(): JsonResponse
    {
        try {
            // Try to connect to the API with a shorter timeout and retry logic
            $response = Http::timeout(10)
                ->get('https://rest-api.galactictycoons.com/public/exchange/mat-prices');

            if (!$response->successful()) {
                Log::warning('API returned unsuccessful status', [
                    'status' => $response->status()
                ]);

                return response()->json([
                    'error' => 'API momenteel niet beschikbaar (status ' . $response->status() . '). Voer prijzen handmatig in.',
                    'status' => $response->status(),
                    'fallback' => true
                ], 503);
            }

            $data = $response->json();

            if (!isset($data['prices']) || !is_array($data['prices'])) {
                return response()->json([
                    'error' => 'API geeft ongeldig formaat terug. Voer prijzen handmatig in.',
                    'fallback' => true
                ], 500);
            }

            return response()->json($data);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::warning('Could not connect to Galactic Tycoons API', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Kan niet verbinden met de externe API. De API server is mogelijk offline of de domeinnaam is gewijzigd. Gebruik de handmatige import functie.',
                'fallback' => true,
                'suggestion' => 'Voer prijzen handmatig in via het bulk import veld'
            ], 503);

        } catch (\Exception $e) {
            Log::error('Failed to fetch prices from Galactic Tycoons API', [
                'error' => $e->getMessage(),
                'type' => get_class($e)
            ]);

            return response()->json([
                'error' => 'Onverwachte fout bij ophalen van prijzen: ' . $e->getMessage(),
                'fallback' => true
            ], 500);
        }
    }

    /**
     * Load JSON file helper
     */
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
