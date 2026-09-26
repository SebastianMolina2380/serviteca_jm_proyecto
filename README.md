PRODIS JM — Sistema de Gestión Serviteca JM

Sistema web de gestión operativa para "Serviteca JM", taller automotriz ubicado en la vía Bypass Tunja-Sogamoso, Tunja, Boyacá, Colombia.

 Descripción

El SGCSJ es una aplicación web desarrollada para automatizar y centralizar los procesos críticos de Serviteca JM. Reemplaza los registros manuales por una solución tecnológica robusta que garantiza trazabilidad completa de cada servicio prestado, desde el agendamiento de la cita hasta la emisión de la factura.

Este proyecto fue desarrollado en el marco del programa **Tecnología en Análisis y Desarrollo de Software (ADSO)** del SENA — Ficha 3171149-B.

 Objetivo

Optimizar los procesos operativos de Serviteca JM mediante la implementación de un sistema de gestión digital que centralice el agendamiento, inventario y facturación, reduciendo tiempos de respuesta y eliminando registros manuales.

 Funcionalidades principales

| Módulo | Descripción |
|---|---|
| Gestión de usuarios| Registro, autenticación y control de roles |
| Agendamiento de citas| Creación, consulta y detección de conflictos de horario |
| Gestión de vehículos | Registro y seguimiento del historial por vehículo |
| Catálogo de servicios | Administración de servicios disponibles en el taller |
| Control de inventario | Gestión de productos y stock con alertas |
| Gestión de proveedores | Registro y vinculación de proveedores a productos |
| Facturación| Generación de facturas vinculadas a citas y servicios |
| Detalle de factura | Desglose de productos y servicios por factura |
| Seguimiento de servicios| Trazabilidad en tiempo real del estado de cada cita |
| Portal de cliente | Registro de el cliente en donde se muestran su historial de citas y los vehículos afiliados al usuario. |
| Reportes | Reportes de ventas , facturas y citas |

 Tecnologías utilizadas

 Backend
- Java 17
- Spring Boot 3.x
  - Spring Data JPA
  - Spring Security (BCrypt, autenticación)
  - Spring Web (REST)
- Hibernate (ORM)
- Lombok

 Base de datos
- PostgreSQL 15+

 Frontend
- HTML5 / CSS3 / JavaScript
- VS Code** como entorno de desarrollo frontend

 Herramientas
- IntelliJ IDEA — desarrollo backend
- Postman — pruebas de API
- Figma — diseño y prototipado
- Maven — gestión de dependencias

 Requisitos previos

Antes de instalar el proyecto, asegúrate de tener instalado:

- [ ] Java JDK 17 o superior
- [ ] Maven 3.8+
- [ ] PostgreSQL 15+
- [ ] Git
- [ ] IntelliJ IDEA (recomendado) o cualquier IDE compatible con Spring Boot
- [ ] Postman (opcional, para pruebas de API)

 Instalación y configuración

1. Clonar el repositorio

```bash
git clone [pendiente de completar — URL del repositorio GitHub]
cd sgcsj
```

 2. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE servitecajm;
```

 3. Ejecutar el esquema SQL

```bash
psql -U postgres -d servitecajm -f schema.sql
```

> El archivo `schema.sql` se encuentra en la raíz del proyecto e incluye todas las tablas, restricciones, índices y condiciones CHECK del modelo relacional.

 4. Configurar las variables de entorno

Crea un archivo `.env` en la raíz del proyecto o configura las variables directamente en `application.properties`:

```properties
# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/servitecajm
spring.datasource.username=TU_USUARIO
spring.datasource.password=TU_CONTRASEÑA

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# Seguridad
spring.security.user.name=[pendiente de completar]
spring.security.user.password=[pendiente de completar]

# Puerto
server.port=8080
```

> Nunca subas el archivo `application.properties` con credenciales reales al repositorio.** Usa `.gitignore` para excluirlo.

---
 Ejecución del proyecto

 Entorno de desarrollo

```bash
mvn spring-boot:run
```

La API estará disponible en: `http://localhost:8080`

 Compilar el proyecto

```bash
mvn clean install
```

 Generar el JAR para producción

```bash
mvn clean package -DskipTests
java -jar target/sgcsj-0.0.1-SNAPSHOT.jar
```

---

 Estructura del proyecto

```
sgcsj/
├── src/
│   └── main/
│       ├── java/com/servitecajm/api/
│       │   ├── controller/        # Controladores REST
│       │   ├── dto/               # Objetos de transferencia de datos
│       │   ├── entity/            # Entidades JPA
│       │   ├── mapper/            # Conversores entidad ↔ DTO
│       │   ├── repository/        # Repositorios Spring Data
│       │   └── service/           # Lógica de negocio
│       └── resources/
│           ├── application.properties
│           └── schema.sql
├── frontend/                      # HTML, CSS, JS
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   └── api.js                 # Capa centralizada de fetch al backend
│   └── pages/
├── pom.xml
└── README.md
```

---

 Modelo de base de datos

El sistema cuenta con **10 tablas** relacionales:

| Tabla | Descripción |
|---|---|
| `usuario` | Clientes y operarios del sistema |
| `vehiculo` | Vehículos registrados por usuario |
| `cita` | Agendamiento de servicios |
| `servicio` | Catálogo de servicios disponibles |
| `cita_servicio` | Tabla pivote M:N entre cita, servicio y producto |
| `proveedor` | Proveedores de insumos y productos |
| `producto` | Inventario de productos vinculados a proveedor |
| `factura` | Facturas generadas por cita o venta directa |
| `detalle_factura` | Desglose de productos y servicios por factura |
| `seguimiento` | Historial de mensajes y estado por cita |

---

 Ejemplos de endpoints REST

```http
# Obtener todas las citas
GET /api/citas

# Crear una nueva cita
POST /api/citas
Content-Type: application/json

{
  "idVehiculo": 1,
  "fecha": "2026-10-01T10:00:00",
  "estado": "PENDIENTE"
}

# Ajuste de stock de un producto
PATCH /api/productos/{id}/stock

# Historial cronológico de seguimiento por cita
GET /api/seguimientos/cita/{idCita}
```

---

 Pruebas

Las pruebas de los endpoints REST se realizan con **Postman**.

```bash
# Ejecutar pruebas unitarias
mvn test
```

> [pendiente de completar — colección Postman exportada y pruebas unitarias con JUnit]

---

 Seguridad

- Contraseñas encriptadas con **BCrypt**
- Flag `debeCambiarPassword` para migración de contraseñas débiles o en texto plano
- Endpoint dedicado para cambio de contraseña obligatorio
- Autenticación: [pendiente de completar — definir JWT vs. sesiones]

 Guía de contribución

1. Haz un fork del repositorio
2. Crea una rama para tu funcionalidad: `git checkout -b feature/nombre-funcionalidad`
3. Realiza tus cambios y haz commit: `git commit -m "feat: descripción del cambio"`
4. Sube la rama: `git push origin feature/nombre-funcionalidad`
5. Abre un Pull Request hacia la rama `main`

 Por favor, revisa que el código compila y pasa las pruebas antes de abrir un PR.



  Licencia

[pendiente de completar — definir tipo de licencia: MIT, Apache 2.0, propietaria, etc.]



## 📬 Contacto y soporte

Desarrollador: Sergio Aguilar - Sebastian Molina
Programa:Tecnología en Análisis y Desarrollo de Software — SENA  
Ficha:3171149-B  
Correo: sebastiandavidmolinarivera2380@gmail.com
        Sergioaguilartibata@gmail.com
Repositorio: https://github.com/SebastianMolina2380/serviteca_jm_proyecto


Proyecto desarrollado como solución real para Serviteca JM, Tunja, Boyacá, Colombia.
