# Guía de pruebas · Caja negra (Selenium) y caja blanca (SonarQube + JaCoCo)

Proyecto: **Serviteca JM / PRODISJM v1.0**  
Módulo Maven: `serviteca-jm_v5.0`  
Repositorio local: `C:\Users\LENOVO\Desktop\serviteca_jm_proyecto`

---

## 1. Qué se prueba con cada herramienta

| Enfoque | Qué significa | Herramienta | Dónde se ejecuta |
|---|---|---|---|
| **Caja negra** | Se prueba el comportamiento visible: pantallas, clics, formularios, respuestas HTTP. No se mira el código interno. | **Selenium WebDriver** + JUnit 5 | `src/test/java/com/serviteca/e2e/` |
| **Caja blanca** | Se prueba la estructura interna: clases, métodos, ramas, cobertura y calidad estática. | **JUnit 5** (unitarias/integración), **JaCoCo** (cobertura) y **SonarQube** (análisis estático) | `src/test/java/` y servidor SonarQube en Docker |

> Importante: SonarQube **no ejecuta** las pruebas. SonarQube lee el código y los
> reportes que producen Maven/JUnit/JaCoCo. Selenium tampoco mide cobertura:
> solo valida el comportamiento de la interfaz.

> 🎬 **¿Vas a grabar un video?** Sigue el guion paso a paso en
> [`TUTORIAL_VIDEO_PRUEBAS.md`](./TUTORIAL_VIDEO_PRUEBAS.md). Incluye escenas,
> comandos, narración sugerida y la opción de cámara lenta
> `SERVITECA_E2E_PAUSA_MS`.

---

## 2. Dónde está cada cosa

```text
serviteca_jm_proyecto/
├── docker-compose.sonarqube.yml        ← servidor SonarQube + su PostgreSQL
├── docs/
│   └── GUIA_PRUEBAS_SELENIUM_SONARQUBE.md   ← este documento
└── serviteca-jm_v5.0/
    ├── pom.xml                         ← perfiles, Selenium, JaCoCo, Sonar
    ├── sonar-project.properties        ← configuración del análisis
    └── src/test/
        ├── java/com/serviteca/
        │   ├── e2e/                    ← CAJA NEGRA (Selenium)
        │   │   ├── SeleniumBase.java
        │   │   ├── LoginE2ETest.java
        │   │   ├── NuevoUsuarioE2ETest.java
        │   │   ├── CitasE2ETest.java
        │   │   └── InventarioE2ETest.java
        │   ├── integracion/            ← CAJA BLANCA (MockMvc + PostgreSQL)
        │   ├── config/
        │   └── util/
        └── resources/application-test.properties
```

Los reportes quedan en:

| Reporte | Ruta |
|---|---|
| Pruebas unitarias/integración | `target/surefire-reports/` |
| Pruebas E2E Selenium | `target/failsafe-reports/` |
| Cobertura JaCoCo | `target/site/jacoco/index.html` |
| Cobertura XML para Sonar | `target/site/jacoco/jacoco.xml` |

---

## 3. Prerrequisitos

1. **JDK 17** (el `java` del PATH puede ser 8; hay que apuntar `JAVA_HOME` al 17):

   ```powershell
   $env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
   java -version   # debe decir 17
   ```

2. **Maven** (o el wrapper `mvnw.cmd` del proyecto).
3. **Google Chrome** o **Microsoft Edge** instalado. Selenium Manager descarga
   el driver automáticamente la primera vez (requiere internet).
4. **PostgreSQL** para las pruebas de integración (o el contenedor del
   `docker-compose.yml`).
5. **Docker Desktop** para SonarQube.

---

## 4. Caja negra · Selenium WebDriver

### 4.1 Preparar la aplicación

Las pruebas E2E **no levantan** la aplicación: se conectan a una instancia ya
arrancada.

Opción A · Docker (recomendada para una base limpia):

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
copy .env.example .env    # ajusta los secretos la primera vez
docker compose up -d --build
```

Opción B · Spring Boot en local:

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0
$env:SERVITECA_DB_PASSWORD = "1234"
.\mvnw.cmd spring-boot:run
```

La aplicación queda en `http://localhost:8082`. Comprueba:

```powershell
Invoke-WebRequest http://localhost:8082/actuator/health
```

### 4.2 Credenciales de ADMIN para las pruebas

Las pruebas con sesión leen dos variables de entorno (no hay contraseñas
escritas en el repositorio):

```powershell
$env:SERVITECA_E2E_ADMIN_EMAIL    = "sebastian.vargas@serviteca.test"
$env:SERVITECA_E2E_ADMIN_PASSWORD = "AdminServiteca2026*"
```

> Con el perfil `dev` y `data-dev.sql`, el usuario anterior es ADMIN. Si usas
> otra base, cambia estos valores por un ADMIN real.

### 4.3 Ejecutar las pruebas

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0

$env:SERVITECA_E2E_URL = "http://localhost:8082"
$env:SERVITECA_E2E_HEADLESS = "true"   # "false" para ver el navegador
$env:SERVITECA_E2E_PAUSA_MS = "0"      # "800" para cámara lenta (videos)

.\mvnw.cmd verify -Pe2e
```

- El perfil `e2e` activa **Failsafe** y ejecuta solo `*E2ETest`.
- `mvn test` normal **no** ejecuta Selenium (está excluido de Surefire).
- Si la app no responde, las pruebas se **omiten** con un mensaje claro.

Ejecutar una sola clase:

```powershell
.\mvnw.cmd verify -Pe2e -Dit.test=LoginE2ETest
```

Ver el navegador mientras se ejecuta:

```powershell
$env:SERVITECA_E2E_HEADLESS = "false"
.\mvnw.cmd verify -Pe2e -Dit.test=NuevoUsuarioE2ETest
```

### 4.4 Casos de caja negra incluidos

| Caso | Archivo | Qué valida |
|---|---|---|
| Login: ojo de contraseña | `LoginE2ETest` | `password → text → password` |
| Login: credenciales inválidas | `LoginE2ETest` | Mensaje de error visible |
| Login: rol obligatorio | `LoginE2ETest` | No envía sin seleccionar rol |
| Login: ADMIN | `LoginE2ETest` | Redirección al dashboard |
| Nuevo usuario: ojo | `NuevoUsuarioE2ETest` | Bug 1: ambos campos alternan |
| Nueva cita: flujo completo | `CitasE2ETest` | Bug 2: ticket real y fila en `citas.html` |
| Inventario: categorías | `InventarioE2ETest` | Bug 3: el modal carga el catálogo |

`CitasE2ETest` crea un cliente y un vehículo nuevos con documento/placa
únicos, elige una fecha futura aleatoria (para no chocar con la restricción
global `fecha + hora`) y verifica que el ticket `TKT-####` aparece en el
listado. Es una prueba de regresión directa del bug reportado.

---

## 5. Caja blanca · pruebas, cobertura y SonarQube

### 5.1 Pruebas unitarias y de integración

Primero crea una base **exclusiva** para pruebas (no reutilices la de
desarrollo). Con PostgreSQL local:

```powershell
$env:PGPASSWORD = "1234"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres `
  -c "CREATE DATABASE serviteca_test;"
```

Flyway crea el esquema automáticamente en esa base la primera vez.

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0

# Base temporal para las pruebas de integración
$env:SERVITECA_TEST_DB_URL      = "jdbc:postgresql://localhost:5432/serviteca_test"
$env:SERVITECA_TEST_DB_USER     = "postgres"
$env:SERVITECA_TEST_DB_PASSWORD = "1234"


.\mvnw.cmd clean verify
```

Esto ejecuta:

1. Pruebas unitarias (`PlacaUtilTest`, `InitialAdminBootstrapTest`).
2. Pruebas de integración con MockMvc y PostgreSQL real (`SeguridadIntegrationTest`,
   `VehiculosIntegrationTest`, `ReportesIntegrationTest`,
   `ContactoYRecuperacionIntegrationTest`).
3. **JaCoCo** genera `target/site/jacoco/index.html` con cobertura por clase,
   método y rama.

Abrir el reporte:

```powershell
Start-Process .\target\site\jacoco\index.html
```

> Sin las variables `SERVITECA_TEST_DB_*`, las pruebas de integración se omiten
> y solo corren las unitarias.

### 5.2 Levantar SonarQube

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose -f docker-compose.sonarqube.yml up -d
docker compose -f docker-compose.sonarqube.yml logs -f sonarqube
```

Espera a que el log diga `SonarQube is operational` (la primera vez tarda
1–3 minutos). Luego abre:

```text
http://localhost:9000
```

Credenciales iniciales: `admin` / `admin`. SonarQube pedirá cambiar la
contraseña.

### 5.3 Crear el proyecto y el token

1. En SonarQube: **Projects → Create project → Manually**.
2. Project key: `serviteca-jm` (debe coincidir con
   `sonar-project.properties`).
3. Display name: `Serviteca JM`.
4. **My Account → Security → Generate Tokens**: crea un token, por ejemplo
   `serviteca-local`, y cópialo.

### 5.4 Ejecutar el análisis

Desde la carpeta del módulo (allí está `sonar-project.properties`):

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0

# 1) Compilar + pruebas + cobertura
.\mvnw.cmd clean verify

# 2) Enviar el análisis a SonarQube
.\mvnw.cmd sonar:sonar `
  -Dsonar.host.url=http://localhost:9000 `
  -Dsonar.token=TU_TOKEN_AQUI
```

Si el token se pasa por variable de entorno:

```powershell
$env:SONAR_TOKEN = "TU_TOKEN_AQUI"
.\mvnw.cmd sonar:sonar -Dsonar.host.url=http://localhost:9000
```

Al terminar, SonarQube imprime la URL del proyecto. Allí se revisan:

- **Bugs / Vulnerabilities / Code Smells**
- **Coverage** (cobertura global y por archivo)
- **Duplications**
- **Quality Gate**

### 5.5 Qué mira SonarQube (caja blanca)

- Complejidad ciclomática y métodos demasiado largos.
- Código duplicado.
- Manejo de excepciones vacío o silencioso.
- Credenciales o secretos embebidos.
- Prácticas inseguras (SQL, criptografía, rutas).
- Cobertura de pruebas (si JaCoCo generó el XML).
- Deuda técnica y tiempos estimados de corrección.

No reemplaza a las pruebas: las complementa. Un proyecto puede tener 100 % de
cobertura y aun así tener code smells, y viceversa.

---

## 6. Matriz de trazabilidad con los bugs reportados

| Bug | Prueba de caja negra | Prueba de caja blanca relacionada |
|---|---|---|
| 1. Ojo de contraseña | `NuevoUsuarioE2ETest.ojoAlternaAmbosCampos` y `LoginE2ETest.ojoAlternaVisibilidad` | Revisión de listeners duplicados en JS (SonarQube: duplicación/complejidad) |
| 2. Cita no se lista | `CitasE2ETest.creaCitaYApareceEnElListado` | `POST/GET /api/citas` (pruebas de integración); cobertura de `CitaController` |
| 3. Categorías vacías | `InventarioE2ETest.modalCargaCategorias` | Revisión de `cargarCategorias()` y del contrato `/api/productos/catalogo` |

---

## 7. Solución de problemas

> 📋 Para el detalle de cada error (mensaje exacto, causa y corrección) consulta
> [`BITACORA_ERRORES_PRUEBAS.md`](./BITACORA_ERRORES_PRUEBAS.md).

| Síntoma | Causa probable | Solución |
|---|---|---|
| Todas las E2E se omiten | La app no responde en la URL indicada | Levanta el backend y revisa `/actuator/health` |
| `SessionNotCreatedException` | Chrome/driver desactualizado | Actualiza Chrome; Selenium Manager descarga el driver |
| Las E2E con sesión se omiten | Faltan variables de ADMIN | Define `SERVITECA_E2E_ADMIN_EMAIL/PASSWORD` |
| `java -version` muestra 8 | `JAVA_HOME` apunta al JDK equivocado | Ajusta `JAVA_HOME` al JDK 17 |
| Las integraciones se omiten | Faltan `SERVITECA_TEST_DB_*` | Define las variables y crea la base `serviteca_test` |
| SonarQube no arranca | Docker Desktop apagado o poca memoria | Inicia Docker Desktop; asigna ≥ 4 GB de RAM |
| Sonar no muestra cobertura | No se ejecutó `verify` antes o falta el XML | Ejecuta `mvnw clean verify` y luego `sonar:sonar` |
| El selector de inventario queda vacío | La tabla `producto` no tiene filas | Siembra productos o usa una base con catálogo |

---

## 8. Comandos resumidos

```powershell
# Preparar JDK
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# Caja blanca: pruebas + cobertura
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0
$env:SERVITECA_TEST_DB_URL = "jdbc:postgresql://localhost:5432/serviteca_test"
$env:SERVITECA_TEST_DB_USER = "postgres"
$env:SERVITECA_TEST_DB_PASSWORD = "1234"
.\mvnw.cmd clean verify

# Caja negra: Selenium contra la app levantada
$env:SERVITECA_E2E_URL = "http://localhost:8082"
$env:SERVITECA_E2E_ADMIN_EMAIL = "sebastian.vargas@serviteca.test"
$env:SERVITECA_E2E_ADMIN_PASSWORD = "AdminServiteca2026*"
.\mvnw.cmd verify -Pe2e

# SonarQube
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose -f docker-compose.sonarqube.yml up -d
cd .\serviteca-jm_v5.0
.\mvnw.cmd sonar:sonar -Dsonar.host.url=http://localhost:9000 -Dsonar.token=TU_TOKEN
```
