document.addEventListener("DOMContentLoaded", function () {
  /* ── Fecha de la barra superior y menú lateral ── */
  const tbdate = document.getElementById("tbdate");
  if (tbdate) {
    tbdate.textContent = new Date().toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /* El menú lateral lo gestiona sidebar.js (único dueño del
     toggle). Registrarlo también aquí duplicaba el listener y
     cada clic abría y cerraba el sidebar en el mismo instante. */

  /* ── Reportes ── */
  const $ = (id) => document.getElementById(id);
  const desdeInput = $("rep-desde");
  const hastaInput = $("rep-hasta");
  const mensaje = $("rep-mensaje");
  const money = (v) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(v) || 0);

  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[c]));

  const fechaCO = (v) => {
    if (!v) return "—";
    const d = new Date(v + "T00:00:00");
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("es-CO");
  };

  function rangoPorDefecto() {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const iso = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dia = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dia}`;
    };
    if (desdeInput && !desdeInput.value) desdeInput.value = iso(primero);
    if (hastaInput && !hastaInput.value) hastaInput.value = iso(hoy);
  }

  function mostrarMensaje(texto, error = false) {
    if (!mensaje) return;
    mensaje.textContent = texto || "";
    mensaje.className = "rep-mensaje" + (error ? " is-error" : "");
  }

  function parametros() {
    const params = new URLSearchParams();
    if (desdeInput?.value) params.set("desde", desdeInput.value);
    if (hastaInput?.value) params.set("hasta", hastaInput.value);
    return params;
  }

  async function cargar() {
    rangoPorDefecto();
    mostrarMensaje("Cargando reporte…");
    try {
      const respuesta = await fetch("/api/reportes?" + parametros().toString(), {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      if (respuesta.status === 401) {
        location.href = "login.html";
        return;
      }
      if (respuesta.status === 403) {
        mostrarMensaje("No tienes permisos para consultar los reportes.", true);
        return;
      }

      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        throw new Error(data?.message || data?.error || "No se pudo cargar el reporte.");
      }

      render(data);
      mostrarMensaje("");
    } catch (e) {
      mostrarMensaje(e.message || "No se pudo cargar el reporte.", true);
    }
  }

  function render(data) {
    if ($("rep-rango")) {
      $("rep-rango").textContent = `${fechaCO(data.desde)} — ${fechaCO(data.hasta)}`;
    }

    $("kpi-citas").textContent = data.totalCitas ?? 0;
    $("kpi-servicios").textContent = data.totalServicios ?? 0;
    $("kpi-facturado").textContent = money(data.ingresosFacturados);
    $("kpi-servicios-ingreso").textContent = money(data.ingresosServicios);

    renderChart(data.ingresosPorPeriodo || []);
    renderTop(data.topServicios || []);
    renderEstados("rep-citas-estado", data.citasPorEstado || {});
    renderEstados("rep-servicios-estado", data.serviciosPorEstado || {});
    renderDetalle(data.detalleServicios || []);
  }

  function renderChart(periodos) {
    const cont = $("rep-chart");
    const vacio = $("rep-chart-vacio");
    if (!cont) return;

    const hayDatos = periodos.some((p) => Number(p.ingresos) > 0);
    cont.innerHTML = "";
    if (vacio) vacio.hidden = hayDatos;
    cont.hidden = !hayDatos;
    if (!hayDatos) return;

    const max = periodos.reduce((m, p) => Math.max(m, Number(p.ingresos) || 0), 0);
    cont.innerHTML = periodos.map((p) => {
      const valor = Number(p.ingresos) || 0;
      const alto = max > 0 ? Math.max(4, Math.round((valor / max) * 100)) : 0;
      const esMax = valor === max && valor > 0;
      return `
        <div class="bc" title="${esc(p.desde)} a ${esc(p.hasta)}">
          <div class="btrack">
            <div class="bf ${esMax ? "is-max" : ""}" style="height:${alto}%"></div>
          </div>
          <div class="bl">${esc(p.etiqueta)}</div>
          <div class="bv ${esMax ? "is-max" : ""}">${money(valor)}</div>
        </div>`;
    }).join("");
  }

  function renderTop(items) {
    const cont = $("rep-top");
    const vacio = $("rep-top-vacio");
    if (!cont) return;

    cont.innerHTML = "";
    if (vacio) vacio.hidden = items.length > 0;
    if (!items.length) return;

    cont.innerHTML = items.map((item, index) => {
      const pct = Number(item.porcentaje) || 0;
      const color = index === 0 ? "var(--yellow)" : "var(--green)";
      return `
        <div class="rep-top-item">
          <div class="rep-top-head">
            <span>${esc(item.tipo)}</span>
            <span style="color:${color}">${pct}% (${esc(item.cantidad)})</span>
          </div>
          <div class="prog-w">
            <div class="prog-f" style="width:${Math.min(100, Math.max(0, pct))}%;background:${color}"></div>
          </div>
        </div>`;
    }).join("");
  }

  function renderEstados(id, estados) {
    const cont = $(id);
    if (!cont) return;
    const entradas = Object.entries(estados);
    const total = entradas.reduce((s, [, v]) => s + Number(v || 0), 0);
    cont.innerHTML = entradas.map(([estado, cantidad]) => {
      const pct = total > 0 ? Math.round((Number(cantidad) / total) * 100) : 0;
      return `
        <div class="rep-estado">
          <span>${esc(estado)}</span>
          <span><strong>${esc(cantidad)}</strong> · ${pct}%</span>
        </div>`;
    }).join("");
  }

  function renderDetalle(filas) {
    const tbody = $("rep-detalle");
    if (!tbody) return;
    if (!filas.length) {
      tbody.innerHTML = '<tr><td colspan="6">Sin servicios registrados en el periodo.</td></tr>';
      return;
    }
    tbody.innerHTML = filas.map((f) => {
      const estado = String(f.estado || "").toUpperCase();
      const clase = estado === "COMPLETADO" ? "bg"
        : estado === "CANCELADO" ? "br"
        : estado === "EN_PROCESO" ? "by" : "bgr";
      return `
        <tr>
          <td>${esc(fechaCO(f.fecha))}</td>
          <td>${esc(f.tipo || "—")}</td>
          <td>${esc(f.placa || "—")}</td>
          <td>${esc(f.cliente || "—")}</td>
          <td><span class="badge ${clase}">${esc(estado || "—")}</span></td>
          <td>${money(f.precio)}</td>
        </tr>`;
    }).join("");
  }

  function exportar(formato) {
    const params = parametros();
    params.set("formato", formato);
    const enlace = document.createElement("a");
    enlace.href = "/api/reportes/export?" + params.toString();
    enlace.download = "";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  }

  $("btn-aplicar")?.addEventListener("click", cargar);
  $("btn-csv")?.addEventListener("click", () => exportar("csv"));
  $("btn-excel")?.addEventListener("click", () => exportar("excel"));
  $("btn-pdf")?.addEventListener("click", () => exportar("pdf"));
  desdeInput?.addEventListener("change", cargar);
  hastaInput?.addEventListener("change", cargar);

  cargar();
});
