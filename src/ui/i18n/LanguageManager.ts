import restaurantConfig from '../../../mock_data/restaurant_config.json' with { type: 'json' };
import translationsData from '../../../mock_data/translations.json' with { type: 'json' };
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { renderFlagHtml } from '../../core/flags.js';
import { AppState } from '../state/AppState.js';
import { renderModalAllergensGrid } from './AllergenHelper.js';
import { updateCartUI } from '../components/CartComponent.js';
import { updateTableUI } from '../components/TableComponent.js';
import { renderMenu } from '../components/MenuComponent.js';
import { renderWaiterOrders } from '../components/WaiterBoardComponent.js';
import { renderChefOrders } from '../components/KitchenKdsComponent.js';
import { renderManagerDashboard } from '../components/ManagerDashboardComponent.js';

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

export function updateRoleSelectorOptions(selectedRole?: string) {
  const select = document.getElementById('new-user-role') as HTMLSelectElement;
  if (!select) return;
  const curVal = selectedRole || select.value;
  select.innerHTML = '';

  availableStaffRoles.forEach(role => {
    const opt = document.createElement('option');
    opt.value = role.id;
    const name = role.translations?.[AppState.currentLanguage] || role.name;
    opt.textContent = `${role.icon ? role.icon + ' ' : ''}${name}`;
    if (role.id === curVal || role.name === curVal) opt.selected = true;
    select.appendChild(opt);
  });
}

export async function createNewStaffRole(spanishName: string, icon: string = '💼', baseRole: string = 'WAITER'): Promise<StaffRoleConfig> {
  const cleanName = spanishName.trim();
  const id = cleanName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  const allLangs = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
  const translationsMap: Record<string, string> = { es: cleanName };

  for (const lang of allLangs) {
    if (lang === 'es') continue;
    try {
      const translated = await translateTextOnline(cleanName, lang);
      translationsMap[lang] = translated || cleanName;
    } catch {
      translationsMap[lang] = cleanName;
    }
  }

  const newRoleConfig: StaffRoleConfig = {
    id,
    name: cleanName,
    icon: icon.trim() || '💼',
    baseRole,
    translations: translationsMap
  };

  availableStaffRoles.push(newRoleConfig);

  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('DND_CUSTOM_ROLES');
      const customList: StaffRoleConfig[] = stored ? JSON.parse(stored) : [];
      customList.push(newRoleConfig);
      localStorage.setItem('DND_CUSTOM_ROLES', JSON.stringify(customList));
    } catch (e) {
      console.error('Error saving custom role:', e);
    }
  }

  updateRoleSelectorOptions(newRoleConfig.id);
  return newRoleConfig;
}

export function getAvailableMenuLanguages(): string[] {
  if (!AppState.menuCatalog || AppState.menuCatalog.length === 0) return ['es'];

  const available: string[] = ['es'];
  const allKnownLanguages = Object.keys(translations);

  for (const lang of allKnownLanguages) {
    if (lang === 'es') continue;
    const isAvailableInMenu = AppState.menuCatalog.every(item => {
      const itemTrans = item.translations?.[lang];
      return itemTrans && itemTrans.name && itemTrans.name.trim().length > 0;
    });

    if (isAvailableInMenu) {
      available.push(lang);
    }
  }

  return available;
}

export function closeLanguageDropdown() {
  const container = document.getElementById('custom-lang-selector');
  const btn = document.getElementById('lang-select-btn');
  if (container) container.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

export function updateLanguageSelectorOptions() {
  const langSelector = document.getElementById('lang-selector') as HTMLSelectElement;
  const customPanel = document.getElementById('lang-dropdown-panel');
  const btnFlag = document.getElementById('lang-btn-flag');
  const btnCode = document.getElementById('lang-btn-code');

  const availableLangs = getAvailableMenuLanguages();

  if (!availableLangs.includes(AppState.currentLanguage)) {
    AppState.currentLanguage = 'es';
  }

  if (langSelector) {
    langSelector.innerHTML = '';
    availableLangs.forEach(lang => {
      const meta = LANGUAGE_META[lang] || { flag: '🌐', label: lang.toUpperCase(), name: lang.toUpperCase() };
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = meta.flag ? `${meta.flag} ${meta.label}` : `${meta.label} (${meta.name})`;
      opt.title = meta.name;
      if (lang === AppState.currentLanguage) {
        opt.selected = true;
      }
      langSelector.appendChild(opt);
    });
    langSelector.value = AppState.currentLanguage;
  }

  if (customPanel) {
    customPanel.innerHTML = '';
    availableLangs.forEach(lang => {
      const meta = LANGUAGE_META[lang] || { flag: '🌐', label: lang.toUpperCase(), name: lang.toUpperCase() };
      const item = document.createElement('div');
      item.className = `lang-dropdown-item ${lang === AppState.currentLanguage ? 'active' : ''}`;
      item.setAttribute('role', 'option');
      item.setAttribute('data-lang', lang);
      item.setAttribute('aria-selected', lang === AppState.currentLanguage ? 'true' : 'false');
      item.innerHTML = `
        <span class="lang-item-flag">${renderFlagHtml(lang)}</span>
        <span class="lang-item-name">${meta.name}</span>
        <span class="lang-item-code">${meta.label}</span>
      `;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        setLanguage(lang);
        closeLanguageDropdown();
      });
      customPanel.appendChild(item);
    });
  }

  const currentMeta = LANGUAGE_META[AppState.currentLanguage] || { label: AppState.currentLanguage.toUpperCase(), name: AppState.currentLanguage };
  if (btnFlag) btnFlag.innerHTML = renderFlagHtml(AppState.currentLanguage);
  if (btnCode) btnCode.textContent = currentMeta.label;
}

export function setupLanguageSelector() {
  const langSelector = document.getElementById('lang-selector') as HTMLSelectElement;
  const langBtn = document.getElementById('lang-select-btn');
  const customSelector = document.getElementById('custom-lang-selector');

  if (langBtn && customSelector) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = customSelector.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!customSelector.contains(e.target as Node)) {
        closeLanguageDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLanguageDropdown();
      }
    });
  }

  if (langSelector) {
    langSelector.addEventListener('change', () => {
      setLanguage(langSelector.value);
    });
  }

  updateLanguageSelectorOptions();
  setLanguage(AppState.currentLanguage);
}

export function setLanguage(lang: string) {
  const availableLangs = getAvailableMenuLanguages();
  if (!availableLangs.includes(lang)) {
    lang = 'es';
  }
  AppState.currentLanguage = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('DND_SELECTED_LANG', lang);
  }

  const btnFlag = document.getElementById('lang-btn-flag');
  const btnCode = document.getElementById('lang-btn-code');
  const currentMeta = LANGUAGE_META[AppState.currentLanguage] || { label: AppState.currentLanguage.toUpperCase(), name: AppState.currentLanguage };
  if (btnFlag) btnFlag.innerHTML = renderFlagHtml(AppState.currentLanguage);
  if (btnCode) btnCode.textContent = currentMeta.label;

  const customPanel = document.getElementById('lang-dropdown-panel');
  if (customPanel) {
    customPanel.querySelectorAll('.lang-dropdown-item').forEach(el => {
      const itemLang = el.getAttribute('data-lang');
      if (itemLang === AppState.currentLanguage) {
        el.classList.add('active');
        el.setAttribute('aria-selected', 'true');
      } else {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
      }
    });
  }

  const langSelector = document.getElementById('lang-selector') as HTMLSelectElement;
  if (langSelector && langSelector.value !== AppState.currentLanguage) {
    langSelector.value = AppState.currentLanguage;
  }

  document.documentElement.lang = lang;
  if (lang === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }

  const t = translations[lang] || translations['es'];

  const elMap: Record<string, string> = {
    'txt-menu-title': t.menuTitle,
    'txt-menu-sub': t.menuSubtitle,
    'pill-cat-all': t.allDishes,
    'pill-cat-starter': t.starters,
    'pill-cat-main': t.mains,
    'pill-cat-dessert': t.desserts,
    'pill-cat-beverage': t.beverages,
    'txt-table-title': t.tableIdentification,
    'txt-cart-title': t.yourOrder,
    'txt-cart-empty': t.emptyCart,
    'txt-cart-table-label': t.tableAssigned,
    'txt-pack-title': t.servicePackaging,
    'txt-pack-law': `⚖️ ${t.packagingLawNote}`,
    'txt-pack-bags': t.bagOption,
    'txt-pack-plastic': t.plasticOption,
    'txt-tip-label': t.tipSection,
    'txt-tip-note': t.tipNote || '100% íntegro para el equipo de sala',
    'txt-pay-label': t.paymentMethod,
    'txt-bill-subtotal-label': t.subtotalDishes,
    'txt-bill-vat-label': t.vatLabel || 'IVA (21%):',
    'txt-bill-pack-label': t.packagingTotal,
    'txt-bill-tip-label': t.tipAmount,
    'txt-bill-total-label': t.totalToPay,
    'txt-btn-place-order': t.confirmOrder,
    'txt-modal-title': t.loginModalTitle,
    'txt-modal-desc': t.loginModalDesc,
    'lbl-login-user': t.lblLoginUser || 'Usuario o Email:',
    'lbl-login-pass': t.lblLoginPass || 'Contraseña:',
    'btn-login-submit-text': t.loginSubmit || '🔐 Iniciar Sesión',
    'footer-legal-notice': t.footerNotice,
    'footer-rights': t.footerRights,
    'footer-link-terms': t.terms,
    'footer-link-privacy': t.privacy,
    'footer-link-cookies': t.cookies,
    'footer-link-legal': t.legalNotice,
    'footer-col-restaurant': t.footerColRestaurant,
    'th-top-qty': t.thOrderedQty || 'Uds. Pedidas',
    'th-top-revenue': t.thTotalRevenue || 'Total Recaudado',
    'txt-stock-section-title': t.managerStockTitle || '📦 Control de Carta, Precios y Stock',
    'txt-stock-section-sub': t.managerStockSub || 'Modifica precios, stock o edita alérgenos y traducciones en tiempo real.',
    'th-stock-prod': t.thProduct || 'Producto',
    'th-stock-cat': t.thCategory || 'Categoría',
    'th-stock-price': t.thPrice || 'Precio (€)',
    'th-stock-qty': t.thStock || 'Stock Actual',
    'th-stock-actions': t.thActions || 'Acciones',
    'txt-users-section-title': t.managerUsersTitle || '👥 Control de Usuarios y Personal',
    'txt-receipt-label': t.receiptSelectionLabel || 'Tipo de Comprobante:',
    'txt-btn-type-ticket': t.btnSelectTicket || '🧾 Ticket de Pago',
    'txt-btn-type-invoice': t.btnSelectInvoice || '📑 Solicitar Factura',
    'txt-inv-title': t.fiscalDataTitle || '📋 Datos Fiscales para Factura (Empresas / Autónomos)',
    'txt-mobile-cart-label': t.cartTitleShort || 'Tu Pedido',
    'opt-theme-dark': t.themeDark || '🌑 Modo Oscuro',
    'opt-theme-light': t.themeLight || '☀️ Modo Claro',
    'opt-theme-food': t.themeFood || '🍔 Foodie Warm',
    'opt-theme-retro': t.themeRetro || '📻 Retro Bistro',
    'opt-theme-pastel': t.themePastel || '🧁 Pastel Café',
    'txt-demo-creds-title': t.demoCredsTitle || 'Credenciales de Demostración:',
    'txt-demo-waiter-label': t.demoWaiterLabel || 'Camarero:',
    'txt-demo-chef-label': t.demoChefLabel || 'Cocinero:',
    'txt-demo-manager-label': t.demoManagerLabel || 'Gerente:',
    'lbl-new-user-name': t.lblFullName || 'Nombre Completo del Empleado:',
    'lbl-new-user-username': t.lblUsername || 'Nombre de Usuario (Login):',
    'lbl-new-user-email': t.lblEmail || 'Correo Electrónico Corporativo:',
    'lbl-new-user-role': t.lblStaffRole || 'Cargo / Rol en el Restaurante:',
    'txt-btn-create-role': t.btnCreateRole || 'Nuevo Rol',
    'txt-btn-create-role-manager': t.btnCreateRole || 'Nuevo Rol',
    'lbl-new-user-avatar': t.lblAvatarUrl || 'URL Foto de Perfil (Opcional):',
    'lbl-edit-user-active': t.lblActiveEmployee || 'Empleado Activo (Permite Iniciar Sesión)',
    'txt-btn-cancel-add-user': t.btnCancel || 'Cancelar',
    'txt-create-role-title': t.modalCreateRoleTitle || '🎭 Crear Nuevo Rol de Personal',
    'txt-create-role-sub': t.modalCreateRoleSub || 'Define el rol en español y se traducirá automáticamente a los 14 idiomas con IA.',
    'lbl-role-name-es': t.lblRoleNameEs || 'Nombre del Rol (en Español):',
    'lbl-role-icon': t.lblRoleIcon || 'Icono / Emoji:',
    'lbl-role-base-perm': t.lblRoleBasePermission || 'Perfil de Permiso / Acceso:',
    'opt-perm-waiter': t.optPermWaiter || '🏃 Servicio de Sala / Barra (Camarero)',
    'opt-perm-chef': t.optPermChef || '👨‍🍳 Cocina / Elaboración (KDS)',
    'opt-perm-manager': t.optPermManager || '📊 Administración / Dirección (Gerente)',
    'txt-btn-cancel-create-role': t.btnCancel || 'Cancelar',
    'txt-btn-submit-create-role': t.btnSaveRole || '✨ Traducir y Guardar Rol',
    'lbl-new-product-name': t.lblDishName || 'Nombre del Plato (en Español):',
    'lbl-new-product-desc': t.lblDishDesc || 'Descripción Detallada:',
    'txt-btn-auto-translate': t.btnAutoTranslate || '✨ Traducir Automáticamente a 14 Idiomas',
    'summary-details-translations': t.summaryTranslations || '🌐 Ver / Editar Traducciones en los 14 Idiomas (Opcional)',
    'lbl-new-product-category': t.lblDishCategory || 'Categoría del Menú:',
    'opt-cat-starter': `🥗 ${t.starters || 'Entrante'}`,
    'opt-cat-main': `🥩 ${t.mains || 'Plato Principal'}`,
    'opt-cat-dessert': `🍰 ${t.desserts || 'Postre'}`,
    'opt-cat-beverage': `🍷 ${t.beverages || 'Bebida'}`,
    'opt-cat-side': `🍟 ${t.catSide || 'Guarnición'}`,
    'lbl-new-product-price': t.lblDishPrice || 'Precio de Venta (€):',
    'lbl-new-product-stock': t.lblDishStock || 'Stock Inicial Disponible:',
    'lbl-new-product-cooking': t.lblRequiresCooking || 'Requiere Cocción / Elaboración en Cocina (KDS)',
    'lbl-product-images-title': t.lblProductImagesTitle || '🖼️ Fotografía del Plato Multi-Dispositivo',
    'lbl-product-images-sub': t.lblProductImagesSub || 'Sube un archivo o proporciona URL optimizada para móvil, tablet y escritorio.',
    'lbl-new-product-file': t.lblUploadFile || 'Subir Archivo de Imagen desde este equipo:',
    'lbl-new-product-image-url': t.lblDirectUrl || 'O ingresa URL Directa de Imagen Principal:',
    'summary-per-device-images': t.summaryPerDevice || '📐 URLs Personalizadas por Dispositivo (Móvil / Tablet / Escritorio)',
    'lbl-new-product-img-thumb': t.lblDeviceMobileThumb || 'Móvil (Miniatura 240x240):',
    'lbl-new-product-img-medium': t.lblDeviceMedium || 'Tablet (Media 600x380):',
    'lbl-new-product-img-large': t.lblDeviceLarge || 'Escritorio (Grande 900x550):',
    'lbl-dietary-props-title': t.lblDietaryPropsTitle || 'Propiedades Dietéticas Especiales:',
    'txt-prop-vegan': `🌱 ${t.txtPropVegan || t.propVegan || 'Vegano'}`,
    'txt-prop-veg': `🧀 ${t.txtPropVeg || t.propVegetarian || 'Vegetariano'}`,
    'txt-prop-0alc': `💧 ${t.txtProp0alc || t.propAlcoholFree || '0,0% Sin Alcohol'}`,
    'lbl-allergens-title': t.lblAllergensTitle || 'Ficha de Alérgenos (Reglamento UE 1169/2011):',
    'txt-btn-cancel-add-product': t.btnCancel || 'Cancelar',
    'txt-conf-title': t.orderConfirmedTitle || '¡Pedido Confirmado!',
    'txt-conf-sub': t.orderConfirmedSub || 'Comanda enviada a sala y cocina',
    'txt-conf-order-num-label': t.lblOrderNumber || 'Número de Comanda',
    'txt-conf-table-label': t.lblTable || 'Mesa',
    'txt-conf-receipt-label': t.lblReceiptType || 'Comprobante',
    'txt-conf-items-title': t.lblRequestedProducts || '📋 Productos Solicitados:',
    'txt-conf-inv-title': t.lblFiscalInvoiceIssued || '📑 Factura Fiscal Emitida',
    'txt-conf-inv-nif-lbl': `${(t.lblTaxId || 'NIF/CIF').replace(/:+$/, '')}:`,
    'txt-conf-inv-name-lbl': `${(t.lblLegalName || 'Razón Social').replace(/:+$/, '')}:`,
    'txt-conf-inv-address-lbl': `${(t.lblFiscalAddress || 'Dirección').replace(/:+$/, '')}:`,
    'txt-conf-inv-email-lbl': `${(t.lblFiscalEmail || 'Email').replace(/:+$/, '')}:`,
    'txt-conf-net-label': `${(t.lblNetBase || 'Base Imponible (sin IVA)').replace(/:+$/, '')}:`,
    'txt-conf-vat-label': `${(t.lblVat21 || 'IVA (21%)').replace(/:+$/, '')}:`,
    'txt-conf-pack-label': `${(t.lblPackagingFees || 'Empaque y bolsas (Ley 7/2022)').replace(/:+$/, '')}:`,
    'txt-conf-tip-label': `${(t.lblTip || 'Propina').replace(/:+$/, '')}:`,
    'txt-conf-total-label': `${(t.lblTotal || 'Total').replace(/:+$/, '')}:`,
    'txt-btn-print-receipt': t.btnPrint || '🖨️ Imprimir',
    'txt-btn-download-receipt': t.btnDownload || '📥 Descargar',
    'txt-btn-dismiss-confirmed-modal': t.btnAccept || 'Aceptar',
    'txt-notes-disclaimer-content': t.notesPolicyDisclaimer || 'Aviso sobre notas de cocina: Las peticiones especiales son solicitudes. Si implican costes adicionales o resultan inviables, el producto se elaborará según su receta estándar sin modificaciones.',
    'txt-btn-manage-roles': t.btnManageRoles || 'Gestionar Roles',
    'txt-manage-roles-title': t.modalManageRolesTitle || '🎭 Gestionar Roles de Personal',
    'txt-manage-roles-sub': t.modalManageRolesSub || 'Visualiza, edita o elimina los roles configurados en el restaurante.',
    'txt-btn-dismiss-manage-roles': t.btnClose || 'Cerrar',
    'txt-btn-create-role-inner': t.btnCreateRole || 'Crear Nuevo Rol',
    'txt-btn-delete-user': t.btnDeleteUser || '🗑️ Eliminar'
  };

  for (const [id, val] of Object.entries(elMap)) {
    const el = document.getElementById(id);
    if (el && val) el.innerHTML = val;
  }

  const phMap: Record<string, string> = {
    'login-username': t.phLoginUser || 'p. ej. david.garcia',
    'login-password': t.phLoginPass || '••••••••',
    'inv-nif': t.phNif || 'B-12345678',
    'inv-name': t.phLegalName || 'Nombre de Empresa S.L.',
    'inv-address': t.phFiscalAddress || 'Calle Mayor 12, Madrid',
    'inv-email': t.phFiscalEmail || 'facturacion@empresa.com',
    'new-user-name': t.phFullName || 'p. ej. Carlos Martínez',
    'new-user-username': t.phUsername || 'p. ej. carlos.m',
    'new-user-email': t.phEmail || 'carlos@restaurante.es',
    'new-user-avatar': t.phAvatarUrl || 'https://images.unsplash.com/...',
    'new-role-name': t.phRoleNameEs || 'p. ej. Maître, Sommelier, Barista, Pizzero',
    'new-product-name': t.phDishName || 'p. ej. Tacos de Pastor Especiales',
    'new-product-desc': t.phDishDesc || 'Descripción con ingredientes frescos...',
    'new-product-image-url': t.phDirectUrl || 'https://...',
    'new-product-img-thumb': t.phDeviceMobileThumb || 'https://...',
    'new-product-img-medium': t.phDeviceMedium || 'https://...',
    'new-product-img-large': t.phDeviceLarge || 'https://...'
  };
  for (const [id, val] of Object.entries(phMap)) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
    if (el && val) el.placeholder = val;
  }

  const themeSelector = document.getElementById('theme-selector');
  if (themeSelector) {
    themeSelector.setAttribute('title', t.themeSelectorTitle || 'Tema Visual');
  }

  const btnAddProd = document.getElementById('btn-open-add-product');
  if (btnAddProd) {
    btnAddProd.setAttribute('title', t.btnAddProduct || 'Añadir Producto');
    btnAddProd.setAttribute('aria-label', t.btnAddProduct || 'Añadir Producto');
  }
  const btnAddUser = document.getElementById('btn-open-add-user');
  if (btnAddUser) {
    btnAddUser.setAttribute('title', t.btnAddUser || 'Añadir Usuario');
    btnAddUser.setAttribute('aria-label', t.btnAddUser || 'Añadir Usuario');
  }

  const btnEditTable = document.getElementById('btn-toggle-edit-table');
  if (btnEditTable) {
    const isEditing = (document.getElementById('quick-table-select')?.style.display !== 'none');
    btnEditTable.innerText = isEditing ? t.save : t.changeTable;
  }

  const badgeEl = document.getElementById('table-detection-badge');
  if (badgeEl) {
    const origin = badgeEl.getAttribute('data-origin') || 'url';
    if (origin === 'url') badgeEl.innerText = t.detectedTable || 'Detectada por URL';
    else if (origin === 'storage') badgeEl.innerText = t.rememberedTable || 'Mesa Recordada';
    else if (origin === 'manual') badgeEl.innerText = t.manualTable || 'Configurada Manualmente';
    else badgeEl.innerText = t.defaultTable || 'Mesa por Defecto';
  }

  const btnVegan = document.getElementById('btn-filter-vegan');
  if (btnVegan) btnVegan.innerHTML = `<span>${t.filterVegan}</span>`;

  const btnVeg = document.getElementById('btn-filter-vegetarian');
  if (btnVeg) btnVeg.innerHTML = `<span>${t.filterVegetarian}</span>`;

  const btnNoAlc = document.getElementById('btn-filter-noalcohol');
  if (btnNoAlc) btnNoAlc.innerHTML = `<span>${t.filterNoAlcohol}</span>`;

  const allergenSelect = document.getElementById('allergen-filter-select') as HTMLSelectElement;
  if (allergenSelect) {
    const currentVal = allergenSelect.value;
    const allergenOptions = [
      { val: 'ALL', text: t.allAllergens || '⚠️ Todos los alérgenos permitidos' },
      { val: 'Sin Gluten', text: t.noGluten || '🌾 Excluir Gluten' },
      { val: 'Sin Lácteos', text: t.noDairy || '🥛 Excluir Lácteos' },
      { val: 'Sin Huevos', text: t.noEggs || '🥚 Excluir Huevos' },
      { val: 'Sin Pescado', text: t.noFish || '🐟 Excluir Pescado' },
      { val: 'Sin Frutos de cáscara', text: t.noNuts || '🥜 Excluir Frutos de cáscara' },
      { val: 'Sin Sulfitos', text: t.noSulphites || '🍷 Excluir Sulfitos' }
    ];
    allergenSelect.innerHTML = '';
    allergenOptions.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.val;
      optionEl.textContent = opt.text;
      if (opt.val === currentVal) optionEl.selected = true;
      allergenSelect.appendChild(optionEl);
    });
  }

  const cutleryLabel = document.getElementById('txt-pack-cutlery');
  if (cutleryLabel) cutleryLabel.innerText = `${t.cutleryOption}:`;

  const btnStaffLogin = document.getElementById('btn-staff-login');
  if (btnStaffLogin) btnStaffLogin.innerHTML = `<span>${t.staffLogin}</span>`;

  const btnStaffLogout = document.getElementById('btn-staff-logout');
  if (btnStaffLogout) btnStaffLogout.innerHTML = `<span>${t.staffLogout}</span>`;

  const btnRoleWaiter = document.querySelector('.role-btn.role-waiter');
  if (btnRoleWaiter) btnRoleWaiter.innerHTML = `<span>🏃 ${t.roleWaiter}</span>`;
  const btnRoleChef = document.querySelector('.role-btn.role-chef');
  if (btnRoleChef) btnRoleChef.innerHTML = `<span>👨‍🍳 ${t.roleChef}</span>`;
  const btnRoleManager = document.querySelector('.role-btn.role-manager');
  if (btnRoleManager) btnRoleManager.innerHTML = `<span>📊 ${t.roleManager}</span>`;

  const btnPayStripe = document.getElementById('btn-pay-stripe');
  if (btnPayStripe) {
    btnPayStripe.innerHTML = `<span id="txt-pay-stripe">${t.payCard}</span><small id="txt-pay-stripe-sub" style="font-size:0.7rem; color:var(--text-dim);">${t.payCardSub || 'Stripe'}</small>`;
  }
  const btnPayCash = document.getElementById('btn-pay-cash');
  if (btnPayCash) {
    btnPayCash.innerHTML = `<span id="txt-pay-cash">${t.payCash}</span><small id="txt-pay-cash-sub" style="font-size:0.7rem; color:var(--text-dim);">${t.payAtTable || 'Pagar en mesa'}</small>`;
  }

  updateRoleSelectorOptions();
  renderModalAllergensGrid();

  if (langSelector && langSelector.value !== lang) {
    langSelector.value = lang;
  }

  if (AppState.currentUser.role === UserRole.CUSTOMER) {
    renderMenu();
  } else if (AppState.currentUser.role === UserRole.WAITER) {
    renderWaiterOrders();
  } else if (AppState.currentUser.role === UserRole.CHEF) {
    renderChefOrders();
  } else if (AppState.currentUser.role === UserRole.MANAGER) {
    renderManagerDashboard();
  }
  updateCartUI();
  updateTableUI();
}
