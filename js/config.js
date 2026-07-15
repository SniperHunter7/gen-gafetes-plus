/**
 * config.js
 * -----------------------------------------------------------------------
 * Configuración global del Generador de Gafetes. Módulo ES (export/import).
 * No depende de ningún otro archivo del proyecto.
 * -----------------------------------------------------------------------
 */

export const CARD_W = 1011;
export const CARD_H = 639;

export const GAFETE_ANCHO_MM = 85.6;
export const GAFETE_ALTO_MM  = 54;

export const PDF_MARGEN_MM = 5;
export const PDF_ANCHO_MM  = PDF_MARGEN_MM + GAFETE_ANCHO_MM + PDF_MARGEN_MM + GAFETE_ANCHO_MM + PDF_MARGEN_MM;
export const PDF_ALTO_MM   = PDF_MARGEN_MM + GAFETE_ALTO_MM + PDF_MARGEN_MM;

export const FUENTE_POR_DEFECTO = "'Trebuchet MS', 'Segoe UI', sans-serif";
export const COLOR_NOMBRE_POR_DEFECTO = '#DC2626';
export const COLOR_TEXTO_POR_DEFECTO  = '#1E293B';

export const RETRASO_PREVIEW_MS = 150;

// Modo de depuración: agrega ?debug a la URL para ver las cajas de texto
// dibujadas sobre la previsualización.
export const MODO_DEBUG = new URLSearchParams(window.location.search).has('debug');

// Nombres de los 7 campos de "cajas" que debe tener cada plantilla en Firestore.
// Usado tanto por canvas.js (para dibujar) como por admin-plantillas.js
// (para saber qué recuadros pedirle al administrador que marque).
export const CAMPOS_CAJAS = [
  'nombre_alumno', 'escuela', 'maestra', 'grado_grupo',
  'tel_papa', 'tel_mama', 'direccion'
];

// En cuál cara del gafete (frente/reverso) va cada caja. Lo usa admin-plantillas.js
// para separar el editor visual en dos pasos.
export const CARA_DE_CAJA = {
  nombre_alumno: 'frente',
  escuela:       'reverso',
  maestra:       'reverso',
  grado_grupo:   'reverso',
  tel_papa:      'reverso',
  tel_mama:      'reverso',
  direccion:     'reverso'
};
