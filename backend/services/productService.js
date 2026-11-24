/**
 * Product Business Service (productService.js)
 * Manages all product database interactions and batch upsert operations
 */

const supabase = require('../config/supabase');

// In-memory catalog store for development when Supabase is not connected
let memoryProducts = [];

/**
 * Retrieve all products with optional search, category, and status filtering
 */
async function getAllProducts(filters = {}) {
  const { search, category, status } = filters;

  if (supabase) {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let results = data || [];
    if (status === 'out_of_stock') {
      results = results.filter(p => p.quantity === 0);
    } else if (status === 'low_stock') {
      results = results.filter(p => p.quantity > 0 && p.quantity <= (p.low_stock_threshold || 5));
    } else if (status === 'in_stock') {
      results = results.filter(p => p.quantity > (p.low_stock_threshold || 5));
    }

    return results;
  }

  // Memory fallback filtering
  let results = [...memoryProducts];

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)));
  }

  if (category) {
    results = results.filter(p => (p.category || 'General') === category);
  }

  if (status === 'out_of_stock') {
    results = results.filter(p => p.quantity === 0);
  } else if (status === 'low_stock') {
    results = results.filter(p => p.quantity > 0 && p.quantity <= (p.low_stock_threshold || 5));
  } else if (status === 'in_stock') {
    results = results.filter(p => p.quantity > (p.low_stock_threshold || 5));
  }

  return results;
}

/**
 * Retrieve single product by ID
 */
async function getProductById(id) {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error || !data) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }
    return data;
  }

  const product = memoryProducts.find(p => p.id === id);
  if (!product) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }
  return product;
}

/**
 * Create a new catalog product
 */
async function createProduct(data) {
  const generatedSku = data.sku || `INV-${Math.floor(100 + Math.random() * 900)}`;

  const newProduct = {
    name: data.name,
    sku: generatedSku,
    category: data.category || 'General',
    quantity: Number(data.quantity) || 0,
    unit_price: Number(data.unit_price) || 0.00,
    low_stock_threshold: Number(data.low_stock_threshold) || 5,
    description: data.description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data: created, error } = await supabase.from('products').insert([newProduct]).select().single();
    if (error) throw new Error(error.message);
    return created;
  }

  const created = { id: String(Date.now()), ...newProduct };
  memoryProducts.unshift(created);
  return created;
}

/**
 * Update an existing product
 */
async function updateProduct(id, updates) {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select().single();
    if (error || !data) {
      const err = new Error(error ? error.message : 'Product not found.');
      err.statusCode = error ? 400 : 404;
      throw err;
    }
    return data;
  }

  const index = memoryProducts.findIndex(p => p.id === id);
  if (index === -1) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }

  memoryProducts[index] = { ...memoryProducts[index], ...updateData };
  return memoryProducts[index];
}

/**
 * Delete a product by ID
 */
async function deleteProduct(id) {
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const index = memoryProducts.findIndex(p => p.id === id);
  if (index === -1) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }

  memoryProducts.splice(index, 1);
  return true;
}

/**
 * Batch upsert verified scan line items into the database
 * Supports additive mode (restock) vs overwrite mode (physical audit)
 */
async function batchUpsertVerifiedProducts(items, mode = 'additive') {
  let addedCount = 0;
  let updatedCount = 0;
  const processedProducts = [];

  for (const item of items) {
    const searchName = item.name.trim();

    // Check if product exists by exact name match or SKU
    let existing = null;
    if (supabase) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('name', searchName)
        .limit(1)
        .maybeSingle();
      existing = data;
    } else {
      existing = memoryProducts.find(p => p.name.toLowerCase() === searchName.toLowerCase());
    }

    if (existing) {
      // Product exists: update stock
      const newQuantity = mode === 'overwrite'
        ? Number(item.quantity)
        : Number(existing.quantity) + Number(item.quantity);

      const updatePayload = {
        quantity: newQuantity,
        category: item.category || existing.category,
        unit_price: item.unit_price !== undefined && item.unit_price > 0 ? Number(item.unit_price) : existing.unit_price,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data: updated } = await supabase.from('products').update(updatePayload).eq('id', existing.id).select().single();
        processedProducts.push(updated);
      } else {
        const idx = memoryProducts.findIndex(p => p.id === existing.id);
        memoryProducts[idx] = { ...memoryProducts[idx], ...updatePayload };
        processedProducts.push(memoryProducts[idx]);
      }
      updatedCount++;
    } else {
      // Product is new: insert into catalog
      const newProductPayload = {
        name: searchName,
        sku: `INV-${Math.floor(100 + Math.random() * 900)}`,
        category: item.category || 'General',
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0.00,
        low_stock_threshold: 5,
        description: 'Imported from AI verified inventory count sheet.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data: created } = await supabase.from('products').insert([newProductPayload]).select().single();
        processedProducts.push(created);
      } else {
        const created = { id: String(Date.now() + Math.random()), ...newProductPayload };
        memoryProducts.unshift(created);
        processedProducts.push(created);
      }
      addedCount++;
    }
  }

  return {
    totalProcessed: items.length,
    addedCount,
    updatedCount,
    mode,
    products: processedProducts,
  };
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  batchUpsertVerifiedProducts,
  memoryProducts,
};
