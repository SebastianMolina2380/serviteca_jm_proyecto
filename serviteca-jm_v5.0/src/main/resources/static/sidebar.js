/**
 * SERVITECA JM — Sidebar Mobile Toggle
 * Maneja la apertura/cierre del sidebar en dispositivos móviles
 * mediante el botón hamburguesa (#hambtn) y un overlay semitransparente.
 *
 * Incluir este script en todas las páginas del panel (después del body).
 * Requiere: styles.css (clases .sb.open, #sb-overlay)
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const sidebar  = document.querySelector('.sb, .sidebar');
    const hambtn   = document.getElementById('hambtn');

    if (!sidebar || !hambtn) return;

    // Crear overlay si no existe
    let overlay = document.getElementById('sb-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sb-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
    }

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.style.display = 'block';
      hambtn.setAttribute('aria-expanded', 'true');
      hambtn.setAttribute('aria-label', 'Cerrar menú');
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.style.display = 'none';
      hambtn.setAttribute('aria-expanded', 'false');
      hambtn.setAttribute('aria-label', 'Abrir menú');
    }

    function toggleSidebar() {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    }

    hambtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });

    // Cerrar automáticamente al cambiar a vista desktop
    const mq = window.matchMedia('(min-width: 901px)');
    mq.addEventListener('change', function (e) {
      if (e.matches) closeSidebar();
    });

    // Marcar el link activo según la página actual
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sb-link[href]').forEach(function (link) {
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
      }
    });
  });
})();
