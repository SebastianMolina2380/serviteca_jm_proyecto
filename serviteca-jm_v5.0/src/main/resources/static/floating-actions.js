(() => {
  "use strict";

  const WHATSAPP_NUMBER = "573133096458";
  const MESSAGE = "Hola, necesito información sobre un servicio de Serviteca JM.";

  function addWhatsApp() {
    const existing = document.querySelector('.whatsapp-float, #whatsapp-btn, .btn-whatsapp-float, .wa');
    if (existing) {
      existing.classList.add("whatsapp-float");
      existing.setAttribute("aria-label", "Contactar a Serviteca JM por WhatsApp");
      return;
    }

    const link = document.createElement("a");
    link.className = "whatsapp-float";
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Contactar a Serviteca JM por WhatsApp");
    link.innerHTML = '<span aria-hidden="true">WA</span>';
    document.body.appendChild(link);
  }

  document.addEventListener("DOMContentLoaded", addWhatsApp);
})();
