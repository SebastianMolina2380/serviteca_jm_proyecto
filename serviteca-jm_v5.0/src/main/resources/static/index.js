/* ============================================================
   JM SERVITECA · portada (index.html)
   ------------------------------------------------------------
   Contenido ampliado del detalle de servicio.
   Las tarjetas del carrusel (.services-track) declaran en data-* el slug, titulo
   oficial, resumen, precio, icono e imagen. Este objeto aporta
   lo que la tarjeta corta no puede mostrar: descripcion larga,
   listado "que incluye", duracion, especificaciones y el tono
   del poster.
   Si un slug no esta aqui, el modal funciona igualmente con lo
   leido de los data-* (nunca queda roto por anadir una tarjeta).
   ============================================================ */

const SERVICIOS_DETALLE = {
  mantenimiento: {
    kicker: "Mantenimiento",
    duracion: "1 h 30 min",
    tono: "rgba(179,148,93,.40)",
    descripcion:
      "Servicio preventivo pensado para alargar la vida del motor y evitar fallas costosas. " +
      "Trabajamos con aceite sintético del grado que recomienda el fabricante y revisamos el " +
      "conjunto de filtros, encendido y niveles antes de entregar el vehículo.",
    incluye: [
      "Cambio de aceite sintético y filtro de aceite",
      "Reemplazo de filtro de aire y filtro de combustible",
      "Revisión y cambio de bujías cuando aplica",
      "Verificación de niveles: refrigerante, frenos, dirección y limpiaparabrisas",
      "Escaneo básico de fallas y reinicio de indicador de mantenimiento",
      "Lubricación de cerraduras, bisagras y puntos de palanca",
    ],
    specs: [
      ["Frecuencia", "Cada 10.000 km o 6 meses"],
      ["Aceite", "Sintético 5W-30 o el grado del fabricante"],
      ["Incluye", "Mano de obra y desechos"],
      ["Garantía", "3 meses o 5.000 km"],
    ],
  },
  frenos: {
    kicker: "Frenos",
    duracion: "1 h 45 min",
    tono: "rgba(184,74,54,.36)",
    descripcion:
      "El sistema de frenos es lo primero que revisamos con lupa. Medimos el espesor de las " +
      "pastillas y el estado de los discos, purgamos el circuito si hay aire y dejamos el " +
      "pedal firme y el recorrido parejo en las cuatro ruedas.",
    incluye: [
      "Medición de espesor de pastillas y discos delanteros y traseros",
      "Cambio de pastillas y, si aplica, rectificado de discos",
      "Purga y cambio de líquido de frenos",
      "Limpieza y lubricación de rieles y pistones",
      "Calibración de freno de mano",
      "Prueba de freno en pista y verificación de desgaste parejo",
    ],
    specs: [
      ["Pastillas", "Se reemplazan bajo 4 mm de espesor"],
      ["Discos", "Rectificado solo si el diámetro está en tolerancia"],
      ["Líquido", "DOT 4 · cambio cada 2 años"],
      ["Garantía", "6 meses o 10.000 km"],
    ],
  },
  alineacion: {
    kicker: "Alineación",
    duracion: "1 h",
    img: "jm-serviteca-alineacion.jpg",
    tono: "rgba(27,138,46,.34)",
    descripcion:
      "Con alineador 3D leemos los tres ángulos de cada rueda y los comparamos contra las " +
      "medidas del fabricante. Después balanceamos las cuatro llantas y verificamos la " +
      "presión, para que el volante quede centrado y el neumático gaste parejo.",
    incluye: [
      "Lectura 3D de camber, caída y convergencia",
      "Corrección de ángulos en las cuatro ruedas",
      "Balanceo computarizado de las cuatro llantas",
      "Ajuste de presión con nitrógeno",
      "Centrado de volante y revisión de componentes de suspensión",
      "Informe de medición antes y después",
    ],
    specs: [
      ["Equipamiento", "Alineador 3D multimarca"],
      ["Ángulos", "Camber · caída · convergencia"],
      ["Incluye", "Corrección de volante torcido"],
      ["Recomendado", "Cada 20.000 km o al cambiar llantas"],
    ],
  },
  diagnostico: {
    kicker: "Diagnóstico",
    duracion: "45 min",
    tono: "rgba(96,146,192,.34)",
    descripcion:
      "Conectamos el escáner multimarca, leemos los códigos de falla almacenados y los " +
      "contrastamos con pruebas reales sobre el vehículo. Te entregamos un informe claro " +
      "con lo que hay, lo que conviene atender ya y lo que puede esperar.",
    incluye: [
      "Lectura de códigos de falla (DTC) de todos los módulos",
      "Prueba de sensores y actuadores en vivo",
      "Revisión de batería y alternador",
      "Inspección visual de conexiones y cableado",
      "Informe en PDF con hallazgos y prioridades",
      "Borrado de códigos y verificación de testigos",
    ],
    specs: [
      ["Equipo", "Escáner multimarca con actualización"],
      ["Cobertura", "Motor · ABS · airbag · transmisión"],
      ["Entregable", "Informe PDF con hallazgos"],
      ["Tiempo", "45 min aproximados"],
    ],
  },
  electrico: {
    kicker: "Eléctrico",
    duracion: "1 h 20 min",
    tono: "rgba(245,194,0,.30)",
    descripcion:
      "Arranque flojo, luces que titilan o batería que se descarga: medimos la capacidad " +
      "real de la batería, el voltaje de carga del alternador y el estado del motor de " +
      "arranque antes de recomendar cualquier reemplazo.",
    incluye: [
      "Prueba de carga y capacidad de la batería",
      "Medición de voltaje de carga del alternador",
      "Revisión del motor de arranque y solenoide",
      "Limpieza y apriete de bornes y puntos de masa",
      "Inspección de fusibles y cableado principal",
      "Prueba de consumo en reposo (parasitario)",
    ],
    specs: [
      ["Voltaje de carga", "13,8 V a 14,4 V"],
      ["Batería", "Prueba de capacidad con cargador de prueba"],
      ["Consumo en reposo", "Se mide y se reporta"],
      ["Garantía", "3 meses sobre mano de obra"],
    ],
  },
  llantas: {
    kicker: "Llantas",
    duracion: "1 h",
    tono: "rgba(150,150,150,.32)",
    descripcion:
      "Montamos, balanceamos y calibramos con nitrógeno. Revisamos la banda de rodamiento, " +
      "la profundidad de los canales y el desgaste irregular, que casi siempre avisa un " +
      "problema de suspensión o de alineación.",
    incluye: [
      "Montaje de neumáticos con equipo y sin dañar el rín",
      "Parche o reemplazo según el tipo de daño",
      "Balanceo computarizado de las cuatro ruedas",
      "Calibración con nitrógeno",
      "Revisión de profundidad y desgaste de la banda",
      "Rotación de llantas y revisión de válvulas",
    ],
    specs: [
      ["Presión", "Según calcomanía del vehículo"],
      ["Nitrógeno", "Incluido en el servicio"],
      ["Rotación", "Recomendada cada 10.000 km"],
      ["Revisión", "Profundidad mínima legal: 1,6 mm"],
    ],
  },
};

document.addEventListener("DOMContentLoaded", function () {
  const tbdate = document.getElementById("tbdate");
  if (tbdate) {
    tbdate.textContent = new Date().toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const hamb = document.getElementById("hambtn");
  // index.html no tiene sidebar (.sb), por lo que el selector
  // anterior era null y el clic no hacia nada. El desplegable
  // real lo abre la clase .open sobre <nav class="nav">, tal como
  // lo esperan las reglas .nav.open .nav-links de index.css.
  const nav = document.querySelector("nav.nav");
  const sb = document.querySelector(".sb");
  const overlay = document.getElementById("sb-overlay");

  function closeMenu() {
    if (nav) nav.classList.remove("open");
    if (sb) sb.classList.remove("open");
    if (hamb) hamb.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (nav) {
      const open = nav.classList.toggle("open");
      if (hamb) hamb.setAttribute("aria-expanded", String(open));
    }
    // Se conserva por si la pagina llega a incorporar un .sb.
    if (sb) sb.classList.toggle("open");
  }

  if (hamb) {
    hamb.setAttribute("aria-expanded", "false");
    hamb.addEventListener("click", toggleMenu);
  }

  if (overlay) {
    overlay.addEventListener("click", closeMenu);
  }

  // Cerrar el desplegable al elegir cualquier destino.
  if (nav) {
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  // Cerrar con Escape.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  window.closeSb = closeMenu;
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });

  /* ==========================================================
     FORMULARIO DE CONTACTO · POST /api/contacto
     ========================================================== */
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const contactStatus = document.getElementById("contact-status");
    const contactSubmit = document.getElementById("contact-submit");

    function estadoContacto(texto, exito) {
      if (!contactStatus) return;
      contactStatus.textContent = texto;
      contactStatus.style.color = exito ? "#22c55e" : "#ef4444";
    }

    contactForm.addEventListener("submit", async function (evento) {
      evento.preventDefault();

      const nombre = (document.getElementById("contact-name")?.value || "").trim();
      const correo = (document.getElementById("contact-email")?.value || "").trim();
      const telefono = (document.getElementById("contact-phone")?.value || "").trim();
      const mensaje = (document.getElementById("contact-message")?.value || "").trim();

      if (!nombre || !correo || !mensaje) {
        estadoContacto("Completa tu nombre, correo y mensaje.", false);
        return;
      }

      const textoOriginal = contactSubmit ? contactSubmit.textContent : "";
      if (contactSubmit) {
        contactSubmit.disabled = true;
        contactSubmit.textContent = "Enviando…";
      }
      estadoContacto("Enviando mensaje…", true);

      try {
        const respuesta = await fetch("/api/contacto", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ nombre, correo, telefono, mensaje }),
        });
        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) {
          throw new Error(data?.message || data?.error || "No se pudo enviar el mensaje.");
        }
        estadoContacto(data?.mensaje || "Mensaje recibido. Te contactaremos pronto.", true);
        contactForm.reset();
      } catch (e) {
        estadoContacto(e.message || "No se pudo enviar el mensaje. Intenta de nuevo.", false);
      } finally {
        if (contactSubmit) {
          contactSubmit.disabled = false;
          contactSubmit.textContent = textoOriginal || "Enviar mensaje";
        }
      }
    });
  }

  /* ==========================================================
     DETALLE DE SERVICIO · modal
     ========================================================== */

  const sdModal = document.getElementById("sd-modal");
  if (!sdModal) return; // index.html sin el marcado: nada que hacer.

  const sdPanel = sdModal.querySelector(".sd-panel");
  const el = {
    photo: document.getElementById("sd-photo"),
    glyph: document.getElementById("sd-glyph"),
    kicker: document.getElementById("sd-kicker"),
    title: document.getElementById("sd-title"),
    lead: document.getElementById("sd-lead"),
    price: document.getElementById("sd-price"),
    dur: document.getElementById("sd-dur"),
    list: document.getElementById("sd-list"),
    specsWrap: document.getElementById("sd-specs-wrap"),
    specs: document.getElementById("sd-specs"),
    book: document.getElementById("sd-book"),
  };

  let lastFocus = null;
  let abierto = false;

  // "Desde 5.000" -> "Desde $5.000" · "Consultar" -> "Consultar valor"
  function formatearPrecio(txt) {
    const t = (txt || "").trim();
    if (!t) return "Consultar valor";
    if (/\$/.test(t)) return t;
    if (/consultar/i.test(t)) return "Consultar valor";
    return t.replace(/(desde\s*)(\d)/i, "$1$$$2");
  }

  // Igualar "Alineación" y "alineacion" para cruzar con ?servicio=
  function llave(txt) {
    return (txt || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function pintar(card) {
    const slug = card.getAttribute("data-servicio") || "";
    const cfg = SERVICIOS_DETALLE[slug] || {};
    const nombreTarjeta =
      (card.querySelector(".srv-name") || {}).textContent || "";
    const descTarjeta =
      (card.querySelector(".srv-desc") || {}).textContent || "";
    const precioTarjeta =
      (card.querySelector(".srv-price") || {}).textContent || "";
    const icoTarjeta =
      (card.querySelector(".srv-ico") || {}).textContent || "";

    const titulo =
      card.getAttribute("data-titulo") || nombreTarjeta.trim();
    const resumen =
      card.getAttribute("data-desc") || descTarjeta.trim();
    const precio =
      card.getAttribute("data-precio") || precioTarjeta.trim();
    const glyph = card.getAttribute("data-ico") || icoTarjeta;

    // Tono del poster (gradiente generado cuando no hay foto)
    sdPanel.style.setProperty("--sd-tone", cfg.tono || "rgba(179,148,93,.40)");

    // Foto real si existe; si no, se oculta y queda el poster.
    const foto = card.getAttribute("data-img") || cfg.img || "";
    if (foto) {
      el.photo.src = foto;
      el.photo.alt = "Imagen del servicio " + titulo;
      el.photo.hidden = false;
    } else {
      el.photo.removeAttribute("src");
      el.photo.alt = "";
      el.photo.hidden = true;
    }

    el.glyph.textContent = glyph;
    el.kicker.textContent = cfg.kicker || nombreTarjeta.trim() || "Servicio";
    el.title.textContent = titulo;
    el.lead.textContent = resumen;
    el.price.textContent = formatearPrecio(precio);
    el.dur.textContent = cfg.duracion || "Según diagnóstico";

    // Descripcion completa: se inserta despues del resumen corto.
    const largo = sdModal.querySelector(".sd-long");
    if (largo) largo.remove();
    if (cfg.descripcion) {
      const p = document.createElement("p");
      p.className = "sd-long";
      p.textContent = cfg.descripcion;
      el.lead.insertAdjacentElement("afterend", p);
    }

    // "Que incluye"
    el.list.innerHTML = "";
    (cfg.incluye || []).forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      el.list.appendChild(li);
    });
    el.list.hidden = el.list.children.length === 0;

    // Especificaciones (dt/dd)
    el.specs.innerHTML = "";
    (cfg.specs || []).forEach(function (par) {
      const dt = document.createElement("dt");
      dt.textContent = par[0];
      const dd = document.createElement("dd");
      dd.textContent = par[1];
      el.specs.appendChild(dt);
      el.specs.appendChild(dd);
    });
    el.specsWrap.hidden = el.specs.children.length === 0;

    // "Agendar Cita" arrastra el servicio a nueva-cita.html.
    // El destino espera el nombre corto del chip (Frenos,
    // Alineación, Mantenimiento...), asi que se usa el texto de
    // la tarjeta y no el titulo oficial.
    const chip = nombreTarjeta.trim() || titulo;
    el.book.href =
      "nueva-cita.html?servicio=" + encodeURIComponent(chip);

    sdPanel.scrollTop = 0;
  }

  function sincronizarURL(slug, quitar) {
    // replaceState evita crear historial por cada apertura y no
    // recarga la pagina. Se protege por si se abre via file://.
    try {
      const u = new URL(window.location.href);
      if (quitar) u.searchParams.delete("servicio");
      else if (slug) u.searchParams.set("servicio", slug);
      else return;
      window.history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e) {
      /* entorno sin history API: el modal sigue funcionando */
    }
  }

  function abrirDetalle(card) {
    if (!card) return;
    pintar(card);
    lastFocus = document.activeElement;
    sdModal.hidden = false;
    abierto = true;
    document.body.classList.add("sd-open");
    const cerrar = sdModal.querySelector(".sd-close");
    if (cerrar) cerrar.focus();
    sincronizarURL(card.getAttribute("data-servicio"), false);
  }

  function cerrarDetalle() {
    if (!abierto) return;
    sdModal.hidden = true;
    abierto = false;
    document.body.classList.remove("sd-open");
    sincronizarURL(null, true);
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  // Delegacion: funciona tambien con tarjetas anadidas despues.
  // El contenedor es ahora la pista del carrusel (.srv-grid dejo de
  // existir); si no se encuentra, no hay carrusel que gobernar.
  const track = document.querySelector(".services-track");
  if (track) {
    track.addEventListener("click", function (e) {
      // "Solicitar" sigue yendo a login.html sin abrir el detalle.
      // "Ver detalle" (.srv-more) si lo abre: su clic burbujea hasta
      // aqui y no casa con .srv-btn, por lo que llega a abrirDetalle.
      if (e.target.closest(".srv-btn")) return;
      const card = e.target.closest(".srv");
      if (card) abrirDetalle(card);
    });

    track.addEventListener("keydown", function (e) {
      const card = e.target.closest(".srv");
      if (!card || e.target !== card) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        abrirDetalle(card);
      }
    });

    /* ── Flechas del carrusel ──
       El paso se mide del ancho real de la tarjeta mas su
       separacion, de modo que cada clic avance exactamente una
       tarjeta en cualquier breakpoint. 380px era el valor fijo de
       referencia (320 de tarjeta + 18 de separacion + margen) y se
       conserva como respaldo por si no se puede medir. */
    function pasoCarrusel() {
      const card = track.querySelector(".srv");
      if (!card) return 380;
      const cs = window.getComputedStyle(track);
      const gap = parseFloat(cs.columnGap || cs.gap) || 0;
      const ancho = card.getBoundingClientRect().width || 0;
      return ancho + gap || 380;
    }

    const btnPrev = document.querySelector(".slider-btn-prev");
    const btnNext = document.querySelector(".slider-btn-next");

    function moverCarrusel(dir) {
      track.scrollBy({ left: dir * pasoCarrusel(), behavior: "smooth" });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        moverCarrusel(-1);
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", function () {
        moverCarrusel(1);
      });
    }

    // En los extremos la flecha correspondiente se apaga.
    function actualizarFlechas() {
      const tope = track.scrollWidth - track.clientWidth - 2;
      if (btnPrev) btnPrev.disabled = track.scrollLeft <= 2;
      if (btnNext) btnNext.disabled = track.scrollLeft >= tope;
    }
    track.addEventListener("scroll", actualizarFlechas, { passive: true });
    window.addEventListener("resize", actualizarFlechas);
    actualizarFlechas();

    // Enfoque central: resalta la tarjeta visible. El CSS solo lo
    // aplica por debajo de 900px, donde entra una o dos tarjetas.
    if ("IntersectionObserver" in window) {
      const observador = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (entrada) {
            entrada.target.classList.toggle("is-active", entrada.isIntersecting);
          });
        },
        { root: track, threshold: 0.7 }
      );
      track.querySelectorAll(".srv").forEach(function (c) {
        observador.observe(c);
      });
    }
  }

  // Cierre: botón ✕, fondo y "Volver al inicio".
  sdModal.addEventListener("click", function (e) {
    if (e.target.closest("[data-sd-close]")) cerrarDetalle();
  });

  document.addEventListener("keydown", function (e) {
    if (!abierto) return;

    if (e.key === "Escape") {
      e.preventDefault();
      cerrarDetalle();
      return;
    }

    // Foco atrapado dentro del dialogo mientras esta abierto.
    if (e.key === "Tab") {
      const foco = sdPanel.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!foco.length) return;
      const primero = foco[0];
      const ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      } else if (!sdPanel.contains(document.activeElement)) {
        e.preventDefault();
        primero.focus();
      }
    }
  });

  // Enlace directo: index.html?servicio=frenos
  try {
    const param = new URLSearchParams(window.location.search).get("servicio");
    if (param) {
      const k = llave(param);
      const card = Array.prototype.find.call(
        document.querySelectorAll(".srv"),
        function (c) {
          return (
            llave(c.getAttribute("data-servicio")) === k ||
            llave(c.querySelector(".srv-name") ? c.querySelector(".srv-name").textContent : "") === k
          );
        }
      );
      if (card) abrirDetalle(card);
    }
  } catch (e) {
    /* sin search: nada */
  }
});
