/**
 * admin-debug.js
 * -----------------------------------------------------------------------
 * Previsualización de plantillas dentro del panel admin, con edición
 * interactiva de las cajas de texto:
 *
 * - Frente (1 caja): al mostrar cajas, queda directamente movible y
 *   redimensionable con el mouse.
 * - Reverso (6 cajas): por defecto también movibles/redimensionables;
 *   con el checkbox "Redibujar" activado, en vez de mover, cualquier
 *   clic-y-arrastre reemplaza por completo la caja seleccionada en el
 *   <select> (igual que el editor de plantillas nuevas).
 *
 * Los cambios solo se guardan en Firestore al presionar
 * "Guardar cambios de coordenadas" (actualiza únicamente el campo "cajas").
 * -----------------------------------------------------------------------
 */

import { db } from './firebase-init.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { cargarCatalogoPlantillasTodas } from './plantillas.js';
import { dibujarFrente, dibujarReverso } from './canvas.js';
import { CARD_W, CARD_H, CAMPOS_CAJAS, CARA_DE_CAJA } from './config.js';

const CAMPOS_FRENTE  = CAMPOS_CAJAS.filter(c => CARA_DE_CAJA[c] === 'frente');   // ['nombre_alumno']
const CAMPOS_REVERSO = CAMPOS_CAJAS.filter(c => CARA_DE_CAJA[c] === 'reverso'); // los otros 6

const TOLERANCIA_ESQUINA = 14;
const TAMANO_MINIMO_CAJA = 20;

let catalogoDebug = {};
let claveActual = null;
let cajasTrabajo = null;   // copia editable de plantilla.cajas
let mostrarCajas = false;
let hayCambios = false;

// Estado de interacción por canvas (separado porque frente y reverso son independientes)
const estadoFrente  = crearEstadoInteraccion();
const estadoReverso = crearEstadoInteraccion();

function crearEstadoInteraccion(){
  return {
    seleccionada: null,   // nombre del campo seleccionado (reverso) o fijo (frente)
    modo: null,           // 'mover' | 'redimensionar' | 'dibujar' | null
    esquina: null,        // 'nw' | 'ne' | 'sw' | 'se'
    offset: { dx:0, dy:0 },
    inicioDibujo: null
  };
}

// ---------------- Utilidades geométricas ----------------

function puntoDentroDeCaja(px, py, caja){
  return px >= caja.x && px <= caja.x + caja.w && py >= caja.y && py <= caja.y + caja.h;
}

function esquinaCercana(px, py, caja){
  const esquinas = {
    nw: { x: caja.x,         y: caja.y },
    ne: { x: caja.x + caja.w, y: caja.y },
    sw: { x: caja.x,         y: caja.y + caja.h },
    se: { x: caja.x + caja.w, y: caja.y + caja.h }
  };
  for(const [nombre, pt] of Object.entries(esquinas)){
    if(Math.abs(px - pt.x) <= TOLERANCIA_ESQUINA && Math.abs(py - pt.y) <= TOLERANCIA_ESQUINA){
      return nombre;
    }
  }
  return null;
}

function normalizarRect(inicio, fin){
  return {
    x: Math.round(Math.min(inicio.x, fin.x)),
    y: Math.round(Math.min(inicio.y, fin.y)),
    w: Math.round(Math.abs(fin.x - inicio.x)),
    h: Math.round(Math.abs(fin.y - inicio.y))
  };
}

function redimensionarCaja(caja, esquina, px, py){
  let x = caja.x, y = caja.y, x2 = caja.x + caja.w, y2 = caja.y + caja.h;
  if(esquina === 'nw'){ x = px; y = py; }
  if(esquina === 'ne'){ x2 = px; y = py; }
  if(esquina === 'sw'){ x = px; y2 = py; }
  if(esquina === 'se'){ x2 = px; y2 = py; }

  if(x2 - x < TAMANO_MINIMO_CAJA){
    if(esquina === 'nw' || esquina === 'sw') x = x2 - TAMANO_MINIMO_CAJA;
    else x2 = x + TAMANO_MINIMO_CAJA;
  }
  if(y2 - y < TAMANO_MINIMO_CAJA){
    if(esquina === 'nw' || esquina === 'ne') y = y2 - TAMANO_MINIMO_CAJA;
    else y2 = y + TAMANO_MINIMO_CAJA;
  }

  return {
    x: Math.round(Math.min(x, x2)), y: Math.round(Math.min(y, y2)),
    w: Math.round(Math.abs(x2 - x)), h: Math.round(Math.abs(y2 - y))
  };
}

function buscarCajaBajoPuntero(campos, px, py){
  // De atrás hacia adelante: la última en la lista se considera "más arriba".
  for(let i = campos.length - 1; i >= 0; i--){
    const campo = campos[i];
    if(puntoDentroDeCaja(px, py, cajasTrabajo[campo])) return campo;
  }
  return null;
}

function coordenadasCanvas(canvas, ev){
  const rect = canvas.getBoundingClientRect();
  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * escalaX, y: (ev.clientY - rect.top) * escalaY };
}

// ---------------- Dibujo del overlay interactivo ----------------

function dibujarOverlay(ctx, campos, estado, rectEnProgreso){
  ctx.save();
  ctx.font = '16px monospace';
  campos.forEach(campo=>{
    const caja = cajasTrabajo[campo];
    const seleccionada = campo === estado.seleccionada;
    ctx.fillStyle = seleccionada ? 'rgba(37, 99, 235, 0.18)' : 'rgba(220, 38, 38, 0.15)';
    ctx.strokeStyle = seleccionada ? 'rgba(29, 78, 216, 0.95)' : 'rgba(220, 38, 38, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.strokeRect(caja.x, caja.y, caja.w, caja.h);
    ctx.fillStyle = seleccionada ? 'rgba(29, 78, 216, 1)' : 'rgba(153, 27, 27, 1)';
    ctx.fillText(campo, caja.x + 4, caja.y + 18);

    if(seleccionada){
      const esquinas = [
        [caja.x, caja.y], [caja.x + caja.w, caja.y],
        [caja.x, caja.y + caja.h], [caja.x + caja.w, caja.y + caja.h]
      ];
      ctx.fillStyle = '#1D4ED8';
      esquinas.forEach(([ex,ey])=>{
        ctx.fillRect(ex - 5, ey - 5, 10, 10);
      });
    }
  });

  if(rectEnProgreso){
    ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.fillRect(rectEnProgreso.x, rectEnProgreso.y, rectEnProgreso.w, rectEnProgreso.h);
    ctx.strokeRect(rectEnProgreso.x, rectEnProgreso.y, rectEnProgreso.w, rectEnProgreso.h);
  }
  ctx.restore();
}

async function redibujarFrente(rectEnProgreso){
  const plantilla = obtenerPlantillaSeleccionada();
  if(!plantilla) return;
  const canvas = document.getElementById('canvasDebugFrente');
  const ctx = canvas.getContext('2d');
  const { imgFrente } = await plantilla.obtenerImagenes();
  await dibujarFrente(ctx, imgFrente, 'Nombre de ejemplo', { ...plantilla, cajas: cajasTrabajo }, false);
  if(mostrarCajas) dibujarOverlay(ctx, CAMPOS_FRENTE, estadoFrente, rectEnProgreso);
}

async function redibujarReverso(rectEnProgreso){
  const plantilla = obtenerPlantillaSeleccionada();
  if(!plantilla) return;
  const canvas = document.getElementById('canvasDebugReverso');
  const ctx = canvas.getContext('2d');
  const { imgReverso } = await plantilla.obtenerImagenes();
  const datosEjemplo = {
    escuela: 'Nombre de la escuela', maestra: 'Nombre de la maestra',
    grado: 'Grado y grupo', telPapa: 'Teléfono papá', telMama: 'Teléfono mamá',
    direccion: 'Dirección de ejemplo'
  };
  await dibujarReverso(ctx, imgReverso, datosEjemplo, { ...plantilla, cajas: cajasTrabajo }, false);
  if(mostrarCajas) dibujarOverlay(ctx, CAMPOS_REVERSO, estadoReverso, rectEnProgreso);
}

function obtenerPlantillaSeleccionada(){
  return catalogoDebug[claveActual];
}

function marcarCambio(){
  hayCambios = true;
  document.getElementById('btnGuardarCambiosCoordenadas').style.display = 'inline-block';
}

// ---------------- Interacción: Frente (mover/redimensionar, 1 caja) ----------------

function activarInteraccionFrente(){
  const canvas = document.getElementById('canvasDebugFrente');

  canvas.addEventListener('mousedown', (ev)=>{
    if(!mostrarCajas) return;
    const pt = coordenadasCanvas(canvas, ev);
    const caja = cajasTrabajo['nombre_alumno'];
    estadoFrente.seleccionada = 'nombre_alumno';
    const esquina = esquinaCercana(pt.x, pt.y, caja);
    if(esquina){
      estadoFrente.modo = 'redimensionar';
      estadoFrente.esquina = esquina;
    } else if(puntoDentroDeCaja(pt.x, pt.y, caja)){
      estadoFrente.modo = 'mover';
      estadoFrente.offset = { dx: pt.x - caja.x, dy: pt.y - caja.y };
    } else {
      estadoFrente.modo = null;
    }
  });

  canvas.addEventListener('mousemove', (ev)=>{
    if(!mostrarCajas || !estadoFrente.modo) return;
    const pt = coordenadasCanvas(canvas, ev);
    const caja = cajasTrabajo['nombre_alumno'];
    if(estadoFrente.modo === 'mover'){
      caja.x = Math.round(pt.x - estadoFrente.offset.dx);
      caja.y = Math.round(pt.y - estadoFrente.offset.dy);
    } else if(estadoFrente.modo === 'redimensionar'){
      cajasTrabajo['nombre_alumno'] = redimensionarCaja(caja, estadoFrente.esquina, pt.x, pt.y);
    }
    marcarCambio();
    redibujarFrente();
  });

  window.addEventListener('mouseup', ()=>{
    if(!mostrarCajas || !estadoFrente.modo) return;
    estadoFrente.modo = null;
    estadoFrente.esquina = null;
    redibujarFrente();
  });
}

// ---------------- Interacción: Reverso (mover/redimensionar o redibujar) ----------------

function modoRedibujarActivo(){
  return document.getElementById('chkRedibujarCaja').checked;
}

function campoParaRedibujar(){
  return document.getElementById('selectCampoRedibujar').value;
}

function activarInteraccionReverso(){
  const canvas = document.getElementById('canvasDebugReverso');

  canvas.addEventListener('mousedown', (ev)=>{
    if(!mostrarCajas) return;
    const pt = coordenadasCanvas(canvas, ev);

    if(modoRedibujarActivo()){
      estadoReverso.modo = 'dibujar';
      estadoReverso.inicioDibujo = pt;
      estadoReverso.seleccionada = null;
      return;
    }

    // Modo mover/redimensionar
    if(estadoReverso.seleccionada){
      const caja = cajasTrabajo[estadoReverso.seleccionada];
      const esquina = esquinaCercana(pt.x, pt.y, caja);
      if(esquina){
        estadoReverso.modo = 'redimensionar';
        estadoReverso.esquina = esquina;
        return;
      }
    }
    const campo = buscarCajaBajoPuntero(CAMPOS_REVERSO, pt.x, pt.y);
    if(campo){
      estadoReverso.seleccionada = campo;
      estadoReverso.modo = 'mover';
      const caja = cajasTrabajo[campo];
      estadoReverso.offset = { dx: pt.x - caja.x, dy: pt.y - caja.y };
    } else {
      estadoReverso.seleccionada = null;
      estadoReverso.modo = null;
    }
    redibujarReverso();
  });

  canvas.addEventListener('mousemove', (ev)=>{
    if(!mostrarCajas || !estadoReverso.modo) return;
    const pt = coordenadasCanvas(canvas, ev);

    if(estadoReverso.modo === 'dibujar'){
      redibujarReverso(normalizarRect(estadoReverso.inicioDibujo, pt));
      return;
    }
    const caja = cajasTrabajo[estadoReverso.seleccionada];
    if(estadoReverso.modo === 'mover'){
      caja.x = Math.round(pt.x - estadoReverso.offset.dx);
      caja.y = Math.round(pt.y - estadoReverso.offset.dy);
    } else if(estadoReverso.modo === 'redimensionar'){
      cajasTrabajo[estadoReverso.seleccionada] = redimensionarCaja(caja, estadoReverso.esquina, pt.x, pt.y);
    }
    marcarCambio();
    redibujarReverso();
  });

  window.addEventListener('mouseup', (ev)=>{
    if(!mostrarCajas || !estadoReverso.modo) return;

    if(estadoReverso.modo === 'dibujar'){
      const pt = coordenadasCanvas(canvas, ev);
      cajasTrabajo[campoParaRedibujar()] = normalizarRect(estadoReverso.inicioDibujo, pt);
      marcarCambio();
    }
    estadoReverso.modo = null;
    estadoReverso.esquina = null;
    estadoReverso.inicioDibujo = null;
    redibujarReverso();
  });

  document.getElementById('chkRedibujarCaja').addEventListener('change', (ev)=>{
    document.getElementById('wrapSelectRedibujar').style.display = ev.target.checked ? 'block' : 'none';
    estadoReverso.seleccionada = null;
    estadoReverso.modo = null;
    redibujarReverso();
  });
}

// ---------------- Botón "Mostrar cajas" y selector de plantilla ----------------

function reiniciarEdicion(){
  const plantilla = obtenerPlantillaSeleccionada();
  cajasTrabajo = plantilla ? JSON.parse(JSON.stringify(plantilla.cajas)) : null;
  hayCambios = false;
  estadoFrente.seleccionada = null;
  estadoFrente.modo = null;
  estadoReverso.seleccionada = null;
  estadoReverso.modo = null;
  document.getElementById('btnGuardarCambiosCoordenadas').style.display = 'none';
  document.getElementById('debugGuardarMsg').textContent = '';
}

async function alCambiarPlantilla(){
  claveActual = document.getElementById('debugPlantillaSelect').value;
  reiniciarEdicion();
  await redibujarFrente();
  await redibujarReverso();
}

function alternarMostrarCajas(){
  mostrarCajas = !mostrarCajas;
  const btn = document.getElementById('btnActivarDebug');
  btn.textContent = mostrarCajas ? '🔳 Ocultar cajas' : '🔲 Mostrar cajas';
  if(!mostrarCajas){
    reiniciarEdicion(); // salir sin guardar descarta cambios de esta sesión
  }
  redibujarFrente();
  redibujarReverso();
}

async function guardarCambiosCoordenadas(){
  const msg = document.getElementById('debugGuardarMsg');
  if(!claveActual || !cajasTrabajo) return;

  msg.textContent = 'Guardando...';
  msg.className = 'modal-msg';

  try{
    await updateDoc(doc(db, 'plantillas', claveActual), { cajas: cajasTrabajo });
    catalogoDebug[claveActual].cajas = JSON.parse(JSON.stringify(cajasTrabajo));
    hayCambios = false;
    document.getElementById('btnGuardarCambiosCoordenadas').style.display = 'none';
    msg.textContent = '✅ Coordenadas actualizadas en Firestore.';
    msg.className = 'modal-msg';
  }catch(err){
    console.error(err);
    msg.textContent = 'No se pudo guardar (revisa que tu sesión siga activa).';
    msg.className = 'modal-msg err';
  }
}

// ---------------- Inicialización ----------------

export async function inicializarPreviewDebug(){
  const sel = document.getElementById('debugPlantillaSelect');
  const msg = document.getElementById('debugMsg');

  msg.textContent = 'Cargando plantillas...';

  try{
    catalogoDebug = await cargarCatalogoPlantillasTodas();
    sel.innerHTML = '';
    Object.values(catalogoDebug).forEach(plantilla=>{
      const opt = document.createElement('option');
      opt.value = plantilla.clave;
      opt.textContent = `${plantilla.nombre} (${plantilla.clave})`;
      sel.appendChild(opt);
    });
    msg.textContent = '';

    claveActual = sel.value;
    reiniciarEdicion();

    sel.addEventListener('change', alCambiarPlantilla);
    document.getElementById('btnActivarDebug').addEventListener('click', alternarMostrarCajas);
    document.getElementById('btnGuardarCambiosCoordenadas').addEventListener('click', guardarCambiosCoordenadas);

    activarInteraccionFrente();
    activarInteraccionReverso();

    await redibujarFrente();
    await redibujarReverso();
  }catch(err){
    console.error(err);
    msg.textContent = 'No se pudo cargar el catálogo de plantillas.';
    msg.className = 'modal-msg err';
  }
}
