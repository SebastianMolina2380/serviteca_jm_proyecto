(() => {
  'use strict';

  // 1. Lectura del usuario (soporta propiedad 'rol' o 'role')
  const user = JSON.parse(localStorage.getItem("servitecaUser") || localStorage.getItem("user") || "null");
  const path = location.pathname.split("/").pop() || "index.html";
  const role = String(user?.rol || user?.role || "").toLowerCase();

  // 2. Control de acceso por página
  const pageAccess = {
    "dashboard.html": ["admin", "tecnico"],
    "clientes.html": ["admin", "tecnico"],
    "citas.html": ["admin", "tecnico", "cliente"],
    "nueva-cita.html": ["admin", "tecnico", "cliente"],
    "vehiculo.html": ["admin", "tecnico", "cliente"],
    "usuarios.html": ["admin"],
    "nuevo-usuario.html": ["admin"],
    "inventario.html": ["admin", "tecnico"],
    "facturacion.html": ["admin", "tecnico"],
    "reportes.html": ["admin", "tecnico"],
    "portal-cliente.html": ["cliente"]
  };

  if (path === "login.html") return;

  // Redirecciona al login si no hay sesión activa
  if (!role) {
    location.href = "login.html";
    return;
  }

  const allowed = pageAccess[path];
  if (allowed && !allowed.includes(role)) {
    location.href = role === "cliente" ? "portal-cliente.html" : "dashboard.html";
    return;
  }

  // 3. Control de visibilidad en el DOM
  document.addEventListener("DOMContentLoaded", () => {
    const permissions = {
      admin: ["dashboard", "clientes", "citas", "nueva-cita", "vehiculo", "usuarios", "nuevo-usuario", "inventario", "facturacion", "reportes",],
      tecnico: ["dashboard", "citas", "nueva-cita", "vehiculo", "inventario", "facturacion", "reportes"],
      cliente: ["citas", "nueva-cita", "vehiculo", "portal-cliente"]
    };

    // Ocultar o mostrar links del sidebar
    document.querySelectorAll(".sb-link[href]").forEach(link => {
      const rawHref = link.getAttribute("href") || "";
      // Limpia la barra inicial '/' y la extensión '.html'
      const target = rawHref.replace(/^\//, "").replace(".html", "");

      if (target && !permissions[role]?.includes(target)) {
        link.style.display = "none";
      } else {
        link.style.display = "flex";
      }
    });

    // Remover elementos restringidos por atributos data-*
    document.querySelectorAll("[data-admin-only]").forEach(el => { if (role !== "admin") el.remove(); });
    document.querySelectorAll("[data-tech-or-admin]").forEach(el => { if (!["admin", "tecnico"].includes(role)) el.remove(); });

    // Cargar datos de usuario en la interfaz (soporta ID o clase)
    const name = document.getElementById("sbname") || document.querySelector(".sb-uname");
    const roleEl = document.getElementById("sbrole") || document.querySelector(".sb-urole");
    const avatar = document.getElementById("sbav") || document.querySelector(".sb-av");

    if (name) name.textContent = user?.nombre || "Usuario";
    if (roleEl) roleEl.textContent = role === "admin" ? "Administrador" : role === "tecnico" ? "Técnico" : "Cliente";
    if (avatar) avatar.textContent = String(user?.nombre || "U").slice(0, 2).toUpperCase();

    // Evento de cierre de sesión
    document.querySelectorAll('.sb-out').forEach(logout => logout.addEventListener('click', async e => {
      e.preventDefault();
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (_) {}
      localStorage.clear();
      location.href = 'login.html';
    }));
  });
})();