document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const API = "/api/auth/password";
  const ok = document.getElementById("ok");
  const err = document.getElementById("err");
  const recoverForm = document.getElementById("recover-form");
  const resetForm = document.getElementById("reset-form");
  const emailInput = document.getElementById("rec-email");
  const passwordInput = document.getElementById("new-password");
  const confirmInput = document.getElementById("confirm-password");
  const btnRecover = document.getElementById("btn-recover");
  const btnReset = document.getElementById("btn-reset");
  const intro = document.getElementById("intro");
  const token = new URLSearchParams(location.search).get("token");

  function ocultarMensajes() {
    if (ok) ok.style.display = "none";
    if (err) err.style.display = "none";
  }

  function mostrarOk(texto) {
    ocultarMensajes();
    if (!ok) return;
    ok.innerHTML = "✅ <strong>" + texto + "</strong>";
    ok.style.display = "block";
  }

  function mostrarError(texto) {
    ocultarMensajes();
    if (!err) return;
    err.textContent = "⚠️ " + texto;
    err.style.display = "block";
  }

  function marcarPaso(numero) {
    [1, 2, 3].forEach((n) => {
      const el = document.getElementById("step-" + n);
      if (el) el.classList.toggle("act", n === numero);
    });
  }

  async function postJson(url, body) {
    const respuesta = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(data?.message || data?.error || "No se pudo completar la solicitud.");
    }
    return data;
  }

  function mostrarFormularioReset() {
    if (intro) {
      intro.textContent = "Crea una nueva contraseña para tu cuenta. El enlace es de un solo uso.";
    }
    if (recoverForm) recoverForm.classList.add("is-hidden");
    if (resetForm) resetForm.classList.remove("is-hidden");
    marcarPaso(3);
    passwordInput?.focus();
  }

  /* ── Paso 1: solicitar enlace ── */
  recoverForm?.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    ocultarMensajes();

    const correo = String(emailInput?.value || "").trim();
    if (!correo) {
      mostrarError("Ingresa tu correo electrónico.");
      emailInput?.focus();
      return;
    }

    if (btnRecover) {
      btnRecover.disabled = true;
      btnRecover.textContent = "ENVIANDO…";
    }

    try {
      const data = await postJson(API + "/forgot", { correo });
      marcarPaso(2);
      mostrarOk(data?.mensaje ||
        "Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.");
      if (emailInput) emailInput.value = "";
    } catch (e) {
      mostrarError(e.message || "No se pudo enviar la solicitud.");
    } finally {
      if (btnRecover) {
        btnRecover.disabled = false;
        btnRecover.textContent = "ENVIAR ENLACE DE RECUPERACIÓN";
      }
    }
  });

  /* ── Paso 3: guardar nueva contraseña ── */
  resetForm?.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    ocultarMensajes();

    const contrasena = String(passwordInput?.value || "");
    const confirmacion = String(confirmInput?.value || "");

    if (contrasena.length < 8) {
      mostrarError("La contraseña debe tener al menos 8 caracteres.");
      passwordInput?.focus();
      return;
    }
    if (contrasena !== confirmacion) {
      mostrarError("Las contraseñas no coinciden.");
      confirmInput?.focus();
      return;
    }
    if (!token) {
      mostrarError("El enlace no es válido. Solicita uno nuevo.");
      return;
    }

    if (btnReset) {
      btnReset.disabled = true;
      btnReset.textContent = "GUARDANDO…";
    }

    try {
      const data = await postJson(API + "/reset", { token, contrasena });
      resetForm.classList.add("is-hidden");
      marcarPaso(3);
      mostrarOk(data?.mensaje || "Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => {
        location.href = "login.html";
      }, 2500);
    } catch (e) {
      mostrarError(e.message || "No se pudo actualizar la contraseña.");
    } finally {
      if (btnReset) {
        btnReset.disabled = false;
        btnReset.textContent = "GUARDAR NUEVA CONTRASEÑA";
      }
    }
  });

  if (token) {
    mostrarFormularioReset();
  } else {
    marcarPaso(1);
    emailInput?.focus();
  }
});
