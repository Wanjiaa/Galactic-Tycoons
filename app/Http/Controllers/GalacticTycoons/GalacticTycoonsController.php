<?php

namespace App\Http\Controllers\GalacticTycoons;

use App\Http\Controllers\Controller;

class GalacticTycoonsController extends Controller
{
    /**
     * Show the Galactic Tycoons tools index page
     */
    public function index()
    {
        return view('galactic-tycoons.index');
    }
}

