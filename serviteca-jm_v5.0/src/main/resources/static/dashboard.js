function formatCurrency(v) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(Number(v) || 0);
}

function statusClass(s) {
    return {
        COMPLETADA: 'bg',
        COMPLETADO: 'bg',
        PENDIENTE: 'by',
        CONFIRMADO: 'bgr',
        CANCELADA: 'br',
        CANCELADO: 'br',
        EN_PROCESO: 'bo',
        PROGRAMADO: 'bgr'
    }[String(s || '').toUpperCase()] || 'bgr';
}

function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c]));
}

async function loadDashboard(usuario, rol) {
    if (!usuario) {
        location.replace('login.html');
        return;
    }

    if (rol === 'cliente') {
        location.replace('portal-cliente.html');
        return;
    }

    try {
        const respuesta = await fetch('/api/dashboard', { credentials: 'same-origin' });

        if (respuesta.status === 401) {
            localStorage.clear();
            location.href = 'login.html';
            return;
        }

        const dashboard = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) {
            throw new Error(dashboard?.message || dashboard?.error || 'No se pudo cargar el dashboard.');
        }

        // KPIs reales
        document.getElementById('kpi-citas').textContent = dashboard.citasHoy ?? 0;
        document.getElementById('kpi-citas-sub').textContent =
            `${dashboard.citasSemana ?? 0} en los últimos 7 días`;
        document.getElementById('kpi-taller').textContent = dashboard.enTaller ?? 0;
        document.getElementById('kpi-ingresos').textContent = formatCurrency(dashboard.ingresosMes || 0);
        document.getElementById('kpi-canceladas').textContent = dashboard.canceladasSemana ?? 0;
        document.getElementById('kpi-tecnicos').textContent = dashboard.tecnicosActivos ?? 0;
        document.getElementById('kpi-clientes').textContent = dashboard.clientesActivos ?? 0;

        renderCitasDelDia(dashboard.citasDelDia || []);
        renderServiciosEnProceso(dashboard.serviciosEnProceso || []);

    } catch (e) {
        console.error('Error al cargar el dashboard:', e);
        const citas = document.getElementById('citas-hoy');
        if (citas) {
            citas.innerHTML = `<tr><td colspan="4">${esc(e.message || 'No se pudo cargar la información.')}</td></tr>`;
        }
    }
}

function renderCitasDelDia(citas) {
    const tbody = document.getElementById('citas-hoy');
    if (!tbody) return;

    if (!citas.length) {
        tbody.innerHTML = '<tr><td colspan="4">No hay citas programadas para hoy.</td></tr>';
        return;
    }

    tbody.innerHTML = citas.map(c => `
        <tr>
          <td>${esc(c.cliente || 'Cliente')}</td>
          <td>${esc(c.vehiculo || c.placa || '—')}</td>
          <td>${esc(String(c.hora || '').slice(0, 5) || '—')}</td>
          <td><span class="badge ${statusClass(c.estado)}">${esc(c.estado || '—')}</span></td>
        </tr>
    `).join('');
}

function renderServiciosEnProceso(servicios) {
    const cont = document.getElementById('servicios-proceso');
    if (!cont) return;

    if (!servicios.length) {
        cont.innerHTML = '<div class="ti"><div class="tav">✓</div><div><div class="tn">Sin servicios en proceso</div><div class="tt">El taller está al día</div></div></div>';
        return;
    }

    cont.innerHTML = servicios.map(s => {
        const progreso = Math.min(100, Math.max(0, Number(s.progreso) || 0));
        return `
          <div class="ti">
            <div class="tav">🔧</div>
            <div style="flex:1;min-width:0">
              <div class="tn">${esc(s.tipo || 'Servicio')}${s.placa ? ' · ' + esc(s.placa) : ''}</div>
              <div class="tt">${esc(s.estado || 'EN_PROCESO')} · ${progreso}%</div>
              <div style="height:6px;background:var(--black4);border-radius:4px;margin-top:5px;overflow:hidden">
                <div style="height:100%;width:${progreso}%;background:var(--green)"></div>
              </div>
            </div>
          </div>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        /* JM.ready resuelve cuando /api/auth/me ya verificó el rol.
           Si el guard redirigió, la promesa devuelve null. */
        const sesion = window.JM
            ? await window.JM.ready
            : {
                usuario: JSON.parse(localStorage.getItem('servitecaUser') || 'null'),
                rol: String(JSON.parse(localStorage.getItem('servitecaUser') || '{}')?.rol || '').toLowerCase()
            };

        if (!sesion?.usuario) return;
        await loadDashboard(sesion.usuario, sesion.rol);
    } catch (error) {
        console.error('[dashboard] No se pudo resolver la sesión:', error);
    }
});
