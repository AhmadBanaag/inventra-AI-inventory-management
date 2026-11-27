# Inventra — Write. Snap. Sort.

Inventra is a web-based inventory management system designed specifically for small businesses. It combines the speed and simplicity of physical pen-and-paper inventory tracking with the automation of AI handwriting recognition and database management.

Store managers and staff fill out a standardized printable inventory count sheet, take a photo with a smartphone or scanner, upload it, and let Google Gemini AI recognize, categorize, and transcribe the handwritten line items. Every scan undergoes mandatory user review and verification before any data is committed to the inventory database.

---

## Collaboration & Activity Log

> This log is maintained throughout the project to track progress, file additions, and architectural decisions across team members.

### Latest Update: November 24, 2026 — 18:45 (+08:00)
- **Developer & Role:** Ahmad — Backend Developer / System Architect
- **Task:** Mock and Dummy Data Removal
- **Summary:**
  - Removed all hardcoded mock seed rows from [schema.sql](file:///backend/database/schema.sql).
  - Emptied default in-memory arrays in [productService.js](file:///backend/services/productService.js) and [scanService.js](file:///backend/services/scanService.js) (`memoryProducts = []`, `memoryScans = []`).
  - Removed fallback sample extraction items from `getScanById` and `gemini.js` (now strictly requires valid Gemini API configuration).
  - Cleared frontend mock fallbacks across `inventory.js`, `product-details.js`, `scan-results.js`, and `scan-history.js`.
  - Application now initializes in a 100% clean state, reflecting genuine user inputs and verified AI scan results.

### Previous Update: November 24, 2026 — 18:35 (+08:00)
- **Developer & Role:** Ahmad — Backend Developer / System Architect
- **Phase:** Production Backend Refactoring, Input Validation, and System Integration
- **Summary of Additions:**
  - **Three-Tier Modular Architecture:** Decoupled monolithic routes into a clean separation of concerns:
    - **Controllers (`backend/controllers/`):** `productController.js`, `scanController.js`, and `dashboardController.js` handling request/response flows.
    - **Services (`backend/services/`):** `productService.js`, `scanService.js`, and `dashboardService.js` encapsulating business logic and Supabase database interactions.
    - **Routes (`backend/routes/`):** Clean Express router mapping paths to controllers and validation middleware.
  - **Input Validation & Sanitization Middleware (`backend/middleware/validator.js`):**
    - Enforces non-empty string constraints and length bounds on product names.
    - Enforces non-negative integers for quantities and alert thresholds.
    - Enforces non-negative decimals for unit prices.
    - Strictly validates batch items during scan verification to prevent corrupt database inserts.
  - **Centralized Error Handler (`backend/middleware/errorHandler.js`):**
    - Standardized error codes and messages for Multer upload issues, malformed JSON bodies, and unhandled exceptions.
    - Response envelope utilities in `backend/utils/apiResponse.js`.
  - **Batch Upsert & Verification Gateway:**
    - Implemented `batchUpsertVerifiedProducts` supporting both additive restocking (`?mode=additive`, default) and full physical audit counts (`?mode=overwrite`).
    - Guarantees unverified AI data never touches the catalog without explicit verification approval.
  - **PostgreSQL / Supabase Schema Enhancements (`backend/database/schema.sql`):**
    - Added automated `updated_at` PL/pgSQL triggers across `products`, `scans`, and `settings`.
    - Added composite performance index on `products(category, quantity)` for fast low-stock queries.
  - **Automated Verification:** Executed a 16-test suite covering negative validation (400 / 422), CRUD operations, stock incrementing, and deletion (404). 16/16 tests passed.

### Previous Update: November 24, 2026 — 16:51 (+08:00)
- **Phase:** Core Application Architecture, Page Scaffolding, and Service Integration.
- **Summary of Additions:**
  - **Shared Design System:** Centralized design tokens ([variables.css](file:///frontend/css/variables.css)), app layout shell ([layout.css](file:///frontend/css/layout.css)), reusable UI components ([components.css](file:///frontend/css/components.css)), and main stylesheet ([main.css](file:///frontend/css/main.css)).
  - **Client-Side Framework Layer:** Built the centralized Fetch API wrapper ([api.js](file:///frontend/js/services/api.js)), dynamic sidebar navigation ([sidebar.js](file:///frontend/js/components/sidebar.js)), top navbar with breadcrumbs and live health indicators ([navbar.js](file:///frontend/js/components/navbar.js)), and accessible toast notifications ([notifications.js](file:///frontend/js/components/notifications.js)).
  - **Frontend Pages:** Implemented the public Landing Page ([index.html](file:///frontend/index.html)), Store Settings ([settings.html](file:///frontend/pages/settings.html)), and browser-printable Inventory Template ([inventory-template.html](file:///frontend/pages/inventory-template.html)).
  - **Backend Track Pages:** Built the live operational Dashboard ([dashboard.html](file:///frontend/pages/dashboard.html)), My Inventory catalog ([inventory.html](file:///frontend/pages/inventory.html)), Product Details view ([product-details.html](file:///frontend/pages/product-details.html)), and Add/Edit Product form ([product-form.html](file:///frontend/pages/product-form.html)).
  - **AI Track Pages:** Built the image upload portal ([scan-inventory.html](file:///frontend/pages/scan-inventory.html)), multi-step AI Processing transition screen ([ai-processing.html](file:///frontend/pages/ai-processing.html)), editable Scan Verification screen ([scan-results.html](file:///frontend/pages/scan-results.html)), and historical Scan Audit log ([scan-history.html](file:///frontend/pages/scan-history.html)).
  - **Backend REST Services:** Express server ([server.js](file:///backend/server.js)), route handlers for products ([products.js](file:///backend/routes/products.js)), dashboard metrics ([dashboard.js](file:///backend/routes/dashboard.js)), file upload and OCR verification ([scan.js](file:///backend/routes/scan.js)), and multimodal Gemini integration ([gemini.js](file:///backend/services/gemini.js)).
  - **Database Schema:** Created PostgreSQL / Supabase migration schema ([schema.sql](file:///backend/database/schema.sql)) with tables for `products`, `scans`, `scan_items`, and `settings`.
  - **Verification:** Verified syntax across all 21 JavaScript files and validated all 16 HTTP routes and page views.

### Initial Setup: November 22, 2026 — 20:50 (+08:00)
- **Phase:** Repository initialization and modular folder scaffolding.
- Created standard directory layout (`frontend/`, `backend/`), initialized `package.json`, `.gitignore`, and `.env.example`.
- Backend dependencies include `express`, `@supabase/supabase-js`, `@google/genai`, `multer`, `cors`, and `dotenv`.

---

## Technology Stack

| Layer | Technologies | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Modular vanilla architecture; no heavy frameworks (No React, Vue, Angular). |
| **API Client** | Fetch API | Centralized, asynchronous client layer with JSON parsing and error handling. |
| **Backend** | Node.js, Express.js | REST API architecture handling routing, file uploads, and middleware. |
| **Database** | Supabase (PostgreSQL) | Relational database storing product catalogs, scan logs, and store settings. |
| **AI Integration** | Google Gemini API (`gemini-3.1-flash-lite` by default) | Multimodal vision model extracting handwritten tabular items into structured JSON. |

---

## Application Module Breakdown

The application is structured into three clear developer tracks:

### 1. Frontend Track
- **Landing Page (`frontend/index.html`):** Public marketing view highlighting the "Write. Snap. Sort." flow and quick launch button.
- **Settings (`frontend/pages/settings.html`):** Manage business name, currency symbol, default low-stock thresholds, and system health tests.
- **Printable Template (`frontend/pages/inventory-template.html`):** Browser-printable A4/Letter count sheet with high-contrast guide lines optimized for physical counting and handwriting recognition.
- **Shared Components:**
  - `frontend/js/components/sidebar.js`: Shared navigation with active route highlights.
  - `frontend/js/components/navbar.js`: Breadcrumb trail and live API connectivity indicator.
  - `frontend/js/components/notifications.js`: Toast notifications for user feedback.
  - `frontend/js/services/api.js`: Unified HTTP client.

### 2. Backend Track
- **Dashboard (`frontend/pages/dashboard.html`):** Real-time inventory metrics (Total Products, Low Stock Count, Total Stock Valuation, Sheets Processed), low-stock warnings, and recent additions.
- **My Inventory (`frontend/pages/inventory.html`):** Complete catalog with real-time text search, category filters, stock status filters (In Stock, Low Stock, Out of Stock), and deletion controls.
- **Product Details (`frontend/pages/product-details.html`):** Single item inspection view with quick stock adjustment buttons (`+1`, `-1`).
- **Add / Edit Product (`frontend/pages/product-form.html`):** Unified form for creating and updating catalog records with automatic SKU generator and client-side validation.

### 3. AI Scanning Track
- **Scan Inventory (`frontend/pages/scan-inventory.html`):** Photo capture best practices, drag-and-drop image upload, and file preview container.
- **AI Processing (`frontend/pages/ai-processing.html`):** Multi-step visual transition screen tracking upload, border detection, Gemini OCR analysis, and JSON formatting.
- **Scan Results & Verification (`frontend/pages/scan-results.html`):** Mandatory review screen. Users can edit quantities, names, categories, and prices, add missing rows, or remove misread entries before explicitly saving verified results to inventory.
- **Scan History (`frontend/pages/scan-history.html`):** Audit trail of previous scans and verification statuses.

---

## Project Directory Map

```
inventra/
│
├── frontend/
│   ├── index.html                       # Public landing page
│   ├── pages/                           # Application views
│   │   ├── dashboard.html               # Main dashboard & KPIs
│   │   ├── inventory.html               # Catalog table & filters
│   │   ├── product-details.html         # Single product inspection view
│   │   ├── product-form.html            # Add / Edit product form
│   │   ├── scan-inventory.html          # Count sheet image upload portal
│   │   ├── ai-processing.html           # Dedicated AI extraction screen
│   │   ├── scan-results.html            # Side-by-side verification table
│   │   ├── scan-history.html            # Audit history of previous scans
│   │   ├── settings.html                # Store & OCR threshold settings
│   │   └── inventory-template.html     # Standardized printable count sheet
│   │
│   ├── assets/                          # Images, logos, and UI icons
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── css/
│   │   ├── main.css                     # Global reset & imports
│   │   ├── variables.css                # Color tokens, spacing, typography
│   │   ├── layout.css                   # App shell, sidebar, navbar, drawer
│   │   ├── components.css               # Buttons, cards, tables, badges, toasts
│   │   └── pages/                       # Page-specific CSS modules
│   │
│   └── js/
│       ├── main.js                      # Helpers, formatters, and DOM hooks
│       ├── components/                  # Reusable sidebar, navbar, notifications
│       ├── services/                    # Fetch API client (api.js)
│       └── pages/                       # Page controllers
│
├── backend/
│   ├── server.js                        # Express application entry point
│   ├── config/
│   │   ├── supabase.js                  # Supabase client initialization
│   │   └── gemini.js                    # Google Generative AI client
│   ├── routes/
│   │   ├── products.js                  # Product catalog REST endpoints
│   │   ├── dashboard.js                 # Metric aggregation endpoints
│   │   └── scan.js                      # Multer upload & OCR verification
│   ├── services/
│   │   └── gemini.js                    # Gemini Multimodal OCR service
│   ├── database/
│   │   └── schema.sql                   # Supabase PostgreSQL schema
│   ├── middleware/                      # Error and request handlers
│   └── utils/                           # Shared utility functions
│
├── uploads/                             # Uploaded count sheet images
├── .env.example                         # Environment variables template
├── .gitignore                           # Git ignore rules
├── package.json                         # Dependencies & npm scripts
└── README.md                            # Project documentation & collab log
```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server, Supabase, and Gemini connectivity check. |
| `GET` | `/api/products` | Retrieve all inventory products with optional filters. |
| `GET` | `/api/products/:id` | Retrieve single product details by ID. |
| `POST` | `/api/products` | Create a new product. |
| `PUT` | `/api/products/:id` | Update an existing product. |
| `DELETE` | `/api/products/:id` | Delete a product from inventory. |
| `GET` | `/api/dashboard/stats` | Retrieve aggregate metrics (total stock, valuations, low stock items). |
| `POST` | `/api/scan/upload` | Multipart upload for count sheet photo (`multer`). |
| `GET` | `/api/scan/:id` | Retrieve scan data and extracted line items. |
| `POST` | `/api/scan/:id/process` | Trigger Gemini Multimodal OCR transcription. |
| `POST` | `/api/scan/:id/verify` | Commit user-verified items to database inventory. |
| `GET` | `/api/scans` | Retrieve scan audit log. |

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher; tested on v25.6.1)
- npm (v9 or higher)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the template to create your `.env` file:
```bash
cp .env.example .env
```

Update `.env` with your credentials:
```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
GEMINI_API_KEY=your-gemini-api-key
```
> **Note:** If `.env` credentials are not configured, the application automatically runs in local development mode with in-memory stores and mock OCR data so you can test all views and flows without external dependencies.

### 4. Database Setup (Supabase)
Run the SQL queries from `backend/database/schema.sql` inside your Supabase SQL Editor to initialize:
- `products` table
- `scans` table
- `scan_items` table
- `settings` table

### 5. Run the Application
Start the development server with live watch:
```bash
npm run dev
```

For production start:
```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
