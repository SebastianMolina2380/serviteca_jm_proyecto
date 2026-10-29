
const API_CLIENTES = "/api/clientes";
const PAGE_SIZE_CLIENTES = 10;
const CLIENTES_USUARIO = JSON.parse(localStorage.getItem("servitecaUser") || "null");
let PUEDE_EDITAR_CLIENTES =
  String(CLIENTES_USUARIO?.rol || CLIENTES_USUARIO?.role || "").toLowerCase() === "admin";
let clientesData = [];
let clientesPagina = 0;
let clientesTotalPaginas = 0;
let clientesTotal = 0;
let clientesBusqueda = "";
let temporizadorBusqueda = null;

document.addEventListener("DOMContentLoaded", async () => {
  setDate();

  const buscador = document.getElementById("buscar-cliente");
  buscador?.addEventListener("input", () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      clientesBusqueda = String(buscador.value || "").trim();
      clientesPagina = 0;
      loadClientes();
    }, 350);
  });

  document.getElementById("btn-refresh")
    ?.addEventListener("click", loadClientes);

  document.getElementById("btn-prev-clientes")
    ?.addEventListener("click", () => {
      if (clientesPagina > 0) {
        clientesPagina--;
        loadClientes();
      }
    });

  document.getElementById("btn-next-clientes")
    ?.addEventListener("click", () => {
      if (clientesPagina + 1 < clientesTotalPaginas) {
        clientesPagina++;
        loadClientes();
      }
    });

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
    PUEDE_EDITAR_CLIENTES = rol === "ADMIN";

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
    const params = new URLSearchParams({
      page: String(clientesPagina),
      size: String(PAGE_SIZE_CLIENTES)
    });
    if (clientesBusqueda) params.set("q", clientesBusqueda);

    const r = await fetch(`${API_CLIENTES}?${params.toString()}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (r.status === 401 || r.status === 403) {
      location.href = "login.html";
      return;
    }

    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.message || data?.error || "No se pudieron cargar los clientes.");

    clientesData = Array.isArray(data?.content) ? data.content : [];
    clientesPagina = Number(data?.number ?? 0);
    clientesTotalPaginas = Number(data?.totalPages ?? 0);
    clientesTotal = Number(data?.totalElements ?? clientesData.length);

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

  if (count) {
    count.textContent = clientesTotal === 1 ? "1 cliente" : `${clientesTotal} clientes`;
  }

  actualizarPaginacion();

  if (!clientesData.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="cliente-vacio">No hay clientes para mostrar.</td></tr>';
    return;
  }

  tbody.innerHTML = clientesData.map(c => {
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
        <td>
          ${PUEDE_EDITAR_CLIENTES ? `
            <div style="display:flex;gap:5px">
              <button type="button" class="btn-sm-ghost" data-edit-client="${esc(id ?? "")}">Editar</button>
              <button type="button" class="btn-sm-ghost" data-toggle-client="${esc(id ?? "")}" data-state="${esc(estado)}">${estado === "ACTIVO" ? "Bloquear" : "Activar"}</button>
            </div>` : '<span style="color:var(--gray2)">Solo lectura</span>'}
        </td>
      </tr>`;
  }).join("");
}

function actualizarPaginacion() {
  const pagina = document.getElementById("clientes-pagina");
  const prev = document.getElementById("btn-prev-clientes");
  const next = document.getElementById("btn-next-clientes");
  const totalPaginas = Math.max(1, clientesTotalPaginas);

  if (pagina) {
    pagina.textContent = `Página ${clientesPagina + 1} de ${totalPaginas}`;
  }
  if (prev) prev.disabled = clientesPagina <= 0;
  if (next) next.disabled = clientesPagina + 1 >= clientesTotalPaginas;
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#039;"
  }[c]));
}

document.addEventListener("click", async e => {
  const editar = e.target.closest("[data-edit-client]");
  if (editar) {
    const id = editar.dataset.editClient;
    if (id) location.href = `nuevo-usuario.html?id=${encodeURIComponent(id)}&cliente=1`;
    return;
  }

  const alternar = e.target.closest("[data-toggle-client]");
  if (!alternar || !PUEDE_EDITAR_CLIENTES) return;

  const id = alternar.dataset.toggleClient;
  const estado = String(alternar.dataset.state || "").toUpperCase();
  if (!id) return;

  const bloquear = estado === "ACTIVO";
  const texto = bloquear
    ? "¿Bloquear este cliente? No podrá iniciar sesión, pero su historial se conserva."
    : "¿Activar nuevamente este cliente?";
  if (!confirm(texto)) return;

  try {
    const r = bloquear
      ? await fetch(`${API_CLIENTES}/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "same-origin"
        })
      : await fetch(`${API_CLIENTES}/${encodeURIComponent(id)}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "ACTIVO" })
        });

    if (r.status === 401) {
      location.href = "login.html";
      return;
    }

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data?.message || data?.error || "No se pudo actualizar el cliente.");
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
