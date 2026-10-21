(() => {
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     ASESOR VIRTUAL · SERVITECA JM
     ------------------------------------------------------------
     Asistente conversacional que orienta sobre los servicios del
     taller y guía hacia el agendamiento de citas.

     Estructura:
       1. SHOP        datos de contacto verificados en index.html
       2. EXTRAS      duración, "qué incluye" y palabras clave
       3. CATALOGO    se construye leyendo las tarjetas .srv del
                      propio DOM, de modo que nombre, resumen y
                      precio son la misma fuente que ve el usuario
                      (sin duplicarlos aquí)
       4. Intención   normalización + coincidencia por palabra
       5. UI          panel, burbujas y barra de respuestas rápidas
     ══════════════════════════════════════════════════════════════ */

  /* 1 · Datos del taller — tomados literalmente del pie de contacto
        de index.html para que chat y página nunca contradigan. */
  const SHOP = {
    nombre: "Serviteca JM",
    direccion: "Villapinzón-Tunja, Tunja, Boyacá (código plus GJ8W+8W)",
    telefono: "+57 313 309 6458",
    whatsapp: "https://wa.me/573133096458",
    correo: "jm.serviteca@gmail.com",
    horario: "Lunes a sábado, de 7:00 AM a 6:00 PM",
    atencion:
      "Atendemos con cita previa y también sin cita, sujeto a disponibilidad."
  };

  /* 2 · Lo que el DOM no puede dar: tiempos, contenido del servicio
        y vocabulario del usuario para cada tema. */
  const EXTRAS = {
    mantenimiento: {
      duracion: "1 h 30 min",
      claves: ["mantenimiento", "aceite", "filtro", "filtros", "bujia",
        "bujias", "lubricante", "preventivo", "sintetico", "nivel",
        "motor", "service"],
      incluye: [
        "Cambio de aceite sintético y filtro de aceite",
        "Filtros de aire y de combustible",
        "Revisión de bujías, niveles y refrigerante",
        "Escaneo de fallas e reinicio del indicador de mantenimiento"
      ],
      sintoma:
        "Para orientarte bien dime qué notas: consumo excesivo de aceite, humo, ruido en la parte superior del motor o simplemente que llegó el kilometraje del service."
    },
    frenos: {
      duracion: "1 h 45 min",
      claves: ["freno", "frenos", "pastilla", "pastillas", "disco", "discos",
        "chillido", "pedal", "frenar", "frenado", "calibracion",
        "distancia"],
      incluye: [
        "Medición de espesor de pastillas y discos",
        "Cambio de pastillas y rectificado de discos si aplica",
        "Purga y cambio de líquido de frenos",
        "Calibración del freno de mano"
      ],
      sintoma:
        "Si el pedal se siente esponjoso, hay vibración al frenar, escuchas chillido o el carro se desvía, conviene revisarlo pronto: son señales de desgaste de pastillas, discos o aire en el circuito."
    },
    alineacion: {
      duracion: "1 h",
      claves: ["alineacion", "alinear", "balanceo", "balancear", "volante",
        "camber", "caida", "convergencia", "desgaste irregular",
        "torcido", "tirando"],
      incluye: [
        "Lectura 3D de camber, caída y convergencia",
        "Corrección de ángulos en las cuatro ruedas",
        "Balanceo computarizado",
        "Calibración de presión con nitrógeno"
      ],
      sintoma:
        "Si el vehículo tira hacia un lado, el volante queda torcido estando recto o las llantas gastan más por un borde, es momento de alinear y balancear."
    },
    diagnostico: {
      duracion: "45 min",
      claves: ["diagnostico", "diagnosticar", "scanner", "escaner", "obd",
        "codigo", "codigos", "falla", "check engine", "testigo",
        "luz de motor", "bobina"],
      incluye: [
        "Lectura de códigos de falla de todos los módulos",
        "Prueba de sensores y actuadores en vivo",
        "Revisión de batería y alternador",
        "Informe en PDF con hallazgos y prioridades"
      ],
      sintoma:
        "Un código de falla orienta la inspección, pero no siempre indica la causa por sí solo. Lleva el vehículo y, si puedes, anota desde cuándo aparece y si es intermitente."
    },
    electrico: {
      duracion: "1 h 20 min",
      claves: ["electrico", "electricidad", "bateria", "alternador",
        "arranque", "no enciende", "no prende", "luces", "borne",
        "bornes", "fusible", "cortocircuito"],
      incluye: [
        "Prueba de carga y capacidad de la batería",
        "Medición de voltaje de carga del alternador",
        "Revisión del motor de arranque y solenoide",
        "Limpieza y apriete de bornes y puntos de masa"
      ],
      sintoma:
        "Si arranca lento, las luces se atenúan al dar marcha o la batería se descarga seguido, lo primero es medir batería y alternador antes de cambiar componentes."
    },
    llantas: {
      duracion: "1 h",
      claves: ["llanta", "llantas", "neumatico", "neumaticos", "nitrogeno",
        "presion", "montaje", "parche", "pinchazo", "rotacion",
        "desgaste", "banda"],
      incluye: [
        "Montaje de neumáticos con equipo adecuado",
        "Parche o reemplazo según el tipo de daño",
        "Balanceo computarizado",
        "Calibración con nitrógeno y revisión de desgaste"
      ],
      sintoma:
        "Si perdiste presión, hay un pinchazo, sientes vibración al acelerar o la banda de rodamiento está gastada, revisemos las llantas."
    }
  };

  /* Respuestas rápidas. Mapa completo: cada intención que el motor
        puede sugerir tiene aquí su etiqueta visible. Antes era una
        lista fija de 4 y las sugerencias contextuales que pedían
        "horario", "contacto", "pago" o "duracion" se descartaban
        en silencio, dejando la barra incompleta. */
  const QUICK = {
    servicios: "🛠️ Ver Servicios",
    agendar: "📅 ¿Cómo agendar cita?",
    ubicacion: "📍 Ubicación y Horarios",
    precios: "💰 Consultar Precios",
    horario: "🕐 Horario de atención",
    contacto: "📞 Teléfono y WhatsApp",
    pago: "💳 Formas de pago",
    duracion: "⏱ Tiempos de servicio"
  };

  // Orden en que aparecen al abrir el asistente.
  const QUICK_INICIAL = ["servicios", "agendar", "ubicacion", "precios"];

  let CATALOGO = {};
  let open = false;
  let busy = false;
  let history = [];

  /* ── Utilidades ───────────────────────────────────────────── */

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Coincidencia por palabra completa: evita que "no" case dentro
  // de "nota" o "presión" dentro de "representación".
  function contiene(texto, palabra) {
    const p = normalize(palabra).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("\\b" + p + "s?\\b").test(texto);
  }

  function alguna(texto, lista) {
    return lista.some(p => contiene(texto, p));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function format(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function presentarPrecio(valor) {
    const t = String(valor || "").trim();
    if (!t) return "Consultar valor";
    if (/consultar/i.test(t)) return "Consultar valor";
    if (/\$/.test(t)) return t;
    return t.replace(/(desde\s*)(\d)/i, "$1$$$2");
  }

  /* 3 · El catálogo se lee del DOM: nombre, resumen y precio salen
        de las tarjetas del carrusel, así el chat nunca muestra un
        dato distinto al que el usuario ya ve en pantalla. */
  function construirCatalogo() {
    const mapa = {};
    document.querySelectorAll(".srv[data-servicio]").forEach(card => {
      const slug = card.getAttribute("data-servicio");
      if (!slug || !EXTRAS[slug]) return;
      const nombreCorto =
        (card.querySelector(".srv-name")?.textContent || "").trim();
      mapa[slug] = Object.assign(
        {
          slug,
          chip: nombreCorto || slug,
          titulo: card.getAttribute("data-titulo") || nombreCorto,
          resumen: card.getAttribute("data-desc") || "",
          precio: presentarPrecio(card.getAttribute("data-precio") || ""),
          icono: card.getAttribute("data-ico") || "🔧"
        },
        EXTRAS[slug]
      );
    });
    // Aunque falten tarjetas, el asistente debe seguir respondiendo.
    Object.keys(EXTRAS).forEach(slug => {
      if (!mapa[slug]) {
        // El slug se capitaliza para que la ficha no muestre
        // "frenos" en minusculas si no hay tarjetas en el DOM.
        const titulo = slug.charAt(0).toUpperCase() + slug.slice(1);
        mapa[slug] = Object.assign(
          { slug, chip: titulo, titulo, resumen: "", precio: "Consultar valor", icono: "🔧" },
          EXTRAS[slug]
        );
      }
    });
    return mapa;
  }

  /* ── 4. Detección de servicio e intención ─────────────────── */

  function detectarServicio(texto) {
    let mejor = null;
    let puntaje = 0;
    Object.keys(CATALOGO).forEach(slug => {
      const aciertos = CATALOGO[slug].claves.filter(p => contiene(texto, p)).length;
      if (aciertos > puntaje) {
        puntaje = aciertos;
        mejor = slug;
      }
    });
    return puntaje > 0 ? mejor : null;
  }

  function detectarTema(texto) {
    if (alguna(texto, ["precio", "cuesta", "cuanto", "valor", "tarifa",
      "cotizacion", "presupuesto", "cobran", "cobro", "tarifas"])) return "precio";
    if (alguna(texto, ["cuanto dura", "dura", "tarda", "tiempo", "demora",
      "minutos", "horas", "rapido"])) return "duracion";
    if (alguna(texto, ["agendar", "cita", "reservar", "programar", "turno",
      "disponibilidad", "appointment"])) return "agendar";
    if (alguna(texto, ["sintoma", "ruido", "golpe", "vibra", "vibracion",
      "humo", "olor", "calienta", "temperatura", "testigo", "falla",
      "no enciende", "no prende", "chillido", "siseo"])) return "sintoma";
    return null;
  }

  /* ── 5. Motor de respuestas ──────────────────────────────── */

  function ficha(s) {
    const lineas = s.incluye.slice(0, 4).map(p => "• " + p).join("\n");
    // El resumen viene de data-desc de la tarjeta. Si no existe
    // (fallback del catalogo) se omite en vez de dejar un hueco
    // de dos lineas en blanco dentro de la burbuja.
    const resumen = s.resumen ? `${s.resumen}\n\n` : "";
    // El campo se llama `titulo` (desde data-titulo) o `chip`
    // (nombre corto de la tarjeta); NO existe `nombre` en los
    // objetos del catalogo, y leerlo imprimia "undefined" en la
    // cabecera de toda ficha de servicio.
    return (
      `${s.icono} **${s.titulo || s.chip}**\n\n${resumen}` +
      `**Qué incluye**\n${lineas}\n\n` +
      `⏱ Duración estimada: **${s.duracion}**\n` +
      `💰 Precio: **${s.precio}**\n\n` +
      `La tarifa final se confirma con el diagnóstico del vehículo.`
    );
  }

  function responder(bruto) {
    const texto = normalize(bruto);
    const svc = detectarServicio(texto);
    const tema = detectarTema(texto);

    /* ── Sin servicio identificado: temas del taller ── */
    if (!svc) {
      if (alguna(texto, ["hola", "buenas", "buenos dias", "buenas tardes",
        "buenas noches", "saludos", "que mas", "hey"])) {
        return {
          texto:
            `¡Hola! 👋 Soy el asesor virtual de **${SHOP.nombre}**.\n\n` +
            `Puedo orientarte sobre mantenimiento, frenos, alineación y balanceo, ` +
            `diagnóstico computarizado, sistema eléctrico y llantas, y llevarte ` +
            `directo a agendar tu cita.\n\n¿En qué te puedo ayudar?`,
          sugerencias: ["servicios", "precios", "ubicacion"]
        };
      }

      if (alguna(texto, ["ubicacion", "ubicado", "direccion", "donde",
        "quedan", "encuentro", "llego", "llegar", "mapa", "sucursal"])) {
        return {
          texto:
            `📍 **${SHOP.nombre}**\n${SHOP.direccion}\n\n` +
            `🕐 ${SHOP.horario}\n${SHOP.atencion}\n\n` +
            `📞 ${SHOP.telefono}`,
          sugerencias: ["horario", "precios", "agendar"]
        };
      }

      if (alguna(texto, ["horario", "abren", "abierto", "cierran", "atienden",
        "hora", "hasta cuando", "cuando abren"])) {
        return {
          texto: `🕐 **Horario de atención**\n${SHOP.horario}\n\n${SHOP.atencion}`,
          sugerencias: ["ubicacion", "precios", "agendar"]
        };
      }

      if (alguna(texto, ["telefono", "celular", "whatsapp", "contacto",
        "correo", "email", "escribir", "llamar", "numero"])) {
        return {
          texto:
            `📞 **Teléfono / WhatsApp:** ${SHOP.telefono}\n` +
            `✉️ **Correo:** ${SHOP.correo}\n\n` +
            `Por WhatsApp suelen responder más rápido si necesitas confirmar disponibilidad.`,
          sugerencias: ["ubicacion", "horario", "agendar"]
        };
      }

      if (alguna(texto, ["pago", "pagos", "efectivo", "tarjeta", "nequi",
        "daviplata", "transferencia", "dataphone", "credito"])) {
        return {
          texto:
            `Sobre las **modalidades de pago** te confirmo con gusto por teléfono o WhatsApp: ` +
            `**${SHOP.telefono}**.\n\nAsí te indicamos qué medio aceptamos para tu servicio.`,
          sugerencias: ["contacto", "precios", "agendar"]
        };
      }

      if (alguna(texto, ["servicios", "que hacen", "que ofrecen", "catalogo",
        "lista", "servicio", "trabajos", "manejan"])) {
        const lista = Object.keys(CATALOGO)
          .map(k => `• ${CATALOGO[k].icono} ${CATALOGO[k].chip}`)
          .join("\n");
        return {
          texto:
            `🔧 **Nuestros servicios**\n${lista}\n\n` +
            `Dime cuál te interesa y te cuento qué incluye, cuánto demora y su precio.`,
          sugerencias: ["precios", "agendar", "ubicacion"]
        };
      }

      if (alguna(texto, ["gracias", "listo", "perfecto", "entendido", "ok"])) {
        return {
          texto: `¡Con gusto! 😊 Si necesitas algo más, estoy aquí. Recuerda que puedes **agendar tu cita** en línea.`,
          sugerencias: ["agendar", "servicios", "contacto"]
        };
      }

      if (tema === "precio") {
        const lista = Object.keys(CATALOGO)
          .map(k => `• ${CATALOGO[k].chip}: **${CATALOGO[k].precio}**`)
          .join("\n");
        return {
          texto:
            `💰 **Precios de referencia**\n${lista}\n\n` +
            `Los valores "Desde" corresponden al trabajo básico; el precio final ` +
            `depende del vehículo y se confirma al ingresar al taller.`,
          sugerencias: ["agendar", "ubicacion", "servicios"]
        };
      }

      if (tema === "agendar") {
        return {
          texto:
            `📅 **Agendar cita** es rápido: entras a **Nueva Cita**, eliges vehículo, ` +
            `servicio, fecha y hora, y listo.\n\n${SHOP.atencion}`,
          sugerencias: ["servicios", "precios", "ubicacion"]
        };
      }

      if (tema === "sintoma") {
        return {
          texto:
            `🔎 Ese síntoma puede tener varias causas y no sería responsable darte ` +
            `un diagnóstico definitivo por chat.\n\n` +
            `Dime **marca, modelo y año**, qué ocurre exactamente, cuándo aparece ` +
            `y si se enciende algún testigo. Con eso te oriento sobre qué revisar primero.`,
          sugerencias: ["servicios", "precios", "agendar"]
        };
      }

      return {
        texto:
          `Lo siento, soy el asistente virtual de **${SHOP.nombre}** y solo puedo ` +
          `ayudarte con temas relacionados a **mantenimiento automotriz y citas en el taller**.\n\n` +
          `Puedo orientarte sobre nuestros servicios, precios, horarios y ubicación, ` +
          `o llevarte a agendar tu cita.`,
        sugerencias: ["servicios", "precios", "agendar"]
      };
    }

    /* ── Con servicio identificado ── */
    const s = CATALOGO[svc];

    if (tema === "precio") {
      return {
        texto:
          `💰 **${s.chip}**: ${s.precio}\n\n` +
          `⏱ Duración estimada: ${s.duracion}\n\n` +
          (s.precio === "Consultar valor"
            ? `Para este servicio el valor depende del diagnóstico. Te lo confirmamos al ingresar el vehículo o por WhatsApp.`
            : `Corresponde al trabajo básico; el valor final se confirma con el diagnóstico.`),
        servicio: svc,
        sugerencias: ["agendar", "servicios"]
      };
    }

    if (tema === "duracion") {
      return {
        texto: `⏱ **${s.chip}** toma aproximadamente **${s.duracion}**.\n\n${s.resumen}`,
        servicio: svc,
        sugerencias: ["agendar", "precios"]
      };
    }

    if (tema === "agendar") {
      return {
        texto:
          `📅 Perfecto. Con **${s.chip}** en el paso 3 del formulario solo debes ` +
          `confirmar fecha y hora.\n\n${s.resumen}`,
        servicio: svc,
        sugerencias: ["precios", "ubicacion"]
      };
    }

    if (tema === "sintoma") {
      return {
        texto: `🔎 **${s.chip}**\n\n${s.sintoma}\n\n${s.resumen}`,
        servicio: svc,
        sugerencias: ["agendar", "precios"]
      };
    }

    return {
      texto: ficha(s),
      servicio: svc,
      sugerencias: ["agendar", "precios"]
    };
  }

  /* ── Interfaz ─────────────────────────────────────────────── */

  function createUI() {
    if (document.getElementById("jm-chat-btn")) return;
    CATALOGO = construirCatalogo();

    const button = document.createElement("button");
    button.id = "jm-chat-btn";
    button.type = "button";
    button.setAttribute("aria-label", "Abrir asesor de Serviteca JM");
    button.setAttribute("aria-controls", "jm-chat-win");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = "<span aria-hidden='true'>💬</span>";

    const panel = document.createElement("section");
    panel.id = "jm-chat-win";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-label", "Asesor de Serviteca JM");
    panel.innerHTML = `
      <header class="jm-chat-header">
        <div class="jm-chat-avatar" aria-hidden="true">JM</div>
        <div class="jm-chat-id">
          <strong>Asesor JM</strong>
          <small><span class="jm-dot" aria-hidden="true"></span> Experto en servicio automotriz · En línea</small>
        </div>
        <button id="jm-chat-close" type="button" aria-label="Cerrar asesor">×</button>
      </header>
      <div id="jm-chat-body" class="jm-chat-body" role="log" aria-live="polite" aria-relevant="additions"></div>
      <div id="jm-chat-quick" class="jm-chat-quick" role="group" aria-label="Respuestas rápidas"></div>
      <footer class="jm-chat-footer">
        <label class="jm-sr" for="jm-chat-input">Escribe tu consulta</label>
        <input id="jm-chat-input" maxlength="500" autocomplete="off"
               placeholder="Ej.: mi carro vibra al frenar…">
        <button id="jm-chat-send" type="button" aria-label="Enviar mensaje">➤</button>
      </footer>`;

    document.body.append(button, panel);
    injectStyles();
    pintarQuickReplies(QUICK_INICIAL);

    button.addEventListener("click", toggle);
    document.getElementById("jm-chat-close").addEventListener("click", close);
    document.getElementById("jm-chat-send").addEventListener("click", send);
    document.getElementById("jm-chat-input").addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        send();
      }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && open) close();
    });
  }

  /* Estilos: única fuente visual del chat. Antes convivían aquí y
     en serviteca-theme.css; esa duplicación generaba un aspecto
     híbrido y se retiró en la limpieza correspondiente. */
  function injectStyles() {
    if (document.getElementById("jm-chat-styles")) return;
    const style = document.createElement("style");
    style.id = "jm-chat-styles";
    style.textContent = `
      .jm-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
      #jm-chat-btn{position:fixed!important;right:24px!important;bottom:24px!important;display:grid;place-items:center;width:60px;height:60px;padding:0;border:1px solid #B3945D;border-radius:50%;background:linear-gradient(145deg,#22321F,#122018);color:#D0B77D;font-size:26px;box-shadow:0 12px 32px rgba(0,0,0,.45);z-index:10000;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
      #jm-chat-btn::after{content:'Asesor';position:absolute;right:70px;padding:7px 12px;border:1px solid rgba(179,148,93,.5);border-radius:999px;background:#121212;color:#D0B77D;font:700 12px/1.2 'DM Sans',Arial,sans-serif;letter-spacing:.06em;box-shadow:0 4px 14px rgba(0,0,0,.4)}
      #jm-chat-btn:hover{transform:translateY(-2px);box-shadow:0 15px 36px rgba(0,0,0,.55);background:linear-gradient(145deg,#B3945D,#9B7E49);color:#0A0A0A}
      #jm-chat-btn:focus-visible{outline:3px solid #D0B77D;outline-offset:4px}
      #jm-chat-win{position:fixed;right:24px;bottom:98px;width:min(390px,calc(100vw - 30px));height:min(580px,calc(100dvh - 120px));height:min(580px,calc(100vh - 120px));min-height:340px;box-sizing:border-box;background:#0F0F0F;border:1px solid rgba(179,148,93,.35);border-radius:18px;box-shadow:0 25px 70px rgba(0,0,0,.6);overflow:hidden;display:none;z-index:10001;font-family:'DM Sans',Arial,sans-serif;color:#E9E4D8}
      #jm-chat-win.open{display:flex;flex-direction:column}
      .jm-chat-header{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:13px 14px;background:linear-gradient(135deg,#111111,rgba(179,148,93,.16));border-bottom:1px solid rgba(179,148,93,.32)}
      .jm-chat-avatar{width:38px;height:38px;flex:none;border-radius:11px;background:#B3945D;color:#0A0A0A;display:grid;place-items:center;font:800 14px/1 'Oswald',Arial,sans-serif;letter-spacing:.5px}
      .jm-chat-id{min-width:0}
      .jm-chat-id strong{display:block;font:600 15px/1.2 'Oswald',Arial,sans-serif;letter-spacing:.6px;color:#F4F1E9}
      .jm-chat-id small{display:block;font-size:10.5px;margin-top:3px;color:#9C9A92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .jm-dot{display:inline-block;width:7px;height:7px;background:#4FA96A;border-radius:50%;margin-right:5px}
      #jm-chat-close{margin-left:auto;flex:none;width:32px;height:32px;background:none;border:1px solid transparent;border-radius:50%;color:#C9C4B8;font-size:22px;line-height:1;cursor:pointer}
      #jm-chat-close:hover,#jm-chat-close:focus-visible{background:rgba(179,148,93,.18);color:#F4F1E9;outline:none}
      .jm-chat-body{flex:1 1 auto;min-height:0;padding:14px;overflow-y:auto;overflow-x:hidden;background:#0B0B0B}
      /* Contraste blindado: scope #jm-chat-win + !important.
         #F4F1E9 sobre #151515 = 14.7:1 (AAA) y #D0B77D sobre
         #151515 = 8.9:1 (AAA). El scope impide que cualquier
         hoja externa vuelva a bajar el contraste por cascada. */
      /* width:fit-content cierra la burbuja al tamaño de su
         texto. Sin él, un <div> block-level se estira hasta el
         max-width sin importar el contenido, y un "hola" ocupaba
         el 88% de la caja. max-width queda como techo para los
         mensajes largos. */
      #jm-chat-win .jm-msg{width:-moz-fit-content;width:fit-content;max-width:88%;box-sizing:border-box;padding:10px 12px;border-radius:14px;margin:8px 0;line-height:1.55;font-size:13px;overflow-wrap:anywhere;animation:jm-in .18s ease both}
      #jm-chat-win .jm-msg.bot{background:#151515!important;border:1px solid rgba(179,148,93,.35)!important;color:#F4F1E9!important}
      #jm-chat-win .jm-msg.bot strong{color:#D0B77D!important;font-weight:700!important}
      /* Burbuja del usuario: alineada a la derecha y con ancho
         propio (82%) para que no se estire a todo el panel.
         Su especificidad (1,2,0) le gana a #jm-chat-win .jm-msg
         (1,1,0), que fija el 88% común a ambas burbujas. */
      #jm-chat-win .jm-msg.user{margin-left:auto!important;background:#B3945D!important;color:#0A0A0A!important;max-width:82%!important;border-radius:14px!important;padding:10px 12px!important;font-weight:500}
      #jm-chat-win .jm-msg.user strong{color:#0A0A0A}
      #jm-typing{color:#8C8A82;font-size:12px;font-style:italic;margin:6px 0}
      .jm-action{display:inline-flex;align-items:center;gap:6px;margin:8px 0 4px;padding:9px 13px;border-radius:9px;background:#B3945D;color:#0A0A0A;text-decoration:none;font:600 12px/1.2 'Oswald',Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase}
      .jm-action:hover,.jm-action:focus-visible{background:#D0B77D;outline:none}
      .jm-chat-quick{flex:0 0 auto;display:flex;gap:6px;padding:9px 12px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;background:#101010;border-top:1px solid rgba(179,148,93,.22)}
      .jm-chat-quick::-webkit-scrollbar{display:none}
      /* Fondo #141414, texto #D0B77D (9.2:1, AAA) y borde dorado
         al 50%, en formato píldora. El scope triple refuerza por
         CSS que los chips solo existan dentro de la barra
         inferior: su especificidad (1,2,0) impide que otra hoja
         los recoloque, y sanearChips() retira cualquier nodo
         suelto que hubiera quedado en el cuerpo del mensaje. */
      #jm-chat-win .jm-chat-quick .jm-chip{flex:0 0 auto;background:#141414!important;color:#D0B77D!important;border:1px solid rgba(179,148,93,.5)!important;border-radius:999px!important;padding:7px 12px!important;font-size:11.5px!important;white-space:nowrap!important;cursor:pointer;font-family:'DM Sans',Arial,sans-serif;font-weight:600;line-height:1.2;transition:background .18s ease,color .18s ease}
      #jm-chat-win .jm-chat-quick .jm-chip:hover,#jm-chat-win .jm-chat-quick .jm-chip:focus-visible{background:#B3945D!important;border-color:#B3945D!important;color:#0A0A0A!important;outline:none}
      .jm-chat-footer{flex:0 0 auto;display:flex;gap:8px;padding:11px 12px;background:#101010;border-top:1px solid rgba(179,148,93,.22);box-sizing:border-box}
      #jm-chat-input{flex:1 1 auto;min-width:0;box-sizing:border-box;background:#0B0B0B;border:1px solid rgba(179,148,93,.3);border-radius:10px;color:#E9E4D8;padding:10px 12px;outline:none;font:400 13px/1.3 'DM Sans',Arial,sans-serif}
      #jm-chat-input::placeholder{color:#77746C}
      #jm-chat-input:focus{border-color:#B3945D;box-shadow:0 0 0 3px rgba(179,148,93,.2)}
      #jm-chat-send{flex:none;width:42px;border:0;border-radius:10px;background:#B3945D;color:#0A0A0A;font-size:15px;cursor:pointer}
      #jm-chat-send:hover{background:#D0B77D}
      @keyframes jm-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      @media(max-width:600px){
        #jm-chat-btn{right:14px!important;bottom:14px!important;width:54px;height:54px;font-size:23px}
        #jm-chat-btn::after{display:none}
        #jm-chat-win{right:10px;left:10px;width:auto;bottom:80px;height:min(560px,calc(100dvh - 96px));height:min(560px,calc(100vh - 96px));border-radius:16px}
        #jm-chat-win .jm-msg{max-width:92%}
        .jm-chat-id small{white-space:normal}
      }
      /* Scope también en el responsive: sin él, #jm-chat-win
         .jm-msg (1,1,0) le ganaría a .jm-msg (0,1,0) y el
         ajuste a 380px no llegaría a aplicarse. */
      /* El scope de este bloque debe coincidir con el de las
         reglas base: si quedara en #jm-chat-win .jm-chip
         (1,1,0) perdería contra #jm-chat-win .jm-chat-quick
         .jm-chip (1,2,0) y el ajuste compacto no llegaría. */
      @media(max-width:380px){
        #jm-chat-win .jm-msg{font-size:12.5px;padding:9px 11px}
        #jm-chat-win .jm-msg.user{padding:9px 11px!important}
        #jm-chat-win .jm-chat-quick .jm-chip{font-size:11px!important;padding:6px 10px!important}
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Render ───────────────────────────────────────────────── */

  function toggle() { open ? close() : openChat(); }

  function openChat() {
    open = true;
    document.getElementById("jm-chat-win")?.classList.add("open");
    const btn = document.getElementById("jm-chat-btn");
    btn?.setAttribute("aria-expanded", "true");
    btn?.setAttribute("aria-label", "Cerrar asesor de Serviteca JM");
    if (!history.length) welcome();
    setTimeout(() => document.getElementById("jm-chat-input")?.focus(), 100);
  }

  function close() {
    open = false;
    document.getElementById("jm-chat-win")?.classList.remove("open");
    const btn = document.getElementById("jm-chat-btn");
    btn?.setAttribute("aria-expanded", "false");
    btn?.setAttribute("aria-label", "Abrir asesor de Serviteca JM");
  }

  function scrollFinal() {
    const body = document.getElementById("jm-chat-body");
    if (body) body.scrollTop = body.scrollHeight;
  }

  function addMessage(role, text) {
    // Validación estricta: nulo, indefinido o solo espacios en
    // blanco se descarta ANTES de tocar el DOM o el historial.
    // Sin esto, format("") devolvía "" y quedaba un <div> vacío
    // visible en la conversación.
    if (!text || !String(text).trim()) return;

    const body = document.getElementById("jm-chat-body");
    if (!body) return;

    const contenido = String(text).trim();
    history.push({ role, text: contenido });

    const node = document.createElement("div");
    node.className = "jm-msg " + (role === "user" ? "user" : "bot");
    // format() escapa el HTML y convierte **negrita** y saltos de
    // línea, de modo que el contenido no puede romper la caja.
    node.innerHTML = format(contenido);
    body.appendChild(node);
    sanearChips();
    scrollFinal();
  }

  // Botón de acción que arrastra el servicio detectado a Nueva Cita,
  // usando el mismo nombre de chip que espera nueva-cita.html.
  function accionCita(slug) {
    const body = document.getElementById("jm-chat-body");
    if (!body) return;
    const link = document.createElement("a");
    link.className = "jm-action";
    link.href = slug && CATALOGO[slug]
      ? "nueva-cita.html?servicio=" + encodeURIComponent(CATALOGO[slug].chip)
      : "nueva-cita.html";
    link.textContent = "📅 Agendar esta Cita";
    body.appendChild(link);
    scrollFinal();
  }

  // Retira cualquier chip que no pertenezca a la barra inferior.
  // Protege contra historial cacheado por el service worker y
  // garantiza que los quick replies solo existan en un sitio.
  function sanearChips() {
    const body = document.getElementById("jm-chat-body");
    if (body) body.querySelectorAll(".jm-chip").forEach(n => n.remove());
    const bar = document.getElementById("jm-chat-quick");
    if (bar) {
      bar.querySelectorAll(".jm-chip:not([data-intento])").forEach(n => n.remove());
    }
  }

  // Barra inferior de respuestas rápidas: único lugar donde viven
  // los chips. Nunca se insertan dentro del cuerpo del mensaje.
  function pintarQuickReplies(claves) {
    const bar = document.getElementById("jm-chat-quick");
    if (!bar) return;
    bar.innerHTML = "";
    claves.forEach(intento => {
      const label = QUICK[intento];
      if (!label) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "jm-chip";
      b.setAttribute("data-intento", intento);
      // Se muestra el texto sin emoji para que el mensaje del
      // usuario en la conversación quede limpio.
      b.textContent = label.replace(/^[^\wÁÉÍÓÚÑáéíóúñ]+\s*/, "");
      b.addEventListener("click", () => submit(b.textContent, intento));
      bar.appendChild(b);
    });
    sanearChips();
    scrollFinal();
  }

  function welcome() {
    addMessage(
      "bot",
      `¡Hola! 👋 Soy el **Asesor JM**, especialista en servicio automotriz de **${SHOP.nombre}**.\n\n` +
      `Puedo orientarte sobre **mantenimiento, frenos, alineación y balanceo, ` +
      `diagnóstico computarizado, sistema eléctrico y llantas**, y llevarte directo ` +
      `a agendar tu cita.\n\n¿En qué te puedo ayudar?`
    );
  }

  function send() {
    const input = document.getElementById("jm-chat-input");
    const text = input?.value.trim();
    if (!text || busy) return;
    input.value = "";
    submit(text);
  }

  async function submit(text, intentoRapido) {
    // Guard de concurrencia y de contenido: los chips llaman a
    // submit() directamente, sin pasar por send(), así que este
    // control debe vivir aquí para que ambos caminos queden
    // protegidos por igual.
    if (busy) return;
    if (text === null || text === undefined || !String(text).trim()) return;

    addMessage("user", text);
    busy = true;
    let typing = null;

    try {
      const body = document.getElementById("jm-chat-body");
      if (body) {
        typing = document.createElement("div");
        typing.className = "jm-typing";
        typing.textContent = "Asesor JM está revisando tu consulta…";
        body.appendChild(typing);
        scrollFinal();
      }

      await new Promise(resolve => setTimeout(resolve, 320));

      // La respuesta rápida "Consultar Precios" sin servicio
      // devuelve el listado general; el resto usa el motor.
      let result;
      if (intentoRapido === "precios") {
        result = responder("precios de todos los servicios");
      } else if (intentoRapido === "servicios") {
        result = responder("que servicios manejan");
      } else if (intentoRapido === "ubicacion") {
        result = responder("donde quedan y horarios");
      } else if (intentoRapido === "agendar") {
        result = responder("como agendar cita");
      } else {
        result = responder(text);
      }

      if (typing) {
        typing.remove();
        typing = null;
      }

      // La propiedad que devuelve responder() es `texto`, no
      // `text`: leerla mal devolvía undefined, el ternario daba
      // "" y el guard de addMessage descartaba la respuesta, por
      // lo que el asistente nunca mostraba burbuja de bot.
      addMessage("bot", (result && result.texto) || "");
      if (result && result.servicio) accionCita(result.servicio);
      pintarQuickReplies(
        (result && result.sugerencias) || ["servicios", "precios", "agendar"]
      );
    } catch (error) {
      // Un fallo inesperado no debe dejar el asistente mudo:
      // se retira el indicador y se informa al usuario.
      if (typing) typing.remove();
      addMessage(
        "bot",
        `Ocurrió un problema al procesar tu mensaje. Puedes intentar de nuevo ` +
        `o escribirnos directo al **${SHOP.telefono}**.`
      );
      pintarQuickReplies(QUICK_INICIAL);
    } finally {
      // Se libera SIEMPRE, también si algo lanzó dentro del try.
      // Sin este finally, busy quedaría en true y el asistente
      // dejaría de responder por completo.
      busy = false;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI, { once: true });
  } else {
    createUI();
  }

  window.ServitecaChatbot = { open: openChat, close };
})();
