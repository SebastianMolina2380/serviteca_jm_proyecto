async function api(url,opts={}){
 const r=await fetch(url,{...opts,credentials:"same-origin",headers:{"Content-Type":"application/json",...(opts.headers||{})}});
 const d=await r.json().catch(()=>[]);
 if(!r.ok)throw new Error(d.error||"No se pudo cargar la información.");
 return d;
}

document.addEventListener("DOMContentLoaded",async()=>{
 const msg=document.getElementById("vehicle-message");
 try{
   const me=await api("/api/auth/me");
   if(String(me.rol||"").toUpperCase()!=="CLIENTE"){location.href="login.html";return;}
   const name=document.getElementById("portal-user-name");if(name)name.textContent=me.nombre||"Cliente";
   await loadPortal();
 }catch(e){if(msg)msg.textContent=e.message;else alert(e.message);}
});

async function loadPortal(){
 const [vehicles,citas,servicios,facturas]=await Promise.all([
   api("/api/mi/vehiculos"),api("/api/mi/citas"),api("/api/mi/servicios"),api("/api/mi/facturas")
 ]);

 const vc=document.getElementById("portal-vehicles");
 if(vc)vc.innerHTML=vehicles.length?vehicles.map(v=>`<div class="ti"><div>🚗</div><div><b>${esc(v.placa)}</b><div>${esc([v.marca,v.modelo,v.color].filter(Boolean).join(" · "))}</div></div><a href="vehiculo.html?id=${encodeURIComponent(v.idvehiculo)}" class="btn-sm">Ver</a></div>`).join(""):"No tienes vehículos registrados.";

 const cc=document.getElementById("portal-citas");
 if(cc)cc.innerHTML=citas.length?citas.map(c=>`<div class="ti"><div>📅</div><div><b>${esc(c.fecha)}</b><div>${esc(String(c.hora||"").slice(0,5))} · ${esc(c.estado||"")}</div></div></div>`).join(""):"No tienes citas.";

 const sc=document.getElementById("portal-servicios");
 if(sc)sc.innerHTML=servicios.length?servicios.map(s=>`<div class="ti"><div>🔧</div><div><b>${esc(s.tipo)}</b><div>${esc(s.estado||"PROGRAMADO")} · ${Number(s.progreso??0)}% · ${money(s.precio)}</div></div></div>`).join(""):"No tienes servicios.";

 const hc=document.getElementById("portal-historial");
 if(hc)hc.innerHTML=servicios.length?servicios.slice().sort((a,b)=>String(b.fechaServicio||"").localeCompare(String(a.fechaServicio||""))).map(s=>`<tr><td>${esc(formatDate(s.fechaServicio))}</td><td>${esc(s.vehiculo?.placa||"—")}</td><td>${esc(s.tipo||"—")}</td><td>${esc(s.estado||"—")}</td><td>${money(s.precio)}</td></tr>`).join(""):`<tr><td colspan="5">Sin historial de mantenimientos.</td></tr>`;

 const fc=document.getElementById("portal-facturas");
 if(fc)fc.innerHTML=facturas.length?facturas.map(f=>`<tr><td>${esc(f.numeroFactura||("JM "+f.idFactura))}</td><td>${esc(formatDate(f.fecha))}</td><td>${esc(f.placa||"—")}</td><td>${money(f.total)}</td><td><button type="button" class="btn-sm-g" data-pdf-invoice="${esc(f.idFactura)}">📄 PDF</button></td></tr>`).join(""):`<tr><td colspan="5">Sin facturas registradas.</td></tr>`;

 document.querySelectorAll(".kpi .kpi-val")[0]?.replaceChildren(document.createTextNode(vehicles.length));
 document.querySelectorAll(".kpi .kpi-val")[1]?.replaceChildren(document.createTextNode(citas.length));
 document.querySelectorAll(".kpi .kpi-val")[2]?.replaceChildren(document.createTextNode(servicios.length));
}

function formatDate(v){if(!v)return "—"; const d=new Date(v); return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString("es-CO");}
function money(v){return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(v)||0);}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

document.addEventListener("click",e=>{
 const b=e.target.closest("[data-pdf-invoice]");
 if(b)window.open(`facturacion.html?factura=${encodeURIComponent(b.dataset.pdfInvoice)}`,"_blank");
});

document.getElementById("add-vehicle-button")?.addEventListener("click",()=>{document.getElementById("vehicle-form")?.removeAttribute("hidden");});
document.getElementById("cancel-vehicle-button")?.addEventListener("click",()=>{document.getElementById("vehicle-form")?.setAttribute("hidden","");});
document.getElementById("vehicle-form")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const f=new FormData(e.currentTarget);
 const body={placa:f.get("placa"),marca:f.get("marca"),modelo:f.get("modelo"),color:f.get("color")};
 const msg=document.getElementById("vehicle-message");
 try{await api("/api/mi/vehiculos",{method:"POST",body:JSON.stringify(body)});e.currentTarget.reset();e.currentTarget.setAttribute("hidden","");if(msg)msg.textContent="Vehículo registrado.";await loadPortal();}
 catch(err){if(msg)msg.textContent=err.message;}

});
document.addEventListener("DOMContentLoaded", () => {
 const nombreUsuario = localStorage.getItem("nombreUsuario");
 const elementoNombre = document.getElementById("nombre-usuario");

 if (elementoNombre && nombreUsuario) {
  elementoNombre.textContent = nombreUsuario;
 }
});