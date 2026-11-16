/* ============================================================
   PORTAL TÉCNICO · OPERACIÓN DE CITAS Y SERVICIOS
   ------------------------------------------------------------
   Consume:
     GET   /api/citas
     PATCH /api/citas/{id}/estado
     PATCH /api/citas/{id}/tecnico
     PATCH /api/citas/{id}/observaciones
     GET   /api/servicios/portal
     PATCH /api/servicios/{id}/estado
     PATCH /api/servicios/{id}/progreso
     GET   /api/tecnicos

   Solo ADMIN y TÉCNICO. role-guard.js ya valida la sesión y el rol;
   aquí se espera a JM.ready antes de pedir datos.
   ============================================================ */
(() => {
  'use strict';

  const ESTADOS_CITA = ['PENDIENTE', 'CONFIRMADO', 'COMPLETADA', 'CANCELADA'];
  const ETIQUETA_CITA = {
    PENDIENTE: 'Pendiente',
    CONFIRMADO: 'Confirmada',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada'
  };

  const ESTADOS_SERVICIO = ['PROGRAMADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'];
  const ETIQUETA_SERVICIO = {
    PROGRAMADO: 'Programado',
    EN_PROCESO: 'En proceso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado'
  };

  let citas = [];
  let servicios = [];
  let tecnicos = [];
  let busqueda = '';
  let filtroCita = '';
  let filtroServicio = '';
  let cargando = false;
  let temporizadorMensaje = null;

  const $ = (id) => document.getElementById(id);

  /* ------------------------------------------------------------
     Utilidades de presentación
     ------------------------------------------------------------ */
  function esc(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function fechaCorta(valor) {
    if (!valor) return '—';
    const texto = String(valor).replace('T', ' ');
    return texto.length >= 16 ? texto.slice(0, 16) : texto;
  }

  function horaCorta(valor) {
    if (!valor) return '';
    return String(valor).slice(0, 5);
  }

  function textoVehiculo(cita) {
    const v = cita.vehiculo;
    if (!v) return '—';
    return `${v.placa || ''} ${v.marca || ''} ${v.modelo || ''}`.trim() || '—';
  }

  function textoVehiculoServicio(servicio) {
    const partes = [servicio.placa, servicio.vehiculo].filter(Boolean);
    return partes.length ? partes.join(' · ') : '—';
  }

  function badgeClaseCita(estado) {
    return {
      PENDIENTE: 'by',
      CONFIRMADO: 'bgr',
      COMPLETADA: 'bg',
      CANCELADA: 'br'
    }[estado] || 'bgr';
  }

  function badgeClaseServicio(estado) {
    return {
      PROGRAMADO: 'bgr',
      EN_PROCESO: 'bo',
      COMPLETADO: 'bg',
      CANCELADO: 'br'
    }[estado] || 'bgr';
  }

  function opciones(estados, actual, etiquetas) {
    return estados.map((estado) =>
      `<option value="${estado}"${estado === actual ? ' selected' : ''}>` +
      `${esc(etiquetas[estado] || estado)}</option>`
    ).join('');
  }

  function mostrarMensaje(texto, tipo = 'ok') {
    const caja = $('portal-msg');
    if (!caja) return;

    caja.textContent = texto;
    caja.className = 'portal-msg' + (tipo === 'error' ? ' error' : tipo === 'info' ? ' info' : '');
    caja.style.display = 'block';

    clearTimeout(temporizadorMensaje);
    if (tipo !== 'error') {
      temporizadorMensaje = setTimeout(() => {
        caja.style.display = 'none';
      }, 3500);
    }
  }

  /* ------------------------------------------------------------
     KPIs y tablas
     ------------------------------------------------------------ */
  function actualizarKpis() {
    const contarCitas = (estado) => citas.filter((c) => c.estado === estado).length;
    const contarServicios = (estado) => servicios.filter((s) => s.estado === estado).length;

    if ($('kpi-pendientes')) $('kpi-pendientes').textContent = contarCitas('PENDIENTE');
    if ($('kpi-confirmadas')) $('kpi-confirmadas').textContent = contarCitas('CONFIRMADO');
    if ($('kpi-proceso')) $('kpi-proceso').textContent = contarServicios('EN_PROCESO');
    if ($('kpi-completados')) $('kpi-completados').textContent = contarServicios('COMPLETADO');
  }

  function citasFiltradas() {
    const q = busqueda.trim().toLowerCase();

    return citas.filter((c) => {
      if (filtroCita && c.estado !== filtroCita) return false;
      if (!q) return true;

      const tecnico = c.tecnico?.nombre || '';
      const texto = [
        `tkt-${String(c.idCita).padStart(4, '0')}`,
        c.usuario?.nombre,
        c.vehiculo?.placa,
        c.vehiculo?.marca,
        c.vehiculo?.modelo,
        c.servicioSolicitado,
        tecnico,
        c.observaciones
      ].join(' ').toLowerCase();

      return texto.includes(q);
    });
  }

  function serviciosFiltrados() {
    const q = busqueda.trim().toLowerCase();

    return servicios.filter((s) => {
      if (filtroServicio && s.estado !== filtroServicio) return false;
      if (!q) return true;

      const texto = [
        s.idServicio,
        s.cliente,
        s.placa,
        s.vehiculo,
        s.tipo,
        s.estado
      ].join(' ').toLowerCase();

      return texto.includes(q);
    });
  }

  function renderCitas() {
    const cuerpo = $('tbody-citas');
    if (!cuerpo) return;

    const filas = citasFiltradas();
    if ($('citas-count')) $('citas-count').textContent = String(filas.length);

    if (!filas.length) {
      cuerpo.innerHTML = '<tr><td colspan="8" class="citas-empty">No hay citas para mostrar.</td></tr>';
      return;
    }

    cuerpo.innerHTML = filas.map((c) => {
      const id = c.idCita;
      const observaciones = c.observaciones
        ? `<span class="nota-texto">${esc(c.observaciones)}</span>`
        : '<span class="nota-texto nota-vacia">Sin observaciones</span>';

      const opcionesTecnico = [
        `<option value=""${!c.tecnico ? ' selected' : ''}>Sin asignar</option>`,
        ...tecnicos.map((t) =>
          `<option value="${t.idUsuario}"${c.tecnico?.idUsuario === t.idUsuario ? ' selected' : ''}>` +
          `${esc(t.nombre)}</option>`
        )
      ].join('');

      return `<tr>
        <td style="color:var(--yellow);font-weight:700;">TKT-${String(id).padStart(4, '0')}</td>
        <td>${esc(c.usuario?.nombre || '—')}</td>
        <td>${esc(textoVehiculo(c))}</td>
        <td>${esc(c.servicioSolicitado || '—')}</td>
        <td><select class="fc mini" data-cita-tecnico="${id}" aria-label="Técnico de la cita ${id}">${opcionesTecnico}</select></td>
        <td>${esc(fechaCorta(c.fecha))} ${esc(horaCorta(c.hora))}</td>
        <td>
          <select class="fc mini" data-cita-estado="${id}" aria-label="Estado de la cita ${id}">
            ${opciones(ESTADOS_CITA, c.estado, ETIQUETA_CITA)}
          </select>
          <div style="margin-top:5px"><span class="badge ${badgeClaseCita(c.estado)}">${esc(ETIQUETA_CITA[c.estado] || c.estado || '—')}</span></div>
        </td>
        <td>
          ${observaciones}
          <button type="button" class="btn-sm-g btn-nota" data-cita-nota="${id}">📝 Editar nota</button>
        </td>
      </tr>`;
    }).join('');
  }

  function renderServicios() {
    const cuerpo = $('tbody-servicios');
    if (!cuerpo) return;

    const filas = serviciosFiltrados();
    if ($('servicios-count')) $('servicios-count').textContent = String(filas.length);

    if (!filas.length) {
      cuerpo.innerHTML = '<tr><td colspan="7" class="citas-empty">No hay servicios para mostrar.</td></tr>';
      return;
    }

    cuerpo.innerHTML = filas.map((s) => {
      const id = s.idServicio;
      const progreso = Number.isFinite(Number(s.progreso)) ? Number(s.progreso) : 0;

      return `<tr>
        <td style="color:var(--yellow);font-weight:700;">#${id}</td>
        <td>${esc(s.cliente || '—')}</td>
        <td>${esc(textoVehiculoServicio(s))}</td>
        <td>${esc(s.tipo || '—')}</td>
        <td>${esc(fechaCorta(s.fechaServicio))}</td>
        <td>
          <select class="fc mini" data-servicio-estado="${id}" aria-label="Estado del servicio ${id}">
            ${opciones(ESTADOS_SERVICIO, s.estado, ETIQUETA_SERVICIO)}
          </select>
          <div style="margin-top:5px"><span class="badge ${badgeClaseServicio(s.estado)}">${esc(ETIQUETA_SERVICIO[s.estado] || s.estado || '—')}</span></div>
        </td>
        <td class="progreso-cell">
          <div class="progreso-cabecera">
            <span>Avance</span>
            <strong id="prog-${id}">${progreso}%</strong>
          </div>
          <input type="range" class="progreso-range" min="0" max="100" step="5"
                 value="${progreso}" data-servicio-progreso="${id}"
                 aria-label="Progreso del servicio ${id}">
        </td>
      </tr>`;
    }).join('');
  }

  function renderTodo() {
    renderCitas();
    renderServicios();
    actualizarKpis();
  }

  /* ------------------------------------------------------------
     API
     ------------------------------------------------------------ */
  async function peticion(url, opcionesPeticion = {}) {
    const respuesta = await fetch(url, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      ...opcionesPeticion
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.message || datos.error || `Error HTTP ${respuesta.status}`);
    }
    return datos;
  }

  async function cargarTodo() {
    if (cargando) return;
    cargando = true;
    mostrarMensaje('Cargando citas y servicios…', 'info');

    try {
      const [citasResp, serviciosResp, tecnicosResp] = await Promise.all([
        peticion('/api/citas'),
        peticion('/api/servicios/portal'),
        peticion('/api/tecnicos')
      ]);

      citas = Array.isArray(citasResp) ? citasResp : [];
      servicios = Array.isArray(serviciosResp) ? serviciosResp : [];
      tecnicos = Array.isArray(tecnicosResp) ? tecnicosResp : [];

      renderTodo();
      mostrarMensaje(`Información actualizada · ${new Date().toLocaleTimeString('es-CO')}`);
    } catch (error) {
      console.error(error);
      mostrarMensaje(error.message || 'No se pudo cargar el portal.', 'error');
    } finally {
      cargando = false;
    }
  }

  async function cambiarEstadoCita(id, estado) {
    try {
      const datos = await peticion(`/api/citas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ estado })
      });
      const cita = citas.find((c) => c.idCita === id);
      if (cita) cita.estado = datos.estado || estado;
      renderCitas();
      actualizarKpis();
      mostrarMensaje(`Cita TKT-${String(id).padStart(4, '0')} actualizada a ${ETIQUETA_CITA[cita?.estado] || estado}.`);
    } catch (error) {
      mostrarMensaje(error.message, 'error');
      await cargarTodo();
    }
  }

  async function asignarTecnico(id, idTecnico) {
    try {
      const datos = await peticion(`/api/citas/${id}/tecnico`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ idtecnico: idTecnico ? Number(idTecnico) : null })
      });
      const cita = citas.find((c) => c.idCita === id);
      if (cita) cita.tecnico = datos.tecnico || null;
      renderCitas();
      mostrarMensaje(datos.tecnico
        ? `Técnico ${datos.tecnico.nombre} asignado a TKT-${String(id).padStart(4, '0')}.`
        : `Cita TKT-${String(id).padStart(4, '0')} quedó sin técnico.`);
    } catch (error) {
      mostrarMensaje(error.message, 'error');
      await cargarTodo();
    }
  }

  async function editarObservaciones(id) {
    const cita = citas.find((c) => c.idCita === id);
    if (!cita) return;

    const actual = cita.observaciones || '';
    const valor = window.prompt(
      `Observaciones para TKT-${String(id).padStart(4, '0')}:`,
      actual
    );
    if (valor === null) return;

    try {
      const datos = await peticion(`/api/citas/${id}/observaciones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ observaciones: valor })
      });
      cita.observaciones = datos.observaciones || '';
      renderCitas();
      mostrarMensaje('Observaciones guardadas.');
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    }
  }

  async function cambiarEstadoServicio(id, estado) {
    try {
      const datos = await peticion(`/api/servicios/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ estado })
      });
      const servicio = servicios.find((s) => s.idServicio === id);
      if (servicio) {
        servicio.estado = datos.estado || estado;
        servicio.progreso = datos.progreso;
      }
      renderServicios();
      actualizarKpis();
      mostrarMensaje(`Servicio #${id} actualizado a ${ETIQUETA_SERVICIO[servicio?.estado] || estado}.`);
    } catch (error) {
      mostrarMensaje(error.message, 'error');
      await cargarTodo();
    }
  }

  async function cambiarProgresoServicio(id, progreso) {
    try {
      const datos = await peticion(`/api/servicios/${id}/progreso`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ progreso: Number(progreso) })
      });
      const servicio = servicios.find((s) => s.idServicio === id);
      if (servicio) {
        servicio.progreso = datos.progreso;
        servicio.estado = datos.estado;
      }
      renderServicios();
      actualizarKpis();
      mostrarMensaje(`Servicio #${id}: ${datos.progreso}% · ${ETIQUETA_SERVICIO[datos.estado] || datos.estado}.`);
    } catch (error) {
      mostrarMensaje(error.message, 'error');
      await cargarTodo();
    }
  }

  /* ------------------------------------------------------------
     Eventos (delegación: las filas se regeneran)
     ------------------------------------------------------------ */
  function conectarEventos() {
    $('btn-refresh')?.addEventListener('click', cargarTodo);

    $('portal-search')?.addEventListener('input', (e) => {
      busqueda = e.target.value || '';
      renderTodo();
    });

    $('filtro-cita')?.addEventListener('change', (e) => {
      filtroCita = e.target.value || '';
      renderCitas();
    });

    $('filtro-servicio')?.addEventListener('change', (e) => {
      filtroServicio = e.target.value || '';
      renderServicios();
    });

    document.addEventListener('change', (e) => {
      const estadoCita = e.target.closest('[data-cita-estado]');
      if (estadoCita) {
        cambiarEstadoCita(Number(estadoCita.dataset.citaEstado), estadoCita.value);
        return;
      }

      const tecnico = e.target.closest('[data-cita-tecnico]');
      if (tecnico) {
        asignarTecnico(Number(tecnico.dataset.citaTecnico), tecnico.value);
        return;
      }

      const estadoServicio = e.target.closest('[data-servicio-estado]');
      if (estadoServicio) {
        cambiarEstadoServicio(Number(estadoServicio.dataset.servicioEstado), estadoServicio.value);
        return;
      }

      const progreso = e.target.closest('[data-servicio-progreso]');
      if (progreso) {
        cambiarProgresoServicio(Number(progreso.dataset.servicioProgreso), progreso.value);
      }
    });

    document.addEventListener('input', (e) => {
      const progreso = e.target.closest('[data-servicio-progreso]');
      if (!progreso) return;
      const etiqueta = $(`prog-${progreso.dataset.servicioProgreso}`);
      if (etiqueta) etiqueta.textContent = `${progreso.value}%`;
    });

    document.addEventListener('click', (e) => {
      const boton = e.target.closest('[data-cita-nota]');
      if (boton) editarObservaciones(Number(boton.dataset.citaNota));
    });
  }

  /* ------------------------------------------------------------
     Arranque: espera a que role-guard resuelva la sesión
     ------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    const tbdate = $('tbdate');
    if (tbdate) {
      const fecha = new Date();
      const meses = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
      ];
      tbdate.textContent = `${fecha.getDate()} DE ${meses[fecha.getMonth()]}`;
    }

    conectarEventos();

    const arranque = window.JM && window.JM.ready
      ? window.JM.ready
      : Promise.resolve(null);

    arranque
      .then(() => {
        const rol = window.JM && window.JM.role;
        if (!['admin', 'tecnico'].includes(rol)) return;
        return cargarTodo();
      })
      .catch((error) => {
        console.error('[JM] No se pudo iniciar el portal técnico:', error);
        mostrarMensaje('No se pudo iniciar el portal técnico.', 'error');
      });
  });
})();
