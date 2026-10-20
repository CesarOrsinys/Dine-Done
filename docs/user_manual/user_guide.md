# Manual de Usuario - Dine & Done 🍽️📖

Guía interactiva de uso para cada uno de los roles operativos del restaurante y comensales.

---

## 1. Experiencia del Comensal (Pública, sin Login)

### 1.1. Identificación de Mesa Inteligente
- Si accedes escaneando el código QR de tu mesa o mediante URL (ej: `?mesa=4` o `?table=12`), la app detecta tu ubicación automáticamente.
- Si deseas cambiarla, pulsa **`✏️ Cambiar Mesa`**, escribe el número y pulsa **`💾 Guardar`**.

### 1.2. Selector de Idioma (i18n)
- En la esquina superior derecha dispones del selector de idiomas:
  - 🇪🇸 **ES** (Español)
  - 🇬🇧 **EN** (English)
  - 🇫🇷 **FR** (Français)
  - 🇩🇪 **DE** (Deutsch)
- Al cambiar el idioma, toda la interfaz, categorías, opciones de empaque y los nombres/ingredientes del menú se adaptan al instante.

### 1.3. Filtros Dietéticos y de Alérgenos
- **Filtros Dietéticos:**
  - 🌱 **Vegano:** Muestra exclusivamente platos 100% vegetales.
  - 🥗 **Vegetariano:** Filtra platos aptos para vegetarianos (incluye veganos y lácteos/huevos).
  - 🚫 **0% Alcohol:** Oculta cualquier bebida o preparación con graduación alcohólica.
- **Filtro de Alérgenos:**
  - Despliega el selector **`⚠️ Filtrar por alérgeno`** y elige el alérgeno que deseas excluir (*Sin Gluten*, *Sin Lácteos*, *Sin Huevos*, *Sin Pescado*, *Sin Frutos de cáscara*, *Sin Sulfitos*). La carta ocultará de inmediato los platos de riesgo.

### 1.4. Armado de la Comanda y Normativa Española de Empaque
1. Pulsa el botón **`+ Añadir`** en los platos deseados.
2. En el panel lateral derecho (**Tu Comanda Actual**), incrementa (`+`) o reduce (`-`) cantidades.
3. **Opciones de Servicio y Empaque (Cumplimiento R.D. 293/2018 y Ley 7/2022):**
   - **Bolsa reciclable (+0.10 €):** Conforme al R.D. 293/2018 sobre cobro obligatorio de bolsas plásticas.
   - **Envase para llevar (+0.15 €):** Conforme a la Ley 7/2022 de residuos e impuesto a plásticos no reutilizables de un solo uso.
   - **Cubiertos ecológicos (+0.10 €/ud):** Ajustables con los botones `+` y `-`.
   - El desglose exacto de empaques se muestra en la liquidación del ticket en tiempo real.

### 1.5. Propina y Pago Rápido
1. Elige el porcentaje de propina sugerido (**0%, 5%, 10%, 15%**).
2. Selecciona tu método de pago:
   - 💳 **Tarjeta (Stripe):** Cobro digital verificado instantáneo (`PAID`).
   - 💵 **Efectivo en mesa:** Comanda creada como `PENDING_CASH` para liquidar en mesa con el camarero.
3. Pulsa **Confirmar Pedido (Dine & Done)**.

---

## 2. Acceso y Autenticación de Personal (Staff Login)

Para proteger las operaciones del restaurante, los paneles internos de empleados están restringidos:
1. En la esquina superior derecha, pulsa **`🔐 Acceso Empleados`**.
2. Selecciona tu perfil en el modal:
   - **🏃 David García** (Camarero de Sala)
   - **👨‍🍳 Chef Antonio Martín** (Jefe de Cocina)
   - **📊 César Orsinys** (Gerente General)
3. Al autenticarte, se desbloquearán las pestañas de navegación superior (`Camarero`, `Cocina (KDS)`, `Gerente`).
4. Para regresar al modo público comensal en cualquier momento, pulsa el botón **`🚪 Salir (Comensal)`**.

---

## 3. Rol: Camarero (Gestión de Sala)

1. Tras iniciar sesión, pulsa la pestaña **🏃 Camarero**.
2. Visualiza las comandas de sala con su desglose de platos, etiquetas de empaque y estado de pago.
3. **Acciones clave:**
   - **🏃 Atender comanda:** Asigna tu nombre para trazabilidad de servicio.
   - **🍽️ Entregar a mesa:** Cuando cocina termina los platos (`READY_TO_SERVE`), entrégalos a la mesa y pulsa este botón para pasarlos a `DELIVERED`.
   - **💵 Cobrar en efectivo:** En pedidos marcados con pago en efectivo, pulsa para registrar la cobranza y pasar la cuenta a `PAID`.

---

## 4. Rol: Cocinero (Kitchen Display System - KDS)

1. Pulsa la pestaña **👨‍🍳 Cocina (KDS)**.
2. El sistema filtra únicamente comandas con platos que requieren elaboración culinaria (`requiresCooking = true`).
3. **Flujo de elaboración:**
   - **👨‍🍳 Asignarme:** El cocinero toma la orden.
   - **🔥 Empezar a Cocinar:** Transiciona a `IN_KITCHEN`.
   - **✅ ¡Plato Listo para Servir!:** Transiciona a `READY_TO_SERVE` y alerta automáticamente a los camareros de sala.

---

## 5. Rol: Gerente (KPIs, Stock y Personal)

1. Pulsa la pestaña **📊 Gerente**.
2. **Dashboard de Métricas Financieras (KPIs):**
   - Facturación Total Cobrada (€)
   - Propinas Totales Acumuladas (€)
   - Ticket Promedio por comanda
   - Distribución de comandas (en cocina vs entregadas)
3. **Control de Precios y Stock en Vivo:** Ajusta precios o stock directamente en la tabla y pulsa `💾 Guardar`.
4. **Control de Personal:** Lista de empleados con roles activos.
5. **Exportación de Informes:** Pulsa **`📥 Exportar Informe (JSON)`** para descargar el informe consolidado para contabilidad o auditoría.

---

## 6. Identidad de Marca y Pie de Página

- **Encabezado superior:** Muestra exclusivamente el nombre de tu restaurante y eslogan configurados en `restaurant_config.json`.
- **Pie de página (Footer):** Contiene el sello **`Powered by Dine & Done © 2026`**, enlaces a redes sociales y páginas legales reglamentarias:
  - Términos y Condiciones
  - Política de Privacidad
  - Política de Cookies
  - Aviso Legal
  - Información de Sostenibilidad y normativa R.D. 293/2018 y Ley 7/2022
