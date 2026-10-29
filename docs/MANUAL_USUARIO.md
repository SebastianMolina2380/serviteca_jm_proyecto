# Manual de usuario — Serviteca JM

Guía práctica para el personal del taller y para los clientes.
Última actualización: **Fase 4 — accesibilidad, app móvil y entrega final**.

---

## 1. ¿Qué es Serviteca JM?

Es el sistema de gestión del taller Serviteca JM. Permite:

- Registrar clientes y vehículos.
- Agendar citas y controlar los servicios.
- Administrar inventario y proveedores.
- Emitir documentos de venta y registrar pagos.
- Consultar reportes de ventas, citas y servicios.
- Que cada cliente consulte su historial desde la web o desde la app móvil.

El sistema tiene tres tipos de usuario:

| Rol | Para quién |
|---|---|
| **Administrador** | Dueño o responsable general del taller. Acceso completo. |
| **Técnico** | Mecánicos y asesores de servicio. Operación diaria del taller. |
| **Cliente** | Propietario de un vehículo. Solo consulta y agenda lo propio. |

---

## 2. Cómo ingresar

### 2.1 Desde el navegador

1. Abre `http://localhost:8082` o la dirección que te indique el administrador.
2. Pulsa **Iniciar sesión**.
3. Selecciona tu rol: **Cliente**, **Técnico** o **Admin**.
4. Escribe tu correo y contraseña.
5. Pulsa **Entrar**.

> El rol elegido debe coincidir con el rol real de tu cuenta. Si no coincide,
> el sistema muestra «Correo, contraseña o rol incorrectos».

### 2.2 Si olvidaste la contraseña

1. En el login pulsa **¿Olvidaste tu contraseña?**.
2. Escribe el correo de tu cuenta.
3. Revisa tu bandeja de entrada y abre el enlace de recuperación.
4. Define una contraseña nueva.

Por seguridad, el sistema responde lo mismo aunque el correo no exista. El
enlace es de un solo uso y vence a los 30 minutos (configurable).

### 2.3 Desde la app móvil

1. Instala la app **Serviteca JM** o ábrela en Expo Go.
2. Elige el rol y escribe correo y contraseña.
3. La sesión queda guardada de forma segura en el teléfono.

Si la sesión vence, la app vuelve automáticamente al login y muestra
«Tu sesión expiró. Inicia sesión nuevamente.».

---

## 3. Pantalla de inicio (Dashboard)

Al ingresar como **Administrador** o **Técnico** verás:

- **Indicadores del día:** total de servicios, en proceso, programados y
  completados.
- **Servicios recientes** con su estado y barra de progreso.
- **Citas programadas**.
- Accesos rápidos a los módulos del menú lateral.

El cliente ve una versión reducida con sus propios servicios y citas.

---

## 4. Módulos del sistema

### 4.1 Citas

**Ruta:** menú lateral → **Citas**.

- Consulta las citas por estado, fecha o cliente.
- Usa el buscador y los filtros para encontrar una cita.
- Pulsa una cita para ver el detalle.
- El **Administrador** y el **Técnico** pueden confirmar, completar o
  reasignar una cita.
- El **Cliente** solo puede cancelar sus propias citas.

**Crear una cita:** menú → **Nueva Cita**.

1. Selecciona el cliente y el vehículo.
2. Elige fecha y hora.
3. Revisa el resumen y confirma.
4. El sistema evita duplicados de horario para el mismo vehículo.

### 4.2 Clientes

**Ruta:** menú lateral → **Clientes**.

- Lista paginada de clientes con búsqueda por nombre, documento o correo.
- **Administrador:** puede crear, editar y desactivar clientes.
- **Técnico:** puede consultar y crear clientes, pero no editarlos ni
  desactivarlos.
- La desactivación es **lógica**: el cliente deja de aparecer en los listados,
  pero su historial se conserva.

### 4.3 Vehículos

**Ruta:** menú lateral → **Vehículos**.

- Consulta los vehículos activos.
- Abre un vehículo para ver su historial de servicios y citas.
- Registra un vehículo con placa, marca, modelo, color y kilometraje.
- La placa se guarda en mayúsculas y sin espacios.
- El sistema no permite dos vehículos con la misma placa.
- La eliminación es lógica: el vehículo queda inactivo y conserva su historial.

### 4.4 Servicios

- Un servicio representa un trabajo realizado o programado sobre un vehículo.
- Tiene tipo, descripción, precio, estado, progreso y fecha.
- Estados habituales: `PROGRAMADO`, `EN_PROCESO`, `COMPLETADO`, `CANCELADO`.
- El **Cliente** solo ve los servicios de sus vehículos.

### 4.5 Inventario y proveedores

**Ruta:** menú lateral → **Inventario**.

- Consulta productos, existencias y alertas de stock bajo.
- Registra entradas y salidas de inventario.
- Administra proveedores.
- El sistema bloquea la fila durante una actualización para evitar pérdidas de
  stock cuando dos personas trabajan a la vez.
- Solo **Administrador** y **Técnico** acceden a este módulo.

### 4.6 Facturación

**Ruta:** menú lateral → **Facturación**.

- Consulta los documentos de venta emitidos.
- Abre un documento para ver cliente, vehículo, ítems, IVA y total.
- Usa **PDF / Imprimir** y elige «Guardar como PDF» en el diálogo del navegador.
- Usa **Excel** para descargar el listado en un formato compatible.
- Solo el **Administrador** puede eliminar documentos.

> **Importante:** el sistema emite un **documento de venta comercial interno**.
> No es una factura electrónica validada por la DIAN. No incluye XML, firma
> electrónica, CUFE ni QR.

### 4.7 Registrar pago

**Ruta:** menú lateral → **Registrar pago**.

1. Selecciona el documento de venta.
2. Escribe el valor y el medio de pago.
3. Confirma.

Cada pago lleva una clave de idempotencia: si se reintenta por un fallo de red,
el sistema no duplica el cobro.

### 4.8 Reportes

**Ruta:** menú lateral → **Reportes**.

1. Elige el rango de fechas.
2. Consulta ventas, citas y servicios.
3. Exporta a **CSV**, **Excel** o **PDF**.

Solo **Administrador** y **Técnico** acceden a los reportes globales.

### 4.9 Portal del cliente

El cliente puede consultar:

- Sus vehículos.
- Sus citas.
- Sus servicios e historial.
- Sus documentos de venta.

El sistema obtiene el usuario de la sesión, no de un identificador enviado por
el navegador. Por eso un cliente nunca puede ver datos de otro.

---

## 5. App móvil

### 5.1 Ingreso

1. Abre la app.
2. Selecciona el rol.
3. Escribe correo y contraseña.
4. Pulsa **Iniciar sesión**.

### 5.2 Pantallas

| Pantalla | Uso |
|---|---|
| **Inicio** | Resumen de servicios y citas. Desliza para actualizar. |
| **Solicitar** | Registra tu vehículo y agenda una cita. |
| **Vehículos** | Consulta y registra tus vehículos. |

### 5.3 Solicitar mantenimiento

1. Si aún no tienes vehículo, regístralo con placa, marca, modelo, color y
   kilometraje.
2. Selecciona el vehículo.
3. Pulsa **Fecha** y elige el día en el calendario nativo.
4. Pulsa **Hora** y elige la hora en el selector nativo.
5. Pulsa **Enviar solicitud de cita**.

La cita queda **PENDIENTE** y el taller la confirma.

### 5.4 Empleados en la app

El **Técnico** y el **Administrador** pueden crear una cita o un servicio
directamente:

1. Selecciona el vehículo.
2. Elige **Cita** o **Servicio**.
3. Completa fecha, hora y, si es servicio, tipo, descripción y precio.
4. Confirma.

### 5.5 Cerrar sesión

Usa el botón de salida de la pantalla de inicio. La cookie y el perfil se
eliminan del almacenamiento seguro del teléfono.

---

## 6. Accesibilidad y uso cómodo

- Puedes **ampliar la página** con `Ctrl` + `+` / `Ctrl` + `-` o con los gestos
  de zoom del navegador y del teléfono. El sistema ya no bloquea el zoom.
- Todos los campos y botones muestran un **borde de foco** al navegar con
  `Tab`, para que sepas dónde estás.
- Los formularios tienen etiquetas visibles y mensajes de error claros.
- En el celular, los campos usan un tamaño de letra que evita el zoom
  automático al escribir.
- Si usas lector de pantalla, los botones principales tienen nombres
  accesibles.

---

## 7. Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| No puedo entrar y el rol es correcto | Verifica mayúsculas del correo y la contraseña. Si persiste, usa la recuperación o contacta al administrador. |
| La app dice «No se pudo conectar con el servidor» | El backend debe estar encendido y el teléfono en la misma red. El administrador debe revisar `EXPO_PUBLIC_API_URL`. |
| La app me devolvió al login | La sesión venció. Vuelve a ingresar. |
| No veo un cliente que desactivé | La desactivación es lógica: el historial se conserva, pero el cliente ya no aparece en los listados. |
| ¿Por qué no puedo editar un cliente como Técnico? | El rol Técnico solo consulta y crea clientes; la edición es exclusiva del Administrador. |
| ¿Puedo registrar el mismo vehículo dos veces? | No. La placa es única. |
| ¿El documento de venta sirve para la DIAN? | No. Es un documento comercial interno sin validación electrónica. |
| ¿Cómo recupero un reporte? | Ve a **Reportes**, elige el rango y exporta en CSV, Excel o PDF. |
| ¿Dónde cambio mi contraseña? | En el login, opción **¿Olvidaste tu contraseña?**, o desde tu perfil si el administrador habilitó la edición. |
| La página se ve pequeña | Usa el zoom del navegador; el sistema permite ampliar sin restricciones. |

---

## 8. Buenas prácticas

- Cierra sesión al terminar en un equipo compartido.
- No compartas tu contraseña ni la escribas en papeles visibles.
- Revisa el estado de una cita antes de confirmarla.
- Registra los pagos en el mismo día para mantener los reportes al día.
- Antes de desactivar un cliente o vehículo, verifica que no tenga procesos
  abiertos.
- Reporta al administrador cualquier comportamiento extraño o mensaje de error.

---

## 9. Soporte

| Contacto | Datos |
|---|---|
| Correo | sebastiandavidmolinarivera2380@gmail.com · sergioaguilartibata@gmail.com |
| Programa | Tecnología en Análisis y Desarrollo de Software — SENA |
| Ficha | 3171149-B |
| Repositorio | https://github.com/SebastianMolina2380/serviteca_jm_proyecto |

Para soporte técnico, indica la pantalla, la acción realizada y el mensaje de
error exacto.
