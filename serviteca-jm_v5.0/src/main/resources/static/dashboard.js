const currentUser = JSON.parse(localStorage.getItem('servitecaUser') || 'null');

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
        PENDIENTE: 'by',
        CONFIRMADO: 'bgr',
        CANCELADA: 'br'
    }[String(s || '').toUpperCase()] || 'bgr';
}

async function loadDashboard() {
    // 1. Validar presencia de usuario y rol en el frontend
    const userRole = String(currentUser?.rol || '').toLowerCase();

    if (!currentUser || userRole === 'cliente') {
        location.href = 'login.html';
        return;
    }

    try {
        // 2. Realizar peticiones al backend
        const [dR, cR] = await Promise.all([
            fetch('/api/dashboard', { credentials: 'same-origin' }),
            fetch('/api/citas', { credentials: 'same-origin' })
        ]);

        // 3. Validar si la sesión sigue activa en el backend
        if (dR.status === 401 || cR.status === 401) {
            localStorage.clear();
            location.href = 'login.html';
            return;
        }

        const dashboard = await dR.json();
        const citas = await cR.json();

        // 4. Renderizar KPIs
        document.getElementById('kpi-citas').textContent = dashboard.citas || 0;
        document.getElementById('kpi-taller').textContent =
            citas.filter(x => String(x.estado).toUpperCase() === 'CONFIRMADO').length;
        document.getElementById('kpi-ingresos').textContent = formatCurrency(dashboard.ingresosMes || 0);
        document.getElementById('kpi-canceladas').textContent =
            citas.filter(x => String(x.estado).toUpperCase() === 'CANCELADA').length;
        document.getElementById('kpi-tecnicos').textContent = dashboard.usuarios || 0;
        document.getElementById('kpi-calificacion').textContent = '—';

        // 5. Renderizar citas del día
        const today = new Date().toISOString().slice(0, 10);
        const rows = citas.filter(x => String(x.fecha || '').slice(0, 10) === today);

        document.getElementById('citas-hoy').innerHTML = rows.length
            ? rows.map(x => `
          <tr>
            <td>${x.usuario?.nombre || x.vehiculo?.usuario?.nombre || 'Cliente'}</td>
            <td>Servicio automotriz</td>
            <td>${String(x.hora || '').slice(0, 5)}</td>
            <td><span class="badge ${statusClass(x.estado)}">${x.estado}</span></td>
          </tr>
        `).join('')
            : `<tr><td colspan="4">No hay citas programadas para hoy.</td></tr>`;

    } catch (e) {
        console.error("Error al cargar el dashboard:", e);
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);