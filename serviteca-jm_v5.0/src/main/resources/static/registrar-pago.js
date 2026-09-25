(() => {
  "use strict";

  let invoices = [];

  const $ = id => document.getElementById(id);

  const money = value => new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? {"Content-Type":"application/json"} : {}),
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

  async function init() {
    $("today").textContent = new Date().toLocaleDateString("es-CO", {
      weekday:"long", year:"numeric", month:"long", day:"numeric"
    });

    $("hamburger")?.addEventListener("click", () => $("sidebar")?.classList.toggle("open"));

    const data = await request("/api/facturas");
    invoices = Array.isArray(data) ? data : [];

    const select = $("factura");
    const queryId = new URLSearchParams(location.search).get("factura");

    select.innerHTML = `<option value="">Seleccione una factura</option>` +
      invoices.map(invoice => `
        <option value="${esc(invoice.idFactura)}" ${String(invoice.idFactura) === String(queryId) ? "selected" : ""}>
          ${esc(invoice.numeroFactura || `JM ${invoice.idFactura}`)} · ${esc(invoice.usuario?.nombre || "Cliente")} · ${money(invoice.total)}
        </option>
      `).join("");

    select.addEventListener("change", updateSummary);
    $("payment-form").addEventListener("submit", submitPayment);

    if (queryId) updateSummary();
  }

  function selectedInvoice() {
    const id = $("factura").value;
    return invoices.find(invoice => String(invoice.idFactura) === String(id));
  }

  function updateSummary() {
    const invoice = selectedInvoice();
    const summary = $("invoice-summary");

    if (!invoice) {
      summary.innerHTML = "<span>Selecciona una factura.</span>";
      $("monto").value = "";
      return;
    }

    summary.innerHTML = `
      <strong>${esc(invoice.numeroFactura || `JM ${invoice.idFactura}`)}</strong>
      <span>Cliente: ${esc(invoice.usuario?.nombre || "—")}</span>
      <span>Total: ${money(invoice.total)}</span>`;

    $("monto").value = Math.round(Number(invoice.total) || 0);
  }

  async function submitPayment(event) {
    event.preventDefault();
    const message = $("payment-message");
    message.className = "message";
    message.textContent = "";

    const invoice = selectedInvoice();
    const amount = Number($("monto").value);
    const date = $("fecha").value;
    const method = $("metodo").value;
    const notes = $("notas").value.trim();

    if (!invoice) return showError("Selecciona una factura.");
    if (!date) return showError("Selecciona la fecha del pago.");
    if (!Number.isFinite(amount) || amount <= 0) return showError("Ingresa un monto válido.");

    const total = Number(invoice.total) || 0;
    if (Math.abs(amount - total) > 0.01) {
      return showError(`El monto debe coincidir con el total de la factura: ${money(total)}.`);
    }

    try {
      const payload = {
        usuario: { idUsuario: Number(invoice.usuario?.idUsuario) },
        cita: { idCita: Number(invoice.cita?.idCita) },
        subtotal: Number(invoice.subtotal) || Math.round(total / 1.19 * 100) / 100,
        formaPago: "Contado",
        medioPago: method
      };

      await request(`/api/facturas/${encodeURIComponent(invoice.idFactura)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      const localPayments = JSON.parse(localStorage.getItem("jm_pagos") || "{}");
      localPayments[String(invoice.idFactura)] = {
        factura: invoice.idFactura,
        monto: amount,
        metodo: method,
        fecha: date,
        notas,
        registradoEn: new Date().toISOString()
      };
      localStorage.setItem("jm_pagos", JSON.stringify(localPayments));

      message.className = "message ok";
      message.textContent = "Pago registrado y factura actualizada correctamente.";

      window.setTimeout(() => {
        location.href = `facturacion.html?factura=${encodeURIComponent(invoice.idFactura)}`;
      }, 900);
    } catch (error) {
      showError(error.message);
    }

    function showError(text) {
      message.className = "message";
      message.textContent = text;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("fecha").value = new Date().toISOString().slice(0, 10);
    init().catch(error => {
      const message = $("payment-message");
      if (message) message.textContent = error.message;
    });
  });

  window.ServitecaPagos = { init };
})();