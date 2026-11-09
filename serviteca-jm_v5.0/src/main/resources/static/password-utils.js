function evaluarPassword(p){
  let score=0;
  if(p.length>=8)score++; if(p.length>=12)score++;
  if(/[A-Z]/.test(p))score++; if(/[a-z]/.test(p))score++;
  if(/\d/.test(p))score++; if(/[^A-Za-z0-9]/.test(p))score++;
  if(p.length<8)return {nivel:"Débil",clase:"weak"};
  if(score<=3)return {nivel:"Media",clase:"medium"};
  return {nivel:"Fuerte",clase:"strong"};
}
function instalarPasswordUI(){
  const input=document.getElementById("password"), meter=document.getElementById("password-strength");
  if(input&&meter)input.addEventListener("input",()=>{
    const x=evaluarPassword(input.value);
    meter.textContent=input.value?`Contraseña ${x.nivel}`:"Escribe una contraseña.";
    meter.className=`password-strength ${x.clase}`;
  });
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-toggle-password]"); if(!b)return;
    e.preventDefault();
    const input=document.querySelector(b.getAttribute("data-toggle-password")); if(!input)return;
    input.setAttribute("type",input.getAttribute("type")==="password"?"text":"password");
    const visible=input.getAttribute("type")==="text";
    b.textContent=visible?"🙈":"👁";
    b.setAttribute("aria-label",visible?"Ocultar contraseña":"Mostrar contraseña");
    b.setAttribute("aria-pressed",String(visible));
  });
}
document.addEventListener("DOMContentLoaded",instalarPasswordUI);
