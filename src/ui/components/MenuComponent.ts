import { MenuItem } from '../../core/domain/entities/MenuItem.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { AppState } from '../state/AppState.js';
import { translations } from '../i18n/LanguageManager.js';
import { getAllergenIcon } from '../i18n/AllergenHelper.js';
import { addToCart } from './CartComponent.js';
import { openProductEditorModal } from './ManagerDashboardComponent.js';

export function getResponsiveImages(item: MenuItem): { thumbnail: string; medium: string; large: string } {
  if (item.images?.thumbnail && item.images?.medium && item.images?.large) {
    return item.images;
  }
  const base = item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
  const clean = base.split('?')[0];
  return {
    thumbnail: `${clean}?w=240&h=240&fit=crop&q=80`,
    medium: `${clean}?w=600&h=380&fit=crop&q=80`,
    large: `${clean}?w=900&h=550&fit=crop&q=85`
  };
}

export function setupCategoryFilters() {
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      AppState.currentCategoryFilter = pill.getAttribute('data-cat') || 'ALL';
      renderMenu();
    });
  });
}

export function setupDietaryAndAllergenFilters() {
  const btnVegan = document.getElementById('btn-filter-vegan');
  btnVegan?.addEventListener('click', () => {
    AppState.isFilterVegan = !AppState.isFilterVegan;
    btnVegan.classList.toggle('active-vegan', AppState.isFilterVegan);
    renderMenu();
  });

  const btnVeg = document.getElementById('btn-filter-vegetarian');
  btnVeg?.addEventListener('click', () => {
    AppState.isFilterVegetarian = !AppState.isFilterVegetarian;
    btnVeg.classList.toggle('active-veg', AppState.isFilterVegetarian);
    renderMenu();
  });

  const btnNoAlc = document.getElementById('btn-filter-noalcohol');
  btnNoAlc?.addEventListener('click', () => {
    AppState.isFilterNoAlcohol = !AppState.isFilterNoAlcohol;
    btnNoAlc.classList.toggle('active-noalc', AppState.isFilterNoAlcohol);
    renderMenu();
  });

  const allergenSelect = document.getElementById('allergen-filter-select') as HTMLSelectElement;
  allergenSelect?.addEventListener('change', () => {
    AppState.selectedAllergenToExclude = allergenSelect.value;
    renderMenu();
  });

  // View Mode switcher
  const btnCompact = document.getElementById('btn-view-compact');
  const btnGrid = document.getElementById('btn-view-grid');

  btnCompact?.addEventListener('click', () => {
    AppState.currentViewMode = 'compact';
    renderMenu();
  });

  btnGrid?.addEventListener('click', () => {
    AppState.currentViewMode = 'grid';
    renderMenu();
  });
}

export function renderMenu() {
  const menuCardsContainer = document.getElementById('menu-cards-container');
  if (!menuCardsContainer) return;

  menuCardsContainer.innerHTML = '';
  
  if (AppState.currentViewMode === 'compact') {
    menuCardsContainer.classList.add('compact-view');
    menuCardsContainer.classList.remove('grid-view');
  } else {
    menuCardsContainer.classList.add('grid-view');
    menuCardsContainer.classList.remove('compact-view');
  }

  const btnCompact = document.getElementById('btn-view-compact');
  const btnGrid = document.getElementById('btn-view-grid');
  if (btnCompact && btnGrid) {
    btnCompact.classList.toggle('active', AppState.currentViewMode === 'compact');
    btnGrid.classList.toggle('active', AppState.currentViewMode === 'grid');
  }

  let filtered = AppState.currentCategoryFilter === 'ALL'
    ? AppState.menuCatalog
    : AppState.menuCatalog.filter(m => m.category === AppState.currentCategoryFilter);

  // Apply Dietary Filters
  if (AppState.isFilterVegan) {
    filtered = filtered.filter(m => m.isVegan === true);
  }
  if (AppState.isFilterVegetarian) {
    filtered = filtered.filter(m => m.isVegetarian === true || m.isVegan === true);
  }
  if (AppState.isFilterNoAlcohol) {
    filtered = filtered.filter(m => m.isAlcoholFree === true);
  }

  // Apply Allergen Exclusion Filter
  if (AppState.selectedAllergenToExclude !== 'ALL') {
    const allergenExclusionMap: Record<string, string[]> = {
      'Sin Gluten': ['gluten'],
      'Sin Lácteos': ['lácteo', 'lacteo', 'dairy', 'lactose'],
      'Sin Huevos': ['huevo', 'egg', 'oeuf'],
      'Sin Pescado': ['pescado', 'fish', 'poisson'],
      'Sin Frutos de cáscara': ['fruto', 'cáscara', 'nut', 'noix'],
      'Sin Sulfitos': ['sulfito', 'sulphite']
    };

    const targetKeywords = allergenExclusionMap[AppState.selectedAllergenToExclude] || [];
    if (targetKeywords.length > 0) {
      filtered = filtered.filter(m => {
        if (!m.allergens || m.allergens.length === 0) return true;
        const hasExclusion = m.allergens.some(a => 
          targetKeywords.some(kw => a.toLowerCase().includes(kw))
        );
        return !hasExclusion;
      });
    }
  }

  const t = translations[AppState.currentLanguage] || translations['es'];
  const countBadge = document.getElementById('badge-menu-count');
  if (countBadge) countBadge.innerText = `${filtered.length} ${t.items || t.allDishes || 'Platos'}`;

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    const isOutOfStock = item.stock <= 0;

    const trans = (item.translations as any)?.[AppState.currentLanguage];
    const displayName = trans?.name || item.name;
    const displayDesc = trans?.description || item.description;
    const displayIngredients = trans?.ingredients || item.ingredients || [];
    const displayAllergens = trans?.allergens || item.allergens || [];

    const ingLabel = t.ingredientsLabel || 'Ingredientes';
    const ingredientsHtml = displayIngredients.length > 0 ? `
      <div style="font-size:0.77rem; color:var(--text-muted); margin-bottom:8px; line-height:1.4;">
        🌿 <strong>${ingLabel}:</strong> ${displayIngredients.join(', ')}
      </div>
    ` : '';

    const noAllergenLabel = t.allergenFree || 'Libre de alérgenos';
    const allergensHtml = displayAllergens.length > 0 ? `
      <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:12px;">
        ${displayAllergens.map((a: string, idx: number) => {
          const icon = getAllergenIcon(a, item.allergens?.[idx]);
          return `<span class="badge-tag" style="background:rgba(236,72,153,0.15); color:#f472b6; border:1px solid rgba(236,72,153,0.3); font-size:0.67rem;">${icon} ${a}</span>`;
        }).join('')}
      </div>
    ` : `
      <div style="margin-bottom:12px;">
        <span class="badge-tag" style="background:rgba(16,185,129,0.1); color:#34d399; font-size:0.67rem;">✅ ${noAllergenLabel}</span>
      </div>
    `;

    const miniAllergensHtml = displayAllergens.length > 0 ? `
      <div class="menu-mini-allergens">
        ${displayAllergens.map((a: string, idx: number) => {
          const icon = getAllergenIcon(a, item.allergens?.[idx]);
          return `<span class="allergen-mini-icon" title="${a}">${icon}</span>`;
        }).join('')}
      </div>
    ` : `
      <div class="menu-mini-allergens">
        <span class="allergen-mini-pill" title="${noAllergenLabel}">✅ ${noAllergenLabel}</span>
      </div>
    `;

    const cookingLabel = item.requiresCooking ? t.requiresCooking : t.directDelivery;
    const stockLabel = isOutOfStock ? t.outOfStock : `${t.stock}: ${item.stock}`;
    const addBtnText = isOutOfStock ? t.outOfStock : t.addToCart;

    const responsiveImgs = getResponsiveImages(item);

    const isManager = AppState.currentUser.role === UserRole.MANAGER || (AppState.authenticatedStaffUser !== null && AppState.authenticatedStaffUser.role === UserRole.MANAGER);
    const managerEditBtn = isManager ? `
      <button class="btn-manager-edit-dish" data-id="${item.id}" title="Editar plato completo" style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); color:#60a5fa; border-radius:4px; font-size:0.72rem; padding:2px 7px; cursor:pointer; font-weight:700; margin-left:6px; display:inline-flex; align-items:center; gap:3px;">
        ✏️ Editar
      </button>
    ` : '';

    card.innerHTML = `
      <div class="menu-body">
        <div>
          <div class="menu-badge-row">
            <div style="display:flex; align-items:center;">
              <span class="badge-tag ${item.requiresCooking ? 'tag-cooking' : 'tag-direct'}">
                ${cookingLabel}
              </span>
              ${managerEditBtn}
            </div>
            <span class="badge-tag desktop-stock-badge ${isOutOfStock ? 'tag-cooking' : item.stock < 5 ? 'tag-low-stock' : 'tag-stock'}">
              ${stockLabel}
            </span>
          </div>
          <h3 class="menu-title">${displayName}</h3>
          <p class="menu-desc">${displayDesc}</p>
          
          <div class="menu-meta-details">
            ${ingredientsHtml}
            ${allergensHtml}
          </div>
        </div>

        <div class="menu-footer">
          <div class="menu-price-allergens-wrap">
            <span class="menu-price">${item.price.toFixed(2)} €</span>
            ${miniAllergensHtml}
          </div>
          <button class="btn-add desktop-btn-add" data-id="${item.id}" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <span>${addBtnText}</span>
          </button>
        </div>
      </div>

      <div class="menu-side-col">
        <span class="badge-tag mobile-stock-badge ${isOutOfStock ? 'tag-cooking' : item.stock < 5 ? 'tag-low-stock' : 'tag-stock'}">
          ${stockLabel}
        </span>
        <picture class="menu-card-picture">
          <source media="(max-width: 640px)" srcset="${responsiveImgs.thumbnail}">
          <source media="(max-width: 1024px)" srcset="${responsiveImgs.medium}">
          <img src="${responsiveImgs.large}" alt="${displayName}" class="menu-img" loading="lazy" width="300" height="200">
        </picture>
        <button class="btn-add mobile-btn-add" data-id="${item.id}" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          <span>${addBtnText}</span>
        </button>
      </div>
    `;

    card.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart(item);
      });
    });

    card.querySelectorAll('.btn-manager-edit-dish').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProductEditorModal(item);
      });
    });

    menuCardsContainer.appendChild(card);
  });
}
