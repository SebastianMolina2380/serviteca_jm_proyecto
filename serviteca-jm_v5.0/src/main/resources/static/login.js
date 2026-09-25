window.selectedRole = "admin";

function setRole(role, btn) {
  window.selectedRole = role;

  document.querySelectorAll(".role").forEach((el) => {
    el.classList.remove("active");
  });

  if (btn) {
    btn.classList.add("active");
  }
}

function showLoginMessage(message, color = "#ff6b6b") {
  const errorBox = document.getElementById("err");

  if (errorBox) {
    errorBox.style.display = "block";
    errorBox.textContent = message;
    errorBox.style.color = color;
  }
}

async function doLogin() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("pass");

  if (!emailInput || !passwordInput) return;

  const correo = emailInput.value.trim();
  const contrasena = passwordInput.value;
  const rol = window.selectedRole || "admin";

  if (!correo || !contrasena) {
    showLoginMessage("❌ Ingresa correo y contraseña para continuar.");
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        correo,
        contrasena,
        rol
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
          data.error || "No fue posible iniciar sesión."
      );
    }

    localStorage.setItem(
        "servitecaUser",
        JSON.stringify(data)
    );

    localStorage.setItem(
        "user",
        JSON.stringify(data)
    );

// 👇 AGREGA ESTA LÍNEA (Asegúrate que 'data.token' sea la propiedad que envía tu API)
    localStorage.setItem(
        "servitecaToken",
        data.token || data.accessToken || "session_active"
    );

    showLoginMessage(
        "✅ Inicio de sesión correcto",
        "#1f9d64"
    );

    window.location.href =
        String(data.rol || "").toUpperCase() === "CLIENTE"
            ? "portal-cliente.html"
            : "dashboard.html";

  } catch (error) {
    console.error(error);

    showLoginMessage(
        `❌ ${error.message}`
    );
  }
}


// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // OJO DE CONTRASEÑA
  // ========================================

  document
      .querySelectorAll("[data-toggle-password]")
      .forEach((btn) => {

        btn.addEventListener("click", (e) => {
          e.preventDefault(); // Evita que el botón procese un submit del formulario

          const targetSelector =
              btn.getAttribute("data-toggle-password");

          const input =
              document.querySelector(targetSelector);

          if (!input) return;

          const isPassword =
              input.type === "password";

          input.type =
              isPassword ? "text" : "password";

          // Cambiar icono
          btn.textContent =
              isPassword ? "🙈" : "👁";

          // Cambiar accesibilidad
          btn.setAttribute(
              "aria-label",
              isPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
          );

          btn.setAttribute(
              "title",
              isPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
          );

        });

      });


  // ========================================
  // FORMULARIO LOGIN
  // ========================================

  const loginForm =
      document.getElementById("loginForm");

  if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (e) => {

          e.preventDefault();

          await doLogin();

        }
    );

  }

});