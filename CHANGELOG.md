# Changelog - Dine & Done

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
