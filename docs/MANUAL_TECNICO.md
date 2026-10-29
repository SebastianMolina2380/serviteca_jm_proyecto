# Manual técnico — Serviteca JM (PRODISJM)

Documento de referencia para desarrolladores y administradores técnicos.
Última actualización: **Fase 4 — accesibilidad, app móvil y entrega final**.

---

## 1. Descripción general

Serviteca JM es un sistema de gestión para un taller automotriz ubicado en
Tunja, Boyacá. Integra:

- Un **backend Spring Boot 3.3.5 / Java 17** con API REST y sesión HTTP.
- Un **frontend web estático** (HTML, CSS y JavaScript) servido por el backend.
- Una **app móvil React Native + Expo** para clientes y empleados.

Proyecto académico del programa **Tecnología en Análisis y Desarrollo de
Software (ADSO)** del SENA, ficha 3171149-B.

| Componente | Tecnología |
|---|---|
| Backend | Java 17, Spring Boot 3.3.5, Spring Web, Spring Data JPA, Spring Security, Bean Validation, Lombok |
| Base de datos | PostgreSQL 15+ (validado con PostgreSQL 17), Flyway |
| Documentación API | SpringDoc OpenAPI / Swagger UI |
| Monitoreo | Spring Boot Actuator (`health`, `info`) |
| Pruebas | JUnit 5, MockMvc, Spring Security Test, GitHub Actions |
| Despliegue | Docker multietapa + Docker Compose |
| Frontend web | HTML5, CSS3, JavaScript sin framework |
| App móvil | React Native 0.86, Expo SDK 57, expo-secure-store, datetimepicker |

---

## 2. Estructura del repositorio

```text
serviteca_jm_proyecto/
├── README.md                          # Portada y guía rápida
├── docs/
│   ├── MANUAL_TECNICO.md              # Este documento
│   ├── MANUAL_USUARIO.md              # Guía funcional
│   └── GUIA_DESPLIEGUE.md             # Instalación y producción
├── docker-compose.yml                 # PostgreSQL 17 + aplicación
├── .env.example                       # Plantilla de secretos de Compose
├── .github/workflows/ci.yml           # Compilación, pruebas y Docker
├── serviteca-jm_v5.0/                 # Backend + frontend web
│   ├── Dockerfile                     # Build multietapa JDK 17 → JRE 17
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/
│       ├── main/
│       │   ├── java/com/serviteca/
│       │   │   ├── config/            # Seguridad, OpenAPI, admin inicial, rate limit
│       │   │   ├── configuracion/     # Datos fiscales de referencia
│       │   │   ├── controladores/     # Controladores REST
│       │   │   ├── DTOs/              # Objetos de transferencia
│       │   │   ├── Mapper/            # Conversores entidad ↔ DTO
│       │   │   ├── modelos/           # Entidades JPA
│       │   │   ├── repository/        # Repositorios Spring Data
│       │   │   ├── servicios/         # Lógica de negocio
│       │   │   └── util/              # Utilidades (normalización de placas)
│       │   └── resources/
│       │       ├── application.properties
│       │       ├── application-dev.properties
│       │       ├── application-prod.properties
│       │       ├── db/
│       │       │   ├── schema.sql
│       │       │   ├── migracion_*.sql
│       │       │   └── migration/     # V1–V3 aplicadas por Flyway
│       │       └── static/            # HTML, CSS, JS e imágenes
│       └── test/                      # Unitarias + integración MockMvc
└── serviteca-app/                     # App móvil
    ├── app.json                       # Configuración estática de Expo
    ├── app.config.js                  # URL del backend por entorno
    ├── eas.json                       # Perfiles de compilación
    ├── .env.example                   # Plantilla de EXPO_PUBLIC_API_URL
    ├── assets/                        # Icono, adaptive icon, splash, favicon
    └── src/
        ├── components/                # Button, Card, Input, DatePickerField…
        ├── config/env.js              # Resolución de la URL de la API
        ├── context/AuthContext.js     # Sesión y usuario
        ├── navigation/                # Login / pestañas principales
        ├── screens/                   # Login, Dashboard, Solicitar, Vehículos
        ├── services/                  # api.js, secureStorage.js, servicios REST
        ├── theme/                     # Colores institucionales
        └── utils/                     # Formatos
```

Arquitectura del backend: **Controllers → Services → Repositories → DTOs/Entities**.

---

## 3. Modelo de datos y migraciones

### 3.1 Tablas

El esquema canónico de referencia está en
`serviteca-jm_v5.0/src/main/resources/db/schema.sql` y contiene 14 tablas:

`usuario`, `vehiculo`, `cita`, `servicio`, `producto`, `proveedor`,
`inventario`, `factura`, `detalle_factura`, `pago_factura`,
`numeracion_factura`, `seguimiento`, `password_reset_token`,
`mensaje_contacto`.

### 3.2 Flyway

`spring.jpa.hibernate.ddl-auto=none`: Hibernate nunca crea ni modifica el
esquema. **Flyway es la única fuente automática de DDL** y aplica las
migraciones al arrancar:

| Versión | Contenido |
|---|---|
| `V1__esquema_canonico.sql` | Esquema inicial completo (tablas, índices y restricciones). |
| `V2__borrado_logico_e_integridad.sql` | `vehiculo.estado`, índice único parcial de citas y claves foráneas fiscales `RESTRICT`. |
| `V3__recuperacion_password_y_contacto.sql` | `password_reset_token` y `mensaje_contacto`. |
| `V4__alineacion_esquema_heredado.sql` | Alinea las bases pre-Flyway: secuencia de `factura`, tipos `BIGINT` de rango, columnas obligatorias, índices y unicidad. |

`baseline-on-migrate=true` con `baseline-version=1` permite incorporar una base
creada manualmente (v5 o `schema.sql`) sin perder datos: Flyway la marca como
versión 1 y aplica solo los deltas (V2, V3 y V4). **No uses `baseline-version=0`**:
intentaría ejecutar V1 sobre tablas ya existentes y el arranque fallaría con
`no existe la columna «estado»`.

Verificación:

```sql
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

Las versiones 1, 2 y 3 deben aparecer con `success = true`. **No edites una
migración ya aplicada**: crea `V4__...sql`.

### 3.3 Numeración y alcance fiscal

La fila de `numeracion_factura` se configura manualmente antes de emitir
documentos. El sistema genera un **documento de venta comercial interno**; no
produce XML, firma electrónica, CUFE, QR ni transmisión a la DIAN. Por eso se
presenta como documento de venta y **no debe distribuirse como factura
electrónica validada**.

Para parametrizar la facturación:

1. Definir `SERVITECA_EMISOR_*`, `SERVITECA_SOFTWARE_*` y
   `SERVITECA_RESPONSABILIDADES_FISCALES` con los datos reales del RUT.
2. Insertar una única fila en `numeracion_factura` (prefijo, autorización,
   rango, consecutivo y vigencia).
3. Clasificar `tarifa_iva` por producto o servicio (porcentaje, por ejemplo
   `19.00`). No se asigna una tasa predeterminada.
4. Completar los datos fiscales de cada cliente.

Si faltan datos del emisor, numeración, adquirente o tarifa, el backend rechaza
la emisión.

---

## 4. Configuración y perfiles

`application.properties` contiene la configuración común. El perfil se elige con
`SERVITECA_PROFILE` (`dev` por defecto).

| Perfil | Uso | Particularidades |
|---|---|---|
| `dev` | Desarrollo local | Swagger activo, SQL opcional, cookie `Secure` desactivada por defecto, pool de 10 conexiones. |
| `prod` | Producción | Swagger desactivado por defecto, cookie `Secure` activa por defecto, pool de 20 conexiones, credenciales obligatorias. |

La tabla completa de variables está en
[`GUIA_DESPLIEGUE.md`](GUIA_DESPLIEGUE.md#3-variables-de-entorno).

### 4.1 Administrador inicial

`InitialAdminBootstrap` crea el primer administrador **solo** si el perfil
`prod` está activo y la tabla `usuario` está vacía. Exige:

| Variable | Requisito |
|---|---|
| `INITIAL_ADMIN_NAME` | Nombre |
| `INITIAL_ADMIN_DOCUMENT` | Documento |
| `INITIAL_ADMIN_EMAIL` | Correo válido |
| `INITIAL_ADMIN_PASSWORD` | Mínimo 16 caracteres |
| `INITIAL_ADMIN_DOCUMENT_TYPE` | Opcional, por defecto `CC` |

Después de verificar el acceso, retira esas variables del entorno.

---

## 5. Seguridad

- Contraseñas con **BCrypt**.
- Sesiones HTTP con `SecurityContextRepository` y rotación de ID
  (`changeSessionId()`) al iniciar sesión para prevenir *session fixation*.
- Cookie `SERVITECASESSION` con `HttpOnly`, `SameSite=Lax`, `Secure`
  configurable y sin ID de sesión en la URL.
- **Rate limiting** en `/api/auth/login`: 5 fallos por ventana de 15 minutos
  (por IP y por IP + correo), bloqueo de 15 minutos, respuesta `429` y cabecera
  `Retry-After`.
- Mensajes de login genéricos: no revelan si el correo existe ni su rol.
- Autorización por método (`@PreAuthorize`) y por ruta (`SecurityConfig`).
- Validación de propiedad en citas y vehículos: un `CLIENTE` solo accede a sus
  propios registros. Las citas ajenas responden `404` para no revelar su
  existencia.
- **Borrado lógico** (`estado = INACTIVO`) en usuario, vehículo y cita; las citas
  se conservan como `CANCELADA`.
- Sin cascadas JPA destructivas. Facturas y pagos protegidos con
  `ON DELETE RESTRICT`.
- Facturas inmutables después de emitidas (`@PreUpdate`).
- Pagos con clave de **idempotencia** única.
- Bloqueo pesimista (`PESSIMISTIC_WRITE`) en numeración de factura e inventario.
- Errores controlados con `ApiExceptionHandler` (`400`, `401`, `403`, `404`,
  `409`, `429`). El error inesperado no expone trazas.
- Recuperación de contraseña con token aleatorio de 32 bytes, hash SHA-256, un
  solo uso, expiración configurable y respuesta genérica.
- Placas normalizadas con `PlacaUtil` (mayúsculas, sin espacios, conservando
  guiones).

### 5.1 Riesgos pendientes

Estos puntos **no** forman parte de la entrega actual y deben resolverse antes de
exponer el sistema a internet:

- **CSRF deshabilitado** con autenticación por sesión.
- **HTTPS** debe terminarse en un proxy inverso (nginx, Caddy, balanceador).
- Revocación inmediata de sesiones al desactivar un usuario.
- Facturación electrónica DIAN completa (XML, firma, CUFE, QR, transmisión).
- Rotar cualquier credencial que haya estado en el historial de Git.

---

## 6. API REST principal

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Inicio de sesión |
| `GET` | `/api/auth/me` | Usuario autenticado |
| `POST` | `/api/auth/logout` | Cierre de sesión |
| `POST` | `/api/auth/password/forgot` | Solicita recuperación (respuesta genérica) |
| `POST` | `/api/auth/password/reset` | Restablece con token de un solo uso |
| `POST` | `/api/contacto` | Mensaje de la landing |
| `GET` | `/api/vehiculos` | Listado según rol (solo activos) |
| `GET` | `/api/vehiculos/{id}` | Vehículo por ID |
| `POST` | `/api/vehiculos` | Crear vehículo |
| `PUT` | `/api/vehiculos/{id}` | Actualizar vehículo |
| `DELETE` | `/api/vehiculos/{id}` | Baja lógica |
| `GET/POST` | `/api/clientes` | Listado paginado (`page`, `size`, `q`) y creación |
| `GET` | `/api/clientes/catalogo` | Catálogo para selectores |
| `PUT` | `/api/clientes/{id}` | Actualizar cliente (`ADMIN`) |
| `DELETE` | `/api/clientes/{id}` | Baja lógica (`ADMIN`) |
| `GET/POST` | `/api/citas` | Listar/crear citas |
| `DELETE` | `/api/citas/{id}` | Cancelar cita |
| `GET/POST` | `/api/servicios` | Listado paginado y creación |
| `GET` | `/api/servicios/catalogo` | Catálogo de servicios |
| `GET/POST` | `/api/productos` | Productos (`ADMIN`/`TECNICO`) |
| `GET` | `/api/productos/catalogo` | Catálogo de productos |
| `GET/POST` | `/api/inventarios` | Inventario (`ADMIN`/`TECNICO`) |
| `GET/POST` | `/api/proveedores` | Proveedores |
| `GET/POST` | `/api/facturas` | Documentos de venta |
| `POST` | `/api/facturas/{idFactura}/pagos` | Registrar pago idempotente |
| `GET/POST` | `/api/seguimientos` | Seguimiento (`ADMIN`/`TECNICO`) |
| `GET` | `/api/dashboard` | KPIs y listas del día |
| `GET` | `/api/reportes` | Reporte agregado por rango |
| `GET` | `/api/reportes/export` | Exporta CSV, Excel o PDF |

Los endpoints paginados devuelven `content`, `totalElements`, `totalPages` y
`number`. Los selectores deben usar los endpoints `/catalogo`.

Documentación interactiva (perfil `dev` o `SERVITECA_API_DOCS=true`):

- `http://localhost:8082/swagger-ui.html`
- `http://localhost:8082/v3/api-docs`

---

## 7. Frontend web y accesibilidad

### 7.1 Organización

Cada vista HTML carga su hoja específica y, al final, las capas globales:

```text
vista.css → styles.css → serviteca-theme.css → serviteca-premium.css → accesibilidad.css
```

`acciones.js`, `role-guard.js`, `layout.js`, `floating-actions.js` y
`chatbot.js` completan la capa de interacción.

`role-guard.js` es el **arranque de sesión** de las vistas privadas. Se carga en
el `<head>`, oculta el documento mientras valida `/api/auth/me` y solo aplica el
menú y muestra la página cuando el rol está resuelto. Así un cliente nunca ve el
menú de Administrador ni siquiera un instante. Expone `window.JM.ready`, una
promesa que resuelve con `{ usuario, rol }`, para que cada vista espere antes de
pedir datos y no decida por su cuenta a partir de `localStorage`.

La autorización real la aplica Spring Security: si un cliente abre una página de
staff, el backend responde `302` hacia `portal-cliente.html`; si no hay sesión,
`302` hacia `login.html?next=...`. Las llamadas de API (`fetch`) siguen
recibiendo `401`/`403` en JSON.

### 7.2 Accesibilidad (Fase 4)

- Se eliminó `maximum-scale=1.0, user-scalable=no` de las 16 vistas que lo
  declaraban. Todas usan ahora `width=device-width, initial-scale=1`, por lo que
  el zoom del navegador funciona (WCAG 1.4.4).
- `accesibilidad.css` es la capa final y define:
  - Tokens `--jm-field-*` para fondo, texto, borde, placeholder y anillo de
    foco.
  - Foco visible homogéneo (`:focus-visible`, 3 px, con offset) para enlaces,
    botones, campos y elementos con `tabindex`.
  - Altura mínima de 44 px en campos, contraste de etiquetas y placeholders,
    estados `aria-invalid`, tamaño de 18 px en casillas y `16px` en móvil para
    evitar el zoom automático de iOS.
  - Utilidad `.sr-only` y respeto a `prefers-reduced-motion` y
    `forced-colors`.
- Se retiraron los `!important` de las reglas de formularios, foco y etiquetas
  de `serviteca-theme.css`, `serviteca-premium.css`, `styles.css`, `citas.css`,
  `dashboard.css`, `index.css`, `inventario.css`, `nueva-cita.css`,
  `portal-cliente.css` y `usuarios.css`. El color de los campos ya no se fuerza
  globalmente: se hereda de los tokens y cada vista declara su variante con
  mayor especificidad y sin `!important`.
- Las variantes oscuras (formulario de contacto de la landing y modal de
  inventario) conservan su propio contraste mediante selectores de ID.

### 7.3 Vistas principales

`index.html` (landing), `login.html`, `recuperar.html`, `dashboard.html`,
`citas.html`, `nueva-cita.html`, `clientes.html`, `vehiculo.html`,
`usuarios.html`, `nuevo-usuario.html`, `inventario.html`, `facturacion.html`,
`factura_elect_teca_jm.html`, `registrar-pago.html`, `reportes.html` y
`portal-cliente.html`.

`manifest.json` y el service worker permiten instalar la web como PWA y
mantener los recursos actualizados en modo *network-first*.

---

## 8. App móvil

### 8.1 Configuración del backend

La URL ya no está hardcodeada. `app.config.js` lee
`EXPO_PUBLIC_API_URL` y la expone en `extra.apiUrl`. `src/config/env.js` resuelve
en este orden:

1. `EXPO_PUBLIC_API_URL`.
2. `extra.apiUrl` del build.
3. IP detectada por Expo (`hostUri`) y puerto `8082`.
4. `http://localhost:8082/api`.

Si la URL no termina en `/api`, se agrega automáticamente. El archivo
`serviteca-app/.env.example` documenta el formato.

```powershell
cd serviteca-app
Copy-Item .env.example .env
# Edita .env con la IP o el dominio real
npx expo start
```

### 8.2 Sesión segura

- La cookie `SERVITECASESSION` (con respaldo `JSESSIONID`) se guarda con
  **expo-secure-store** en Android/iOS (Keychain / Keystore).
- El perfil del usuario también se guarda en SecureStore.
- En web se usa AsyncStorage como respaldo, porque SecureStore no existe en el
  navegador.
- Al primer arranque se migran las claves antiguas `@serviteca_jm/...` desde
  AsyncStorage y se eliminan.

### 8.3 Sesión expirada (HTTP 401)

`src/services/api.js` detecta `401`, borra la cookie y notifica a
`AuthContext`. El contexto elimina el usuario y `RootNavigator` vuelve a mostrar
el login. El mensaje es «Tu sesión expiró. Inicia sesión nuevamente.».
El `401` del propio `/auth/login` se muestra como error de credenciales y no
como sesión expirada.

### 8.4 Fecha y hora

`DatePickerField` usa `@react-native-community/datetimepicker` en Android e
iOS. En Android abre el diálogo nativo; en iOS muestra un selector tipo
*spinner* con botón **Listo**. En web se resuelve con
`DatePickerField.web.js` y campos de texto con el formato de la API
(`AAAA-MM-DD` y `HH:MM`).

### 8.5 Assets

`assets/` contiene `icon.png` (1024×1024), `adaptive-icon.png` (1024×1024),
`splash.png` (1284×2778) y `favicon.png`. El icono, el *adaptive icon* y el
favicon se declaran en `app.json`; el *splash* se configura únicamente en el
plugin `expo-splash-screen` (en SDK 57 la clave `splash` de nivel superior ya no
es válida).

### 8.6 Validación local

```powershell
cd serviteca-app
npx expo-doctor
npx expo config --type public
npx expo export --platform android --output-dir dist-test
```

`expo-doctor` debe pasar las 21 comprobaciones. El export debe terminar con
«Android Bundled» y generar el bundle sin errores. `dist-test/` es temporal:
bórralo cuando termines.

---

## 9. Pruebas y CI

### 9.1 Suite local

```powershell
cd serviteca-jm_v5.0
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:SERVITECA_TEST_DB_URL = "jdbc:postgresql://localhost:5432/serviteca_test"
$env:SERVITECA_TEST_DB_USER = "postgres"
$env:SERVITECA_TEST_DB_PASSWORD = "tu_contraseña"
.\mvnw.cmd clean verify
```

La suite tiene **31 pruebas** (7 unitarias y 24 de integración) y cubre:

| Área | Cobertura |
|---|---|
| Seguridad | 401 sin sesión, login por rol, 403 de `CLIENTE`, Actuator público, OpenAPI. |
| Reportes | Resumen por rango y exportaciones CSV, Excel y PDF con su tipo MIME. |
| Vehículos | Normalización de placa, duplicados `409`, aislamiento entre clientes, baja lógica. |
| Cuenta | Contacto persistido, recuperación genérica y token de un solo uso. |
| Bootstrap | Creación del `ADMIN` en base vacía y validación de variables. |

Las pruebas de integración se omiten si no existe `SERVITECA_TEST_DB_URL`. No
uses una base con datos reales.

### 9.2 Integración continua

`.github/workflows/ci.yml` se ejecuta en cada pull request y en push a
`main`/`master`:

1. Configura JDK 17 (Temurin) con caché de Maven.
2. Levanta `postgres:17-alpine` como service container con `serviteca_test`.
3. Ejecuta `./mvnw -B -ntp clean verify`.
4. Publica los informes de Surefire.
5. Valida `docker-compose.yml`.
6. Construye la imagen Docker del backend.

---

## 10. Estado de calidad y trazabilidad

| Fase | Alcance | Resultado |
|---|---|---|
| 0 | Contratos POST/PUT de vehículos, limpieza de archivos muertos, `schema.sql` canónico, contraseña obligatoria. | Completada |
| 1 | IDOR en citas, seguimientos y permisos, borrado lógico, FKs fiscales, rotación de sesión, rate limiting. | Completada |
| 2 | Reportes reales y exportaciones, recuperación de contraseña, contacto persistido, dashboard, paginación, roles unificados. | Completada |
| 3 | Flyway V1–V3, perfiles `dev`/`prod`, Docker, 31 pruebas, CI, OpenAPI, Actuator. | Completada |
| 4 | Accesibilidad web, endurecimiento de la app móvil, assets, migración `V4` de bases heredadas y documentación final. | Completada |

Estado de la entrega:

- Backend compila y pasa `clean verify`.
- Docker Compose levanta PostgreSQL 17 y la aplicación con healthcheck.
- Frontend sin bloqueo de zoom y con foco visible homogéneo.
- App móvil sin URL hardcodeada, con SecureStore, manejo de `401`, selectores
  nativos y assets declarados.
- Documentación consolidada en tres manuales y un README de portada.

**Pendientes fuera de alcance:** CSRF, HTTPS obligatorio, revocación inmediata
de sesiones, pruebas de carga, facturación electrónica DIAN completa y
rotación de credenciales históricas.

---

## 11. Referencias

- [`README.md`](../README.md) — portada y guía rápida.
- [`MANUAL_USUARIO.md`](MANUAL_USUARIO.md) — uso funcional por rol.
- [`GUIA_DESPLIEGUE.md`](GUIA_DESPLIEGUE.md) — instalación, Docker y producción.
- `serviteca-jm_v5.0/src/main/resources/db/migration/` — migraciones Flyway.
- `serviteca-app/.env.example` — configuración de la app móvil.
