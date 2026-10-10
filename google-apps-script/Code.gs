const CORREO_DESTINO = 'pikagamestore@gmail.com';

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
  });
}

function responder_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
