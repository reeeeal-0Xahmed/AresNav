# AresNav — Mars Rover Route Planner & Terrain Explorer

**AresNav** is a full-stack mission planning and geospatial navigation platform built for autonomous rover traversal across **Jezero Crater** on Mars (`jezero-regional-200m`).

## System Architecture

| Layer | Directory | Tech Stack | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | `frontend/` | React, TypeScript, Vite, Tailwind CSS | Interactive geospatial map, elevation & traversability overlays, science POIs, and route briefing reports |
| **Backend API** | `all done/laravel/` | PHP, Laravel, SQLite/MySQL, L5-Swagger | RESTful API orchestrating route planning, terrain layers, mission history, and NASA DONKI space weather |
| **Pathfinding Engine** | `all done/native/` | C++ (`rover_pathfinder`) | High-performance native A*/cost-surface rover solver evaluating slope limits and terrain hazards |
| **Terrain Pipeline** | `all done/python/` | Python, NumPy, Rasterio | Regional DEM extraction and elevation/slope grid generation from MRO HiRISE & CTX datasets |

## API Endpoints (`/api/mars`)

- `GET /mars/layers` — Available geospatial map layers and bounds
- `GET /mars/terrain/jezero-regional-200m` — Regional elevation and traversability grid metadata
- `GET /mars/science/pois` — Curated geological and astrobiological Points of Interest
- `GET /mars/space-weather` — Live solar flare and geomagnetic telemetry context
- `GET /mars/images` — Orbital imagery references for Jezero Crater
- `POST /mars/routes` — Compute an optimal rover path between start and target coordinates
- `GET /mars/routes/{id}` — Retrieve saved route geometry, telemetry, and mission briefing

## Quick Start (Linux / Fedora)

### 1. Prerequisites
- **PHP 8.2+** & **Composer**
- **Node.js 20+** & **npm**
- **g++** (if recompiling `native/rover_pathfinder.cpp`)

### 2. Backend Setup (`Laravel`)
```bash
cd "all done/laravel"
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
3. Frontend Setup (React + Vite)
Bash
cd frontend
npm install
4. Run Both Servers
From the repository root:

Bash
chmod +x start-all.sh
./start-all.sh
Frontend UI: http://localhost:5173

Backend API: http://127.0.0.1:8001

API Documentation (Swagger): http://127.0.0.1:8001/api/documentation

Data Sources
Terrain models and imagery bounds are derived from NASA Mars Reconnaissance Orbiter (MRO) HiRISE and CTX mosaics via NASA Mars Trek, paired with NASA DONKI space weather feeds.
