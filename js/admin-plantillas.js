/**
 * admin-plantillas.js
 * -----------------------------------------------------------------------
 * Editor visual de coordenadas: el admin carga localmente (sin subir a
 * ningún lado) las imágenes de una plantilla nueva, marca cada caja con
 * clic y arrastre sobre un <canvas>, y al final se guarda el documento
 * completo en Firestore (colección "plantillas").
 * -----------------------------------------------------------------------
 */

import { db } from './firebase-init.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CARD_W, CARD_H, CAMPOS_CAJAS, CARA_DE_CAJA } from './config.js';
import { cargarImagen } from './utilidades.js';

const cajasBorrador = {};
let imgFrenteLocal = null;
let imgReversoLocal = null;

const camposFrente  = CAMPOS_CAJAS.filter(c => CARA_DE_CAJA[c] === 'frente');   // ['nombre_alumno']
const camposReverso = CAMPOS_CAJAS.filter(c => CARA_DE_CAJA[c] === 'reverso');  // los otros 6

function actualizarListaCajas(){
  const pre = document.getElementById('listaCajas');
  const claves = Object.keys(cajasBorrador);
  pre.textContent = claves.length
    ? JSON.stringify(cajasBorrador, null, 2)
    : '(ninguna todavía)';

  const completo = CAMPOS_CAJAS.every(c => cajasBorrador[c]);
  document.getElementById('btnGuardarPlantilla').disabled = !completo;
}

function redibujarCanvas(canvas, img, camposDeEstaCara, rectEnProgreso){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,CARD_W,CARD_H);
  if(img) ctx.drawImage(img, 0, 0, CARD_W, CARD_H);

  ctx.font = '16px monospace';
  camposDeEstaCara.forEach(campo=>{
    const caja = cajasBorrador[campo];
    if(!caja) return;
    ctx.fillStyle = 'rgba(33, 158, 188, 0.18)';
    ctx.strokeStyle = 'rgba(18, 103, 130, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.strokeRect(caja.x, caja.y, caja.w, caja.h);
    ctx.fillStyle = 'rgba(18, 103, 130, 1)';
    ctx.fillText(campo, caja.x + 4, caja.y + 18);
  });

  if(rectEnProgreso){
    ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.fillRect(rectEnProgreso.x, rectEnProgreso.y, rectEnProgreso.w, rectEnProgreso.h);
    ctx.strokeRect(rectEnProgreso.x, rectEnProgreso.y, rectEnProgreso.w, rectEnProgreso.h);
  }
}

/**
 * Conecta el arrastre del mouse sobre un canvas para dibujar una caja y
 * guardarla en cajasBorrador[campo]. `obtenerCampoActivo` es una función
 * porque en el reverso el campo puede cambiar (viene de un <select>).
 */
function activarEditorDeCanvas(canvas, obtenerImagen, camposDeEstaCara, obtenerCampoActivo){
  let arrastrando = false;
  let inicio = null;

  function coordenadasCanvas(ev){
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;
    return {
      x: (ev.clientX - rect.left) * escalaX,
      y: (ev.clientY - rect.top) * escalaY
    };
  }

  canvas.addEventListener('mousedown', (ev)=>{
    if(!obtenerImagen()) return;
    arrastrando = true;
    inicio = coordenadasCanvas(ev);
  });

  canvas.addEventListener('mousemove', (ev)=>{
    if(!arrastrando) return;
    const actual = coordenadasCanvas(ev);
    const rectTemp = {
      x: Math.min(inicio.x, actual.x),
      y: Math.min(inicio.y, actual.y),
      w: Math.abs(actual.x - inicio.x),
      h: Math.abs(actual.y - inicio.y)
    };
    redibujarCanvas(canvas, obtenerImagen(), camposDeEstaCara, rectTemp);
  });

  window.addEventListener('mouseup', (ev)=>{
    if(!arrastrando) return;
    arrastrando = false;
    const actual = coordenadasCanvas(ev);
    const campo = obtenerCampoActivo();
    cajasBorrador[campo] = {
      x: Math.round(Math.min(inicio.x, actual.x)),
      y: Math.round(Math.min(inicio.y, actual.y)),
      w: Math.round(Math.abs(actual.x - inicio.x)),
      h: Math.round(Math.abs(actual.y - inicio.y))
    };
    redibujarCanvas(canvas, obtenerImagen(), camposDeEstaCara, null);
    actualizarListaCajas();
  });
}

function conectarInputArchivo(inputId, canvas, camposDeEstaCara, guardarImagen){
  document.getElementById(inputId).addEventListener('change', async (ev)=>{
    const archivo = ev.target.files[0];
    if(!archivo) return;
    const url = URL.createObjectURL(archivo);
    const img = await cargarImagen(url);
    guardarImagen(img);
    redibujarCanvas(canvas, img, camposDeEstaCara, null);
  });
}

export function inicializarEditorDePlantillas(){
  const canvasFrente = document.getElementById('canvasEditorFrente');
  const canvasReverso = document.getElementById('canvasEditorReverso');
  const selectCampoReverso = document.getElementById('campoActivoReverso');

  conectarInputArchivo('archivoFrente', canvasFrente, camposFrente, (img)=> imgFrenteLocal = img);
  conectarInputArchivo('archivoReverso', canvasReverso, camposReverso, (img)=> imgReversoLocal = img);

  // El frente solo tiene un campo (nombre_alumno), así que no necesita selector.
  activarEditorDeCanvas(canvasFrente, ()=>imgFrenteLocal, camposFrente, ()=>'nombre_alumno');

  // El reverso usa el <select> para saber qué campo se está marcando.
  activarEditorDeCanvas(canvasReverso, ()=>imgReversoLocal, camposReverso, ()=>selectCampoReverso.value);

  document.getElementById('btnGuardarPlantilla').addEventListener('click', guardarPlantilla);
}

async function guardarPlantilla(){
  const msg = document.getElementById('plantillaMsg');
  const clave = document.getElementById('pClave').value.trim();
  const nombre = document.getElementById('pNombre').value.trim();
  const frente = document.getElementById('pFrenteRuta').value.trim();
  const reverso = document.getElementById('pReversoRuta').value.trim();
  const activo = document.getElementById('pActivo').checked;

  if(!clave || !nombre || !frente || !reverso){
    msg.textContent = 'Completa clave, nombre y las dos rutas de imagen.';
    msg.className = 'modal-msg err';
    return;
  }
  if(!CAMPOS_CAJAS.every(c => cajasBorrador[c])){
    msg.textContent = 'Todavía faltan cajas por marcar.';
    msg.className = 'modal-msg err';
    return;
  }

  msg.textContent = 'Guardando en Firestore...';
  msg.className = 'modal-msg';

  try{
    await setDoc(doc(db, 'plantillas', clave), {
      nombre, frente, reverso, activo,
      cajas: { ...cajasBorrador }
    });
    msg.textContent = `✅ Plantilla "${clave}" guardada. Recuerda subir las imágenes a esas rutas en GitHub.`;
    msg.className = 'modal-msg';
  }catch(err){
    console.error(err);
    msg.textContent = 'No se pudo guardar (revisa que tu sesión siga activa).';
    msg.className = 'modal-msg err';
  }
}
