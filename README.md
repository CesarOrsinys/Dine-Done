# Dine & Done 🍽️✨

Plataforma ágil e inteligente de gestión de pedidos, comandas, KDS (cocina) y KPIs para restaurantes, implementada con **Arquitectura Hexagonal (Puertos y Adaptadores)** y **Zero Vendor Lock-in**.

---

## 🌟 Características Principales (Implementadas y Verificadas)

1. **Catálogo de Menú y Opciones de Servicio (Feature 1):**
   - Menú categorizado (Entrantes, Principales, Postres, Bebidas) con precios e imágenes.
   - Opciones explícitas de servicio: carga de bolsas de transporte, envases plásticos / para llevar y contador de cubiertos.
2. **Pasarela de Pago Stripe y Efectivo con Propinas (Feature 2):**
   - Procesamiento de cobro seguro con tarjeta vía Stripe.
   - Opción de pago en efectivo en mesa/caja con estado `PENDING_CASH`.
   - Selector dinámico de propinas (0%, 5%, 10%, 15% o personalizado).
3. **Panel de Comandas para Camareros (Feature 3):**
   - Vista reactiva de comandas agrupadas por mesa.
   - Entrega de platos terminados (`READY_TO_SERVE` -> `DELIVERED`).
   - Validación y confirmación de cobros en efectivo en sala.
4. **Kitchen Display System - KDS (Feature 4):**
   - Monitor de cocina filtrando automáticamente platos que requieren cocción (`requiresCooking`).
   - Visualización de notas especiales de comensales.
   - Transiciones de estado de cocina (`PLACED` -> `IN_KITCHEN` -> `READY_TO_SERVE`).
5. **Trazabilidad de Personal (Feature 8):**
   - Visualización y asignación del camarero y cocinero a cargo de cada pedido.
6. **Control de Stock en Tiempo Real (Feature 6):**
   - Validación previa al pedido y decremento atómico al confirmar comandas.
   - Editor de inventario en vivo para gerencia con alertas de agotado.
7. **Control y Alternancia de Usuarios (Feature 7):**
   - Matriz de roles (`CUSTOMER`, `WAITER`, `CHEF`, `MANAGER`) con alternador rápido en la barra superior.
8. **Métricas, KPIs y Generación de Informes (Feature 5):**
   - Facturación total cobrada, ticket promedio y propinas acumuladas.
   - Tabla de los 5 platos más pedidos con volumen y recaudación.
   - Exportación de informes gerenciales en formato JSON / CSV para auditorías.

---

## 🏗️ Arquitectura Hexagonal y Zero Lock-in

```text
Dine-Done/
├── docs/
│   ├── requirements/        # Requerimientos iniciales (initial_requirements.md)
│   ├── functional/          # Especificaciones BDD / Historias de Usuario
│   ├── technical/           # Diseño de arquitectura, diagramas de secuencia y SQL
│   └── user_manual/         # Manual de usuario por rol (user_guide.md)
├── src/
│   ├── core/
│   │   ├── domain/          # Entidades (Order, MenuItem, User) y Value Objects
│   │   ├── ports/           # Contratos (IMenuRepository, IOrderRepository, IPaymentGateway)
│   │   └── usecases/        # Casos de uso (CreateOrder, UpdateStatus, KpiReport, etc.)
│   ├── adapters/
│   │   ├── infrastructure/  # Inyección de dependencias y bus de eventos reactivo
│   │   └── storage/         # Adaptadores JSON locales y pasarela Stripe
│   └── main.ts              # UI interactiva y controladores
├── mock_data/               # Semillas de menú, usuarios y comandas
├── tests/unit/              # Suite de pruebas unitarias automatizadas (100% pasando)
├── index.html               # Interfaz web premium glassmorphic
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración TypeScript ES2022 / NodeNext
└── .env                     # Control por variable de entorno USE_MOCK_DB=true
```

---

## 🚀 Puesta en Marcha

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.
3. **Ejecutar pruebas unitarias:**
   ```bash
   npm test
   ```
4. **Construir para producción:**
   ```bash
   npm run build
   ```
