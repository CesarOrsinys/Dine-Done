# Changelog - Dine & Done

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.3.0] - 2026-10-20
### Added
- **Diseño Totalmente Responsive para Móviles y Tablets (HU-18):**
  - Barra flotante inferior de comanda (`#mobile-cart-bar`) en dispositivos móviles y tablets que muestra el número de ítems y el importe total en vivo con botón para desplegar la comanda.
  - Cajón deslizable hacia arriba (Bottom Sheet Drawer) para el carrito de compras, permitiendo revisar platos, ajustar empaques y finalizar pagos sin abandonar la vista del menú.
  - Soporte de gestos táctiles y desplazamiento horizontal suave (`scroll-snap`) para categorías, chips dietéticos y selector de alérgenos.
  - Ajuste de cabecera compacta para pantallas pequeñas (< 768px y < 400px) evitando desbordamientos de texto.
  - Tableros de Camarero y Cocina KDS optimizados para visualización en tablets (2 columnas) y teléfonos (1 columna).
  - Tablas de control gerencial con desplazamiento táctil horizontal seguro.

## [1.2.0] - 2026-10-20
### Added
- **Acceso Exclusivo de Personal (Staff Login) (HU-12):**
  - Botón "Acceso Empleados" en la barra superior derecha con modal de selección de perfil para Camarero, Cocinero y Gerente.
  - La vista del comensal no requiere login y oculta por defecto los paneles operativos de personal.
  - Botón de cierre de sesión "Salir (Comensal)" para retornar al modo cliente.
- **Filtro Excluyente de Alérgenos (HU-13):**
  - Selector en la barra de filtros para excluir platos con Gluten, Lácteos, Huevos, Pescado, Frutos de cáscara o Sulfitos.
- **Filtros Dietéticos Especiales (HU-14):**
  - Chips interactivos para filtrar platos Veganos, Vegetarianos y 0% Alcohol.
- **Cumplimiento de la Normativa Española sobre Empaques (HU-15):**
  - Cálculo y desglose específico en la comanda para cobro de bolsas plásticas (R.D. 293/2018: +0.10 €), envases desechables de un solo uso (Ley 7/2022 de Residuos: +0.15 €) y cubiertos ecológicos (+0.10 €/ud).
- **Desacoplamiento de Marca: Restaurante en Header, Dine & Done en Footer (HU-16):**
  - El encabezado superior muestra exclusivamente el nombre comercial del restaurante procedente de `restaurant_config.json`.
  - El software "Dine & Done" se traslada al pie de página junto a enlaces de redes sociales, Términos y Condiciones, Política de Privacidad, Cookies, Aviso Legal e información sobre sostenibilidad.
- **Soporte Internacional Multilingüe (i18n) (HU-17):**
  - Selector de idioma en la barra superior (Español 🇪🇸, Inglés 🇬🇧, Francés 🇫🇷, Alemán 🇩🇪).
  - Diccionario exhaustivo `mock_data/translations.json` y traducción completa reactiva de la interfaz y elementos de la carta (nombre, descripción, ingredientes y alérgenos).

## [1.1.0] - 2026-10-20
### Added
- **Branding Personalizable por JSON (HU-09):**
  - Configuración dinámica del nombre de empresa, eslogan y datos desde `mock_data/restaurant_config.json`.
  - Integración en título del navegador, encabezado y metadatos de reportes exportados.
- **Menú Enriquecido y Editor Gerencial (HU-10):**
  - Inclusión de ingredientes y etiquetas visuales de alérgenos (Gluten, Lácteos, Huevos, Pescado, Frutos secos, etc.) en cada plato.
  - Editor en vivo para Gerencia permitiendo modificar tanto el precio unitario (€) como el stock disponible en BBDD/repositorio con persistencia.
- **Detección Inteligente y Selección de Mesa (HU-11):**
  - Detección automática por URL (`?table=...`, `?mesa=...`).
  - Barra superior en la vista del comensal con identificador de mesa y botón interactivo para cambio manual con guardado local.

## [1.0.0] - 2026-10-20
### Added
- **Módulo de Menú y Opciones de Servicio (HU-01):**
  - Catálogo filtrable por categorías (Entrantes, Principales, Postres, Bebidas).
  - Opciones de empaque en comanda: bolsas de transporte, envases plásticos y contador de cubiertos.
- **Pasarela de Pagos Stripe y Cobro en Efectivo (HU-02):**
  - Pasarela de pago simulada para tarjetas de crédito/débito.
  - Opción de pago en efectivo en mesa/caja con estado `PENDING_CASH`.
  - Selector de propinas (0%, 5%, 10%, 15% y personalizado).
- **Módulo de Sala y Comandas para Camareros (HU-03):**
  - Tablero reactivo de comandas activas por mesa.
  - Entrega de platos terminados a mesa y confirmación de cobros en efectivo.
- **Kitchen Display System - KDS (HU-04):**
  - Monitor de cocina filtrando únicamente productos que requieren elaboración.
  - Avance de estados de cocción (`PLACED` -> `IN_KITCHEN` -> `READY_TO_SERVE`).
- **Trazabilidad de Personal (HU-05):**
  - Asignación y visualización de camarero y cocinero en cada comanda.
- **Control de Stock en Tiempo Real (HU-06):**
  - Decremento automático atómico de inventario al confirmar pedidos.
  - Editor en vivo de stock para gerencia con alertas de agotado.
- **Control de Usuarios y Roles (HU-07):**
  - Soporte de roles `CUSTOMER`, `WAITER`, `CHEF` y `MANAGER` con alternador en la barra superior.
- **Métricas, KPIs y Reportes Gerenciales (HU-08):**
  - Métricas de facturación total, propinas, ticket promedio y estado de comandas.
  - Tabla de los 5 platos más solicitados y recaudación.
  - Descarga de reportes gerenciales en formato JSON.
- **Documentación Completa:**
  - `docs/functional/functional_specifications.md` con historias de usuario y criterios BDD.
  - `docs/technical/technical_design.md` con diagramas de secuencia Mermaid y esquema SQL.
  - `docs/user_manual/user_guide.md` con manual operativo por rol.
- **Pruebas Automatizadas:**
  - Suite de pruebas unitarias (`tests/unit/domain_and_usecases.test.ts`) con 7 pruebas pasando al 100%.
