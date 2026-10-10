const CORREO_DESTINO = 'supportpikagames@gmail.com';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Cuerpo de la solicitud vacío');
    }

    const datos = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SUPPORT_MAIL_SECRET');
    if (!secret || datos.secret !== secret) {
      throw new Error('No autorizado');
    }

    const asunto = String(datos.asunto || '').trim();
    const mensaje = String(datos.mensaje || '').trim();
    const correo = String(datos.correo || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254 ||
        !asunto || asunto.length > 220 || contarPalabras_(asunto) > 30 || /[\r\n]/.test(asunto) ||
        !mensaje || mensaje.length > 5000) {
      throw new Error('Datos inválidos');
    }

    enviarCorreo_(asunto, mensaje, correo);
    return responder_({ success: true });
  } catch (error) {
    console.error('Error en doPost:', error);
    return responder_({ success: false, error: 'No se pudo enviar el mensaje' });
  }
}

function probarCorreo() {
  enviarCorreo_(
    'Problema con la entrega de mi pedido',
    'Hola equipo de PikaGames,\n\nQuería consultar sobre el estado de mi compra realizada el día de ayer. Agradezco su pronta atención.',
    'cliente.ejemplo@gmail.com'
  );
}

function enviarCorreo_(asunto, mensaje, correo) {
  const ticketId = Utilities.getUuid().slice(0, 8).toUpperCase();
  const asuntoCorreo = `[PikaGames Soporte #${ticketId}] ${asunto}`;
  
  const textoPlano = 
    `==========================================\n` +
    `NUEVO MENSAJE DE SOPORTE - PIKAGAMES\n` +
    `==========================================\n\n` +
    `Ticket ID: #${ticketId}\n` +
    `Cliente: ${correo}\n` +
    `Asunto: ${asunto}\n` +
    `Fecha: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}\n\n` +
    `---------------- MENSAJE ----------------\n` +
    `${mensaje}\n` +
    `-----------------------------------------\n\n` +
    `Para responder, simplemente contesta a este correo electrónico.\n` +
    `Enviado desde el portal de soporte de pikagames.shop`;

  const htmlBody = crearCorreoHtml_(asunto, mensaje, correo, ticketId);

  // 1. Envío del correo usando GmailApp con remitente configurado y replyTo
  GmailApp.sendEmail(CORREO_DESTINO, asuntoCorreo, textoPlano, {
    htmlBody: htmlBody,
    replyTo: correo,
    name: `PikaGames Soporte (${correo})`,
  });

  // 2. Colocar en la bandeja de 'Recibidos' (Inbox) y marcar como No Leído
  // En Gmail, cuando una cuenta se envía un correo a sí misma, por defecto va a 'Enviados' y 'Todos'.
  // Esta búsqueda asegura que se mueva inmediatamente a 'Recibidos'.
  try {
    Utilities.sleep(300);
    const busqueda = GmailApp.search(`subject:"#${ticketId}"`, 0, 1);
    if (busqueda && busqueda.length > 0) {
      busqueda[0].moveToInbox();
      busqueda[0].markUnread();
    }
  } catch (error) {
    console.warn('No se pudo mover el hilo a Recibidos automáticamente:', error);
  }
}

function crearCorreoHtml_(asunto, mensaje, correo, ticketId) {
  const fechaStr = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
  const asuntoEscapado = escaparHtml_(asunto);
  const correoEscapado = escaparHtml_(correo);
  const mensajeFormateado = escaparHtml_(mensaje).replace(/\r\n|\r|\n/g, '<br>');
  const mailtoReply = `mailto:${encodeURIComponent(correo)}?subject=${encodeURIComponent('Re: [PikaGames #' + ticketId + '] ' + asunto)}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Mensaje de Soporte - PikaGames</title>
</head>
<body style="margin:0;padding:0;background-color:#0e0e11;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0e11;padding:30px 12px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
          
          <!-- Encabezado / Branding -->
          <tr>
            <td style="background-color:#09090b;padding:28px 32px;border-bottom:2px solid #ffd90f;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;text-transform:uppercase;">
                      PIKA<span style="color:#ffd90f;">GAMES</span>
                    </span>
                    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#ffd90f;text-transform:uppercase;margin-top:4px;">
                      Centro de Soporte al Cliente
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;padding:6px 12px;background-color:rgba(255,217,15,0.12);border:1px solid #ffd90f;border-radius:20px;font-size:12px;font-weight:700;color:#ffd90f;">
                      #${ticketId}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                📬 Nuevo mensaje recibido desde la web
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.5;">
                Un usuario ha enviado una solicitud a través del formulario de contacto. A continuación se detallan los datos:
              </p>

              <!-- Tabla de Metadatos -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#27272a;border-radius:10px;margin-bottom:24px;border-collapse:separate;">
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #3f3f46;width:30%;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#ffd90f;">
                    👤 Cliente
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #3f3f46;font-size:14px;color:#ffffff;font-weight:600;word-break:break-all;">
                    <a href="mailto:${correoEscapado}" style="color:#ffffff;text-decoration:none;">${correoEscapado}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #3f3f46;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#ffd90f;">
                    📝 Asunto
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #3f3f46;font-size:14px;color:#ffffff;font-weight:600;">
                    ${asuntoEscapado}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#ffd90f;">
                    ⏰ Fecha
                  </td>
                  <td style="padding:14px 18px;font-size:13px;color:#d4d4d8;">
                    ${fechaStr} (Hora CDMX)
                  </td>
                </tr>
              </table>

              <!-- Sección del Mensaje -->
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;margin-bottom:8px;">
                💬 Contenido del Mensaje
              </div>
              <div style="background-color:#09090b;border:1px solid #27272a;border-left:4px solid #ffd90f;border-radius:8px;padding:18px 20px;margin-bottom:28px;font-size:15px;line-height:1.7;color:#f4f4f5;word-break:break-word;">
                ${mensajeFormateado}
              </div>

              <!-- Botón de Respuesta Rápida (CTA) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${mailtoReply}" target="_blank" style="display:inline-block;padding:14px 28px;background-color:#ffd90f;color:#09090b;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;text-align:center;box-shadow:0 4px 14px rgba(255,217,15,0.3);">
                      ↩ Responder al Cliente
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color:#09090b;padding:20px 32px;border-top:1px solid #27272a;font-size:12px;color:#71717a;line-height:1.6;text-align:center;">
              <p style="margin:0 0 6px;">
                💡 <strong>Tip:</strong> Puedes pulsar el botón de responder o responder directamente a este correo (se enviará a <span style="color:#a1a1aa;">${correoEscapado}</span>).
              </p>
              <p style="margin:0;color:#52525b;font-size:11px;">
                © PikaGames • Enviado de forma segura desde <a href="https://pikagames.shop" style="color:#ffd90f;text-decoration:none;">pikagames.shop</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

