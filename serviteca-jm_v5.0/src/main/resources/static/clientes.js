
const API_CLIENTES = "/api/clientes";
let clientesData = [];

document.addEventListener("DOMContentLoaded", async () => {
  setDate();

  document.getElementById("buscar-cliente")
    ?.addEventListener("input", render);

  document.getElementById("btn-refresh")
    ?.addEventListener("click", loadClientes);

  const btnMenu = document.getElementById("hambtn");
  if (btnMenu) {
    btnMenu.addEventListener("click", () => {
      document.querySelector(".sb")?.classList.toggle("open");
      document.getElementById("sb-overlay")?.classList.toggle("show");
    });
  }

  await loadSessionUser();
  await loadClientes();
});

function setDate() {
  const el = document.getElementById("tbdate");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("es-CO", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

async function loadSessionUser() {
  try {
    const r = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!r.ok) return;
    const u = await r.json();

    const nombre = u?.nombre || u?.username || u?.correo || "Usuario";
    const rol = String(u?.rol || u?.role || "").toUpperCase();

    const sbName = document.getElementById("sbname");
    const sbRole = document.getElementById("sbrole");
    const sbAv = document.getElementById("sbav");

    if (sbName) sbName.textContent = nombre;
    if (sbRole) {
      sbRole.textContent =
        rol === "ADMIN" ? "Administrador" :
        rol === "TECNICO" ? "Técnico" :
        rol === "CLIENTE" ? "Cliente" : "Usuario";
    }

    if (sbAv) {
      const partes = String(nombre).trim().split(/\s+/);
      sbAv.textContent =
        partes.slice(0, 2).map(x => x[0]).join("").toUpperCase() || "JM";
    }
  } catch (_) {}
}

async function loadClientes() {
  const tbody = document.getElementById("tbody-clientes");
  if (tbody) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="cliente-vacio">Cargando clientes...</td></tr>';
  }

  try {
    const r = await fetch(API_CLIENTES, { credentials: "same-origin" });

    if (r.status === 401 || r.status === 403) {
      location.href = "login.html";
      return;
    }

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "No se pudieron cargar los clientes.");

    clientesData = Array.isArray(data) ? data : [];
    render();
  } catch (e) {
    if (tbody) {
      tbody.innerHTML =
        `<tr><td colspan="6" class="cliente-error">${esc(e.message)}</td></tr>`;
    }
  }
}

function render() {
  const tbody = document.getElementById("tbody-clientes");
  const count = document.getElementById("clientes-count");
  if (!tbody) return;

  const q = String(document.getElementById("buscar-cliente")?.value || "")
    .trim().toLowerCase();

  const filtrados = clientesData.filter(c => {
    const texto = [
      c.nombre, c.numeroDoc, c.documento, c.correo, c.email
    ].map(v => String(v ?? "")).join(" ").toLowerCase();
    return !q || texto.includes(q);
  });

  if (count) {
    count.textContent =
      filtrados.length === 1 ? "1 cliente" : `${filtrados.length} clientes`;
  }

  if (!filtrados.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="cliente-vacio">No hay clientes para mostrar.</td></tr>';
    return;
  }

  tbody.innerHTML = filtrados.map(c => {
    const id = c.idusuario ?? c.idUsuario ?? c.id;
    const nombre = c.nombre ?? "";
    const documento =
      `${c.tipoDocumento ?? c.tipo_documento ?? ""} ${c.numeroDoc ?? c.numero_doc ?? c.documento ?? ""}`.trim();
    const correo = c.correo ?? c.email ?? "";
    const estado = String(c.estado ?? "ACTIVO").toUpperCase();
    const acceso = c.ultimoAcceso ?? c.ultimo_acceso;

    const fechaAcceso = acceso
      ? new Date(acceso).toLocaleString("es-CO", {
          day: "2-digit", month: "2-digit",
          hour: "2-digit", minute: "2-digit"
        })
      : "Nunca";

    return `
      <tr>
        <td><strong>${esc(nombre)}</strong></td>
        <td>${esc(documento)}</td>
        <td>${esc(correo)}</td>
        <td><span class="badge ${estado === "ACTIVO" ? "badge-green" : "badge-red"}">${esc(estado)}</span></td>
        <td>${esc(fechaAcceso)}</td>
        <td style="display:flex;gap:5px">
          <button type="button" class="btn-sm-ghost" data-edit-client="${esc(id ?? "")}">Editar</button>
          <button type="button" class="btn-sm-ghost" data-toggle-client="${esc(id ?? "")}" data-state="${esc(estado)}">${estado === "ACTIVO" ? "Bloquear" : "Activar"}</button>
        </td>
      </tr>`;
  }).join("");
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#039;"
  }[c]));
}

document.addEventListener("click", async e => {
  const del = e.target.closest("[data-delete-client]");
  if (!del) return;

  const id = del.dataset.deleteClient;
  if (!id) return;
  if (!confirm("¿Eliminar este cliente?")) return;

  try {
    const r = await fetch(`${API_CLIENTES}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin"
    });

    if (r.status === 401 || r.status === 403) {
      location.href = "login.html";
      return;
    }

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data?.error || "No se pudo eliminar el cliente.");
    }

    await loadClientes();
  } catch (err) {
    alert(err.message);
  }
});

function closeSb() {
  document.querySelector(".sb")?.classList.remove("open");
  document.getElementById("sb-overlay")?.classList.remove("show");
}
