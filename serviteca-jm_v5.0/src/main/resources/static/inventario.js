const inventarioToken = localStorage.getItem("servitecaToken");
const inventarioUser = JSON.parse(localStorage.getItem("servitecaUser") || "null");
let inventarioData = [];
const MIN_STOCK = 5;
function inventoryHeaders(){return {"Content-Type":"application/json"};}
function renderInventario(){
  const lowStock=inventarioData.filter(i=>Number(i.cantidad||0)<=MIN_STOCK);
  const warning=document.querySelector(".pg > div[style*='background']");
  if(warning) warning.innerHTML=lowStock.length?`⚠️ <strong>${lowStock.length} repuestos</strong> están por debajo del stock mínimo (${MIN_STOCK}).`:`✅ No hay repuestos por debajo del stock mínimo.`;
  document.getElementById("tbody-inventario").innerHTML=inventarioData.length?inventarioData.map(item=>{
    const low=Number(item.cantidad||0)<=MIN_STOCK;
    const name=item.nombre||item.producto?.nombreProducto||"Producto";
    const price=item.precioUnit??item.producto?.precioProducto??0;
    return `<tr><td${low?' style="color:var(--red);font-weight:700"':''}>${name}</td><td>${item.producto?.descripcionProducto||"Repuesto"}</td><td${low?' style="color:var(--red);font-weight:700"':''}>${item.cantidad||0}</td><td>${MIN_STOCK}</td><td>${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(price)||0)}</td><td><span class="badge ${low?'br':'bg'}">${low?'⚠️ Bajo':'OK'}</span></td><td style="display:flex;gap:5px"><button type="button" class="btn-sm-g" data-stock-id="${item.idInventario}" data-stock-change="1">+ Entrada</button><button type="button" class="btn-sm-g" data-stock-id="${item.idInventario}" data-stock-change="-1">- Salida</button>${inventarioUser?.rol==='admin'?`<button type="button" class="btn-sm-g" data-delete-stock="${item.idInventario}">🗑</button>`:''}</td></tr>`;
  }).join(""): `<tr><td colspan="7">No hay inventario registrado.</td></tr>`;
}
async function loadInventario(){
  if(!inventarioToken){location.href='login.html';return;}
  const response=await fetch('/api/inventarios',{headers:inventoryHeaders(),credentials:'same-origin'});
  const data=await response.json().catch(()=>[]); if(!response.ok) throw new Error(data?.error||'No se pudo cargar el inventario.');
  inventarioData=Array.isArray(data)?data:[]; renderInventario();
}
async function updateStock(id,change){
  const item=inventarioData.find(x=>x.idInventario===Number(id)); if(!item)return;
  const quantity=Math.max(0,Number(item.cantidad||0)+Number(change));
  const response=await fetch(`/api/inventarios/${id}`,{method:'PUT',headers:inventoryHeaders(),credentials:'same-origin',body:JSON.stringify({cantidad:quantity,nombre:item.nombre,precioUnit:item.precioUnit,producto:item.producto})});
  if(!response.ok) throw new Error((await response.text())||'No se pudo actualizar el stock.'); await loadInventario();
}
async function deleteStock(id){if(inventarioUser?.rol!=='admin')return;if(!confirm('¿Eliminar este repuesto?'))return;const response=await fetch(`/api/inventarios/${id}`,{method:'DELETE',credentials:'same-origin'});if(!response.ok)throw new Error('No se pudo eliminar el repuesto.');await loadInventario();}
document.addEventListener('click',e=>{const s=e.target.closest('[data-stock-id]');const d=e.target.closest('[data-delete-stock]');if(s)updateStock(s.dataset.stockId,s.dataset.stockChange).catch(x=>alert(x.message));if(d)deleteStock(d.dataset.deleteStock).catch(x=>alert(x.message));});
document.addEventListener('DOMContentLoaded',()=>loadInventario().catch(e=>alert(e.message)));
