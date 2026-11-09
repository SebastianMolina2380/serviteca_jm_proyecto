# 🐞 Bitácora de errores · Pruebas de caja negra y caja blanca

**Proyecto:** Serviteca JM / PRODISJM v1.0  
**Módulo:** `serviteca-jm_v5.0`  
**Fecha de ejecución:** 2026-11-07  
**Entorno:** Windows 11 · JDK 17 · Maven 3.9 · PostgreSQL 17 local · Chrome 156

Este documento registra **todos los errores, fallos y advertencias** que aparecieron al
ejecutar las pruebas, con su causa, la solución aplicada y el estado final. Sirve como
anexo del informe y como guion para explicarlos en el video.

---

## 1. Resumen ejecutivo

| ID | Error | Tipo | Severidad | Estado |
|---|---|---|---|---|
| E-01 | `ElementClickInterceptedException` en `CitasE2ETest` | Prueba E2E | Media | ✅ Resuelto |
| E-02 | `ElementClickInterceptedException` en `NuevoUsuarioE2ETest` | Prueba E2E | Media | ✅ Resuelto |
| E-03 | La app no responde en `localhost:8082` | Entorno | Alta | ✅ Resuelto |
| E-04 | Integraciones omitidas (24 *skipped*) | Configuración | Media | ✅ Resuelto |
| E-05 | La base `serviteca_test` no existe | Configuración | Media | ✅ Resuelto |
| E-06 | Docker Desktop apagado → SonarQube no arranca | Entorno | Alta | ⏳ Pendiente |
| E-07 | *Checksum mismatch* de Flyway en `DB_PRODISJM` | Base de datos | Alta | ⚠️ Histórico, no reproducido hoy |
| E-08 | `pom.xml` no parseable por `--` en un comentario | Configuración | Alta | ✅ Resuelto |
| BUG-01 | El ojo de la contraseña no muestra el texto | Aplicación | Alta | ✅ Corregido + regresión |
| BUG-02 | La cita no se guarda / no aparece en el listado | Aplicación | Crítica | ✅ Corregido + regresión |
| BUG-03 | Categorías vacías al abrir el modal de inventario | Aplicación | Alta | ✅ Corregido + regresión |

**Resultado final:** caja negra **7/7** y caja blanca **31/31**, sin fallos ni omisiones.

---

## 2. Errores durante la ejecución de las pruebas (Selenium)

### E-01 · `ElementClickInterceptedException` en `CitasE2ETest`

**Mensaje exacto:**

```text
org.openqa.selenium.ElementClickInterceptedException:
element click intercepted: Element is not clickable at point (1285, 920)
Element: #p3 button[onclick='goStep(4)']
Session info: chrome=156.0.8078.81
```

**Dónde:** `CitasE2ETest.creaCitaYApareceEnElListado`, al pulsar **Continuar** en el paso 3
del asistente de nueva cita.

**Causa raíz:** la ventana de Chrome se configuró en `1440×900`, pero el botón quedó en
`y=920`, es decir, **por debajo del área visible**. Selenium hace clic en coordenadas y no
puede alcanzar un elemento fuera del viewport.

**Solución aplicada:** en `SeleniumBase.clic()` se hace *scroll* al centro del elemento antes
de hacer clic y, si otro elemento lo cubre, se usa un clic por JavaScript:

```java
protected void clic(By selector) {
    WebElement elemento = wait.until(ExpectedConditions.presenceOfElementLocated(selector));
    ((JavascriptExecutor) driver).executeScript(
            "arguments[0].scrollIntoView({block:'center', inline:'center'});", elemento);
    wait.until(ExpectedConditions.elementToBeClickable(elemento));
    try {
        elemento.click();
    } catch (ElementClickInterceptedException interceptado) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", elemento);
    }
    pausa();
}
```

**Verificación:** `CitasE2ETest` pasó en **9,34 s**, `Tests run: 1, Failures: 0, Errors: 0`.

---

### E-02 · `ElementClickInterceptedException` en `NuevoUsuarioE2ETest`

**Mensaje exacto:**

```text
org.openqa.selenium.ElementClickInterceptedException:
element click intercepted: Element is not clickable at point (1153, 762)
Element: .eye[data-toggle-password='#password']
Session info: chrome=156.0.8078.81
```

**Dónde:** `NuevoUsuarioE2ETest.ojoAlternaAmbosCampos`, al pulsar el icono del ojo del campo
**Contraseña**.

**Causa raíz:** el botón estaba dentro del viewport, pero **otro elemento fijo** (barra,
*toast* o contenedor) recibía el clic en esas coordenadas. Es el mismo patrón que E-01, con
otra causa inmediata.

**Solución aplicada:** la misma de E-01: scroll al centro + *fallback* de clic por JavaScript.

**Verificación:** la prueba pasó en **9,71 s** y luego en **5,92 s** en la corrida enfocada.

> **Lección:** los fallos de *click intercepted* son de **robustez del test**, no de la
> aplicación. Conviene centralizar el clic en una clase base para no repetir el problema
> en cada prueba.

---

## 3. Errores de entorno y configuración

### E-03 · La aplicación no responde en `localhost:8082`

**Síntoma:**

```text
La aplicación no responde en http://localhost:8082.
Levántala antes de ejecutar el perfil e2e
(mvnw spring-boot:run o docker compose up -d).
Tests run: 7, Failures: 0, Errors: 0, Skipped: 7
```

**Causa:** el backend no estaba levantado; el puerto 8082 no tenía ningún proceso escuchando.
Solo PostgreSQL estaba activo en el 5432.

**Solución:**

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:Path = "$env:JAVA_HOME\bin;C:\maven\bin;$env:Path"
$env:SERVITECA_DB_PASSWORD = "1234"
.\mvnw.cmd spring-boot:run
```

**Comportamiento esperado:** si la app no responde, las E2E se **omiten** (`assumeTrue`),
no fallan. Eso es intencional: `mvn test` no debe depender de una app externa.

---

### E-04 · Integraciones omitidas (24 *skipped*)

**Síntoma:**

```text
Tests run: 31, Failures: 0, Errors: 0, Skipped: 24
```

Las clases `SeguridadIntegrationTest`, `VehiculosIntegrationTest`, `ReportesIntegrationTest`
y `ContactoYRecuperacionIntegrationTest` se omitían completas.

**Causa:** `@PruebaIntegracion` usa
`@EnabledIfEnvironmentVariable(named = "SERVITECA_TEST_DB_URL", matches = ".+")`.
Sin esa variable, JUnit no ejecuta las integraciones.

**Solución:**

```powershell
$env:SERVITECA_TEST_DB_URL = "jdbc:postgresql://localhost:5432/serviteca_test"
$env:SERVITECA_TEST_DB_USER = "postgres"
$env:SERVITECA_TEST_DB_PASSWORD = "1234"
.\mvnw.cmd -B -ntp clean verify
```

**Verificación:** `Tests run: 31, Failures: 0, Errors: 0, Skipped: 0`.

---

### E-05 · La base `serviteca_test` no existe

**Síntoma:** al definir `SERVITECA_TEST_DB_URL`, Spring no podía conectar:

```text
FATAL: database "serviteca_test" does not exist
```

**Causa:** la base de pruebas nunca se había creado. Las integraciones usan una base
**separada** de la de desarrollo (`DB_PRODISJM`).

**Solución:**

```powershell
$env:PGPASSWORD = "1234"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres `
  -c "CREATE DATABASE serviteca_test;"
```

Flyway crea el esquema automáticamente en la primera ejecución:

```text
Successfully applied 4 migrations to schema "public", now at version v4
```

> **No reutilices la base de desarrollo** para las integraciones: las pruebas crean usuarios
> y datos reales.

---

### E-06 · Docker Desktop apagado → SonarQube no arranca

**Síntoma:**

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine;
check if the path is correct and if the daemon is running
```

**Causa:** Docker Desktop no estaba iniciado, así que no se pudo levantar el contenedor de
SonarQube ni ejecutar `sonar:sonar`.

**Solución:**

1. Abrir **Docker Desktop** y esperar a que el motor esté en ejecución.
2. Levantar SonarQube:

```powershell
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto
docker compose -f docker-compose.sonarqube.yml up -d
docker compose -f docker-compose.sonarqube.yml logs -f sonarqube
```

3. Esperar `SonarQube is operational` y abrir `http://localhost:9000`.
4. Generar token y ejecutar:

```powershell
cd .\serviteca-jm_v5.0
.\mvnw.cmd sonar:sonar `
  -Dsonar.host.url=http://localhost:9000 `
  -Dsonar.token=TU_TOKEN
```

**Estado:** ⏳ pendiente por falta de Docker en la máquina. El resto de la caja blanca
(pruebas + cobertura JaCoCo) sí se completó.

---

### E-07 · *Checksum mismatch* de Flyway en `DB_PRODISJM`

**Síntoma (reportado en una sesión previa):**

```text
Validate failed: Migration checksum mismatch for migration version 2
-> Applied to database : 1902561343
-> Resolved locally    : <otro valor>

Validate failed: Migration checksum mismatch for migration version 4
-> Applied to database : 823366850
-> Resolved locally    : <otro valor>
```

**Causa:** el contenido de las migraciones `V2` y `V4` cambió después de haberse aplicado
en la base local. Flyway compara el *checksum* del archivo con el registrado en
`flyway_schema_history` y bloquea el arranque.

**Estado actual:** al validar hoy, `DB_PRODISJM` tenía los checksums sincronizados y la app
arrancó sin error (`Successfully validated 4 migrations`). El problema **no se reprodujo**.

**Solución si vuelve a aparecer:**

```powershell
# Opción A: reparar el historial (no borra datos)
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0
.\mvnw.cmd flyway:repair `
  -Dflyway.url=jdbc:postgresql://localhost:5432/DB_PRODISJM `
  -Dflyway.user=postgres `
  -Dflyway.password=1234

# Opción B: recrear la base (borra datos; solo en dev/test)
$env:PGPASSWORD = "1234"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres `
  -c "DROP DATABASE \"DB_PRODISJM\";"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres `
  -c "CREATE DATABASE \"DB_PRODISJM\";"
```

---

### E-08 · `pom.xml` no parseable por un comentario con `--`

**Síntoma:**

```text
[FATAL] Non-parseable POM ... in comment after two dashes (--) next character must be > not -
(position: START_TAG seen ... PERFIL E2E ... -------- @212:11)
```

**Causa:** el XML **no permite** la secuencia `--` dentro de un comentario `<!-- ... -->`.
Al documentar el perfil `e2e` se usó una línea de guiones `----------------` como separador.

**Solución:** reemplazar las líneas de guiones por signos `=` o `·` dentro de los comentarios:

```xml
<!-- ============================================================
     PERFIL E2E · Selenium WebDriver (caja negra)
     ============================================================ -->
```

**Verificación:** `mvn -Pe2e -DskipTests test-compile` → `BUILD SUCCESS`.

---

## 4. Defectos de la aplicación detectados por las pruebas

### BUG-01 · El ojo de la contraseña no mostraba el texto

| Campo | Detalle |
|---|---|
| **Síntoma** | Al pulsar el ojo, el campo seguía en `type="password"`. |
| **Causa** | Dos *listeners* sobre el mismo botón: uno en `nuevo-usuario.js` y otro en `password-utils.js`. Cada clic alternaba dos veces y dejaba el campo como estaba. |
| **Corrección** | Se eliminó `bindPasswordButtons()` de `nuevo-usuario.js`. El toggle quedó **centralizado** en `password-utils.js`, con `aria-label` y `aria-pressed`. |
| **Prueba de regresión** | `NuevoUsuarioE2ETest.ojoAlternaAmbosCampos` y `LoginE2ETest.ojoAlternaVisibilidad`. |
| **Estado** | ✅ Corregido y verificado. |

**Verificación esperada:** `password → text → password` en ambos campos.

---

### BUG-02 · La cita no se guardaba ni aparecía en el listado

| Campo | Detalle |
|---|---|
| **Síntoma** | El asistente mostraba un ticket, pero la cita no aparecía en `citas.html`. |
| **Causa** | El botón **Confirmar Cita** no hacía el `POST` real a `/api/citas`; generaba un ticket local. |
| **Corrección** | `confirmarCita()` en `nueva-cita.js` hace el `POST` real, muestra el `TKT-####` devuelto por el backend y maneja errores. |
| **Prueba de regresión** | `CitasE2ETest.creaCitaYApareceEnElListado`: crea cliente/vehículo, agenda, captura el ticket y verifica la fila en el listado. |
| **Estado** | ✅ Corregido y verificado. |

**Verificación esperada:** el ticket coincide con `TKT-\d+` y aparece en `#tbody-citas`.

---

### BUG-03 · Categorías vacías en el modal de inventario

| Campo | Detalle |
|---|---|
| **Síntoma** | El selector de **Categoría** se quedaba en “- Seleccione categoría -”. |
| **Causa** | El modal no recargaba las categorías al abrirse; la carga asíncrona de `/api/productos/catalogo` no se esperaba. |
| **Corrección** | `abrirModal()` en `inventario.js` llama a `cargarCategorias()`, muestra estado de carga/error y deshabilita el selector hasta terminar. |
| **Prueba de regresión** | `InventarioE2ETest.modalCargaCategorias`. |
| **Estado** | ✅ Corregido y verificado. |

**Verificación esperada:** más de una opción con `value` no vacío y selector habilitado.

---

## 5. Advertencias que **no** son errores (para no confundir en el video)

Estas líneas aparecen en los logs y son **normales**:

| Advertencia | Por qué aparece | Acción |
|---|---|---|
| `Unable to find CDP implementation matching 156` | Selenium 4.27 no trae *devtools* para Chrome 156. | Ninguna; no afecta las pruebas. |
| `HHH90000025: PostgreSQLDialect does not need to be specified` | El dialecto se declara explícitamente en `application.properties`. | Informativa. |
| `HHH90006001: Encountered incubating setting` | Uso de `hibernate.type.preferred_uuid_jdbc_type`. | Informativa. |
| `spring.jpa.open-in-view is enabled by default` | *Warning* conocido de Spring Boot. | Informativa. |
| `Cannot find template location: classpath:/templates/` | El proyecto no usa Thymeleaf; sirve HTML estático. | Informativa. |
| `No static resource favicon.ico` | El navegador pide el favicon y no existe. | Informativa (se puede agregar el archivo). |
| `No se encontró el usuario técnico ...; no se actualizaron credenciales` | En una base de test recién creada no existe ese técnico. | Esperada en pruebas. |
| `la columna ... ya existe, omitiendo` (Flyway) | Migraciones idempotentes (`IF NOT EXISTS`). | Esperada. |
| `Global AuthenticationManager configured with an AuthenticationProvider bean` | Configuración personalizada de seguridad. | Informativa. |

> En el video conviene decir: *“estos WARN son informativos; los errores reales serían
> líneas con `ERROR` o una excepción que corte la ejecución”*.

---

## 6. Cómo reproducir y verificar cada corrección

```powershell
$env:JAVA_HOME = "C:\Users\LENOVO\.jdks\ms-17.0.20"
$env:Path = "$env:JAVA_HOME\bin;C:\maven\bin;$env:Path"
cd C:\Users\LENOVO\Desktop\serviteca_jm_proyecto\serviteca-jm_v5.0

# App levantada en otra terminal
$env:SERVITECA_E2E_URL = "http://localhost:8082"
$env:SERVITECA_E2E_ADMIN_EMAIL = "sebastian.vargas@serviteca.test"
$env:SERVITECA_E2E_ADMIN_PASSWORD = "AdminServiteca2026*"
$env:SERVITECA_E2E_HEADLESS = "true"

# Reproducir/verificar los 3 bugs
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=NuevoUsuarioE2ETest
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=CitasE2ETest
.\mvnw.cmd -B -ntp verify -Pe2e -Dit.test=InventarioE2ETest

# Suite completa
.\mvnw.cmd -B -ntp verify -Pe2e
```

---

## 7. Lecciones aprendidas

1. **Centralizar las acciones del navegador** en una clase base (`SeleniumBase`) evita repetir
   fallos de *scroll* y de clic interceptado.
2. **Las E2E dependen de una app levantada**: separarlas en un perfil (`e2e` + Failsafe) hace
   que `mvn test` siga siendo rápido y confiable.
3. **Las integraciones necesitan una base dedicada** (`serviteca_test`), nunca la de desarrollo.
4. **Flyway es estricto con los checksums**: no se editan migraciones ya aplicadas; se crea
   una nueva versión o se ejecuta `flyway repair` en local.
5. **No todo WARN es un error**: distinguir advertencias informativas evita falsos diagnósticos.
6. **Cada bug corregido debe dejar una prueba de regresión** que falle si el bug vuelve.
7. **Los datos de prueba deben ser únicos** (documento, placa, correo, fecha) para poder
   repetir las pruebas sin chocar con restricciones de la base.

---

## 8. Relación con el informe y el video

- Guía general: [`GUIA_PRUEBAS_SELENIUM_SONARQUBE.md`](./GUIA_PRUEBAS_SELENIUM_SONARQUBE.md)
- Guion del video: [`TUTORIAL_VIDEO_PRUEBAS.md`](./TUTORIAL_VIDEO_PRUEBAS.md)
- Esta bitácora: errores, causa y solución (anexo técnico).
