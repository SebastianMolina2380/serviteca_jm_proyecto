# Guía de despliegue — Serviteca JM

Procedimiento para instalar, ejecutar y publicar el sistema en desarrollo, con
Docker y en producción. Última actualización: **Fase 4**.

---

## 1. Requisitos

| Herramienta | Versión mínima | Uso |
|---|---|---|
| JDK | 17 (no JRE) | Compilar y ejecutar el backend |
| PostgreSQL | 15 (validado con 17) | Base de datos |
| Git | Cualquiera reciente | Control de versiones |
| Docker Engine + Compose v2 | Opcional | Despliegue con contenedores |
| Node.js + npm | 18+ | App móvil |
| Cuenta Expo | Gratuita | Compilar el APK con EAS |

Verifica Java:

```powershell
java -version
# Debe mostrar 17.x
```

Si el `java` del PATH no es 17:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

No hace falta instalar Maven: el repositorio incluye `mvnw.cmd` (Windows) y
`mvnw` (Linux/macOS).

---

## 2. Base de datos

Crea la base antes de arrancar. Flyway crea el esquema, pero **no la base**:

```sql
CREATE DATABASE "DB_PRODISJM";
```

La contraseña de PostgreSQL es obligatoria y no tiene valor por defecto.

### 2.1 Migraciones

Flyway aplica automáticamente las versiones `V1`–`V3` al arrancar. Para
comprobar:

```sql
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

Las tres primeras filas deben tener `success = true`. Si una migración ya
aplicada necesita cambios, crea `V4__...sql`; **no edites la anterior**.

### 2.2 Base existente

Si la base ya tiene datos **no ejecutes `schema.sql`**: Flyway la adopta
automáticamente. Con `baseline-version=1`, una base sin historial se marca como
versión 1 y se aplican los deltas `V2`–`V4`, que son idempotentes y no borran
información.

Antes del primer arranque, comprueba que no existan citas activas duplicadas:

```sql
SELECT idvehiculo, fecha, hora, COUNT(*)
FROM cita
WHERE estado <> 'CANCELADA'
GROUP BY idvehiculo, fecha, hora
HAVING COUNT(*) > 1;
```

Si hay duplicados, cancela o corrige las citas sobrantes: `V2` aborta con un
mensaje claro para no dejar el esquema a medias.

#### Si ya intentaste arrancar y quedó un historial en versión 0

Flyway no vuelve a crear el *baseline* cuando la tabla de historial existe,
aunque esté vacía. En ese caso, y **solo si esa tabla contiene únicamente la
fila de baseline** (`SELECT * FROM flyway_schema_history;`), elimínala y vuelve
a arrancar:

```sql
DROP TABLE flyway_schema_history;
```

La aplicación recreará el historial en la versión 1 y aplicará `V2`–`V4`. Si el
historial tuviera migraciones aplicadas, no la borres: usa `flyway repair` o
restaura el respaldo.

Los scripts `src/main/resources/db/migracion_borrado_logico.sql` y
`migracion_fase2.sql` se conservan solo para entornos sin Flyway (por ejemplo,
una ejecución manual con `psql`); en el flujo normal ya no son necesarios.

---

## 3. Variables de entorno

### 3.1 Backend

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `SERVITECA_PROFILE` | No | `dev` | Perfil `dev` o `prod`. |
| `SERVITECA_DB_URL` | No (en `prod` basta una de las tres formas de conexión) | `jdbc:postgresql://localhost:5432/DB_PRODISJM` (solo `dev`) | URL JDBC. Si la defines, se usa tal cual y `SERVITECA_DB_SSLMODE` se ignora. |
| `SERVITECA_DB_HOST`<br>`SERVITECA_DB_PORT`<br>`SERVITECA_DB_NAME` | Alternativa a `SERVITECA_DB_URL` en `prod` | — | Si no hay URL, se compone `jdbc:postgresql://HOST:PORT/NAME` (Render Blueprint). |
| `PGHOST`<br>`PGPORT`<br>`PGDATABASE`<br>`PGUSER`<br>`PGPASSWORD` | Alternativa (Render Postgres) | — | Tercera opción: variables estándar de la base; la app compone la URL. |
| `SERVITECA_DB_SSLMODE` | No | `prefer` | Solo se aplica a la URL que compone la app (`SERVITECA_DB_*` o `PG*`). `require` fuerza TLS (bases externas). Con `SERVITECA_DB_URL`, añade `?sslmode=require` en la propia URL. |
| `SERVITECA_DB_USER` | No en `dev` / **Sí en `prod`** | `postgres` (solo `dev`) | Usuario de PostgreSQL. |
| `SERVITECA_DB_PASSWORD` | **Sí** | — | Contraseña de PostgreSQL. |
| `SERVITECA_DB_POOL_SIZE` | No | `10` en `dev`, `5` en `prod` | Conexiones máximas del pool. |
| `PORT` | No | `8082` | Puerto HTTP. Render lo inyecta automáticamente (10000). |
| `SERVITECA_EMISOR_*` | No | Datos de ejemplo | Razón social, NIT, dirección, ciudad, teléfono, correo. |
| `SERVITECA_SOFTWARE_*` | No | Vacío | Datos del software emisor. |
| `SERVITECA_RESPONSABILIDADES_FISCALES` | No | Ejemplo | Responsabilidades tributarias. |
| `SERVITECA_COOKIE_SECURE` | No | `false` en `dev`, `true` en `prod` | Cookie de sesión solo por HTTPS. |
| `SERVITECA_API_DOCS` | No | `true` en `dev`, `false` en `prod` | Swagger UI y `/v3/api-docs`. |
| `SERVITECA_MAIL_HEALTH` | No | `false` | Incluye SMTP en `/actuator/health`. |
| `SERVITECA_SMTP_HOST` | No | Vacío | Servidor SMTP; si está vacío los correos se registran en el log. |
| `SERVITECA_SMTP_PORT` | No | `587` | Puerto SMTP con STARTTLS. |
| `SERVITECA_SMTP_USER` | No | Vacío | Usuario SMTP. |
| `SERVITECA_SMTP_PASSWORD` | No | Vacío | Contraseña o clave de aplicación. |
| `SERVITECA_MAIL_FROM` | No | `no-reply@servitecajm.com` | Remitente. |
| `SERVITECA_CONTACTO_EMAIL` | No | `contacto@servitecajm.com` | Buzón de contacto. |
| `SERVITECA_APP_URL` | No | `http://localhost:8082` | URL pública para el enlace de recuperación. |
| `SERVITECA_RESET_MINUTOS` | No | `30` | Vigencia del enlace (mínimo 5). |

PowerShell:

```powershell
$env:SERVITECA_DB_PASSWORD = "tu_contraseña_segura"
```

Bash:

```bash
export SERVITECA_DB_PASSWORD="tu_contraseña_segura"
```

> Nunca escribas contraseñas reales en `application.properties` ni las subas al
> repositorio. Si una credencial estuvo en Git, rótala.

### 3.2 Administrador inicial (solo `prod`)

Solo se crea si la tabla `usuario` está vacía:

| Variable | Requisito |
|---|---|
| `INITIAL_ADMIN_NAME` | Nombre |
| `INITIAL_ADMIN_DOCUMENT` | Documento |
| `INITIAL_ADMIN_EMAIL` | Correo válido |
| `INITIAL_ADMIN_PASSWORD` | Mínimo 16 caracteres |
| `INITIAL_ADMIN_DOCUMENT_TYPE` | Opcional, por defecto `CC` |

Después de verificar el acceso, retira esas variables y reinicia.

### 3.3 App móvil

| Variable | Obligatoria | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Recomendada | URL raíz de la API, por ejemplo `https://api.servitecajm.com/api`. |
| `EXPO_PUBLIC_API_PORT` | No | Puerto para la detección automática (por defecto `8082`). |

Si no se define, la app usa la IP que detecta Expo y el puerto `8082`.

---

## 4. Ejecución local

### 4.1 Backend

```powershell
cd serviteca-jm_v5.0
$env:SERVITECA_DB_PASSWORD = "tu_contraseña_segura"
.\mvnw.cmd spring-boot:run
```

Con otro perfil:

```powershell
$env:SERVITECA_PROFILE = "prod"
```

Direcciones:

- Aplicación web: `http://localhost:8082`
- Login: `http://localhost:8082/login.html`
- Swagger (solo `dev` o `SERVITECA_API_DOCS=true`):
  `http://localhost:8082/swagger-ui.html`
- Salud: `http://localhost:8082/actuator/health`

### 4.2 JAR

```powershell
cd serviteca-jm_v5.0
.\mvnw.cmd clean package
java -jar target/serviteca-jm-1.0-SNAPSHOT.jar
```

Para omitir pruebas al empaquetar:

```powershell
.\mvnw.cmd clean package -DskipTests
```

### 4.3 Pruebas

Unitarias (sin base de datos):

```powershell
.\mvnw.cmd test
```

Integración contra PostgreSQL real:

```powershell
$env:SERVITECA_TEST_DB_URL = "jdbc:postgresql://localhost:5432/serviteca_test"
$env:SERVITECA_TEST_DB_USER = "postgres"
$env:SERVITECA_TEST_DB_PASSWORD = "tu_contraseña"
.\mvnw.cmd clean verify
```

La base `serviteca_test` debe existir y estar vacía o disponible para pruebas.
No uses datos reales.

### 4.4 App móvil en desarrollo

```powershell
cd serviteca-app
npm install
Copy-Item .env.example .env
# Edita .env: EXPO_PUBLIC_API_URL=http://TU_IP:8082/api
npx expo start
```

- PC y celular deben estar en la misma red Wi-Fi.
- Escanea el QR con **Expo Go**.
- Si el QR no conecta, usa `npx expo start --tunnel` (requiere `@expo/ngrok`).
- Si el backend está en otra máquina o en internet, define la URL pública.

Validación del bundle sin dispositivo:

```powershell
npx expo config --type public
npx expo export --platform android --output-dir dist-test
```

---

## 5. Docker Compose

### 5.1 Preparación

```powershell
cd C:\ruta\al\repositorio
Copy-Item .env.example .env
# Edita .env: POSTGRES_PASSWORD, INITIAL_ADMIN_PASSWORD, etc.
```

El archivo `.env` **no se versiona**.

| Variable | Uso |
|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Credenciales de PostgreSQL. La contraseña es obligatoria. |
| `POSTGRES_PORT` | Puerto local de la base (por defecto `5433`, para no chocar con el PostgreSQL de `5432`). |
| `APP_PORT` | Puerto publicado de la aplicación (por defecto `8082`). |
| `SERVITECA_COOKIE_SECURE` | `false` en HTTP local; `true` detrás de HTTPS. |
| `SERVITECA_API_DOCS` | `false` por defecto en producción. |
| `INITIAL_ADMIN_*` | Solo si la base está vacía. Contraseña de 16+ caracteres. |

### 5.2 Levantar

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Comprobaciones:

```powershell
curl http://localhost:8082/actuator/health
# {"status":"UP",...}
```

La primera vez, `InitialAdminBootstrap` crea el administrador. Después de
verificar el acceso, retira `INITIAL_ADMIN_*` del `.env` y reinicia. Si la base
ya tiene usuarios, el bootstrap no hace nada.

### 5.3 Contenido del stack

- **`serviteca-jm_v5.0/Dockerfile`**: build multietapa
  `maven:3.9-eclipse-temurin-17` → `eclipse-temurin:17-jre-alpine`, usuario sin
  privilegios, `HEALTHCHECK` y `JAVA_OPTS` configurable.
- **`docker-compose.yml`**: PostgreSQL 17 con volumen persistente y healthcheck;
  la aplicación espera a que la base esté sana.
- **Red y puertos**: la base solo se publica en `127.0.0.1`; la aplicación en
  `APP_PORT`. Los contenedores se comunican por `serviteca_network`.
- **Flyway** aplica `V1`–`V3` al arrancar.

### 5.4 Operación

```powershell
docker compose down       # detiene y conserva el volumen
docker compose down -v    # detiene y borra los datos (irreversible)
docker compose pull       # actualiza imágenes base
```

Para rotar contraseñas, actualiza `.env` y recrea:

```powershell
docker compose up -d --force-recreate
```

Si cambias la contraseña de PostgreSQL en un volumen existente, cámbiala también
dentro de la base o recrea el volumen.

---

## 6. Producción

### 6.1 Lista de verificación

- [ ] Definir `SERVITECA_PROFILE=prod`.
- [ ] Definir `SERVITECA_DB_URL`, `SERVITECA_DB_USER` y
      `SERVITECA_DB_PASSWORD`.
- [ ] Usar una contraseña de base robusta y rotarla si estuvo en Git.
- [ ] Servir todo por **HTTPS** (proxy inverso o balanceador).
- [ ] Mantener `SERVITECA_COOKIE_SECURE=true`.
- [ ] Mantener `SERVITECA_API_DOCS=false`.
- [ ] Configurar SMTP real o aceptar el modo de registro en log.
- [ ] Configurar `SERVITECA_APP_URL` con el dominio público.
- [ ] Definir los datos fiscales `SERVITECA_EMISOR_*` y
      `SERVITECA_SOFTWARE_*`.
- [ ] Insertar la numeración autorizada en `numeracion_factura`.
- [ ] Programar copias de seguridad de PostgreSQL.
- [ ] Verificar `/actuator/health`.
- [ ] Probar login, una cita, un documento de venta y un reporte.
- [ ] En Render: dejar que la plataforma defina `PORT` y usar
      `/actuator/health` como *Health Check Path* (§6.5).

### 6.2 HTTPS con proxy inverso

La aplicación escucha HTTP en `8082`; el TLS se termina en el proxy. Ejemplo con
nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name servitecajm.com;

    ssl_certificate     /etc/letsencrypt/live/servitecajm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/servitecajm.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8082;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name servitecajm.com;
    return 301 https://$host$request_uri;
}
```

Con HTTPS activo:

```env
SERVITECA_COOKIE_SECURE=true
SERVITECA_APP_URL=https://servitecajm.com
```

### 6.3 Riesgos que deben cerrarse antes de internet

- **CSRF deshabilitado** con autenticación por sesión.
- Ausencia de revocación inmediata de sesiones al desactivar un usuario.
- Facturación electrónica DIAN incompleta (XML, firma, CUFE, QR, transmisión).
- Credenciales que hayan estado en el historial de Git.

Mientras estos puntos no se resuelvan, el sistema debe operar en una red interna
o detrás de una VPN.

### 6.4 Respaldos

```powershell
# Respaldo
docker compose exec -T db pg_dump -U postgres DB_PRODISJM > respaldo.sql

# Restauración
Get-Content respaldo.sql | docker compose exec -T db psql -U postgres -d DB_PRODISJM
```

Programa el respaldo fuera del horario de atención y prueba la restauración al
menos una vez al mes.

### 6.5 Despliegue en Render

Render ejecuta el `Dockerfile` multietapa del backend y termina TLS en su
balanceador. La app ya escucha en `$PORT` (Render inyecta `10000`), así que no
hay que tocar código para desplegar.

**Requisitos**

- Repositorio en GitHub con `render.yaml` y `serviteca-jm_v5.0/Dockerfile`.
- Cuenta en Render (el plan `free` sirve para pruebas).

#### Opción A — Blueprint (recomendado)

El archivo `render.yaml` de la raíz crea el servicio web, la base PostgreSQL 17
y todas las variables de conexión.

1. Haz commit y push de `render.yaml`.
2. Render Dashboard → **New** → **Blueprint** → conecta el repositorio.
3. Render pide los valores de `INITIAL_ADMIN_*` (marcados `sync: false`).
   - `INITIAL_ADMIN_PASSWORD` debe tener **16 caracteres o más**.
4. **Apply**: se crean la base y el servicio, y arranca el primer build
   (5–10 minutos).
5. Al terminar, abre la URL `https://<servicio>.onrender.com`.

> Solo se permite **una** base Postgres `free` por workspace. Si ya tienes una,
> borra el bloque `databases` del `render.yaml` y define la conexión a mano
> (Opción B).

#### Opción B — Configuración manual

1. **New → Postgres**: nombre `serviteca-db`, misma región que el servicio,
   plan `free`, PostgreSQL 17.
2. **New → Web Service** → repositorio → **Runtime: Docker**.
   - *Dockerfile Path*: `./serviteca-jm_v5.0/Dockerfile`
   - *Docker Build Context Directory*: `./serviteca-jm_v5.0`
   - *Health Check Path*: `/actuator/health`
3. En **Environment** define las variables de la tabla siguiente.
4. **Create Web Service**.

#### Variables de entorno

| Variable | Valor |
|---|---|
| `SERVITECA_PROFILE` | `prod` |
| `SERVITECA_DB_URL` | `jdbc:postgresql://<host-interno>:5432/serviteca_jm` |
| `SERVITECA_DB_USER` | `serviteca` (el usuario de la base) |
| `SERVITECA_DB_PASSWORD` | La contraseña que muestra Render |
| `SERVITECA_COOKIE_SECURE` | `true` |
| `SERVITECA_API_DOCS` | `false` |
| `SERVITECA_APP_URL` | `https://<servicio>.onrender.com` |
| `SERVITECA_DB_POOL_SIZE` | `10` (plan free) |
| `INITIAL_ADMIN_NAME`<br>`INITIAL_ADMIN_DOCUMENT`<br>`INITIAL_ADMIN_EMAIL`<br>`INITIAL_ADMIN_PASSWORD` | Solo en el primer arranque con la base vacía |

> `PORT` lo define Render: **no la sobrescribas**. Si la fijas en `8082`, el
> enrutador seguirá esperando `10000` y verás errores 502.

> La **Internal Database URL** de Render tiene la forma
> `postgresql://usuario:clave@host/base`, que **no** es una URL JDBC. Usa los
> campos *Hostname*, *Port*, *Database*, *Username* y *Password* para armar
> `SERVITECA_DB_URL`, o define `SERVITECA_DB_HOST`, `SERVITECA_DB_PORT`,
> `SERVITECA_DB_NAME`, `SERVITECA_DB_USER` y `SERVITECA_DB_PASSWORD` por
> separado (la app compone la URL). También se aceptan las variables estándar
> `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` y `PGPASSWORD`.

> Si conectas una base **externa** (Neon, Supabase, RDS), añade
> `?sslmode=require` a la URL JDBC. La conexión interna de Render no necesita
> SSL.

#### Verificación

```powershell
# 1. Salud: debe devolver {"status":"UP"}
curl.exe https://<servicio>.onrender.com/actuator/health

# 2. Login web
Start-Process https://<servicio>.onrender.com/login.html

# 3. Logs del deploy: busca "Successfully applied N migrations" y
#    "Started ServitecaJmApplication"
```

En el Dashboard → **Logs** confirma que Flyway aplicó las migraciones y que no
hay `Connection refused`, `password authentication failed` ni
`Could not resolve placeholder`.

#### Límites del plan free

- El servicio se suspende tras **15 minutos sin tráfico**; el siguiente acceso
  tarda ~1 minuto en arrancar.
- La base gratuita **caduca a los 30 días** (14 días de gracia) y tiene 1 GB,
  sin copias de seguridad. Solo se permite **una** base free por workspace.
- Los puertos SMTP `25`, `465` y `587` están bloqueados: el correo de
  recuperación no sale por SMTP en free. Usa un proveedor por HTTPS (API) o
  pasa a un plan pago.
- El disco es efímero: no guardes archivos en el contenedor; todo va a
  PostgreSQL.

#### CORS

No hace falta configurar CORS: el frontend (`static/`) se sirve desde el mismo
origen que la API y el `fetch` usa `credentials: "same-origin"`. La app móvil
tampoco está sujeta a CORS porque no es un navegador. Solo necesitarías CORS si
publicaras el frontend en **otro dominio** distinto al del backend.

#### App móvil

```env
EXPO_PUBLIC_API_URL=https://<servicio>.onrender.com/api
```

Compila el APK con esa URL (ver §7.2). No incluyas `/` al final.

---

## 7. Compilar el APK con EAS

### 7.1 Requisitos

```powershell
npm install -g eas-cli
eas login
```

### 7.2 Configurar la URL del backend

La URL se define **antes de compilar**. Opciones:

1. Archivo local `.env` (solo desarrollo):

   ```env
   EXPO_PUBLIC_API_URL=https://api.servitecajm.com/api
   ```

2. Variables de entorno del proyecto en Expo/EAS (recomendado para la nube).
   Configúralas en https://expo.dev → tu proyecto → *Environment variables*.

3. `eas.json` para un perfil concreto:

   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_API_URL": "https://api.servitecajm.com/api"
         }
       }
     }
   }
   ```

> Si la URL no incluye `/api`, la app la agrega automáticamente. Si usas un
> túnel temporal, la URL cambia cada vez que reinicias el túnel: vuelve a
> compilar o usa un dominio estable.

### 7.3 Generar el APK

```powershell
cd serviteca-app
eas build -p android --profile preview
```

- La primera compilación tarda 10–20 minutos.
- El perfil `preview` genera un `.apk` instalable.
- El perfil `production` genera un `.aab` para Google Play.
- Al terminar, EAS muestra el enlace de descarga.

Instalación en el celular:

1. Transfiere el `.apk` (correo, USB, Drive o QR).
2. Ajustes → Seguridad → Permitir fuentes desconocidas.
3. Abre el archivo → **Instalar**.
4. Abre **Serviteca JM** e inicia sesión.

### 7.4 Compilación local (opcional)

Requiere JDK 17, Android SDK y espacio en disco:

```powershell
eas build -p android --profile preview --local
```

---

## 8. Verificación posterior al despliegue

| Comprobación | Resultado esperado |
|---|---|
| `GET /actuator/health` | `{"status":"UP"}` |
| `GET /login.html` | Página de login |
| Login con el administrador | Dashboard con datos |
| Crear una cita | Respuesta `200/201` y cita visible |
| Crear un documento de venta | Documento visible y PDF imprimible |
| Registrar un pago | Pago asociado sin duplicados |
| `GET /api/reportes` como cliente | `403` |
| Exportar CSV/Excel/PDF | Descarga con el tipo MIME correcto |
| App móvil | Login, listado y solicitud de cita |
| Zoom del navegador | La página amplía sin bloqueo |
| Navegación con `Tab` | Foco visible en campos y botones |

---

## 9. Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| `Could not resolve placeholder 'SERVITECA_DB_PASSWORD'` | Define la variable antes de arrancar. |
| `Unsupported class file major version` | Estás usando Java 8/11. Instala JDK 17 y ajusta `JAVA_HOME`. |
| `Connection refused` a PostgreSQL | Verifica el servicio y `SERVITECA_DB_URL`. |
| `Port 8082 was already in use` | Libera el puerto o cambia `server.port`. |
| `relation "..." does not exist` | La base está vacía y Flyway no pudo aplicar el esquema. Revisa el log y `flyway_schema_history`. |
| `no existe la columna «estado»` al arrancar | La base existente se intentó migrar desde la versión 0. Verifica `baseline-version=1` y elimina un historial que solo tenga la fila de baseline (§2.2). |
| `null value in column "idfactura"` | Base heredada sin secuencia en `factura`. `V4` la crea; reinicia para que Flyway la aplique. |
| `column "rango_desde" is of type character varying` | Falta aplicar `V4`; reinicia la aplicación para que Flyway la ejecute. |
| `Flyway validate failed` | Se editó una migración aplicada. Restaura el archivo o crea `V5__...sql`. |
| `docker compose` indica que falta una variable | Copia `.env.example` como `.env` y completa las credenciales. |
| `/actuator/health` responde `503` | La base no está accesible. Revisa `docker compose ps` y los logs. El SMTP no afecta salvo `SERVITECA_MAIL_HEALTH=true`. |
| Swagger responde `404` | En `prod` está desactivado. Actívalo temporalmente con `SERVITECA_API_DOCS=true`. |
| El puerto `5433` está ocupado | Cambia `POSTGRES_PORT` en `.env`. |
| La app móvil no conecta | Backend encendido, misma red y `EXPO_PUBLIC_API_URL` correcta. Prueba `http://TU_IP:8082/login.html` desde el celular. |
| La app vuelve al login | La sesión venció (HTTP 401). Es el comportamiento esperado. |
| `Expected app version ... native version` en Expo Go | Ejecuta `npx expo install --fix` y reinicia `npx expo start -c`. |
| El APK no conecta | Reconfigura `EXPO_PUBLIC_API_URL`, vuelve a compilar y verifica que el backend sea accesible desde internet o la red del celular. |
| Error de red al compilar el APK | Revisa las variables de entorno del proyecto en Expo/EAS. |
| Render: **502** o "no open ports detected" | La app no escucha en `$PORT`. No fijes `PORT=8082`; confirma `server.port=${PORT:8082}` y que el servicio escuche en `0.0.0.0`. |
| Render: health check en `/actuator/health` falla pero la app arranca | Revisa que `SERVITECA_PROFILE=prod` y que la base responde; el endpoint devuelve `503` si la base está caída. |
| Render: `UnknownHostException: ${PGHOST}` (o `${PGPORT}` / `${PGDATABASE}`) | Perfil `prod` sin `SERVITECA_DB_URL`, sin `SERVITECA_DB_HOST/PORT/NAME` y sin `PGHOST/PGPORT/PGDATABASE`. El placeholder anidado queda literal y pgjdbc intenta resolver `${PGHOST}` como host. Define una de las tres formas de conexión. |
| Render: `password authentication failed` | Usa el usuario y la contraseña de la base de Render, no los de desarrollo. |
| Render: `Connection refused` al host interno | El servicio y la base están en regiones distintas, o la base free caducó (30 días). |
| Render: `no pg_hba.conf entry ... no encryption` | Base externa sin SSL: agrega `?sslmode=require` a `SERVITECA_DB_URL`. |
| Render: el correo de recuperación no llega en free | Los puertos SMTP 25/465/587 están bloqueados en el plan free; usa un proveedor por HTTPS o un plan pago. |

---

## 10. Referencias

- [`README.md`](../README.md) — portada y guía rápida.
- [`MANUAL_TECNICO.md`](MANUAL_TECNICO.md) — arquitectura, API y seguridad.
- [`MANUAL_USUARIO.md`](MANUAL_USUARIO.md) — uso por rol.
- `.env.example` — plantilla de Docker Compose.
- `serviteca-app/.env.example` — plantilla de la app móvil.
- `.github/workflows/ci.yml` — validación automática.
