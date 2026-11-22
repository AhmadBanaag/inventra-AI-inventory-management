# Inventra — Write. Snap. Sort.

Inventra is a web-based inventory management system designed specifically for small businesses. It simplifies physical inventory recording through AI-powered handwriting recognition: users fill out a standardized printable template, snap a photo, upload it, and let Google Gemini extract and categorize the handwritten items. Extracted items are reviewed and verified by the user before being saved to the database.

---

## Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript, Fetch API
- **Backend:** Node.js, Express.js (REST API architecture)
- **Database:** Supabase (PostgreSQL)
- **AI Integration:** Google Gemini API (Multimodal handwriting recognition & structured JSON extraction)

---

## Project Structure

```
inventra/
│
├── frontend/
│   ├── index.html                   # Landing page
│   ├── pages/                       # Application views
│   │   ├── dashboard.html           # Main dashboard & KPIs
│   │   ├── inventory.html           # Product list table & filtering
│   │   ├── product-details.html     # Single product view
│   │   ├── product-form.html        # Add / Edit product form
│   │   ├── scan-inventory.html      # Template download & image upload
│   │   ├── ai-processing.html       # AI extraction status screen
│   │   ├── scan-results.html        # Verification & correction table
│   │   ├── scan-history.html        # Previous scan logs & results
│   │   └── settings.html            # User & inventory settings
│   │
│   ├── assets/
│   │   ├── images/                  # Graphic assets & diagrams
│   │   └── icons/                   # SVG / UI icons
│   │
│   ├── css/
│   │   ├── main.css                 # Base resets & global typography
│   │   ├── variables.css            # Design tokens & color system
│   │   ├── layout.css               # Sidebar, header, & container layout
│   │   ├── components.css           # Buttons, inputs, cards, tables, modals
│   │   └── pages/                   # Page-specific CSS modules
│   │
│   └── js/
│       ├── main.js                  # Shared initialization & helpers
│       ├── components/              # Shared UI components (sidebar, navbar, toasts)
│       ├── services/                # API communication layer (Fetch API)
│       └── pages/                   # Page-specific JavaScript controllers
│
├── backend/
│   ├── server.js                    # Express application entry point
│   ├── config/                      # Environment & client configurations (Supabase, Gemini)
│   ├── controllers/                 # Route handler functions
│   ├── routes/                      # Express REST API routes
│   ├── services/                    # Business logic (Gemini OCR, Inventory service)
│   ├── middleware/                  # Request validation & error handling
│   ├── database/                    # SQL schema migrations & seed scripts
│   └── utils/                       # Shared utility functions
│
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies & scripts
└── README.md                        # Project documentation
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Default URL: `http://localhost:3000`
