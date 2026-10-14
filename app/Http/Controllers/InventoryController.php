<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

     public function getFullHardwareDetails($hardwareId)
    {
        $parts = $this->inventoryService->getFullHardwareDetails($hardwareId);
        return response()->json($parts);
    }
    public function getHostNames()
    {
        $hostnames = $this->inventoryService->getHostnamesList();
       
        return response()->json($hostnames);
    }


}
