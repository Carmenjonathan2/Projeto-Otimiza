const fs = require('fs');
const path = require('path');

/**
 * Filters the metadata by keywords matching product name, type, or tags.
 */
function filterByKeywords(list, keywords) {
  const lower = keywords.map(k => k.toLowerCase());
  return list.filter(item => {
    const nameLower = (item.nome || '').toLowerCase();
    const tipoLower = (item.tipo || '').toLowerCase();
    const tagsLower = (item.tags || '').toLowerCase();
    return lower.some(k => nameLower.includes(k) || tipoLower.includes(k) || tagsLower.includes(k));
  });
}

/**
 * Resolves the 4 selected promotions for the given day number.
 * Returns an array of selected products and their corresponding filenames.
 */
function getSelectedProductsForDay(metadataPath, files, day) {
  if (!fs.existsSync(metadataPath)) {
    console.error(`[product_selector] Error: metadata file not found at ${metadataPath}`);
    return { selectedProducts: [], selectedFiles: [] };
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // Define category keywords
  const suplementos = filterByKeywords(metadata, [
    'suplement', 'farmácia', 'farmacia', 'remedio', 'remédio', 'vet care', 'ampicilina', 'auritop', 
    'otológico', 'otologico', 'giardia', 'marbocyl', 'norflagen', 'zitrex', 'vitecol', 'eritres', 'eritrês', 
    'suplementação', 'suplementacao', 'antibiótico', 'antibiotico', 'veterinário', 'veterinario'
  ]); // farmácia suplemento

  const alimentos = filterByKeywords(metadata, [
    'ração', 'racao', 'petisco', 'food', 'natural', 'nuggets', 'pallitus', 'bifinho', 'cookie', 
    'biscoito', 'snack', 'snacks'
  ]); // ração ou petisco

  const brinquedos = filterByKeywords(metadata, [
    'brinquedo', 'acessório', 'acessorios', 'acessórios', 'guia', 'coleira', 'peitoral', 'peiteira', 
    'cinto', 'mordedor', 'frisbee', 'bola', 'kong', 'manta', 'bebedouro', 'bico', 'toy', 'jogo americano', 
    'pente', 'escova', 'coleiras'
  ]); // brinquedo ou acessório

  // Highlight: all products sorted by highest discount
  const sortedByDiscount = [...metadata].sort((a, b) => b.desconto - a.desconto);
  const destaque = sortedByDiscount;

  const selectedProducts = [];
  const selectedIds = new Set();

  function tryPickUnique(arr, offset) {
    if (!arr || arr.length === 0) return null;
    const startIndex = offset % arr.length;
    for (let i = 0; i < arr.length; i++) {
      const item = arr[(startIndex + i) % arr.length];
      if (item && !selectedIds.has(item.id)) {
        selectedIds.add(item.id);
        selectedProducts.push(item);
        return item;
      }
    }
    return null;
  }

  // 1. Pick a Farmácia / Suplemento
  tryPickUnique(suplementos, day);

  // 2. Pick a Ração / Petisco
  tryPickUnique(alimentos, day + 1);

  // 3. Pick a Brinquedo / Acessório
  tryPickUnique(brinquedos, day + 2);

  // 4. Pick a Destaque (highest discount not already selected)
  tryPickUnique(destaque, day);

  // Fallbacks: if we don't have 4 products, fill from destaque
  if (selectedProducts.length < 4) {
    for (const item of destaque) {
      if (selectedProducts.length >= 4) break;
      if (!selectedIds.has(item.id)) {
        selectedIds.add(item.id);
        selectedProducts.push(item);
      }
    }
  }

  // Extra Fallback: if we still don't have 4, fill with anything from metadata
  if (selectedProducts.length < 4) {
    for (const item of metadata) {
      if (selectedProducts.length >= 4) break;
      if (!selectedIds.has(item.id)) {
        selectedIds.add(item.id);
        selectedProducts.push(item);
      }
    }
  }

  // Map selected product IDs to filenames in files list
  let selectedFiles = selectedProducts.map(p => {
    const pattern = `post_${p.id}`;
    return files.find(f => f.startsWith(pattern));
  }).filter(Boolean);

  // Robust Fallback: if we have files in posts_prontos, but they don't match the daily selected products,
  // fill selectedFiles with the actual files present in the directory so we don't send 0 files.
  if (selectedFiles.length < 4 && files.length > 0) {
    for (const file of files) {
      if (selectedFiles.length >= 4) break;
      if (!selectedFiles.includes(file)) {
        selectedFiles.push(file);
      }
    }
  }

  return { selectedProducts, selectedFiles };
}

module.exports = { getSelectedProductsForDay };
