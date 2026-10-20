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

### 2.3. Business Rules & Edge Cases (Reglas de Negocio)
- [Regla 1: p. ej. Tiempos límite, estados de las comandas/cuentas, cierres de mesa]
- [Regla 2: p. ej. Concurrencia de pedidos o validaciones de pago]

## 3. Technical Specifications (Target: @architect & @dev)
### 3.1. Tech Stack
- **Frontend / UI:** Vite + TypeScript + Vanilla CSS (Arquitectura limpia y alto rendimiento)
- **Storage (Phase 1 - Mock):** Local JSON / Mock storage para desarrollo rápido y pruebas
- **Storage (Phase 2 - Real):** Supabase / Base de datos SQL / BaaS
- **Environment Control:** Feature flag estricto (`USE_MOCK_DB=true` en `.env`)

### 3.2. Architecture & Design Patterns
- **Pattern:** Repository Pattern & Ports and Adapters (Hexagonal Architecture).
- **Strict Guidelines:**
  - **Zero Vendor Lock-in:** El núcleo de la lógica de dominio no depende de ningún BaaS o base de datos externa.
  - **Interfaces First:** Todos los accesos a datos pasan por contratos / puertos (`IPort`).
  - **Dependency Injection:** Contenedor de inyección para intercambiar implementaciones entre mock y base de datos real.
