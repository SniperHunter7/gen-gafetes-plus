/**
 * admin-debug.js
 * -----------------------------------------------------------------------
 * Previsualización de plantillas con las cajas de texto visibles, dentro
 * del propio panel admin (ya no depende de abrir index.html con ?debug).
 * Solo para uso del administrador: ayuda a confirmar que las coordenadas
 * de una plantilla (capturada por el editor visual o directo en Firestore)
 * quedaron bien alineadas con el diseño real.
 * -----------------------------------------------------------------------
 */

import { cargarCatalogoPlantillasTodas } from './plantillas.js';
import { dibujarFrente, dibujarReverso } from './canvas.js';

let catalogoDebug = {};
let mostrarCajas = false;

function obtenerPlantillaSeleccionada(){
  const clave = document.getElementById('debugPlantillaSelect').value;
  return catalogoDebug[clave];
}

async function redibujarPreviewDebug(){
  const msg = document.getElementById('debugMsg');
  const plantilla = obtenerPlantillaSeleccionada();
  if(!plantilla) return;

  const canvasFrente = document.getElementById('canvasDebugFrente');
  const canvasReverso = document.getElementById('canvasDebugReverso');

  try{
    const { imgFrente, imgReverso } = await plantilla.obtenerImagenes();
    const datosEjemplo = {
      escuela: 'Nombre de la escuela', maestra: 'Nombre de la maestra',
      grado: 'Grado y grupo', telPapa: 'Teléfono papá', telMama: 'Teléfono mamá',
      direccion: 'Dirección de ejemplo'
    };
    await dibujarFrente(canvasFrente.getContext('2d'), imgFrente, 'Nombre de ejemplo', plantilla, mostrarCajas);
    await dibujarReverso(canvasReverso.getContext('2d'), imgReverso, datosEjemplo, plantilla, mostrarCajas);
    msg.textContent = '';
    msg.className = 'modal-msg';
  }catch(err){
    console.error(err);
    msg.textContent = 'No se pudieron cargar las imágenes de esta plantilla (revisa las rutas).';
    msg.className = 'modal-msg err';
  }
}

function alternarCajas(){
  mostrarCajas = !mostrarCajas;
  const btn = document.getElementById('btnActivarDebug');
  btn.textContent = mostrarCajas ? '🔳 Ocultar cajas' : '🔲 Mostrar cajas';
  redibujarPreviewDebug();
}

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
    sel.addEventListener('change', redibujarPreviewDebug);
    document.getElementById('btnActivarDebug').addEventListener('click', alternarCajas);
    await redibujarPreviewDebug();
  }catch(err){
    console.error(err);
    msg.textContent = 'No se pudo cargar el catálogo de plantillas.';
    msg.className = 'modal-msg err';
  }
}
