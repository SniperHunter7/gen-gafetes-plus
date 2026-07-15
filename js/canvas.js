/**
 * canvas.js
 * -----------------------------------------------------------------------
 * Motor de renderizado: dibuja el fondo de una plantilla y los datos
 * capturados por el usuario sobre los <canvas> del frente y el reverso.
 * También incluye el modo de depuración (dibuja las cajas de texto).
 * -----------------------------------------------------------------------
 */

import { partirEnLineas } from './utilidades.js';
import { CARD_W, CARD_H, MODO_DEBUG } from './config.js';

/**
 * Dibuja un texto dentro de una caja {x,y,w,h}, ajustando el tamaño de
 * letra y usando varias líneas si la caja tiene alto suficiente.
 */
export function dibujarValorEnCaja(ctx, texto, caja, fontFamily, opts={}){
  if(!texto || !texto.trim()) return;
  texto = texto.trim();

  const maxFontSize = opts.maxFontSize || 30;
  const minFontSize = opts.minFontSize || 14;
  const paddingX = opts.paddingX ?? 14;
  const paddingY = opts.paddingY ?? 8;
  const align = opts.align || 'center';
  const pesoFuente = opts.bold ? 'bold ' : '';

  const maxWidth  = caja.w - paddingX * 2;
  const maxHeight = caja.h - paddingY * 2;

  let fontSize = maxFontSize;
  let lineas = [texto];
  let lineHeight = fontSize * 1.25;

  while(fontSize >= minFontSize){
    ctx.font = `${pesoFuente}${fontSize}px ${fontFamily}`;
    lineas = partirEnLineas(ctx, texto, maxWidth);
    lineHeight = fontSize * 1.25;
    const totalHeight = lineas.length * lineHeight;
    const widestLine = Math.max(...lineas.map(l=>ctx.measureText(l).width));
    if(totalHeight <= maxHeight && widestLine <= maxWidth){
      break;
    }
    fontSize -= 1;
  }
  if(fontSize < minFontSize) fontSize = minFontSize;
  ctx.font = `${pesoFuente}${fontSize}px ${fontFamily}`;
  lineas = partirEnLineas(ctx, texto, maxWidth);
  lineHeight = fontSize * 1.25;

  const maxLineas = Math.max(1, Math.floor(maxHeight / lineHeight));
  if(lineas.length > maxLineas) lineas = lineas.slice(0, maxLineas);

  const totalHeight = lineas.length * lineHeight;
  let y = caja.y + (caja.h - totalHeight) / 2 + lineHeight / 2;

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const xPos = align === 'left' ? (caja.x + paddingX) : (caja.x + caja.w / 2);
  lineas.forEach(linea=>{
    ctx.fillText(linea, xPos, y);
    y += lineHeight;
  });
}

/** Dibuja cada caja como un rectángulo semitransparente con su nombre (modo ?debug). */
export function dibujarCajasDebug(ctx, cajas){
  if(!MODO_DEBUG) return;
  ctx.save();
  ctx.font = '16px monospace';
  Object.entries(cajas).forEach(([nombreCaja, caja])=>{
    ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.strokeRect(caja.x, caja.y, caja.w, caja.h);
    ctx.fillStyle = 'rgba(153, 27, 27, 1)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(nombreCaja, caja.x + 4, caja.y + 4);
  });
  ctx.restore();
}

/** Dibuja la cara frontal: fondo de la plantilla + nombre del alumno. */
export async function dibujarFrente(ctx, imgFondo, nombre, plantilla){
  ctx.clearRect(0,0,CARD_W,CARD_H);
  ctx.drawImage(imgFondo, 0, 0, CARD_W, CARD_H);

  ctx.fillStyle = plantilla.colores.nombre;
  dibujarValorEnCaja(ctx, nombre, plantilla.cajas.nombre_alumno, plantilla.fuentes.familia, {
    maxFontSize: 70, minFontSize: 26, paddingX: 20, paddingY: 20
  });

  dibujarCajasDebug(ctx, { nombre_alumno: plantilla.cajas.nombre_alumno });
}

/** Dibuja la cara trasera: fondo de la plantilla + todos los datos de contacto/escolares. */
export async function dibujarReverso(ctx, imgFondo, datos, plantilla){
  ctx.clearRect(0,0,CARD_W,CARD_H);
  ctx.drawImage(imgFondo, 0, 0, CARD_W, CARD_H);

  const fontFamily = plantilla.fuentes.familia;
  ctx.fillStyle = plantilla.colores.texto;
  const cajas = plantilla.cajas;

  dibujarValorEnCaja(ctx, datos.escuela,   cajas.escuela,     fontFamily);
  dibujarValorEnCaja(ctx, datos.maestra,   cajas.maestra,     fontFamily);
  dibujarValorEnCaja(ctx, datos.grado,     cajas.grado_grupo, fontFamily);
  dibujarValorEnCaja(ctx, datos.telPapa,   cajas.tel_papa,    fontFamily, {maxFontSize:26, align:'left', bold:true});
  dibujarValorEnCaja(ctx, datos.telMama,   cajas.tel_mama,    fontFamily, {maxFontSize:26, align:'left', bold:true});
  dibujarValorEnCaja(ctx, datos.direccion, cajas.direccion,   fontFamily, {maxFontSize:32, minFontSize:18});

  dibujarCajasDebug(ctx, {
    escuela: cajas.escuela, maestra: cajas.maestra, grado_grupo: cajas.grado_grupo,
    tel_papa: cajas.tel_papa, tel_mama: cajas.tel_mama, direccion: cajas.direccion
  });
}
