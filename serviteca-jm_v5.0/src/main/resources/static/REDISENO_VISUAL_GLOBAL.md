# PRODISJM / Serviteca JM — Rediseño visual global

## Alcance

Se unificó la apariencia de las vistas públicas y administrativas con una identidad de taller automotriz basada en verde bosque oscuro + dorado mate.

### Paleta principal

- Verde fondo: `#0B130E`
- Verde bosque: `#12291E`
- Verde medio: `#1B3628`
- Dorado mate: `#D4A373`
- Dorado hover: `#C29263`
- Verde de estado: `#2ECC71`
- Texto principal: `#F8F9F7`
- Texto secundario: `#9CAEA3`

## Archivos principales modificados

- `serviteca-theme.css`: sistema visual global y responsive.
- `floating-actions.js`: componente común de WhatsApp flotante.
- `chatbot.js`: colores y posición del Asistente JM.
- Vistas HTML: orden de hojas CSS normalizado y carga del componente flotante/chatbot.
- `index.html`: ajuste de navegación y uso del tema global.
- `taller-hero.png`: imagen local para la portada principal.

## Comportamiento flotante

- WhatsApp: `bottom: 20px; right: 20px; z-index: 10000`.
- Chatbot: `bottom: 85px; right: 20px; z-index: 10001`.
- En móvil ambos se recolocan conservando separación y tamaño táctil adecuado.

## Componentes unificados

- Sidebar y topbar.
- Botones primarios, secundarios y de estado.
- Tarjetas y paneles.
- KPIs.
- Formularios e inputs.
- Tablas y encabezados.
- Badges de estado.
- Stepper de Nueva Cita.
- Listas de técnicos.
- Reportes y barras de progreso.
- Facturación con modo de impresión/PDF legible.
- Portada pública con hero de taller y superposición oscura.

## Validación

- Todas las hojas CSS del proyecto: sin errores de parseo.
- Todos los archivos JavaScript del proyecto: sintaxis válida con Node.
- Las vistas principales cargan `serviteca-theme.css` como última hoja local para controlar el tema global.
