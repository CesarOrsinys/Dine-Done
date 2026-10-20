---
project_name: "Dine & Done"
version: "0.1.0"
status: "Draft"
created_at: "2026-10-20"
---

# Project Kickoff Requirements: Dine & Done

## 1. Executive Summary
- **Objective:** Aplicación para agilizar y asegurar la gestion de pedidos en los restaurantes
- **Target Audience:** Comensales, Camareros, Cocineros, Gerente

## 2. Business Requirements (Target: @functional)
### 2.1. User Roles
- **Role A:** Comensal - Ver el menu, realizar su pedido, pagar con tarjeta, o marcar pago con efectivo
- **Role B:** Camarero - Ver comandas asignadas y nuevos pedidos y preparar pedidos, o llevar a las mesas
- **Role C:** Cocinero - vera si es necesario cocinar algo para los pedidos
- **Role D:** Gerente - puede ver todos los pedidos, y generar KPI, aparte del stock y generar informes

### 2.2. Core Features (Epics / Funcionalidades Clave)
- **Feature 1:** Ver menu (se puede cargar bolsas, plastico y solicitud de cubiertos) 
- **Feature 2:** Pagar el pedido con una pasarela de pago (stripe) se podra dar propina al servicio
- **Feature 3:** Ver comandas
- **Feature 4:** Ver requerimientos de cocina por pedido
- **Feature 5:** Ver kpi y generar informes
- **Feature 6:** Control de stock 
- **Feature 7:** Control de usuarios
- **Feature 8:** ver el camarero y cocinero asignado a cada pedido
- **Feature 9:** Nombre de la empresa personalizable mediante fichero `.json` de configuración (branding dinámico en interfaz y tickets).
- **Feature 10:** Menú enriquecido y personalizable con nombre, ingredientes (de tenerlos), alérgenos (de tenerlos), precio y stock, gestionado mediante BBDD / repositorio con mock JSON inicial.
- **Feature 11:** Detección inteligente de mesa para comensales: lectura automática por parámetro de URL (ej. `?table=5` o `?mesa=5`) y selección manual interactiva.
- **Feature 12 (Nuevo):** Login de Staff arriba a la derecha para desbloquear vistas de Camarero, Cocinero y Gerente (el comensal no requiere login).
- **Feature 13 (Nuevo):** Filtro de alérgenos para exclusión de ingredientes peligrosos para personas con intolerancias alimentarias.
- **Feature 14 (Nuevo):** Filtros dietéticos específicos: Vegano, Vegetariano y 0% Alcohol.
- **Feature 15 (Nuevo):** Cumplimiento estricto de la normativa española para bolsas y plásticos (R.D. 293/2018 y Ley 7/2022 de residuos): desglose con cobro legal de bolsas y envases de un solo uso.
- **Feature 16 (Nuevo):** Branding desacoplado: Encabezado superior exclusivo del Restaurante; mención a Dine & Done trasladada al Footer completo con redes sociales, cookies, términos y condiciones legales.
- **Feature 17 (Nuevo):** Selector multi-idioma (i18n) arriba a la derecha que traduce toda la web y la carta del restaurante (ES, EN, FR, DE).
- **Feature 18 (Nuevo):** Diseño Mobile-First totalmente responsive: optimizado para pedidos desde smartphones y tablets con barra flotante de comanda (`mobile-cart-bar`), drawer deslizante para el carrito, gestos táctiles horizontales y cabecera adaptable.
- **Feature 19 (Nuevo):** Imágenes multi-dimensión responsivas y modos de vista de carta: `<picture>` con `source` específicos para móvil (thumbnail cuadrado 240x240), tablet (600x380) y desktop (900x550), vista compacta horizontal de plato (diseño moderno tipo delivery app) y conmutador `📱 Compacta` / `🖼️ Galería` sin desbordamiento horizontal.

### 2.3. Business Rules & Edge Cases (Reglas de Negocio)
- [Regla 1: Identificación de mesa] El comensal debe tener siempre una mesa asociada antes de confirmar el pedido, detectada automáticamente por URL o configurada manualmente.
- [Regla 2: Ficha técnica de plato] Cada plato del menú debe informar con precisión de sus ingredientes y alérgenos reconocidos para seguridad alimentaria de los comensales.
- [Regla 3: Personalización de restaurante] El nombre comercial y datos de marca del restaurante provienen de `restaurant_config.json` sin hardcoding de Dine & Done en el encabezado.
- [Regla 4: Concurrencia de stock] El inventario se descuenta atómicamente por BBDD / repositorio para evitar sobreventas.
- [Regla 5: Control de acceso RBAC] Las vistas operativas (Camarero, Cocina, Gerente) requieren autenticación de staff; el Comensal opera de forma pública y anónima.
- [Regla 6: Normativa española de plásticos] Conforme al Real Decreto 293/2018 y Ley 7/2022, las bolsas de plástico conllevan un cobro obligatorio (0.10 €) y los envases plásticos/cubiertos no reutilizables tienen un suplemento impositivo (0.15 €), desglosados explícitamente en el ticket.
- [Regla 7: Internacionalización total] El cambio de idioma conmuta instantáneamente todas las etiquetas, descripciones de platos, alérgenos y filtros al idioma seleccionado sin recargar la página.
- [Regla 8: Imágenes multi-dimensión responsivas] Las fotos de los platos deben descargarse y presentarse en las dimensiones adecuadas al dispositivo (`thumbnail` para móviles estrechos en tarjeta horizontal, `medium` para tablets y `large` para escritorios), garantizando cero desbordamiento horizontal (`scrollWidth <= innerWidth`).
- [Regla 9: Barra de filtros mobile-first perfectamente alineada] La botonera de filtros en pantallas móviles organiza las categorías en carrusel táctil horizontal sin barra de scroll visible, los 3 filtros dietéticos (Vegano, Vegetariano, 0% Alcohol) en un grid equilibrado de 3 columnas de igual ancho, y el selector de alérgenos junto al conmutador de modo de visualización en controles de ancho completo (100%), garantizando simetría perfecta y ergonomía táctil.
- [Regla 10: Desacoplamiento estricto del i18n de la aplicación y del menú con 14 idiomas y RTL]
  - Soporte de 14 idiomas globales y cooficiales: Español (`es`), Inglés (`en`), Francés (`fr`), Alemán (`de`), Chino (`zh`), Coreano (`ko`), Ucraniano (`uk`), Portugués (`pt`), Japonés (`ja`), Árabe (`ar`), Catalán (`ca`), Valenciano (`va`), Euskera (`eu`) y Gallego (`gl`).
  - Soporte RTL (Right-to-Left) automático para Árabe (`dir="rtl"`).
  - Regla de desacoplamiento de catálogo: El selector de idiomas solo expone los idiomas presentes en el catálogo activo de platos del menú. Si un idioma no está disponible en el menú, queda automáticamente oculto del selector.
  - Traducción integral de toda la interfaz: selector de alérgenos, tarjetas de mesa, estados de comanda en vivo, opciones de empaque y cobro, y footer completo (columnas de Restaurante, Normativa & Legal, Sostenibilidad, enlaces y Powered by Dine & Done).
- [Regla 11: Configuración de mesas centralizada y acceso restringido (Requisitos 1 y 2)]
  - Las mesas se definen en el archivo `restaurant_config.json` (`availableTables`) y se presentan mediante un `<select>` desplegable.
  - El comensal tiene la mesa protegida contra modificación (sólo lectura); los controles de cambio/reasignación de mesa están estrictamente restringidos y visibles únicamente para los empleados autenticados (Camarero, Cocina, Gerente).
- [Regla 12: Autenticación de Staff con credenciales seguras (Requisito 3)]
  - El acceso a empleados requiere ingreso manual de usuario/correo y contraseña (no mediante tarjetas o selección directa visible).
  - Credenciales mock integradas en `users.json` para cada rol operativo (Camarero, Cocinero, Gerente).
- [Regla 13: Privacidad estricta de comensales y RGPD (Requisito 4)]
  - Ningún comensal se registra ni se lista en la base de datos de control de usuarios del panel de Gerente.
  - La sección de gestión de usuarios en Gerencia se dedica exclusivamente al personal interno del restaurante, garantizando el cumplimiento normativo de protección de datos personales.
- [Regla 14: Selector dinámico de 5 paletas de colores (Requisito 5)]
  - Conmutador superior de temas en el encabezado con 5 paletas completas:
    1. **Versión Oscura** (`dark`): Modo noche premium por defecto con acentos naranja cálido.
    2. **Versión Clara** (`light`): Modo día limpio, fondos claros y alto contraste.
    3. **Versión Comida** (`food`): Paleta gastronómica `#F6E2B3`, `#E7A84E`, `#D96C2C`, `#3E8E7E`, `#274C56`.
    4. **Versión Retro** (`retro`): Paleta vintage diner `#F6E2B3`, `#E7A84E`, `#D96C2C`, `#3E8E7E`, `#274C56` sobre base cálida pergamino.
    5. **Versión Pastel** (`pastel`): Paleta suave `#FFF1E6`, `#FDE2E4`, `#E2ECE9`, `#CDDAFD`, `#DBE7E4`.
  - Persistencia del tema seleccionado en `localStorage` (`DND_THEME`).

## 3. Technical Specifications (Target: @architect & @dev)
### 3.1. Tech Stack
- **Frontend / UI:** Vite + TypeScript + Vanilla CSS (Arquitectura limpia y alto rendimiento)
- **Configuration:** `mock_data/restaurant_config.json` para branding del restaurante.
- **Storage (Phase 1 - Mock):** Local JSON / Mock storage para desarrollo rápido y pruebas
- **Storage (Phase 2 - Real):** Supabase / Base de datos SQL / BaaS
- **Environment Control:** Feature flag estricto (`USE_MOCK_DB=true` en `.env`)

### 3.2. Architecture & Design Patterns
- **Pattern:** Repository Pattern & Ports and Adapters (Hexagonal Architecture).
- **Strict Guidelines:**
  - **Zero Vendor Lock-in:** El núcleo de la lógica de dominio no depende de ningún BaaS o base de datos externa.
  - **Interfaces First:** Todos los accesos a datos pasan por contratos / puertos (`IPort`).
  - **Dependency Injection:** Contenedor de inyección para intercambiar implementaciones entre mock y base de datos real.

