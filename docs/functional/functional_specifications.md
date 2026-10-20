# Especificaciones Funcionales (BDD) - Dine & Done 🍽️✨

---

## 1. Visión General del Negocio
**Dine & Done** es una plataforma integral diseñada para restaurantes de alto flujo con el fin de agilizar, asegurar y sincronizar el ciclo de vida de los pedidos: desde la elección del menú y solicitud de empaque/cubiertos por el comensal, pasando por la cocina (KDS) y camareros de sala, hasta la analítica financiera y control de inventario por parte del gerente.

---

## 2. Matriz de Roles y Permisos (RBAC)

| Rol | Código | Descripción y Alcance |
| :--- | :--- | :--- |
| **Comensal** | `CUSTOMER` | Visualiza menú, agrega ítems, bolsas/plásticos/cubiertos, define propinas y paga vía Stripe o efectivo. |
| **Camarero** | `WAITER` | Recibe comandas en sala, atiende mesas, asigna su servicio y confirma entrega del pedido. |
| **Cocinero** | `CHEF` | Pantalla de cocina (KDS). Ve pedidos pendientes de cocción, tiempos y cambia a preparado. |
| **Gerente** | `MANAGER` | Vista global de pedidos, métricas en tiempo real (KPIs), reportes, gestión de stock y personal. |

---

## 3. Historias de Usuario con Criterios BDD (Gherkin)

### HU-01: Visualización del Menú y Opciones de Servicio
**Como** Comensal  
**Quiero** consultar la carta del restaurante con filtros, alérgenos, precios y opciones de empaque  
**Para** armar mi pedido seleccionando explícitamente bolsas, plástico y cubiertos.

- **Criterio 1.1: Visualización categorizada y stock en vivo**
  - **Given** que el comensal accede a la pantalla de menú
  - **When** navega por las categorías (Entrantes, Principales, Postres, Bebidas)
  - **Then** el sistema muestra solo los productos disponibles con precio, ingredientes y stock actual.

- **Criterio 1.2: Selección de opciones de empaque y cubiertos**
  - **Given** que el comensal tiene ítems en su comanda
  - **When** revisa el resumen del pedido
  - **Then** puede marcar si requiere bolsa de transporte, recipientes reciclables/plástico y cantidad de juegos de cubiertos.

---

### HU-02: Procesamiento de Pagos (Stripe / Efectivo) y Propinas
**Como** Comensal  
**Quiero** abonar mi cuenta con tarjeta mediante pasarela de pago o seleccionar pago en efectivo  
**Para** agilizar la salida del restaurante ("Dine & Done") pudiendo incluir propina opcional.

- **Criterio 2.1: Pago con Tarjeta (Stripe Gateway Mock / Producción)**
  - **Given** un pedido pendiente con subtotal calculado
  - **When** el comensal selecciona un porcentaje de propina (0%, 5%, 10%, 15% o personalizado) y método "Tarjeta"
  - **Then** el sistema procesa la transacción de forma segura, emite número de confirmación y cambia el estado a `PAID`.

- **Criterio 2.2: Selección de Pago en Efectivo**
  - **Given** un pedido con propina opcional
  - **When** el comensal elige "Pagar en efectivo en caja/mesa"
  - **Then** el pedido se crea con estado de pago `PENDING_CASH` notificando al camarero asignado.

---

### HU-03: Visualización y Gestión de Comandas para Camareros
**Como** Camarero  
**Quiero** una vista en tiempo real de las comandas activas por mesa  
**Para** llevar los pedidos terminados a los comensales y confirmar el cobro en efectivo.

- **Criterio 3.1: Lista reactiva de comandas**
  - **Given** que hay nuevos pedidos confirmados
  - **When** el camarero abre su panel de sala
  - **Then** visualiza las mesas pendientes ordenadas por tiempo de espera y estado de preparación.

- **Criterio 3.2: Confirmación de entrega**
  - **Given** una comanda con platos en estado `READY_TO_SERVE`
  - **When** el camarero entrega los platos a la mesa y pulsa "Servido"
  - **Then** el estado de la comanda pasa a `DELIVERED`.

---

### HU-04: Kitchen Display System (KDS) para Cocineros
**Como** Cocinero  
**Quiero** ver únicamente las órdenes que requieren preparación en cocina con detalles de preparación  
**Para** optimizar los tiempos de cocción y notificar a sala cuando los platos están listos.

- **Criterio 4.1: Filtrado de requerimientos culinarios**
  - **Given** un pedido entrante que contiene ítems de cocina y bebidas de barra
  - **When** el cocinero revisa el monitor KDS
  - **Then** solo se muestran los ítems que requieren cocción con sus notas especiales.

- **Criterio 4.2: Transición de estados de cocina**
  - **Given** un pedido en estado `PENDING_KITCHEN`
  - **When** el cocinero inicia la elaboración y luego pulsa "Listo"
  - **Then** la orden pasa progresivamente por `IN_PREPARATION` y `COOKED`.

---

### HU-05: Asignación y Visibilidad de Personal por Pedido
**Como** Comensal y Gerente  
**Quiero** ver claramente qué camarero y cocinero están asignados a cada comanda  
**Para** garantizar la trazabilidad del servicio y personalizar la atención.

- **Criterio 5.1: Asignación automática o manual**
  - **Given** una nueva comanda creada
  - **When** ingresa al flujo de preparación
  - **Then** el sistema asigna el cocinero de turno y el camarero responsable del sector/mesa.

---

### HU-06: Control y Descuento Automático de Stock
**Como** Gerente  
**Quiero** que el inventario se descuente automáticamente al confirmar cada pedido  
**Para** evitar vender platos sin existencias y recibir alertas de reposición.

- **Criterio 6.1: Validación de stock previa a la orden**
  - **Given** un producto con 2 unidades en inventario
  - **When** un cliente intenta pedir 3 unidades
  - **Then** el sistema bloquea la acción indicando stock insuficiente.

- **Criterio 6.2: Decremento atómico**
  - **Given** productos en stock suficiente
  - **When** se confirma el pedido
  - **Then** las unidades se descuentan de forma atómica en el repositorio de inventario.

---

### HU-07: Control de Usuarios y Roles
**Como** Gerente  
**Quiero** gestionar el personal del restaurante y alternar perfiles  
**Para** asignar turnos, habilitar camareros/cocineros y garantizar la seguridad del acceso.

---

### HU-08: Métricas, KPIs y Generación de Informes Financieros
**Como** Gerente  
**Quiero** visualizar paneles de métricas (ingresos diarios, ticket promedio, propinas, tiempos de servicio y platos estrella)  
**Para** tomar decisiones operativas y exportar reportes para auditoría.

---

### HU-09: Personalización de Marca y Nombre de Empresa
**Como** Administrador / Dueño  
**Quiero** que el nombre comercial, eslogan y datos del restaurante provengan de `restaurant_config.json`  
**Para** que la aplicación sea multimarca y reconfigurable sin tocar código fuente.

- **Criterio 9.1: Carga dinámica de branding**
  - **Given** un archivo de configuración `restaurant_config.json` con el nombre del restaurante
  - **When** se inicia la aplicación
  - **Then** el encabezado, título del documento y reportes descargables muestran la identidad corporativa definida.

---

### HU-10: Menú Enriquecido con Ingredientes, Alérgenos y Edición en BBDD
**Como** Comensal y Gerente  
**Quiero** consultar los ingredientes y alérgenos de cada plato, y que el gerente pueda ajustar precios y stock en BBDD/repositorio  
**Para** proteger a personas con alergias alimentarias y permitir una gestión flexible de la carta.

- **Criterio 10.1: Visualización de ingredientes y alérgenos**
  - **Given** platos con ingredientes y alérgenos registrados
  - **When** el comensal navega la carta
  - **Then** cada tarjeta muestra la lista de ingredientes y etiquetas destacadas con avisos de alérgenos.

- **Criterio 10.2: Edición de precios y stock desde panel gerencial**
  - **Given** la tabla de inventario en la vista de Gerente
  - **When** el gerente modifica el precio o el stock de un plato y pulsa "Guardar"
  - **Then** los cambios persisten en el repositorio y se reflejan instantáneamente en la carta.

---

### HU-11: Detección Inteligente y Selección de Mesa
**Como** Comensal  
**Quiero** que la aplicación identifique automáticamente mi mesa mediante la URL o me permita seleccionarla manualmente  
**Para** que mi comanda llegue siempre al lugar correcto del restaurante sin confusiones.

- **Criterio 11.1: Lectura por parámetro de URL**
  - **Given** que el cliente accede mediante un código QR o enlace con parámetro `?table=5` o `?mesa=5`
  - **When** la aplicación arranca
  - **Then** se asigna automáticamente "Mesa 5" como mesa activa del comensal.

- **Criterio 11.2: Edición manual de mesa**
  - **Given** la barra de identificación de mesa en la vista de comensal
  - **When** el usuario pulsa "Cambiar Mesa" e introduce un nuevo identificador
  - **Then** la comanda actualiza su destino y se recuerda la preferencia.

---

### HU-12: Autenticación y Acceso Seguro para Personal (Staff Login)
**Como** Empleado del restaurante (Camarero, Cocinero, Gerente)  
**Quiero** autenticarme mediante un botón de acceso arriba a la derecha con selección de perfil  
**Para** desbloquear los paneles de operación interna sin exponer controles a los comensales.

- **Criterio 12.1: Acceso comensal sin login previo**
  - **Given** un comensal que entra a la aplicación
  - **When** visualiza el encabezado superior
  - **Then** no se muestran las pestañas de personal y solo ve el botón "Acceso Empleados".

- **Criterio 12.2: Despliegue de modal y activación de roles de personal**
  - **Given** que un empleado pulsa "Acceso Empleados"
  - **When** selecciona su perfil en el modal (Camarero, Cocinero, Gerente)
  - **Then** se habilitan las pestañas de navegación de personal y el botón "Salir (Comensal)" para cerrar sesión de manera segura.

---

### HU-13: Filtro Excluyente de Alérgenos Alimentarios
**Como** Comensal con intolerancias o alergias  
**Quiero** filtrar la carta seleccionando alérgenos específicos para excluirlos  
**Para** ver únicamente platos 100% seguros para mi consumo.

- **Criterio 13.1: Exclusión reactiva de platos con alérgenos**
  - **Given** el selector de alérgenos en la barra de filtros
  - **When** el comensal selecciona "Excluir Gluten" o cualquier otro alérgeno
  - **Then** el catálogo oculta automáticamente todos los platos que contengan dicho alérgeno.

---

### HU-14: Filtros de Preferencias Dietéticas (Vegano, Vegetariano, 0% Alcohol)
**Como** Comensal con preferencias o restricciones alimentarias  
**Quiero** chips interactivos de filtrado para Vegano, Vegetariano y 0% Alcohol  
**Para** encontrar rápidamente opciones acordes a mi estilo de vida.

- **Criterio 14.1: Activación combinada de filtros dietéticos**
  - **Given** los botones chip de dieta en la carta
  - **When** el comensal pulsa "Vegano" o "0% Alcohol"
  - **Then** la carta muestra exclusivamente los productos que satisfacen todos los filtros activos.

---

### HU-15: Cumplimiento de la Normativa Española sobre Empaques y Bolsas (R.D. 293/2018 y Ley 7/2022)
**Como** Gerente y Comensal  
**Quiero** que el cobro de bolsas plásticas y envases desechables se rija por la legislación española vigente  
**Para** cumplir con la obligación legal de cobro diferenciado y promover la reducción de residuos.

- **Criterio 15.1: Desglose específico de empaque en comanda y factura**
  - **Given** la sección de empaque en la bandeja de pedido
  - **When** el comensal solicita bolsa (+0.10 € según R.D. 293/2018), envase para llevar (+0.15 € según Ley 7/2022) o cubiertos ecológicos (+0.10 €/ud)
  - **Then** el sistema detalla cada concepto como línea independiente sujeta a normativa y lo suma al total a pagar.

---

### HU-16: Desacoplamiento de Marca: Identidad del Restaurante vs Software "Dine & Done"
**Como** Propietario del restaurante  
**Quiero** que la cabecera muestre únicamente el nombre de mi establecimiento y "Dine & Done" aparezca en el footer  
**Para** mantener una identidad visual propia en sala mientras se reconoce la tecnología de software en el pie de página.

- **Criterio 16.1: Encabezado limpio con nombre de restaurante**
  - **Given** el encabezado superior
  - **When** se renderiza la web
  - **Then** no aparece la marca "Dine & Done" en la barra de navegación superior, sino el nombre configurado del local.

- **Criterio 16.2: Pie de página con Powered by, redes y enlaces legales**
  - **Given** el footer inferior
  - **When** el usuario baja hasta el final de la página
  - **Then** encuentra el sello "Powered by Dine & Done © 2026", enlaces a Términos, Privacidad, Cookies, Aviso Legal y redes sociales.

---

### HU-17: Sistema Multilingüe Internacional (i18n)
**Como** Turista o cliente internacional  
**Quiero** cambiar el idioma de la aplicación (Español, Inglés, Francés, Alemán) desde la cabecera  
**Para** comprender todos los textos de la interfaz, nombres de platos, ingredientes y notas legales en mi lengua materna.

- **Criterio 17.1: Traducción reactiva sin recarga de página**
  - **Given** el selector de idioma en la parte superior derecha
  - **When** el usuario selecciona "EN", "FR" o "DE"
  - **Then** todos los títulos, botones, filtros, opciones de empaque y nombres/ingredientes de la carta se actualizan instantáneamente al idioma seleccionado.

---

### HU-18: Experiencia Totalmente Responsive para Móviles y Tablets (Mobile-First UX)
**Como** Comensal que pide desde su teléfono móvil o camarero/cocinero que utiliza una tablet  
**Quiero** una interfaz táctil, ágil y adaptada ergonómicamente a cualquier tamaño de pantalla  
**Para** realizar pedidos con una sola mano, navegar fluidamente y gestionar comandas sin desbordamientos visuales.

- **Criterio 18.1: Barra flotante inferior de comanda en móviles y tablets**
  - **Given** un comensal agregando platos desde un dispositivo móvil o tablet (<= 1024px)
  - **When** la comanda contiene al menos 1 ítem
  - **Then** aparece una barra flotante inferior con el total y un botón destacado "Ver Pedido".

- **Criterio 18.2: Cajón deslizable (Bottom Sheet Drawer) para el carrito**
  - **Given** la barra flotante activa en móvil
  - **When** el usuario pulsa "Ver Pedido"
  - **Then** el panel de comanda se despliega suavemente desde la parte inferior con fondo difuminado, permitiendo revisar platos, ajustar empaques y confirmar el pedido cómodamente.

- **Criterio 18.3: Desplazamiento horizontal táctil y cuadrículas responsivas**
  - **Given** filtros de categoría, chips dietéticos y selector de alérgenos
  - **When** se navega desde un teléfono inteligente
  - **Then** los elementos permiten desplazamiento horizontal táctil suave sin saltos de línea molestos ni desbordamientos horizontales.


