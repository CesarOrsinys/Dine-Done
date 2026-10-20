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
- [Regla 4: Concurrencia de stock] La reducción de inventario debe validarse en el momento de confirmar o procesar la comanda, previniendo sobreventas de platos sin existencias.
- [Regla 5: Control de acceso RBAC estricto por perfil de empleado]
  - Las vistas operativas de staff requieren autenticación obligatoria; el Comensal opera de forma pública y anónima.
  - **Cocineros (`CHEF`):** Tienen acceso exclusivo al panel de Cocina (KDS). Tienen terminantemente restringido el acceso a las pestañas de Camarero y Gerente (ocultas en la botonera y bloqueadas lógicamente).
  - **Camareros (`WAITER`):** Tienen acceso exclusivo al panel de Camarero (Comandas de sala). No tienen acceso a Cocina ni a Gerente.
  - **Gerente (`MANAGER`):** Dispone de acceso global y sin restricciones a todos los paneles operativos (Camarero, Cocina y Gerencia).
- [Regla 6: Normativa española de plásticos y residuos] Cumplimiento del R.D. 293/2018 y Ley 7/2022 con cobro y desglose transparente obligatorio de bolsas de plástico y recipientes de un solo uso en pedidos para llevar.
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
- [Regla 15: Header móvil estructurado en 2 filas]
  - En vistas móviles, el encabezado organiza sus elementos en dos niveles centrados:
    - Fila 1: Logo del restaurante centrado de forma prominente. El título y subtítulo quedan ocultos para máxima limpieza visual.
    - Fila 2: Selectores de paleta de color (patrones), selector multi-idioma y botón de acceso/salida de empleados.
- [Regla 16: Supresión de datos personales del comensal en comandas de camarero]
  - Se elimina cualquier dato identificativo o nombre de comensal de las tarjetas de comanda de sala (`renderWaiterOrders`). El camarero supervisa exclusivamente número de mesa, productos y estados operativos garantizando la privacidad RGPD.
- [Regla 17: Flujo operativo sin asignación obligatoria y barrera de cobro en efectivo]
  - Se introduce el parámetro configurable `skipStaffAssignment` en `restaurant_config.json` y el panel de Gerencia para omitir la asignación manual previa de camarero y cocinero.
  - **Barrera de seguridad de cobro en efectivo:** Si un pedido tiene pago en efectivo pendiente (`PENDING_CASH`), queda estrictamente bloqueado el paso a elaboración en cocina (KDS) y la entrega en mesa hasta que el camarero registre y valide el cobro.
- [Regla 18: Altas de empleados y productos al inventario desde el panel de Gerencia]
  - Botón "➕" compacto en el panel de Gerencia para registrar nuevo personal interno (`WAITER`, `CHEF`, `MANAGER`) con credenciales y rol. Se excluye el rol de comensal por privacidad.
  - Botón "➕" compacto para incorporar platos y bebidas directamente a la carta con precio, stock, requerimiento de cocina, alérgenos y filtros dietéticos.
- [Regla 19: Botones compactos, limpieza de etiquetas técnicas, imágenes multi-dispositivo y traducción automática]
  - Botones de adición con icono cruceta `➕` exclusivo y tamaño compacto (`36x36px`) para evitar anchos sobredimensionados.
  - Supresión de etiquetas de texto técnico en la interfaz visible de la aplicación (`(Requisito 3)`, `(Features 6 y 10)`, `(Feature 7)`, etc.).
  - Modal de nuevo producto ampliado con inputs cómodos a todo el ancho para nombre y descripción.
  - Soporte de imágenes multi-dispositivo: subida de archivo local (`FileReader`), URL directa, previsualización en tiempo real y ajuste independiente para 📱 Móvil (240x240), 💻 Tablet (600x380) y 🖥️ Desktop (900x550).
  - Traducción automática integrada a los 14 idiomas soportados (`es`, `en`, `fr`, `de`, `zh`, `ko`, `uk`, `pt`, `ja`, `ar`, `ca`, `va`, `eu`, `gl`) con panel de inspección y edición, asegurando disponibilidad universal en el selector de idiomas.
- [Regla 20: Desglose de IVA al 21% en el apartado de pago y comanda]
  - En el apartado de pago y carrito, a todos los productos se les quita el 21% de su importe para presentar su Base Imponible neta tanto por unidad como en el subtotal de platos.
  - En el desglose de la cuenta se añade la fila explícita **IVA (21%)**, sumando la cuota tributaria correspondiente a los productos antes de agregar empaques regulados (Ley 7/2022) y propinas.
  - Soporte multi-idioma completo para la fila fiscal en las 14 lenguas disponibles en la plataforma.
- [Regla 21: Iconos visuales de alérgenos y distribución responsiva de tarjetas de menú]
  - **Iconos gráficos de alérgenos en el precio:** En todas las tarjetas de plato, junto al precio, se incorporan los iconos visuales de cada alérgeno (`🌾` Gluten, `🥛` Lácteos, `🥚` Huevos, `🐟` Pescado, `🦐` Crustáceos, `🥜` Cacahuetes, `🌱` Soja, `🌰` F. Cáscara, etc.) con tooltip identificativo o badge de platos libres de alérgenos.
  - **Distribución en pantallas móviles (Mobile UX):** La insignia de disponibilidad (`Stock`) se desplaza a la esquina superior derecha (sobre la imagen); el botón `+ Añadir` se desplaza a la esquina inferior derecha (bajo la imagen); y junto al precio se ubican los iconos de alérgenos de forma compacta.
  - **Distribución en escritorio (Desktop UX):** Se mantiene la alineación horizontal natural (estado a la izquierda, stock a la derecha, precio e iconos de alérgenos en el pie junto al botón de añadir).

- [Regla 22: Edición integral de productos existentes en la carta]
  - **Edición desde el Panel de Gerencia:** En la tabla de control de carta y stock, cada fila dispone del botón `✏️ Editar` que abre el modal de edición precargado con todos los datos del plato (nombre, descripción, categoría, precio, stock, requerimiento de cocina, atributos dietéticos, alérgenos, imágenes adaptativas y traducciones a los 14 idiomas).
  - **Edición directa desde la Carta Digital:** Cuando un usuario con rol Gerente visualiza el menú, cada tarjeta de plato incluye un botón de acceso directo `✏️ Editar` para corregir rápidamente erratas, precios o descripciones sin tener que navegar al panel administrativo.
  - **Re-traducción y personalización multilingüe:** Posibilidad de regenerar automáticamente con un clic las traducciones a los 14 idiomas a partir de los datos corregidos en español, o afinar manualmente traducciones individuales.

- [Regla 23: Tarjetas de perfil compactas para la gestión de usuarios y personal]
  - **Reemplazo de tabla por tarjetas de perfil:** La sección de control de usuarios en la vista de Gerente sustituye la tabla tradicional por una cuadrícula de tarjetas de perfil (`user-profile-card`) compactas, intuitivas y elegantes.
  - **Información relevante y visible:** Cada tarjeta incluye foto/avatar circular con reborde temático según rol (Gerente, Cocinero, Camarero), indicador luminoso de estado (`ACTIVO` / `INACTIVO`), nombre completo, insignia de cargo, correo electrónico, y las credenciales de acceso (`🔑 Login: usuario` e ID interno).
  - **Privacidad mantenida:** Se preserva la exclusión total de comensales para cumplir estrictamente con la normativa de privacidad y protección de datos.
- [Regla 24: Edición de tarjetas de perfil de trabajadores]
  - **Botón de edición en tarjeta:** Cada tarjeta de trabajador en el panel de Gerencia cuenta con un botón directo `✏️ Editar` en la cabecera.
  - **Modal de edición integral:** Permite actualizar nombre y apellidos, nombre de usuario (`username`), email corporativo, rol laboral (`Gerente`, `Cocinero`, `Camarero`), estado activo/inactivo mediante checkbox, y URL del avatar o foto de perfil.
  - **Gestión segura de credenciales:** El campo de contraseña es opcional durante la edición, permitiendo conservar la contraseña existente si se deja en blanco o actualizarla si se introduce una nueva. Si el usuario editado es el que ha iniciado sesión, su sesión activa se sincroniza en tiempo real.

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

