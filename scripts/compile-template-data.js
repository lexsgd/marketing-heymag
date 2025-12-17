#!/usr/bin/env node
/**
 * Compile Generated Template Data
 *
 * Reads all generated JSON files and compiles them into a TypeScript data file
 * for import into the templates page.
 *
 * Usage: node scripts/compile-template-data.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '..', 'data', 'generated-templates');
const OUTPUT_FILE = path.join(__dirname, '..', 'lib', 'template-images.ts');

// Category display names
const CATEGORY_NAMES = {
  'delivery': 'Delivery & Takeout',
  'restaurant': 'Restaurant',
  'fine-dining': 'Fine Dining',
  'cafe': 'Cafe & Coffee',
  'christmas': 'Christmas',
  'chinese-new-year': 'Chinese New Year',
};

// Item descriptions (should match the generation script)
const ITEM_DESCRIPTIONS = {
  'delivery': [
    { name: 'Poke Bowl', desc: 'Fresh poke bowl with salmon and avocado' },
    { name: 'Acai Bowl', desc: 'Colorful acai bowl with granola and berries' },
    { name: 'Asian Grain Bowl', desc: 'Teriyaki chicken grain bowl' },
    { name: 'Mediterranean Bowl', desc: 'Hummus and falafel bowl' },
    { name: 'Sushi Burrito', desc: 'Fresh tuna sushi burrito' },
    { name: 'Buddha Bowl', desc: 'Quinoa and chickpea buddha bowl' },
    { name: 'Thai Basil Bowl', desc: 'Thai basil chicken rice bowl' },
    { name: 'Bibimbap', desc: 'Korean bibimbap with beef' },
  ],
  'restaurant': [
    { name: 'Pan-Seared Salmon', desc: 'Salmon with crispy skin and lemon butter' },
    { name: 'Avocado Toast', desc: 'Avocado toast with poached egg' },
    { name: 'Wagyu Burger', desc: 'Wagyu beef burger with truffle aioli' },
    { name: 'Grilled Lobster', desc: 'Lobster tail with garlic herb butter' },
    { name: 'Mushroom Risotto', desc: 'Creamy risotto with truffle oil' },
    { name: 'Lamb Chops', desc: 'Herb-crusted lamb with mint sauce' },
    { name: 'Duck Breast', desc: 'Roasted duck with orange glaze' },
    { name: 'Seafood Linguine', desc: 'Linguine with clams in white wine' },
  ],
  'fine-dining': [
    { name: 'Duck Breast', desc: 'Seared duck with cherry reduction' },
    { name: 'Beef Tenderloin', desc: 'Medallion with foie gras and truffle' },
    { name: 'Scallop', desc: 'Pan-seared scallop with caviar' },
    { name: 'Venison', desc: 'Venison loin with blackberry jus' },
    { name: 'Lobster', desc: 'Butter-poached lobster with foam' },
    { name: 'Wagyu Tataki', desc: 'Wagyu with ponzu pearls' },
    { name: 'Turbot', desc: 'Turbot with saffron beurre blanc' },
    { name: 'Tiramisu', desc: 'Deconstructed tiramisu with espresso gel' },
  ],
  'cafe': [
    { name: 'Croissant', desc: 'Golden flaky butter croissant' },
    { name: 'Matcha Latte', desc: 'Matcha latte with foam art' },
    { name: 'Chocolate Éclair', desc: 'French éclair with glossy glaze' },
    { name: 'Avocado Toast', desc: 'Sourdough avocado toast' },
    { name: 'Berry Tart', desc: 'Mixed berry tart with custard' },
    { name: 'Cinnamon Roll', desc: 'Warm cinnamon roll with frosting' },
    { name: 'Cappuccino', desc: 'Cappuccino with rosetta art' },
    { name: 'Eggs Benedict', desc: 'Classic eggs Benedict' },
  ],
  'christmas': [
    { name: 'Christmas Ham', desc: 'Glazed ham with honey and cloves' },
    { name: 'Gingerbread Cookies', desc: 'Decorated gingerbread with icing' },
    { name: 'Yule Log', desc: 'Bûche de Noël with chocolate' },
    { name: 'Hot Chocolate', desc: 'Festive hot chocolate' },
  ],
  'chinese-new-year': [
    { name: 'Yu Sheng', desc: 'Prosperity toss salad' },
    { name: 'Steamed Fish', desc: 'Whole fish with ginger' },
    { name: 'Pineapple Tarts', desc: 'Golden pineapple tarts' },
    { name: 'Dumplings', desc: 'Lucky prosperity dumplings' },
  ],
};

function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           COMPILE TEMPLATE DATA                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Input directory: ${INPUT_DIR}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log('');

  // Read all JSON files
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files\n`);

  // Group by category
  const byCategory = {};

  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!content.success || !content.images) {
      console.log(`  ⚠ Skipping ${file} (not successful)`);
      continue;
    }

    // Extract category and index from filename
    const match = file.match(/^([a-z-]+)_(\d+)\.json$/);
    if (!match) continue;

    const [, category, indexStr] = match;
    const index = parseInt(indexStr, 10);

    if (!byCategory[category]) {
      byCategory[category] = [];
    }

    // Get item info
    const itemInfo = ITEM_DESCRIPTIONS[category]?.[index] || { name: `Item ${index}`, desc: '' };

    byCategory[category].push({
      index,
      id: content.images.imageId,
      name: itemInfo.name,
      description: itemInfo.desc,
      category,
      thumbUrl: content.images.thumb.url,
      webUrl: content.images.web.url,
      originalUrl: content.images.original.url,
    });
  }

  // Sort each category by index
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => a.index - b.index);
  }

  // Generate TypeScript file
  const timestamp = new Date().toISOString();

  let ts = `/**
 * Template Image Data
 *
 * Auto-generated from AI-generated images
 * Generated: ${timestamp}
 *
 * DO NOT EDIT MANUALLY - Run 'node scripts/compile-template-data.js' to regenerate
 */

export interface TemplateImage {
  id: string
  name: string
  description: string
  category: string
  thumbUrl: string
  webUrl: string
  originalUrl: string
}

`;

  // Generate each category export
  const categoryVars = {};

  for (const [category, images] of Object.entries(byCategory)) {
    const varName = category.replace(/-/g, '') + 'Templates';
    categoryVars[category] = varName;

    ts += `// ═══════════════════════════════════════════════════════════════════════════
// ${CATEGORY_NAMES[category] || category.toUpperCase()} (${images.length} images)
// ═══════════════════════════════════════════════════════════════════════════
export const ${varName}: TemplateImage[] = [\n`;

    for (const img of images) {
      ts += `  {
    id: '${img.id}',
    name: '${img.name}',
    description: '${img.description}',
    category: '${img.category}',
    thumbUrl: '${img.thumbUrl}',
    webUrl: '${img.webUrl}',
    originalUrl: '${img.originalUrl}',
  },\n`;
    }

    ts += `]\n\n`;
  }

  // Combined exports
  ts += `// ═══════════════════════════════════════════════════════════════════════════
// COMBINED EXPORTS
// ═══════════════════════════════════════════════════════════════════════════
export const allTemplates = {\n`;

  for (const [category, varName] of Object.entries(categoryVars)) {
    ts += `  '${category}': ${varName},\n`;
  }

  ts += `}

export const templateCounts = {
`;

  let total = 0;
  for (const [category, images] of Object.entries(byCategory)) {
    ts += `  '${category}': ${images.length},\n`;
    total += images.length;
  }

  ts += `  total: ${total},
}

/**
 * Get templates for a specific category
 */
export function getTemplatesByCategory(category: string): TemplateImage[] {
  return allTemplates[category as keyof typeof allTemplates] || []
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): TemplateImage | undefined {
  for (const templates of Object.values(allTemplates)) {
    const found = templates.find(t => t.id === id)
    if (found) return found
  }
  return undefined
}
`;

  // Write output file
  fs.writeFileSync(OUTPUT_FILE, ts);

  // Summary
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPILATION COMPLETE                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  for (const [category, images] of Object.entries(byCategory)) {
    console.log(`${CATEGORY_NAMES[category] || category}: ${images.length} images`);
  }

  console.log(`\nTotal: ${total} images`);
  console.log(`\n✓ Output written to: ${OUTPUT_FILE}`);
}

main();
