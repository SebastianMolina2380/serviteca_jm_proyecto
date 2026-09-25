(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const form = document.getElementById("new-user-form");
    if (!form) return;

    const message = document.getElementById("form-message");
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const clientMode = params.get("cliente") === "1";

    const title = document.querySelector(".form-card .pg-title");
    const subtitle = document.querySelector(".form-card .pg-sub");
    const submit = form.querySelector('button[type="submit"]');
    const password = document.getElementById("password");
    const confirmation = document.getElementById("confirm-password");
    const role = form.elements.namedItem("rol");

    bindPasswordButtons();

    if (id) {
      title && (title.textContent = "Editar Usuario");
      subtitle && (subtitle.textContent = "Actualiza los datos de la cuenta");
      submit && (submit.textContent = "Guardar cambios");

      if (password) {
        password.required = false;
        password.removeAttribute("minlength");
      }
      if (confirmation) {
        confirmation.required = false;
        confirmation.removeAttribute("minlength");
      }

      try {
        const user = await request(`/api/usuarios/${encodeURIComponent(id)}`);
        fillForm(form, user);
      } catch (error) {
        showMessage(message, error.message, false);
        return;
      }
    }

    if (clientMode && role) {
      role.value = "cliente";
      role.disabled = true;
    }

    form.addEventListener("submit", event => save(event, {
      form, id, clientMode, message, password, confirmation, role
    }));
  }

  function bindPasswordButtons() {
    document.querySelectorAll("[data-toggle-password]").forEach(button => {
      button.addEventListener("click", () => {
        const input = document.querySelector(button.dataset.togglePassword);
        if (!input) return;
        const visible = input.type === "password";
        input.type = visible ? "text" : "password";
        button.textContent = visible ? "🙈" : "👁";
        button.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
      });
    });
  }

  function fillForm(form, user) {
    const values = {
      nombre: user?.nombre,
      numeroDoc: user?.numeroDoc,
      correo: user?.correo,
      tipoDocumento: user?.tipoDocumento,
      rol: String(user?.rol || "").toLowerCase(),
      estado: user?.estado || "ACTIVO",
      direccion: user?.direccion || "",
      telefono: user?.telefono || "",
      ciudad: user?.ciudad || ""
    };

    Object.entries(values).forEach(([name, value]) => {
      const element = form.elements.namedItem(name);
      if (element && value != null) element.value = value;
    });
  }

  async function save(event, context) {
    event.preventDefault();

    const { form, id, clientMode, message, password, confirmation, role } = context;
    showMessage(message, "", false);

    const formData = new FormData(form);
    const newPassword = String(formData.get("contrasena") || "");
    const repeatedPassword = String(confirmation?.value || "");

    if (id && !newPassword) {
      formData.delete("contrasena");
    } else {
      if (!newPassword) {
        showMessage(message, "La contraseña es obligatoria.", false);
        password?.focus();
        return;
      }

      if (newPassword !== repeatedPassword) {
        showMessage(message, "Las contraseñas no coinciden.", false);
        confirmation?.focus();
        return;
      }

      if (newPassword.length < 8) {
        showMessage(message, "La contraseña debe tener al menos 8 caracteres.", false);
        return;
      }

      if (typeof window.evaluarPassword === "function") {
        const result = window.evaluarPassword(newPassword);
        if (result?.nivel === "Débil") {
          showMessage(message, "Usa una contraseña más segura: combina mayúsculas, minúsculas, números y símbolos.", false);
          return;
        }
      }
    }

    formData.delete("confirm-password");
    formData.delete("confirmar");
    if (clientMode) formData.set("rol", "cliente");
    if (role?.disabled && !formData.has("rol")) formData.set("rol", role.value);

    const payload = Object.fromEntries(formData.entries());

    try {
      const endpoint = id ? `/api/usuarios/${encodeURIComponent(id)}` : "/api/usuarios";
      const data = await request(endpoint, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      showMessage(message, id ? "Usuario actualizado correctamente." : "Usuario creado correctamente.", true);

      window.setTimeout(() => {
        window.location.href = clientMode ? "clientes.html" : "usuarios.html";
      }, 700);

      return data;
    } catch (error) {
      showMessage(message, error.message, false);
    }
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) {}

    if (response.status === 401) {
      window.location.href = "login.html";
      throw new Error("Sesión expirada.");
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.message || `No se pudo completar la operación (${response.status}).`);
    }

    return data;
  }

  function showMessage(element, text, success) {
    if (!element) return;
    element.textContent = text;
    element.classList.toggle("success", Boolean(success));
  }

  window.ServitecaUsuario = { init };
})();