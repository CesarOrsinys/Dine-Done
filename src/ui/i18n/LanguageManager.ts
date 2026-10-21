import restaurantConfig from '../../../mock_data/restaurant_config.json' with { type: 'json' };
import translationsData from '../../../mock_data/translations.json' with { type: 'json' };
import { UserRole } from '../../core/domain/enums/UserRole.js';

export type Language = 'es' | 'en' | 'fr' | 'de' | 'zh' | 'ko' | 'uk' | 'pt' | 'ja' | 'ar' | 'ca' | 'va' | 'eu' | 'gl' | string;

export const translations: Record<string, any> = translationsData as Record<string, any>;

export const LANGUAGE_META: Record<string, { flag: string; label: string; name: string }> = {
  es: { flag: '🇪🇸', label: 'ES', name: 'Español' },
  en: { flag: '🇬🇧', label: 'EN', name: 'English' },
  fr: { flag: '🇫🇷', label: 'FR', name: 'Français' },
  de: { flag: '🇩🇪', label: 'DE', name: 'Deutsch' },
  zh: { flag: '🇨🇳', label: 'ZH', name: '中文' },
  ko: { flag: '🇰🇷', label: 'KO', name: '한국어' },
  uk: { flag: '🇺🇦', label: 'UK', name: 'Українська' },
  pt: { flag: '🇵🇹', label: 'PT', name: 'Português' },
  ja: { flag: '🇯🇵', label: 'JA', name: '日本語' },
  ar: { flag: '🇸🇦', label: 'AR', name: 'العربية' },
  ca: { flag: '', label: 'CA', name: 'Català' },
  va: { flag: '', label: 'VA', name: 'Valencià' },
  eu: { flag: '', label: 'EU', name: 'Euskara' },
  gl: { flag: '', label: 'GL', name: 'Galego' }
};

export interface StaffRoleConfig {
  id: string;
  name: string;
  icon?: string;
  baseRole: 'MANAGER' | 'WAITER' | 'CHEF' | string;
  translations?: Record<string, string>;
}

export let availableStaffRoles: StaffRoleConfig[] = [];

export function initStaffRoles() {
  const defaultRoles: StaffRoleConfig[] = (restaurantConfig as any).staffRoles || [];
  let customRoles: StaffRoleConfig[] = [];
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('DND_CUSTOM_ROLES');
      if (stored) customRoles = JSON.parse(stored);
    } catch (e) {
      console.error('Error loading custom roles:', e);
    }
  }
  availableStaffRoles = [...defaultRoles, ...customRoles];
}

initStaffRoles();

export async function translateTextOnline(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) return '';
  const langMap: Record<string, string> = {
    zh: 'zh-CN',
    va: 'ca'
  };
  const gtxLang = langMap[targetLang] || targetLang;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${encodeURIComponent(gtxLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((chunk: any) => chunk[0]).join('');
      return translated || text;
    }
    return text;
  } catch {
    return text;
  }
}

export const OFFICIAL_ALLERGENS_I18N: Record<string, { icon: string; translations: Record<string, string> }> = {
  gluten: {
    icon: '🌾',
    translations: {
      es: 'Gluten', en: 'Gluten', fr: 'Gluten', de: 'Gluten', zh: '麸质', ko: '글루텐',
      uk: 'Глютен', pt: 'Glúten', ja: '小麦(グルテン)', ar: 'غلوتين', ca: 'Gluten', va: 'Gluten', eu: 'Glutena', gl: 'Glute'
    }
  },
  crustaceos: {
    icon: '🦐',
    translations: {
      es: 'Crustáceos', en: 'Crustaceans', fr: 'Crustacés', de: 'Krebstiere', zh: '甲壳类', ko: '갑각류',
      uk: 'Ракоподібні', pt: 'Crustáceos', ja: '甲殻類', ar: 'قشريات', ca: 'Crustacis', va: 'Crustacis', eu: 'Krustazeoak', gl: 'Crustáceos'
    }
  },
  huevos: {
    icon: '🥚',
    translations: {
      es: 'Huevos', en: 'Eggs', fr: 'Œufs', de: 'Eier', zh: '蛋类', ko: '계란',
      uk: 'Яйця', pt: 'Ovos', ja: '卵', ar: 'بيض', ca: 'Ous', va: 'Ous', eu: 'Arrautzak', gl: 'Ovos'
    }
  },
  pescado: {
    icon: '🐟',
    translations: {
      es: 'Pescado', en: 'Fish', fr: 'Poisson', de: 'Fisch', zh: '鱼类', ko: '생선',
      uk: 'Риба', pt: 'Peixe', ja: '魚介類', ar: 'أسماك', ca: 'Peix', va: 'Peix', eu: 'Arraina', gl: 'Peixe'
    }
  },
  cacahuetes: {
    icon: '🥜',
    translations: {
      es: 'Cacahuetes', en: 'Peanuts', fr: 'Arachides', de: 'Erdnüsse', zh: '花生', ko: '땅콩',
      uk: 'Арахіс', pt: 'Amendoins', ja: 'ピーナッツ', ar: 'فول سوداني', ca: 'Cacauets', va: 'Cacauets', eu: 'Kakahueteak', gl: 'Amendoíns'
    }
  },
  soja: {
    icon: '🌱',
    translations: {
      es: 'Soja', en: 'Soybeans', fr: 'Soja', de: 'Soja', zh: '大豆', ko: '대두',
      uk: 'Соя', pt: 'Soja', ja: '大豆', ar: 'صويا', ca: 'Soja', va: 'Soja', eu: 'Soja', gl: 'Soia'
    }
  },
  lacteos: {
    icon: '🥛',
    translations: {
      es: 'Lácteos', en: 'Milk / Dairy', fr: 'Lait', de: 'Milch', zh: '乳制品', ko: '유제품',
      uk: 'Лактоза / Молоко', pt: 'Laticínios', ja: '乳製品', ar: 'مشتقات الحليب', ca: 'Làctics', va: 'Lactis', eu: 'Esnekiak', gl: 'Lácteos'
    }
  },
  frutos_de_cascara: {
    icon: '🌰',
    translations: {
      es: 'F. Cáscara', en: 'Tree Nuts', fr: 'Fruits à coque', de: 'Schalenfrüchte', zh: '坚果', ko: '견과류',
      uk: 'Горіхи', pt: 'Frutos de casca rija', ja: 'ナッツ類', ar: 'مكسرات', ca: 'Fruits de closca', va: 'Fruits de corfa', eu: 'Fruitu lehorrak', gl: 'Froitos de casca'
    }
  },
  apio: {
    icon: '🌿',
    translations: {
      es: 'Apio', en: 'Celery', fr: 'Céleri', de: 'Sellerie', zh: '芹菜', ko: '샐러리',
      uk: 'Селера', pt: 'Aipo', ja: 'セロリ', ar: 'كرفس', ca: 'Api', va: 'Api', eu: 'Ziazerba', gl: 'Apio'
    }
  },
  mostaza: {
    icon: '🌭',
    translations: {
      es: 'Mostaza', en: 'Mustard', fr: 'Moutarde', de: 'Senf', zh: '芥末', ko: '겨자',
      uk: 'Гірчиця', pt: 'Mostarda', ja: 'マスタード', ar: 'خردل', ca: 'Mostassa', va: 'Mostassa', eu: 'Mostaza', gl: 'Mostarda'
    }
  },
  sesamo: {
    icon: '🥯',
    translations: {
      es: 'Sésamo', en: 'Sesame seeds', fr: 'Graines de sésame', de: 'Sesamsamen', zh: '芝麻', ko: '참깨',
      uk: 'Кунжут', pt: 'Sementes de sésamo', ja: 'ごま', ar: 'سمسم', ca: 'Sèsam', va: 'Sèsam', eu: 'Sesamoa', gl: 'Sésamo'
    }
  },
  sulfitos: {
    icon: '🍷',
    translations: {
      es: 'Sulfitos', en: 'Sulphites', fr: 'Sulfites', de: 'Sulfite', zh: '亚硫酸盐', ko: '아황산염',
      uk: 'Сульфіти', pt: 'Sulfitos', ja: '亜硫酸塩', ar: 'كبريتات', ca: 'Sulfits', va: 'Sulfits', eu: 'Sulfitoak', gl: 'Sulfitos'
    }
  },
  altramuces: {
    icon: '🌾',
    translations: {
      es: 'Altramuces', en: 'Lupin', fr: 'Lupin', de: 'Lupinen', zh: '羽扇豆', ko: '루핀',
      uk: 'Люпин', pt: 'Tremoço', ja: 'ルピナス', ar: 'ترمس', ca: 'Llobí', va: 'Llobins', eu: 'Lupinuak', gl: 'Tremoce'
    }
  },
  moluscos: {
    icon: '🦪',
    translations: {
      es: 'Moluscos', en: 'Molluscs', fr: 'Mollusques', de: 'Weichtiere', zh: '软体动物', ko: '연체동물',
      uk: 'Молюски', pt: 'Moluscos', ja: '軟体動物', ar: 'رخويات', ca: 'Mol·luscs', va: 'Mol·luscs', eu: 'Moluskuak', gl: 'Moluscos'
    }
  }
};

export function getCanonicalAllergenKey(allergenName: string): string {
  const norm = (allergenName || '').toLowerCase().trim();
  if (norm.includes('gluten') || norm.includes('trigo') || norm.includes('wheat') || norm.includes('blé') || norm.includes('weizen')) return 'gluten';
  if (norm.includes('crustác') || norm.includes('crustac') || norm.includes('shrimp') || norm.includes('crevette') || norm.includes('gamba')) return 'crustaceos';
  if (norm.includes('huevo') || norm.includes('egg') || norm.includes('oeuf') || norm.includes('eier') || norm.includes('ou')) return 'huevos';
  if (norm.includes('pescad') || norm.includes('fish') || norm.includes('poisson') || norm.includes('fisch') || norm.includes('peix')) return 'pescado';
  if (norm.includes('cacahuet') || norm.includes('peanut') || norm.includes('arachid') || norm.includes('erdnuss') || norm.includes('cacauet')) return 'cacahuetes';
  if (norm.includes('soja') || norm.includes('soy') || norm.includes('soia')) return 'soja';
  if (norm.includes('lácte') || norm.includes('lacte') || norm.includes('leche') || norm.includes('milk') || norm.includes('dairy') || norm.includes('lait') || norm.includes('llet')) return 'lacteos';
  if (norm.includes('cáscara') || norm.includes('cascara') || norm.includes('nut') || norm.includes('noix') || norm.includes('nüsse') || norm.includes('closca')) return 'frutos_de_cascara';
  if (norm.includes('apio') || norm.includes('celery') || norm.includes('céleri') || norm.includes('sellerie') || norm.includes('api')) return 'apio';
  if (norm.includes('mostaza') || norm.includes('mustard') || norm.includes('moutarde') || norm.includes('senf') || norm.includes('mostassa')) return 'mostaza';
  if (norm.includes('sésamo') || norm.includes('sesamo') || norm.includes('sesame') || norm.includes('sèsam')) return 'sesamo';
  if (norm.includes('sulfit') || norm.includes('sulphit')) return 'sulfitos';
  if (norm.includes('altramuz') || norm.includes('altramuces') || norm.includes('lupin') || norm.includes('tremoço') || norm.includes('llobí')) return 'altramuces';
  if (norm.includes('molusc') || norm.includes('mollusc') || norm.includes('mollusk') || norm.includes('weichtier')) return 'moluscos';
  return '';
}

export function getLocalizedAllergenDisplay(rawAllergen: string, lang: string = 'es'): { name: string; icon: string } {
  const key = getCanonicalAllergenKey(rawAllergen);
  if (key && OFFICIAL_ALLERGENS_I18N[key]) {
    const item = OFFICIAL_ALLERGENS_I18N[key];
    const name = item.translations[lang] || item.translations['es'] || rawAllergen;
    return { name, icon: item.icon };
  }
  return { name: rawAllergen, icon: '⚠️' };
}

export function getTranslatedRole(role: UserRole | string, currentLanguage: string = 'es', t?: any): string {
  const curT = t || translations[currentLanguage] || translations['es'];
  const r = (role || '').toString().trim();
  const rLower = r.toLowerCase();

  const matchedRole = availableStaffRoles.find(
    sr => sr.id.toLowerCase() === rLower || sr.name.toLowerCase() === rLower
  );
  if (matchedRole) {
    const translatedName = matchedRole.translations?.[currentLanguage] || matchedRole.name;
    return `${matchedRole.icon ? matchedRole.icon + ' ' : ''}${translatedName}`;
  }

  if (rLower === 'waiter' || rLower === 'camarero') return curT.roleWaiter || 'Camarero';
  if (rLower === 'chef' || rLower === 'cocinero') return curT.roleChef || 'Cocinero';
  if (rLower === 'manager' || rLower === 'gerente') return curT.roleManager || 'Gerente';
  if (rLower === 'customer' || rLower === 'cliente' || rLower === 'comensal') return curT.roleCustomer || 'Cliente';
  return role;
}

export function formatTableDisplay(tableStr: string, currentLanguage: string = 'es', t?: any): string {
  const curT = t || translations[currentLanguage] || translations['es'];
  const prefix = curT.tablePrefix || 'Mesa';
  return (tableStr || '').replace(/^Mesa\s*/i, `${prefix} `);
}
