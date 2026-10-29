# Serviteca JM — PRODISJM

Sistema de gestión para **Serviteca JM**, taller automotriz en la vía Bypass
Tunja–Sogamoso, Tunja, Boyacá, Colombia.

Integra un backend **Spring Boot 3.3.5 / Java 17**, un frontend web estático
servido por el mismo backend y una **app móvil React Native + Expo** para
clientes y empleados.

Proyecto académico del programa **Tecnología en Análisis y Desarrollo de
Software (ADSO)** del SENA, ficha 3171149-B.

---

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/MANUAL_TECNICO.md`](docs/MANUAL_TECNICO.md) | Arquitectura, modelo de datos, API, seguridad, accesibilidad y app móvil. |
| [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md) | Uso del sistema por rol, app móvil y preguntas frecuentes. |
| [`docs/GUIA_DESPLIEGUE.md`](docs/GUIA_DESPLIEGUE.md) | Instalación, variables de entorno, Docker, producción y APK. |

---

## Módulos

| Módulo | Descripción |
|---|---|
| Usuarios y autenticación | Login por sesión HTTP, roles `ADMIN`, `TECNICO`, `CLIENTE` y contraseñas BCrypt |
| Clientes | Consulta y administración de clientes con baja lógica |
| Vehículos | Registro, edición, historial y placa única normalizada |
| Citas | Agendamiento, control de conflictos y estados |
| Servicios | Catálogo y seguimiento por vehículo |
| Inventario y proveedores | Productos, stock, alertas y proveedores |
| Facturación | Documentos de venta, IVA y datos del emisor |
| Pagos | Registro idempotente de pagos |
| Seguimiento | Trazabilidad de estados y mensajes |
| Reportes | Ventas, facturas y citas con exportación CSV/Excel/PDF |
| Portal del cliente | Historial de citas, vehículos y documentos propios |
| App móvil | Estado del vehículo, solicitud de citas y registro de vehículos |

---

## Tecnologías

- **Backend:** Java 17, Spring Boot 3.3.5, Spring Web, Spring Data JPA, Spring
  Security, Bean Validation, Lombok, Maven Wrapper, Flyway y Actuator.
- **Base de datos:** PostgreSQL 15+ (validado con 17).
- **API:** SpringDoc OpenAPI / Swagger UI.
- **Despliegue:** Docker multietapa y Docker Compose (PostgreSQL 17 + app).
- **Calidad:** JUnit 5, MockMvc, Spring Security Test y GitHub Actions.
- **Frontend web:** HTML5, CSS3 y JavaScript sin framework.
- **App móvil:** React Native 0.86 + Expo SDK 57, `expo-secure-store` y
  `@react-native-community/datetimepicker`.

---

## Estructura

```text
serviteca_jm_proyecto/
├── README.md
├── docs/                              # Manual técnico, de usuario y despliegue
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml
├── serviteca-jm_v5.0/                 # Backend + frontend web
│   ├── Dockerfile
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/main/resources/
│       ├── application*.properties
│       ├── db/                        # schema.sql + migraciones Flyway V1–V3
│       └── static/                    # HTML, CSS, JS e imágenes
└── serviteca-app/                     # App móvil
    ├── app.json / app.config.js / eas.json
    ├── assets/                        # Icono, splash y favicon
    └── src/                           # Pantallas, componentes y servicios
```

---

## Inicio rápido

### Backend en desarrollo

Requisitos: JDK 17, PostgreSQL y la variable de contraseña.

```powershell
cd serviteca-jm_v5.0
$env:SERVITECA_DB_PASSWORD = "tu_contraseña_segura"
.\mvnw.cmd spring-boot:run
```

- Web: `http://localhost:8082`
- Login: `http://localhost:8082/login.html`
- Swagger: `http://localhost:8082/swagger-ui.html`
- Salud: `http://localhost:8082/actuator/health`

Flyway crea el esquema automáticamente. La base `DB_PRODISJM` debe existir.

### App móvil

```powershell
cd serviteca-app
npm install
Copy-Item .env.example .env
# Edita EXPO_PUBLIC_API_URL con la IP o el dominio del backend
npx expo start
```

Escanea el QR con Expo Go. PC y celular deben estar en la misma red Wi-Fi.

### Docker

```powershell
Copy-Item .env.example .env
# Edita POSTGRES_PASSWORD e INITIAL_ADMIN_PASSWORD
docker compose up -d --build
docker compose ps
```

- Aplicación: `http://localhost:8082`
- Base: `127.0.0.1:5433`
- Salud: `http://localhost:8082/actuator/health`

---

## Roles

| Rol | Acceso principal |
|---|---|
| `ADMIN` | Todos los módulos, usuarios, clientes, citas, inventario, documentos de venta y reportes |
| `TECNICO` | Dashboard, citas globales, vehículos, clientes (lectura y creación), seguimientos, inventario, documentos de venta y reportes |
| `CLIENTE` | Solo sus citas, vehículos, historial y documentos de venta |

La autorización real la aplica Spring Security. `role-guard.js` solo oculta
módulos en el frontend.

---

## Estado de la entrega

| Fase | Alcance | Estado |
|---|---|---|
| 0 | Contratos de vehículos, limpieza, `schema.sql`, contraseña obligatoria | Completada |
| 1 | IDOR, permisos, baja lógica, FKs fiscales, rotación de sesión, rate limiting | Completada |
| 2 | Reportes reales, recuperación de contraseña, contacto, dashboard, paginación | Completada |
| 3 | Flyway V1–V3, perfiles `dev`/`prod`, Docker, 31 pruebas, CI, OpenAPI, Actuator | Completada |
| 4 | Accesibilidad web, app móvil endurecida, assets, migración `V4` y documentación final | Completada |

**Validación:** `mvnw clean verify` con 31 pruebas, arranque `prod` con base
limpia, Docker Compose healthy, bundle Android de Expo sin errores.

**Pendientes fuera de alcance:** CSRF, HTTPS obligatorio, revocación inmediata
de sesiones, pruebas de carga, facturación electrónica DIAN completa y rotación
de credenciales históricas.

---

## Seguridad y alcance fiscal

- Contraseñas BCrypt, sesión `SERVITECASESSION` con `HttpOnly`, `SameSite=Lax`
  y `Secure` configurable.
- Rate limiting en login, mensajes genéricos, autorización por método y ruta.
- Baja lógica, facturas inmutables y pagos idempotentes.
- El sistema emite un **documento de venta comercial interno**. **No** genera
  XML, firma electrónica, CUFE, QR ni transmisión a la DIAN, y no debe
  presentarse como factura electrónica validada.

Las condiciones de producción y los riesgos pendientes están detallados en la
[guía de despliegue](docs/GUIA_DESPLIEGUE.md#6-producción).

---

## Contacto

Desarrolladores: Sergio Aguilar y Sebastián Molina  
Programa: Tecnología en Análisis y Desarrollo de Software — SENA  
Ficha: 3171149-B  
Correo: sebastiandavidmolinarivera2380@gmail.com ·
sergioaguilartibata@gmail.com  
Repositorio: https://github.com/SebastianMolina2380/serviteca_jm_proyecto
