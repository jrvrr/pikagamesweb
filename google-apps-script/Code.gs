const CORREO_DESTINO = 'supportpikagames@gmail.com';

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SUPPORT_MAIL_SECRET');
    if (!secret || datos.secret !== secret) throw new Error('No autorizado');

    const asunto = String(datos.asunto || '').trim();
    const mensaje = String(datos.mensaje || '').trim();
    const correo = String(datos.correo || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254 ||
        !asunto || asunto.length > 220 || contarPalabras_(asunto) > 30 || /[\r\n]/.test(asunto) ||
        !mensaje || mensaje.length > 5000 || contarPalabras_(mensaje) > 50) {
      throw new Error('Datos inválidos');
    }

    enviarCorreo_(asunto, mensaje, correo);
    return responder_({ success: true });
  } catch (error) {
    console.error(error);
    return responder_({ success: false, error: 'No se pudo enviar el mensaje' });
  }
}

function probarCorreo() {
  enviarCorreo_('Prueba interna', 'Este mensaje solo comprueba el diseño del correo.', 'ejemplo@correo.com');
}

function enviarCorreo_(asunto, mensaje, correo) {
  const asuntoCorreo = 'PikaGames - ' + asunto + ' [' + Utilities.getUuid().slice(0, 8) + ']';
  const texto = 'NUEVO MENSAJE DE SOPORTE\n\n' +
    'Correo del cliente: ' + correo + '\n' +
    'Asunto: ' + asunto + '\n\n' +
    'Mensaje:\n' + mensaje;
  const enviado = GmailApp.createDraft(CORREO_DESTINO, asuntoCorreo, texto, {
    htmlBody: crearCorreoHtml_(asunto, mensaje, correo),
    replyTo: correo,
    name: 'PikaGames Soporte',
  }).send();
  try {
    enviado.getThread().moveToInbox().markUnread();
  } catch (error) {
    // El correo ya salió; fallar aquí provocaría un reintento duplicado.
    console.error('Correo enviado, pero no se pudo colocar en Recibidos:', error);
  }
}

function crearCorreoHtml_(asunto, mensaje, correo) {
  return `
    <div style="margin:0;padding:32px 12px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#242424;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border:1px solid #e2e2e2;border-collapse:collapse;background:#ffffff;">
        <tr><td style="padding:30px 36px 22px;">
          <p style="margin:0;color:#1f1f1f;font-size:18px;font-weight:700;">PikaGames</p>
          <p style="margin:6px 0 0;color:#666666;font-size:12px;">Atención al cliente</p>
        </td></tr>
        <tr><td style="padding:0 36px;"><div style="border-top:1px solid #e2e2e2;"></div></td></tr>
        <tr><td style="padding:28px 36px 24px;">
          <h1 style="margin:0 0 22px;color:#242424;font-size:22px;line-height:1.3;font-weight:700;">Nuevo mensaje de soporte</h1>
          <p style="margin:0 0 8px;color:#666666;font-size:12px;font-weight:700;">ASUNTO</p>
          <p style="margin:0 0 22px;color:#242424;font-size:16px;line-height:1.5;word-break:break-word;">${escaparHtml_(asunto)}</p>
          <p style="margin:0 0 8px;color:#666666;font-size:12px;font-weight:700;">CORREO DEL CLIENTE</p>
          <p style="margin:0 0 22px;font-size:15px;word-break:break-all;"><a href="mailto:${escaparHtml_(correo)}" style="color:#1457a6;text-decoration:underline;">${escaparHtml_(correo)}</a></p>
          <p style="margin:0 0 8px;color:#666666;font-size:12px;font-weight:700;">MENSAJE</p>
          <p style="margin:0;color:#242424;font-size:15px;line-height:1.7;word-break:break-word;">${escaparHtml_(mensaje).replace(/\r\n|\r|\n/g, '<br>')}</p>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid #e2e2e2;color:#666666;font-size:12px;line-height:1.5;">
          Responde a este mensaje para contactar al cliente.<br>
          Enviado desde pikagames.shop
        </td></tr>
      </table>
    </div>`;
}

function contarPalabras_(valor) {
  return valor.trim() ? valor.trim().split(/\s+/).length : 0;
}

function escaparHtml_(valor) {
  return String(valor).replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[caracter]);
}

function responder_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
