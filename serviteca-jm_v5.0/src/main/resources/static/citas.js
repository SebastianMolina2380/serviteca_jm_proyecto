/* ============================================================
   CITAS · filtrado por estado + búsqueda combinada
   ------------------------------------------------------------
   Estados reales del backend (Cita.Estado, Cita.java:28):
     PENDIENTE, CONFIRMADO, CANCELADA, COMPLETADA

   El botón de la UI dice "Confirmada" pero la BD guarda
   CONFIRMADO (masculino). La comparación literal
   'confirmado' === 'confirmada' nunca era cierta, por lo que
   ese filtro —el único con 20 filas reales— devolvía siempre 0.
   Aquí cada filtro acepta alias por género y número.
   ============================================================ */

const citasToken = localStorage.getItem("servitecaToken");
const citasUser = JSON.parse(localStorage.getItem("servitecaUser") || "null");

let citasData = [];
let citasFilter = 'all';
let citasSearch = '';

/* Mapa filtro -> alias admisibles. null = sin filtro (Todos). */
const FILTRO_ALIAS = {
  'all':        null,
  'confirmada': ['confirmado', 'confirmada'],
  'en proceso': ['en proceso', 'enproceso'],
  'completada': ['completada', 'completado'],
  'pendiente':  ['pendiente'],
  'cancelada':  ['cancelada', 'cancelado']
};

/* Clave de comparación: minúsculas, guion bajo -> espacio,
   espacios colapsados. Sin escapes unicode: los estados son
   ASCII y así no se depende de normalización de acentos. */
function claveEstado(v) {
  return String(v == null ? '' : v)
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

/* Rol en minúsculas: la BD guarda ADMIN y el código usaba
   'admin', por lo que el guard de borrado nunca coincidía. */
function rolUsuario() {
  return claveEstado(citasUser?.rol);
}

function citasBadge(s) {
  return {
    completada:  'bg',
    completado:  'bg',
    confirmado:  'bgr',
    confirmada:  'bgr',
    pendiente:   'by',
    cancelada:   'br',
    cancelado:   'br',
    'en proceso': 'bo'
  }[claveEstado(s)] || 'bgr';
}

function normalize(c) {
  return {
    id: c.idCita,
    fecha: c.fecha,
    hora: c.hora,
    estado: c.estado,
    cliente: c.usuario?.nombre
      || c.vehiculo?.usuario?.nombre
      || `Cliente #${c.usuario?.idUsuario || c.vehiculo?.usuario?.idUsuario || '—'}`,
    vehiculo: c.vehiculo
      ? `${c.vehiculo.placa || ''} ${c.vehiculo.marca || ''} ${c.vehiculo.modelo || ''}`.trim()
      : '—'
  };
}

/* ¿Pasa el filtro de estado? 'all' muestra todo; el resto se
   resuelve contra la lista de alias del filtro activo. */
function pasaFiltro(estado) {
  if (citasFilter === 'all') return true;
  const alias = FILTRO_ALIAS[citasFilter];
  if (!alias) return false;
  const e = claveEstado(estado);
  return alias.some(function (a) { return claveEstado(a) === e; });
}

function renderCitas() {
  const q = citasSearch.trim().toLowerCase();

  /* Filtro de estado Y texto a la vez: son independientes y
     combinables, no condicionan el uno al otro. */
  const rows = citasData.filter(function (i) {
    if (!pasaFiltro(i.estado)) return false;
    if (!q) return true;
    return `${i.id} ${i.cliente} ${i.vehiculo}`.toLowerCase().includes(q);
  });

  const tb = document.getElementById('tbody-citas');
  if (!tb) return;

  tb.innerHTML = rows.length
    ? rows.map(function (i) {
        const puedeBorrar = ['admin', 'tecnico'].includes(rolUsuario());
        return `<tr>
          <td style="color:var(--yellow);font-weight:700;">TKT-${String(i.id).padStart(4, '0')}</td>
          <td>${i.cliente}</td>
          <td>${i.vehiculo}</td>
          <td>Servicio automotriz</td>
          <td>—</td>
          <td>${i.fecha || '—'} ${String(i.hora || '').slice(0, 5)}</td>
          <td><span class="badge ${citasBadge(i.estado)}">${i.estado}</span></td>
          <td>${puedeBorrar ? `<button type="button" class="btn-sm-g" data-delete-cita="${i.id}">🗑 Eliminar</button>` : ''}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="8" class="citas-empty">No hay citas para mostrar.</td></tr>`;
}

async function loadCitas() {
  if (!citasToken) { location.href = 'login.html'; return; }
  const r = await fetch('/api/citas', { credentials: 'same-origin' });
  const data = await r.json().catch(function () { return []; });
  if (!r.ok) throw new Error(data?.error || 'No se pudieron cargar las citas.');
  citasData = (Array.isArray(data) ? data : []).map(normalize);
  renderCitas();
}

async function deleteCita(id) {
  if (!['admin', 'tecnico'].includes(rolUsuario())) return;
  if (!confirm('¿Eliminar esta cita?')) return;
  const r = await fetch(`/api/citas/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  if (!r.ok) throw new Error('No se pudo eliminar la cita.');
  await loadCitas();
}

/* Cambia el filtro y la clase activa. Se decide por data-filter
   y no por el objeto botón, para que el estado visual quede
   siempre sincronizado aunque se dispare por otra vía. */
function filterCitas(v) {
  citasFilter = claveEstado(v);
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.classList.toggle('is-active', claveEstado(b.dataset.filter) === citasFilter);
  });
  renderCitas();
}

function searchCitas(v) {
  citasSearch = String(v == null ? '' : v);
  renderCitas();
}

/* Borrado por delegación (el botón se genera dinámicamente). */
document.addEventListener('click', function (e) {
  const b = e.target.closest('[data-delete-cita]');
  if (b) deleteCita(b.dataset.deleteCita).catch(function (x) { alert(x.message); });
});

document.addEventListener('DOMContentLoaded', function () {
  /* Captura de eventos en los botones de filtro. */
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () { filterCitas(b.dataset.filter); });
  });

  /* Búsqueda por cliente o placa. */
  const buscador = document.getElementById('citas-search');
  if (buscador) {
    buscador.addEventListener('input', function (e) { searchCitas(e.target.value); });
  }

  /* Estado activo inicial = "Todos". */
  filterCitas('all');

  loadCitas().catch(function (e) { alert(e.message); });
});
