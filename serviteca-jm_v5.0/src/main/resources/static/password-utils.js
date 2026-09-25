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
    const input=document.querySelector(b.dataset.togglePassword); if(!input)return;
    input.type=input.type==="password"?"text":"password";
    b.textContent=input.type==="password"?"👁":"🙈";
  });
}
document.addEventListener("DOMContentLoaded",instalarPasswordUI);