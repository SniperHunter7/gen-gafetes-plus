/**
 * plantillas.js
 * -----------------------------------------------------------------------
 * Clase Plantilla + carga del catálogo de plantillas activas desde
 * Firestore (colección "plantillas"). Reemplaza el REGISTRO_PLANTILLAS
 * fijo que existía en la versión anterior del proyecto.
 * -----------------------------------------------------------------------
 */

import { db } from './firebase-init.js';
import {
  collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { cargarImagen } from './utilidades.js';
import { COLOR_NOMBRE_POR_DEFECTO, COLOR_TEXTO_POR_DEFECTO, FUENTE_POR_DEFECTO } from './config.js';

export class Plantilla {
  /**
   * @param {string} clave  ID del documento en Firestore (ej. "juguetes")
   * @param {Object} datos  Campos del documento: nombre, frente, reverso, cajas
   */
  constructor(clave, datos){
    this.clave   = clave;
    this.nombre  = datos.nombre;
    this.frente  = datos.frente;
    this.reverso = datos.reverso;
    this.cajas   = datos.cajas;

    // Colores/fuentes no viven en Firestore por ahora: se usan los defaults
    // globales para todas las plantillas.
    this.colores = { nombre: COLOR_NOMBRE_POR_DEFECTO, texto: COLOR_TEXTO_POR_DEFECTO };
    this.fuentes = { familia: FUENTE_POR_DEFECTO };

    this._imagenesCache = null;
  }

  /** Devuelve {imgFrente, imgReverso} ya cargadas, con caché por instancia. */
  async obtenerImagenes(){
    if(this._imagenesCache) return this._imagenesCache;
    const [imgFrente, imgReverso] = await Promise.all([
      cargarImagen(this.frente),
      cargarImagen(this.reverso)
    ]);
    this._imagenesCache = { imgFrente, imgReverso };
    return this._imagenesCache;
  }
}

/**
 * Consulta Firestore y devuelve un objeto { clave: Plantilla } con todas
 * las plantillas marcadas como activo == true.
 */
export async function cargarCatalogoPlantillas(){
  const registro = {};
  const q = query(collection(db, 'plantillas'), where('activo', '==', true));
  const snap = await getDocs(q);
  snap.forEach(docSnap=>{
    registro[docSnap.id] = new Plantilla(docSnap.id, docSnap.data());
  });
  return registro;
}

/**
 * Igual que cargarCatalogoPlantillas(), pero sin filtrar por "activo".
 * La usa admin.html para poder previsualizar (con cajas de depuración)
 * incluso una plantilla que todavía no se marca como activa.
 */
export async function cargarCatalogoPlantillasTodas(){
  const registro = {};
  const snap = await getDocs(collection(db, 'plantillas'));
  snap.forEach(docSnap=>{
    registro[docSnap.id] = new Plantilla(docSnap.id, docSnap.data());
  });
  return registro;
}
