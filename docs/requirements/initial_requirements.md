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
- **Feature 9 (Nuevo):** Nombre de la empresa personalizable mediante fichero `.json` de configuración (branding dinámico en interfaz y tickets).
- **Feature 10 (Nuevo):** Menú enriquecido y personalizable con nombre, ingredientes (de tenerlos), alérgenos (de tenerlos), precio y stock, gestionado mediante BBDD / repositorio con mock JSON inicial.
- **Feature 11 (Nuevo):** Detección inteligente de mesa para comensales: lectura automática por parámetro de URL (ej. `?table=5` o `?mesa=5`) y selección manual interactiva.

### 2.3. Business Rules & Edge Cases (Reglas de Negocio)
- [Regla 1: Identificación de mesa] El comensal debe tener siempre una mesa asociada antes de confirmar el pedido, detectada automáticamente por URL o configurada manualmente.
- [Regla 2: Ficha técnica de plato] Cada plato del menú debe informar con precisión de sus ingredientes y alérgenos reconocidos para seguridad alimentaria de los comensales.
- [Regla 3: Personalización de restaurante] El nombre comercial y datos de marca del restaurante provienen de `restaurant_config.json` sin hardcoding.
- [Regla 4: Concurrencia de stock] El inventario se descuenta atómicamente por BBDD / repositorio para evitar sobreventas.

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

