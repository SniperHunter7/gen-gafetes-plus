/**
 * codigos.js
 * -----------------------------------------------------------------------
 * Valida y "canjea" un código de impresión de un solo uso contra Firestore.
 * Esta es la función crítica de seguridad del proyecto: la decisión real
 * de si se puede generar el PDF la toma esta transacción (protegida además
 * por las Security Rules), nunca una condición aislada en el navegador.
 * -----------------------------------------------------------------------
 */

import { db } from './firebase-init.js';
import {
  doc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Intenta canjear un código de impresión de un solo uso.
 * @param {string} codigo El código capturado por el usuario (se normaliza a mayúsculas, sin espacios).
 * @returns {Promise<{ok: boolean, mensaje: string}>}
 */
export async function validarYCanjearCodigo(codigo){
  const codigoLimpio = (codigo || '').trim().toUpperCase();

  if(!codigoLimpio){
    return { ok:false, mensaje:'Ingresa tu código de impresión.' };
  }

  const refCodigo = doc(db, 'codigosImpresion', codigoLimpio);

  try{
    await runTransaction(db, async (transaccion)=>{
      const snap = await transaccion.get(refCodigo);

      if(!snap.exists()){
        throw new Error('CODIGO_INEXISTENTE');
      }
      if(snap.data().usado === true){
        throw new Error('CODIGO_YA_USADO');
      }

      // Única escritura permitida por las Security Rules: usado false -> true.
      transaccion.update(refCodigo, {
        usado: true,
        fechaUso: serverTimestamp()
      });
    });

    return { ok:true, mensaje:'Código válido.' };

  }catch(err){
    if(err.message === 'CODIGO_INEXISTENTE'){
      return { ok:false, mensaje:'Ese código no existe. Verifica que esté bien escrito.' };
    }
    if(err.message === 'CODIGO_YA_USADO'){
      return { ok:false, mensaje:'Este código ya fue utilizado anteriormente.' };
    }
    // Cualquier otro error (de red, o que las Security Rules rechazaron la
    // escritura por algún motivo) se trata como "no procede", sin generar el PDF.
    console.error('Error validando código:', err);
    return { ok:false, mensaje:'No se pudo validar el código. Intenta de nuevo.' };
  }
}
