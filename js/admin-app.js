/**
 * admin-app.js
 * -----------------------------------------------------------------------
 * Punto de entrada de admin.html (único <script type="module">). Conecta
 * el login con el resto del panel, y solo inicializa el editor de
 * plantillas y el generador de códigos una vez que hay sesión activa.
 * -----------------------------------------------------------------------
 */

import { iniciarSesionAdmin, cerrarSesionAdmin, observarSesion } from './admin-auth.js';
import { inicializarEditorDePlantillas } from './admin-plantillas.js';
import { inicializarGeneradorDeCodigos } from './admin-codigos.js';
import { inicializarPreviewDebug } from './admin-debug.js';

let panelYaInicializado = false;

function mostrarPanel(usuario){
  document.getElementById('seccionLogin').style.display = 'none';
  document.getElementById('panelAdmin').style.display = 'block';
  document.getElementById('sesionInfo').textContent = `Sesión iniciada como ${usuario.email}`;

  // El editor de plantillas y el generador de códigos solo se conectan una
  // vez (si el usuario cierra sesión y vuelve a entrar, no se duplican los listeners).
  if(!panelYaInicializado){
    inicializarEditorDePlantillas();
    inicializarGeneradorDeCodigos();
    inicializarPreviewDebug();
    panelYaInicializado = true;
  }
}

function mostrarLogin(){
  document.getElementById('seccionLogin').style.display = 'block';
  document.getElementById('panelAdmin').style.display = 'none';
}

async function alClicLogin(){
  const msg = document.getElementById('loginMsg');
  const correo = document.getElementById('loginEmail').value.trim();
  const contrasena = document.getElementById('loginPassword').value;

  msg.textContent = 'Entrando...';
  msg.className = 'modal-msg';

  const resultado = await iniciarSesionAdmin(correo, contrasena);
  if(!resultado.ok){
    msg.textContent = resultado.mensaje;
    msg.className = 'modal-msg err';
  }
  // Si el login fue exitoso, observarSesion() dispara mostrarPanel() solo.
}

function inicializar(){
  document.getElementById('btnLogin').addEventListener('click', alClicLogin);
  document.getElementById('loginPassword').addEventListener('keydown', (ev)=>{
    if(ev.key === 'Enter') alClicLogin();
  });
  document.getElementById('btnLogout').addEventListener('click', cerrarSesionAdmin);

  observarSesion((usuario)=>{
    if(usuario) mostrarPanel(usuario);
    else mostrarLogin();
  });
}

document.addEventListener('DOMContentLoaded', inicializar);
