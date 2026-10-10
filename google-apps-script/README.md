# Correo de soporte con Google Apps Script

1. Reemplaza el contenido de `Código.gs` del proyecto **pikagames** con [`Code.gs`](./Code.gs). Conserva tu formato `asunto`/`mensaje`/`correo` y la respuesta `success`; esta versión corrige `tucorreo@gmail.com` y comprueba una clave privada.
2. En **Configuración del proyecto → Propiedades de la secuencia de comandos**, crea `SUPPORT_MAIL_SECRET` con el valor de la misma variable en `.env.local`. No publiques ese valor.
3. En **Implementar → Administrar las implementaciones**, edita la implementación web existente, elige una **versión nueva**, **Ejecutar como: yo** y **Quién tiene acceso: cualquier persona** (sin iniciar sesión de Google). Autoriza el permiso para enviar correo. Conserva la URL `/exec`.
4. En el servidor de producción configura `SUPPORT_MAIL_SCRIPT_URL` con esa URL y `SUPPORT_MAIL_SECRET` con el mismo valor privado. Vuelve a desplegar la web. En local, reinicia `next dev` después de cambiar `.env.local`.

Si el formulario devuelve **502** y el servidor registra **401**, la implementación no permite acceso anónimo. Edita la implementación web existente y selecciona **Cualquier persona**; guarda una versión nueva. Abrir la URL con tu sesión de Google no comprueba el acceso desde el servidor.

Los mensajes van a `pikagamestore@gmail.com` y la respuesta usa el correo que el cliente escribe en el formulario.
