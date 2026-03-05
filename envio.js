/* ================= API ================= */

const API="https://script.google.com/macros/s/AKfycbzazTrBFiDteGTNfdhoVFK9bVm20KZTGXukHD1aJpz23TDVcfRbz9J5E0LHFlhY4k4fzw/exec";

/* ================= DOM ================= */

const tbody=document.getElementById("tbody");

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

/* FOTO MODAL */

const fotoModal=document.getElementById("fotoModal");
const fotoGrande=document.getElementById("fotoGrande");
const btnCerrarFoto=document.getElementById("btnCerrarFoto");
const btnDescargarFoto=document.getElementById("btnDescargarFoto");

/* ================= VARIABLES ================= */

let RAW=[];
let FILT=[];
let charts={};
let EDIT=null;

let KPI_FILTER="";

/* ================= UTILIDADES ================= */

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

function toBase64(file){
return new Promise((resolve,reject)=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result);
reader.onerror=reject;
reader.readAsDataURL(file);
});
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

const desde=fDesde.value?new Date(fDesde.value):null;
const hasta=fHasta.value?new Date(fHasta.value):null;

FILT=RAW.filter(r=>{

const txt=(r.cliente||"").toLowerCase()+(r.pedido||"");

const okText=!q || txt.includes(q);

const okStatus=!fStatus.value || r.status===fStatus.value;

let okFecha=true;

if(desde || hasta){

const fecha=new Date(r.fechaIngreso);

if(desde && fecha<desde) okFecha=false;
if(hasta && fecha>hasta) okFecha=false;

}

let okKpi=true;

if(KPI_FILTER){
okKpi=r.status===KPI_FILTER;
}

return okText && okStatus && okFecha && okKpi;

});

render();
renderKPIs();

}

search.oninput=applyFilters;
fStatus.onchange=applyFilters;
fDesde.onchange=applyFilters;
fHasta.onchange=applyFilters;

/* ================= TABLA ================= */

function render(){

tbody.innerHTML="";

if(!FILT.length){

tbody.innerHTML="<tr><td colspan='19'>Sin datos</td></tr>";
return;

}

FILT.forEach(r=>{

const pdfIcon=r.pdf
? `<a href="${r.pdf}" target="_blank" title="PDF" style="font-size:18px;text-decoration:none">📄</a>`
: "";

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

<td>${pdfIcon}</td>

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

/* ================= ESTADO COLOR ================= */

function renderEstado(status){

let color="#fff";

if(status==="PENDIENTE") color="#facc15";
if(status==="EN RUTA") color="#ef4444";
if(status==="ENTREGADO") color="#22c55e";
if(status==="RECIBIDO") color="#fb923c";
if(status==="CANCELADO") color="#3b82f6";

return `<span style="background:#000;color:${color};padding:3px 10px;border-radius:6px">${status}</span>`;

}

/* ================= KPI ================= */

function renderKPIs(){

const total=RAW.length;

const pendientes=RAW.filter(x=>x.status==="PENDIENTE").length;
const ruta=RAW.filter(x=>x.status==="EN RUTA").length;
const entregado=RAW.filter(x=>x.status==="ENTREGADO").length;

kpis.innerHTML=`

<div class="kpi" onclick="filterKPI('')">
<canvas id="k1"></canvas>
<b>${total}</b>
<div>Total</div>
</div>

<div class="kpi" onclick="filterKPI('PENDIENTE')">
<canvas id="k2"></canvas>
<b>${pendientes}</b>
<div>Pendientes</div>
</div>

<div class="kpi" onclick="filterKPI('EN RUTA')">
<canvas id="k3"></canvas>
<b>${ruta}</b>
<div>En Ruta</div>
</div>

<div class="kpi" onclick="filterKPI('ENTREGADO')">
<canvas id="k4"></canvas>
<b>${entregado}</b>
<div>Entregados</div>
</div>
`;

drawChart("k1",total,total,"#14b8a6");
drawChart("k2",pendientes,total,"#facc15");
drawChart("k3",ruta,total,"#ef4444");
drawChart("k4",entregado,total,"#22c55e");

}

function filterKPI(status){

KPI_FILTER=status;

applyFilters();

}

function drawChart(id,val,total,color){

if(charts[id]) charts[id].destroy();

charts[id]=new Chart(document.getElementById(id),{
type:"doughnut",
data:{
datasets:[{
data:[val,total-val],
backgroundColor:[color,"#e5e7eb"]
}]
},
options:{
cutout:"70%",
plugins:{legend:{display:false}}
}
});

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

mPedido.value="";
mTipoDoc.value="BOLETA";
mNumeroDoc.value="";
mCliente.value="";
mDireccion.value="";
mComuna.value="";
mTransporte.value="";
mCajas.value="";
mStatus.value="PENDIENTE";
mHoraEntrega.value="";
mResponsable.value="";
mObs.value="";

mFotos.value="";
mPdf.value="";

modalForm.style.display="flex";

};

/* ================= CANCELAR ================= */

btnCancelar.onclick=()=>{

modalForm.style.display="none";

};

/* ================= EDITAR ================= */

function openModal(row){

EDIT=RAW.find(x=>x._row===row);

if(!EDIT) return;

modalForm.style.display="flex";

mPedido.value=EDIT.pedido||"";
mTipoDoc.value=EDIT.tipoDocumento||"";
mNumeroDoc.value=EDIT.numeroDocumento||"";
mCliente.value=EDIT.cliente||"";
mDireccion.value=EDIT.direccion||"";
mComuna.value=EDIT.comuna||"";
mTransporte.value=EDIT.transporte||"";
mCajas.value=EDIT.etiquetas||"";
mStatus.value=EDIT.status||"";
mResponsable.value=EDIT.responsable||"";
mObs.value=EDIT.observaciones||"";

}

/* ================= GUARDAR ================= */

btnGuardar.onclick=async()=>{

setLoading(btnGuardar,true);

let foto="";
let pdf="";

if(mFotos.files.length)
foto=await toBase64(mFotos.files[0]);

if(mPdf.files.length)
pdf=await toBase64(mPdf.files[0]);

const payload={

action:EDIT?"update":"add",
row:EDIT?EDIT._row:null,

PEDIDO:mPedido.value,

"TIPO DOCUMENTO":mTipoDoc.value,
"NUMERO DOCUMENTO":mNumeroDoc.value,

CLIENTE:mCliente.value,
DIRECCION:mDireccion.value,
COMUNA:mComuna.value,
TRANSPORTE:mTransporte.value,
ETIQUETAS:mCajas.value,

OBSERVACIONES:mObs.value,
STATUS:mStatus.value,
RESPONSABLE:mResponsable.value,

FOTO:foto,
PDF:pdf

};

await fetch(API,{
method:"POST",
body:JSON.stringify(payload)
});

modalForm.style.display="none";

await load();

setLoading(btnGuardar,false);

};

/* ================= ELIMINAR ================= */

async function deleteRow(row,btn){

if(!confirm("Eliminar pedido?")) return;

setLoading(btn,true);

await fetch(API,{
method:"POST",
body:JSON.stringify({
action:"delete",
row:row
})
});

await load();

setLoading(btn,false);

}

/* ================= EXPORTAR ================= */

btnExcel.onclick=()=>{

let rows=[["Pedido","Cliente","Estado"]];

FILT.forEach(r=>{
rows.push([r.pedido,r.cliente,r.status]);
});

const csv=rows.map(r=>r.join(";")).join("\n");

const blob=new Blob([csv]);
const url=URL.createObjectURL(blob);

const a=document.createElement("a");
a.href=url;
a.download="pedidos.csv";
a.click();

};

btnPDF.onclick=()=>{

const w=window.open("");

let html="<h2>Pedidos</h2><table border=1>";

FILT.forEach(r=>{
html+=`<tr><td>${r.pedido}</td><td>${r.cliente}</td><td>${r.status}</td></tr>`;
});

html+="</table>";

w.document.write(html);
w.print();

};

/* ================= INIT ================= */

load();