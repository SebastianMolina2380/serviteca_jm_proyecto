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
    if (line) {
      line.className = "stp-line" + (i < num ? " done" : "");
    }
  }
}

function selSvc(el) {
  document.querySelectorAll(".svc").forEach((svc) => svc.classList.remove("sel"));
  el.classList.add("sel");
}

document.addEventListener("DOMContentLoaded", function () {
  const tbdate = document.getElementById("tbdate");
  if (tbdate) {
    const date = new Date();
    const monthNames = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ];
    tbdate.textContent = `${date.getDate()} DE ${monthNames[date.getMonth()]}`;
  }

  /* Servicio elegido en el detalle de index.html
     (?servicio=Frenos). Solo preselecciona el chip del paso 3;
     no salta de paso, para no saltarse la validación del wizard.
     Al llegar a "PASO 3" ya aparecerá marcado. */
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
        const n = chip.querySelector(".svc-n");
        if (n && norm(n.textContent) === buscado) selSvc(chip);
      });
    }
  } catch (e) {
    /* sin cadena de consulta: nada que preseleccionar */
  }

  /* --------------------------------------------------------
     El menú lateral NO se maneja aquí.
     --------------------------------------------------------
     Antes este archivo registraba su propio listener sobre
     #hambtn que hacía classList.toggle('open'). Como sidebar.js
     también lo registra (y es el dueño del overlay, de
     aria-expanded y del cierre con Escape), cada clic ejecutaba
     DOS toggle seguidos: abrir + cerrar en el mismo instante.
     El resultado era que el sidebar no se abría en móvil y el
     contenido no quedaba detrás del overlay.
     ------------------------------------------------------ */

  /* --------------------------------------------------------
     PASO 2 · selector de vehículo
     --------------------------------------------------------
     /api/vehiculos devuelve {idvehiculo, idusuario, placa,
     marca, modelo, color, kilometraje}. El modelo Vehiculo.java
     no tiene campos de tipo ni de año, por lo que esos dos
     datos del formulario de alta no llegan a persistirse.
     ------------------------------------------------------ */
  const selPlaca = document.getElementById("veh-placa");
  const resumenVeh = document.getElementById("veh-resumen");
  const avisoVacio = document.getElementById("veh-vacio");
  const panelExistente = document.getElementById("veh-existente");
  const panelNuevo = document.getElementById("veh-nuevo");
  let vehiculosCargados = [];

  function pintarResumen(v) {
    if (!resumenVeh) return;
    if (!v) { resumenVeh.textContent = "—"; return; }
    const km = v.kilometraje != null
      ? Number(v.kilometraje).toLocaleString("es-CO") + " km"
      : "";
    resumenVeh.innerHTML =
      '<strong style="color:var(--green)">' + (v.placa || "—") + "</strong><br>" +
      ((v.marca || "") + " " + (v.modelo || "")).trim() +
      (v.color ? " · " + v.color : "") +
      (km ? '<br><span style="color:var(--gray1)">' + km + "</span>" : "");
  }

  function cambiarModoVehiculo(modo) {
    const esExistente = modo === "existente";
    if (panelExistente) panelExistente.hidden = !esExistente;
    if (panelNuevo) panelNuevo.hidden = esExistente;
    document.querySelectorAll(".vh-tab").forEach(function (t) {
      const activo = t.dataset.vhModo === modo;
      t.classList.toggle("is-active", activo);
      t.setAttribute("aria-selected", activo ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-vh-modo]").forEach(function (t) {
    t.addEventListener("click", function () { cambiarModoVehiculo(t.dataset.vhModo); });
  });

  async function cargarVehiculos() {
    if (!selPlaca) return;
    try {
      const r = await fetch("/api/vehiculos", { credentials: "same-origin" });
      const data = await r.json().catch(function () { return []; });
      if (!r.ok || !Array.isArray(data)) throw new Error("sin datos");

      vehiculosCargados = data;
      selPlaca.innerHTML = "";

      /* Sin registros no tiene sentido mostrar un selector vacío:
         se fuerza el modo de alta y se explica por qué. */
      if (!data.length) {
        selPlaca.appendChild(new Option("— Sin vehículos registrados —", ""));
        selPlaca.disabled = true;
        if (avisoVacio) avisoVacio.style.display = "block";
        cambiarModoVehiculo("nuevo");
        return;
      }

      selPlaca.appendChild(new Option("— Seleccione vehículo —", ""));
      data.forEach(function (v) {
        selPlaca.appendChild(
          new Option(v.placa + " · " + v.marca + " " + v.modelo, String(v.idvehiculo))
        );
      });
      selPlaca.disabled = false;
      if (avisoVacio) avisoVacio.style.display = "none";
      cambiarModoVehiculo("existente");
    } catch (e) {
      selPlaca.innerHTML = "";
      selPlaca.disabled = true;
      selPlaca.appendChild(new Option("— No se pudieron cargar los vehículos —", ""));
      if (avisoVacio) avisoVacio.style.display = "block";
      cambiarModoVehiculo("nuevo");
    }
  }

  if (selPlaca) {
    selPlaca.addEventListener("change", function () {
      const id = selPlaca.value;
      pintarResumen(vehiculosCargados.find(function (v) {
        return String(v.idvehiculo) === id;
      }));
    });
  }

  /* La placa escrita a mano se normaliza como en el backend:
     mayúsculas, sin espacios y conservando los guiones. */
  const inpPlaca = document.getElementById("placa-vehiculo");
  if (inpPlaca) {
    inpPlaca.addEventListener("input", function () {
      const normalizada = inpPlaca.value.toUpperCase().replace(/\s+/g, "");
      if (inpPlaca.value !== normalizada) inpPlaca.value = normalizada;
    });
  }

  /* Consultable desde el paso 4 para confirmar la cita. */
  window.vehiculoSeleccionado = function () {
    return vehiculosCargados.find(function (v) {
      return selPlaca && String(v.idvehiculo) === selPlaca.value;
    }) || null;
  };

  cargarVehiculos();

  goStep(1);
});
