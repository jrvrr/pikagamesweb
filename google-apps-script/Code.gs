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
        !asunto || asunto.length > 120 || /[\r\n]/.test(asunto) ||
        !mensaje || mensaje.length > 5000) {
      throw new Error('Datos inválidos');
    }

    MailApp.sendEmail({
      to: CORREO_DESTINO,
      subject: 'PikaGames - ' + asunto,
      body: 'NUEVO MENSAJE DE SOPORTE\n\n' +
        'Correo del cliente: ' + correo + '\n' +
        'Asunto: ' + asunto + '\n\n' +
        'Mensaje:\n' + mensaje,
      htmlBody: crearCorreoHtml_(asunto, mensaje, correo),
      replyTo: correo,
      name: 'PikaGames Soporte',
    });
    return responder_({ success: true });
  } catch (error) {
    console.error(error);
    return responder_({ success: false, error: 'No se pudo enviar el mensaje' });
  }
}

function probarCorreo() {
  MailApp.sendEmail({
    to: CORREO_DESTINO,
    subject: 'Prueba de PikaGames',
    body: 'El sistema de soporte funciona correctamente.',
    htmlBody: crearCorreoHtml_('Prueba de PikaGames', 'El sistema de soporte funciona correctamente.', 'cliente@ejemplo.com'),
  });
}

function crearCorreoHtml_(asunto, mensaje, correo) {
  return `
    <div style="margin:0;padding:32px 12px;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border-collapse:separate;border-spacing:0;border-radius:18px;overflow:hidden;background:#111311;">
        <tr><td height="7" style="background:#ffd90f;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:30px 30px 24px;background:#111311;">
          <p style="margin:0 0 28px;color:#ffd90f;font-size:24px;font-weight:900;letter-spacing:2px;">PIKA<span style="color:#ffffff;">GAMES</span></p>
          <p style="margin:0 0 10px;color:#ff7a93;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">● Nuevo mensaje de soporte</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:900;word-break:break-word;">${escaparHtml_(asunto)}</h1>
        </td></tr>
        <tr><td style="padding:0 30px 16px;background:#111311;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;border:1px solid #343438;border-radius:12px;background:#18181b;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 6px;color:#a1a1aa;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Correo del cliente</p>
              <p style="margin:0;color:#ffd90f;font-size:15px;font-weight:700;word-break:break-all;">${escaparHtml_(correo)}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 30px 26px;background:#111311;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;border-left:4px solid #ffd90f;border-radius:10px;background:#202023;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 12px;color:#ff7a93;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">Mensaje</p>
              <p style="margin:0;color:#ffffff;font-size:15px;line-height:1.7;word-break:break-word;">${escaparHtml_(mensaje).replace(/\r\n|\r|\n/g, '<br>')}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 30px 30px;background:#111311;color:#a1a1aa;font-size:12px;line-height:1.5;">
          Responde a este correo para contestar directamente al cliente.<br>
          Enviado desde <span style="color:#ffd90f;">pikagames.shop</span>
        </td></tr>
        <tr><td height="5" style="background:#ff7a93;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
    </div>`;
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
