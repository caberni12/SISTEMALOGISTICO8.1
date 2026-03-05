const API="https://script.google.com/macros/s/AKfycbzazTrBFiDteGTNfdhoVFK9bVm20KZTGXukHD1aJpz23TDVcfRbz9J5E0LHFlhY4k4fzw/exec";

let RAW=[];
let FILT=[];
let visibleCount=0;
let EDIT_ROW=null;
let PREVIOUS_IDS=[];
const CHUNK=20;

/* ================= MODAL IMAGEN ================= */

let modalOverlay=document.createElement("div");
modalOverlay.style.position="fixed";
modalOverlay.style.inset="0";
modalOverlay.style.background="rgba(0,0,0,.8)";
modalOverlay.style.display="none";
modalOverlay.style.alignItems="center";
modalOverlay.style.justifyContent="center";
modalOverlay.style.zIndex="99999";

let modalImg=document.createElement("img");
modalImg.style.maxWidth="95vw";
modalImg.style.maxHeight="90vh";
modalImg.style.borderRadius="16px";

modalOverlay.appendChild(modalImg);
document.body.appendChild(modalOverlay);

modalOverlay.onclick=()=>modalOverlay.style.display="none";

function openImageModal(url){
modalImg.src=url;
modalOverlay.style.display="flex";
}

/* ================= FECHA ================= */

function parseFechaSoloDia(str){

if(!str) return null;

const p=str.split("-");
if(p.length!==3) return null;

return new Date(p[0],p[1]-1,p[2]);

}

/* ================= ALERTAS ================= */

function calcularAlertas(r){

if(!r.fechaEntrega) return r;

const ahora=new Date();
const entrega=new Date(r.fechaEntrega);

const diffHoras=(entrega-ahora)/(1000*60*60);
const diffDias=Math.floor((ahora-entrega)/(1000*60*60*24));

if(ahora>entrega && r.status!=="ENTREGADO"){

r.alerta="PEDIDO ATRASADO";
r.semaforo="ROJO";
r.diasAtraso=Math.max(diffDias,1);
r.statusEntrega="ATRASADO";

}

else if(diffHoras<=48 && r.status!=="ENTREGADO"){

r.alerta="ENTREGA EN MENOS DE 48H";
r.semaforo="AMARILLO";
r.diasAtraso=0;
r.statusEntrega="POR VENCER";

}

else{

r.alerta="";
r.semaforo="VERDE";
r.diasAtraso=0;
r.statusEntrega="EN TIEMPO";

}

return r;

}

/* ================= LOADER ================= */

function setLoading(btn,state){

if(!btn) return;

btn.disabled=state;
btn.classList.toggle("loading",state);

}

/* ================= LOAD ================= */

async function load(){

try{

setLoading(btnReload,true);

const r=await fetch(API);
const data=await r.json();

RAW=data.map(row=>{

let obj={

_row:row._row,
fechaIngreso:row.fechaIngreso,
pedido:row.pedido,
tipoDocumento:row.tipoDocumento,
numeroDocumento:row.numeroDocumento,
cliente:row.cliente,
direccion:row.direccion,
comuna:row.comuna,
transporte:row.transporte,
etiquetas:row.etiquetas,
observaciones:row.observaciones,
status:row.status,
fechaEntrega:row.fechaEntrega,
alerta:row.alerta,
statusEntrega:row.statusEntrega,
diasAtraso:row.diasAtraso,
semaforo:row.semaforo,
responsable:row.responsable,
foto:row.foto,
pdf:row.pdf,
pdfTraslado:row.pdfTraslado,

_fechaObj:parseFechaSoloDia(row.fechaIngreso)

};

return calcularAlertas(obj);

});

/* SONIDO NUEVO PEDIDO */

const ids=RAW.map(x=>x._row);

if(PREVIOUS_IDS.length){

const nuevos=ids.filter(x=>!PREVIOUS_IDS.includes(x));

if(nuevos.length){
document.getElementById("alertSound")?.play();
}

}

PREVIOUS_IDS=ids;

applyFilter();

}catch(e){

console.error("ERROR API",e);

}

setLoading(btnReload,false);

}

/* ================= FILTROS ================= */

function applyFilter(){

const texto=fBuscar.value.toLowerCase().trim();
const status=fStatus.value;

const d1=fDesde.value ? new Date(fDesde.value) : null;
const d2=fHasta.value ? new Date(fHasta.value) : null;

FILT=RAW.filter(r=>{

const combo=(r.pedido+" "+r.cliente+" "+r.comuna+" "+r.responsable).toLowerCase();

if(texto && !combo.includes(texto)) return false;
if(status && r.status!==status) return false;

if(d1 || d2){

const fr=r._fechaObj;
if(!fr) return false;

if(d1 && fr<d1) return false;
if(d2 && fr>d2) return false;

}

return true;

});

totalPedidos.textContent=FILT.length;
totalCajas.textContent=FILT.reduce((s,r)=>s+Number(r.etiquetas||0),0);

visibleCount=0;
cardsGrid.innerHTML="";

renderMore();

}

/* ================= STATUS COLORES ================= */

function badgeStatus(status){

const map={
"PENDIENTE":"#2563eb",
"EN RUTA":"#dc2626",
"RECIBIDO":"#7c3aed",
"ENTREGADO":"#16a34a",
"CANCELADO":"#6b7280"
};

return `<span style="
background:${map[status]||"#111"};
color:#fff;
padding:6px 12px;
border-radius:20px;
font-weight:800;
font-size:12px;">${status}</span>`;

}

/* ================= GENERAR TRASLADO ================= */

function generarTraslado(row){

const r=RAW.find(x=>x._row==row);
if(!r) return;

const { jsPDF } = window.jspdf;

const doc=new jsPDF();

doc.setFontSize(18);
doc.text("DOCUMENTO DE TRASLADO",105,20,null,null,"center");

doc.setFontSize(12);

doc.rect(15,30,180,90);

doc.text("Pedido: "+r.pedido,20,45);
doc.text("Cliente: "+r.cliente,20,55);
doc.text("Dirección: "+r.direccion,20,65);
doc.text("Comuna: "+r.comuna,20,75);
doc.text("Responsable: "+(r.responsable||""),20,85);
doc.text("Cajas: "+(r.etiquetas||0),20,95);
doc.text("Fecha Entrega: "+(r.fechaEntrega||""),20,105);

doc.save("traslado_"+r.pedido+".pdf");

}

/* ================= TARJETAS ================= */

function renderMore(){

const fragment=document.createDocumentFragment();

const slice=FILT.slice(visibleCount,visibleCount+CHUNK);

slice.forEach(r=>{

let clase="card";

if(r.semaforo==="AMARILLO") clase+=" card-alerta";
if(r.semaforo==="ROJO") clase+=" card-atraso";

const fotos=(r.foto||"").split("|").filter(u=>u.startsWith("http"));
const pdfs=(r.pdf||"").split("|").filter(u=>u.startsWith("http"));

const mapId="map_"+r._row;

const card=document.createElement("div");
card.className=clase;

card.innerHTML=`

<div class="pedido-numero">#${r.pedido}</div>

<div class="cliente-destacado">${r.cliente}</div>

<div class="estado-wrap">
${badgeStatus(r.status)}
</div>

<div>📅 Ingreso: ${r.fechaIngreso}</div>

${r.fechaEntrega?`<div>🚚 Entrega: ${r.fechaEntrega}</div>`:""}

<div>📍 ${r.direccion} (${r.comuna})</div>

<div>👨‍💼 ${r.responsable||""}</div>

<div class="cajas-box">CAJAS<span>${r.etiquetas||0}</span></div>

${r.alerta?`<div style="margin-top:6px;font-weight:700;color:#dc2626">${r.alerta}</div>`:""}

<div class="photo-wrap">
${fotos.map(f=>`<img src="${f}" onclick="openImageModal('${f}')">`).join("")}
</div>

<div class="pdf-wrap">

${pdfs.map(p=>`<a href="${p}" target="_blank">📄 PDF</a>`).join("")}

${r.pdfTraslado?`<a href="${r.pdfTraslado}" target="_blank" style="background:#dc2626">📦 TRASLADO</a>`:""}

</div>

${r.status==="ENTREGADO" && !r.pdfTraslado ?
`<button onclick="generarTraslado(${r._row})" style="background:#111827;margin-top:10px">📦 Generar Traslado</button>`:""}

<button onclick="toggleMap('${mapId}',this)">🗺 Mostrar mapa</button>

<div class="map-container" id="${mapId}">
<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(r.direccion+" "+r.comuna)}&z=15&output=embed"></iframe>
</div>

<button onclick="openEdit(${r._row})" style="margin-top:10px">✏️ Editar</button>

`;

fragment.appendChild(card);

});

cardsGrid.appendChild(fragment);

visibleCount+=CHUNK;

}

/* ================= EDITAR ================= */

function openEdit(row){

const r=RAW.find(x=>x._row==row);

EDIT_ROW=row;

mFechaIngreso.value=r.fechaIngreso||"";
mPedido.value=r.pedido||"";

mTipoDocumento.value=r.tipoDocumento||"";
mNumeroDocumento.value=r.numeroDocumento||"";

mCliente.value=r.cliente||"";
mDireccion.value=r.direccion||"";

mComuna.value=r.comuna||"";
mTransporte.value=r.transporte||"";

mCajas.value=r.etiquetas||1;
mResponsable.value=r.responsable||"";

mFechaEntrega.value=r.fechaEntrega||"";

mStatus.value=r.status||"";

mStatusEntrega.value=r.statusEntrega||"";
mSemaforo.value=r.semaforo||"";
mDiasAtraso.value=r.diasAtraso||0;

mObservaciones.value=r.observaciones||"";

mFoto.value=r.foto||"";
mPDF.value=r.pdf||"";
mPDFTraslado.value=r.pdfTraslado||"";

editModal.style.display="flex";

}

/* ================= GUARDAR ================= */

async function guardar(){

setLoading(btnGuardar,true);

await fetch(API,{
method:"POST",
body:JSON.stringify({

action:"update",
row:EDIT_ROW,

CLIENTE:mCliente.value,
DIRECCION:mDireccion.value,
COMUNA:mComuna.value,
RESPONSABLE:mResponsable.value,
ETIQUETAS:mCajas.value,
OBSERVACIONES:mObservaciones.value,
STATUS:mStatus.value,
"FECHA ENTREGA":mFechaEntrega.value

})
});

closeEdit();
await load();

setLoading(btnGuardar,false);

}

function closeEdit(){
editModal.style.display="none";
}

/* ================= MAPA ================= */

function toggleMap(id,btn){

const el=document.getElementById(id);

if(!el.style.display || el.style.display==="none"){

el.style.display="block";
btn.textContent="➖ Ocultar mapa";

}else{

el.style.display="none";
btn.textContent="🗺 Mostrar mapa";

}

}

/* ================= EVENTOS ================= */

btnReload.onclick=load;
btnGuardar.onclick=guardar;

fBuscar.oninput=()=>setTimeout(applyFilter,300);
fStatus.onchange=applyFilter;
fDesde.onchange=applyFilter;
fHasta.onchange=applyFilter;

/* ================= REFRESH ================= */

setInterval(load,15000);

setInterval(()=>{
RAW=RAW.map(r=>calcularAlertas(r));
applyFilter();
},60000);

load();
