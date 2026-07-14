/**
 * config.js
 * -----------------------------------------------------------------------
 * Configuración global del Generador de Gafetes.
 * Este archivo NO depende de ningún otro módulo del proyecto.
 * Debe cargarse ANTES que utilidades.js, plantillas.js, canvas.js, pdf.js y app.js.
 * -----------------------------------------------------------------------
 */

// Tamaño (en píxeles) del "lienzo" de trabajo para cada cara del gafete.
// Debe coincidir con la resolución de las imágenes de fondo de las plantillas.
const CARD_W = 1011;
const CARD_H = 639;

// Tamaño físico real de una credencial CR80 (la que se manda a enmicar), en mm.
const GAFETE_ANCHO_MM = 85.6;
const GAFETE_ALTO_MM  = 54;

// Márgenes del PDF final (una sola página, frente a la izquierda y reverso a la derecha).
const PDF_MARGEN_MM = 5;
const PDF_ANCHO_MM  = PDF_MARGEN_MM + GAFETE_ANCHO_MM + PDF_MARGEN_MM + GAFETE_ANCHO_MM + PDF_MARGEN_MM;
const PDF_ALTO_MM   = PDF_MARGEN_MM + GAFETE_ALTO_MM + PDF_MARGEN_MM;

// Fuente por defecto (cada plantilla puede sobreescribirla en su propia configuración).
const FUENTE_POR_DEFECTO = "'Trebuchet MS', 'Segoe UI', sans-serif";

// Colores por defecto.
const COLOR_NOMBRE_POR_DEFECTO = '#DC2626';
const COLOR_TEXTO_POR_DEFECTO  = '#1E293B';

// Retraso (ms) para la previsualización en tiempo real, así no se redibuja en cada tecla.
const RETRASO_PREVIEW_MS = 150;

// Modo de depuración: se activa agregando ?debug a la URL de la página
// (ej. https://tu-usuario.github.io/Generador-Gafetes/?debug)
// Muestra las cajas de texto de la plantilla activa sobre la previsualización,
// muy útil para calcular las coordenadas de una plantilla nueva.
const MODO_DEBUG = new URLSearchParams(window.location.search).has('debug');
