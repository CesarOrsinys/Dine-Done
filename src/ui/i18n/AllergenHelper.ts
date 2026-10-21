import { OFFICIAL_ALLERGENS_I18N, getCanonicalAllergenKey } from './LanguageManager.js';
import { AppState } from '../state/AppState.js';

export const ALLERGEN_ICON_MAP: Record<string, string> = {
  // 1. Gluten: 🌾
  gluten: '🌾', trigo: '🌾', cebada: '🌾', avena: '🌾', centeno: '🌾',
  wheat: '🌾', barley: '🌾', oats: '🌾', rye: '🌾',
  blé: '🌾', orge: '🌾', avoine: '🌾',
  weizen: '🌾', gerste: '🌾', hafer: '🌾',
  '麸质': '🌾', '小麦': '🌾',
  '小麦(グルテン)': '🌾', 'グルテン': '🌾',
  '글루텐': '🌾', '밀': '🌾',
  'глютен': '🌾', 'пшениця': '🌾',
  'glúten': '🌾', 'غلوتين': '🌾', 'قمح': '🌾',
  glutena: '🌾', glute: '🌾', blat: '🌾',

  // 2. Crustáceos: 🦐
  crustáceos: '🦐', crustaceos: '🦐', marisco: '🦐', gambas: '🦐', langostinos: '🦐',
  crustaceans: '🦐', shellfish: '🦐', shrimp: '🦐', prawns: '🦐', lobster: '🦐', crab: '🦐',
  crustacés: '🦐', crevettes: '🦐',
  krebstiere: '🦐', garnelen: '🦐',
  '甲壳类': '🦐', '甲壳动物': '🦐', '虾': '🦐', '蟹': '🦐',
  '甲殻類': '🦐', 'エビ': '🦐', 'カニ': '🦐',
  '갑각류': '🦐', '새우': '🦐', '게': '🦐',
  'ракоподібні': '🦐', 'креветки': '🦐',
  'قشريات': '🦐', 'جمبري': '🦐',
  crustacis: '🦐', krustazeoak: '🦐',

  // 3. Huevos: 🥚
  huevos: '🥚', huevo: '🥚',
  eggs: '🥚', egg: '🥚',
  oeufs: '🥚', oeuf: '🥚',
  eier: '🥚', ei: '🥚',
  '蛋类': '🥚', '鸡蛋': '🥚', '蛋': '🥚',
  '卵': '🥚', 'たまご': '🥚', '玉子': '🥚',
  '계란': '🥚', '달걀': '🥚',
  'яйця': '🥚', 'яйце': '🥚',
  ovos: '🥚', ovo: '🥚',
  'بيض': '🥚', 'بيضة': '🥚',
  ous: '🥚', ou: '🥚',
  arrautzak: '🥚', arrautza: '🥚',

  // 4. Pescado: 🐟
  pescado: '🐟', pez: '🐟', atún: '🐟', salmón: '🐟',
  fish: '🐟', tuna: '🐟', salmon: '🐟',
  poisson: '🐟', fisch: '🐟',
  '鱼类': '🐟', '鱼': '🐟',
  '魚介類': '🐟', '魚': '🐟', 'さかな': '🐟',
  '생선': '🐟', '물고기': '🐟',
  'риба': '🐟', peixe: '🐟',
  'أسماك': '🐟', 'سمك': '🐟',
  peix: '🐟', arraina: '🐟',

  // 5. Cacahuetes: 🥜
  cacahuetes: '🥜', cacahuate: '🥜', maní: '🥜', mani: '🥜',
  peanuts: '🥜', peanut: '🥜',
  arachides: '🥜', arachide: '🥜',
  erdnüsse: '🥜', erdnuss: '🥜',
  '花生': '🥜', '落花生': '🥜',
  'ピーナッツ': '🥜', '땅콩': '🥜',
  'арахіс': '🥜', amendoins: '🥜', amendoim: '🥜',
  'فول سوداني': '🥜',
  cacauets: '🥜', kakahueteak: '🥜',

  // 6. Soja: 🌱
  soja: '🌱', soy: '🌱', soybeans: '🌱', soybean: '🌱',
  '大豆': '🌱', '黄豆': '🌱',
  '대두': '🌱', '콩': '🌱',
  'соя': '🌱', 'صويا': '🌱',
  soia: '🌱',

  // 7. Lácteos: 🥛
  lácteos: '🥛', lacteos: '🥛', leche: '🥛', queso: '🥛', yogur: '🥛',
  milk: '🥛', dairy: '🥛', cheese: '🥛', yogurt: '🥛',
  lait: '🥛', fromage: '🥛',
  milch: '🥛', käse: '🥛',
  '乳制品': '🥛', '牛奶': '🥛',
  '乳製品': '🥛', 'ミルク': '🥛', '牛乳': '🥛',
  '유제품': '🥛', '우유': '🥛',
  'лактоза': '🥛', 'молоко': '🥛',
  laticínios: '🥛', leite: '🥛',
  'مشتقات الحليب': '🥛', 'حليب': '🥛',
  'làctics': '🥛', llet: '🥛', lactis: '🥛',
  esnekiak: '🥛', esnea: '🥛',

  // 8. Frutos de cáscara: 🌰
  'frutos de cáscara': '🌰', 'frutos de cascara': '🌰', 'frutos secos': '🌰', nueces: '🌰', avellanas: '🌰', almendras: '🌰',
  'tree nuts': '🌰', nuts: '🌰', walnuts: '🌰', hazelnuts: '🌰', almonds: '🌰', cashews: '🌰', pistachios: '🌰',
  'fruits à coque': '🌰', noix: '🌰',
  'schalenfrüchte': '🌰', nüsse: '🌰',
  '坚果': '🌰', '核桃': '🌰',
  'ナッツ類': '🌰', 'ナッツ': '🌰',
  '견과류': '🌰', '호두': '🌰',
  'горіхи': '🌰',
  'frutos de casca rija': '🌰', nozes: '🌰',
  'مكسرات': '🌰', 'جوز': '🌰',
  'fruits de closca': '🌰', 'fruits de corfa': '🌰',
  'fruitu lehorrak': '🌰', 'froitos de casca': '🌰',

  // 9. Apio: 🌿
  apio: '🌿', celery: '🌿', céleri: '🌿', celeri: '🌿', sellerie: '🌿',
  '芹菜': '🌿', 'セロリ': '🌿', '샐러리': '🌿', 'селера': '🌿',
  aipo: '🌿', 'كرفس': '🌿', api: '🌿', ziazerba: '🌿',

  // 10. Mostaza: 🌭
  mostaza: '🌭', mustard: '🌭', moutarde: '🌭', senf: '🌭',
  '芥末': '🌭', 'マスタード': '🌭', '겨자': '🌭', 'гірчиця': '🌭',
  mostarda: '🌭', 'خردل': '🌭', mostassa: '🌭',

  // 11. Sésamo: 🥯
  sésamo: '🥯', sesamo: '🥯', ajonjolí: '🥯', ajonjoli: '🥯',
  'sesame seeds': '🥯', sesame: '🥯',
  'graines de sésame': '🥯', sesamsamen: '🥯',
  '芝麻': '🥯', 'ごま': '🥯', 'ゴマ': '🥯', '참깨': '🥯',
  'кунжут': '🥯', 'sementes de sésamo': '🥯', 'سمسم': '🥯',
  'sèsam': '🥯', sesamoa: '🥯',

  // 12. Sulfitos: 🍷
  sulfitos: '🍷', sulfito: '🍷', sulphites: '🍷', sulfites: '🍷', sulfite: '🍷',
  '亚硫酸盐': '🍷', '亜硫酸塩': '🍷', '아황산염': '🍷',
  'сульфіти': '🍷', 'كبريتات': '🍷', sulfits: '🍷', sulfitoak: '🍷',

  // 13. Altramuces: 🌾
  altramuces: '🌾', altramuz: '🌾', lupin: '🌾', lupinen: '🌾',
  '羽扇豆': '🌾', 'ルピナス': '🌾', '루핀': '🌾', 'люпин': '🌾',
  'tremoço': '🌾', 'ترمس': '🌾', 'llobí': '🌾', llobins: '🌾', lupinuak: '🌾', tremoce: '🌾',

  // 14. Moluscos: 🦪
  moluscos: '🦪', molusco: '🦪', mejillones: '🦪', almejas: '🦪', calamares: '🦪', pulpo: '🦪',
  molluscs: '🦪', mollusc: '🦪', mussels: '🦪', clams: '🦪', squid: '🦪', octopus: '🦪',
  mollusques: '🦪', weichtiere: '🦪',
  '软体动物': '🦪', '軟体動物': '🦪', '연체동물': '🦪',
  'молюски': '🦪', 'رخويات': '🦪', 'mol·luscs': '🦪', moluskuak: '🦪'
};

export function getAllergenIcon(name: string, canonicalName?: string): string {
  const norm = (str?: string) => (str || '').toLowerCase().trim();
  const searchCandidates = [norm(name), norm(canonicalName)].filter(Boolean);

  for (const s of searchCandidates) {
    if (ALLERGEN_ICON_MAP[s]) return ALLERGEN_ICON_MAP[s];
    for (const [key, icon] of Object.entries(ALLERGEN_ICON_MAP)) {
      if (s.includes(key)) return icon;
    }
  }
  return '⚠️';
}

export function getLocalizedAllergenDisplay(rawAllergen: string, lang: string = AppState.currentLanguage): { name: string; icon: string } {
  const key = getCanonicalAllergenKey(rawAllergen);
  if (key && OFFICIAL_ALLERGENS_I18N[key]) {
    const item = OFFICIAL_ALLERGENS_I18N[key];
    const name = item.translations[lang] || item.translations['es'] || rawAllergen;
    return { name, icon: item.icon };
  }
  return { name: rawAllergen, icon: getAllergenIcon(rawAllergen) };
}

export function renderModalAllergensGrid(selectedAllergens: string[] = []) {
  const grid = document.getElementById('modal-allergens-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const canonicalSelected = new Set(selectedAllergens.map(a => getCanonicalAllergenKey(a)).filter(Boolean));

  for (const [key, item] of Object.entries(OFFICIAL_ALLERGENS_I18N)) {
    const isChecked = canonicalSelected.has(key) || selectedAllergens.includes(item.translations['es']);
    const localizedName = item.translations[AppState.currentLanguage] || item.translations['es'];
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '5px';
    label.style.cursor = 'pointer';
    label.innerHTML = `
      <input type="checkbox" name="new-product-allergen" value="${item.translations['es']}" data-key="${key}" ${isChecked ? 'checked' : ''} style="accent-color:var(--accent-orange);">
      <span>${item.icon} ${localizedName}</span>
    `;
    grid.appendChild(label);
  }
}
