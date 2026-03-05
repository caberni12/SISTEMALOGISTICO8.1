/* ================= API ================= */

const API="https://script.google.com/macros/s/AKfycbzazTrBFiDteGTNfdhoVFK9bVm20KZTGXukHD1aJpz23TDVcfRbz9J5E0LHFlhY4k4fzw/exec";

/* ================= DOM ================= */

const tbody=document.getElementById("tbody");
const mobileList=document.getElementById("mobileList");

const search=document.getElementById("search");
const fStatus=document.getElementById("fStatus");
const fDesde=document.getElementById("fDesde");
const fHasta=document.getElementById("fHasta");

const btnReload=document.getElementById("btnReload");
const btnNuevo=document.getElementById("btnNuevo");
const btnGuardar=document.getElementById("btnGuardar");
const btnCancelar=document.getElementById("btnCancelar");

const btnPDF=document.getElementById("btnPDF");
const btnExcel=document.getElementById("btnExcel");

const modalForm=document.getElementById("modalForm");

const mPedido=document.getElementById("mPedido");
const mTipoDoc=document.getElementById("mTipoDoc");
const mNumeroDoc=document.getElementById("mNumeroDoc");
const mCliente=document.getElementById("mCliente");
const mDireccion=document.getElementById("mDireccion");
const mComuna=document.getElementById("mComuna");
const mTransporte=document.getElementById("mTransporte");
const mCajas=document.getElementById("mCajas");
const mStatus=document.getElementById("mStatus");
const mHoraEntrega=document.getElementById("mHoraEntrega");
const mResponsable=document.getElementById("mResponsable");
const mObs=document.getElementById("mObs");

const mFotos=document.getElementById("mFotos");
const mPdf=document.getElementById("mPdf");

const kpis=document.getElementById("kpis");

const fotoModal=document.getElementById("fotoModal");
const fotoGrande=document.getElementById("fotoGrande");
const btnCerrarFoto=document.getElementById("btnCerrarFoto");
const btnDescargarFoto=document.getElementById("btnDescargarFoto");

/* ================= VARIABLES ================= */

let RAW=[];
let FILT=[];
let EDIT=null;
let charts={};

/* ================= UTIL ================= */

function setLoading(btn,state){

if(!btn) return;

if(state){
btn.classList.add("loading");
btn.disabled=true;
}else{
btn.classList.remove("loading");
btn.disabled=false;
}

}

function formatDate(d){
if(!d) return "";
return new Date(d).toLocaleDateString("es-CL");
}

function renderEstado(status){

let color="#fff";

if(status==="PENDIENTE") color="#facc15";
if(status==="EN RUTA") color="#ef4444";
if(status==="ENTREGADO") color="#22c55e";
if(status==="RECIBIDO") color="#fb923c";
if(status==="CANCELADO") color="#3b82f6";

return `<span style="background:#000;color:${color};padding:3px 8px;border-radius:6px">${status}</span>`;

}

/* ================= LOAD ================= */

async function load(){

setLoading(btnReload,true);

try{

const res=await fetch(API);
RAW=await res.json();

if(!Array.isArray(RAW)) RAW=[];

applyFilters();

}catch(err){

console.error(err);

}

setLoading(btnReload,false);

}

/* ================= FILTROS ================= */

function applyFilters(){

const q=(search.value||"").toLowerCase();

FILT=RAW.filter(r=>{

const txt=(r.cliente||"").toLowerCase()+(r.pedido||"");

const okText=!q || txt.includes(q);

const okStatus=!fStatus.value || r.status===fStatus.value;

return okText && okStatus;

});

render();

}

search.oninput=applyFilters;
fStatus.onchange=applyFilters;

/* ================= RENDER ================= */

function render(){

renderTable();
renderCards();
renderKPIs();

}

/* ================= TABLA ================= */

function renderTable(){

tbody.innerHTML="";

if(!FILT.length){

tbody.innerHTML="<tr><td colspan='19'>Sin datos</td></tr>";
return;

}

FILT.forEach(r=>{

const tr=`

<tr>

<td>${formatDate(r.fechaIngreso)}</td>
<td>${r.pedido||""}</td>
<td>${r.tipoDocumento||""}</td>
<td>${r.numeroDocumento||""}</td>
<td>${r.cliente||""}</td>
<td>${r.direccion||""}</td>
<td>${r.comuna||""}</td>
<td>${r.transporte||""}</td>
<td>${r.etiquetas||""}</td>
<td>${renderEstado(r.status)}</td>
<td>${r.fechaEntrega||""}</td>
<td>${r.alerta||""}</td>
<td>${r.diasAtraso||""}</td>
<td>${r.semaforo||""}</td>
<td>${r.responsable||""}</td>

<td>${r.foto?`<img src="${r.foto}" class="foto-thumb" onclick="verFoto('${r.foto}')">`:""}</td>

<td>${r.pdf?`<a href="${r.pdf}" target="_blank">📄</a>`:""}</td>

<td>${r.pdfTraslado?`<a href="${r.pdfTraslado}" target="_blank">📄</a>`:""}</td>

<td class="actions">

<button onclick="openModal(${r._row})">✏️</button>
<button onclick="deleteRow(${r._row},this)">🗑️</button>

</td>

</tr>
`;

tbody.insertAdjacentHTML("beforeend",tr);

});

}

/* ================= TARJETAS MOBILE ================= */

function renderCards(){

mobileList.innerHTML="";

FILT.forEach(r=>{

const card=`

<div class="card">

<div class="card-title">

Pedido #${r.pedido||""}

${renderEstado(r.status)}

</div>

<div><b>Cliente:</b> ${r.cliente||""}</div>
<div><b>Dirección:</b> ${r.direccion||""}</div>
<div><b>Comuna:</b> ${r.comuna||""}</div>
<div><b>Transporte:</b> ${r.transporte||""}</div>
<div><b>Cajas:</b> ${r.etiquetas||""}</div>
<div><b>Responsable:</b> ${r.responsable||""}</div>

<div style="margin-top:8px">

${r.foto?`<img src="${r.foto}" class="foto-thumb" onclick="verFoto('${r.foto}')">`:""}

</div>

<div style="margin-top:10px;display:flex;gap:6px">

<button onclick="openModal(${r._row})">Editar</button>
<button onclick="deleteRow(${r._row},this)">Eliminar</button>

</div>

</div>

`;

mobileList.insertAdjacentHTML("beforeend",card);

});

}

/* ================= KPIS ================= */

function renderKPIs(){

const total=RAW.length;
const pendientes=RAW.filter(x=>x.status==="PENDIENTE").length;
const ruta=RAW.filter(x=>x.status==="EN RUTA").length;
const entregado=RAW.filter(x=>x.status==="ENTREGADO").length;

kpis.innerHTML=`

<div class="kpi"><canvas id="k1"></canvas><b>${total}</b><div>Total</div></div>
<div class="kpi"><canvas id="k2"></canvas><b>${pendientes}</b><div>Pendiente</div></div>
<div class="kpi"><canvas id="k3"></canvas><b>${ruta}</b><div>En Ruta</div></div>
<div class="kpi"><canvas id="k4"></canvas><b>${entregado}</b><div>Entregado</div></div>

`;

}

/* ================= FOTO ================= */

function verFoto(src){

fotoGrande.src=src;

btnDescargarFoto.onclick=()=>{
window.open(src);
};

fotoModal.style.display="flex";

}

btnCerrarFoto.onclick=()=>{

fotoModal.style.display="none";

};

/* ================= NUEVO ================= */

btnNuevo.onclick=()=>{

EDIT=null;
modalForm.style.display="flex";

};

/* ================= CANCELAR ================= */

btnCancelar.onclick=()=>{

modalForm.style.display="none";

};

/* ================= INIT ================= */

load();