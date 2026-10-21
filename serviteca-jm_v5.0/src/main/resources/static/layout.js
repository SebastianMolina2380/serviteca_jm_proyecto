(() => {
  "use strict";

  const buttonSelector = ".hamburger-btn, #sidebarToggle, #menu-toggle, #hambtn, #hamburger, .hamb";
  const sidebarSelector = ".sidebar, .sb";
  const mobileQuery = window.matchMedia("(max-width: 1024px)");

  const styles = document.createElement("style");
  styles.textContent = `
    @media (max-width: 1024px) {
      .sb, .sidebar { position: fixed !important; top: 0; bottom: 0; left: 0; z-index: 1000 !important; transform: translateX(-100%); transition: transform .28s cubic-bezier(.2,.75,.25,1); will-change: transform; }
      .sb.active, .sb.open, .sidebar.active, .sidebar.open { transform: translateX(0); }
      ${buttonSelector} { display: inline-flex !important; align-items: center; justify-content: center; position: relative; z-index: 1001; }
      #sb-overlay, .sidebar-overlay, .menu-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 999; opacity: 0; transition: opacity .2s ease; }
      #sb-overlay.active, #sb-overlay.show, .sidebar-overlay.active, .sidebar-overlay.show, .menu-overlay.active, .menu-overlay.show { display: block; opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) { .sb, .sidebar, #sb-overlay, .sidebar-overlay, .menu-overlay { transition-duration: .01ms !important; } }
  `;
  document.head.append(styles);

  function elements() {
    return {
      button: document.querySelector(buttonSelector),
      sidebar: document.querySelector(sidebarSelector),
      overlay: document.querySelector("#sb-overlay, .sidebar-overlay, .menu-overlay")
    };
  }

  function setOpen(open) {
    const { button, sidebar, overlay } = elements();
    if (!sidebar) return;
    sidebar.classList.toggle("active", open);
    sidebar.classList.toggle("open", open); // compatibilidad con estilos y scripts existentes
    if (overlay) {
      overlay.classList.toggle("active", open);
      overlay.classList.toggle("show", open);
      overlay.setAttribute("aria-hidden", String(!open));
    }
    button?.setAttribute("aria-expanded", String(open));
    button?.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }

  document.addEventListener("click", event => {
    const { button, sidebar } = elements();
    if (!sidebar) return;
    const clickedButton = event.target.closest(buttonSelector);
    if (clickedButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(!(sidebar.classList.contains("active") || sidebar.classList.contains("open")));
      clickedButton.setAttribute("aria-expanded", String(sidebar.classList.contains("active")));
      return;
    }
    if (event.target.closest("#sb-overlay, .sidebar-overlay, .menu-overlay")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
      return;
    }
    if (mobileQuery.matches && (sidebar.classList.contains("active") || sidebar.classList.contains("open"))) {
      if (sidebar.contains(event.target)) {
        if (event.target.closest("a")) setOpen(false);
      } else {
        setOpen(false);
      }
    }
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });

  mobileQuery.addEventListener("change", event => {
    if (!event.matches) setOpen(false);
  });

  document.addEventListener("DOMContentLoaded", () => {
    const { sidebar, overlay } = elements();
    if (sidebar && !overlay) {
      const backdrop = document.createElement("div");
      backdrop.className = "menu-overlay";
      backdrop.setAttribute("aria-hidden", "true");
      document.body.append(backdrop);
    }
  });
})();
