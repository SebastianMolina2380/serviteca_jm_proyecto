# 🎬 Tutorial y guion para grabar el video de pruebas

**Proyecto:** Serviteca JM / PRODISJM v1.0  
**Tema:** Pruebas de caja negra (Selenium WebDriver) y caja blanca (JUnit + JaCoCo + SonarQube)  
**Duración objetivo:** 12–16 minutos  
**Formato sugerido:** 1920×1080, terminal con zoom 120 %, navegador a pantalla completa al mostrar resultados.

> 📋 **Anexo de errores:** si quieres explicar en el video los fallos que aparecieron y cómo
> se resolvieron, usa [`BITACORA_ERRORES_PRUEBAS.md`](./BITACORA_ERRORES_PRUEBAS.md).
> Tiene el mensaje exacto, la causa, la corrección y el estado de cada uno.

---

## A. Antes de grabar (checklist)

Haz esto **antes de pulsar “Grabar”**. Evita esperas y descargas en cámara.

### A.1 Requisitos

| Herramienta | Verificación |
|---|---|
| JDK 17 | `java -version` → 17 |
| Maven / `mvnw.cmd` | `.\\mvnw.cmd -v` |
| Google Chrome | Instalado (Selenium Manager baja el driver solo) |
| PostgreSQL 17 local | Servicio corriendo en `localhost:5432` |
| Docker Desktop | Iniciado (solo para SonarQube) |

### A.2 Precalentar dependencias (una vez)

```powershell
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:Path = "$env:JAVA_HOME\bin;C:\maven\bin;$env:Path"
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0

# Descarga Maven + Selenium y compila las pruebas
.\mvnw.cmd -B -ntp -Pe2e -DskipTests test-compile
```

La primera ejecución de Selenium descarga el ChromeDriver. **Haz una corrida de prueba
antes de grabar** para que no aparezca la descarga en el video:

```powershell
$env:SERVITECA_E2E_URL = "http://localhost:8082"
$env:SERVITECA_E2E_ADMIN_EMAIL = "sebastian.vargas@serviteca.test"
$env:SERVITECA_E2E_ADMIN_PASSWORD = "AdminServiteca2026*"
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=LoginE2ETest
```

### A.3 Precalentar SonarQube (opcional pero muy recomendado)

La primera vez SonarQube tarda 1–3 minutos en arrancar. Para el video conviene tenerlo ya arriba:

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose -f docker-compose.sonarqube.yml up -d
docker compose -f docker-compose.sonarqube.yml ps
```

Espera a ver `healthy` o abre `http://localhost:9000`. Inicia sesión (`admin` / la
contraseña que hayas definido). **Si es la primera vez**, cambia la contraseña antes de grabar.

### A.4 Preparar la base de pruebas (caja blanca)

```powershell
$env:PGPASSWORD = "1234"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres `
  -c "CREATE DATABASE serviteca_test;"
```

> Si ya existe, PostgreSQL responde “already exists”. No pasa nada.

### A.5 Checklist de grabación

- [ ] Notificaciones de Windows silenciadas (`No molestar`).
- [ ] Chrome sin pestañas personales; zoom 100 %.
- [ ] Terminal limpia y con zoom 120 %.
- [ ] App levantada y `http://localhost:8082/actuator/health` responde `UP`.
- [ ] Base `serviteca_test` creada.
- [ ] SonarQube arriba (si vas a grabar esa escena).
- [ ] Guion abierto en otra pantalla o impreso.

---

## B. Mapa del video

| # | Escena | Duración | Qué se ve |
|---|---|---|---|
| 0 | Introducción | 0:45 | Diagrama mental: caja negra vs caja blanca |
| 1 | Recorrido del proyecto | 1:30 | Dónde están las pruebas y la configuración |
| 2 | Levantar la aplicación | 1:30 | Terminal + `/actuator/health` en el navegador |
| 3 | Caja negra: Selenium | 4:00 | El navegador se abre y usa la app solo |
| 4 | Regresión de los 3 bugs | 2:00 | Cita, ojo de contraseña y categorías |
| 5 | Caja blanca: JUnit + JaCoCo | 2:30 | `clean verify` y reporte de cobertura |
| 6 | SonarQube | 3:00 | Docker, proyecto, token y dashboard |
| 7 | Cierre | 0:40 | Resumen y matriz de trazabilidad |

---

## C. Guion escena por escena

### Escena 0 · Introducción (0:45)

**En pantalla:** una diapositiva o el README del proyecto.  
**Qué decir:**

> “En este video voy a mostrar cómo se prueban las dos caras de Serviteca JM.
> La **caja negra** usa **Selenium WebDriver**: maneja el navegador como un usuario real,
> sin mirar el código. La **caja blanca** usa **JUnit**, **JaCoCo** y **SonarQube**:
> revisa la estructura interna, la cobertura y la calidad del código.
> Al final veremos cómo estas pruebas detectan tres bugs reales del proyecto.”

---

### Escena 1 · Recorrido del proyecto (1:30)

**En pantalla:** abre la carpeta `serviteca_jm_proyecto` en el explorador y muestra:

```text
serviteca_jm_proyecto/
├── docker-compose.sonarqube.yml
├── docs/GUIA_PRUEBAS_SELENIUM_SONARQUBE.md
└── serviteca-jm_v5.0/
    ├── pom.xml
    ├── sonar-project.properties
    └── src/test/java/com/serviteca/
        ├── e2e/          ← caja negra (Selenium)
        └── integracion/  ← caja blanca (MockMvc)
```

**Qué decir:**

> “La caja negra vive en `src/test/java/com/serviteca/e2e`. Ahí están las clases
> `LoginE2ETest`, `NuevoUsuarioE2ETest`, `CitasE2ETest` e `InventarioE2ETest`, y una base
> `SeleniumBase` que abre Chrome y espera los elementos.
>
> La caja blanca vive en `src/test/java/com/serviteca/integracion`: pruebas con MockMvc
> contra PostgreSQL real. La cobertura la genera **JaCoCo**, configurado en el `pom.xml`,
> y el análisis estático lo hace **SonarQube** con `sonar-project.properties`.
>
> El detalle importante: las E2E están **excluidas** de `mvn test` y solo se ejecutan con
> el perfil `e2e`. Así, un desarrollador puede compilar y probar sin tener la app levantada.”

**Tip de cámara:** abre `pom.xml` y muestra el `<profile><id>e2e</id>` y el
`maven-failsafe-plugin`. Luego abre `sonar-project.properties`.

---

### Escena 2 · Levantar la aplicación (1:30)

**En pantalla:** terminal 1.

**Opción A · Spring Boot local (más rápida para grabar):**

```powershell
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:Path = "$env:JAVA_HOME\bin;C:\maven\bin;$env:Path"
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0
$env:SERVITECA_DB_PASSWORD = "1234"
.\mvnw.cmd spring-boot:run
```

**Opción B · Docker Compose (más vistosa):**

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose up -d --build
docker compose ps
```

**En pantalla:** espera el log `Started ServitecaJmApplication` y luego abre:

```text
http://localhost:8082/actuator/health
```

**Qué decir:**

> “La aplicación corre en el puerto 8082. El endpoint `/actuator/health` es público y
> confirma que la base de datos responde. Este chequeo es el que usa Selenium para saber
> si puede ejecutar las pruebas; si la app no está arriba, las pruebas se **omiten**, no fallan.”

> **Nota para el video:** deja esta terminal abierta. Las pruebas E2E se conectan a esta instancia.

---

### Escena 3 · Caja negra con Selenium (4:00)

**En pantalla:** terminal 2 (nueva pestaña).

**3.1 Configurar variables y modo “cámara lenta”**

```powershell
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:Path = "$env:JAVA_HOME\bin;C:\maven\bin;$env:Path"
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0

$env:SERVITECA_E2E_URL = "http://localhost:8082"
$env:SERVITECA_E2E_ADMIN_EMAIL = "sebastian.vargas@serviteca.test"
$env:SERVITECA_E2E_ADMIN_PASSWORD = "AdminServiteca2026*"
$env:SERVITECA_E2E_HEADLESS = "false"   # abre Chrome visible
$env:SERVITECA_E2E_PAUSA_MS = "800"     # 0.8 s entre acciones (para el video)
```

**Qué decir:**

> “`HEADLESS=false` abre Chrome de verdad, para que se vea la prueba.
> `PAUSA_MS` agrega una pausa entre acciones y así la cámara alcanza a ver cada clic.
> En un pipeline se usaría `HEADLESS=true` y sin pausa, para que corra rápido.”

**3.2 Ejecutar primero el login (para mostrar el navegador)**

```powershell
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=LoginE2ETest
```

**En pantalla:** Chrome se abre solo, elige el rol ADMIN, escribe correo y contraseña,
hace clic en el ojo de la contraseña, intenta credenciales inválidas y finalmente entra al dashboard.

**Qué decir mientras se ejecuta:**

> “Selenium abre Chrome y se comporta como un usuario. Prueba cuatro cosas: que el ojo
> alterna entre ocultar y mostrar la contraseña, que las credenciales inválidas muestran
> un error, que no se puede enviar el formulario sin elegir rol, y que un ADMIN llega al dashboard.”

**3.3 Ejecutar la suite E2E completa**

```powershell
.\mvnw.cmd -B -ntp verify -Pe2e
```

**En pantalla:** verás desfilar las 4 clases y al final:

```text
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

**Qué decir:**

> “Siete casos en total. Si la aplicación no estuviera levantada, aparecerían como
> *skipped* con un mensaje claro, no como error de código.”

---

### Escena 4 · Regresión de los tres bugs (2:00)

**En pantalla:** terminal 2. Ejecuta una por una (o las tres juntas):

```powershell
# Bug 1: el ojo de la contraseña en "Nuevo usuario"
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=NuevoUsuarioE2ETest

# Bug 2: la cita se guarda y aparece en el listado
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=CitasE2ETest

# Bug 3: el modal de inventario carga las categorías
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=InventarioE2ETest
```

**Qué decir (bug 1):**

> “Este es el bug del ojo de la contraseña. Había dos listeners alternando el mismo campo:
> un clic lo mostraba y el otro lo volvía a ocultar. La prueba verifica que un clic lo
> muestra y el siguiente lo oculta, en los dos campos.”

**Qué decir (bug 2):**

> “La prueba crea un cliente y un vehículo nuevos, agenda una cita, captura el ticket real
> `TKT-####` y luego abre el listado de citas para comprobar que esa misma fila aparece.
> Antes se mostraba un ticket falso y la cita no se guardaba.”

**Qué decir (bug 3):**

> “Al abrir el modal de inventario, el selector de categoría consulta `/api/productos/catalogo`.
> La prueba espera a que termine la carga y falla si el selector se queda en ‘Cargando’ o vacío.”

**Tip de cámara:** en `CitasE2ETest` deja visible el momento en que se abre `citas.html`
y se resalta la fila con el ticket.

---

### Escena 5 · Caja blanca: JUnit + JaCoCo (2:30)

**En pantalla:** terminal 2.

**5.1 Ejecutar unitarias + integración + cobertura**

```powershell
$env:SERVITECA_TEST_DB_URL = "jdbc:postgresql://localhost:5432/serviteca_test"
$env:SERVITECA_TEST_DB_USER = "postgres"
$env:SERVITECA_TEST_DB_PASSWORD = "1234"

.\mvnw.cmd -B -ntp clean verify
```

**En pantalla:** Flyway crea el esquema en `serviteca_test` y al final:

```text
Tests run: 31, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

**Qué decir:**

> “Treinta y un pruebas: unitarias de utilidades, configuración, y de integración con
> MockMvc contra PostgreSQL. Flyway crea el esquema automáticamente en la base de test,
> así que no tocamos la base de desarrollo.
>
> Durante el `verify`, JaCoCo instrumenta el código y genera el reporte de cobertura.
> Ojo: Selenium **no** genera cobertura, porque prueba el navegador contra una app externa.”

**5.2 Abrir el reporte de cobertura**

```powershell
Start-Process .\target\site\jacoco\index.html
```

**En pantalla:** muestra el reporte, haz clic en un paquete y una clase para ver las líneas
en verde (cubiertas) y rojo (no cubiertas).

**Qué decir:**

> “El reporte muestra cobertura por paquete, clase, método y rama. En esta corrida la
> cobertura global ronda el 34 % de instrucciones. Las zonas rojas son una oportunidad
> para agregar más pruebas de integración.”

---

### Escena 6 · SonarQube (3:00)

**6.1 Levantar el servidor (si no estaba arriba)**

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose -f docker-compose.sonarqube.yml up -d
docker compose -f docker-compose.sonarqube.yml logs -f sonarqube
```

Espera `SonarQube is operational` y abre:

```text
http://localhost:9000
```

**Qué decir:**

> “SonarQube corre aparte, con su propia base PostgreSQL, para no mezclarse con la app.
> Se levanta con un compose independiente.”

**6.2 Crear el proyecto y el token**

En pantalla, en SonarQube:

1. **Projects → Create project → Manually**.
2. Project key: `serviteca-jm` (debe coincidir con `sonar-project.properties`).
3. Display name: `Serviteca JM`.
4. **My Account → Security → Generate Tokens** → nombre `serviteca-video` → **Generate** → copiar.

**Qué decir:**

> “El project key tiene que ser exactamente `serviteca-jm`, porque así lo declara
> `sonar-project.properties`. El token es la credencial que usa Maven para subir el análisis.”

**6.3 Ejecutar el análisis**

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0
.\mvnw.cmd -B -ntp sonar:sonar `
  -Dsonar.host.url=http://localhost:9000 `
  -Dsonar.token=TU_TOKEN_AQUI
```

**En pantalla:** al final Maven imprime la URL del proyecto, por ejemplo:

```text
ANALYSIS SUCCESSFUL
http://localhost:9000/dashboard?id=serviteca-jm
```

Ábrela y muestra:

- **Overview**: calidad general y Quality Gate.
- **Issues**: bugs, vulnerabilidades, code smells.
- **Measures → Coverage**: cobertura importada de JaCoCo.
- **Code**: navega un archivo y muestra los marcadores.

**Qué decir:**

> “SonarQube no ejecuta pruebas: lee el código y los reportes que ya generaron Maven y
> JaCoCo. Aquí vemos complejidad, duplicación, malas prácticas, secretos embebidos y la
> cobertura por archivo. Las pruebas dicen *si funciona*; SonarQube dice *qué tan sano está el código*.”

---

### Escena 7 · Cierre (0:40)

**En pantalla:** la tabla de trazabilidad de la guía
(`docs/GUIA_PRUEBAS_SELENIUM_SONARQUBE.md`, sección 6) o una diapositiva.

**Qué decir:**

> “Resumen: Selenium cubre la caja negra y valida los tres bugs desde la interfaz.
> JUnit y MockMvc cubren la caja blanca, JaCoCo mide la cobertura y SonarQube analiza la
> calidad. La misma prueba que hoy previene la regresión del ojo de la contraseña, de la
> cita que no se guardaba y de las categorías vacías, queda automatizada y se puede correr
> en cada cambio.”

---

## D. Comandos de referencia (todo en uno)

```powershell
# ---------- Preparación ----------
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:Path = "$env:JAVA_HOME\bin;C:\maven\bin;$env:Path"
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0

# ---------- App ----------
$env:SERVITECA_DB_PASSWORD = "1234"
.\mvnw.cmd spring-boot:run

# ---------- Caja negra (en otra terminal) ----------
$env:SERVITECA_E2E_URL = "http://localhost:8082"
$env:SERVITECA_E2E_ADMIN_EMAIL = "sebastian.vargas@serviteca.test"
$env:SERVITECA_E2E_ADMIN_PASSWORD = "AdminServiteca2026*"
$env:SERVITECA_E2E_HEADLESS = "false"
$env:SERVITECA_E2E_PAUSA_MS = "800"
.\mvnw.cmd -B -ntp verify -Pe2e
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=LoginE2ETest
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=CitasE2ETest

# ---------- Caja blanca ----------
$env:SERVITECA_TEST_DB_URL = "jdbc:postgresql://localhost:5432/serviteca_test"
$env:SERVITECA_TEST_DB_USER = "postgres"
$env:SERVITECA_TEST_DB_PASSWORD = "1234"
.\mvnw.cmd -B -ntp clean verify
Start-Process .\target\site\jacoco\index.html

# ---------- SonarQube ----------
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose -f docker-compose.sonarqube.yml up -d
# abrir http://localhost:9000, crear proyecto "serviteca-jm" y generar token
cd .\serviteca-jm_v5.0
.\mvnw.cmd -B -ntp sonar:sonar `
  -Dsonar.host.url=http://localhost:9000 `
  -Dsonar.token=TU_TOKEN_AQUI
```

---

## E. Problemas comunes **en cámara**

| Síntoma | Qué hacer en el momento |
|---|---|
| Chrome no abre / `SessionNotCreatedException` | Cierra Chrome, actualízalo y vuelve a ejecutar. Selenium Manager descarga el driver. |
| “La aplicación no responde” y todo sale *skipped* | La app no está arriba. Vuelve a la escena 2 y revisa `/actuator/health`. |
| Las pruebas con sesión se omiten | Falta `SERVITECA_E2E_ADMIN_EMAIL` o `_PASSWORD`. |
| `ElementClickInterceptedException` | Ya está mitigado: `clic()` hace scroll y usa clic JS de respaldo. |
| SonarQube no abre | Faltan 1–3 min de arranque o Docker tiene poca RAM. Revisa `docker compose logs sonarqube`. |
| Sonar no muestra cobertura | Ejecuta `clean verify` **antes** de `sonar:sonar`. |
| El selector de inventario queda vacío | La base no tiene productos; usa una base con catálogo. |

**Consejo:** si algo falla en cámara, no lo cortes: explica el mensaje y muestra cómo lo
solucionas. Eso demuestra dominio de la herramienta.

---

## F. Después de grabar (limpieza)

```powershell
# Detener la app: Ctrl + C en su terminal

# Detener SonarQube (conserva datos)
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose -f docker-compose.sonarqube.yml down

# Opcional: borrar la base de test
$env:PGPASSWORD = "1234"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres `
  -c "DROP DATABASE serviteca_test;"
```

> Las pruebas E2E crean un cliente, un vehículo y una cita reales en la base que uses.
> Para el video se recomienda usar una base de **dev/test**, nunca producción.

---

## G. Frases clave para la narración

- “Caja negra: pruebo lo que el usuario ve, sin mirar el código.”
- “Caja blanca: pruebo la estructura, las ramas y la calidad interna.”
- “Selenium maneja el navegador; no reemplaza las pruebas unitarias.”
- “JaCoCo mide qué líneas se ejecutaron; SonarQube evalúa qué tan sano está el código.”
- “Las E2E viven en un perfil aparte para no obligar a tener la app levantada en cada compilación.”
- “Cada bug corregido quedó con una prueba de regresión que evita que vuelva.”
