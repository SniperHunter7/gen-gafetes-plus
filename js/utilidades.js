/**
 * utilidades.js
 * -----------------------------------------------------------------------
 * Funciones auxiliares de propósito general. Módulo ES.
 * -----------------------------------------------------------------------
 */

/** Carga una imagen de forma asíncrona. */
export function cargarImagen(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = ()=>reject(new Error('No se pudo cargar la imagen: ' + src));
    img.src = src;
  });
}

/** Parte un texto en líneas que quepan en maxWidth, usando ctx.font ya asignado. */
export function partirEnLineas(ctx, texto, maxWidth){
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

/** Versión "debounced" de una función: se ejecuta `delay` ms después de la última llamada. */
export function conRetraso(fn, delay){
  let temporizador = null;
  return function(...args){
    clearTimeout(temporizador);
    temporizador = setTimeout(()=>fn.apply(this, args), delay);
  };
}

/** Genera un código alfanumérico aleatorio, evitando caracteres confusos (0/O, 1/I). */
export function generarCodigoAleatorio(longitud = 8){
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for(let i = 0; i < longitud; i++){
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return codigo;
}
