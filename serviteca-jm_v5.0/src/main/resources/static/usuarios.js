const API="/api/usuarios";

document.addEventListener("DOMContentLoaded",async()=>{
 const d=document.getElementById("tbdate");if(d)d.textContent=new Date().toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
 try{await cargarUsuarios();}catch(e){mostrarError(e.message);}
});
async function cargarUsuarios(){
 const r=await fetch(API,{credentials:"same-origin"});
 if(r.status===401||r.status===403){location.href="login.html";return;}
 const data=await r.json();if(!r.ok)throw new Error(data.error||"No se pudieron cargar los usuarios.");
 const tbody=document.getElementById("tbody-usuarios");if(!tbody)return;
 tbody.innerHTML=data.length?data.map(u=>{
  const rol=String(u.rol||"").toUpperCase();const estado=String(u.estado||"ACTIVO").toUpperCase();
  return `<tr><td>${esc(u.nombre)}</td><td>${esc(u.correo)}</td><td><span class="badge ${rol==="ADMIN"?"badge-yellow":rol==="TECNICO"?"badge-orange":"badge-green"}">${esc(rol)}</span></td><td><span class="badge ${estado==="ACTIVO"?"badge-green":"badge-red"}">${esc(estado)}</span></td><td>${u.ultimoAcceso?new Date(u.ultimoAcceso).toLocaleString("es-CO"):"Nunca"}</td><td style="display:flex;gap:5px"><button type="button" class="btn-sm-g" data-edit="${esc(u.idusuario)}">✏️ Editar</button><button type="button" class="btn-sm-g" data-toggle-state="${esc(u.idusuario)}" data-state="${esc(estado)}">${estado==="ACTIVO"?"🔒 Bloquear":"🔓 Activar"}</button></td></tr>`;
 }).join(""):`<tr><td colspan="6">No hay usuarios registrados.</td></tr>`;
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function mostrarError(m){const t=document.getElementById("tbody-usuarios");if(t)t.innerHTML=`<tr><td colspan="6">${esc(m)}</td></tr>`;}

document.addEventListener("click",async e=>{
 const toggle=e.target.closest("[data-toggle-state]");
 if(toggle){
  const id=toggle.dataset.toggleState;const next=toggle.dataset.state==="ACTIVO"?"INACTIVO":"ACTIVO";
  if(!confirm(`${next==="ACTIVO"?"¿Activar":"¿Bloquear"} este usuario?`))return;
  try{const r=await fetch(`${API}/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({estado:next})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"No se pudo actualizar el estado.");await cargarUsuarios();}catch(err){alert(err.message);}return;
 }
 const del=e.target.closest("[data-delete]");
 if(del){if(!confirm("¿Eliminar este usuario?"))return;const r=await fetch(`${API}/${del.dataset.delete}`,{method:"DELETE",credentials:"same-origin"});if(!r.ok)alert("No se pudo eliminar.");else await cargarUsuarios();return;}
 const edit=e.target.closest("[data-edit]");if(edit)location.href=`nuevo-usuario.html?id=${edit.dataset.edit}`;
});
