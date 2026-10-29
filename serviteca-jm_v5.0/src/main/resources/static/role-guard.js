/* ============================================================
   SERVITECA JM — ARRANQUE DE SESIÓN Y GUARDA DE ROLES
   ------------------------------------------------------------
   Se carga en el <head> de todas las páginas privadas, antes de
   cualquier otro script o contenido visible.

   POR QUÉ EXISTE
     Antes el rol se leía de localStorage y los enlaces del sidebar
     se ocultaban en DOMContentLoaded, es decir, después del primer
     pintado. El cliente veía durante un instante el menú completo
     de Administrador (y el pie con "Admin / Administrador").

   CÓMO FUNCIONA AHORA
     1. El documento arranca oculto (html[data-jm-auth="pending"]).
     2. Se valida la sesión contra /api/auth/me, que es la fuente de
        verdad; localStorage solo se usa como caché de arranque y
        como respaldo si el servidor no responde.
     3. Se comprueba el acceso a la página y, si no corresponde, se
        redirige al inicio del rol antes de pintar nada.
     4. Se aplica el rol al DOM y solo entonces se muestra la página.
     5. window.JM.ready permite a los scripts de cada página esperar
        a que el rol esté resuelto antes de pedir datos.

   REGLAS (deben coincidir con SecurityConfig):
     ADMIN                     -> todo
     ADMIN + TÉCNICO           -> dashboard, clientes, inventario,
                                  reportes, registrar-pago
     ADMIN + TÉCNICO + CLIENTE -> citas, nueva-cita, vehículo,
                                  nuevo-vehículo, facturación
     CLIENTE                   -> portal-cliente
   ============================================================ */
(() => {
  'use strict';

  const PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const PAGINAS_PUBLICAS = new Set(['login.html', 'recuperar.html', 'index.html', '']);

  const CLAVES_USUARIO = ['servitecaUser', 'user'];
  const CLAVES_SESION = [...CLAVES_USUARIO, 'servitecaToken', 'nombreUsuario'];

  const INICIO_POR_ROL = {
    admin: 'dashboard.html',
    tecnico: 'dashboard.html',
    cliente: 'portal-cliente.html'
  };

  const STAFF = ['admin', 'tecnico'];
  const TODOS = ['admin', 'tecnico', 'cliente'];

  const ACCESO_PAGINA = {
    'dashboard.html': STAFF,
    'clientes.html': STAFF,
    'inventario.html': STAFF,
    'reportes.html': STAFF,
    'registrar-pago.html': STAFF,

    'citas.html': TODOS,
    'nueva-cita.html': TODOS,
    'vehiculo.html': TODOS,
    'nuevo-vehiculo': TODOS,
    'nuevo-vehiculo.html': TODOS,
    'facturacion.html': TODOS,
    'factura_elect_teca_jm.html': TODOS,

    'usuarios.html': ['admin'],
    'nuevo-usuario.html': ['admin'],

    'portal-cliente.html': ['cliente']
  };

  /* Enlaces visibles en el sidebar para cada rol. */
  const NAVEGACION_POR_ROL = {
    admin: [
      'dashboard', 'clientes', 'citas', 'nueva-cita', 'vehiculo',
      'nuevo-vehiculo', 'usuarios', 'nuevo-usuario', 'inventario',
      'facturacion', 'reportes'
    ],
    tecnico: [
      'dashboard', 'clientes', 'citas', 'nueva-cita', 'vehiculo',
      'nuevo-vehiculo', 'inventario', 'facturacion', 'reportes'
    ],
    cliente: [
      'citas', 'nueva-cita', 'vehiculo', 'nuevo-vehiculo',
      'facturacion', 'portal-cliente'
    ]
  };

  const ETIQUETA_ROL = {
    admin: 'Administrador',
    tecnico: 'Técnico',
    cliente: 'Cliente'
  };

  /* Las páginas públicas no se guardan ni se ocultan. */
  if (PAGINAS_PUBLICAS.has(PAGE)) return;

  const root = document.documentElement;

  /* ------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------ */
  function normalizarRol(valor) {
    return String(valor == null ? '' : valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') /* técnico -> tecnico */
      .trim()
      .toLowerCase();
  }

  function leerUsuario() {
    for (const clave of CLAVES_USUARIO) {
      try {
        const valor = JSON.parse(localStorage.getItem(clave) || 'null');
        if (valor && typeof valor === 'object') return valor;
      } catch (_) {
        /* JSON corrupto: se ignora y se prueba la siguiente clave. */
      }
    }
    return null;
  }

  function guardarUsuario(datos, rol) {
    /* Se normaliza el rol a minúsculas: el resto de scripts ya
       comparan en minúsculas y así no hay dos formatos en juego. */
    const usuario = { ...datos, rol, role: rol };
    const json = JSON.stringify(usuario);
    try {
      localStorage.setItem('servitecaUser', json);
      localStorage.setItem('user', json);
    } catch (_) {
      /* Modo privado o cuota llena: la cookie de sesión sigue mandando. */
    }
    return usuario;
  }

  function limpiarSesion() {
    try {
      CLAVES_SESION.forEach((clave) => localStorage.removeItem(clave));
    } catch (_) {
      /* sin almacenamiento disponible */
    }
  }

  function inicioPara(rol) {
    return INICIO_POR_ROL[rol] || 'login.html';
  }

  function redirigir(url) {
    window.location.replace(url);
  }

  /* Destino ?next= solo si la página existe y el rol puede verla. */
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

  /* ------------------------------------------------------------
     Estado de carga: el documento no se pinta hasta resolver el rol
     ------------------------------------------------------------ */
  const estilo = document.createElement('style');
  estilo.id = 'jm-auth-style';
  estilo.textContent = `
    html[data-jm-auth="pending"] body { visibility: hidden !important; }
    #jm-auth-loading {
      position: fixed; inset: 0; display: none; place-items: center;
      background: #0f172a; color: #e2e8f0; text-align: center;
      font: 600 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
      z-index: 2147483647;
      /* visible aunque <body> esté oculto mientras se valida la sesión */
      visibility: visible;
    }
    html[data-jm-auth="pending"][data-jm-slow] #jm-auth-loading { display: grid; }
    #jm-auth-loading .jm-spinner {
      width: 34px; height: 34px; margin: 0 auto 12px; border-radius: 50%;
      border: 3px solid rgba(226, 232, 240, .25); border-top-color: #22c55e;
      animation: jm-spin .8s linear infinite;
    }
    @keyframes jm-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      #jm-auth-loading .jm-spinner { animation-duration: 2.4s; }
    }
  `;
  (document.head || root).appendChild(estilo);
  root.setAttribute('data-jm-auth', 'pending');

  let temporizadorLento = setTimeout(() => {
    root.setAttribute('data-jm-slow', '');
    montarCargador();
  }, 250);

  function montarCargador() {
    if (document.getElementById('jm-auth-loading')) return;
    const contenedor = document.createElement('div');
    contenedor.id = 'jm-auth-loading';
    contenedor.setAttribute('role', 'status');
    contenedor.setAttribute('aria-live', 'polite');
    contenedor.innerHTML =
      '<div><div class="jm-spinner" aria-hidden="true"></div>Verificando sesión…</div>';
    (document.body || root).appendChild(contenedor);
  }

  function terminarCarga() {
    clearTimeout(temporizadorLento);
    root.removeAttribute('data-jm-slow');
    root.removeAttribute('data-jm-auth');
    document.getElementById('jm-auth-loading')?.remove();
  }

  /* ------------------------------------------------------------
     Sesión: caché para arrancar + verificación con el servidor
     ------------------------------------------------------------ */
  let usuario = leerUsuario();
  let rol = normalizarRol(usuario?.rol || usuario?.role);

  /* Si la caché ya dice que esta página no es suya, se redirige
     antes de pintar. La comprobación definitiva la hace /me. */
  if (rol) {
    const permitido = ACCESO_PAGINA[PAGE];
    if (permitido && !permitido.includes(rol)) {
      redirigir(inicioPara(rol));
      return;
    }
  }

  const verificacion = (async () => {
    try {
      const control = new AbortController();
      const limite = setTimeout(() => control.abort(), 6000);

      const respuesta = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: control.signal
      });
      clearTimeout(limite);

      if (respuesta.status === 401 || respuesta.status === 403) {
        return { noAutorizado: true };
      }
      if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);

      const datos = await respuesta.json().catch(() => null);
      const rolServidor = normalizarRol(datos?.rol || datos?.role);
      if (!rolServidor) return { noAutorizado: true };

      return { usuario: datos, rol: rolServidor };
    } catch (error) {
      /* Servidor caído o demasiado lento: se mantiene la sesión en
         caché para no dejar al usuario fuera. El backend seguirá
         rechazando cualquier operación sin cookie válida. */
      console.warn('[JM] No se pudo verificar la sesión con el servidor.', error);
      return usuario && rol
        ? { usuario, rol, sinServidor: true }
        : { noAutorizado: true };
    }
  })();

  const listo = (async () => {
    const resultado = await verificacion;

    if (resultado.noAutorizado) {
      limpiarSesion();
      redirigir(
        'login.html?expirada=1&next=' + encodeURIComponent(PAGE)
      );
      return null;
    }

    usuario = resultado.usuario;
    rol = resultado.rol;

    const permitido = ACCESO_PAGINA[PAGE];
    if (permitido && !permitido.includes(rol)) {
      redirigir(inicioPara(rol));
      return null;
    }

    usuario = guardarUsuario(usuario, rol);

    await esperarDom();
    aplicarRol(usuario, rol);
    conectarCierreSesion();

    root.setAttribute('data-jm-role', rol);
    terminarCarga();
    document.dispatchEvent(
      new CustomEvent('jm:ready', { detail: { usuario, rol } })
    );

    return { usuario, rol };
  })().catch((error) => {
    console.error('[JM] Error al resolver la sesión:', error);
    terminarCarga();
    return null;
  });

  /* ------------------------------------------------------------
     API pública para el resto de scripts
     ------------------------------------------------------------ */
  window.JM = {
    get user() { return usuario; },
    get role() { return rol; },
    ready: listo,
    home: inicioPara,
    destinoSeguro,
    requireRole(...roles) {
      const esperados = roles.map(normalizarRol);
      if (esperados.includes(rol)) return true;
      redirigir(inicioPara(rol));
      return false;
    },
    logout: cerrarSesion
  };

  /* ------------------------------------------------------------
     Aplicación del rol al DOM
     ------------------------------------------------------------ */
  function esperarDom() {
    if (document.readyState !== 'loading') return Promise.resolve();
    return new Promise((resolver) => {
      document.addEventListener('DOMContentLoaded', resolver, { once: true });
    });
  }

  function aplicarRol(datosUsuario, rolActual) {
    const permitidos = NAVEGACION_POR_ROL[rolActual] || [];

    /* 1. Enlaces del sidebar */
    document.querySelectorAll('.sb-link[href]').forEach((enlace) => {
      const destino = enlace.getAttribute('href')
        .replace(/^\//, '')
        .replace(/\.html$/, '')
        .split('?')[0]
        .toLowerCase();

      const visible = permitidos.includes(destino);
      enlace.hidden = !visible;
      enlace.style.display = visible ? 'flex' : 'none';
      if (visible) enlace.removeAttribute('aria-hidden');
      else enlace.setAttribute('aria-hidden', 'true');
    });

    /* 2. Separadores de sección que quedaron sin enlaces visibles */
    document.querySelectorAll('.sb-sec').forEach((seccion) => {
      let hermano = seccion.nextElementSibling;
      let hayVisibles = false;
      while (hermano && !hermano.classList.contains('sb-sec')) {
        if (
          hermano.classList.contains('sb-link') &&
          hermano.style.display !== 'none' &&
          !hermano.hidden
        ) {
          hayVisibles = true;
          break;
        }
        hermano = hermano.nextElementSibling;
      }
      seccion.style.display = hayVisibles ? '' : 'none';
    });

    /* 3. Bloques restringidos por atributos data-* */
    document.querySelectorAll('[data-admin-only]').forEach((el) => {
      if (rolActual !== 'admin') el.remove();
    });
    document.querySelectorAll('[data-tech-or-admin]').forEach((el) => {
      if (!STAFF.includes(rolActual)) el.remove();
    });
    document.querySelectorAll('[data-client-only]').forEach((el) => {
      if (rolActual !== 'cliente') el.remove();
    });

    /* 4. Datos del usuario en el sidebar */
    const nombre = String(datosUsuario?.nombre || 'Usuario').trim();
    const iniciales = nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase() || 'JM';

    const elNombre = document.getElementById('sbname') || document.querySelector('.sb-uname');
    const elRol = document.getElementById('sbrole') || document.querySelector('.sb-urole');
    const elAvatar = document.getElementById('sbav') || document.querySelector('.sb-av');

    if (elNombre) elNombre.textContent = nombre;
    if (elRol) elRol.textContent = ETIQUETA_ROL[rolActual] || 'Usuario';
    if (elAvatar) elAvatar.textContent = iniciales;
  }

  /* ------------------------------------------------------------
     Cierre de sesión
     ------------------------------------------------------------ */
  function conectarCierreSesion() {
    document.querySelectorAll('.sb-out').forEach((salir) => {
      salir.addEventListener('click', cerrarSesion);
    });
  }

  async function cerrarSesion(evento) {
    evento?.preventDefault?.();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch (_) {
      /* Aunque falle la red se limpia el estado local. */
    }
    limpiarSesion();
    redirigir('login.html');
  }
})();
