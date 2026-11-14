# AresNav Frontend — Jezero Crater Mars Rover Mission Planner

A mission-control web interface for the NASA Space Apps 2026 challenge: **"Interplanetary Survival Guide – Martian Map"**.

Designed for planetary exploration within the Jezero Crater region (~70.6 × 59.6 km). Built with React, Vite, TypeScript, Tailwind CSS, Zustand, and OpenLayers.

---

## 1. Quick Setup & Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
The application will launch at [http://localhost:5173](http://localhost:5173).

- In development, requests to `/mars/*` and `/sanctum/*` are proxied to `VITE_BACKEND_URL` so all browser requests remain strictly same-origin (preserving Laravel Sanctum CSRF cookies and session headers).
- If the backend is offline or `VITE_USE_MOCK=true`, the client automatically falls back to offline mock mode with telemetry banners.

### Production Build & Typecheck
```bash
npm run build
```
Executes TypeScript checking (`tsc`) and Vite bundling. Zero errors or lint warnings.

---

## 2. Environment Variables

Configure via `.env` or pass when running:

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:8001` | Laravel backend base URL for Vite dev reverse proxy (`/mars` & `/sanctum`) |
| `VITE_USE_MOCK` | `false` | When `true`, activates offline standalone mode with realistic mock data derived from NASA datasets |

---

## 3. Scientific Honesty & Known Limitations

Per NASA Space Apps scientific honesty guidelines:

1. **Regional 200 m DEM Spacing ≠ Point Measurement Accuracy**:
   - The elevation substrate is the USGS HRSC+MOLA Blended DEM Global 200m v2 (Fergason, Hare & Laura 2018).
   - Pixel spacing of 200 m interpolates MOLA (~463 m) and HRSC (~50 m) data (HRSC covers ~44% of Mars).
   - Slopes are computed between 200 m cell centers; localized boulders, meter-scale scarps, and rover-wheel hazards are not resolved.
2. **Earth-View Solar Flare Radiation Proxy**:
   - Telemetry from the NASA DONKI API detects orbital/solar flare events from an Earth-view perspective, serving as an operational proxy rather than a direct Mars surface dosimeter.
3. **Operational Planning Assumptions**:
   - Walking speed (2.0 km/h), maximum EVA duration (8.0 hours), and slope thresholds (10° caution, 20° cliff barrier) are mission planning assumptions, not certified NASA flight constraints.
4. **Natural Martian Negative Elevations**:
   - Elevations in Jezero Crater range from -2,580 m to -2,300 m relative to the Martian datum (areoid). These negative values represent authentic crater basin topography, not traversal barriers.
5. **Coordinate Reference System**:
   - All spatial calculations strictly use Martian spherical equirectangular coordinates (EPSG:104905, radius 3,396,190 m) with East-positive longitude and Planetocentric latitude.

---

## 4. 5-Step Demo Script for Judges & Presentation

Follow this exact 5-step workflow to showcase the complete end-to-end mission planning experience:

### Step 1: Mission Briefing & Telemetry Inspection (`/`)
- Navigate to `/` (Mission Briefing).
- Observe the real-time **Mission Status Header** with NASA DONKI space weather flare status (`NOMINAL`, `ELEVATED`, `STORM`, or `UNKNOWN`).
- Review the Jezero Crater operational bounding box, regional raster dimensions (353 × 298 cells), and latest Perseverance rover telemetry.
- Click **"Launch Mars Explorer →"** to enter the interactive map.

### Step 2: Interactive Mars Explorer & WMTS Layers (`/explorer`)
- In Mars Explorer, notice the crisp **USGS Viking MDIM 2.1 color mosaic** base layer (232 m/px) serving live tiles from NASA Mars Trek.
- Open the **Layers** sidebar tab:
  - Toggle the **MRO HiRISE Jezero Inset (25 cm/px)** to inspect the western delta deposits.
  - Toggle the **MOLA Color Shaded Relief** overlay to visualize topographic depth gradients.
  - Observe the non-blocking status badges for unconfigured layers.
- Click on the **Perseverance POIs** layer:
  - Click on clustered science targets (e.g., *Octavia E. Butler Landing Site*, *Kodiak Butte*, *Belva Crater*) to view coordinates, sol dates, and geological descriptions.

### Step 3: Interactive Route Planning & Pin Placement (`/explorer` -> Route Tab)
- Switch to the **Route** tab in the sidebar.
- Click **"Demo Traverse Presets"** and select **"Delta Front Traverse (~4.1 km)"** (Octavia E. Butler Landing Site $\to$ Belva Crater Delta Rim).
- Alternatively, click **"Pick Start on Map"** and click anywhere inside Jezero Crater to place the green Start pin; drag the pin interactively and watch coordinates update in real time.
- Click **"Compute Traverse Paths"**:
  - The pathfinder queries the dynamic map version from `GET /mars/terrain/jezero-regional-200m`.
  - While calculating, waypoints lock to prevent race conditions.

### Step 4: Multi-Candidate Trajectory & Terrain Breakdown Analysis
- Observe the OpenLayers map rendering up to **3 candidate alternative paths**:
  - **Rank #1 (Primary)**: Solid high-visibility line styled by verdict color (Emerald `GO`, Amber `CAUTION`, Rose `NO-GO`).
  - **Ranks #2 & #3 (Alternatives)**: Dashed candidate lines with rank identifiers.
- Click between **[Rank 1 | Rank 2 | Rank 3]** switcher buttons to switch the active trajectory on the map.
- Inspect the **Mission Control Results Briefing Card**:
  - Check horizontal distance (km), raster step count (200m cells), and traversal penalty cost score.
  - Review the **EVA Hours Gauge** against the 8.0 h operational limit at 2.0 km/h walking speed.
  - Inspect the **Cost-Cell Distribution Bar** (Cost 1 flat, Cost 2 moderate, Cost 4 steep, Cost 8 caution).
  - Open the **Verbatim Scientific Limitations** accordion to review the exact API safety strings.

### Step 5: Mission Traverse Report & Print/PDF Export (`/report`)
- Click **"Open Mission Report →"** at the bottom of the results card.
- The app navigates to `/report`, rehydrating the complete traverse state from `sessionStorage` (persisting across page reloads).
- Review the official 9-section NASA Traverse Document:
  1. Header with Request ID, generated timestamp, and map version hash.
  2. Executive Summary with large Verdict Badge (`GO` / `CAUTION` / `NO-GO`).
  3. Traverse Comparison Table comparing all 3 candidate paths side-by-side.
  4. Static non-interactive **Planetary Context & Traverse Geometry Map** (`ReportMiniMap`).
  5. Elevation ascent/descent, slope min/mean/p95, and EVA budget utilization.
  6. Radiation telemetry with the NASA DONKI solar flare proxy caveat.
  7. En-route Perseverance science stops table with deviation distances.
  8. Hazards and verbatim backend limitations list.
  9. Formal USGS/NASA data citations and planning assumptions.
- Click **"Download JSON"** to export the machine-readable route response payload.
- Click **"Print / Save as PDF"**:
  - Demonstrates the clean, light, ink-friendly print stylesheet.
  - Hides navigation bars, buttons, and footers; renders a professional NASA-standard document suitable for mission archives.
- Click **"Data Sources & Scientific Documentation"** to view `/about` with comprehensive technical explanations of each layer and the pathfinding mathematics.

---

## 5. Technology Stack & Dependencies

- **Core**: React 18, Vite 5, TypeScript 5
- **Routing**: React Router DOM 6
- **State Management**: Zustand 5 (with selective session persistence)
- **GIS / Mapping Engine**: OpenLayers 10 (`ol`), Proj4 (`proj4`)
- **Styling**: Tailwind CSS 3 with custom Mars Mission Control theme palette
- **Icons**: Lucide React
- **API Protocol**: RESTful JSON over HTTP, Laravel Sanctum CSRF protection, URL-decoded `X-XSRF-TOKEN` header, standard HTTP status handling (422 `BLOCKED_POINT`, 409 `MAP_CHANGED`, 429 `PLANNER_BUSY` with countdown, 504 `PLANNER_TIMEOUT`, 200 `NO_PATH`).
