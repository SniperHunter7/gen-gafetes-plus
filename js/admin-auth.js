/**
 * admin-auth.js
 * -----------------------------------------------------------------------
 * Login/logout del panel admin contra Firebase Authentication.
 * -----------------------------------------------------------------------
 */

import { auth } from './firebase-init.js';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/** @returns {Promise<{ok:boolean, mensaje?:string}>} */
export async function iniciarSesionAdmin(correo, contrasena){
  try{
    await signInWithEmailAndPassword(auth, correo, contrasena);
    return { ok:true };
  }catch(err){
    console.error('Error de login:', err);
    return { ok:false, mensaje:'Correo o contraseña incorrectos.' };
  }
}

export async function cerrarSesionAdmin(){
  await signOut(auth);
}

/** Ejecuta `callback(user)` cada vez que cambia el estado de sesión (user o null). */
export function observarSesion(callback){
  onAuthStateChanged(auth, callback);
}
