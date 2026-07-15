/**
 * firebase-init.js
 * -----------------------------------------------------------------------
 * ÚNICO archivo del proyecto donde se pega la configuración de Firebase.
 * Inicializa la app de Firebase, Firestore, Authentication y App Check,
 * y los exporta para que el resto de los módulos los usen.
 *
 * ============================================================
 *  >>> AQUÍ ES DONDE TÚ PEGAS TUS LLAVES (ver guía al final) <<<
 * ============================================================
 * -----------------------------------------------------------------------
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  initializeAppCheck,
  ReCaptchaV3Provider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// -----------------------------------------------------------------------
// 1) PEGA AQUÍ el bloque "firebaseConfig" que copiaste de la consola de
//    Firebase (Configuración del proyecto > Tus apps > gen-gafetes-plus-web).
//    Estos valores NO son secretos, están diseñados para ir en el cliente.
// -----------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDcvRPnYl4a5yOsWOUuXtVtLevjv8QWHXo",
  authDomain: "gen-gafetes-plus.firebaseapp.com",
  projectId: "gen-gafetes-plus",
  storageBucket: "gen-gafetes-plus.firebasestorage.app",
  messagingSenderId: "449070073487",
  appId: "1:449070073487:web:b4f964c4e0622d2c2fd2fa"
};

// -----------------------------------------------------------------------
// 2) PEGA AQUÍ la "Clave del sitio" (site key) de reCAPTCHA v3 que generaste
//    en google.com/recaptcha/admin. NO es la clave secreta (esa va en
//    Firebase App Check, en la consola, no aquí en el código).
// -----------------------------------------------------------------------
const RECAPTCHA_SITE_KEY = "6LfPQFQtAAAAAF7uAv9GPOkZVOGuXyB2aO4azuw2";

// -----------------------------------------------------------------------
// A partir de aquí no hay nada que modificar.
// -----------------------------------------------------------------------
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});
