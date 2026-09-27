# Análisis de PikaGames

Fecha: 26 de septiembre de 2026. Alcance: frontend `pikaweb` y backend `../backend`. Revisión de código, compilación, análisis estático, pruebas existentes y reproducciones aisladas de controladores.

**Diagnóstico:** el frontend compila y hay buenas bases de autenticación y componentes, pero el circuito catálogo → pedido → pago → entrega todavía no está integrado de manera fiable. La prioridad es corregir ese circuito antes de ampliar funcionalidades o rediseñar la interfaz.

## Herramientas y alcance real

| Herramienta | Estado y uso |
| --- | --- |
| Ponytail | Ya instalado. Aplicado para identificar código inalcanzable, dependencias sin uso y simplificaciones. |
| RTK | Ya instalado, versión 0.49.0. Usado para lint, TypeScript, Vitest y build. Algunos resúmenes ocultaron el motivo del fallo; se recuperó la salida con `rtk proxy`. No se configuraron hooks globales. |
| UI Skills | Instaladas desde `ibelick/ui-skills`: `baseline-ui`, `fixing-accessibility`, `fixing-metadata`, `improve-ui`, `ui-skills-root`, en `C:/Users/jerry/.codex/skills`. Para este análisis se aplicaron las tres primeras. Disponibles para descubrimiento en el siguiente turno. |
| Playwright Harness | No identificado en las ubicaciones de skills/plugins revisadas ni en el proyecto. No se instaló un paquete con nombre parecido: falta el enlace o nombre exacto. No se ejecutaron pruebas Playwright. |
| Context7 | Consultado para el uso actual de RTK. También se leyó la documentación de CLI incluida en el Next.js instalado. |

Origen de UI Skills: https://github.com/ibelick/ui-skills. No se modificó código de producto, dependencias del proyecto, credenciales ni datos. Se añadió este informe. Las carpetas `.rtk/` ya existían sin seguimiento; las ejecuciones pueden actualizar sus registros.

No se levantó el backend, no se hicieron pagos, no se enviaron mensajes ni se inspeccionó el sitio visualmente en navegador. No se verificaron datos reales, configuración del proveedor de pagos, infraestructura externa, métricas de rendimiento ni seguridad exhaustiva. Los hallazgos siguientes describen el código local.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `rtk tsc --noEmit --incremental false` | Sin errores. |
| `rtk lint` | 6 errores y 57 advertencias en 12 archivos. Los errores son `no-explicit-any`; las advertencias incluyen imports sin uso, imágenes y dependencias de hooks. |
| `rtk proxy npx --no-install vitest run` | 1 archivo, 2 pruebas aprobadas. Inicialmente el sandbox impidió crear el worker; pasó al ejecutar con permiso fuera del sandbox. |
| `rtk proxy npx --no-install next build` | Aprobado. El primer intento falló al descargar Google Fonts; pasó con acceso autorizado fuera del sandbox. |
| Controladores aislados con `node:vm`, mocks y `node:assert/strict` | Confirmados cuatro escenarios descritos abajo, sin red ni base de datos. Ejecución temporal, no suite permanente añadida al proyecto. |

Las dos pruebas existentes comprueban el render inicial de PayPal con y sin client ID. **No prueban creación de pedidos, cobro, autorización, webhook ni entrega.** El hook `.husky/pre-commit` solo contiene `# npm test`, y `package.json` no define script `test`.

## Hallazgos prioritarios

### 1. Alta: el cliente decide el importe del pedido

`../backend/src/controllers/pedido.controller.js:8` guarda `subtotal` y `total` directamente desde `req.body`, sin cargar productos, calcular precios ni crear detalles. `paypal.controller.js:32` usa después ese total para crear la orden de PayPal.

**Verificación:** con `Pedido.create` simulado, un total de `0.01` fue aceptado y devolvió 201. Esto demuestra la ausencia de validación en el controlador; no demuestra una entrega fraudulenta real.

**Corrección:** recibir identificadores de productos y cantidades, comprobar disponibilidad y calcular importes en el servidor. Crear pedido y detalles de forma atómica.

### 2. Alta: el checkout no registra su compra en el backend

`components/PayPalCheckoutButton.tsx:70` crea la orden con `actions.order.create` y la captura en la línea 85. En `app/comprar/[id]/page.tsx:109`, el éxito solo cambia `isPaypalPaid`. No hay llamadas del frontend a `/pedidos`, `/paypal/crear-orden` ni `/paypal/capturar-orden`.

El webhook busca un registro `Pago` por referencia externa que este recorrido no crea. Una confirmación de cobro en el navegador, por sí sola, no garantiza pedido persistido ni entrega.

**Corrección:** conectar el checkout con un pedido interno y las rutas de pago del servidor. Conservar la referencia de captura y mostrar éxito solo cuando el backend haya registrado el resultado verificado.

### 3. Alta: autorización y consistencia incompletas en PayPal

`../backend/src/controllers/paypal.controller.js:74` llama al proveedor antes de localizar el pago. La búsqueda de la línea 84 no comprueba propietario. `obtenerOrden` tampoco vincula la orden al usuario autenticado. Tener JWT no implica ser dueño de cualquier orden conocida.

Las actualizaciones de pago, pedido y comprobante son independientes. El webhook devuelve 200 incluso en el `catch` de la línea 217. Además, si `Pago` queda completado pero falla `Pedido.update`, el webhook posterior puede saltarse la reparación por la condición `pago.estado !== 'completado'`.

**Verificación:** un usuario diferente alcanzó la captura simulada; al fallar la actualización del pedido, el pago ya estaba completado. El mismo fallo durante el webhook devolvió 200 con error.

**Corrección:** comprobar propiedad antes de consultar/capturar; agrupar las escrituras locales en una transacción; hacer el procesamiento idempotente y permitir recuperar fallos parciales. La transacción local no puede deshacer un cobro externo: hace falta reconciliar por su referencia persistida.

### 4. Alta: cambios de esquema al arrancar el backend

`../backend/src/app.js:40` ejecuta `sequelize.sync({ alter: true })` al cargar la aplicación, también en producción. El proceso comienza a aceptar trabajo sin esperar a esa promesa.

**Riesgo:** cambios automáticos de tablas y carreras durante arranques o despliegues. No se ejecutó esta operación durante el análisis.

**Corrección:** separar las migraciones del arranque y aplicar cambios de esquema explícitos y versionados.

### 5. Alta: el cambio de contraseña puede impedir volver a entrar

`app/perfil/page.tsx:252` admite una contraseña nueva sin el límite del login. El backend la guarda en `auth.controller.js:122`. Sin embargo, `components/AuthModal.tsx:211` limita la entrada de contraseña a 15 caracteres.

**Caso:** guardar una contraseña de 20 caracteres desde Perfil y cerrar sesión; el formulario de acceso no permite escribirla completa.

**Corrección:** unificar las reglas de registro y cambio en el servidor y permitir introducir completa una contraseña válida en el login.

### 6. Alta: Guardados conserva un checkout diferente

`app/guardados/page.tsx:217` abre un modal activo que muestra $1,299 y enlaza a `paypal.me` en la línea 417. Catálogo y búsqueda llevan a `/comprar/[id]`, donde los precios son $650/$260 según tipo de cuenta. Guardados también promete despacho inmediato por correo, mientras el otro recorrido pide comprobante por WhatsApp.

**Corrección:** dirigir Guardados al checkout existente y usar una única fuente de precio, producto y condiciones de entrega.

### 7. Media: el fallback público elude la moderación

`../backend/src/controllers/comentario.controller.js:56` filtra comentarios aprobados, pero si la consulta falla vuelve a consultar sin filtro en la línea 66.

**Verificación:** al simular fallo en la primera consulta, el endpoint devolvió un comentario pendiente. Solo ocurre cuando falla la primera consulta y la segunda sí funciona.

**Corrección:** devolver un error controlado; no quitar el filtro de moderación como recuperación.

### 8. Media: errores de red se confunden con cambios de estado válidos

En `lib/AuthContext.tsx:134`, cualquier fallo de `/auth/me`, incluido uno de red o un 500, borra el token. En `lib/rawg.ts`, los fallos de catálogo y búsqueda se convierten en listas vacías. `app/buscar/page.tsx:92` tiene varias fuentes de búsqueda y no descarta respuestas anteriores.

**Consecuencias:** cierre de sesión por una interrupción temporal, mensajes de “sin resultados” durante errores y resultados antiguos que pueden sobrescribir la búsqueda nueva.

**Corrección:** conservar el estado HTTP en `apiFetch`, distinguir sesión inválida de servicio caído, separar error de resultado vacío y cancelar o ignorar solicitudes obsoletas.

### 9. Media: autenticación necesita validación adicional del servidor

`../backend/src/controllers/auth.controller.js` no valida una política uniforme de entradas en registro/cambio de contraseña. `Usuario.activo` existe, pero login y middleware no lo consultan. No se encontró limitación de intentos en las rutas locales de autenticación; podría existir fuera de este repositorio.

**Corrección:** validar tipos y longitudes, normalizar correo, respetar desactivación de cuentas y comprobar si la infraestructura limita intentos antes de duplicar esa protección.

## Interfaz: mejoras verificables por código

La identidad existente usa fondos oscuros, acento amarillo, tarjetas de juegos y navegación adaptada a móvil. Conviene conservarla. Sin capturas ni navegador no se calificó contraste, calidad visual, desbordamiento o usabilidad real.

- **Accesibilidad:** `components/AuthModal.tsx:123` usa un contenedor genérico para el diálogo; no hay gestión de foco ni cierre con Escape. Sus etiquetas no están asociadas a los inputs y los botones de cerrar/mostrar contraseña carecen de nombre accesible. Reutilizar las primitivas accesibles ya instaladas y asociar etiquetas y errores.
- **Idioma y SEO:** `app/layout.tsx:34` declara `lang="en"` en una interfaz española. Solo hay metadatos generales; faltan títulos particulares para las páginas y datos sociales de los juegos. Corregir idioma y añadir metadatos por página con datos reales.
- **Reservas:** `app/comprar/[id]/page.tsx:105` solo abre un modal, pero la confirmación dice “Has apartado 1 boleto” y menciona un plazo de cuatro horas. No hay persistencia ni vencimiento en ese recorrido. Ajustar el mensaje a lo que realmente ocurre o implementar una reserva persistente si esa es la operación comercial requerida.
- **Catálogo de demostración:** `app/catalogo/page.tsx:28` contiene seis juegos locales con identificadores artificiales, puntuaciones y descripciones fijas; la selección los ofrece junto al catálogo. Validar contra inventario real o etiquetarlos como demostración antes de ofrecerlos para compra. No se verificó externamente la veracidad comercial de cada título.

## Simplificaciones con Ponytail

- `delete:` quitar los modales de compra inalcanzables de Inicio, Catálogo y Búsqueda: sus estados comienzan cerrados y no tienen un camino que los abra; los botones activos ya navegan a `/comprar/[id]`. Aproximadamente 390 líneas de JSX, más estado e imports asociados. Referencias: `app/page.tsx:993`, `app/catalogo/page.tsx:531`, `app/buscar/page.tsx:460`. El modal de Guardados sí está activo: no es código muerto.
- `delete:` revisar la retirada de `next-intl`, `react-hook-form`, `resend`, `sonner` y `zod`: no se encontraron consumidores en el código de aplicación actual. Si se decide usar una para una corrección inmediata, conservarla con ese propósito.
- `yagni:` decidir si Prisma pertenece a una migración activa. El runtime revisado usa Sequelize y no importa `src/config/prisma.js`; Prisma sí participa en `postinstall`. Si no hay migración, retirar su configuración y dependencias conjuntamente, no solo el paquete.
- `delete:` los servicios `pedido.service.js`, `pago.service.js` y `promocion.service.js` contienen resultados simulados y no tienen consumidores en `src`. Evitar mantenerlos como si implementaran procesos reales.
- `shrink:` `ShapeGrid` acepta `speed`, `direction` y `hoverTrailAmount` sin usarlos. Retirar esas opciones o implementar solo las que el producto necesite. Sustituir toda la rejilla por CSS cambiaría el hover por celda; no es una equivalencia automática.

Potencial aproximado: **390 líneas de JSX y 5 dependencias directas del frontend menos**, antes de retirar imports y estado sobrantes. No se aplicaron estas eliminaciones ni se midió ahorro de bundle.

## Puntos buenos

- TypeScript y build de producción pasan; existe una base reproducible para avanzar.
- Contraseñas almacenadas con bcrypt; `/auth/me` excluye el hash y la actualización de perfil tampoco lo devuelve.
- JWT verificado en servidor y middleware administrativo utilizado en las rutas de administración revisadas.
- Favoritos filtrados por usuario y con índice único `(usuario_id, rawg_game_id)`, además de `findOrCreate`.
- La creación de orden PayPal del backend sí comprueba propietario y estado pendiente; el servicio incluye verificación de firma del webhook. Hay piezas útiles para completar la integración.
- Existen `apiFetch`, `GameCard`, `Button`, `cn` y contexto de autenticación: reutilizarlos permite mejorar sin añadir otra capa de infraestructura.
- El caso sin configuración de PayPal está contemplado y cubierto por una prueba, junto con el estado inicial cuando existe client ID.
- Hay estados de carga, vacíos, soporte y favoritos para visitantes; conviene conservarlos y distinguir mejor los errores.

## Orden recomendado

1. Completar y probar el circuito de pedido y pago: importe del servidor, autorización, persistencia, recuperación e idempotencia. Unificar Guardados con ese circuito.
2. Retirar cambios automáticos de esquema del arranque; resolver contraseña y fallback de moderación.
3. Corregir etiquetas, foco, idioma, errores de red y carreras de búsqueda.
4. Eliminar código inalcanzable y dependencias sin uso; dejar lint limpio y un comando de pruebas repetible.
5. Con el Harness identificado, verificar en navegador los recorridos de búsqueda, favoritos, autenticación y checkout en móvil/escritorio. Usar un entorno PayPal de pruebas y datos controlados para los pagos.

La primera prueba de negocio que falta es: manipular el importe enviado no debe cambiar el total calculado por el servidor. Después, comprobar que un usuario no puede consultar/capturar una orden ajena y que un webhook repetido o un fallo parcial no duplica ni pierde el pago.
