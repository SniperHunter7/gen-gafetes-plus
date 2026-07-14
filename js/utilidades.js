/**
 * utilidades.js
 * -----------------------------------------------------------------------
 * Funciones auxiliares de propósito general, sin lógica de negocio propia
 * del gafete. Las usan canvas.js, plantillas.js y app.js.
 * Depende de: nada (puede cargarse justo después de config.js).
 * -----------------------------------------------------------------------
 */

/**
 * Carga una imagen de forma asíncrona.
 * @param {string} src Ruta relativa o absoluta de la imagen.
 * @returns {Promise<HTMLImageElement>}
 */
function cargarImagen(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = ()=>reject(new Error('No se pudo cargar la imagen: ' + src));
    img.src = src;
  });
}

/**
 * Parte un texto en líneas que quepan dentro de maxWidth, usando la fuente
 * que ya esté asignada en el contexto (ctx.font) al momento de llamarla.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} texto
 * @param {number} maxWidth
 * @returns {string[]} arreglo de líneas
 */
function partirEnLineas(ctx, texto, maxWidth){
  const palabras = texto.split(/\s+/);
  const lineas = [];
  let actual = '';
  palabras.forEach(palabra=>{
    const prueba = actual ? actual + ' ' + palabra : palabra;
    if(ctx.measureText(prueba).width > maxWidth && actual){
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  });
  if(actual) lineas.push(actual);
  return lineas;
}

/**
 * Devuelve una versión "debounced" de una función: solo se ejecuta después
 * de que pasen `delay` ms sin que se vuelva a llamar. Se usa para la
 * previsualización en tiempo real (no redibujar en cada tecla presionada).
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function conRetraso(fn, delay){
  let temporizador = null;
  return function(...args){
    clearTimeout(temporizador);
    temporizador = setTimeout(()=>fn.apply(this, args), delay);
  };
}
