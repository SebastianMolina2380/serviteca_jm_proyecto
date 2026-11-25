/**
 * JM SERVITECA — EXPERIENCIA COMPARTIDA
 * ============================================================
 * Dos mejoras transversales para todas las vistas web:
 *
 *   1. Panel de accesibilidad: tamaño de fuente, espaciado,
 *      contraste y movimiento. Se guarda en localStorage bajo
 *      `servitecaAccesibilidad` y se aplica antes de pintar el
 *      cuerpo para no parpadear al recargar.
 *
 *   2. Transición de módulos: overlay automotriz que aparece
 *      solo si la navegación tarda más de 280 ms, se limpia en
 *      pageshow/pagehide y nunca intercepta el puntero.
 *
 * Debe incluirse en el <head> de cada página (sin `defer`) para
 * que las preferencias se apliquen antes del primer render.
 *
 * Integración con role-guard.js: el botón del sidebar se crea en
 * el menú único de ese script; aquí solo se enlaza por el
 * atributo `data-jm-accesibilidad`. En páginas públicas se crea
 * un botón flotante de respaldo.
 */
(function () {
  'use strict';

  var CLAVE_PREF = 'servitecaAccesibilidad';
  var CLAVE_CARGA = 'jmCargaModulo';
  var NIVELES = [90, 100, 112, 125, 140];
  var OPCIONES = {
    espaciado: ['normal', 'amplio'],
    contraste: ['normal', 'alto'],
    movimiento: ['normal', 'reducido']
  };
  var BASE = { fuente: 100, espaciado: 'normal', contraste: 'normal', movimiento: 'normal' };

  function normalizar(datos) {
    var resultado = {
      fuente: BASE.fuente,
      espaciado: BASE.espaciado,
      contraste: BASE.contraste,
      movimiento: BASE.movimiento
    };
    if (!datos || typeof datos !== 'object') return resultado;

    var fuente = Number(datos.fuente);
    if (NIVELES.indexOf(fuente) !== -1) resultado.fuente = fuente;

    Object.keys(OPCIONES).forEach(function (clave) {
      if (OPCIONES[clave].indexOf(datos[clave]) !== -1) {
        resultado[clave] = datos[clave];
      }
    });
    return resultado;
  }

  function leerPreferencias() {
    try {
      return normalizar(JSON.parse(localStorage.getItem(CLAVE_PREF) || 'null'));
    } catch (_) {
      return normalizar(null);
    }
  }

  var preferencias = leerPreferencias();

  function guardarPreferencias() {
    try {
      localStorage.setItem(CLAVE_PREF, JSON.stringify(preferencias));
    } catch (_) {
      // Modo privado o almacenamiento lleno: los ajustes siguen
      // activos durante esta sesión aunque no sean persistentes.
    }
  }

  function aplicarPreferencias() {
    var raiz = document.documentElement;
    raiz.setAttribute('data-jm-fuente', String(preferencias.fuente));
    raiz.setAttribute('data-jm-espaciado', preferencias.espaciado);
    raiz.setAttribute('data-jm-contraste', preferencias.contraste);
    raiz.setAttribute('data-jm-movimiento', preferencias.movimiento);
  }

  // Se ejecuta en el <head>, antes de que el navegador pinte <body>.
  aplicarPreferencias();

  /* ==========================================================
     1. PANEL DE ACCESIBILIDAD
     ========================================================== */
  var panel = null;
  var ultimoDisparador = null;

  function crearPanel() {
    if (document.getElementById('jm-a11y-panel') || !document.body) return;

    panel = document.createElement('section');
    panel.id = 'jm-a11y-panel';
    panel.className = 'jm-a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'jm-a11y-titulo');
    panel.hidden = true;
    panel.innerHTML = [
      '<div class="jm-a11y-cab">',
      '  <span aria-hidden="true">♿</span>',
      '  <h2 id="jm-a11y-titulo">Accesibilidad</h2>',
      '  <button type="button" class="jm-a11y-cerrar" data-jm-cerrar aria-label="Cerrar ajustes de accesibilidad">×</button>',
      '</div>',
      '<div class="jm-a11y-grupo">',
      '  <span id="jm-a11y-etq-fuente">Tamaño de fuente</span>',
      '  <div class="jm-a11y-controles" role="group" aria-labelledby="jm-a11y-etq-fuente">',
      '    <button type="button" class="jm-a11y-btn" data-jm-fuente="-" aria-label="Disminuir tamaño de fuente">A−</button>',
      '    <output class="jm-a11y-nivel" id="jm-a11y-nivel">100%</output>',
      '    <button type="button" class="jm-a11y-btn" data-jm-fuente="+" aria-label="Aumentar tamaño de fuente">A+</button>',
      '  </div>',
      '</div>',
      '<div class="jm-a11y-grupo">',
      '  <span id="jm-a11y-etq-espaciado">Espaciado y legibilidad</span>',
      '  <div class="jm-a11y-controles" role="group" aria-labelledby="jm-a11y-etq-espaciado">',
      '    <button type="button" class="jm-a11y-btn" data-jm-espaciado="normal">Normal</button>',
      '    <button type="button" class="jm-a11y-btn" data-jm-espaciado="amplio">Amplio</button>',
      '  </div>',
      '</div>',
      '<div class="jm-a11y-grupo">',
      '  <span id="jm-a11y-etq-contraste">Contraste</span>',
      '  <div class="jm-a11y-controles" role="group" aria-labelledby="jm-a11y-etq-contraste">',
      '    <button type="button" class="jm-a11y-btn" data-jm-contraste="normal">Estándar</button>',
      '    <button type="button" class="jm-a11y-btn" data-jm-contraste="alto">Alto</button>',
      '  </div>',
      '</div>',
      '<div class="jm-a11y-grupo">',
      '  <span id="jm-a11y-etq-movimiento">Movimiento</span>',
      '  <div class="jm-a11y-controles" role="group" aria-labelledby="jm-a11y-etq-movimiento">',
      '    <button type="button" class="jm-a11y-btn" data-jm-movimiento="normal">Animaciones</button>',
      '    <button type="button" class="jm-a11y-btn" data-jm-movimiento="reducido">Reducir</button>',
      '  </div>',
      '</div>',
      '<div class="jm-a11y-pie">',
      '  <button type="button" class="jm-a11y-btn" data-jm-restablecer>Restablecer todo</button>',
      '</div>'
    ].join('');

    document.body.appendChild(panel);
  }

  function sincronizarControles() {
    if (!panel) return;

    var nivel = document.getElementById('jm-a11y-nivel');
    if (nivel) nivel.textContent = preferencias.fuente + '%';

    Object.keys(OPCIONES).forEach(function (clave) {
     panel.querySelectorAll('[data-jm-' + clave + ']').forEach(function (boton) {
       boton.setAttribute(
         'aria-pressed',
         String(preferencias[clave] === boton.getAttribute('data-jm-' + clave))
       );
     });
    });
  }

  function abrirPanel(disparador) {
    crearPanel();
    if (!panel) return;

    ultimoDisparador = disparador || null;
    panel.hidden = false;
    document.body.setAttribute('data-jm-a11y-abierto', '');
    if (disparador) disparador.setAttribute('aria-expanded', 'true');

    var primerBoton = panel.querySelector('button');
    if (primerBoton) primerBoton.focus();
  }

  function cerrarPanel() {
    if (!panel || panel.hidden) return;

    panel.hidden = true;
    document.body.removeAttribute('data-jm-a11y-abierto');
    if (ultimoDisparador) {
      ultimoDisparador.setAttribute('aria-expanded', 'false');
      if (document.contains(ultimoDisparador)) ultimoDisparador.focus();
    }
    ultimoDisparador = null;
  }

  function alternarPanel(disparador) {
    if (panel && !panel.hidden) cerrarPanel();
    else abrirPanel(disparador);
  }

  function cambiarPreferencia(clave, valor) {
    if (!Object.prototype.hasOwnProperty.call(OPCIONES, clave)) return;
    preferencias[clave] = valor;
    guardarPreferencias();
    aplicarPreferencias();
    sincronizarControles();
  }

  function cambiarFuente(sentido) {
    if (sentido !== '+' && sentido !== '-') return;
    var indice = NIVELES.indexOf(preferencias.fuente);
    if (indice === -1) indice = 1;
    var destino = Math.min(NIVELES.length - 1, Math.max(0, indice + (sentido === '+' ? 1 : -1)));
    preferencias.fuente = NIVELES[destino];
    guardarPreferencias();
    aplicarPreferencias();
    sincronizarControles();
  }

  function restablecer() {
    preferencias = normalizar(null);
    guardarPreferencias();
    aplicarPreferencias();
    sincronizarControles();
  }

  /** Páginas sin barra lateral (login, registro, portada...). */
  function asegurarDisparadorFlotante() {
    if (!document.body || document.querySelector('[data-jm-accesibilidad]')) return;

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'jm-a11y-flotante';
    boton.setAttribute('data-jm-accesibilidad', '');
    boton.setAttribute('aria-label', 'Abrir ajustes de accesibilidad');
    boton.setAttribute('aria-haspopup', 'dialog');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-controls', 'jm-a11y-panel');
    boton.textContent = '♿';
    document.body.appendChild(boton);
  }

  /* ==========================================================
     2. TRANSICIÓN DE MÓDULOS
     ========================================================== */
  var temporizadorAparicion = null;
  var temporizadorSeguridad = null;

  function crearLoader() {
    if (document.getElementById('jm-loader') || !document.body) return;

    var loader = document.createElement('div');
    loader.id = 'jm-loader';
    loader.className = 'jm-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    loader.setAttribute('aria-label', 'Cargando módulo');
    loader.setAttribute('aria-hidden', 'true');
    loader.hidden = true;
    loader.innerHTML = [
      '<div class="jm-loader-card">',
      '  <div class="jm-loader-track" aria-hidden="true">',
      '    <div class="jm-loader-car">',
      '      <span class="jm-loader-cabina"></span>',
      '      <span class="jm-loader-chasis"></span>',
      '      <span class="jm-loader-rueda jm-loader-rueda--i"></span>',
      '      <span class="jm-loader-rueda jm-loader-rueda--d"></span>',
      '    </div>',
      '  </div>',
      '  <p class="jm-loader-texto">Cargando módulo…</p>',
      '</div>'
    ].join('');

    document.body.appendChild(loader);
  }

  function ocultarCarga() {
    clearTimeout(temporizadorAparicion);
    clearTimeout(temporizadorSeguridad);
    temporizadorAparicion = null;
    temporizadorSeguridad = null;

    try {
      sessionStorage.removeItem(CLAVE_CARGA);
    } catch (_) {
      // sessionStorage puede estar deshabilitado.
    }

    var loader = document.getElementById('jm-loader');
    if (!loader) return;
    loader.classList.remove('is-visible');
    loader.hidden = true;
    loader.setAttribute('aria-hidden', 'true');
  }

  function mostrarCarga() {
    if (document.visibilityState === 'hidden') return;

    var loader = document.getElementById('jm-loader');
    if (!loader) return;

    loader.hidden = false;
    loader.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      // Puede haberse ocultado antes de este frame (carga instantánea).
      if (!loader.hidden) loader.classList.add('is-visible');
    });

    // Red de seguridad: aunque no llegue ningún evento de carga,
    // el overlay desaparece y nunca deja la pantalla bloqueada.
    clearTimeout(temporizadorSeguridad);
    temporizadorSeguridad = setTimeout(ocultarCarga, 6000);
  }

  function observarNavegacion(evento) {
    if (evento.defaultPrevented || evento.button !== 0) return;
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    if (!(evento.target instanceof Element)) return;

    var enlace = evento.target.closest('a[href]');
    if (!enlace || enlace.hasAttribute('download')) return;
    if (enlace.target && enlace.target !== '_self') return;

    var href = enlace.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;

    var destino;
    try {
      destino = new URL(enlace.href, window.location.href);
    } catch (_) {
      return;
    }

    if (destino.origin !== window.location.origin) return;
    if (!/\.html?$/i.test(destino.pathname)) return;
    if (destino.pathname === window.location.pathname
        && destino.search === window.location.search) return;

    try {
      sessionStorage.setItem(CLAVE_CARGA, String(Date.now()));
    } catch (_) {
      // No afecta al funcionamiento del loader.
    }

    clearTimeout(temporizadorAparicion);
    temporizadorAparicion = setTimeout(mostrarCarga, 280);
  }

  /* ==========================================================
     EVENTOS
     ========================================================== */
  function alHacerClic(evento) {
    var objetivo = evento.target instanceof Element ? evento.target : null;
    if (!objetivo) return;

    var disparador = objetivo.closest('[data-jm-accesibilidad]');
    if (disparador) {
      evento.preventDefault();
      alternarPanel(disparador);
      return;
    }

    if (panel && !panel.hidden) {
      if (objetivo.closest('[data-jm-cerrar]')) {
        cerrarPanel();
        return;
      }

      /* Los atributos data-jm-* también viven en <html>; por eso los
         selectores se limitan al panel para no capturar la raíz. */
      var botonFuente = objetivo.closest('.jm-a11y-panel [data-jm-fuente]');
      if (botonFuente) {
        cambiarFuente(botonFuente.getAttribute('data-jm-fuente'));
        return;
      }

      var restablecerBoton = objetivo.closest('.jm-a11y-panel [data-jm-restablecer]');
      if (restablecerBoton) {
        restablecer();
        return;
      }

      var grupal = objetivo.closest(
        '.jm-a11y-panel [data-jm-espaciado],' +
        ' .jm-a11y-panel [data-jm-contraste],' +
        ' .jm-a11y-panel [data-jm-movimiento]'
      );
      if (grupal) {
        Object.keys(OPCIONES).forEach(function (clave) {
          if (grupal.hasAttribute('data-jm-' + clave)) {
            cambiarPreferencia(clave, grupal.getAttribute('data-jm-' + clave));
          }
        });
        return;
      }

      if (!objetivo.closest('#jm-a11y-panel')) cerrarPanel();
    }

    observarNavegacion(evento);
  }

  function conectarEventos() {
    document.addEventListener('click', alHacerClic);

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape') cerrarPanel();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') ocultarCarga();
    });

    // pageshow cubre también la restauración desde la caché del
    // navegador (event.persisted); no se reproduce la animación.
    window.addEventListener('pageshow', ocultarCarga);
    window.addEventListener('pagehide', ocultarCarga);
    window.addEventListener('beforeunload', ocultarCarga);
    window.addEventListener('load', ocultarCarga);
  }

  function iniciar() {
    crearPanel();
    crearLoader();
    sincronizarControles();
    conectarEventos();
    ocultarCarga();

    // role-guard.js construye el menú de forma asíncrona: el botón
    // lateral aparece con `jm:ready`. Las páginas públicas reciben
    // el botón flotante de inmediato.
    if (!window.JM) asegurarDisparadorFlotante();
    document.addEventListener('jm:ready', function () {
      setTimeout(asegurarDisparadorFlotante, 0);
    }, { once: true });
    setTimeout(asegurarDisparadorFlotante, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
