# Generador de Gafetes Escolares

Aplicación web para capturar los datos de un alumno y generar un PDF listo
para imprimir, enmicar y colgar con cordón. El sitio (`index.html` /
`admin.html`) vive en GitHub Pages; el catálogo de plantillas y los
códigos de impresión de un solo uso viven en Firebase (Firestore +
Authentication + App Check).

## Privacidad de los datos del alumno

Nombre, escuela, maestra, teléfonos de emergencia y dirección **nunca se
guardan ni se envían a ningún servidor propio**. Viven solo en la memoria
de la página mientras se genera el PDF, y se borran del formulario justo
después de la descarga. Firebase, en este proyecto, **no** almacena datos
de alumnos — solo el catálogo de diseños y los códigos de impresión.

## Estructura del proyecto

```
Generador-Gafetes/
├── index.html              Página pública (captura de datos + PDF)
├── admin.html               Panel de administrador (protegido con login)
├── css/
│   ├── estilos.css          Estilos de index.html (compartidos con admin.html)
│   └── admin.css             Estilos propios del panel admin
├── js/
│   ├── config.js             Constantes globales
│   ├── utilidades.js         Funciones auxiliares (imágenes, texto, códigos aleatorios)
│   ├── firebase-init.js      ⚠️ AQUÍ SE PEGAN LAS LLAVES DE FIREBASE
│   ├── plantillas.js         Clase Plantilla + catálogo leído desde Firestore
│   ├── canvas.js              Motor de dibujo + modo de depuración (?debug)
│   ├── pdf.js                 Generación del PDF final
│   ├── codigos.js             Transacción que valida/canjea el código de impresión
│   ├── app.js                 Punto de entrada de index.html
│   ├── admin-auth.js          Login/logout del panel admin
│   ├── admin-plantillas.js    Editor visual de cajas + guardado en Firestore
│   ├── admin-codigos.js       Generación de lotes de códigos
│   └── admin-app.js           Punto de entrada de admin.html
├── images/                    Imágenes de las plantillas (sin cambios)
└── README.md
```

## Cómo pegar tus llaves de Firebase (paso obligatorio)

Todo lo que necesitas configurar está en **un solo archivo**:
`js/firebase-init.js`. Ábrelo y reemplaza:

1. El objeto `firebaseConfig` completo, con el que copiaste de
   **Firebase Console → Configuración del proyecto → Tus apps → gen-gafetes-plus-web**.
2. La constante `RECAPTCHA_SITE_KEY`, con la **clave del sitio** (no la
   secreta) que generaste en `google.com/recaptcha/admin`.

Ningún otro archivo necesita tocarse para que la conexión funcione — todos
los demás módulos importan `db`, `auth` y `appCheck` desde `firebase-init.js`.

## Cómo subirlo a GitHub Pages

Igual que antes: sube todo (respetando la estructura de carpetas) y activa
GitHub Pages en Settings → Pages, rama `main`, carpeta `/ (root)`.

## Flujo del código de impresión de un solo uso

1. El usuario captura los datos y elige su plantilla.
2. Al dar clic en "Generar PDF", se le pide un código.
3. La función `validarYCanjearCodigo()` (en `codigos.js`) ejecuta una
   **transacción** contra Firestore: si el código existe y no ha sido
   usado, lo marca como usado y permite continuar; si no, muestra el
   error correspondiente y no genera nada.
4. Las Security Rules de Firestore son las que de verdad hacen cumplir
   esto — no el JavaScript del navegador.

Los códigos se venden/generan por lotes desde el panel admin (sección
"Generar lote de códigos de impresión"), asociados a un cliente y un
monto, después de recibir el comprobante de pago por correo.

## Cómo agregar una plantilla nueva (ahora vía panel admin)

1. Entra a `admin.html` e inicia sesión con tu usuario administrador.
2. En "Nueva plantilla", carga localmente (solo para previsualizar, no se
   sube a ningún lado) las imágenes de frente y reverso de tu nuevo diseño.
3. Marca cada caja con clic y arrastre directamente sobre la imagen.
4. Llena la clave, el nombre, y las rutas donde vas a subir esas imágenes
   dentro de tu repositorio de GitHub (ej. `images/espacio/Frente-Fondo.png`).
5. Clic en "Guardar plantilla en Firestore".
6. Sube las dos imágenes reales a esa ruta en tu repositorio de GitHub.
7. Listo — la plantilla aparece sola en el selector de `index.html`, sin
   tocar ningún archivo de código.

(La alternativa de capturar la plantilla directamente en la consola de
Firestore, campo por campo, sigue funcionando igual si prefieres hacerlo así.)

## Modo de depuración

Agregar `?debug` a la URL de `index.html` dibuja las cajas de texto
activas sobre la previsualización, con su nombre — útil para confirmar
que una plantilla capturada desde el panel admin (o directo en Firestore)
quedó bien alineada.

## Funcionalidades incluidas

- Selector de plantillas cargado en vivo desde Firestore.
- Previsualización en tiempo real mientras se escribe.
- Código de impresión de un solo uso, validado con transacción atómica.
- Panel admin con login, editor visual de coordenadas, y generador de
  lotes de códigos.
- Enlace de "¿No encuentras tu plantilla?" que abre un correo prellenado.
- Teléfonos de emergencia alineados a la izquierda y en negrita.
- Dirección con tamaño de letra mayor y ajuste automático si es muy larga.
- Diseño responsive. PDF de una sola página (frente y reverso lado a lado).

## Servicios de Firebase usados (y por qué siguen siendo gratuitos)

- **Firestore** (Edición Standard): catálogo de plantillas, códigos y lotes.
- **Authentication**: solo para el login del panel admin.
- **App Check** (reCAPTCHA v3): evita peticiones a Firestore desde fuera de la app.
- **NO se usa Firebase Storage** (las imágenes siguen en GitHub) ni **Cloud
  Functions** — por eso el proyecto no requiere tarjeta de crédito ni el
  plan Blaze.

## Créditos de las plantillas

Las imágenes dentro de `images/` son proporcionadas y de responsabilidad
de quien administra este repositorio.
