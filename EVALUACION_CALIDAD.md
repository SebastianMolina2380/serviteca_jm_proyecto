# INSTRUMENTO DE EVALUACIÓN DE CALIDAD DE SOFTWARE

## PROYECTO: SERVITECA

### DATOS GENERALES DE LA EVALUACIÓN

| Campo | Valor |
| :--- | :--- |
| **Software Evaluado** | Serviteca |
| **Versión** | 5.0 (backend `DB_PRODISJM`, puerto 8082) |
| **Fecha de Evaluación** | 22/10/2026 |
| **Evaluador** | Desarrollador Frontend Senior — revisión estática de código + verificación funcional |
| **Alcance de la revisión** | 77 clases Java · 17 controladores · 12 entidades · 12 repositorios · 17 vistas · 19 CSS · 25 JS · 1 fichero de pruebas |

---

## 1. FUNCIONALIDAD

*Evalúa si el software cumple correctamente con las funciones especificadas.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| Cumple con los requisitos funcionales (según especificaciones) | [x] | [ ] | CRUD completo sobre 12 entidades (Cita, DetalleFactura, Factura, Inventario, NumeracionFactura, PagoFactura, Producto, Proveedor, Seguimiento, Servicio, Usuario, Vehiculo) con 17 controladores REST y 17 vistas. Cobertura: clientes, citas, inventario, facturación, pagos, reportes y portal de cliente. |
| Las salidas de las funciones son correctas y precisas | [x] | [ ] | Corregidos 3 defectos reales en la última iteración: (a) el filtro de citas comparaba `'Confirmada'` contra el valor almacenado `CONFIRMADO`, dejando **20 de 31 filas inalcanzables**; (b) el botón "Registrar entrada" de inventario **no tenía manejador**; (c) el chatbot leía `result.text` en lugar de `result.texto` y no respondía. |
| Proporciona las funciones necesarias para el uso previsto | [x] | [ ] | Cubre el ciclo completo: agendamiento → seguimiento → factura → pago → reporte. Chatbot con catálogo real y enlaces directos de agendamiento. |
| Maneja correctamente errores y excepciones | [x] | [ ] | `ApiExceptionHandler` (`@RestControllerAdvice`) con 6 manejadores tipados: validación, recurso inexistente, conflicto de integridad y error inesperado. |
| El software permite la integración con otros sistemas | [ ] | [x] | **Facturación electrónica DIAN incompleta.** `serviteca.facturacion.software.*` (nombre, fabricante, NIT, proveedor tecnológico) tienen **valor por defecto vacío** (`application.properties`), y la DIAN exige esos campos para validar el XML. Además, `POST /api/mi/vehiculos` exige rol CLIENTE, por lo que un ADMIN no puede dar de alta vehículos. |

---

## 2. FIABILIDAD

*Mide la capacidad del software de mantener su nivel de rendimiento bajo condiciones normales de uso.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| El software es estable y no se cuelga ni falla inesperadamente | [x] | [ ] | Spring Boot sobre PostgreSQL, operación continua sin caídas durante la sesión de pruebas. Detectado y corregido un fallo silencioso de rol: la BD almacena `ADMIN` y el código comparaba `'admin'`, por lo que el borrado fallaba sin emitir mensaje. |
| Puede recuperarse correctamente de fallos | [x] | [ ] | Las excepciones devuelven JSON con `timestamp`, `status`, `error` y `message`. El error inesperado responde mensaje genérico sin exponer traza. Respuestas 401/403 personalizadas en `SecurityConfig`. |
| Proporciona disponibilidad adecuada durante su uso | [x] | [ ] | Disponibilidad continua en `localhost:8082` en entorno de desarrollo. **No se ejecutaron pruebas de carga.** |
| Muestra coherencia en su comportamiento en diferentes entornos | [ ] | [x] | La URL de la base de datos apuntaba a `localhost:5432` de forma fija y **no existían perfiles** (`application-dev.properties` / `-prod`). *Mitigado parcialmente en esta iteración: los datos de conexión ahora admiten sobrescritura por variable de entorno.* |

---

## 3. USABILIDAD

*Evalúa la facilidad con la que los usuarios pueden interactuar con el software.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| La interfaz de usuario es intuitiva y fácil de aprender | [x] | [ ] | Paleta institucional consistente (verde oscuro + acento dorado `#B3945D`), `styles.css` como única fuente de reset global, Bootstrap eliminado. Asistentes paso a paso en la nueva cita. |
| Los elementos visuales y de navegación están claramente organizados | [x] | [ ] | Sidebar fijo de 240 px, breakpoints {600, 900, 1200}, contenido con margen dinámico. Corregido el solapamiento causado por `position: sticky` incompatible con el `overflow-x: hidden` del contenedor. |
| La documentación y la ayuda son claras y completas | [x] | [ ] | `README.md` (documento del proyecto) y `README-DESARROLLO.md` (guía técnica paso a paso). El chatbot actúa como ayuda en línea con base de conocimiento real. |
| El software proporciona retroalimentación adecuada al usuario | [x] | [ ] | Mensajes de validación institucionales, alertas, estados vacíos (`.citas-empty`, `#inv-alerta`) y marcado visual de la fila activa en la tabla de vehículos. |
| Las tareas más comunes se pueden realizar de manera eficiente | [x] | [ ] | Filtros por estado combinados con búsqueda en citas, selección dinámica de vehículo desde el registro (32 vehículos), respuestas rápidas del chatbot. |
| *Observación de accesibilidad* | [ ] | [x] | Las 17 vistas declaran `maximum-scale=1.0, user-scalable=no`, lo que **bloquea el zoom y viola WCAG 1.4.4**. Afecta a usuarios con baja visión. |

---

## 4. EFICIENCIA EN EL RENDIMIENTO

*Evalúa el uso de los recursos del sistema y la rapidez con la que el software realiza sus funciones.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| El software responde rápidamente a las interacciones del usuario | [x] | [ ] | Frontend estático + API REST; respuestas inmediatas con los volúmenes actuales (31 citas, 31 productos, 32 vehículos). |
| El tiempo de carga y procesamiento es aceptable | [x] | [ ] | CSS servidos con `Cache-Control: no-store` y service worker en modo *network-first*, lo que garantiza que siempre se entrega la versión vigente sin servir recursos obsoletos. |
| No hay bloqueos o retrasos significativos durante el uso intensivo | [ ] | No verificado | **No se ejecutaron pruebas de carga.** Se identificó sobrecarga evitable: `spring.jpa.show-sql=true` y `format_sql=true` añadían I/O de consulta en cada operación y volcaban el esquema a los registros. *Corregido en esta iteración: `show-sql` queda en `false`.* |

---

## 5. MANTENIBILIDAD

*Evalúa lo fácil que es realizar cambios o mejoras en el software.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| El código está bien documentado y estructurado | [x] | [ ] | Arquitectura en capas clara: `config` (2 clases) / `controladores` (17) / `modelos` (12) / `repository` (12). Frontend separado por vista, cada una con su hoja de estilos propia. |
| Es fácil localizar y corregir errores | [x] | [ ] | **Con reserva:** `serviteca-theme.css` aplica `#141414 !important` a **todos** los `input` del sistema. Esto provocó texto oscuro sobre fondo oscuro en el modal de inventario y obligó a una regla de anulación limitada al alcance `#inv-modal`. Los `!important` globales son un riesgo latente de mantenimiento. |
| El software es modular y escalable para futuras mejoras | [x] | [ ] | 12 entidades independientes y 17 endpoints desacoplados. Los módulos nuevos (reportes, facturación DIAN) se integraron sin reestructurar el núcleo. |
| Las pruebas automatizadas o manuales son fáciles de realizar | [ ] | [x] | **Cobertura de pruebas casi nula:** existe **1 único fichero** (`ServitecaJmApplicationTests.java`) con **13 líneas**, que solo comprueba que el contexto arranca. **Cero pruebas unitarias o de integración.** Las verificaciones de esta sesión se realizaron con *harness* temporales descartables. |

---

## 6. SEGURIDAD

*Evalúa las capacidades del software para proteger la información y los datos frente a accesos no autorizados.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| El software protege adecuadamente la información sensible | [ ] | [x] | La contraseña de la base de datos permanecía **en texto plano** dentro de `application.properties`, **publicado en un repositorio GitHub de acceso abierto**. *Mitigado parcialmente: ahora se lee por variable de entorno `SERVITECA_DB_PASSWORD`, pero conserva un valor por defecto local y **el valor antiguo sigue en el historial de Git**; es obligatorio rotar la contraseña.* |
| Tiene autenticación y control de acceso adecuados | [x] | [ ] | **Fortalezas verificadas:** `BCryptPasswordEncoder`; autorización granular por recurso con `hasRole` / `hasAnyRole`; `@EnableMethodSecurity` con `@PreAuthorize`; administrador inicial cuya contraseña proviene de **variable de entorno** (`InitialAdminBootstrap`); respuestas 401/403 genéricas. |
| Gestiona correctamente los errores sin exponer información crítica | [x] | [ ] | El manejador de excepción genérico responde únicamente *"Ocurrió un error interno al procesar la solicitud"*. **No filtra trazas de pila, nombres de clase ni mensajes internos.** |
| Cumple con las políticas de seguridad (por ejemplo, cifrado, privacidad de los datos) | [ ] | [x] | Hallazgos: **(a) CSRF deshabilitado** — `csrf.disable()` combinado con autenticación por **sesión HTTP** permite que un sitio externo ejecute acciones autenticadas; **(b) sin HTTPS** — el servidor expone tráfico plano en el puerto 8082. Contraseñas de usuario: **correctamente cifradas con BCrypt**. |

---

## 7. COMPATIBILIDAD

*Evalúa la capacidad del software para funcionar en diferentes entornos y con otros sistemas.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| El software es compatible con diferentes navegadores y sistemas operativos | [x] | [ ] | CSS propio sin dependencias de frameworks externos (Bootstrap eliminado) y sin propiedades no soportadas. Versión móvil Android construida con React Native + Expo. **Sin pruebas formales multi-navegador registradas.** |
| Se integra correctamente con bases de datos y servicios de terceros | [x] | [ ] | PostgreSQL 17 operativo y verificado. **Facturación DIAN: backend construido, pendiente de configuración del software emisor.** |
| Mantiene el formato y la integridad de los datos importados/exportados | [ ] | No verificado | No se ejecutaron pruebas de importación/exportación. **Riesgo de formato identificado:** los `.properties` requieren escapes `\uXXXX` para los acentos, porque Spring Boot los decodifica como ISO-8859-1; un UTF-8 literal produciría *"BoyacÃ¡"*. Está documentado en el propio archivo, pero es frágil ante ediciones manuales. |

---

## 8. PORTABILIDAD

*Evalúa la facilidad con la que el software puede ser transferido o adaptado a otros entornos de trabajo.*

| Criterio | Sí | No | Observaciones |
| :--- | :---: | :---: | :--- |
| El software puede instalarse y ejecutarse en diferentes entornos | [x] | [ ] | Incluye **`mvnw` / `mvnw.cmd`** (no requiere Maven instalado), Java 17 y Spring Boot. Procedimiento de instalación documentado en ambos README. |
| No requiere modificaciones sustanciales para su uso en otras plataformas | [ ] | [x] | **Requiere ajustes manuales inevitables:** los datos de conexión deben definirse por variable de entorno y los datos fiscales de DIAN dependen de variables **obligatorias y aún no declaradas** en el proyecto. No existe Docker ni archivo de despliegue. |

---

## RESUMEN DE RESULTADOS

| Criterio | Sí | No | No verificado |
| :--- | :---: | :---: | :---: |
| 1. Funcionalidad | 4 | 1 | 0 |
| 2. Fiabilidad | 3 | 1 | 0 |
| 3. Usabilidad | 5 | 1 | 0 |
| 4. Eficiencia | 2 | 0 | 1 |
| 5. Mantenibilidad | 3 | 1 | 0 |
| 6. Seguridad | 2 | 2 | 0 |
| 7. Compatibilidad | 2 | 1 | 1 |
| 8. Portabilidad | 1 | 1 | 0 |
| **TOTAL** | **22** | **8** | **2** |

---

## CONCLUSIONES GENERALES Y BITÁCORA

### Puntos fuertes

1. **Arquitectura sólida y consistente** — 77 clases Java organizadas en capas (`config` / `controladores` / `modelos` / `repository`), con 12 entidades y 17 endpoints desacoplados. Los módulos nuevos se integran sin reestructurar el núcleo.
2. **Autenticación bien implementada** — BCrypt, autorización por recurso y por método (`@PreAuthorize`), administrador inicial creado desde variable de entorno y respuestas 401/403 genéricas.
3. **Manejo de excepciones profesional** — `ApiExceptionHandler` centralizado con 6 manejadores tipados; el fallo inesperado devuelve mensaje genérico **sin filtrar trazas de pila**.
4. **Correcciones verificadas y medibles** — se eliminaron defectos que afectaban la operación real: 20 de 31 citas inalcanzables por el filtro, botón de inventario sin manejador, chatbot sin respuesta y texto oscuro sobre fondo oscuro en el modal.
5. **Interfaz consistente y responsive** — reset global único, breakpoints {600, 900, 1200}, sidebar fijo y paleta institucional uniforme en las 17 vistas.

### Áreas de mejora

1. **Credenciales de base de datos publicadas en texto plano** en un repositorio de acceso abierto; el valor permanece en el historial de Git.
2. **CSRF deshabilitado** con autenticación basada en sesión, combinado con **ausencia de HTTPS**.
3. **Cobertura de pruebas casi inexistente** — 1 fichero con 13 líneas para un sistema de 77 clases.
4. **Integración DIAN incompleta** — los campos obligatorios del software emisor están vacíos por defecto.
5. **Configuración rígida** — sin perfiles de Spring ni soporte de contenedores.
6. **Zoom bloqueado** en las 17 vistas, en contradicción con WCAG 1.4.4.

### Recomendaciones (priorizadas)

1. **Inmediato:** rotar la contraseña de PostgreSQL y eliminar el valor por defecto de `SERVITECA_DB_PASSWORD`.
2. **Inmediato:** habilitar CSRF para las operaciones mutantes o migrar a tokens con protección anti-CSRF.
3. **Corto plazo:** declarar HTTPS (certificado Let's Encrypt o *reverse proxy* nginx).
4. **Corto plazo:** completar `serviteca.facturacion.software.*` y validar el XML contra el *sandbox* de la DIAN.
5. **Medio plazo:** crear perfiles `dev` / `prod` y añadir `docker-compose.yml` con PostgreSQL.
6. **Medio plazo:** incorporar pruebas unitarias sobre los repositorios y de integración sobre los endpoints críticos (citas, facturación, inventario); habilitar CI que las ejecute en cada *push*.
7. **Medio plazo:** retirar `user-scalable=no` y sustituir el `!important` global de `serviteca-theme.css` por variables de tema.

### Estado final del software en términos de calidad

1. **Funcionalmente completo y operativo** en su alcance interno: cubre el ciclo de trabajo del taller con correcciones verificadas en la última iteración.
2. **No apto para exposición a internet en su estado actual** — la combinación de credenciales en el historial de Git, CSRF deshabilitado y ausencia de HTTPS constituye un riesgo alto, aunque la autenticación y el control de acceso están correctamente construidos.

### Plan de mejora

| Fase | Acciones |
| :--- | :--- |
| **Semana 1 — seguridad crítica** | Rotar contraseña de PostgreSQL y retirar el valor por defecto · habilitar CSRF · declarar perfil `prod` |
| **Semana 2 — funcionalidad** | Completar configuración DIAN y validar en *sandbox* · permitir que ADMIN registre vehículos · pruebas de carga sobre los endpoints de mayor uso |
| **Semana 3 — calidad** | Suite de pruebas unitarias sobre `repository` y de integración sobre los 17 endpoints · pipeline de CI con ejecución automática |
| **Semana 4 — despliegue** | HTTPS mediante *reverse proxy* · `docker-compose.yml` con PostgreSQL · perfiles `dev` / `prod` · eliminación del bloqueo de zoom (WCAG 1.4.4) |
| **Seguimiento mensual** | Revisión de vulnerabilidades con Dependabot, actualización de `README-DESARROLLO.md` y ampliación de la cobertura de pruebas en cada iteración |

---

## REGISTRO DE CAMBIOS APLICADOS DURANTE LA EVALUACIÓN

| Archivo | Cambio | Motivo |
| :--- | :--- | :--- |
| `application.properties` | Datos de conexión movidos a `${SERVITECA_DB_URL}` / `${SERVITECA_DB_USER}` / `${SERVITECA_DB_PASSWORD}` | Eliminar el texto plano del repositorio |
| `application.properties` | `spring.jpa.show-sql` → `false`; eliminado `format_sql` | Evitar la fuga del esquema en registros y la sobrecarga de I/O |
| `.gitignore` | Excluidos `application-local.properties` y `application-local.yml` | Permitir overrides locales sin publicarlos |

*Todos los cambios conservan los valores por defecto de desarrollo local, de modo que el arranque existente sigue funcionando sin configuración adicional.*
