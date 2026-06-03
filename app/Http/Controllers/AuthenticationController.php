<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthenticationController extends Controller
{

public function setSession(Request $request)
    {
        $token = $request->input('queryToken');

        // dd($request->all());

        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();


        $isAdmin = DB::connection('checklist')->table('admin')
            ->where('emp_id', $currentUser->emp_id)
            ->first();

        session([
            'emp_data' => [
                'token' => $currentUser->token,
                'emp_id' => $currentUser->emp_id,
                'emp_name' => $currentUser->emp_name,
                'emp_firstname' => $currentUser->emp_firstname,
                'emp_jobtitle' => $currentUser->emp_jobtitle,
                'emp_dept' => $currentUser->emp_dept,
                'emp_prodline' => $currentUser->emp_prodline,
                'emp_station' => $currentUser->emp_station,
                'generated_at' => $currentUser->generated_at,
                'emp_system_role' => $isAdmin->emp_role ?? null,
            ]
        ]);
    }
    public function logout(Request $request)
    {
        $token = $request->cookie('sso_token')
            ?? session('emp_data.token');

        // Clear local Laravel session
        session()->forget('emp_data');
        session()->flush();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Build redirect back after SSO logout
        $redirectUrl = urlencode(route('dashboard'));

        return redirect(
            config('services.authify.base_url') . "/logout?token={$token}&redirect={$redirectUrl}"
        );
    }
}
