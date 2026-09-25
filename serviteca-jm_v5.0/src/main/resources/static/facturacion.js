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
            <div>${esc(i.usuario?.nombre || "Cliente")}</div>
            <small>${esc(i.detalles?.map(d => d.nombre).join(", ") || "Servicio automotriz")} · ${dateCO(i.fecha)}</small>
          </div>
          <button type="button" data-id="${esc(i.idFactura)}">Ver</button>
        </article>`).join("")
        : `<div class="empty">No hay facturas registradas.</div>`;
  }

  function renderInvoice(i) {
    const preview = $("invoice-preview");
    if (!preview) return;

    if (!i) {
      preview.innerHTML = '<div class="empty">No se encontró la factura solicitada.</div>';
      return;
    }

    selected = i;
    const subtotal = Number(i.subtotal) || 0;
    const total = Number(i.total) || 0;
    const iva = Math.max(0, total - subtotal);
    const u = i.usuario || {};
    const v = i.cita?.vehiculo || {};

    const details = (i.detalles || []).length
        ? i.detalles.map((d, n) => `
        <tr>
          <td>${n + 1}</td>
          <td>${esc(d.nombre || "Servicio")}</td>
          <td class="right">${esc(d.cantidad ?? 1)}</td>
          <td class="right">${money(d.subtotal ?? d.valor)}</td>
        </tr>`).join("")
        : `<tr><td>1</td><td>Servicio automotriz</td><td class="right">1</td><td class="right">${money(subtotal)}</td></tr>`;

    preview.innerHTML = `
      <div class="invoice-head">
        <img src="/jm-logo.png" alt="Serviteca JM">
        <div class="company">
          <b>JOSE MANUEL QUINTERO BERMAL</b><br>
          NIT 74.248.934-4<br>
          AV CIRCUNVALAR VIA RUNTA ARAUCA<br>
          Tel: (608) 3133096458 · Tunja - Colombia<br>
          jm.serviteca@gmail.com
        </div>
        <div class="invoice-number">
          Factura electrónica de venta<br>
          <strong>${esc(i.numeroFactura || `JM ${i.idFactura}`)}</strong><br>
          <span class="status">GENERADA</span>
        </div>
      </div>
      <div class="info">
        <div>
          <p><b>Cliente:</b> ${esc(u.nombre || "—")}</p>
          <p><b>Documento:</b> ${esc(u.numeroDoc || "—")}</p>
          <p><b>Teléfono:</b> ${esc(u.telefono || "—")}</p>
          <p><b>Dirección:</b> ${esc(u.direccion || "No registrada")}</p>
        </div>
        <div>
          <p><b>Generación:</b> ${esc(dateCO(i.fechaGeneracion || i.fecha))}</p>
          <p><b>Expedición:</b> ${esc(dateCO(i.fecha))}</p>
          <p><b>Medio de pago:</b> ${esc(i.medioPago || "Pendiente")}</p>
          <p><b>Vehículo:</b> ${esc(v.placa || "No registrado")}</p>
        </div>
      </div>
      <table class="invoice-table">
        <thead>
          <tr><th>Ítem</th><th>Descripción</th><th>Cantidad</th><th>Vr. Total</th></tr>
        </thead>
        <tbody>${details}</tbody>
      </table>
      <div class="total-box">
        <div class="totals">
          <div><span>Total bruto</span><span class="right">${money(subtotal)}</span></div>
          <div><span>IVA 19%</span><span class="right">${money(iva)}</span></div>
          <div><span>Total a pagar</span><span class="right">${money(total)}</span></div>
        </div>
      </div>
      <div class="notes">
        <b>Forma de pago:</b> ${esc(i.formaPago || "Contado")} · <b>Medio:</b> ${esc(i.medioPago || "Pendiente")}<br>
        <b>Observaciones:</b> Placa ${esc(v.placa || "No registrada")}<br><br>
        Factura electrónica generada por Serviteca JM. Documento visual optimizado para impresión y PDF.
      </div>`;
  }

  function exportExcel() {
    const rows = [
      ["Factura", "Cliente", "Servicio", "Total", "Medio de pago", "Fecha"],
      ...invoices.map(i => [
        i.numeroFactura || `JM ${i.idFactura}`,
        i.usuario?.nombre || "—",
        i.detalles?.map(d => d.nombre).join(", ") || "Servicio automotriz",
        Number(i.total || 0),
        i.medioPago || "Pendiente",
        i.fecha || ""
      ])
    ];

    const csv = rows.map(r => r.map(val => `"${String(val).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "facturas_serviteca_jm.csv";
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
      if (!selected) return alert("No hay factura seleccionada.");
      window.print();
    });

    $("hamburger")?.addEventListener("click", () => $("sidebar")?.classList.toggle("open"));

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