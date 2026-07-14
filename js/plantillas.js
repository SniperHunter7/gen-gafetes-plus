/**
 * plantillas.js
 * -----------------------------------------------------------------------
 * Define la clase Plantilla (encapsula todo lo relacionado a un diseño de
 * gafete: rutas de imagen, coordenadas de cada campo, colores y fuentes) y
 * el registro REGISTRO_PLANTILLAS con todas las plantillas disponibles.
 *
 * Depende de: utilidades.js (usa cargarImagen).
 * Lo usan: canvas.js (lee plantilla.cajas/colores/fuentes) y app.js (llena
 * el selector y pide las imágenes de la plantilla activa).
 * -----------------------------------------------------------------------
 */

class Plantilla {
  /**
   * @param {Object} datos
   * @param {string} datos.clave     Identificador único (ej. "juguetes")
   * @param {string} datos.label     Texto que se muestra en el selector
   * @param {string} datos.frente    Ruta de la imagen de fondo del frente
   * @param {string} datos.reverso   Ruta de la imagen de fondo del reverso
   * @param {Object} datos.cajas     Coordenadas {x,y,w,h} de cada campo
   * @param {Object} [datos.colores] Colores de texto (opcional, tiene defaults)
   * @param {Object} [datos.fuentes] Familia tipográfica (opcional, tiene default)
   */
  constructor(datos){
    this.clave   = datos.clave;
    this.label   = datos.label;
    this.frente  = datos.frente;
    this.reverso = datos.reverso;
    this.cajas   = datos.cajas;

    this.colores = Object.assign({
      nombre: COLOR_NOMBRE_POR_DEFECTO,
      texto:  COLOR_TEXTO_POR_DEFECTO
    }, datos.colores || {});

    this.fuentes = Object.assign({
      familia: FUENTE_POR_DEFECTO
    }, datos.fuentes || {});

    // Caché interna: las imágenes de esta plantilla solo se cargan una vez.
    this._imagenesCache = null;
  }

  /**
   * Devuelve {imgFrente, imgReverso} ya cargadas, reutilizando la caché
   * interna en llamadas posteriores (por eso escribir en el formulario o
   * cambiar de plantilla y volver no genera peticiones de red repetidas).
   */
  async obtenerImagenes(){
    if(this._imagenesCache){
      return this._imagenesCache;
    }
    const [imgFrente, imgReverso] = await Promise.all([
      cargarImagen(this.frente),
      cargarImagen(this.reverso)
    ]);
    this._imagenesCache = { imgFrente, imgReverso };
    return this._imagenesCache;
  }
}

/**
 * Coordenadas base compartidas por el diseño "Olas de colores / juguetes".
 * Estos valores se obtuvieron analizando los píxeles de los recuadros
 * grises de la plantilla original.
 */
const cajasJuguetes = {
  nombre:    { x:347, y:112, w:647, h:461 },
  escuela:   { x:366, y:42,  w:618, h:56  },
  maestra:   { x:366, y:107, w:619, h:56  },
  grado:     { x:434, y:174, w:240, h:55  },
  papa:      { x:627, y:239, w:358, h:46.5 },
  mama:      { x:627, y:285.5, w:358, h:46.5 },
  direccion: { x:352, y:345, w:633, h:227 }
};

/**
 * Registro central de plantillas disponibles. El selector del formulario
 * (ver app.js) se llena automáticamente a partir de este objeto.
 *
 * PARA AGREGAR UNA PLANTILLA NUEVA:
 * 1) Crea una carpeta en images/ (ej. images/espacio/) con tus dos PNG:
 *    Frente-Fondo.png y Reverso-Fondo.png (o los nombres que prefieras).
 * 2) Si el modo debug (?debug en la URL) muestra que las cajas no coinciden
 *    con tu nuevo diseño, ajusta las coordenadas x,y,w,h de cada campo.
 * 3) Agrega una entrada aquí abajo, siguiendo el mismo patrón.
 */
const REGISTRO_PLANTILLAS = {
  juguetes: new Plantilla({
    clave: 'juguetes',
    label: 'Olas de colores',
    frente:  'images/juguetes/Frente-Fondo.png',
    reverso: 'images/juguetes/Reverso-Fondo.png',
    cajas: cajasJuguetes
  })

  // Ejemplo para agregar la plantilla "espacio" (descomenta y ajusta):
  // espacio: new Plantilla({
  //   clave: 'espacio',
  //   label: 'Espacio exterior',
  //   frente:  'images/espacio/Frente-Fondo.png',
  //   reverso: 'images/espacio/Reverso-Fondo.png',
  //   cajas: cajasJuguetes // o un objeto de cajas nuevo si el diseño cambia de lugar los campos
  // })
};
