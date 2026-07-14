/**
 * pdf.js
 * -----------------------------------------------------------------------
 * Genera el PDF final a partir de los dos <canvas> ya dibujados (frente y
 * reverso), en una sola página, frente a la izquierda y reverso a la derecha,
 * a tamaño real de credencial (85.6 x 54 mm).
 *
 * Depende de: config.js (medidas en mm), la librería jsPDF (cargada por CDN
 * en index.html antes de este archivo).
 * Lo usa: app.js, al dar clic en "Generar PDF".
 * -----------------------------------------------------------------------
 */

/**
 * @param {HTMLCanvasElement} canvasFront
 * @param {HTMLCanvasElement} canvasBack
 * @param {string} nombreArchivo Nombre de archivo sin extensión ni espacios
 */
function generarPDF(canvasFront, canvasBack, nombreArchivo){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    unit: 'mm',
    format: [PDF_ANCHO_MM, PDF_ALTO_MM],
    orientation: 'landscape'
  });

  // Se usa PNG (sin pérdida) para conservar nitidez en el texto e imágenes.
  const frontData = canvasFront.toDataURL('image/png', 1.0);
  const backData  = canvasBack.toDataURL('image/png', 1.0);

  pdf.addImage(
    frontData, 'PNG',
    PDF_MARGEN_MM, PDF_MARGEN_MM,
    GAFETE_ANCHO_MM, GAFETE_ALTO_MM
  );
  pdf.addImage(
    backData, 'PNG',
    PDF_MARGEN_MM + GAFETE_ANCHO_MM + PDF_MARGEN_MM, PDF_MARGEN_MM,
    GAFETE_ANCHO_MM, GAFETE_ALTO_MM
  );

  pdf.save(`${nombreArchivo}.pdf`);
}
