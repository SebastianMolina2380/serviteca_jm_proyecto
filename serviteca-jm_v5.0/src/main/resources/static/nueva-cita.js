function goStep(num = 1) {
  [1, 2, 3, 4, 5].forEach((i) => {
    const page = document.getElementById("p" + i);
    if (page) page.style.display = i === num ? "block" : "none";
  });

  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById("stp" + i);
    const line = document.getElementById("l" + i);
    if (step) {
      step.className = "stp " + (i < num ? "done" : i === num ? "active" : "pend");
      const circle = step.querySelector(".stp-c");
      if (circle) circle.textContent = i < num ? "✓" : i;
    }
    if (line) {
      line.className = "stp-line" + (i < num ? " done" : "");
    }
  }
}

function selSvc(el) {
  document.querySelectorAll(".svc").forEach((svc) => svc.classList.remove("sel"));
  el.classList.add("sel");
}

document.addEventListener("DOMContentLoaded", function () {
  const tbdate = document.getElementById("tbdate");
  if (tbdate) {
    const date = new Date();
    const monthNames = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ];
    tbdate.textContent = `${date.getDate()} DE ${monthNames[date.getMonth()]}`;
  }

  const sb = document.querySelector(".sb");
  const hamb = document.getElementById("hambtn");
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

  goStep(1);
});
