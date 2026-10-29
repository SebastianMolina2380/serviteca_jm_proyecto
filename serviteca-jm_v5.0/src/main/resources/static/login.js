/* ============================================================
   LOGIN · AUTENTICACIÓN Y REDIRECCIÓN POR ROL
   ------------------------------------------------------------
   Cambios frente a la versión anterior:
     · No se preselecciona "admin": el rol que se envía es el que el
       usuario elige de forma explícita.
     · Se guarda el usuario con el rol normalizado a minúsculas.
     · Se deshabilita el botón y se muestra "VERIFICANDO…" mientras
       se espera la respuesta (evita dobles envíos).
     · La redirección usa location.replace() y una tabla de rutas por
       rol; así el botón "atrás" no vuelve al formulario de login.
     · Se respeta ?next= solo si la página es válida para ese rol.
   ============================================================ */
(() => {
  'use strict';

  const INICIO_POR_ROL = {
    admin: 'dashboard.html',
    tecnico: 'dashboard.html',
    cliente: 'portal-cliente.html'
  };

  const ACCESO_PAGINA = {
    'dashboard.html': ['admin', 'tecnico'],
    'portal-cliente.html': ['cliente'],
    'citas.html': ['admin', 'tecnico', 'cliente'],
    'nueva-cita.html': ['admin', 'tecnico', 'cliente'],
    'vehiculo.html': ['admin', 'tecnico', 'cliente'],
    'nuevo-vehiculo.html': ['admin', 'tecnico', 'cliente'],
    'facturacion.html': ['admin', 'tecnico', 'cliente'],
    'clientes.html': ['admin', 'tecnico'],
    'inventario.html': ['admin', 'tecnico'],
    'reportes.html': ['admin', 'tecnico'],
    'registrar-pago.html': ['admin', 'tecnico'],
    'usuarios.html': ['admin'],
    'nuevo-usuario.html': ['admin']
  };

  let rolSeleccionado = null;
  let enviando = false;

  function normalizarRol(valor) {
    return String(valor == null ? '' : valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function showLoginMessage(message, color = '#ff6b6b') {
    const errorBox = document.getElementById('err');
    if (!errorBox) return;
    errorBox.style.display = 'block';
    errorBox.style.color = color;
    errorBox.textContent = message;
  }

  function setRole(role, btn) {
    rolSeleccionado = normalizarRol(role);

    document.querySelectorAll('.role').forEach((el) => {
      const activo = el === btn;
      el.classList.toggle('active', activo);
      el.setAttribute('aria-pressed', String(activo));
    });
  }

  /* login.html usa onclick="setRole(...)": debe seguir siendo global. */
  window.setRole = setRole;

  function guardarSesion(datos, rol) {
    const usuario = { ...datos, rol, role: rol };
    const json = JSON.stringify(usuario);
    localStorage.setItem('servitecaUser', json);
    localStorage.setItem('user', json);
    localStorage.setItem(
      'servitecaToken',
      datos.token || datos.accessToken || 'session_active'
    );
    localStorage.setItem('nombreUsuario', usuario.nombre || '');
  }

  function destinoSeguro(parametro, rol) {
    if (!parametro) return null;
    const destino = String(parametro)
      .split('?')[0]
      .split('#')[0]
      .replace(/^.*\//, '')
      .toLowerCase();
    const permitido = ACCESO_PAGINA[destino];
    return permitido && permitido.includes(rol) ? destino : null;
  }

  async function doLogin() {
    if (enviando) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('pass');
    const boton = document.querySelector('#loginForm button[type="submit"]');

    if (!emailInput || !passwordInput) return;

    const correo = emailInput.value.trim();
    const contrasena = passwordInput.value;

    if (!correo || !contrasena) {
      showLoginMessage('❌ Ingresa correo y contraseña para continuar.');
      return;
    }

    if (!rolSeleccionado) {
      showLoginMessage('❌ Selecciona tu tipo de usuario: Cliente, Técnico o Admin.');
      return;
    }

    enviando = true;
    const textoOriginal = boton ? boton.textContent : '';
    if (boton) {
      boton.disabled = true;
      boton.setAttribute('aria-busy', 'true');
      boton.textContent = 'VERIFICANDO…';
    }
    showLoginMessage('Verificando credenciales…', '#94a3b8');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          correo,
          contrasena,
          rol: rolSeleccionado
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          (response.status === 401
            ? 'Correo, contraseña o tipo de usuario incorrectos.'
            : 'No fue posible iniciar sesión.')
        );
      }

      const rol = normalizarRol(data.rol || data.role);
      if (!INICIO_POR_ROL[rol]) {
        throw new Error('El servidor devolvió un rol no reconocido.');
      }

      guardarSesion(data, rol);
      showLoginMessage('✅ Inicio de sesión correcto', '#1f9d64');

      /* location.replace: el login no queda en el historial. */
      const siguiente = destinoSeguro(
        new URLSearchParams(location.search).get('next'),
        rol
      );
      window.location.replace(siguiente || INICIO_POR_ROL[rol]);

    } catch (error) {
      console.error(error);
      showLoginMessage(`❌ ${error.message}`);
      enviando = false;
      if (boton) {
        boton.disabled = false;
        boton.removeAttribute('aria-busy');
        boton.textContent = textoOriginal;
      }
    }
  }

  /* ------------------------------------------------------------
     Inicialización
     ------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    /* Estado inicial del selector: ninguno activo (sin rol por defecto). */
    document.querySelectorAll('.role').forEach((el) => {
      el.setAttribute('aria-pressed', String(el.classList.contains('active')));
    });

    /* Aviso si el usuario llegó aquí porque su sesión expiró. */
    const parametros = new URLSearchParams(location.search);
    if (parametros.get('expirada') === '1') {
      showLoginMessage('⚠️ Tu sesión expiró. Vuelve a iniciar sesión.');
    }

    /* Ojo de contraseña */
    document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.querySelector(btn.getAttribute('data-toggle-password'));
        if (!input) return;

        const esPassword = input.type === 'password';
        input.type = esPassword ? 'text' : 'password';

        btn.textContent = esPassword ? '🙈' : '👁';
        btn.setAttribute('aria-label', esPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        btn.setAttribute('title', esPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    });

    /* Formulario de login */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await doLogin();
      });
    }
  });
})();
