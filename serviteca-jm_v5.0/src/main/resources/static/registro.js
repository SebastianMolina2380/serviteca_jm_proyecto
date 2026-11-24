/* ============================================================
   REGISTRO PÚBLICO DE CLIENTES
   ------------------------------------------------------------
   POST /api/auth/registro
   El backend fuerza Rol.CLIENTE y Estado.ACTIVO; este formulario
   solo recoge datos de contacto y credenciales. Tras crear la
   cuenta se redirige al login, ya que no se inicia sesión aquí.
   ============================================================ */
(() => {
  'use strict';

  const form = document.getElementById('registroForm');
  const cajaError = document.getElementById('err');
  const cajaOk = document.getElementById('ok');
  const boton = document.getElementById('btn-registro');

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function ocultarMensajes() {
    if (cajaError) {
      cajaError.style.display = 'none';
      cajaError.textContent = '';
    }
    if (cajaOk) {
      cajaOk.style.display = 'none';
      cajaOk.textContent = '';
    }
  }

  function mostrarError(mensaje) {
    if (!cajaError) return;
    cajaError.textContent = mensaje;
    cajaError.style.display = 'block';
  }

  function mostrarOk(mensaje) {
    if (!cajaOk) return;
    cajaOk.textContent = mensaje;
    cajaOk.style.display = 'block';
  }

  function valor(id) {
    const campo = document.getElementById(id);
    return campo ? campo.value.trim() : '';
  }

  /* Mostrar / ocultar contraseñas con el mismo patrón del login. */
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

  async function enviarRegistro(evento) {
    evento.preventDefault();
    ocultarMensajes();

    const nombre = valor('nombre').replace(/\s+/g, ' ');
    const numeroDoc = valor('numeroDoc');
    const correo = valor('correo').toLowerCase();
    const contrasena = document.getElementById('contrasena')?.value || '';
    const confirmar = document.getElementById('confirmar')?.value || '';

    if (!nombre || !numeroDoc || !correo || !contrasena || !confirmar) {
      mostrarError('❌ Completa nombre, documento, correo y contraseña.');
      return;
    }
    if (nombre.length < 3) {
      mostrarError('❌ Escribe tu nombre completo.');
      return;
    }
    if (!EMAIL.test(correo)) {
      mostrarError('❌ El correo electrónico no es válido.');
      return;
    }
    if (contrasena.length < 8) {
      mostrarError('❌ La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (contrasena !== confirmar) {
      mostrarError('❌ Las contraseñas no coinciden.');
      return;
    }

    const textoOriginal = boton ? boton.textContent : '';
    if (boton) {
      boton.disabled = true;
      boton.setAttribute('aria-busy', 'true');
      boton.textContent = 'CREANDO CUENTA…';
    }

    try {
      const respuesta = await fetch('/api/auth/registro', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          nombre,
          numeroDoc,
          tipoDocumento: document.getElementById('tipoDocumento')?.value || 'CC',
          correo,
          telefono: valor('telefono'),
          ciudad: valor('ciudad'),
          direccion: valor('direccion'),
          contrasena
        })
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
          datos.error ||
          (respuesta.status === 409
            ? 'El correo o documento ya está registrado.'
            : 'No se pudo crear la cuenta.')
        );
      }

      form.reset();
      mostrarOk('✅ Cuenta creada correctamente. Redirigiendo al inicio de sesión…');
      setTimeout(() => {
        window.location.replace('login.html?registrado=1');
      }, 1400);

    } catch (error) {
      mostrarError('❌ ' + (error.message || 'No se pudo crear la cuenta.'));
      if (boton) {
        boton.disabled = false;
        boton.removeAttribute('aria-busy');
        boton.textContent = textoOriginal;
      }
    }
  }

  if (form) {
    form.addEventListener('submit', enviarRegistro);
  }
})();
