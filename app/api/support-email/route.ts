const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > 10000) {
    return Response.json({ error: "El mensaje es demasiado largo." }, { status: 413 });
  }

  let data: unknown;
  try {
    const body = await request.text();
    if (body.length > 10000) {
      return Response.json({ error: "El mensaje es demasiado largo." }, { status: 413 });
    }
    data = JSON.parse(body);
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!data || typeof data !== "object") {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { email, subject, message, website } = data as Record<string, unknown>;
  // shortcut: El honeypot no frena abuso sostenido; añadir un límite persistente si aparece spam.
  if (website) return Response.json({ ok: true });
  if (
    typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim()) ||
    typeof subject !== "string" || !subject.trim() || subject.length > 120 || /[\r\n]/.test(subject) ||
    typeof message !== "string" || !message.trim() || message.length > 5000
  ) {
    return Response.json({ error: "Revisa tu correo, asunto y mensaje." }, { status: 400 });
  }

  const url = process.env.SUPPORT_MAIL_SCRIPT_URL;
  const secret = process.env.SUPPORT_MAIL_SECRET;
  if (!url || !secret) {
    console.error("Falta la configuración del correo de soporte.");
    return Response.json({ error: "El correo no está disponible por ahora." }, { status: 503 });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: email.trim(), asunto: subject.trim(), mensaje: message.trim(), secret }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new Error(response.status === 401 || response.status === 403
        ? `Apps Script rechazó el acceso anónimo (${response.status}). Revisa los permisos de la implementación.`
        : `Apps Script respondió con HTTP ${response.status}.`);
    }
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error("Apps Script no devolvió JSON. Revisa el acceso y la versión publicada.");
    }
    const result = await response.json();
    if (result?.success !== true) throw new Error("El script no confirmó el envío.");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error al enviar correo de soporte:", error);
    return Response.json({ error: "No se pudo enviar el correo. Inténtalo de nuevo." }, { status: 502 });
  }
}
