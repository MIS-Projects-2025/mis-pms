# Configuration & Deployment

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Database Configuration](#database-configuration)
3. [Application Configuration](#application-configuration)
4. [Development Setup](#development-setup)
5. [Build & Deployment](#build--deployment)
6. [Troubleshooting](#troubleshooting)

---

## Environment Variables

The application uses a `.env` file in the project root. Below is a comprehensive reference of all environment variables used:

### Application Settings

| Variable       | Default            | Description                                            |
| -------------- | ------------------ | ------------------------------------------------------ |
| `APP_NAME`     | `Laravel`          | Application name (used as URL prefix and display name) |
| `APP_ENV`      | `production`       | Application environment (`local`, `production`)        |
| `APP_DEBUG`    | `false`            | Enable debug mode                                      |
| `APP_URL`      | `http://localhost` | Application base URL                                   |
| `APP_TIMEZONE` | `Asia/Manila`      | Application timezone                                   |

### Database Connections

#### Default Connection (SQLite)

| Variable        | Default                    | Description             |
| --------------- | -------------------------- | ----------------------- |
| `DB_CONNECTION` | `sqlite`                   | Default database driver |
| `DB_DATABASE`   | `database/database.sqlite` | SQLite database path    |

#### Main MySQL (Infrequently Used)

| Variable      | Default     | Description         |
| ------------- | ----------- | ------------------- |
| `DB_HOST`     | `127.0.0.1` | MySQL host          |
| `DB_PORT`     | `3306`      | MySQL port          |
| `DB_DATABASE` | `laravel`   | MySQL database name |
| `DB_USERNAME` | `root`      | MySQL username      |
| `DB_PASSWORD` | _empty_     | MySQL password      |

#### MIS Database

| Variable         | Default     | Description                                                |
| ---------------- | ----------- | ---------------------------------------------------------- |
| `MISDB_HOST`     | `127.0.0.1` | MIS database host                                          |
| `MISDB_PORT`     | `3306`      | MIS database port                                          |
| `MISDB_DATABASE` | `laravel`   | MIS database name (contains hardware, printer, CCTV lists) |
| `MISDB_USERNAME` | `root`      | MIS database username                                      |
| `MISDB_PASSWORD` | _empty_     | MIS database password                                      |

#### Checklist Database

| Variable        | Default     | Description                                     |
| --------------- | ----------- | ----------------------------------------------- |
| `CHDB_HOST`     | `127.0.0.1` | Checklist database host                         |
| `CHDB_PORT`     | `3306`      | Checklist database port                         |
| `CHDB_DATABASE` | `laravel`   | Checklist database name (main application data) |
| `CHDB_USERNAME` | `root`      | Checklist database username                     |
| `CHDB_PASSWORD` | _empty_     | Checklist database password                     |

#### Server25 (Location Reference)

| Variable       | Default     | Description                |
| -------------- | ----------- | -------------------------- |
| `SDB_HOST`     | `127.0.0.1` | Server25 database host     |
| `SDB_PORT`     | `3306`      | Server25 database port     |
| `SDB_DATABASE` | `laravel`   | Server25 database name     |
| `SDB_USERNAME` | `root`      | Server25 database username |
| `SDB_PASSWORD` | _empty_     | Server25 database password |

#### Masterlist Database

| Variable       | Default     | Description                                    |
| -------------- | ----------- | ---------------------------------------------- |
| `MDB_HOST`     | `127.0.0.1` | Masterlist database host                       |
| `MDB_PORT`     | `3306`      | Masterlist database port                       |
| `MDB_DATABASE` | `laravel`   | Masterlist database name (employee masterlist) |
| `MDB_USERNAME` | `root`      | Masterlist database username                   |
| `MDB_PASSWORD` | _empty_     | Masterlist database password                   |

#### Authify (SSO) Database

| Variable       | Default     | Description                          |
| -------------- | ----------- | ------------------------------------ |
| `ADB_HOST`     | `127.0.0.1` | Authify database host                |
| `ADB_PORT`     | `3306`      | Authify database port                |
| `ADB_DATABASE` | `laravel`   | Authify database name (SSO sessions) |
| `ADB_USERNAME` | `root`      | Authify database username            |
| `ADB_PASSWORD` | _empty_     | Authify database password            |

### SSO Configuration

| Variable          | Default     | Description               |
| ----------------- | ----------- | ------------------------- |
| `SSO_COOKIE_NAME` | `sso_token` | Cookie name for SSO token |

### Internal Service Key

Set in `config/services.php`:

```php
'internal' => [
    'key' => env('INTERNAL_SERVICE_KEY'),
],
```

The `X-Internal-Key` header allows service-to-service calls to bypass SSO authentication.

---

## Database Configuration

### Connection Definitions

All database connections are defined in `config/database.php`:

```php
'connections' => [
    'sqlite'    => [ /* ... */ ],
    'mysql'     => [ /* Default MySQL ... */ ],
    'mis'       => [ /* MIS asset inventory ... */ ],
    'checklist' => [ /* Main application data ... */ ],
    'server25'  => [ /* Location reference ... */ ],
    'masterlist'=> [ /* Employee records ... */ ],
    'authify'   => [ /* SSO sessions ... */ ],
],
```

### System Status Seeder

```bash
php artisan db:seed --class=SystemStatusSeeder
```

This creates the initial "online" status record. Without this, the system will auto-create it on first access (`firstOrCreate`).

---

## Application Configuration

### Vite Configuration

```js
// vite.config.js
import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({ input: ["resources/css/app.css", "resources/js/app.jsx"] }),
        react(),
        tailwindcss(),
    ],
});
```

### Tailwind CSS

The project uses **Tailwind CSS v4** via the `@tailwindcss/vite` plugin.

### Service Container Bindings

Defined in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        \App\Http\Middleware\HandleInertiaRequests::class,
        \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
    ]);
})
```

---

## Development Setup

### Prerequisites

- PHP 8.2+
- Composer 2.x
- Node.js 18+
- NPM 9+
- MySQL 5.7+ (multiple databases required)
- Access to Authify SSO server (192.168.20.21:8200)

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url> mis-pms
cd mis-pms

# 2. Install PHP dependencies
composer install

# 3. Install Node.js dependencies
npm install

# 4. Create environment file
cp .env.example .env
# Edit .env with your database credentials and application settings

# 5. Generate application key
php artisan key:generate

# 6. Run database migrations (for system_status table)
php artisan migrate

# 7. Seed system status (optional, auto-creates on first access)
php artisan db:seed --class=SystemStatusSeeder

# 8. Build frontend assets
npm run build

# 9. Run in development mode
npm run dev
```

### Development Server

```bash
# Run all services concurrently (from composer.json dev script)
php artisan serve --port=8005 & php artisan queue:listen --tries=1 & php artisan pail --timeout=0 & npm run dev
```

Or use the `dev` Composer script:

```bash
composer dev
```

---

## Build & Deployment

### Production Build

```bash
# Install dependencies (no dev)
composer install --no-dev --optimize-autoloader
npm ci --production
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### Deployment Checklist

1. **Environment Configuration**
    - Set all database credentials in `.env`
    - Configure SSO cookie name
    - Set internal service key if needed
    - Configure `APP_URL` and `APP_NAME`

2. **Database**
    - Ensure all 5 MySQL databases are accessible
    - Run migrations for `system_status` table
    - Verify admin table exists in `checklist` database

3. **File Permissions**
    - `storage/` directory must be writable
    - `bootstrap/cache/` directory must be writable
    - `public/storage/` symlink for attachments

4. **Web Server**
    - Point document root to `/public`
    - Configure URL rewriting (Laravel standard)
    - Ensure network access to Authify server (192.168.20.21:8200)

5. **Queue Worker** (for any queued jobs)
    ```bash
    php artisan queue:work --tries=3
    ```

---

## Troubleshooting

### Common Issues

#### 1. "No token found" / Redirects to login in loop

**Cause:** Authify SSO server is unreachable.

**Solution:**

- Verify network connectivity to 192.168.20.21:8200
- Check that Authify service is running
- Verify `SSO_COOKIE_NAME` matches the cookie set by Authify

#### 2. Database connection errors

**Cause:** One or more database connections are misconfigured.

**Solution:**

- Verify each connection's credentials in `.env`
- Test connectivity:
    ```bash
    php artisan tinker
    > DB::connection('checklist')->getPdo();
    ```
- Check MySQL user permissions and host access

#### 3. "Call to undefined function" / Class not found

**Cause:** Missing Composer dependencies or autoload cache.

**Solution:**

```bash
composer dump-autoload
composer install
```

#### 4. White screen / 500 error

**Solution:**

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Clear cache
php artisan optimize:clear
```

#### 5. CSS/JS not loading

**Cause:** Vite build not run or wrong `APP_URL`.

**Solution:**

```bash
npm run build
# Verify APP_URL matches the actual server URL
```

#### 6. SSO Login not redirecting back

**Solution:**

- Check that `APP_URL` matches the URL configured in Authify
- Verify the redirect URL is URL-encoded correctly
- Check browser console for any JavaScript errors

---

## Project Scripts

### Composer Scripts

| Script | Command        | Description                                 |
| ------ | -------------- | ------------------------------------------- |
| `dev`  | `composer dev` | Start all development services concurrently |

### NPM Scripts

| Script  | Command         | Description                    |
| ------- | --------------- | ------------------------------ |
| `dev`   | `npm run dev`   | Start Vite dev server with HMR |
| `build` | `npm run build` | Build production assets        |

### Artisan Commands

Refer to `routes/console.php` for any custom Artisan commands.

---

_[Back to Home](/docs/index.md)_
