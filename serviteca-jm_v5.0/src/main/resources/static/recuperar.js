document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("recover-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email");
    if (!email || !email.value) {
      alert("Por favor ingresa tu correo electrónico.");
      return;
    }

    alert(`Si el correo ${email.value} está registrado, recibirás instrucciones para recuperar tu contraseña.`);
  });
});
