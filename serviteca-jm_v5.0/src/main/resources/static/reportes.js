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
  const sb = document.querySelector(".sb");
  const overlay = document.getElementById("sb-overlay");

  function closeSb() {
    if (sb) sb.classList.remove("open");
  }

  if (hamb) {
    hamb.addEventListener("click", () => {
      if (sb) sb.classList.toggle("open");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeSb);
  }

  window.closeSb = closeSb;
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeSb();
  });
});
