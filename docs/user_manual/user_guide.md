# Manual de Usuario - Dine & Done 🍽️📖

Guía interactiva de uso para cada uno de los roles operativos del restaurante.

---

## 1. Rol: Comensal (Experiencia "Dine & Done")

### 1.1. Consulta del Menú y Filtros
1. Al acceder a la aplicación, se muestra la vista **Carta & Menú Digital**.
2. Puedes filtrar por categorías:
   - 🥗 **Entrantes**
   - 🍔 **Platos Principales**
   - 🍰 **Postres**
   - 🥤 **Bebidas**
3. Cada tarjeta indica si el plato requiere cocina (`🔥 Requiere Cocina`) o es de entrega inmediata (`⚡ Entrega Directa`), junto al stock disponible en tiempo real.

### 1.2. Armado de la Comanda y Opciones de Servicio
1. Pulsa el botón **`+ Añadir`** en los platos deseados.
2. En el panel lateral derecho (**Tu Comanda Actual**), puedes incrementar (`+`) o reducir (`-`) cantidades.
3. Configura tus **Opciones de Servicio y Empaque** (Feature 1):
   - Marca **Bolsa de transporte** si te lo llevas.
   - Marca **Envases plásticos / para llevar** si requieres recipientes herméticos.
   - Ajusta los **Juegos de cubiertos** con los botones `+` y `-`.

### 1.3. Selección de Propina y Pago Rápido
1. Elige el porcentaje de propina sugerido (**0%, 5%, 10%, 15%**). El total se recalculará instantáneamente.
2. Selecciona tu método de cobro:
   - 💳 **Tarjeta (Stripe):** Procesa el cobro seguro y marca la comanda inmediatamente como pagada (`PAID`).
   - 💵 **Efectivo en mesa:** Genera la comanda como `PENDING_CASH` para que el camarero cobre en mesa.
3. Pulsa **Confirmar Pedido (Dine & Done)**.

---

## 2. Rol: Camarero (Gestión de Sala)

1. En la barra superior, pulsa el botón **🏃 Camarero**.
2. Aparecerán las comandas agrupadas por número de mesa.
3. **Acciones disponibles:**
   - **🏃 Atender comanda:** Asigna tu nombre como camarero responsable de la orden.
   - **🍽️ Entregar a mesa:** Cuando cocina termina los platos y están en estado `READY_TO_SERVE`, pulsa este botón para entregarlos a los comensales (pasan a `DELIVERED`).
   - **💵 Cobrar en efectivo:** Si el comensal eligió pago en efectivo, pulsa este botón para registrar el cobro y pasar a `PAID`.

---

## 3. Rol: Cocinero (Kitchen Display System - KDS)

1. En la barra superior, pulsa el botón **👨‍🍳 Cocina (KDS)**.
2. El sistema filtrará automáticamente y mostrará únicamente los pedidos con platos que requieren cocción (`requiresCooking = true`).
3. **Flujo de elaboración:**
   - **👨‍🍳 Asignarme:** El cocinero se adjudica la orden.
   - **🔥 Empezar a Cocinar:** Transiciona el estado a `IN_KITCHEN`.
   - **✅ ¡Plato Listo para Servir!:** Transiciona el estado a `READY_TO_SERVE` y avisa a los camareros de sala para su recogida inmediata.

---

## 4. Rol: Gerente (KPIs, Stock y Personal)

1. En la barra superior, pulsa el botón **📊 Gerente**.
2. **Dashboard de Métricas Financieras (KPIs):**
   - Facturación Total Cobrada (€)
   - Propinas Totales Acumuladas (€)
   - Ticket Promedio por comanda
   - Distribución de comandas (activas vs entregadas)
3. **Platos Más Solicitados:** Tabla de popularidad y recaudación por plato.
4. **Control de Stock en Vivo:** Modifica el inventario de cualquier plato y guarda con el botón `💾 Guardar`. Los pedidos descuentan unidades atómicamente.
5. **Control de Usuarios:** Lista de personal activo y roles asignados.
6. **Exportar Informe:** Pulsa el botón **📥 Exportar Informe (JSON)** para descargar un reporte de auditoría completo.
