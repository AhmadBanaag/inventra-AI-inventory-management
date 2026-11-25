/**
 * Scan & OCR Audit Business Service (scanService.js)
 * Coordinates count sheet records, raw AI logs, and verification state transitions
 */

const supabase = require('../config/supabase');
const { extractHandwrittenInventory } = require('./gemini');
const fs = require('fs');
const { detectImageMimeType } = require('../utils/image');

// In-memory scans store for development when Supabase is offline
let memoryScans = [];

/**
 * Record a newly uploaded sheet image
 */
async function createScan(fileData) {
  const scanPayload = {
    image_url: fileData.path || fileData.filename,
    total_items_detected: 0,
    total_items_saved: 0,
    status: 'processing',
    raw_ai_output: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from('scans').insert([scanPayload]).select().single();
    if (error) {
      console.warn('[ScanService] Supabase insert failed, using memory fallback:', error.message);
    } else {
      return {
        ...data,
        filePath: fileData.path,
        filename: fileData.filename,
        mimeType: fileData.mimetype,
      };
    }
  }

  const record = {
    ...scanPayload,
    id: `scan-${Date.now()}`,
    filePath: fileData.path,
    filename: fileData.filename,
    mimeType: fileData.mimetype,
    items: [],
  };

  memoryScans.unshift(record);
  return record;
}

/**
 * Retrieve scan record by ID
 */
async function getScanById(id) {
  if (supabase) {
    const { data, error } = await supabase.from('scans').select('*').eq('id', id).single();
    if (!error && data) {
      return {
        ...data,
        filePath: data.image_url,
        items: data.raw_ai_output?.items || [],
      };
    }
  }

  const scan = memoryScans.find(s => s.id === id);
  if (!scan) {
    const err = new Error('Scan record not found.');
    err.statusCode = 404;
    throw err;
  }

  return scan;
}

/**
 * Trigger Gemini Multimodal OCR and store raw extracted JSON
 */
async function processScanWithAI(id) {
  const scan = await getScanById(id);
  const filePath = scan.filePath || null;
  const imageBuffer = filePath ? fs.readFileSync(filePath) : null;
  const mimeType = scan.mimeType || (imageBuffer && detectImageMimeType(imageBuffer));

  if (!mimeType) {
    const error = new Error('The saved scan is not a supported JPEG, PNG, or WebP image.');
    error.statusCode = 415;
    throw error;
  }

  const items = await extractHandwrittenInventory(filePath, mimeType);

  if (supabase) {
    await supabase.from('scans').update({
      total_items_detected: items.length,
      status: 'pending_verification',
      raw_ai_output: { items },
      updated_at: new Date().toISOString(),
    }).eq('id', id);
  }

  const memIdx = memoryScans.findIndex(s => s.id === id);
  if (memIdx !== -1) {
    memoryScans[memIdx].items = items;
    memoryScans[memIdx].total_items_detected = items.length;
    memoryScans[memIdx].status = 'pending_verification';
    memoryScans[memIdx].raw_ai_output = { items };
  }

  return { scanId: id, items };
}

/**
 * Complete scan verification audit log after items are committed to database
 */
async function completeVerification(id, verifiedItems) {
  if (supabase) {
    await supabase.from('scans').update({
      total_items_saved: verifiedItems.length,
      status: 'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    // Record verified line items in scan_items table for audit trail
    const lineItemRows = verifiedItems.map(item => ({
      scan_id: id,
      raw_name: item.name,
      detected_category: item.category || 'General',
      detected_quantity: item.quantity,
      detected_price: item.unit_price || 0.00,
      confidence_score: item.confidence || 'high',
      is_verified: true,
    }));

    await supabase.from('scan_items').insert(lineItemRows).catch(err => {
      console.warn('[ScanService] Audit items log insert note:', err.message);
    });
  }

  const memIdx = memoryScans.findIndex(s => s.id === id);
  if (memIdx !== -1) {
    memoryScans[memIdx].total_items_saved = verifiedItems.length;
    memoryScans[memIdx].status = 'completed';
    memoryScans[memIdx].items = verifiedItems;
  }

  return true;
}

/**
 * Retrieve all historical scans
 */
async function getAllScans() {
  if (supabase) {
    const { data, error } = await supabase.from('scans').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  }

  return memoryScans;
}

module.exports = {
  createScan,
  getScanById,
  processScanWithAI,
  completeVerification,
  getAllScans,
  memoryScans,
};
