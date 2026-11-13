/*!
 * Pato Tours · Asistente virtual (burbuja)
 * Uso:
 *   <script src="https://mee2809.github.io/patotours/chat/patotours-chat.js"></script>
 *   <script>PatoChat.mount({ scriptUrl: "https://script.google.com/macros/s/.../exec" });</script>
 * Opciones: scriptUrl (obligatoria salvo que pases enviar), color, nombre, bienvenida, sugerencias,
 *   enviar(historial) → Promise<texto>  (para usar otro backend, p. ej. google.script.run),
 *   id (separa el historial guardado de distintos chats).
 */
(function () {
  var montado = false;

  function mount(config) {
    config = config || {};
    if (montado) return;
    if (!config.scriptUrl && !config.enviar) { console.error('PatoChat: falta scriptUrl'); return; }
    if (!document.body) { document.addEventListener('DOMContentLoaded', function () { mount(config); }); return; }
    montado = true;

    var SCRIPT_URL = config.scriptUrl;
    var CLAVE_HISTORIAL = 'pato_chat_' + (config.id || 'publico');
    var pedir = config.enviar || function (historial) {
      return fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },  // evita el preflight CORS
        body: JSON.stringify({ accion: 'chat', mensajes: historial })
      })
        .then(function (r) { return r.json(); })
        .then(function (out) { if (!out.ok) throw new Error(out.error); return out.respuesta; });
    };
    var COLOR = config.color || '#0284c7';
    var NOMBRE = config.nombre || 'Pato · Asistente';
    var BIENVENIDA = config.bienvenida || '¡Hola! Soy Pato 🤖, el asistente de Pato Tours. Te cuento sobre nuestros tours al Salar de Uyuni, Laguna Colorada y Laguna Verde: precios, fechas y cupos. ¿Qué te gustaría saber?';
    var SUGERENCIAS = config.sugerencias || ['¿Qué tours tienen?', '¿Qué salidas hay esta semana?', '¿Hay promociones?'];


    var ROBOT = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="' + COLOR + '"/>' +
      '<line x1="32" y1="10" x2="32" y2="17" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="9" r="3.5" fill="#fbbf24"/>' +
      '<rect x="15" y="17" width="34" height="27" rx="9" fill="#fff"/><rect x="11" y="25" width="4" height="10" rx="2" fill="#fff"/><rect x="49" y="25" width="4" height="10" rx="2" fill="#fff"/>' +
      '<circle cx="25" cy="29" r="4.5" fill="' + COLOR + '"/><circle cx="39" cy="29" r="4.5" fill="' + COLOR + '"/><circle cx="26.3" cy="27.7" r="1.5" fill="#fff"/><circle cx="40.3" cy="27.7" r="1.5" fill="#fff"/>' +
      '<path d="M25 37.5 q7 5 14 0" stroke="' + COLOR + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<rect x="22" y="46" width="20" height="8" rx="3" fill="#fff" opacity=".9"/></svg>';

    var CSS = '' +
      ':host{all:initial}' +
      '*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.burbuja{position:fixed;right:20px;bottom:20px;width:64px;height:64px;border-radius:50%;border:0;padding:0;cursor:pointer;background:none;box-shadow:0 8px 24px rgba(15,23,42,.3);z-index:2147483647;transition:transform .2s}' +
      '.burbuja:hover{transform:scale(1.07)}.burbuja:focus-visible{outline:3px solid #fbbf24;outline-offset:3px}' +
      '.burbuja svg{width:64px;height:64px;display:block}' +
      '.aviso{position:fixed;right:92px;bottom:34px;background:#fff;color:#0f172a;font-size:14px;padding:8px 12px;border-radius:12px;box-shadow:0 6px 18px rgba(15,23,42,.18);z-index:2147483647;max-width:220px}' +
      '.panel{position:fixed;right:20px;bottom:96px;width:370px;height:560px;max-height:calc(100vh - 120px);background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(15,23,42,.35);display:flex;flex-direction:column;overflow:hidden;z-index:2147483647}' +
      '.panel[hidden],.aviso[hidden]{display:none}' +
      '.cab{background:' + COLOR + ';color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}' +
      '.cab svg{width:36px;height:36px;flex:none;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.6)}' +
      '.cab b{display:block;font-size:15px}.cab small{font-size:12px;opacity:.85}' +
      '.cerrar{margin-left:auto;background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}.cerrar:hover{background:rgba(255,255,255,.15)}' +
      '.log{flex:1;overflow-y:auto;padding:14px;background:#f1f5f9;display:flex;flex-direction:column;gap:10px}' +
      '.msg{max-width:85%;padding:9px 12px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;color:#0f172a}' +
      '.bot{background:#fff;border:1px solid #e2e8f0;border-bottom-left-radius:4px;align-self:flex-start}' +
      '.yo{background:' + COLOR + ';color:#fff;border-bottom-right-radius:4px;align-self:flex-end}' +
      '.escribiendo{color:#64748b;font-style:italic}' +
      '.sug{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#f1f5f9}' +
      '.sug button{border:1px solid ' + COLOR + ';color:' + COLOR + ';background:#fff;border-radius:999px;padding:5px 10px;font-size:12.5px;cursor:pointer}.sug button:hover{background:#e0f2fe}' +
      'form{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0;background:#fff}' +
      'input{flex:1;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:14px;color:#0f172a;outline:none;min-width:0}input:focus{border-color:' + COLOR + '}' +
      '.enviar{background:' + COLOR + ';color:#fff;border:0;border-radius:12px;padding:0 14px;font-size:14px;font-weight:600;cursor:pointer}.enviar:disabled{opacity:.5;cursor:default}' +
      '@media (max-width:480px){.panel{right:8px;left:8px;width:auto;bottom:88px;height:calc(100vh - 110px)}.aviso{display:none}}';

    var host = document.createElement('div');
    host.id = 'patotours-chat';
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="aviso" hidden>¿Dudas sobre tu tour? ¡Pregúntame! 👋</div>' +
      '<section class="panel" hidden role="dialog" aria-label="Chat con el asistente de Pato Tours">' +
      '  <div class="cab">' + ROBOT + '<div><b></b><small>Responde al instante</small></div><button class="cerrar" aria-label="Cerrar chat">×</button></div>' +
      '  <div class="log" aria-live="polite"></div><div class="sug"></div>' +
      '  <form><input maxlength="1500" autocomplete="off" placeholder="Escribe tu pregunta..." aria-label="Tu mensaje"><button class="enviar" type="submit">Enviar</button></form>' +
      '</section>' +
      '<button class="burbuja" aria-label="Abrir chat con el asistente de Pato Tours">' + ROBOT + '</button>';

    var $ = function (s) { return root.querySelector(s); };
    $('.cab b').textContent = NOMBRE;
    var historial = [];
    try { historial = JSON.parse(sessionStorage.getItem(CLAVE_HISTORIAL) || '[]'); } catch (e) { historial = []; }

    function guardar() { try { sessionStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial.slice(-20))); } catch (e) {} }

    function burbujaMsg(quien, texto) {
      var d = document.createElement('div');
      d.className = 'msg ' + quien;
      d.textContent = texto;  // texto plano, nunca HTML
      $('.log').appendChild(d);
      $('.log').scrollTop = $('.log').scrollHeight;
      return d;
    }

    function pintarInicio() {
      burbujaMsg('bot', BIENVENIDA);
      historial.forEach(function (m) { burbujaMsg(m.role === 'user' ? 'yo' : 'bot', m.content); });
      if (!historial.length) SUGERENCIAS.forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = s;
        b.onclick = function () { enviar(s); };
        $('.sug').appendChild(b);
      });
    }

    function abrir(abierto) {
      $('.panel').hidden = !abierto;
      $('.aviso').hidden = true;
      if (abierto) {
        if (!$('.log').children.length) pintarInicio();
        $('input').focus();
      }
    }

    function enviar(texto) {
      texto = (texto || '').trim();
      if (!texto || $('.enviar').disabled) return;
      $('.sug').innerHTML = '';
      historial.push({ role: 'user', content: texto });
      burbujaMsg('yo', texto);
      var espera = burbujaMsg('bot escribiendo', 'Pato está escribiendo...');
      $('.enviar').disabled = true;
      Promise.resolve()
        .then(function () { return pedir(historial.slice()); })
        .then(function (respuesta) {
          espera.className = 'msg bot';
          espera.textContent = respuesta;
          historial.push({ role: 'assistant', content: respuesta });
          guardar();
        })
        .catch(function (err) {
          espera.className = 'msg bot';
          espera.textContent = (err && err.message) || 'No pude responder. Intenta de nuevo en un momento.';
          historial.pop();
        })
        .then(function () { $('.enviar').disabled = false; $('input').focus(); });
    }

    $('.burbuja').onclick = function () { abrir($('.panel').hidden); };
    $('.cerrar').onclick = function () { abrir(false); $('.burbuja').focus(); };
    $('form').onsubmit = function (e) { e.preventDefault(); var t = $('input').value; $('input').value = ''; enviar(t); };
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('.panel').hidden) { abrir(false); $('.burbuja').focus(); } });
    setTimeout(function () { if ($('.panel').hidden) $('.aviso').hidden = false; }, 4000);
  }

  window.PatoChat = { mount: mount };
})();
