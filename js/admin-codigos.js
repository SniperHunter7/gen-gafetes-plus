/**
 * admin-codigos.js
 * -----------------------------------------------------------------------
 * Genera un lote de códigos de impresión de un solo uso: crea N documentos
 * en "codigosImpresion" (uno por código) y un documento en "lotes" con la
 * información del pedido/pago.
 * -----------------------------------------------------------------------
 */

import { db } from './firebase-init.js';
import {
  doc, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { generarCodigoAleatorio } from './utilidades.js';

let ultimosCodigosGenerados = [];

export function inicializarGeneradorDeCodigos(){
  document.getElementById('btnGenerarCodigos').addEventListener('click', generarLote);
  document.getElementById('btnDescargarCodigos').addEventListener('click', descargarComoTxt);
}

async function generarLote(){
  const msg = document.getElementById('codigosMsg');
  const resultado = document.getElementById('codigosResultado');

  const loteId = document.getElementById('cLoteId').value.trim();
  const cliente = document.getElementById('cCliente').value.trim();
  const cantidad = parseInt(document.getElementById('cCantidad').value, 10);
  const montoMXN = parseFloat(document.getElementById('cMonto').value) || 0;
  const notas = document.getElementById('cNotas').value.trim();

  if(!loteId || !cliente || !cantidad || cantidad < 1){
    msg.textContent = 'Completa ID de lote, cliente y una cantidad válida.';
    msg.className = 'modal-msg err';
    return;
  }
  if(cantidad > 500){
    msg.textContent = 'Genera lotes de máximo 500 códigos a la vez.';
    msg.className = 'modal-msg err';
    return;
  }

  msg.textContent = 'Generando códigos...';
  msg.className = 'modal-msg';
  resultado.value = '';

  try{
    const codigosUnicos = new Set();
    while(codigosUnicos.size < cantidad){
      codigosUnicos.add(generarCodigoAleatorio(8));
    }
    const listaCodigos = Array.from(codigosUnicos);

    const batch = writeBatch(db);

    listaCodigos.forEach(codigo=>{
      const ref = doc(db, 'codigosImpresion', codigo);
      batch.set(ref, {
        usado: false,
        loteId,
        fechaCreacion: serverTimestamp(),
        fechaUso: null
      });
    });

    const refLote = doc(db, 'lotes', loteId);
    batch.set(refLote, {
      cliente, cantidad, montoMXN, notas,
      fechaCreacion: serverTimestamp()
    });

    await batch.commit();

    ultimosCodigosGenerados = listaCodigos;
    resultado.value = listaCodigos.join('\n');
    msg.textContent = `✅ ${listaCodigos.length} códigos generados para el lote "${loteId}".`;
    msg.className = 'modal-msg';

  }catch(err){
    console.error(err);
    msg.textContent = 'No se pudieron generar los códigos (revisa que tu sesión siga activa).';
    msg.className = 'modal-msg err';
  }
}

function descargarComoTxt(){
  if(!ultimosCodigosGenerados.length) return;
  const contenido = ultimosCodigosGenerados.join('\n');
  const blob = new Blob([contenido], { type:'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'codigos_impresion.txt';
  a.click();
  URL.revokeObjectURL(url);
}
