/**
 * pdf.js
 * -----------------------------------------------------------------------
 * Genera el PDF final a partir de los dos <canvas> ya dibujados (frente y
 * reverso), en una sola página, frente a la izquierda y reverso a la derecha,
 * a tamaño real de credencial (85.6 x 54 mm).
 *
 * Usa jsPDF, cargado como script clásico (UMD) en index.html antes de este
 * módulo, por lo que queda disponible como variable global window.jspdf.
 * -----------------------------------------------------------------------
 */

import {
  PDF_ANCHO_MM, PDF_ALTO_MM, PDF_MARGEN_MM, GAFETE_ANCHO_MM, GAFETE_ALTO_MM
} from './config.js';

export function generarPDF(canvasFront, canvasBack, nombreArchivo){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    unit: 'mm',
    format: [PDF_ANCHO_MM, PDF_ALTO_MM],
    orientation: 'landscape'
  });

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
