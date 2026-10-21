(() => {
  'use strict';

  const state = { vehicles: [], selected: null, service: null };
  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c]));
  }

  function apiErrorMessage(data, fallback) {
    return data?.error || data?.message || fallback;
  }

  async function api(url, options = {}) {
    try {
      const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('No tienes sesión activa o permisos suficientes.');
      }

      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (!response.ok) throw new Error(apiErrorMessage(data, `Error HTTP ${response.status}`));
      return data;
    } catch (err) {
      console.error(`Error de red/API en ${url}:`, err);
      throw err;
    }
  }

  function notify(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  function vehicleId(v) { return v?.idvehiculo ?? v?.id; }

  function formatKm(km) {
    if (km === null || km === undefined || km === '') return '—';
    return `${new Intl.NumberFormat('es-CO').format(Number(km))} km`;
  }

  async function loadVehicles() {
    const tbody = $('tbody-vehiculos');
    try {
      const data = await api('/api/vehiculos');
      state.vehicles = Array.isArray(data) ? data : [];
      renderTable();

      const requestedId = new URLSearchParams(location.search).get('id');
      const first = requestedId ? state.vehicles.find(v => String(vehicleId(v)) === requestedId) : state.vehicles[0];

      if (first) await selectVehicle(first);
      else clearFicha();
    } catch (error) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty">Error al cargar datos: ${esc(error.message)}</td></tr>`;
      }
      const countEl = $('vehiculos-count');
      if (countEl) countEl.textContent = 'Error de conexión';
    }
  }

  function renderTable() {
    const tbody = $('tbody-vehiculos');
    if (!tbody) return;

    const query = ($('buscar-vehiculo')?.value || '').trim().toLowerCase();
    const rows = state.vehicles.filter(v => [v.placa, v.marca, v.modelo, v.color, v.kilometraje].join(' ').toLowerCase().includes(query));

    const countEl = $('vehiculos-count');
    if (countEl) countEl.textContent = `${rows.length} vehículo${rows.length === 1 ? '' : 's'}`;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay vehículos registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(v => {
      const id = vehicleId(v);
      const activa = !!state.selected && String(vehicleId(state.selected)) === String(id);
      return `<tr data-row="${esc(id)}" class="${activa ? 'selected' : ''}" tabindex="0" aria-selected="${activa ? 'true' : 'false'}">
        <td><span class="plate">${esc(v.placa)}</span></td>
        <td>${esc(v.marca || '—')}</td>
        <td>${esc(v.modelo || '—')}</td>
        <td>${esc(v.color || '—')}</td>
        <td>${esc(formatKm(v.kilometraje))}</td>
        <td><div class="actions">
          <button class="btn btn-green mini" type="button" data-view="${esc(id)}">Ver</button>
          <button class="btn btn-ghost mini" type="button" data-edit="${esc(id)}">Editar</button>
          <button class="btn btn-danger mini" type="button" data-delete="${esc(id)}">Eliminar</button>
        </div></td>
      </tr>`;
    }).join('');

    /* La plantilla ya marca la fila activa, pero se refuerza aquí:
       renderTable se dispara también desde el filtro de búsqueda y
       así la clase no depende de que el innerHTML conserve el
       atributo. */
    marcarFilaActiva();
  }

  /* Resalta la fila del vehículo seleccionado. Se recalcula desde
     state.selected y no desde el evento, para que sirva igual al
     cargar por URL, al pulsar "Ver" y al rehacer la tabla al
     filtrar (renderTable reconstruye el innerHTML y pierde las
     clases si no se vuelven a aplicar). */
  function marcarFilaActiva() {
    const activa = state.selected ? String(vehicleId(state.selected)) : null;
    document.querySelectorAll('#tbody-vehiculos tr[data-row]').forEach(tr => {
      const on = activa !== null && String(tr.dataset.row) === activa;
      tr.classList.toggle('selected', on);
      tr.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function clearFicha() {
    ['ficha-placa','ficha-detalle','ficha-km','ficha-marca-modelo','ficha-color','ficha-servicio'].forEach(id => {
      if ($(id))$(id).textContent = '—';
    });
    if ($('ficha-progreso'))$('ficha-progreso').style.width = '0%';
    if ($('ficha-progreso-label'))$('ficha-progreso-label').textContent = '0%';
    if ($('ficha-estado'))$('ficha-estado').textContent = 'Sin seleccionar';
    state.selected = null;
    state.service = null;
    marcarFilaActiva();
  }

  async function selectVehicle(vehicle) {
    state.selected = vehicle;
    const id = vehicleId(vehicle);

    if ($('ficha-placa'))$('ficha-placa').textContent = vehicle.placa || '—';
    if ($('ficha-detalle'))$('ficha-detalle').textContent = [vehicle.marca, vehicle.modelo].filter(Boolean).join(' · ') || '—';
    if ($('ficha-km'))$('ficha-km').textContent = formatKm(vehicle.kilometraje);
    if ($('ficha-marca-modelo'))$('ficha-marca-modelo').textContent = [vehicle.marca, vehicle.modelo].filter(Boolean).join(' · ') || '—';
    if ($('ficha-color'))$('ficha-color').textContent = vehicle.color || '—';
    if ($('ficha-estado'))$('ficha-estado').textContent = 'Vehículo seleccionado';

    try {
      const services = await api(`/api/servicios/vehiculo/${encodeURIComponent(id)}`);
      const active = (Array.isArray(services) ? services : []).find(s => !['COMPLETADO','CANCELADO'].includes(String(s.estado))) || services?.[0];
      state.service = active || null;
    } catch {
      state.service = null;
    }
    renderService();
    marcarFilaActiva();

    const url = new URL(location.href);
    url.searchParams.set('id', id);
    history.replaceState(null, '', url);
  }

  function renderService() {
    const service = state.service;
    const progress = Math.max(0, Math.min(100, Number(service?.progreso ?? 0)));
    if ($('ficha-progreso'))$('ficha-progreso').style.width = `${progress}%`;
    if ($('ficha-progreso-label'))$('ficha-progreso-label').textContent = `${progress}%`;
    if ($('ficha-servicio')) {$('ficha-servicio').textContent = service
        ? `${service.tipo || 'Servicio'} · ${service.estado || 'PROGRAMADO'}`
        : 'Este vehículo no tiene un servicio activo.';
    }
  }

  async function updateCurrentService(status, progress) {
    if (!state.service?.idServicio) {
      notify('No hay un servicio activo para este vehículo.');
      return;
    }

    const service = state.service;
    const payload = {
      tipo: service.tipo,
      descripcion: service.descripcion || '',
      precio: service.precio ?? 0,
      activo: status !== 'CANCELADO',
      estado: status,
      progreso: progress,
      fechaServicio: service.fechaServicio || null,
      vehiculo: { idvehiculo: vehicleId(state.selected) }
    };

    try {
      state.service = await api(`/api/servicios/${encodeURIComponent(service.idServicio)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      renderService();
      notify(status === 'COMPLETADO' ? 'Servicio completado.' : 'Servicio actualizado.');
    } catch (error) {
      notify(error.message);
    }
  }

  function notifyClient() {
    if (!state.selected) return notify('Selecciona un vehículo primero.');
    const phone = prompt('Número de WhatsApp del cliente:');
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return notify('Número de teléfono inválido.');
    const plate = state.selected.placa || 'su vehículo';
    const service = state.service?.tipo || 'el servicio';
    const message = `Hola, le informamos desde Serviteca JM que ${service} para el vehículo ${plate} presenta un avance del ${Number(state.service?.progreso ?? 0)}%.`;
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  async function deleteVehicle(id) {
    if (!confirm('¿Seguro que deseas eliminar este vehículo?')) return;
    try {
      await api(`/api/vehiculos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      state.vehicles = state.vehicles.filter(v => String(vehicleId(v)) !== String(id));
      renderTable();
      if (String(vehicleId(state.selected)) === String(id)) clearFicha();
      notify('Vehículo eliminado correctamente.');
    } catch (error) { notify(error.message); }
  }

  function initEvents() {
    // Escuchar clics en la tabla
    document.addEventListener('click', async event => {
      const view = event.target.closest('[data-view]');
      if (view) {
        const v = state.vehicles.find(x => String(vehicleId(x)) === String(view.dataset.view));
        if (v) await selectVehicle(v);
        return;
      }
      const edit = event.target.closest('[data-edit]');
      if (edit) { location.href = `/nuevo-vehiculo.html?id=${encodeURIComponent(edit.dataset.edit)}`; return; }
      const del = event.target.closest('[data-delete]');
      if (del) { await deleteVehicle(del.dataset.delete); return; }

      /* Clic en cualquier punto de la fila: selecciona ese vehículo
         y actualiza la ficha. Va DESPUÉS de los botones para que
         "Ver", "Editar" y "Eliminar" sigan teniendo prioridad y no
         se dispare además la selección. */
      const fila = event.target.closest('tr[data-row]');
      if (fila) {
        const v = state.vehicles.find(x => String(vehicleId(x)) === String(fila.dataset.row));
        if (v) await selectVehicle(v);
      }
    });

    /* Las filas llevan tabindex=0, así que Enter o Espacio deben
       hacer lo mismo que el clic: sin esto el foco entraba en la
       fila pero no ocurría nada. */
    document.addEventListener('keydown', async event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const fila = event.target.closest?.('tr[data-row]');
      if (!fila) return;
      const v = state.vehicles.find(x => String(vehicleId(x)) === String(fila.dataset.row));
      if (!v) return;
      event.preventDefault();
      await selectVehicle(v);
    });

    // Filtro de búsqueda y botones laterales
    $('buscar-vehiculo')?.addEventListener('input', renderTable);$('btn-notificar')?.addEventListener('click', notifyClient);
    $('btn-listo')?.addEventListener('click', () => updateCurrentService('COMPLETADO', 100));$('btn-reagendar')?.addEventListener('click', () => {
      if (!state.selected) return notify('Selecciona un vehículo primero.');
      location.href = `/nueva-cita.html?vehiculoId=${encodeURIComponent(vehicleId(state.selected))}`;
    });
    $('btn-cancelar')?.addEventListener('click', () => {
      if (confirm('¿Cancelar el servicio actual de este vehículo?')) updateCurrentService('CANCELADO', 0);
    });

    // El menú hamburguesa lo gestiona exclusivamente sidebar.js
    // (con Escape, aria-expanded y cierre automático al volver a
    // escritorio). Cablearlo también aquí lo abría y lo cerraba a
    // la vez: el menú nunca llegaba a desplegarse.
  }

  function init() {
    initEvents();
    loadVehicles();
  }

  // Comprobar si el DOM ya se cargó para asegurar la ejecución
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();