# Serviteca JM — Sistema + Aplicación Móvil (APK)

Proyecto completo de **Serviteca JM**: backend web (Spring Boot) y
**aplicación móvil Android (APK)** construida con **React Native + Expo**.

---

## 📁 Estructura del proyecto

```
serviteca_jm_proyecto/
│
├── README.md                       ← Este archivo (guía paso a paso)
│
├── serviteca-jm_v5.0/              ← Backend Spring Boot (API REST)
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/main/
│       ├── java/com/serviteca/
│       │   ├── controladores/      ← Controllers REST (/api/...)
│       │   ├── config/             ← Seguridad, CORS, etc.
│       │   ├── modelos/            ← Entidades JPA
│       │   ├── repository/         ← Repositorios
│       │   └── servicios/          ← Lógica de negocio
│       └── resources/
│           ├── application.properties   ← Puerto 8082, PostgreSQL
│           └── static/                  ← Frontend web (HTML/JS)
│
└── serviteca-app/                  ← 📱 APP MÓVIL (React Native + Expo)
    ├── package.json                ← Dependencias y scripts de Expo
    ├── app.json                    ← Configuración de Expo (nombre, paquete Android)
    ├── eas.json                    ← Configuración de compilación (APK)
    ├── index.js                    ← Punto de entrada
    ├── App.js                      ← Componente raíz
    │
    └── src/
        ├── components/             ← Componentes reutilizables
        │   ├── Button.js
        │   ├── Card.js
        │   ├── Input.js
        │   ├── EstadoBadge.js
        │   ├── Loader.js
        │   └── VehiculoForm.js
        ├── screens/                ← Pantallas
        │   ├── LoginScreen.js            ← Inicio de sesión (cliente/empleados)
        │   ├── DashboardScreen.js        ← Pantalla principal (estado de servicios)
        │   ├── SolicitarMantenimientoScreen.js  ← Solicitud/registro de mantenimiento
        │   └── VehiculosScreen.js        ← Vehículos registrados
        ├── navigation/             ← Navegación entre pantallas
        │   └── RootNavigator.js
        ├── services/               ← Servicios de API (comunicación con el backend)
        │   ├── api.js              ← Cliente HTTP con sesión (cookie JSESSIONID)
        │   ├── authService.js      ← Login / logout / sesión
        │   ├── citaService.js      ← Citas
        │   ├── servicioService.js  ← Servicios automotrices
        │   └── vehiculoService.js  ← Vehículos
        ├── context/
        │   └── AuthContext.js      ← Estado de autenticación global
        ├── config/
        │   └── env.js              ← URL del backend (IP + puerto)
        ├── theme/
        │   └── index.js            ← Colores y estilos
        └── utils/
            └── format.js           ← Formato de fechas, horas y dinero
```

---

## ✅ Requisitos previos

1. **Node.js LTS** (18 o superior): https://nodejs.org
2. **Celular Android o iPhone** con la app **Expo Go** instalada:
   - Android: [Expo Go en Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iPhone: [Expo Go en App Store](https://apps.apple.com/app/expo-go/id982107779)
3. **El backend corriendo** (Spring Boot + PostgreSQL) en el puerto **8082**.
4. **PC y celular en la misma red WiFi**.
5. Cuenta gratuita de **Expo** (para generar el APK): https://expo.dev/signup

---

## 🚀 PASO A PASO: Probar la app en tu celular con Expo Go

### Paso 1 — Levanta el backend

```powershell
cd serviteca-jm_v5.0
./mvnw spring-boot:run
```

Verifica que responda: abre en el navegador
`http://localhost:8082/login.html`

> Si usas IntelliJ IDEA, también puedes ejecutar la clase
> `ServitecaJmApplication`.

### Paso 2 — Instala las dependencias de la app móvil

```powershell
cd serviteca-app
npm install
```

> Si Expo te avisa que algunas versiones no coinciden con tu Expo Go,
> ejecuta:
>
> ```powershell
> npx expo install --fix
> ```

### Paso 3 — Configura la IP de tu PC (IMPORTANTE)

El celular **no puede usar `localhost`**: para el celular, `localhost`
es él mismo. Debes indicar la **IP de tu PC** en la red local.

1. Obtén tu IP local:

   ```powershell
   ipconfig
   # Busca: "IPv4 Address. . . . . . . . . . . : 192.168.x.x"
   ```

2. Abre `serviteca-app/src/config/env.js` y fija la URL:

   ```js
   export const MANUAL_API_URL = 'http://192.168.x.x:8082/api';
   ```

> **Nota:** si no defines nada, la app detecta la IP automáticamente
> desde Expo (funciona bien en desarrollo con Expo Go).

### Paso 4 — Inicia el servidor de Expo

```powershell
cd serviteca-app
npx expo start
```

Se abrirá una terminal con un **código QR**.

### Paso 5 — Escanea el QR con Expo Go

- **Android:** abre Expo Go → pestaña *Scan QR* → escanea el QR.
- **iPhone:** usa la cámara de la cámara y acepta abrir el enlace.

La app compilará en unos segundos y mostrará la pantalla de **Login**.

> ⚠️ **Importante:**
>
> - PC y celular **deben estar en la misma red WiFi**.
> - El QR usa tu IP local; si tu Windows pregunta, permite el acceso
>   de Node.js a la red privada.
> - Si no conecta, usa el modo túnel (funciona por internet):
>
>   ```powershell
>   npx expo start --tunnel
>   ```
>
>   (requiere `npm install -g expo-cli` o acepta instalar `@expo/ngrok`).

### Paso 6 — Prueba las pantallas

| Pantalla | Qué hace |
|---|---|
| **Login** | Elige el rol (**Cliente**, **Técnico** o **Administrador**), escribe correo y contraseña y entra. |
| **Inicio (Dashboard)** | Tarjetas de resumen (total, en proceso, programados, completados), lista de servicios con **barra de progreso** y **estado**, y las citas programadas. Desliza hacia abajo para actualizar. |
| **Solicitar** | Registra tu vehículo (placa, marca, modelo…) y solicita el mantenimiento (fecha + hora). El cliente genera una **cita**; el empleado puede crear directamente un **servicio**. |
| **Vehículos** | Lista de vehículos (el cliente puede registrar más). |

**Credenciales:** usa las mismas cuentas del sistema web
(cliente / técnico / administrador). Si no recuerdas una, revisa la
tabla de usuarios en PostgreSQL (`DB_PRODISJM`).

---

## 📦 PASO A PASO: Generar el archivo .apk

El APK se genera en la nube con **EAS Build** (servicio oficial de Expo).
No necesitas instalar Android Studio.

### Paso 1 — Instala la CLI de EAS

```powershell
npm install -g eas-cli
```

### Paso 2 — Inicia sesión en Expo

```powershell
eas login
```

(Crea una cuenta gratis en https://expo.dev/signup si aún no tienes).

### Paso 3 — ⚙️ Configura la URL del backend ANTES de compilar

El APK instalado en tu celular debe apuntar a tu backend. Edita
`serviteca-app/src/config/env.js`:

```js
export const MANUAL_API_URL = 'http://192.168.x.x:8082/api';
```

Reemplaza `192.168.x.x` por la IP de tu PC (la del Paso 3 anterior).

> Si el celular usará la app **fuera de tu red WiFi**, necesitas una IP
> pública (por ejemplo, exponer el puerto 8082 con un túnel
> como *ngrok*: `ngrok http 8082` y usar la URL https que te da).

### Paso 4 — Compila el APK

```powershell
cd serviteca-app
eas build -p android --profile preview
```

- La primera compilación tarda **10–20 minutos**.
- Al terminar, la terminal muestra un **enlace de descarga**
  (también lo encuentras en https://expo.dev → tu cuenta → * Builds *).
- El perfil `preview` (definido en `eas.json`) genera un **`.apk`**
  instalable directamente en el celular.

### Paso 5 — Instala el APK en tu celular

1. Transfiere el `.apk` al celular (correo, USB, Drive, QR…).
2. En el celular: **Ajustes → Seguridad → Permitir fuentes desconocidas**
   (o acepta la advertencia al instalar).
3. Abre el archivo APK → **Instalar**.
4. Abre **Serviteca JM** e inicia sesión.

> 💡 Alternativa de descarga directa desde el celular: usa
> `eas build -p android --profile preview --json` para obtener el
> `artifactUrl` y compártelo.

### Compilación local (opcional, sin nube)

Requiere **JDK 17**, Android SDK y más espacio en disco:

```powershell
cd serviteca-app
eas build -p android --profile preview --local
```

---

## 🛠 Comandos útiles

| Comando | Descripción |
|---|---|
| `cd serviteca-app` | Entra a la carpeta de la app móvil |
| `npm install` | Instala dependencias |
| `npx expo start` | Inicia el servidor de desarrollo (QR) |
| `npx expo start --tunnel` | Inicia por túnel (si no conecta el QR) |
| `npx expo start --android` | Abre en un emulador Android |
| `npx expo install --fix` | Corrige versiones de paquetes Expo |
| `eas build -p android --profile preview` | **Genera el APK** |
| `eas build:list` | Lista tus compilaciones |

---

## 🔧 Solución de problemas

| Problema | Solución |
|---|---|
| Expo Go dice "Expected app version ... native version ..." | Ejecuta `npx expo install --fix` y reinicia `npx expo start -c` |
| No conecta con el QR | Misma WiFi, revisa la IP con `ipconfig`, o usa `npx expo start --tunnel` |
| Error "No se pudo conectar con el servidor" | Verifica que el backend esté en el puerto 8082 y que `MANUAL_API_URL` tenga la IP correcta; prueba `http://TU_IP:8082/login.html` desde el celular |
| "Correo, contraseña o rol incorrectos" | El rol elegido en la app debe coincidir con el rol del usuario en la BD |
| 401 en las pantallas | La sesión expiró: cierra sesión y vuelve a entrar |
| El APK no conecta con el backend | Reconfigura `MANUAL_API_URL` (Paso 3 de generación del APK) y compila de nuevo; el backend debe estar encendido |
| Puerto 8082 ocupado | Cambia `server.port` en `application.properties` y actualiza también el puerto en `src/config/env.js` (`API_PORT`) |

---

## 🔌 Endpoints del backend que usa la app

| Método | Ruta | Uso en la app |
|---|---|---|
| POST | `/api/auth/login` | Login (correo, contraseña, rol) |
| GET | `/api/auth/me` | Usuario de la sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/mi/servicios` | Servicios del cliente (Dashboard) |
| GET | `/api/servicios` | Servicios de todos (empleado) |
| POST | `/api/servicios` | Crear servicio (ADMIN/TECNICO) |
| GET | `/api/mi/citas` | Citas del cliente |
| GET | `/api/citas` | Todas las citas (empleado) |
| POST | `/api/citas` | Crear solicitud de cita |
| GET | `/api/mi/vehiculos` | Vehículos del cliente |
| GET | `/api/vehiculos` | Todos los vehículos (empleado) |
| POST | `/api/mi/vehiculos` | Registrar vehículo (cliente) |

> La app usa **sesión HTTP** (cookie `JSESSIONID`), igual que el sitio
> web: el cliente `src/services/api.js` la captura en el login y la
> envía en cada petición.
