/* ============================================================
   INVENTARIO · listado, stock y modal de "Registrar entrada"
   ------------------------------------------------------------
   El backend solo persiste: nombre, cantidad, precioUnit y la
   referencia producto.idProducto (ver Inventario.java). NO existe
   columna para stockMinimo ni para unidad, asi que esos dos
   valores se guardan en localStorage (INV_META) y se leen al
   pintar la tabla.

   producto no puede ser null ni transitorio: probado contra
   /api/inventarios, ambos casos devuelven 409. Por eso la
   categoria se elige siempre entre productos existentes.
   ============================================================ */

const inventarioToken = localStorage.getItem("servitecaToken");
const inventarioUser = JSON.parse(localStorage.getItem("servitecaUser") || "null");

let inventarioData = [];
const MIN_STOCK = 5;

/* Metadatos que la BD no puede guardar: {idInventario: {stockMinimo, unidad}} */
const INV_META_KEY = "servitecaInvMeta";
let invMeta = {};
try { invMeta = JSON.parse(localStorage.getItem(INV_META_KEY) || "{}") || {}; } catch (e) { invMeta = {}; }
function guardarMeta() { localStorage.setItem(INV_META_KEY, JSON.stringify(invMeta)); }

/* El backend guarda ADMIN/TECNICO en mayusculas. Comparar contra
   'admin' en minusculas nunca coincidia, asi que el boton de
   borrado no aparecia y deleteStock era un no-op. */
function invRol() { return String(inventarioUser?.rol || "").trim().toLowerCase(); }

function inventoryHeaders() { return { "Content-Type": "application/json" }; }

/* ------------------------------------------------------------
   RENDER
   ------------------------------------------------------------ */
function renderInventario() {
  const lowStock = inventarioData.filter((i) => Number(i.cantidad || 0) <= MIN_STOCK);

  /* La alerta conserva su id (#inv-alerta); el selector anterior
     buscaba un div por un style inline, que se rompia al
     reescribirse el contenido. */
  const warning = document.getElementById("inv-alerta");
  if (warning) {
    warning.innerHTML = lowStock.length
      ? `⚠️ <strong>${lowStock.length} repuestos</strong> están por debajo del stock mínimo (${MIN_STOCK}). Realiza el pedido pronto.`
      : `✅ No hay repuestos por debajo del stock mínimo (${MIN_STOCK}).`;
    warning.style.color = lowStock.length ? "var(--red)" : "var(--green)";
    warning.style.borderColor = lowStock.length ? "var(--red)" : "var(--green)";
    warning.style.background = lowStock.length
      ? "rgba(239, 68, 68, 0.08)"
      : "rgba(34, 197, 94, 0.08)";
  }

  const fmtCOP = new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  });

  document.getElementById("tbody-inventario").innerHTML = inventarioData.length
    ? inventarioData.map((item) => {
        const meta = invMeta[item.idInventario] || {};
        const minimo = meta.stockMinimo != null ? Number(meta.stockMinimo) : MIN_STOCK;
        const unidad = meta.unidad || "";
        const low = Number(item.cantidad || 0) <= minimo;
        const name = item.nombre || item.producto?.nombreProducto || "Producto";
        const cat = item.producto?.descripcionProducto || "Repuesto";
        const price = item.precioUnit ?? item.producto?.precioProducto ?? 0;
        const catConUnidad = unidad
          ? `${cat} <span style="opacity:.65;font-size:.78em">· ${unidad}</span>`
          : cat;

        return `<tr>
          <td${low ? ' style="color:var(--red);font-weight:700"' : ""}>${name}</td>
          <td>${catConUnidad}</td>
          <td${low ? ' style="color:var(--red);font-weight:700"' : ""}>${item.cantidad || 0}</td>
          <td>${minimo}</td>
          <td>${fmtCOP.format(Number(price) || 0)}</td>
          <td><span class="badge ${low ? "br" : "bg"}">${low ? "⚠️ Bajo" : "OK"}</span></td>
          <td style="display:flex;gap:5px">
            <button type="button" class="btn-sm-g" data-stock-id="${item.idInventario}" data-stock-change="1">+ Entrada</button>
            <button type="button" class="btn-sm-g" data-stock-id="${item.idInventario}" data-stock-change="-1">- Salida</button>
            ${invRol() === "admin" ? `<button type="button" class="btn-sm-g" data-delete-stock="${item.idInventario}" aria-label="Eliminar">🗑</button>` : ""}
          </td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="7" style="text-align:center;padding:26px;color:var(--gray1)">No hay inventario registrado.</td></tr>`;
}

/* ------------------------------------------------------------
   CARGA Y MOVIMIENTOS DE STOCK
   ------------------------------------------------------------ */
async function loadInventario() {
  if (!inventarioToken) { location.href = "login.html"; return; }
  const response = await fetch("/api/inventarios", { headers: inventoryHeaders(), credentials: "same-origin" });
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(data?.error || "No se pudo cargar el inventario.");
  inventarioData = Array.isArray(data) ? data : [];
  renderInventario();
}

async function updateStock(id, change) {
  const item = inventarioData.find((x) => x.idInventario === Number(id));
  if (!item) return;
  const quantity = Math.max(0, Number(item.cantidad || 0) + Number(change));
  const response = await fetch(`/api/inventarios/${id}`, {
    method: "PUT",
    headers: inventoryHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({
      cantidad: quantity,
      nombre: item.nombre,
      precioUnit: item.precioUnit,
      producto: item.producto,
    }),
  });
  if (!response.ok) throw new Error((await response.text()) || "No se pudo actualizar el stock.");
  await loadInventario();
}

async function deleteStock(id) {
  if (invRol() !== "admin") return;
  if (!confirm("¿Eliminar este repuesto?")) return;
  const response = await fetch(`/api/inventarios/${id}`, { method: "DELETE", credentials: "same-origin" });
  if (!response.ok) throw new Error("No se pudo eliminar el repuesto.");
  delete invMeta[id]; guardarMeta();
  await loadInventario();
}

/* ------------------------------------------------------------
   MODAL · REGISTRAR ENTRADA
   ------------------------------------------------------------ */
const invModal = document.getElementById("inv-modal");
const invForm = document.getElementById("inv-form");
const invSelectCat = document.getElementById("inv-cat");
const invSubmit = document.getElementById("inv-submit");
let invFocoPrevio = null;

/* Categorias reales del catalogo, deduplicadas por descripcion. */
let invCats = [];
async function cargarCategorias() {
  if (!invSelectCat) return;
  try {
    const r = await fetch("/api/productos/catalogo", { headers: inventoryHeaders(), credentials: "same-origin" });
    const data = await r.json().catch(() => []);
    if (!r.ok || !Array.isArray(data)) return;
    const visto = new Set();
    invCats = data
      .filter((p) => p && p.idProducto != null)
      .filter((p) => {
        const d = String(p.descripcionProducto || p.nombreProducto || "").trim();
        if (!d || visto.has(d)) return false;
        visto.add(d); return true;
      })
      .map((p) => ({
        id: Number(p.idProducto),
        nombre: String(p.descripcionProducto || p.nombreProducto).trim(),
      }));
    /* Se conserva la opcion vacia inicial. */
    invSelectCat.querySelectorAll("option:not([value=''])").forEach((o) => o.remove());
    invCats.forEach((c) => {
      const o = document.createElement("option");
      o.value = String(c.id);
      o.textContent = c.nombre;
      invSelectCat.appendChild(o);
    });
  } catch (e) {
    /* Sin catalogo la categoria queda libre para elegir manualmente. */
  }
}

function abrirModal() {
  if (!invModal) return;
  invFocoPrevio = document.activeElement;
  invModal.hidden = false;
  document.body.style.overflow = "hidden";
  const primero = document.getElementById("inv-nombre");
  if (primero) primero.focus();
}

function cerrarModal() {
  if (!invModal || invModal.hidden) return;
  invModal.hidden = true;
  document.body.style.overflow = "";
  if (invForm) invForm.reset();
  document.querySelectorAll(".inv-err").forEach((p) => { p.textContent = ""; });
  if (invFocoPrevio && typeof invFocoPrevio.focus === "function") invFocoPrevio.focus();
}

function marcarError(id, msg) {
  const p = document.querySelector(`[data-err-for="${id}"]`);
  if (p) p.textContent = msg || "";
  const campo = document.getElementById(id);
  if (campo) campo.style.borderColor = msg ? "var(--red)" : "";
}

/* Validacion del formulario con mensajes institucionales. */
function validarInv() {
  const nombre = document.getElementById("inv-nombre").value.trim();
  const cat = document.getElementById("inv-cat").value;
  const stock = document.getElementById("inv-stock").value;
  const min = document.getElementById("inv-min").value;
  const unidad = document.getElementById("inv-unidad").value.trim();
  const precio = document.getElementById("inv-precio").value;
  let ok = true;

  marcarError("inv-nombre", "");
  marcarError("inv-cat", "");
  marcarError("inv-stock", "");
  marcarError("inv-min", "");
  marcarError("inv-unidad", "");
  marcarError("inv-precio", "");

  if (!nombre) { marcarError("inv-nombre", "Indica el nombre del repuesto."); ok = false; }
  if (cat === "") { marcarError("inv-cat", "Selecciona una categoría."); ok = false; }
  if (stock === "" || Number(stock) < 0 || !Number.isInteger(Number(stock))) {
    marcarError("inv-stock", "Ingresa un stock inicial entero y positivo."); ok = false;
  }
  if (min === "" || Number(min) < 0 || !Number.isInteger(Number(min))) {
    marcarError("inv-min", "Ingresa un stock mínimo entero y positivo."); ok = false;
  }
  if (!unidad) { marcarError("inv-unidad", "Indica la unidad de medida."); ok = false; }
  if (precio === "" || Number(precio) < 0) {
    marcarError("inv-precio", "Ingresa un precio unitario válido."); ok = false;
  }

  if (!ok) {
    const primerError = document.querySelector(".inv-err:not(:empty)");
    if (primerError) {
      const campo = primerError.parentElement.querySelector(".fc");
      if (campo) campo.focus();
    }
  }
  return ok ? { nombre, cat: Number(cat), stock: Number(stock), min: Number(min), unidad, precio: Number(precio) } : null;
}

async function enviarInventario(e) {
  e.preventDefault();
  if (invSubmit) invSubmit.disabled = true;
  try {
    const v = validarInv();
    if (!v) return;

    /* producto.idProducto es obligatorio: un objeto sin id (o null)
       hace que JPA falle al persistir la entidad transitoria. */
    const r = await fetch("/api/inventarios", {
      method: "POST",
      headers: inventoryHeaders(),
      credentials: "same-origin",
      body: JSON.stringify({
        nombre: v.nombre,
        cantidad: v.stock,
        precioUnit: v.precio,
        producto: { idProducto: v.cat },
      }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) {
      throw new Error(data?.message || data?.error || "No se pudo registrar el repuesto.");
    }

    /* Guarda lo que la BD no puede: stock mínimo y unidad. */
    if (data && data.idInventario != null) {
      invMeta[data.idInventario] = { stockMinimo: v.min, unidad: v.unidad };
      guardarMeta();
    }

    cerrarModal();
    await loadInventario();
  } catch (err) {
    alert(err.message);
  } finally {
    if (invSubmit) invSubmit.disabled = false;
  }
}

/* ------------------------------------------------------------
   EVENTOS
   ------------------------------------------------------------ */
document.addEventListener("click", (e) => {
  const s = e.target.closest("[data-stock-id]");
  const d = e.target.closest("[data-delete-stock]");
  const c = e.target.closest("[data-inv-close]");
  const abrir = e.target.closest("#btn-entrada");

  if (abrir) { abrirModal(); return; }
  if (c) { cerrarModal(); return; }
  if (s) updateStock(s.dataset.stockId, s.dataset.stockChange).catch((x) => alert(x.message));
  if (d) deleteStock(d.dataset.deleteStock).catch((x) => alert(x.message));
});

/* Escape cierra; Tab queda atrapado dentro del dialogo (aria-modal). */
document.addEventListener("keydown", (e) => {
  if (!invModal || invModal.hidden) return;
  if (e.key === "Escape") { e.preventDefault(); cerrarModal(); return; }
  if (e.key !== "Tab") return;

  const foco = invModal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!foco.length) return;
  const primero = foco[0];
  const ultimo = foco[foco.length - 1];

  if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
});

if (invForm) invForm.addEventListener("submit", enviarInventario);

document.addEventListener("DOMContentLoaded", () => {
  loadInventario().catch((e) => alert(e.message));
  cargarCategorias().catch(() => {});
});
