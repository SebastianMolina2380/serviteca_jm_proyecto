// Estado del asistente: conserva el ID del vehículo entre pasos.
const citaData = window.citaData || { clienteId: null, vehiculoId: null };
window.citaData = citaData;

function goStep(num = 1) {
  [1, 2, 3, 4, 5].forEach((i) => {
    const page = document.getElementById("p" + i);
    if (page) page.style.display = i === num ? "block" : "none";
  });

  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById("stp" + i);
    const line = document.getElementById("l" + i);

    if (step) {
      step.className = "stp " + (i < num ? "done" : i === num ? "active" : "pend");
      const circle = step.querySelector(".stp-c");
      if (circle) circle.textContent = i < num ? "✓" : i;
    }

    if (line) line.className = "stp-line" + (i < num ? " done" : "");
  }
}

function selSvc(el) {
  document.querySelectorAll(".svc").forEach((svc) => svc.classList.remove("sel"));
  el.classList.add("sel");
}

async function confirmarCita() {
  const boton = document.getElementById("btn-confirmar-cita");
  const selectorId = document.getElementById("veh-placa")?.value;
  // El estado guardado es la fuente principal; el selector sirve como respaldo.
  const vehiculoId = citaData.vehiculoId || selectorId || null;
  const fecha = document.getElementById("fecha-preferida")?.value;
  const horaTexto = document.getElementById("hora-disponible")?.value || "";

  if (!vehiculoId) {
    alert("Selecciona un vehículo registrado para la cita.");
    goStep(2);
    return;
  }

  citaData.vehiculoId = String(vehiculoId);

  if (!fecha || !horaTexto) {
    alert("Selecciona la fecha y la hora de la cita.");
    goStep(3);
    return;
  }

  // El selector muestra horas en formato AM/PM; la API recibe HH:mm.
  const match = horaTexto.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    alert("Selecciona una hora válida.");
    goStep(3);
    return;
  }

  let horas = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") horas += 12;
  const hora = `${String(horas).padStart(2, "0")}:${match[2]}`;

  if (boton) boton.disabled = true;

  try {
    const respuesta = await fetch("/api/citas", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        fecha,
        hora,
        estado: "PENDIENTE",
        vehiculo: { idvehiculo: Number(citaData.vehiculoId) }
      })
    });

    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(data.message || data.error || "No se pudo guardar la cita.");
    }

    const ticket = document.getElementById("cita-ticket");
    if (ticket) {
      ticket.textContent = `TKT-${String(data.idCita).padStart(4, "0")}`;
    }

    const vehiculo = window.vehiculoSeleccionado?.();
    const detalle = document.getElementById("cita-confirmada-detalle");
    if (detalle) {
      detalle.textContent = `${vehiculo?.placa || "Vehículo"} · ${fecha} ${hora}`;
    }

    goStep(5);
  } catch (error) {
    alert(error.message);
  } finally {
    if (boton) boton.disabled = false;
  }
}

window.confirmarCita = confirmarCita;

async function avanzarDesdePaso1() {
  const boton = document.getElementById("btn-continuar-cliente");
  const documento = document.getElementById("numero-doc")?.value.trim();
  const nombre = document.getElementById("nombre-cliente")?.value.trim();
  const correo = document.getElementById("correo-cliente")?.value.trim();
  if (!documento || !nombre || !correo) { alert("Completa el documento, nombre y correo del cliente."); return; }
  if (boton) boton.disabled = true;
  try {
    const respuesta = await fetch("/api/clientes", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        nombre,
        numeroDoc: documento,
        tipoDocumento: document.getElementById("tipo-doc")?.value || "CC",
        correo,
        telefono: document.getElementById("telefono-cliente")?.value.trim() || "",
        ciudad: document.getElementById("procedencia-cliente")?.value || "Tunja - Colombia",
        direccion: "",
        contrasena: "Temp1234*"
      })
    });
    let cliente = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 409) {
      // El endpoint lista los clientes en una página y acepta búsqueda por documento/correo.
      const terminos = [documento, correo].filter(Boolean);
      let existente = null;
      for (const termino of terminos) {
        const consulta = await fetch(`/api/clientes?size=100&q=${encodeURIComponent(termino)}`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" }
        });
        const resultado = await consulta.json().catch(() => ({}));
        if (!consulta.ok) throw new Error(resultado.message || resultado.error || "No se pudo buscar el cliente existente.");
        const lista = Array.isArray(resultado) ? resultado : resultado.content || [];
        existente = lista.find(item =>
          String(item.documento || "").trim() === documento ||
          String(item.email || "").trim().toLowerCase() === correo.toLowerCase()
        );
        if (existente) break;
      }
      if (!existente?.id) throw new Error("El documento o correo ya está registrado, pero no se pudo encontrar el cliente.");
      cliente = existente;
    } else if (!respuesta.ok) {
      throw new Error(cliente.message || cliente.error || "No se pudo registrar el cliente.");
    }
    if (cliente.id == null) throw new Error("El servidor no devolvió el ID del cliente.");
    citaData.clienteId = String(cliente.id);
    citaData.vehiculoId = null;
    goStep(2);
  } catch (error) {
    alert(error.message);
  } finally {
    if (boton) boton.disabled = false;
  }
}
window.avanzarDesdePaso1 = avanzarDesdePaso1;

async function avanzarDesdePaso2() {
  const modoNuevo = document.querySelector('[data-vh-modo="nuevo"]')?.classList.contains("is-active");
  if (!modoNuevo) {
    const id = document.getElementById("veh-placa")?.value || citaData.vehiculoId;
    if (!id) { alert("Selecciona un vehículo registrado."); return; }
    citaData.vehiculoId = String(id);
    goStep(3);
    return;
  }

  try {
    const datos = {
      placa: document.getElementById("placa-vehiculo")?.value.trim().toUpperCase().replace(/\\s+/g, ""),
      marca: document.getElementById("marca-vehiculo")?.value.trim(),
      modelo: document.getElementById("modelo-vehiculo")?.value.trim(),
      color: document.getElementById("color-vehiculo")?.value.trim(),
      kilometraje: Number(document.getElementById("kilometraje-vehiculo")?.value),
      idusuario: Number(citaData.clienteId)
    };
    if (!citaData.clienteId || !datos.placa || !datos.marca || !datos.modelo || !Number.isInteger(datos.kilometraje) || datos.kilometraje < 0) {
      throw new Error("Registra primero el cliente y completa placa, marca, modelo y kilometraje válido.");
    }

    const respuesta = await fetch("/api/vehiculos", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(datos)
    });
    const creado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(creado.message || creado.error || "No se pudo registrar el vehículo.");
    if (creado.idvehiculo == null) throw new Error("El servidor no devolvió el ID del vehículo registrado.");

    citaData.vehiculoId = String(creado.idvehiculo);
    window.vehiculoNuevoDeCita = creado;
    goStep(3);
  } catch (error) {
    alert(error.message);
  }
}
window.avanzarDesdePaso2 = avanzarDesdePaso2;

document.addEventListener("DOMContentLoaded", function () {
  const tbdate = document.getElementById("tbdate");

  if (tbdate) {
    const date = new Date();
    const monthNames = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];
    tbdate.textContent = `${date.getDate()} DE ${monthNames[date.getMonth()]}`;
  }

  // Preselecciona el servicio indicado desde index.html, si coincide.
  try {
    const paramServicio = new URLSearchParams(window.location.search).get("servicio");

    if (paramServicio) {
      const norm = (s) =>
          (s || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();

      const buscado = norm(paramServicio);

      document.querySelectorAll(".svc").forEach(function (chip) {
        const nombre = chip.querySelector(".svc-n");
        if (nombre && norm(nombre.textContent) === buscado) selSvc(chip);
      });
    }
  } catch (_) {
    // Sin parámetro de servicio no hay nada que preseleccionar.
  }

  const selPlaca = document.getElementById("veh-placa");
  const resumenVeh = document.getElementById("veh-resumen");
  const avisoVacio = document.getElementById("veh-vacio");
  const panelExistente = document.getElementById("veh-existente");
  const panelNuevo = document.getElementById("veh-nuevo");
  let vehiculosCargados = [];

  function pintarResumen(vehiculo) {
    if (!resumenVeh) return;
    if (!vehiculo) {
      resumenVeh.textContent = "—";
      return;
    }

    const km = vehiculo.kilometraje != null
        ? Number(vehiculo.kilometraje).toLocaleString("es-CO") + " km"
        : "";

    resumenVeh.innerHTML =
        '<strong style="color:var(--green)">' + (vehiculo.placa || "—") + "</strong><br>" +
        ((vehiculo.marca || "") + " " + (vehiculo.modelo || "")).trim() +
        (vehiculo.color ? " · " + vehiculo.color : "") +
        (km ? '<br><span style="color:var(--gray1)">' + km + "</span>" : "");
  }

  function cambiarModoVehiculo(modo) {
    const esExistente = modo === "existente";

    if (panelExistente) panelExistente.hidden = !esExistente;
    if (panelNuevo) panelNuevo.hidden = esExistente;

    document.querySelectorAll(".vh-tab").forEach(function (tab) {
      const activo = tab.dataset.vhModo === modo;
      tab.classList.toggle("is-active", activo);
      tab.setAttribute("aria-selected", activo ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-vh-modo]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      cambiarModoVehiculo(tab.dataset.vhModo);
    });
  });

  async function cargarVehiculos() {
    if (!selPlaca) return;

    const idGuardado = citaData.vehiculoId || selPlaca.value || null;

    try {
      const respuesta = await fetch("/api/vehiculos", {
        credentials: "same-origin"
      });
      const data = await respuesta.json().catch(() => []);

      if (!respuesta.ok || !Array.isArray(data)) {
        throw new Error("No se pudieron cargar los vehículos.");
      }

      vehiculosCargados = data;
      selPlaca.innerHTML = "";

      if (!data.length) {
        selPlaca.appendChild(new Option("— Sin vehículos registrados —", ""));
        selPlaca.disabled = true;
        citaData.vehiculoId = null;
        if (avisoVacio) avisoVacio.style.display = "block";
        cambiarModoVehiculo("nuevo");
        return;
      }

      selPlaca.appendChild(new Option("— Seleccione vehículo —", ""));

      data.forEach(function (vehiculo) {
        selPlaca.appendChild(
            new Option(
                `${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`,
                String(vehiculo.idvehiculo)
            )
        );
      });

      const existeSeleccion = idGuardado && data.some(
          vehiculo => String(vehiculo.idvehiculo) === String(idGuardado)
      );

      if (existeSeleccion) {
        selPlaca.value = String(idGuardado);
        citaData.vehiculoId = String(idGuardado);
        pintarResumen(data.find(
            vehiculo => String(vehiculo.idvehiculo) === String(idGuardado)
        ));
      }

      selPlaca.disabled = false;
      if (avisoVacio) avisoVacio.style.display = "none";
      cambiarModoVehiculo("existente");
    } catch (_) {
      selPlaca.innerHTML = "";
      selPlaca.disabled = true;
      selPlaca.appendChild(
          new Option("— No se pudieron cargar los vehículos —", "")
      );
      if (avisoVacio) avisoVacio.style.display = "block";
      cambiarModoVehiculo("nuevo");
    }
  }

  if (selPlaca) {
    selPlaca.addEventListener("change", function () {
      citaData.vehiculoId = selPlaca.value || null;

      const vehiculo = vehiculosCargados.find(
          item => String(item.idvehiculo) === String(citaData.vehiculoId)
      );

      pintarResumen(vehiculo);
    });
  }

  // Normaliza la placa ingresada en el formulario de vehículo nuevo.
  const inpPlaca = document.getElementById("placa-vehiculo");
  if (inpPlaca) {
    inpPlaca.addEventListener("input", function () {
      const normalizada = inpPlaca.value.toUpperCase().replace(/\s+/g, "");
      if (inpPlaca.value !== normalizada) inpPlaca.value = normalizada;
    });
  }

  // Permite consultar el vehículo seleccionado desde otros pasos.
  window.vehiculoSeleccionado = function () {
    return window.vehiculoNuevoDeCita || vehiculosCargados.find(
        vehiculo => String(vehiculo.idvehiculo) === String(citaData.vehiculoId)
    ) || null;
  };

  cargarVehiculos();
  goStep(1);
});
