-- ============================================================================
-- INVENTRA POSTGRESQL SCHEMA (Supabase Compatible)
-- Modular table definitions for products, handwriting scans, and store config
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100) DEFAULT 'General',
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);

-- 2. SCANS TABLE (Audit history of all uploaded count sheets)
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT,
    total_items_detected INTEGER DEFAULT 0,
    total_items_saved INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN ('processing', 'pending_verification', 'completed', 'discarded')),
    raw_ai_output JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SCAN ITEMS TABLE (Individual line items extracted from sheets)
CREATE TABLE IF NOT EXISTS scan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    raw_name TEXT NOT NULL,
    detected_category VARCHAR(100),
    detected_quantity INTEGER DEFAULT 1,
    detected_price NUMERIC(10, 2) DEFAULT 0.00,
    confidence_score VARCHAR(20) DEFAULT 'high',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255) DEFAULT 'Inventra Demo Store',
    currency VARCHAR(10) DEFAULT '$',
    default_threshold INTEGER DEFAULT 5,
    default_category VARCHAR(100) DEFAULT 'General',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sample Seed Data for Instant Local Testing
INSERT INTO products (name, sku, category, quantity, unit_price, low_stock_threshold, description)
VALUES 
('Hex Head Bolt M8x40', 'BLT-001', 'Fasteners', 120, 0.45, 30, 'Grade 8.8 zinc-plated bolt'),
('Stainless Washer 8mm', 'WSH-002', 'Fasteners', 14, 0.15, 25, '316 Marine Grade Stainless Steel'),
('Silicone Sealant Clear 300ml', 'ADH-003', 'Adhesives', 4, 6.50, 10, 'Waterproof neutral cure silicone'),
('Heavy Duty Masking Tape 50mm', 'TAP-004', 'Consumables', 0, 3.20, 5, 'High adhesion crepe paper tape'),
('Drill Bit Set 13-Piece HSS', 'TLS-005', 'Tools', 18, 15.00, 5, 'Titanium coated drill bits 1.5-6.5mm')
ON CONFLICT (sku) DO NOTHING;
