<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\File;

class ImportGalacticTycoonsData extends Command
{
    protected $signature   = 'galactic-tycoons:import {--clean : Delete old files before import}';
    protected $description = 'Import game data from Galactic Tycoons API';

    private $materialsCache = [];
    private $buildingsCache = [];
    private $dataPath;

    public function handle()
    {
        $this->info('🚀 Galactic Tycoons - API Data Importer');
        $this->info('==========================================');
        $this->newLine();

        // Set data path to resources/js/galactic-tycoons/data/
        $this->dataPath = resource_path('js/galactic-tycoons/data');

        // Create directory if it doesn't exist
        if (!File::exists($this->dataPath)) {
            File::makeDirectory($this->dataPath, 0755, true);
            $this->info("📁 Created directory: {$this->dataPath}");
        }

        // Clean old files if requested
        if ($this->option('clean')) {
            $this->cleanOldFiles();
        }

        $apiUrl = 'https://api.g2.galactictycoons.com/gamedata.json';

        // Download the data
        $this->info('📡 Downloading data from API...');

        try {
            $response = Http::timeout(30)->get($apiUrl);

            if (!$response->successful()) {
                $this->error('❌ Failed to download data from API (HTTP ' . $response->status() . ')');
                return 1;
            }

            $data = $response->json();

            if (!$data || !is_array($data)) {
                $this->error('❌ Invalid JSON response from API');
                return 1;
            }

            $this->info('✅ Data downloaded successfully');
            $this->newLine();

            $this->line('📊 API Data Summary:');
            $this->line('   - Materials: ' . count($data['materials'] ?? []));
            $this->line('   - Buildings: ' . count($data['buildings'] ?? []));
            $this->line('   - Recipes: ' . count($data['recipes'] ?? []));
            $this->line('   - Workers: ' . count($data['workers'] ?? []));
            $this->newLine();

            // Cache materials and buildings first for ID lookups
            $this->materialsCache = $data['materials'] ?? [];
            $this->buildingsCache = $data['buildings'] ?? [];
            $this->info('📝 Cached ' . count($this->materialsCache) . ' materials for ID lookups');
            $this->info('📝 Cached ' . count($this->buildingsCache) . ' buildings for ID lookups');
            $this->newLine();

            // Process materials → items.json
            $this->info('📦 Processing materials → items.json...');
            $items = $this->processMaterials($data['materials'] ?? []);
            $this->saveJson('items.json', $items);
            $this->info('✅ items.json created (' . count($items) . ' items)');

            // Process recipes → recipes.json
            $this->info('📦 Processing recipes → recipes.json...');
            $recipes = $this->processRecipes($data['recipes'] ?? []);
            $this->saveJson('recipes.json', $recipes);
            $this->info('✅ recipes.json created (' . count($recipes) . ' recipes)');

            // Process buildings → buildings.json
            $this->info('📦 Processing buildings → buildings.json...');
            $buildings = $this->processBuildings($data['buildings'] ?? []);
            $this->saveJson('buildings.json', $buildings);
            $this->info('✅ buildings.json created (' . count($buildings) . ' buildings)');

            // Process workers → workers.json
            $this->info('📦 Processing workers → workers.json...');
            $workers = $this->processWorkers($data['workers'] ?? []);
            $this->saveJson('workers.json', $workers);
            $this->info('✅ workers.json created (' . count($workers) . ' worker types)');

            $this->newLine();
            $this->info('🎉 Import completed successfully!');
            $this->newLine();
            $this->line('📁 Files saved to: ' . $this->dataPath);

            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            $this->newLine();
            $this->line('Stack trace:');
            $this->line($e->getTraceAsString());

            return 1;
        }
    }

    /**
     * Clean old JSON files
     */
    private function cleanOldFiles()
    {
        $this->info('🧹 Cleaning old files...');

        $files = ['items.json', 'recipes.json', 'buildings.json', 'workers.json'];

        foreach ($files as $file) {
            $path = $this->dataPath . '/' . $file;
            if (File::exists($path)) {
                File::delete($path);
                $this->line("   - Deleted {$file}");
            }
        }

        $this->info('✅ Old files cleaned');
        $this->newLine();
    }

    /**
     * Save JSON to file with pretty print
     */
    private function saveJson($filename, $data)
    {
        $path = $this->dataPath . '/' . $filename;
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        File::put($path, $json);
    }

    /**
     * Process materials into items.json format
     * API Structure: {
     *   "id": 1,
     *   "name": "Hydrogen",
     *   "tier": 1,
     *   "weight": 0.5
     * }
     * Output Structure: { "name": "Hydrogen", "tier": 1, "weight": 0.5 }
     */
    private function processMaterials(array $materials): array
    {
        $items = [];

        foreach ($materials as $material) {
            if (!isset($material['name'])) {
                continue;
            }

            $item = [
                'name'   => $material['name'],
                'tier'   => $material['tier'] ?? 1,
                'weight' => $material['weight'] ?? 0,
            ];

            $items[] = $item;
        }

        return $items;
    }

    /**
     * Process recipes into recipes.json format
     * Structure: {
     *   "output": "Concrete",
     *   "qtyOut": 12,
     *   "craftTime": 2700,
     *   "machine": "Prefab Plant",
     *   "ingredients": [
     *     { "resource": "Limestone", "amount": 4 },
     *     { "resource": "Silica", "amount": 4 }
     *   ]
     * }
     */
    private function processRecipes(array $recipes): array
    {
        $processed = [];
        $skipped   = 0;

        foreach ($recipes as $index => $recipe) {
            try {
                // Get output name
                $output = $this->extractOutputName($recipe);
                if (empty($output)) {
                    $this->warn("Recipe #{$index}: Could not determine output name");
                    $skipped++;
                    continue;
                }

                // Get qtyOut
                $qtyOut = $this->extractQtyOut($recipe);

                // Get craftTime - API uses 'timeMinutes' field
                $craftTime = 0;
                if (isset($recipe['timeMinutes'])) {
                    $craftTime = (int) $recipe['timeMinutes'] * 60; // Convert minutes to seconds
                } else {
                    $craftTime = (int) ($recipe['time'] ?? $recipe['craftTime'] ?? $recipe['duration'] ?? 0);
                }

                // Get machine/building name - API uses 'producedIn' with building ID
                $machine = '';
                if (isset($recipe['producedIn'])) {
                    $machine = $this->getBuildingNameById($recipe['producedIn']);
                } else {
                    $machine = (string) ($recipe['building'] ?? $recipe['machine'] ?? '');
                }

                // Process ingredients
                $ingredients = $this->extractIngredients($recipe);

                $processed[] = [
                    'output'      => $output,
                    'qtyOut'      => $qtyOut,
                    'craftTime'   => $craftTime,
                    'machine'     => $machine,
                    'ingredients' => $ingredients,
                ];
            } catch (\Exception $e) {
                $this->warn("Recipe #{$index}: Error - " . $e->getMessage());
                $skipped++;
                continue;
            }
        }

        if ($skipped > 0) {
            $this->warn("⚠️  Skipped {$skipped} recipes due to errors");
        }

        return $processed;
    }

    /**
     * Extract output name from recipe, handling various formats
     */
    private function extractOutputName($recipe): string
    {
        if (isset($recipe['output'])) {
            if (is_string($recipe['output'])) {
                return $recipe['output'];
            } else if (is_array($recipe['output'])) {
                // Handle output as object: { "id": 1, "am": 10 }
                if (isset($recipe['output']['id'])) {
                    return $this->getMaterialNameById($recipe['output']['id']);
                } else if (isset($recipe['output']['name'])) {
                    return $recipe['output']['name'];
                }
            }
        } else if (isset($recipe['produces'])) {
            return $recipe['produces'];
        }

        return '';
    }

    /**
     * Extract quantity output from recipe
     */
    private function extractQtyOut($recipe): int
    {
        // Check in output object first
        if (isset($recipe['output']) && is_array($recipe['output'])) {
            if (isset($recipe['output']['am'])) {
                return (int) $recipe['output']['am'];
            } else if (isset($recipe['output']['amount'])) {
                return (int) $recipe['output']['amount'];
            }
        }

        // Check in root
        return (int) ($recipe['qtyOut'] ?? $recipe['quantity'] ?? $recipe['amount'] ?? 1);
    }

    /**
     * Extract ingredients from recipe
     * Output format: [{ "resource": "Limestone", "amount": 4 }]
     */
    private function extractIngredients($recipe): array
    {
        $ingredients = [];

        // Check for 'inputs' field (API format)
        if (isset($recipe['inputs']) && is_array($recipe['inputs'])) {
            foreach ($recipe['inputs'] as $input) {
                $resourceId = $input['id'] ?? null;
                $amount     = (int) ($input['am'] ?? 0);

                if ($resourceId !== null && $amount > 0) {
                    $resourceName = $this->getMaterialNameById($resourceId);

                    $ingredients[] = [
                        'resource' => $resourceName,
                        'amount'   => $amount,
                    ];
                }
            }

            return $ingredients;
        }

        // Fallback: check for 'ingredients' field (old format)
        if (!isset($recipe['ingredients']) || !is_array($recipe['ingredients'])) {
            return $ingredients;
        }

        foreach ($recipe['ingredients'] as $ingredient) {
            $resource = $this->extractResourceName($ingredient);
            $amount   = $this->extractResourceAmount($ingredient);

            if (!empty($resource) && $amount > 0) {
                $ingredients[] = [
                    'resource' => $resource,
                    'amount'   => $amount,
                ];
            }
        }

        return $ingredients;
    }

    /**
     * Extract resource name from ingredient, handling various formats
     */
    private function extractResourceName($ingredient): string
    {
        if (isset($ingredient['material']) && is_string($ingredient['material'])) {
            return $ingredient['material'];
        } else if (isset($ingredient['name']) && is_string($ingredient['name'])) {
            return $ingredient['name'];
        } else if (isset($ingredient['resource']) && is_string($ingredient['resource'])) {
            return $ingredient['resource'];
        } else if (isset($ingredient['id'])) {
            return $this->getMaterialNameById($ingredient['id']);
        }

        return '';
    }

    /**
     * Extract resource amount from ingredient
     */
    private function extractResourceAmount($ingredient): int
    {
        return (int) ($ingredient['amount'] ?? $ingredient['quantity'] ?? $ingredient['am'] ?? 0);
    }

    /**
     * Get material name by ID from cache
     */
    private function getMaterialNameById($id): string
    {
        foreach ($this->materialsCache as $material) {
            if (isset($material['id']) && $material['id'] == $id) {
                return $material['name'] ?? "Unknown_ID_{$id}";
            }
        }

        return "Unknown_ID_{$id}";
    }

    /**
     * Get building name by ID from cache
     */
    private function getBuildingNameById($id): string
    {
        foreach ($this->buildingsCache as $building) {
            if (isset($building['id']) && $building['id'] == $id) {
                return $building['name'] ?? "Unknown_Building_ID_{$id}";
            }
        }

        return "Unknown_Building_ID_{$id}";
    }

    /**
     * Process buildings into buildings.json format
     * API Structure: {
     *   "id": 1,
     *   "name": "Mine",
     *   "workersNeeded": [70, 0, 0, 0],
     *   "workersHousing": null,  // or [125, 0, 0, 0] for housing
     *   "constructionMaterials": [
     *     { "id": 93, "am": 1 },
     *     { "id": 26, "am": 5 }
     *   ],
     *   "tier": 1,
     *   "specialization": 4
     * }
     *
     * Output Structure: {
     *   "name": "Colony Barracks",
     *   "tier": 1,
     *   "category": "Housing",
     *   "workforce": {
     *     "workers": 125,
     *     "worker_index": 0
     *   },
     *   "workforce_type": "provider",
     *   "ingredients": {
     *     "Amenities": 4,
     *     "Construction Kit": 2,
     *     "Prefab Kit": 5
     *   }
     * }
     */
    private function processBuildings(array $buildings): array
    {
        $processed = [];

        // Category mapping based on specialization
        $categoryMap = [
            1 => 'Housing',
            2 => 'Production',
            3 => 'Processing',
            4 => 'Extraction',
            5 => 'Research',
            6 => 'Agriculture',
            7 => 'Storage',
        ];

        foreach ($buildings as $building) {
            if (!isset($building['name'])) {
                continue;
            }

            // Determine if this is a housing (provider) or consumer building
            $workforceType = '';
            $workforce     = [];

            if (isset($building['workersHousing']) && is_array($building['workersHousing'])) {
                // This building provides workers (housing)
                $totalHousing = array_sum($building['workersHousing']);
                if ($totalHousing > 0) {
                    $workforce     = ['workers' => $totalHousing];
                    $workforceType = 'provider';
                }
            } else if (isset($building['workersNeeded']) && is_array($building['workersNeeded'])) {
                // This building consumes workers
                // Find which worker type (index) is needed
                $workerIndex  = null;
                $workersCount = 0;

                foreach ($building['workersNeeded'] as $index => $count) {
                    if ($count > 0) {
                        $workerIndex  = $index;
                        $workersCount = $count;
                        break; // Use first non-zero worker type
                    }
                }

                if ($workersCount > 0) {
                    $workforce     = [
                        'workers'      => $workersCount,
                        'worker_index' => $workerIndex,
                    ];
                    $workforceType = 'consumer';
                }
            }

            // Get category from specialization
            $category = $categoryMap[$building['specialization'] ?? 0] ?? '';

            // Override category for housing buildings
            if ($workforceType === 'provider') {
                $category = 'Housing';
            }

            // Build ingredients from constructionMaterials
            $ingredients = $this->extractBuildingIngredients($building);

            $processed[] = [
                'name'           => $building['name'],
                'tier'           => $building['tier'] ?? 1,
                'category'       => $category,
                'workforce'      => $workforce,
                'workforce_type' => $workforceType,
                'ingredients'    => $ingredients,
            ];
        }

        return $processed;
    }

    /**
     * Extract building ingredients/cost into object format
     * API format: "constructionMaterials": [{ "id": 93, "am": 1 }, { "id": 26, "am": 5 }]
     * Output format: { "Amenities": 4, "Construction Kit": 2 }
     */
    private function extractBuildingIngredients($building): object
    {
        $ingredients = [];

        // Parse constructionMaterials array
        if (isset($building['constructionMaterials']) && is_array($building['constructionMaterials'])) {
            foreach ($building['constructionMaterials'] as $material) {
                if (!isset($material['id']) || !isset($material['am'])) {
                    continue;
                }

                $materialId = $material['id'];
                $amount     = (int) $material['am'];

                // Look up material name from cache
                $materialName = $this->getMaterialNameById($materialId);

                if (!empty($materialName) && $amount > 0) {
                    $ingredients[$materialName] = $amount;
                }
            }
        } // Fallback: Check for 'cost' field (associative array)
        else if (isset($building['cost']) && is_array($building['cost'])) {
            foreach ($building['cost'] as $material => $amount) {
                if (is_string($material) && is_numeric($amount)) {
                    $ingredients[$material] = (int) $amount;
                }
            }
        } // Fallback: Check for 'ingredients' field (array of objects)
        else if (isset($building['ingredients']) && is_array($building['ingredients'])) {
            foreach ($building['ingredients'] as $ingredient) {
                $material = $ingredient['material'] ?? $ingredient['name'] ?? '';
                $amount   = (int) ($ingredient['amount'] ?? $ingredient['quantity'] ?? 0);

                if (!empty($material) && $amount > 0) {
                    $ingredients[$material] = $amount;
                }
            }
        }

        return (object) $ingredients;
    }

    /**
     * Process workers into workers.json format
     *
     * API Structure: {
     *   "type": 0,  // 0 = Worker, 1 = Technician, 2 = Engineer, 3 = Scientist
     *   "adminCost": 100,
     *   "consumables": [
     *     { "matId": 12, "amount": 240, "essential": true },
     *     { "matId": 16, "amount": 320, "essential": true }
     *   ]
     * }
     *
     * Note: consumable amounts are per day per 100 workers of that type
     *
     * Output Structure: {
     *   "type": "Worker",
     *   "adminCost": 100,
     *   "productionBonus": 70,
     *   "consumables": [
     *     { "material": "Water", "amount": 240, "essential": true, "bonusPercent": 20 },
     *     { "material": "Oxygen", "amount": 320, "essential": true, "bonusPercent": 20 }
     *   ]
     * }
     */
    private function processWorkers(array $workers): array
    {
        $processed = [];

        // Worker type mapping - API uses indices 0-3
        $typeNames = [
            0 => 'Worker',
            1 => 'Technician',
            2 => 'Engineer',
            3 => 'Scientist',
        ];

        foreach ($workers as $worker) {
            $typeId   = $worker['type'] ?? 0;
            $typeName = $typeNames[$typeId] ?? "Worker_Type_{$typeId}";

            $adminCost = (int) ($worker['adminCost'] ?? 0);

            // Debug: log worker structure
            $this->info("Processing worker type {$typeName} (type index {$typeId}):");
            $this->line('  - Has consumables field: ' . (isset($worker['consumables']) ? 'yes' : 'no'));
            if (isset($worker['consumables'])) {
                $this->line('  - Consumables count: ' . count($worker['consumables']));
                if (!empty($worker['consumables'])) {
                    $this->line('  - First consumable: ' . json_encode($worker['consumables'][0]));
                }
            }

            // Process consumables
            $consumables       = [];
            $essentialCount    = 0;
            $nonEssentialCount = 0;

            if (isset($worker['consumables']) && is_array($worker['consumables'])) {
                foreach ($worker['consumables'] as $consumable) {
                    // API uses 'matId' and 'amount', not 'id' and 'am'
                    $materialId = $consumable['matId'] ?? null;
                    $amount     = (int) ($consumable['amount'] ?? 0);
                    $essential  = (bool) ($consumable['essential'] ?? false);

                    if ($materialId !== null && $amount > 0) {
                        $materialName = $this->getMaterialNameById($materialId);

                        // Hardcoded bonus percentages: essential = 20%, non-essential = 10%
                        $bonusPercent = $essential ? 20 : 10;

                        $consumables[] = [
                            'material'     => $materialName,
                            'amount'       => $amount,  // Amount per day per 100 workers
                            'essential'    => $essential,
                            'bonusPercent' => $bonusPercent,
                        ];

                        // Count for production bonus calculation
                        if ($essential) {
                            $essentialCount++;
                        } else {
                            $nonEssentialCount++;
                        }
                    }
                }
            }

            // Calculate production bonus: Base 10% + 20% per essential + 10% per non-essential
            $productionBonus = 10 + ($essentialCount * 20) + ($nonEssentialCount * 10);

            $processed[] = [
                'type'            => $typeName,
                'adminCost'       => $adminCost,
                'productionBonus' => $productionBonus,
                'consumables'     => $consumables,
            ];
        }

        return $processed;
    }
}
