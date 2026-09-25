(() => {
  "use strict";

  const SHOP = {
    name: "JM Serviteca",
    phone: "+57 313 309 6458",
    email: "jm.serviteca@gmail.com",
    location: "Tunja, Boyacá, Colombia",
    hours: "lunes a sábado, de 7:00 a. m. a 6:00 p. m."
  };

  const SERVICES = {
    aceite: "Para cambio de aceite revisamos el lubricante adecuado y podemos complementar con filtros, niveles y revisión general. Si me dices marca, modelo y año, puedo orientarte sobre qué revisar.",
    frenos: "Si notas chillido, vibración, pedal esponjoso, mayor distancia de frenado o desviación al frenar, conviene revisar el sistema. Podemos inspeccionar pastillas, discos y componentes relacionados.",
    alineacion: "La alineación corrige los ángulos de las ruedas. Es conveniente revisarla si el vehículo se va hacia un lado, el volante queda torcido o las llantas presentan desgaste irregular.",
    diagnostico: "El diagnóstico computarizado permite leer códigos de falla y orientar la inspección de sistemas electrónicos y del motor. Un código no siempre identifica por sí solo la causa.",
    electrico: "Podemos orientar la revisión de batería, alternador, arranque y cableado. Si no enciende o aparecen testigos eléctricos, conviene realizar una revisión antes de cambiar componentes.",
    llantas: "Podemos revisar presión, desgaste, montaje y posibles pérdidas de aire. Si hay vibraciones o desgaste irregular, es recomendable inspeccionar las llantas."
  };

  let open = false;
  let busy = false;
  let history = [];

  function normalize(text) {
    return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function has(text, terms) {
    return terms.some(term => text.includes(normalize(term)));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function format(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function createUI() {
    if (document.getElementById("jm-chat-btn")) return;

    const button = document.createElement("button");
    button.id = "jm-chat-btn";
    button.type = "button";
    button.setAttribute("aria-label", "Abrir Asistente JM");
    button.innerHTML = "🔧";

    const panel = document.createElement("section");
    panel.id = "jm-chat-win";
    panel.setAttribute("aria-label", "Asistente JM");
    panel.innerHTML = `
      <header class="jm-chat-header">
        <div class="jm-chat-avatar">JM</div>
        <div><strong>Asistente JM</strong><small><span></span> Experto mecánico · En línea</small></div>
        <button id="jm-chat-close" type="button" aria-label="Cerrar">×</button>
      </header>
      <div id="jm-chat-body" class="jm-chat-body"></div>
      <footer class="jm-chat-footer">
        <input id="jm-chat-input" maxlength="500" autocomplete="off" placeholder="Ej.: mi carro vibra al frenar…">
        <button id="jm-chat-send" type="button" aria-label="Enviar">➤</button>
      </footer>`;

    document.body.append(button, panel);
    injectStyles();

    button.addEventListener("click", toggle);
    document.getElementById("jm-chat-close").addEventListener("click", close);
    document.getElementById("jm-chat-send").addEventListener("click", send);
    document.getElementById("jm-chat-input").addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        send();
      }
    });
  }

  function injectStyles() {
    if (document.getElementById("jm-chat-styles")) return;
    const style = document.createElement("style");
    style.id = "jm-chat-styles";
    style.textContent = `
      #jm-chat-btn{position:fixed;right:24px;bottom:24px;width:58px;height:58px;border:2px solid #22c55e;border-radius:50%;background:#101a29;color:#facc15;font-size:25px;box-shadow:0 12px 35px #0008;z-index:9998;cursor:pointer}
      #jm-chat-win{position:fixed;right:24px;bottom:94px;width:min(390px,calc(100vw - 30px));height:570px;background:#0f172a;border:1px solid #334155;border-radius:18px;box-shadow:0 25px 70px #000b;overflow:hidden;display:none;z-index:9999;font-family:Arial,sans-serif}
      #jm-chat-win.open{display:flex;flex-direction:column}
      .jm-chat-header{display:flex;align-items:center;gap:10px;padding:15px;background:linear-gradient(135deg,#14251f,#121b2b);border-bottom:1px solid #334155;color:#fff}
      .jm-chat-avatar{width:40px;height:40px;border-radius:12px;background:#facc15;color:#111827;display:grid;place-items:center;font-weight:800}
      .jm-chat-header strong{display:block}.jm-chat-header small{display:block;color:#94a3b8;font-size:11px;margin-top:3px}.jm-chat-header small span{display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;margin-right:4px}
      #jm-chat-close{margin-left:auto;background:none;border:0;color:#cbd5e1;font-size:25px;cursor:pointer}
      .jm-chat-body{flex:1;padding:15px;overflow:auto;background:#0b1220}
      .jm-msg{max-width:88%;padding:10px 12px;border-radius:13px;margin:8px 0;line-height:1.45;font-size:13px}
      .jm-msg.bot{background:#172234;color:#e2e8f0;border:1px solid #26364b}.jm-msg.user{margin-left:auto;background:#14532d;color:#fff}
      .jm-chip{border:1px solid #3f4d60;background:#121d2c;color:#facc15;border-radius:20px;padding:7px 10px;margin:4px 3px;cursor:pointer;font-size:11px}
      .jm-typing{color:#94a3b8;font-size:12px}
      .jm-chat-footer{display:flex;gap:8px;padding:12px;border-top:1px solid #334155;background:#101827}
      #jm-chat-input{flex:1;background:#0b1220;border:1px solid #334155;border-radius:10px;color:#fff;padding:10px;outline:none}
      #jm-chat-send{width:42px;border:0;border-radius:10px;background:#facc15;color:#111827;font-weight:800;cursor:pointer}
      .jm-action{display:inline-block;margin-top:8px;padding:8px 11px;border-radius:9px;background:#22c55e;color:#052e16;text-decoration:none;font-weight:800;font-size:12px}
      @media(max-width:600px){#jm-chat-btn{right:15px;bottom:15px}#jm-chat-win{right:15px;bottom:83px;height:calc(100vh - 105px)}}
    `;
    document.head.appendChild(style);
  }

  function toggle() {
    open ? close() : openChat();
  }

  function openChat() {
    open = true;
    document.getElementById("jm-chat-win")?.classList.add("open");
    if (!history.length) welcome();
    setTimeout(() => document.getElementById("jm-chat-input")?.focus(), 100);
  }

  function close() {
    open = false;
    document.getElementById("jm-chat-win")?.classList.remove("open");
  }

  function addMessage(role, text) {
    history.push({ role, text });
    const body = document.getElementById("jm-chat-body");
    const node = document.createElement("div");
    node.className = `jm-msg ${role === "user" ? "user" : "bot"}`;
    node.innerHTML = format(text);
    body.appendChild(node);
    body.scrollTop = body.scrollHeight;
  }

  function welcome() {
    addMessage("bot", `¡Hola! Soy el **Asistente JM**, especialista en mantenimiento automotriz de ${SHOP.name}.\n\nPuedo orientarte sobre frenos, alineación y balanceo, cambio de aceite, diagnóstico computarizado, sistema eléctrico y llantas.`);
    suggestions(["🔧 Servicios", "🛑 Frenos", "🛢️ Cambio de aceite", "📅 Agendar cita", "🕐 Horarios"]);
  }

  function suggestions(items) {
    const body = document.getElementById("jm-chat-body");
    const box = document.createElement("div");
    items.forEach(label => {
      const button = document.createElement("button");
      button.className = "jm-chip";
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        box.remove();
        if (/agendar/i.test(label)) {
          addMessage("bot", "Perfecto. Te llevo a **Nueva Cita** para que selecciones vehículo, servicio, fecha y hora.");
          appointmentAction();
        } else {
          submit(label);
        }
      });
      box.appendChild(button);
    });
    body.appendChild(box);
    body.scrollTop = body.scrollHeight;
  }

  function send() {
    const input = document.getElementById("jm-chat-input");
    const text = input?.value.trim();
    if (!text || busy) return;
    input.value = "";
    submit(text);
  }

  async function submit(text) {
    addMessage("user", text);
    busy = true;

    const body = document.getElementById("jm-chat-body");
    const typing = document.createElement("div");
    typing.className = "jm-typing";
    typing.textContent = "Asistente JM está revisando la consulta…";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    await new Promise(resolve => setTimeout(resolve, 300));
    const result = responseFor(text);
    typing.remove();
    busy = false;
    addMessage("bot", result.text);

    if (result.appointment) appointmentAction();
    else suggestions(result.suggestions || ["🔧 Servicios", "📅 Agendar cita", "🕐 Horarios"]);
  }

  function responseFor(raw) {
    const text = normalize(raw);

    if (has(text, ["agendar", "cita", "reservar", "programar"])) {
      return { appointment:true, text:"Claro. Puedes agendar una cita desde el módulo **Nueva Cita**. Allí eliges el vehículo, servicio, fecha y hora." };
    }

    if (has(text, ["horario", "abren", "cierran", "atienden"])) {
      return { text:`🕐 **Horario:** ${SHOP.hours}.\n📍 **Ubicación:** ${SHOP.location}\n📞 **Teléfono:** ${SHOP.phone}` };
    }

    if (has(text, ["donde", "ubicacion", "direccion"])) {
      return { text:`📍 ${SHOP.name} está en **${SHOP.location}**.\nSi necesitas confirmar disponibilidad antes de desplazarte, llama al **${SHOP.phone}**.` };
    }

    if (has(text, ["telefono", "celular", "contacto", "correo", "email"])) {
      return { text:`📞 **Teléfono:** ${SHOP.phone}\n✉️ **Correo:** ${SHOP.email}` };
    }

    if (has(text, ["servicios", "que hacen", "catalogo"])) {
      return { text:"🔧 **Servicios:**\n• Cambio de aceite y mantenimiento\n• Frenos\n• Alineación y balanceo\n• Diagnóstico computarizado\n• Sistema eléctrico\n• Llantas" };
    }

    if (has(text, ["freno", "frenos", "pastilla", "disco", "chillido", "frenar"])) return { text:SERVICES.frenos };
    if (has(text, ["aceite", "lubricante", "filtro", "mantenimiento"])) return { text:SERVICES.aceite };
    if (has(text, ["alineacion", "balanceo", "volante torcido", "desgaste irregular"])) return { text:SERVICES.alineacion };
    if (has(text, ["diagnostico", "obd", "codigo de falla", "check engine", "testigo"])) return { text:SERVICES.diagnostico };
    if (has(text, ["bateria", "alternador", "arranque", "no enciende", "electrico"])) return { text:SERVICES.electrico };
    if (has(text, ["llanta", "neumatico", "pinchazo", "presion", "vibracion"])) return { text:SERVICES.llantas };

    if (has(text, ["ruido", "golpe", "vibra", "humo", "olor", "calienta", "temperatura", "falla"])) {
      return { text:"🔎 Ese síntoma puede tener varias causas y no sería responsable darte un diagnóstico definitivo por chat.\n\nDime **marca, modelo y año**, qué ocurre exactamente, cuándo aparece y si se enciende algún testigo. Con esos datos puedo orientarte sobre qué revisar primero." };
    }

    return { text:`Puedo ayudarte con **frenos, alineación, balanceo, aceite, diagnóstico computarizado, sistema eléctrico y llantas**. También puedo llevarte a **Nueva Cita**.\n\n¿Qué síntoma o servicio necesitas?` };
  }

  function appointmentAction() {
    const body = document.getElementById("jm-chat-body");
    const link = document.createElement("a");
    link.className = "jm-action";
    link.href = "nueva-cita.html";
    link.textContent = "📅 Ir a Nueva Cita";
    body.appendChild(link);
    body.scrollTop = body.scrollHeight;
  }

  document.addEventListener("DOMContentLoaded", createUI);
  window.ServitecaChatbot = { open: openChat, close };
})();