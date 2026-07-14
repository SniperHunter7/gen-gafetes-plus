/**
 * app.js
 * -----------------------------------------------------------------------
 * Lógica principal: conecta el formulario, el selector de plantillas y los
 * botones con el motor de renderizado (canvas.js) y la generación de PDF
 * (pdf.js). Es el único archivo que toca el DOM directamente.
 *
 * Depende de: config.js, utilidades.js, plantillas.js, canvas.js, pdf.js.
 * Debe cargarse AL FINAL, después de todos los demás.
 * -----------------------------------------------------------------------
 */

const CAMPOS_FORMULARIO = ['nombre','escuela','maestra','grado','telPapa','telMama','direccion'];

/** Lee los valores actuales del formulario. */
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

/** Plantilla actualmente seleccionada en el <select>. */
function obtenerPlantillaActiva(){
  const clave = document.getElementById('plantilla').value;
  return REGISTRO_PLANTILLAS[clave];
}

/** Llena el <select> de plantillas a partir de REGISTRO_PLANTILLAS. */
function poblarSelectorPlantillas(){
  const sel = document.getElementById('plantilla');
  sel.innerHTML = '';
  Object.values(REGISTRO_PLANTILLAS).forEach(plantilla=>{
    const opt = document.createElement('option');
    opt.value = plantilla.clave;
    opt.textContent = plantilla.label;
    sel.appendChild(opt);
  });
}

/** Limpia el formulario y actualiza la previsualización. */
function limpiarFormulario(){
  CAMPOS_FORMULARIO.forEach(id=>{
    document.getElementById(id).value = '';
  });
  const statusEl = document.getElementById('status');
  statusEl.textContent = '';
  statusEl.className = '';
  actualizarPrevisualizacion();
}

/**
 * Redibuja el frente y el reverso en los <canvas> de previsualización con
 * los datos actuales del formulario y la plantilla seleccionada.
 */
async function actualizarPrevisualizacion(){
  const plantilla = obtenerPlantillaActiva();
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

/** Maneja el clic en "Generar PDF". */
async function alGenerarPDF(){
  const statusEl = document.getElementById('status');
  statusEl.className = '';
  statusEl.textContent = '';

  const plantilla = obtenerPlantillaActiva();
  const datos = obtenerDatosFormulario();

  if(!datos.nombre){
    statusEl.textContent = 'Falta el nombre del alumno(a).';
    statusEl.className = 'err';
    return;
  }

  statusEl.textContent = 'Generando PDF...';

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

    // Los datos capturados solo viven en esta función; una vez generado el
    // PDF, se eliminan del formulario y de cualquier variable en memoria.
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

/** Conecta todos los listeners de la interfaz. */
function inicializarEventos(){
  document.getElementById('btnLimpiar').addEventListener('click', limpiarFormulario);
  document.getElementById('btnGenerar').addEventListener('click', alGenerarPDF);
  document.getElementById('plantilla').addEventListener('change', actualizarPrevisualizacion);

  CAMPOS_FORMULARIO.forEach(id=>{
    document.getElementById(id).addEventListener('input', previsualizacionConRetraso);
  });
}

/** Punto de entrada: se ejecuta una vez que el DOM está listo. */
function iniciarAplicacion(){
  poblarSelectorPlantillas();
  inicializarEventos();
  actualizarPrevisualizacion();

  if(MODO_DEBUG){
    console.info('Modo de depuración activo: se muestran las cajas de texto sobre la previsualización.');
  }
}

document.addEventListener('DOMContentLoaded', iniciarAplicacion);
