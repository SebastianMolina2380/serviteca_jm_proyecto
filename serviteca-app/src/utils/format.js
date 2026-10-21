// Utilidades de formato de fechas/horas y dinero.
// El backend devuelve fechas como "2026-10-05" (o array
// [2026, 10, 5]) y horas como "09:30:00".

export function formatearFecha(fecha) {
  if (!fecha) return '—';

  if (Array.isArray(fecha)) {
    const [y, m, d] = fecha;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  const texto = String(fecha);
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  return texto;
}

export function formatearHora(hora) {
  if (!hora) return '';

  if (Array.isArray(hora)) {
    const [h, m] = hora;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const texto = String(hora);
  const match = texto.match(/(\d{2}:\d{2})/);

  return match ? match[1] : texto;
}

export function formatearDinero(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';

  const numero = Number(valor);

  if (Number.isNaN(numero)) return String(valor);

  return `$${numero.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// Describe el vehículo: "ABC123 - Chevrolet Aveo"
export function describirVehiculo(vehiculo) {
  if (!vehiculo) return 'Vehículo no disponible';

  const partes = [vehiculo.placa];

  if (vehiculo.marca || vehiculo.modelo) {
    partes.push(`${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim());
  }

  return partes.filter(Boolean).join(' - ');
}
