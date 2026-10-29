/* Catálogo de servicios para los selectores de agenda.
   /api/servicios devuelve una página; el selector necesita la lista
   completa, por eso se consume /api/servicios/catalogo. */
async function cargarCatalogoServicios(selectId = "servicio") {
  const respuesta = await fetch("/api/servicios/catalogo", { credentials: "same-origin" });
  const servicios = await respuesta.json().catch(() => []);
  if (!respuesta.ok) throw new Error("No se pudo cargar el catálogo.");

  const select = document.getElementById(selectId);
  if (!select) return;

  const disponibles = (Array.isArray(servicios) ? servicios : [])
    .filter((servicio) => servicio && servicio.activo !== false);

  select.innerHTML = disponibles.map((servicio) => `
    <option value="${servicio.idServicio}">
      ${servicio.tipo} — $${Number(servicio.precio || 0).toLocaleString("es-CO")}
    </option>`).join("");
}

async function agendarServicio({ vehiculoId, servicioId, fechaHora }) {
  const respuesta = await fetch("/api/citas", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fecha: fechaHora.slice(0, 10),
      hora: fechaHora.slice(11, 16),
      estado: "PENDIENTE",
      vehiculo: { idvehiculo: Number(vehiculoId) },
      usuario: null
    })
  });

  if (!respuesta.ok) {
    const data = await respuesta.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || "No se pudo agendar la cita.");
  }
  return respuesta.json();
}
