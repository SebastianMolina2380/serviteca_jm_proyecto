(() => {
  "use strict";

  let invoices = [];
  let selected = null;

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));

  const money = v => new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(v) || 0);

  const dateCO = v => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("es-CO");
  };

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}

    if (response.status === 401) {
      location.href = "login.html";
      throw new Error("Sesión expirada.");
    }

    if (!response.ok) throw new Error(data?.error || `Error HTTP ${response.status}`);
    return data;
  }

  function renderKPIs() {
    const total = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const kpis = document.querySelectorAll(".kpi-val");

    if (kpis[0]) kpis[0].textContent = money(total);
    if (kpis[1]) kpis[1].textContent = String(invoices.length);
    if (kpis[2]) kpis[2].textContent = money(invoices.length ? total / invoices.length : 0);
  }

  function renderList() {
    const box = $("invoice-list");
    if (!box) return;

    box.innerHTML = invoices.length
        ? invoices.map(i => `
        <article class="invoice-item">
          <div>
            <strong>${esc(i.numeroFactura || `JM ${i.idFactura}`)}</strong>
            <div>${esc(i.adquirente?.razonSocial || "Cliente")}</div>
            <small>${esc(i.detalles?.map(d => d.descripcion).join(", ") || "Servicio automotriz")} · ${dateCO(i.fechaGeneracion)}</small>
          </div>
          <button type="button" data-id="${esc(i.idFactura)}">Ver</button>
        </article>`).join("")
        : `<div class="empty">No hay documentos registrados.</div>`;
  }

  function renderInvoice(i) {
    const preview = $("invoice-preview");
    if (!preview) return;

    if (!i) {
      preview.innerHTML = '<div class="empty">No se encontró el documento solicitado.</div>';
      return;
    }

    selected = i;
    const subtotal = Number(i.subtotal) || 0;
    const total = Number(i.total) || 0;
    const u = i.adquirente || {};
    const emisor = i.emisor || {};

    const details = (i.detalles || []).length
        ? i.detalles.map((d, n) => `
        <tr>
          <td>${n + 1}</td>
          <td>${esc(d.descripcion || "Servicio")}<br><small>${esc(d.codigo || "")} · ${esc(d.unidadMedida || "")}</small></td>
          <td class="right">${esc(d.cantidad ?? 1)}</td>
          <td class="right">${money(d.valorUnitario)}</td>
          <td class="right">${money(d.base)}</td>
          <td class="right">${esc(d.tarifaIva)}%</td>
          <td class="right">${money(d.iva)}</td>
          <td class="right">${money(d.total)}</td>
        </tr>`).join("")
        : `<tr><td>1</td><td>Servicio automotriz</td><td class="right">1</td><td class="right">${money(subtotal)}</td><td class="right">${money(subtotal)}</td><td class="right">—</td><td class="right">${money(i.ivaTotal)}</td><td class="right">${money(total)}</td></tr>`;

    preview.innerHTML = `
      <div class="invoice-head">
        <img src="/jm-logo.png" alt="Serviteca JM">
        <div class="company">
          <b>${esc(emisor.razonSocial || "Emisor sin configurar")}</b><br>
          NIT ${esc(emisor.numeroDocumento || "Pendiente de configurar")}<br>
          ${esc(emisor.direccion || "Dirección pendiente de configurar")}<br>
          Tel: ${esc(emisor.telefono || "—")} · ${esc(emisor.ciudad || "")}<br>
          ${esc(emisor.correo || "")}
        </div>
        <div class="invoice-number">
          Documento de venta<br>
          <strong>${esc(i.numeroFactura || "Sin numerar")}</strong><br>
          Prefijo: ${esc(i.prefijo || "—")}<br>
          <span class="status">Documento comercial</span>
        </div>
      </div>
      <div class="info">
        <div>
          <p><b>Adquirente:</b> ${esc(u.razonSocial || "—")}</p>
          <p><b>Documento:</b> ${esc(u.tipoDocumento || "")} ${esc(u.numeroDocumento || "—")}</p>
          <p><b>Teléfono:</b> ${esc(u.telefono || "—")}</p>
          <p><b>Dirección:</b> ${esc(u.direccion || "—")}</p>
          <p><b>Ciudad:</b> ${esc(u.ciudad || "—")}</p>
        </div>
        <div>
          <p><b>Generación:</b> ${esc(dateCO(i.fechaGeneracion || i.fecha))}</p>
          <p><b>Fecha de expedición:</b> ${esc(i.fechaExpedicion ? dateCO(i.fechaExpedicion) : dateCO(i.fechaGeneracion || i.fecha))}</p>
          <p><b>Forma de pago:</b> ${esc(i.formaPago)} ${i.plazoDias ? `· Plazo ${esc(i.plazoDias)} días` : ""}</p>
          <p><b>Medio de pago:</b> ${esc(i.medioPago || "—")}</p>
          <p><b>Responsabilidades fiscales emisor:</b> ${esc(i.responsabilidadesFiscales || "Por configurar")}</p>
          <p><b>Estado del pago:</b> ${esc(i.estadoPago || "PENDIENTE")}</p>
        </div>
      </div>
      <table class="invoice-table">
        <thead>
          <tr><th>Ítem</th><th>Descripción</th><th>Cant.</th><th>Vr. unitario</th><th>Base</th><th>IVA</th><th>Valor IVA</th><th>Total</th></tr>
        </thead>
        <tbody>${details}</tbody>
      </table>
      <div class="total-box">
        <div class="totals">
          <div><span>Total bruto</span><span class="right">${money(subtotal)}</span></div>
          ${(i.ivaDiscriminado || []).map(t => `<div><span>IVA ${esc(t.tarifa)}% · base ${money(t.base)}</span><span class="right">${money(t.valor)}</span></div>`).join("")}
          <div><span>Pagado</span><span class="right">${money(i.pagado)}</span></div>
          <div><span>Saldo pendiente</span><span class="right">${money(i.saldoPendiente)}</span></div>
          <div><span>Total a pagar</span><span class="right">${money(total)}</span></div>
        </div>
      </div>
      <div class="notes">
        <b>Responsabilidades fiscales:</b> ${esc(i.responsabilidadesFiscales || "Por configurar")}<br>
        <b>Software:</b> ${esc(i.software?.nombre || "Serviteca JM")} · ${esc(i.software?.fabricante || "")} · NIT ${esc(i.software?.nitFabricante || "—")}<br><br>
        <strong>Documento de venta comercial.</strong> Comprobante interno de Serviteca JM.
        No constituye factura electrónica ni un documento fiscal validado por la DIAN.
      </div>`;
  }

  function exportExcel() {
    const rows = [
      ["Documento", "Cliente", "Servicio", "Total", "Medio de pago", "Fecha"],
      ...invoices.map(i => [
        i.numeroFactura || `JM ${i.idFactura}`,
        i.adquirente?.razonSocial || "—",
        i.detalles?.map(d => d.descripcion).join(", ") || "Servicio automotriz",
        Number(i.total || 0),
        i.medioPago || "Pendiente",
        i.fecha || ""
      ])
    ];

    const csv = rows.map(r => r.map(val => `"${String(val).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "documentos_venta_serviteca_jm.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function init() {
    await api("/api/auth/me");
    invoices = (await api("/api/facturas")) || [];
    renderKPIs();
    renderList();

    const paramId = new URLSearchParams(location.search).get("factura");
    const target = paramId ? invoices.find(x => String(x.idFactura) === String(paramId)) : invoices[0];
    renderInvoice(target);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("invoice-list")?.addEventListener("click", e => {
      const btn = e.target.closest("[data-id]");
      if (btn) {
        const item = invoices.find(x => String(x.idFactura) === String(btn.dataset.id));
        renderInvoice(item);
        history.replaceState(null, "", `?factura=${encodeURIComponent(btn.dataset.id)}`);
      }
    });

    $("print")?.addEventListener("click", () => {
      if (!selected) return alert("No hay documento seleccionado.");
      window.print();
    });

    $("export-excel")?.addEventListener("click", exportExcel);

    $("register-payment")?.addEventListener("click", () => {
      location.href = selected ? `registrar-pago.html?factura=${selected.idFactura}` : "registrar-pago.html";
    });

    if ($("today")) {
      $("today").textContent = new Date().toLocaleDateString("es-CO", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    init().catch(e => {
      const preview = $("invoice-preview");
      if (preview) preview.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    });
  });

  window.ServitecaFacturacion = {
    reload: init,
    getFacturas: () => [...invoices],
    renderInvoice
  };
})();
