---
project_name: "Dine & Done"
version: "0.1.0"
status: "Draft"
created_at: "2026-10-20"
---

# Project Kickoff Requirements: Dine & Done

## 1. Executive Summary
- **Objective:** [Escribe aquí el objetivo principal de Dine & Done, p. ej. Gestión ágil de reservas, comandas, mesas y cobro rápido para restaurantes/comensales]
- **Target Audience:** [Escribe aquí el público objetivo, p. ej. Comensales, Camareros, Administradores de sala, Cocina]

## 2. Business Requirements (Target: @functional)
### 2.1. User Roles
- **Role A:** [p. ej. Cliente / Comensal] - [Responsabilidades o acciones permitidas]
- **Role B:** [p. ej. Camarero / Personal de Sala] - [Responsabilidades o acciones permitidas]
- **Role C:** [p. ej. Administrador / Dueño de Restaurante] - [Responsabilidades o acciones permitidas]

### 2.2. Core Features (Epics / Funcionalidades Clave)
- **Feature 1:** [Describe la funcionalidad 1]
- **Feature 2:** [Describe la funcionalidad 2]
- **Feature 3:** [Describe la funcionalidad 3]
- **Feature 4:** [Describe la funcionalidad 4]
- **Feature 5:** [Describe la funcionalidad 5]

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
