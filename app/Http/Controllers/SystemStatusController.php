<?php

namespace App\Http\Controllers;

use App\Services\SystemStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemStatusController extends Controller
{
    public function __construct(
        protected SystemStatusService $service
    ) {}

    public function setOnline(Request $request)
    {
        $empRole = session('emp_data.emp_system_role');

        if ($empRole != "superadmin") {
            abort(403, 'Unauthorized');
        }

        $this->service->setOnline();


        return redirect()->route('dashboard');
    }


    public function setMaintenance(Request $request)
    {
        $empRole = session('emp_data.emp_system_role');

        if ($empRole != "superadmin") {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'message' => 'nullable|string|max:500',
        ]);

        $this->service->setMaintenance(
            $validated['message'] ?? 'System is currently under maintenance.'
        );

        return back();
    }
}
