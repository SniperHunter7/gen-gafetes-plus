# Generador de Gafetes Escolares

Aplicación web (100% del lado del cliente) para capturar los datos de un
alumno y generar un PDF listo para imprimir, enmicar y colgar con cordón.
No requiere servidor: funciona en GitHub Pages o abriéndola directamente
desde un hosting estático.

## Privacidad

Los datos que se capturan (nombre, escuela, maestra, teléfonos de
emergencia, dirección) **nunca se envían a ningún servidor ni se guardan**.
Viven únicamente en la memoria de la página mientras se genera el PDF, y se
borran del formulario justo después de la descarga.

## Estructura del proyecto

```
Generador-Gafetes/
├── index.html            Página principal (enlaza CSS y JS en el orden correcto)
├── css/
│   └── estilos.css       Todos los estilos de la interfaz
├── js/
│   ├── config.js         Constantes globales (tamaños, colores, modo debug)
│   ├── utilidades.js     Funciones auxiliares genéricas
│   ├── plantillas.js     Clase Plantilla + registro de plantillas disponibles
│   ├── canvas.js         Motor de dibujo (fondo + datos + modo debug)
│   ├── pdf.js            Generación del PDF final
│   └── app.js            Conecta la interfaz con todo lo anterior
├── images/
│   ├── juguetes/         Plantilla "Olas de colores" (Frente-Fondo.png / Reverso-Fondo.png)
│   ├── espacio/          (carpeta lista para una futura plantilla)
│   ├── dinosaurios/      (carpeta lista para una futura plantilla)
│   └── robots/           (carpeta lista para una futura plantilla)
└── README.md
```

## Cómo subirlo a GitHub Pages

1. Crea un repositorio nuevo (público) en GitHub.
2. Sube todo el contenido de esta carpeta **respetando la estructura**
   (no cambies los nombres de las carpetas `css/`, `js/` e `images/`).
3. Ve a **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`.
4. Espera un par de minutos y GitHub te dará la URL pública.

## Cómo agregar una nueva plantilla

1. Crea una carpeta dentro de `images/` con el nombre de tu tema (por
   ejemplo `images/espacio/`) y coloca ahí tus dos archivos:
   `Frente-Fondo.png` y `Reverso-Fondo.png`.
2. Abre tu página con `?debug` al final de la URL
   (ej. `index.html?debug`) y selecciona la plantilla nueva: vas a ver
   recuadros rojos semitransparentes marcando dónde caen las cajas de
   texto de la plantilla anterior, sobre tu nuevo diseño. Ajusta las
   coordenadas hasta que las cajas coincidan con los espacios en blanco
   de tu plantilla.
3. Abre `js/plantillas.js` y agrega una nueva entrada en
   `REGISTRO_PLANTILLAS`, siguiendo el ejemplo comentado que ya está en
   el archivo.
4. Recarga la página: la nueva plantilla aparece sola en el selector.

## Modo de depuración

Agregar `?debug` a la URL (ej. `https://tu-usuario.github.io/tu-repo/?debug`)
dibuja las cajas de texto activas sobre la previsualización, con su
nombre, para facilitar el ajuste de coordenadas de nuevas plantillas.

## Funcionalidades incluidas

- Selector de plantillas (fácil de extender).
- Previsualización en tiempo real mientras se escribe.
- Cambio de plantilla sin recargar la página.
- Caché de imágenes por plantilla (no se vuelven a descargar).
- Teléfonos de emergencia alineados a la izquierda y en negrita.
- Dirección con tamaño de letra mayor y ajuste automático si es muy larga.
- Ajuste automático de tamaño de letra en todos los campos.
- Diseño responsive (funciona en celular).
- PDF de una sola página, tamaño real de credencial (85.6 × 54 mm), con el
  frente a la izquierda y el reverso a la derecha.

## Posibles extensiones futuras

Estas funciones **no están incluidas** en esta versión, pero la
arquitectura modular está pensada para poder agregarlas después sin
reescribir el proyecto:

- Fotografía del alumno.
- Código QR o de barras.
- Logo de la escuela.
- Distintos tamaños de gafete por plantilla.
- Exportación por lotes desde un archivo Excel.

## Créditos de las plantillas

Las imágenes dentro de `images/` son proporcionadas y de responsabilidad
de quien administra este repositorio. Este proyecto no incluye ni redistribuye
ningún material con derechos de autor de terceros.
