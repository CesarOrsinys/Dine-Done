import restaurantConfig from '../../../mock_data/restaurant_config.json' with { type: 'json' };

/**
 * Branding Service
 * Decouples business name, taglines, and footers from restaurant configuration.
 */
export function applyBusinessBranding() {
  document.title = `${restaurantConfig.businessName} | ${restaurantConfig.tagline}`;
  
  const titleEl = document.getElementById('brand-header-title');
  if (titleEl) {
    const parts = restaurantConfig.businessName.split(' ');
    if (parts.length > 1) {
      const last = parts.pop();
      titleEl.innerHTML = `${parts.join(' ')} <span>${last}</span>`;
    } else {
      titleEl.innerHTML = `<span>${restaurantConfig.businessName}</span>`;
    }
  }

  const tagEl = document.getElementById('brand-header-tagline');
  if (tagEl) {
    tagEl.innerText = `${restaurantConfig.tagline} • ${restaurantConfig.address}`;
  }

  // Footer branding
  const footerNameEl = document.getElementById('footer-restaurant-name');
  if (footerNameEl) footerNameEl.innerText = restaurantConfig.businessName;

  const footerDescEl = document.getElementById('footer-restaurant-desc');
  if (footerDescEl) footerDescEl.innerText = `${restaurantConfig.tagline} • ${restaurantConfig.address}`;
}
