# Dine & Done 🍽️✨

Plataforma ágil y moderna de gestión gastronómica, pedidos, comandas y cierre rápido de mesas para restaurantes.

---

## 🏗️ Arquitectura y Principios de Diseño
Este proyecto sigue una estricta **Arquitectura Hexagonal (Puertos y Adaptadores)** garantizando:
- **Zero Vendor Lock-in**: La lógica de negocio (`src/core/`) es completamente agnóstica a la base de datos o frameworks.
- **Dual Storage Strategy**:
  - `Phase 1 (Mock)`: Almacenamiento local mediante archivos JSON o memoria (`USE_MOCK_DB=true`).
  - `Phase 2 (BaaS/SQL)`: Conexión a base de datos persistente (Supabase / PostgreSQL) (`USE_MOCK_DB=false`).
- **Interfaces First**: Los casos de uso interactúan exclusivamente a través de contratos (`IPort`).

---

## 📁 Estructura del Proyecto

```text
Dine-Done/
├── docs/
│   ├── requirements/        # Requerimientos iniciales (initial_requirements.md)
│   ├── functional/          # Especificaciones BDD / Historias de Usuario
│   ├── technical/           # Diseño de arquitectura, diagramas y contratos
│   └── user_manual/         # Guía de usuario y manuales operativos
├── src/
│   ├── core/
│   │   ├── domain/          # Entidades, Enums y Value Objects
│   │   ├── ports/           # Interfaces de repositorios y servicios externos
│   │   └── usecases/        # Casos de uso (Lógica de negocio pura)
│   ├── adapters/
│   │   ├── infrastructure/  # Contenedores DI y configuración
│   │   └── storage/         # Implementaciones JSON y Supabase
│   └── main.ts              # Punto de entrada de la aplicación
├── mock_data/               # Archivos JSON para desarrollo local
├── tests/
│   └── unit/                # Pruebas automatizadas de dominio y use cases
├── index.html               # Frontend UI principal
├── package.json             # Dependencias y scripts de ejecución
├── tsconfig.json            # Configuración TypeScript moderna (ES2022 / NodeNext)
└── .env                     # Variables de entorno y feature flags
```

---

## 🚀 Inicio Rápido

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```
3. **Ejecutar pruebas unitarias:**
   ```bash
   npm test
   ```
