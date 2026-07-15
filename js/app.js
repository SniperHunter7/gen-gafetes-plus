/**
 * app.js
 * -----------------------------------------------------------------------
 * Punto de entrada de index.html (único <script type="module">). Conecta
 * el formulario, el selector de plantillas y los botones con el catálogo
 * de Firestore, el motor de renderizado, la validación del código de
 * impresión, y la generación del PDF.
 * -----------------------------------------------------------------------
 */

import { cargarCatalogoPlantillas } from './plantillas.js';
import { dibujarFrente, dibujarReverso } from './canvas.js';
import { generarPDF } from './pdf.js';
import { validarYCanjearCodigo } from './codigos.js';
import { conRetraso } from './utilidades.js';
import { RETRASO_PREVIEW_MS, CORREO_SOLICITUDES } from './config.js';

const CAMPOS_FORMULARIO = ['nombre','escuela','maestra','grado','telPapa','telMama','direccion'];

let CATALOGO_PLANTILLAS = {};

function obtenerDatosFormulario(){
  return {
    nombre:     document.getElementById('nombre').value.trim(),
    escuela:    document.getElementById('escuela').value.trim(),
    maestra:    document.getElementById('maestra').value.trim(),
    grado:      document.getElementById('grado').value.trim(),
    telPapa:    document.getElementById('telPapa').value.trim(),
    telMama:    document.getElementById('telMama').value.trim(),
    direccion:  document.getElementById('direccion').value.trim()
  };
}

function obtenerPlantillaActiva(){
  const clave = document.getElementById('plantilla').value;
  return CATALOGO_PLANTILLAS[clave];
}

function poblarSelectorPlantillas(){
  const sel = document.getElementById('plantilla');
  sel.innerHTML = '';

  const CLAVE_POR_DEFECTO = 'juguetes'; // clave de "Diseño Genérico"

  const plantillas = Object.values(CATALOGO_PLANTILLAS);
  const porDefecto = plantillas.find(p => p.clave === CLAVE_POR_DEFECTO);
  const resto = plantillas
    .filter(p => p.clave !== CLAVE_POR_DEFECTO)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const enOrden = porDefecto ? [porDefecto, ...resto] : resto;

  enOrden.forEach(plantilla=>{
    const opt = document.createElement('option');
    opt.value = plantilla.clave;
    opt.textContent = plantilla.nombre;
    sel.appendChild(opt);
  });
}

function limpiarFormulario(){
  CAMPOS_FORMULARIO.forEach(id=>{
    document.getElementById(id).value = '';
  });
  const statusEl = document.getElementById('status');
  statusEl.textContent = '';
  statusEl.className = '';
  actualizarPrevisualizacion();
}

async function actualizarPrevisualizacion(){
  const plantilla = obtenerPlantillaActiva();
  if(!plantilla) return;
  const datos = obtenerDatosFormulario();

  const canvasFront = document.getElementById('canvasFront');
  const canvasBack  = document.getElementById('canvasBack');
  const ctxFront = canvasFront.getContext('2d');
  const ctxBack  = canvasBack.getContext('2d');

  try{
    const { imgFrente, imgReverso } = await plantilla.obtenerImagenes();
    await dibujarFrente(ctxFront, imgFrente, datos.nombre, plantilla);
    await dibujarReverso(ctxBack, imgReverso, datos, plantilla);
  }catch(err){
    console.error('No se pudo previsualizar:', err);
  }
}

const previsualizacionConRetraso = conRetraso(actualizarPrevisualizacion, RETRASO_PREVIEW_MS);

// ---------------- Modal del código de impresión ----------------

function abrirModalCodigo(){
  const modal = document.getElementById('modalCodigo');
  const input = document.getElementById('inputCodigo');
  const msg = document.getElementById('modalCodigoMsg');
  msg.textContent = '';
  msg.className = 'modal-msg';
  input.value = '';
  modal.style.display = 'flex';
  input.focus();
}

function cerrarModalCodigo(){
  document.getElementById('modalCodigo').style.display = 'none';
}

async function confirmarCodigoYGenerar(){
  const msg = document.getElementById('modalCodigoMsg');
  const input = document.getElementById('inputCodigo');
  const btnConfirmar = document.getElementById('btnConfirmarCodigo');

  msg.textContent = 'Validando código...';
  msg.className = 'modal-msg';
  btnConfirmar.disabled = true;

  const resultado = await validarYCanjearCodigo(input.value);

  btnConfirmar.disabled = false;

  if(!resultado.ok){
    msg.textContent = resultado.mensaje;
    msg.className = 'modal-msg err';
    return;
  }

  // Código válido y ya marcado como usado: ahora sí generamos el PDF.
  cerrarModalCodigo();
  await generarPDFConDatosActuales();
}

// ---------------- Modal de solicitud de plantilla nueva ----------------

function abrirModalSolicitud(){
  const modal = document.getElementById('modalSolicitud');
  const texto = document.getElementById('textoSolicitudPlantilla');
  const msg = document.getElementById('modalSolicitudMsg');
  texto.value = '';
  msg.textContent = '';
  msg.className = 'modal-msg';
  modal.style.display = 'flex';
  texto.focus();
}

function cerrarModalSolicitud(){
  document.getElementById('modalSolicitud').style.display = 'none';
}

function alEnviarSolicitud(){
  const texto = document.getElementById('textoSolicitudPlantilla').value.trim();
  const msg = document.getElementById('modalSolicitudMsg');

  if(!texto){
    msg.textContent = 'Cuéntanos aunque sea brevemente qué diseño buscas.';
    msg.className = 'modal-msg err';
    return;
  }

  const asunto = 'Solicito una plantilla nueva de gafete';
  const cuerpo = `Hola, me gustaría solicitar una plantilla nueva con estas características:\n\n${texto}`;
  const enlace = `mailto:${CORREO_SOLICITUDES}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

  window.location.href = enlace;
  cerrarModalSolicitud();
}

// ---------------- Generación real del PDF ----------------

async function generarPDFConDatosActuales(){
  const statusEl = document.getElementById('status');
  const plantilla = obtenerPlantillaActiva();
  const datos = obtenerDatosFormulario();

  statusEl.textContent = 'Generando PDF...';
  statusEl.className = '';

  try{
    const { imgFrente, imgReverso } = await plantilla.obtenerImagenes();

    const canvasFront = document.getElementById('canvasFront');
    const canvasBack  = document.getElementById('canvasBack');
    const ctxFront = canvasFront.getContext('2d');
    const ctxBack  = canvasBack.getContext('2d');

    await dibujarFrente(ctxFront, imgFrente, datos.nombre, plantilla);
    await dibujarReverso(ctxBack, imgReverso, datos, plantilla);

    const nombreArchivo = `gafete_${datos.nombre.replace(/\s+/g,'_')}`;
    generarPDF(canvasFront, canvasBack, nombreArchivo);

    statusEl.textContent = '✅ PDF generado y descargado. Borrando los datos del formulario...';
    statusEl.className = 'ok';

    setTimeout(()=>{
      for(const clave in datos){ datos[clave] = null; }
      limpiarFormulario();
      statusEl.textContent = '✅ PDF descargado. Los datos capturados fueron eliminados de esta página.';
      statusEl.className = 'ok';
    }, 900);

  }catch(err){
    console.error(err);
    statusEl.textContent = 'Ocurrió un error generando el PDF: ' + err.message;
    statusEl.className = 'err';
  }
}

/** Clic en "Generar PDF": valida que haya nombre, y abre el modal del código. */
function alClicGenerar(){
  const statusEl = document.getElementById('status');
  statusEl.className = '';
  statusEl.textContent = '';

  const datos = obtenerDatosFormulario();
  if(!datos.nombre){
    statusEl.textContent = 'Falta el nombre del alumno(a).';
    statusEl.className = 'err';
    return;
  }
  abrirModalCodigo();
}

// ---------------- Inicialización ----------------

function inicializarEventos(){
  document.getElementById('btnLimpiar').addEventListener('click', limpiarFormulario);
  document.getElementById('btnGenerar').addEventListener('click', alClicGenerar);
  document.getElementById('plantilla').addEventListener('change', actualizarPrevisualizacion);

  document.getElementById('btnConfirmarCodigo').addEventListener('click', confirmarCodigoYGenerar);
  document.getElementById('btnCancelarCodigo').addEventListener('click', cerrarModalCodigo);
  document.getElementById('inputCodigo').addEventListener('keydown', (ev)=>{
    if(ev.key === 'Enter') confirmarCodigoYGenerar();
  });

  document.getElementById('btnSolicitarPlantilla').addEventListener('click', abrirModalSolicitud);
  document.getElementById('btnEnviarSolicitud').addEventListener('click', alEnviarSolicitud);
  document.getElementById('btnCancelarSolicitud').addEventListener('click', cerrarModalSolicitud);

  CAMPOS_FORMULARIO.forEach(id=>{
    document.getElementById(id).addEventListener('input', previsualizacionConRetraso);
  });
}

async function iniciarAplicacion(){
  inicializarEventos();

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Cargando catálogo de plantillas...';

  try{
    CATALOGO_PLANTILLAS = await cargarCatalogoPlantillas();
    poblarSelectorPlantillas();
    statusEl.textContent = '';
    await actualizarPrevisualizacion();
  }catch(err){
    console.error('No se pudo cargar el catálogo de plantillas:', err);
    statusEl.textContent = 'No se pudo cargar el catálogo de plantillas. Intenta recargar la página.';
    statusEl.className = 'err';
  }
}

document.addEventListener('DOMContentLoaded', iniciarAplicacion);
