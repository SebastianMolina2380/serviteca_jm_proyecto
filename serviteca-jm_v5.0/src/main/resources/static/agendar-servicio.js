async function cargarCatalogoServicios(selectId="servicio"){const r=await fetch("/api/servicios",{credentials:"same-origin"});const d=await r.json();if(!r.ok)throw new Error("No se pudo cargar el catálogo.");const s=document.getElementById(selectId);if(s)s.innerHTML=d.filter(x=>x.activo!==false).map(x=>`<option value="${x.idServicio}">${x.tipo} — $${Number(x.precio||0).toLocaleString("es-CO")}</option>`).join("");}
async function agendarServicio({vehiculoId,servicioId,fechaHora}){
 const servicio=await (await fetch(`/api/servicios/${servicioId}`,{credentials:"same-origin"})).json();
 const r=await fetch("/api/citas",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({fecha:fechaHora.slice(0,10),hora:fechaHora.slice(11,16),estado:"PENDIENTE",vehiculo:{idvehiculo:Number(vehiculoId)},usuario:null})});
 if(!r.ok)throw new Error(await r.text());return r.json();
}