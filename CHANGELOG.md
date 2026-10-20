# Changelog - Dine & Done

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.6.5] - 2026-10-20
### Added
- **Tarjetas de Perfil Compactas para Gestión de Personal (Vista de Gerente):**
  - Transformación del listado plano de usuarios en una cuadrícula moderna de tarjetas de perfil (`user-profile-card`) compactas, estéticas y altamente informativas.
  - Inclusión de foto/avatar de alta resolución con halo temático y punto luminoso de estado activo (`🟢`) o inactivo (`🔴`).
  - Presentación clara de nombre completo, badge distintivo de cargo (Gerente 🛡️, Cocinero 👨‍🍳, Camarero 🏃), dirección de correo electrónico, identificador de usuario para logueo (`🔑 Login: usuario`) e ID interno del sistema.
  - Soporte para avatar personalizado al registrar nuevos empleados en el formulario modal administrativo.

## [1.6.4] - 2026-10-20
### Added
- **Edición Integral de Productos Existentes en Carta:**
  - Botón interactivo `✏️ Editar` añadido en cada fila de la tabla **Control de Carta, Precios y Stock** del panel de Gerente.
  - Botón de acceso directo `✏️ Editar` en las tarjetas de plato del menú digital cuando se navega con rol de Gerente, permitiendo solventar erratas inmediatamente sin cambiar de pantalla.
  - Modal unificado de edición que precarga todos los datos del plato: título, descripción detallada, categoría (incluyendo Entrantes, Principales, Postres, Bebidas y Guarniciones), precio, stock, requerimiento de cocina, propiedades dietéticas (vegano, vegetariano, 0% alcohol), alérgenos oficiales, imágenes multi-dispositivo y traducciones completas a los 14 idiomas.
  - Sincronización instantánea con el repositorio hexagonal de carta (`updateItem`), persistencia en tiempo real y actualización dinámica de los selectores de idioma y del menú.

## [1.6.3] - 2026-10-20
### Added
- **Restauración de Iconos Visuales de Alérgenos:**
  - Inclusión de iconos pequeños e intuitivos con simbología internacional (`🌾`, `🥛`, `🥚`, `🐟`, `🦐`, `🥜`, `🌱`, `🌰`, etc.) junto al precio en cada plato del menú.
  - Insignia interactiva con tooltip que identifica el alérgeno al pasar el cursor o pulsar sobre él, además de indicar `✅ Sin alérgenos` en productos libres de alérgenos.
  - Visibilidad garantizada tanto en modo cuadrícula como en modo compacto.

### Changed
- **Distribución Responsiva Adaptada de Tarjetas en Móvil:**
  - En versión móvil (`max-width: 640px`):
    - La insignia de **Stock** se traslada a la esquina superior derecha (justo encima de la imagen miniatura).
    - El botón **`+ Añadir`** se sitúa en la esquina inferior derecha (justo debajo de la imagen miniatura).
    - Los **iconos de alérgenos** se posicionan a la derecha del precio en el bloque de información principal.
  - En versión desktop (`min-width: 641px`):
    - Se preserva la disposición estándar sin alterar el botón de añadir ni las etiquetas superiores, integrando limpiamente los iconos de alérgenos al lado del precio.

## [1.6.2] - 2026-10-20
### Added
- **Desglose de IVA al 21% en el Apartado de Pago:**
  - En las líneas de pedido del carrito se le descuenta el 21% a cada producto, visualizándose la Base Imponible unitaria y por línea sin IVA.
  - Se añade la fila independiente **IVA (21%)** (`#bill-vat`) en el resumen de la cuenta, totalizando la cuota de IVA del 21% que se suma a la base imponible de los productos.
  - Coherencia total con los importes finales del pedido, empaques ecológicos (Ley 7/2022) y pasarelas de pago (Stripe / Efectivo).
  - Soporte multi-idioma de la etiqueta fiscal para las 14 lenguas oficiales y regionales integradas.

## [1.6.1] - 2026-10-20
### Added
- **Traducción Automática a los 14 Idiomas Soportados:**
  - Integración del servicio de traducción en línea que traduce automáticamente tanto el título como la descripción del nuevo plato a todos los idiomas de la plataforma (`es`, `en`, `fr`, `de`, `zh`, `ko`, `uk`, `pt`, `ja`, `ar`, `ca`, `va`, `eu`, `gl`).
  - Panel desplegable para revisar y personalizar las traducciones generadas antes o después de la incorporación a la carta.
  - Almacenamiento íntegro de la matriz de traducciones para mantener el 100% de disponibilidad en el selector de idiomas dinámico.
- **Soporte de Imágenes Multi-Dispositivo Adaptativas:**
  - Capacidad para subir imágenes desde archivo local (`FileReader` a DataURL) o especificar URL directa, con previsualización en tiempo real.
  - Almacenamiento adaptado a los 3 breakpoints de visualización: 📱 Móvil (`thumbnail`: 240x240), 💻 Tablet (`medium`: 600x380) y 🖥️ Desktop (`large`: 900x550).
  - Opción avanzada para ingresar URLs específicas por dispositivo si se dispone de recursos gráficos a medida.

### Changed
- **Botones de Acción Compactos en Gerencia:**
  - Rediseño de los botones de adición en la vista de Gerente (`#btn-open-add-product` y `#btn-open-add-user`) convirtiéndolos en botones de icono único `➕` de dimensiones compactas (`36x36px`) sin texto redundante.
- **Limpieza Visual de la Interfaz:**
  - Eliminación de todas las etiquetas textuales técnicas visibles en la aplicación (`(Requisito 3)`, `(Features 6 y 10)`, `(Feature 7)`, etc.) para ofrecer una estética profesional y limpia.
- **Inputs Ampliados en el Formulario de Nuevo Producto:**
  - Rediseño del modal de adición de plato con inputs amplios (`100% width`, padding generoso, `textarea` multilínea para descripción y mayor ancho general de modal a `720px`).

## [1.6.0] - 2026-10-20
### Added
- **Header Móvil en 2 Filas Centradas (Req 1):**
  - Fila 1: Logo de la empresa centrado de manera limpia y prominente. El título y subtítulo quedan ocultos en móviles para optimizar el espacio vertical.
  - Fila 2: Selectores de paleta de color (patrones de diseño), selector de idioma y botón de acceso/salida de personal.
- **Flujo Operativo sin Asignación Obligatoria & Barrera de Cobro en Efectivo (Req 3):**
  - Opción configurable en `restaurant_config.json` y en el panel de Gerencia (`skipStaffAssignment`) para omitir la asignación manual a camarero o cocinero, habilitando el servicio directo.
  - **Bloqueo estricto de pedidos en efectivo:** Si un pedido está pendiente de cobro en efectivo (`PENDING_CASH`), queda terminantemente bloqueado el inicio de cocción en cocina y la entrega a mesa hasta que el camarero valide el cobro.
- **Gestión Gerencial de Altas de Empleados y Nuevos Productos (Req 4):**
  - Botón y modal interactivo para incorporar nuevos miembros del personal interno (`WAITER`, `CHEF`, `MANAGER`) con credenciales seguras.
  - Botón y modal interactivo para dar de alta nuevos platos y productos en la carta con stock, precio, alérgenos, propiedades dietéticas y generación de traducciones para los 14 idiomas soportados.

### Changed
- **Privacidad Estricta de Comensales en Comandas de Camarero (Req 2):**
  - Eliminación definitiva del nombre del comensal en las tarjetas de comandas de sala (`renderWaiterOrders`), cumpliendo con la normativa de privacidad y protección de datos.

## [1.5.1] - 2026-10-20
### Changed
- **Control de Acceso RBAC Estricto por Rol Operativo:**
  - **Cocineros (`CHEF`):** Acceso restringido exclusivamente a la pantalla de cocina (KDS). Se ocultan y bloquean los botones y accesos a las pestañas de Camarero y Gerente.
  - **Camareros (`WAITER`):** Acceso restringido exclusivamente al panel de comandas de sala (`WAITER`). Se ocultan y bloquean los accesos a Cocina y Gerente.
  - **Gerente (`MANAGER`):** Acceso total y sin restricciones a todas las pestañas operativas (Camarero, Cocina y Gerencia) manteniendo intactos los privilegios de administración durante la inspección.
- **Validación en Tiempo de Ejecución y Pruebas Unitarias:**
  - Protección lógica en el controlador `switchRole()` y en el DOM `updateRoleSwitcherVisibility()`.
  - Nueva suite de pruebas unitarias verificando la matriz de permisos para los roles de Cocinero, Camarero y Gerente.

## [1.5.0] - 2026-10-20
### Added
- **Configuración Dinámica de Mesas y Restricción Exclusiva para Empleados (Req 1 & 2):**
  - Listado de mesas configurables centralizado en `restaurant_config.json` (`availableTables`).
  - Sustitución del campo de texto libre por un selector `<select id="quick-table-select">` poblado dinámicamente.
  - La reasignación de mesa queda protegida y oculta para el comensal (sólo lectura); únicamente el personal autenticado (Camarero, Cocinero, Gerente) puede activar el desplegable para cambiar o asignar mesas.
- **Login de Personal con Credenciales Manuales (Req 3):**
  - Eliminación de la selección visual directa por tarjetas de empleado.
  - Formulario de autenticación con campos obligatorios de usuario/email y contraseña (`type="password"`), validación contra credenciales del personal y feedback de error.
- **Protección de Privacidad y RGPD en Panel de Gerente (Req 4):**
  - Eliminación completa de roles de comensal (`CUSTOMER`) en la base de datos de usuarios y en la tabla de control de usuarios del panel de Gerencia.
  - El comensal opera como cliente anónimo en memoria sin almacenar datos personales en nómina o listas internas.
- **Selector de 5 Paletas de Colores / Temas (Req 5):**
  - Incorporación de selector de temas `#theme-selector` en el encabezado con 5 versiones integrales:
    1. `🌙 Versión Oscura` (`dark`): Modo noche premium de alto contraste.
    2. `☀️ Versión Clara` (`light`): Fondos claros y limpios.
    3. `🥘 Versión Comida` (`food`): Paleta gastronómica `#F6E2B3`, `#E7A84E`, `#D96C2C`, `#3E8E7E`, `#274C56`.
    4. `📻 Versión Retro` (`retro`): Paleta vintage diner sobre base cálida pergamino.
    5. `🌸 Versión Pastel` (`pastel`): Paleta suave `#FFF1E6`, `#FDE2E4`, `#E2ECE9`, `#CDDAFD`, `#DBE7E4`.
  - Persistencia de la paleta activa en `localStorage` (`DND_THEME`).

## [1.4.1] - 2026-10-20
### Added
- **Idiomas Cooficiales Españoles (Catalán, Valenciano, Euskera y Gallego):**
  - Incorporación de 4 nuevos idiomas autonómicos tanto en la interfaz de la aplicación (`translations.json`) como en las fichas gastronómicas del menú (`menu.json`), alcanzando un total de 14 idiomas soportados:
    - Catalán (`ca` - 🟡🔴 Català)
    - Valenciano (`va` - 🔵🔴 Valencià)
    - Euskera (`eu` - 🟢🔴 Euskara)
    - Gallego (`gl` - 🔵⚪ Galego)
  - Disponibilidad total de los 14 idiomas en el selector de la carta cumpliendo la regla de desacoplamiento de catálogo.
- **Traducción Integral del Footer:**
  - Internacionalización reactiva de todas las columnas y enlaces del pie de página:
    - Encabezados: "Restaurante", "Normativa & Legal", "Sostenibilidad".
    - Enlaces: "Carta Digital", "Información Alérgenos", "Horarios y Reservas", "Ubicación y Contacto".
    - Normativa y sostenibilidad: "R.D. 293/2018 (Bolsas)", "Ley 7/2022 (Residuos)", "Envases Compostables", "Economía Circular".
    - Marca y pie: "Powered by Dine & Done © 2026" y descripción del restaurante.

## [1.4.0] - 2026-10-20
### Added
- **Alineación Perfecta de Controles de Filtro en Móvil:**
  - Rediseño estético y simétrico de la barra de filtros en pantallas pequeñas:
    - Fila de categorías con desplazamiento táctil horizontal suave y sin barra de scroll visible.
    - Fila de filtros dietéticos reorganizada en un grid de 3 columnas iguales (`🌱 Vegano`, `🥗 Vegetariano`, `🚫 0% Alcohol`) distribuyendo homogéneamente el ancho disponible.
    - Fila de controles con selector de alérgenos y conmutador de vista (`📱 Compacta` / `🖼️ Galería`) configurados a ancho completo (100%) y altura idéntica (38px), eliminando cualquier desalineamiento o solapamiento asimétrico en dispositivos estrechos.
- **Soporte de 10 Idiomas Internacionales & RTL:**
  - Incorporación de Chino (`zh`), Coreano (`ko`), Ucraniano (`uk`), Portugués (`pt`), Japonés (`ja`) y Árabe (`ar`), sumados a Español (`es`), Inglés (`en`), Francés (`fr`) y Alemán (`de`).
  - Soporte nativo de dirección RTL (`dir="rtl"`) al conmutar a Árabe, invirtiendo la disposición de textos, tarjetas y controles de acuerdo a la caligrafía árabe.
- **Desacoplamiento Estricto de Menú i18n vs App i18n:**
  - El selector de idiomas solo expone los idiomas disponibles en el catálogo activo de platos del menú (`menuCatalog`). Si un idioma no está provisto en el menú, no se muestra como opción disponible en el selector.
- **Traducción Exhaustiva de Toda la Aplicación:**
  - Opciones del desplegable de alérgenos traducidas dinámicamente según el idioma activo.
  - Insignias de identificación de mesa (Mesa por defecto, Detectada por URL, Configurada manualmente).
  - Títulos de sección para Camarero, Cocina (KDS) y Gerencia, botones de autenticación y métodos de pago.
  - Etiquetas de alérgenos y detalles de ingredientes en las tarjetas del menú.

## [1.3.1] - 2026-10-20
### Added
- **Imágenes Multi-Dimensión Responsivas & Vista Compacta Móvil (HU-19):**
  - Incorporación de interfaz de dimensiones múltiples `ResponsiveImageUrls` (`thumbnail: 240x240`, `medium: 600x380`, `large: 900x550`) para todos los ítems del menú.
  - Implementación del elemento nativo `<picture>` con etiquetas `<source media="(max-width: 640px)" ...>` y `<source media="(max-width: 1024px)" ...>`, reduciendo drásticamente la carga de datos en teléfonos y adaptando el renderizado según el dispositivo.
  - Nuevo diseño de tarjeta compacta horizontal en móviles (estilo UberEats/Glovo): imagen miniatura cuadrada a la derecha y contenido principal a la izquierda (título, precio, insignia de cocina y botón de añadir), visualizando múltiples platos simultáneamente en pantalla sin scroll vertical excesivo.
  - Selector interactivo de modo de visualización en la barra de filtros: modo `📱 Compacta` (por defecto en móviles) y modo `🖼️ Galería` (para visualizar fotografías grandes de alta resolución).
  - Eliminación total de scrollbars horizontales en pantallas estrechas mediante contención estricta de desbordamiento (`overflow-x: hidden; max-width: 100vw;`).

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
