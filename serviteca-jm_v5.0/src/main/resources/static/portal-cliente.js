/* ============================================================
   PORTAL DEL CLIENTE
   ------------------------------------------------------------
   Requiere role-guard.js en el <head> (sesión fail-closed) y
   sidebar.js al final del <body> (dueño del menú móvil).
   ============================================================ */

const ESTADOS_CITA_ACTIVA = ["PENDIENTE", "CONFIRMADA", "EN_PROCESO"];
const ESTADOS_SERVICIO_ACTIVO = ["PROGRAMADO", "EN_PROCESO"];

async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) }
  });

  /* Sesión vencida o rol sin permiso: misma salida que el resto
     de vistas (login.html), en vez de dejar la página cargando. */
  if (r.status === 401 || r.status === 403) {
    location.href = "login.html";
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error((d && d.error) || "No se pudo cargar la información.");
  return d;
}

function mostrarError(texto) {
  const caja = document.getElementById("portal-error");
  if (!caja) return;
  caja.textContent = texto || "";
  caja.hidden = !texto;
}

function lista(valor) {
  return Array.isArray(valor) ? valor : [];
}

function setDate() {
  const el = document.getElementById("tbdate");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("es-CO", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

function pintarResumen(vehiculos, citasActivas, serviciosActivos) {
  const resumen = document.getElementById("resumen-cliente");
  if (!resumen) return;
  const s = serviciosActivos === 1 ? "servicio activo" : "servicios activos";
  const c = citasActivas === 1 ? "cita próxima" : "citas próximas";
  resumen.textContent =
    vehiculos === 0 && citasActivas === 0 && serviciosActivos === 0
      ? "Aún no tienes vehículos registrados. Agrega el primero para solicitar una cita."
      : `Tienes ${serviciosActivos} ${s} y ${citasActivas} ${c}.`;
}

document.addEventListener("DOMContentLoaded", async () => {
  setDate();
  try {
    /* JM.ready espera a /api/auth/me y deja el menú del rol aplicado. */
    const sesion = window.JM ? await window.JM.ready : null;
    if (!sesion || !sesion.usuario) return;
    if (window.JM && !window.JM.requireRole("cliente")) return;

    const nombre = String(sesion.usuario.nombre || "").trim() || "Cliente";
    const elNombre = document.getElementById("nombre-usuario");
    if (elNombre) elNombre.textContent = nombre;

    await loadPortal();
  } catch (e) {
    mostrarError(e.message);
  }
});

async function loadPortal() {
  const [vehiculos, citas, servicios, facturas] = await Promise.all([
    api("/api/mi/vehiculos"),
    api("/api/mi/citas"),
    api("/api/mi/servicios"),
    api("/api/mi/facturas")
  ]);

  const vs = lista(vehiculos);
  const cs = lista(citas);
  const ss = lista(servicios);
  const fs = lista(facturas);

  const citasActivas = cs.filter((c) =>
    ESTADOS_CITA_ACTIVA.includes(String(c.estado || "").toUpperCase())
  );
  const serviciosActivos = ss.filter((s) =>
    ESTADOS_SERVICIO_ACTIVO.includes(String(s.estado || "PROGRAMADO").toUpperCase())
  );

  /* Mis vehículos */
  const vc = document.getElementById("portal-vehicles");
  if (vc) {
    vc.innerHTML = vs.length
      ? vs.map((v) => `
          <div class="ti">
            <div aria-hidden="true">🚗</div>
            <div>
              <b>${esc(v.placa)}</b>
              <div>${esc([v.marca, v.modelo, v.color].filter(Boolean).join(" · "))}</div>
            </div>
            <a href="vehiculo.html?id=${encodeURIComponent(v.idvehiculo)}" class="btn-sm">Ver</a>
          </div>`).join("")
      : "No tienes vehículos registrados.";
  }

  /* Próximas citas */
  const cc = document.getElementById("portal-citas");
  if (cc) {
    const ordenadas = citasActivas
      .slice()
      .sort((a, b) => `${a.fecha || ""} ${a.hora || ""}`.localeCompare(`${b.fecha || ""} ${b.hora || ""}`));
    cc.innerHTML = ordenadas.length
      ? ordenadas.map((c) => `
          <div class="ti">
            <div aria-hidden="true">📅</div>
            <div>
              <b>${esc(formatDate(c.fecha))}</b>
              <div>${esc(String(c.hora || "").slice(0, 5))} · ${esc(c.estado || "")}</div>
            </div>
          </div>`).join("")
      : "No tienes citas próximas.";
  }

  /* Servicios activos */
  const sc = document.getElementById("portal-servicios");
  if (sc) {
    sc.innerHTML = serviciosActivos.length
      ? serviciosActivos.map((s) => `
          <div class="ti">
            <div aria-hidden="true">🔧</div>
            <div>
              <b>${esc(s.tipo || "Servicio")}</b>
              <div>${esc(s.estado || "PROGRAMADO")} · ${Number(s.progreso ?? 0)}% · ${money(s.precio)}</div>
            </div>
          </div>`).join("")
      : "No tienes servicios activos.";
  }

  /* Historial */
  const hc = document.getElementById("portal-historial");
  if (hc) {
    hc.innerHTML = ss.length
      ? ss.slice()
          .sort((a, b) => String(b.fechaServicio || "").localeCompare(String(a.fechaServicio || "")))
          .map((s) => `<tr>
              <td>${esc(formatDate(s.fechaServicio))}</td>
              <td>${esc(s.vehiculo?.placa || "—")}</td>
              <td>${esc(s.tipo || "—")}</td>
              <td>${esc(s.estado || "—")}</td>
              <td>${money(s.precio)}</td>
            </tr>`).join("")
      : `<tr><td colspan="5">Sin historial de mantenimientos.</td></tr>`;
  }

  /* Facturas */
  const fc = document.getElementById("portal-facturas");
  if (fc) {
    fc.innerHTML = fs.length
      ? fs.map((f) => `<tr>
            <td>${esc(f.numeroFactura || ("JM " + f.idFactura))}</td>
            <td>${esc(formatDate(f.fecha))}</td>
            <td>${esc(f.placa || "—")}</td>
            <td>${money(f.total)}</td>
            <td><button type="button" class="btn-sm-g" data-pdf-invoice="${esc(f.idFactura)}">📄 PDF</button></td>
          </tr>`).join("")
      : `<tr><td colspan="5">Sin facturas registradas.</td></tr>`;
  }

  /* KPIs */
  const kpis = document.querySelectorAll(".kpi .kpi-val");
  kpis[0]?.replaceChildren(document.createTextNode(vs.length));
  kpis[1]?.replaceChildren(document.createTextNode(citasActivas.length));
  kpis[2]?.replaceChildren(document.createTextNode(ss.length));

  pintarResumen(vs.length, citasActivas.length, serviciosActivos.length);
  mostrarError("");
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("es-CO");
}

function money(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(v) || 0);
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

/* Comprobante: facturacion.html ya acepta ?factura=<id>. */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-pdf-invoice]");
  if (b) window.open(`facturacion.html?factura=${encodeURIComponent(b.dataset.pdfInvoice)}`, "_blank");
});

/* Formulario de vehículo */
document.getElementById("add-vehicle-button")?.addEventListener("click", () => {
  document.getElementById("vehicle-form")?.removeAttribute("hidden");
});

document.getElementById("cancel-vehicle-button")?.addEventListener("click", () => {
  document.getElementById("vehicle-form")?.setAttribute("hidden", "");
});

/* Normaliza igual que PlacaUtil en el backend. */
function normalizarPlaca(valor) {
  return String(valor || "").trim().toUpperCase().replace(/\s+/g, "");
}

document.querySelector('#vehicle-form [name="placa"]')?.addEventListener("input", (e) => {
  const normalizada = normalizarPlaca(e.currentTarget.value);
  if (e.currentTarget.value !== normalizada) e.currentTarget.value = normalizada;
});

document.getElementById("vehicle-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const f = new FormData(form);
  const msg = document.getElementById("vehicle-message");

  /* La entidad Vehiculo no tiene columna "año"; solo se envían los
     campos que el backend persiste (placa, marca, modelo, color). */
  const body = {
    placa: normalizarPlaca(f.get("placa")),
    marca: String(f.get("marca") || "").trim(),
    modelo: String(f.get("modelo") || "").trim(),
    color: String(f.get("color") || "").trim() || null
  };

  try {
    if (msg) msg.textContent = "";
    await api("/api/mi/vehiculos", { method: "POST", body: JSON.stringify(body) });
    form.reset();
    form.setAttribute("hidden", "");
    if (msg) msg.textContent = "Vehículo registrado.";
    await loadPortal();
  } catch (err) {
    if (msg) msg.textContent = err.message;
  }
});
