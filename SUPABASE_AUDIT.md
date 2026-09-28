# Auditoría de Supabase y backend

Fecha: 27 de septiembre de 2026.

## Proyecto confirmado por el usuario

**Proyecto objetivo confirmado:** [murytoaciijmxladhpki](https://supabase.com/dashboard/project/murytoaciijmxladhpki).
**Backend:** `C:\Users\jerry\pikaweb\backend`.

Se verificó que el identificador de proyecto de la conexión configurada en el backend coincide con el enlace proporcionado. No se mostraron ni copiaron credenciales. Una nueva consulta PostgreSQL con `transaction_read_only=on` confirmó `public.usuarios.email`, `usuarios.id BIGINT` y `pagos.pedido_id`. No existen `public.users`, `rifas`, `boletos`, `compras`, `premios` ni `ganadores` en este proyecto según el catálogo inspeccionado.

**El SVG aportado identifica un proyecto distinto:** `mqxoywyqeiqwwutiyyao`. Contiene `users.correo`, IDs UUID y las tablas de rifas. No describe la conexión del backend ni el proyecto del enlace confirmado. No se ha accedido en vivo a ese otro proyecto. Su inventario visual se conserva en el anexo C, separado de los hallazgos remotos.

Esta confirmación sustituye la interpretación provisional que consideraba el SVG como proyecto objetivo. **Los hallazgos de la auditoría remota de videojuegos sí corresponden al proyecto del enlace.** Sus propuestas SQL siguen siendo propuestas no ejecutadas, sujetas a revisión; no deben trasladarse al proyecto del SVG.

El registro del backend actual debe alinearse con `usuarios.email` y el contrato BIGINT de esta BD; no basta con cambiar un nombre. No se ha realizado esa corrección: la instrucción vigente es auditar sin modificar código o datos.

Alcance: repositorio `pikaweb`, backend indicado y conexión PostgreSQL local que coincide con el proyecto confirmado. No se verificó la configuración de conexión del despliegue remoto.

## Resumen ejecutivo

**El esquema consultado no es un sistema de rifas. Es el esquema de videojuegos de PikaGames. El registro está apuntando a una tabla y una columna que no existen en esta conexión.**

Se confirmó mediante conexión real, sin escrituras:

- Existe `public.usuarios.email`, con `usuarios.id BIGINT` autoincremental.
- No existe `public.users`, ni la columna `correo` en `public.usuarios`.
- Sí existe `auth.users`, administrada por Supabase Auth, con `id UUID`, `email` y `encrypted_password`. **No es la tabla de cuentas utilizada por este backend.**
- No existen `rifas`, `boletos`, `compras`, `premios` ni `ganadores` en las tablas/vistas de los esquemas inspeccionados; tampoco hay implementación de esas entidades en este repositorio.
- `public.pagos` pertenece a pedidos de videojuegos, no a compras de boletos.
- La configuración actual del backend usa `users.correo`, genera UUID y exige UUID en JWT. Hay varios desajustes independientes, no únicamente un nombre equivocado.
- Hay una incompatibilidad crítica entre los estados de PayPal que escribe Node.js y las restricciones `CHECK` reales.
- La política de inserción de comentarios permite a `anon` insertar comentarios ya aprobados si la Data API expone `public`.

El cambio previo a `users.correo` se hizo sin verificar el esquema remoto y no coincide con esta conexión. Esta auditoría **no revierte ni modifica código**: documenta la evidencia y la corrección recomendada. Si las tablas de rifas están en otro proyecto, hace falta identificar ese proyecto y su backend; no se extrapolan conclusiones a una BD no inspeccionada.

## Método, alcance y límites

La conexión utilizó las credenciales locales existentes sin mostrarlas ni copiarlas al informe. Se estableció `default_transaction_read_only=on`; cada inspección se ejecutó en una transacción `REPEATABLE READ READ ONLY` y terminó con `ROLLBACK`. Se verificó `transaction_read_only = on`.

Se consultaron catálogos PostgreSQL e `information_schema`: tablas, columnas, PK, FK, UNIQUE, CHECK, índices, defaults, nulabilidad, políticas, privilegios, triggers, funciones propias, extensiones e historial de migraciones. Se hicieron consultas `LIMIT 0` para validar nombres y agregados sin datos personales. No se invocaron funciones de negocio, endpoints de registro, compras, PayPal, sorteos ni escrituras de prueba. No se leyeron filas de `auth.users`, hashes ni datos de cuentas digitales.

No se ejecutaron migraciones, DDL, INSERT, UPDATE, DELETE ni commits. No se verificó que el despliegue remoto use la misma conexión que el backend local. Tampoco se inspeccionó la configuración externa de Data API, Edge Functions, firewall, tareas de terceros o secretos de Vercel/Supabase. Los riesgos condicionados a esas configuraciones se indican como tales.

## 1. Estado actual y tablas solicitadas

| Tabla solicitada | Resultado real | Qué puede verificarse |
|---|---|---|
| `users` | Ausente en `public`; existe `auth.users` | Supabase Auth tiene UUID y columnas propias; no sustituye a `public.usuarios` |
| `rifas` | Ausente | No se puede auditar su esquema, reglas ni RLS |
| `boletos` | Ausente | No se puede verificar disponibilidad, reservas ni ventas |
| `compras` | Ausente | La aplicación usa `pedidos` y `pedido_detalle` |
| `premios` | Ausente | No se puede verificar asignación |
| `ganadores` | Ausente | No se puede verificar ganador único por usuario/rifa ni cantidad de ganadores |
| `pagos` | Presente en `public` | FK a `pedidos`; estado, importes, índices e idempotencia revisados |

Las 14 tablas de aplicación son: `usuarios`, `videojuegos`, `productos_videojuego`, `promociones`, `promocion_productos`, `carritos`, `carrito_detalle`, `pedidos`, `pedido_detalle`, `pagos`, `comprobantes`, `entregas`, `cuentas_producto` y `comentarios`.

Se encontraron **101 columnas, 84 restricciones y 51 índices** en `public`. Todas las restricciones registradas están validadas. Todas las tablas de `public` tienen RLS habilitada y `FORCE ROW LEVEL SECURITY` deshabilitada. Solo hay dos políticas, ambas de comentarios. No hay triggers de aplicación ni funciones propias en `public`; se excluyen funciones de extensiones y componentes internos de Supabase de esa afirmación.

### Identidad de usuario

`public.usuarios` contiene:

| Columna | Tipo | Nulabilidad/default |
|---|---|---|
| `id` | BIGINT | PK, NOT NULL, secuencia autoincremental |
| `nombre`, `apellidos` | VARCHAR(30) | NOT NULL, sin default |
| `email` | VARCHAR(50) | NOT NULL, UNIQUE sensible a mayúsculas |
| `password_hash` | TEXT | NOT NULL |
| `rol` | VARCHAR(20) | NOT NULL, default `cliente`, CHECK `cliente/admin` |
| `activo` | BOOLEAN | NOT NULL, default true |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL, sin default ni trigger |

Los timestamps sin default funcionan cuando Sequelize los proporciona; las inserciones SQL o clientes alternativos deben enviarlos. No son, por sí solos, la causa demostrada del registro fallido.

### Pagos

`public.pagos`: `id BIGINT` PK autoincremental; `pedido_id BIGINT NOT NULL` FK a `pedidos(id)` con borrado en cascada y UNIQUE; `metodo VARCHAR(30) NOT NULL` restringido a `paypal/transferencia`; `estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'`; `monto NUMERIC(10,2) NOT NULL CHECK >= 0`; `referencia_externa VARCHAR(200)`, `fecha_pago TIMESTAMPTZ`, `paypal_request_id UUID`, `paypal_capture_id VARCHAR(64)` permiten NULL; `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

Hay índices únicos sobre `pedido_id`, `referencia_externa`, `paypal_request_id` y `paypal_capture_id`. La nulabilidad de identificadores remotos permite la etapa previa a crear/capturar la orden; no implica por sí sola un defecto.

## 2. Problemas críticos

### C1. Registro/login apuntan a una relación inexistente — confirmado

Evidencia: `../backend/src/models/auth.model.js:19` mapea `email` a `correo`; línea 39 fija `tableName: 'users'`. `src/controllers/auth.controller.js:10` consulta `lower(btrim(correo))`.

Pruebas remotas de solo lectura:

```sql
-- Falló con SQLSTATE 42P01: relación inexistente.
SELECT id, nombre, apellidos, correo, password_hash, rol, activo,
       created_at, updated_at
FROM users LIMIT 0;

-- Correcta; cero filas devueltas por diseño.
SELECT id, nombre, apellidos, email, password_hash, rol, activo,
       created_at, updated_at
FROM public.usuarios LIMIT 0;
```

`registrar` consulta antes de crear la cuenta; ese error termina en `authError`, que devuelve el JSON genérico de 500. Esto demuestra una causa suficiente para el síntoma con la conexión local actual; no se ha inspeccionado el SQLSTATE del proceso remoto que generó el log del usuario.

**Recomendación:** confirmar el proyecto objetivo y alinear el backend con `public.usuarios.email`. No crear `users` ni renombrar tablas para ocultar el desajuste. La migración de correo actual también apunta a la relación inexistente.

### C2. UUID en Node.js frente a BIGINT en la BD — confirmado

`Usuario.id` está definido como UUID con default UUIDV4, pero `usuarios.id` es BIGINT generado por secuencia. `Carrito.usuario_id` y `Pedido.usuario_id` se definen como UUID, mientras sus columnas reales son BIGINT con FK a `usuarios`. `Comentario.user_id` es STRING en el modelo y BIGINT en BD. `Favorito.usuario_id` también espera UUID, aunque su tabla ni siquiera existe en esta BD.

El middleware `src/middlewares/auth.js:11` acepta exclusivamente IDs con forma de UUID. Cambiar solo tabla/columna deja dos fallos adicionales: insertar UUID en BIGINT y rechazar los JWT con IDs reales numéricos.

**Recomendación:** mantener las PK/FK BIGINT existentes, corregir modelos y validación del JWT de forma coordinada y transportar BIGINT como texto decimal validado, sin conversión insegura a `Number`. No convertir ni regenerar identificadores de usuarios. No confundir la PK de `auth.users` con la de `public.usuarios`.

### C3. El pago remoto puede completarse y el registro local fallar por CHECK — confirmado estructuralmente

| Tabla | Valores admitidos actualmente en BD | Valores que escribe el controlador y que la BD rechaza |
|---|---|---|
| `pagos.estado` | pendiente, aprobado, rechazado, cancelado | completado, reembolsado, reembolso_parcial |
| `pedidos.estado` | pendiente_pago, pagado, procesando, entregado, cancelado | rechazado, reembolsado, reembolso_parcial |
| `comprobantes.estado` | pendiente_revision, aprobado, rechazado | reembolsado, reembolso_parcial |
| `entregas.estado` | pendiente, procesando, entregado, cancelado | retenida |

Evidencia: `src/controllers/paypal.controller.js:110` traduce `COMPLETED` a `completado`; líneas 122–141 actualizan esas tablas. La captura externa ocurre antes de esas escrituras. El rollback local no revierte un cobro remoto y los reintentos no resuelven una restricción incompatible. El rechazo también puede revertirse localmente al intentar escribir `pedidos.estado = 'rechazado'`.

Se observó la tabla `pagos` vacía en la instantánea: **no se afirma que ya existan cobros perdidos**. No se llamó a PayPal. La configuración del código revisado solo permite Sandbox.

**Recomendación:** acordar un vocabulario único de estados y una migración explícita que preserve estados históricos y admita las transiciones reales. Verificar luego captura, rechazo, reembolso parcial/total y reconciliación contra una BD de pruebas con estos CHECK. No cambiar el flujo de Fase 2 durante esta auditoría.

### C4. La Data API puede saltarse la moderación de comentarios — confirmado en permisos/políticas

- Política SELECT para `PUBLIC`: `estado = 'aprobado'`.
- Política INSERT para `PUBLIC`: `WITH CHECK (true)`.
- `anon` y `authenticated` tienen USAGE del esquema y privilegios INSERT/SELECT sobre `comentarios`.
- No hay privilegios de columna explícitos adicionales, trigger que fuerce `pendiente` ni CHECK de estados de moderación.
- `user_id` admite NULL.

Por tanto, un cliente con acceso a la Data API que exponga `public` puede insertar `estado = 'aprobado'` y autor NULL, omitiendo JWT y validaciones de Express. La política SELECT luego lo hace visible. Esta posibilidad se deriva del catálogo; no se hizo una inserción ni una llamada de explotación.

**Recomendación:** para la arquitectura actual de JWT propio y API Express, revocar INSERT directo a roles de cliente. Mantener creación y aprobación mediante rutas del servidor. No introducir una política `auth.uid() = user_id`: aquí el usuario de negocio es BIGINT y la identidad de Supabase Auth sería UUID, sin relación verificada.

### C5. Stock sin reserva ni decremento: riesgo de sobreventa — confirmado en código

`src/controllers/pedido.controller.js:32` usa una transacción para crear pedido/detalles, pero lee stock sin bloqueo y solo comprueba `cantidad <= stock`. No decrementa ni reserva. El controlador PayPal tampoco reserva, descuenta stock ni asigna `cuentas_producto`. No hay triggers/funciones de aplicación que lo hagan en BD.

Dos pedidos distintos pueden pasar la misma comprobación; incluso compras sucesivas pueden reutilizar stock si ninguna operación lo reduce. El bloqueo por `pedido` en PayPal protege reintentos de ese pedido, **no la disponibilidad compartida entre pedidos**. `CHECK(stock >= 0)` no ayuda si nunca se actualiza stock.

**Recomendación:** reservar unidades/cuentas de forma atómica antes del cobro, verificar cuántas se reservaron, usar un orden estable de bloqueo y liberar reservas mediante una transición coordinada con la captura. No basta con añadir un índice.

## 3. Problemas importantes

### I1. Historial de migraciones incompleto y deriva del esquema

Disponibles en el repositorio:

1. `migrations/20260926-paypal-sandbox.sql`: añade columnas e índices. Las columnas y los índices nombrados en ella están presentes, pero no hay registro de ejecución que permita atribuir su origen con certeza. No adapta los CHECK de estados y crea varios índices equivalentes a UNIQUE ya existentes.
2. `migrations/20260927-auth-email-unique.sql`: usa `users.correo`, inexistente aquí. El índice normalizado no está presente.
3. `migrations/README.md`: mecanismo manual. No hay historial Prisma en el repositorio ni migración base completa de las tablas.

No existen las tablas convencionales `supabase_migrations.schema_migrations`, `public."SequelizeMeta"` ni `public._prisma_migrations` en esta conexión. No se concluye que nunca hubiera cambios manuales. El arranque ya no ejecuta `sync/alter`, lo cual es correcto, pero una instalación nueva no se puede reconstruir con los dos SQL existentes.

### I2. Índices únicos duplicados

`usuarios.email` tiene **22 restricciones/índices UNIQUE equivalentes**: `usuarios_email_key` y sufijos 1–21. Además hay duplicados sobre `pagos.pedido_id`, `comprobantes.pago_id`, `entregas.pedido_id`, `(productos_videojuego.videojuego_id,tipo_cuenta)` y `videojuegos.rawg_id`.

Aumentan trabajo de escritura y mantenimiento sin ampliar garantías. La repetición es compatible con una historia de sincronizaciones automáticas, pero el catálogo no prueba por sí solo su causa. No se eliminó ninguno. Su limpieza requiere revisar dependencias y conservar un índice/constraint válido por garantía antes de retirar redundantes.

### I3. Nueve FK sin índice de apoyo por prefijo

| Tabla | Columna(s) |
|---|---|
| carritos | usuario_id |
| carrito_detalle | producto_id |
| comentarios | user_id |
| cuentas_producto | producto_id; pedido_id |
| pedido_detalle | pedido_id; producto_id |
| pedidos | usuario_id |
| promocion_productos | producto_id |

Las FK existen y están validadas; la ausencia del índice no rompe la integridad, pero perjudica búsquedas, joins y comprobaciones de borrado/actualización. El índice compuesto de carrito_detalle empieza por `carrito_id`, y el de promocion_productos por `promocion_id`: no cubren por prefijo las columnas listadas.

### I4. Favoritos implementados sin tabla

`src/models/favorito.model.js` y las rutas `/api/favoritos` están activas. `public.favoritos` no existe; una consulta `LIMIT 0` devuelve `42P01`. El frontend puede enmascarar el fallo mostrando favoritos locales. Se necesita una migración versionada con FK BIGINT a `usuarios` y UNIQUE `(usuario_id, rawg_game_id)`, después de alinear identidad.

### I5. Comentarios: tipos, longitud y nulabilidad diferentes

- Modelo y controlador permiten nombre hasta 255; BD permite VARCHAR(100). Entradas de 101–255 pueden pasar validación y terminar en 500.
- `user_id` STRING frente a BIGINT FK.
- `estado` permite NULL en BD; el modelo exige NOT NULL. No hay CHECK que restrinja pendiente/aprobado/rechazado.
- El CHECK de calificación 1–5 sí existe y está validado.

El fallback público inseguro ya se quitó del controlador. Eso no corrige el permiso directo de Data API descrito en C4.

### I6. Reservas, expiración y entrega no implementadas

`cuentas_producto.estado` admite disponible/reservada/vendida/cancelada, pero no hay ruta operativa para asignarlas ni campo de expiración de reserva. Los controladores de cuentas/entrega están vacíos; sus routers no exponen acciones. No se encontró job local, función SQL de negocio, `cron.job` ni extensión `pg_cron` instalada. Esto no descarta tareas externas no visibles.

La ventana de cinco horas de `paypal.controller.js:54` protege contra recrear una orden ambigua; **no es un TTL de reservas**, no libera inventario ni cierra pedidos abandonados. Una orden sin captura puede permanecer pendiente. La cancelación del navegador no demuestra fallo de cobro; liberar inventario requiere conciliar primero si existe una captura en vuelo.

### I7. Prisma no describe la BD real

`prisma/schema.prisma` declara `Usuario.id UUID`, longitudes 100/100/150 y nombres de modelos sin mapeo a varias tablas snake_case. El runtime activo usa Sequelize. Existe un cliente Prisma configurado, pero no se encontró su uso en controllers/routes/services activos.

No ejecutar `prisma db push` ni generar migraciones desde ese schema como si fuera el contrato actual. Primero decidir una única descripción mantenida del esquema o alinear ambas sin alterar los datos.

### I8. Pruebas con dobles no verifican compatibilidad con producción

Las pruebas de auth simulan usuarios UUID y el mapeo esperado por el código; pueden pasar aunque la tabla real sea otra. Las pruebas unitarias PayPal simulan persistencia sin CHECK de PostgreSQL. La prueba PostgreSQL opcional crea sus tablas con `sequelize.sync()` a partir de modelos, que tampoco contienen los CHECK históricos: aun ejecutándola no demostraría compatibilidad con este esquema.

Recomendación: BD de pruebas aislada creada a partir de migraciones equivalentes al esquema real, verificaciones de contrato de columnas/PK/FK/CHECK y pruebas de transiciones/reintentos/concurrencia. No ejecutar esas pruebas sobre producción.

## 4. Comparación backend ↔ Supabase

| Área | Backend actual | Supabase inspeccionado | Consecuencia |
|---|---|---|---|
| Cuenta de negocio | users.correo, UUID | usuarios.email, BIGINT | 500 de registro/login y JWT incompatibles |
| Carrito/pedido | usuario_id UUID | usuario_id BIGINT → usuarios | Relaciones declaradas contra identidad equivocada |
| Comentario | user_id STRING, nombre 255, estado NOT NULL | BIGINT FK, nombre 100, estado nullable | Errores de inserción y contrato desigual |
| Favoritos | Modelo, controlador y rutas activos | Tabla ausente | Consultas fallan con 42P01 |
| Pagos | Estado completado/reembolsado/etc. | CHECK no los admite | Rollback después de captura externa |
| Comprobante/entrega | Reembolso y retenida | CHECK no los admite | Reconciliación bloqueada |
| Stock | Lectura y comparación | CHECK no negativo, sin mecanismo de reserva | Sobreventa posible |
| Rifas/sorteos | Sin implementación | Sin tablas propias | No auditable como función existente |
| Auth Supabase | No usa SDK ni sesión Supabase; JWT propio | auth.users separada | auth.uid() no representa automáticamente req.user.id |

Controllers/rutas operativos revisados: auth, pedidos, PayPal, comentarios, favoritos, videojuegos y productos. Las rutas de carrito, detalles, promociones, pagos genéricos, comprobantes, entrega y cuentas tienen acciones comentadas o no están montadas. `pago.service.js`, `pedido.service.js` y `promocion.service.js` son implementaciones de ejemplo sin persistencia; no se encontraron llamadas desde los flujos activos. No constituyen una reserva, transacción o mecanismo de sorteo.

No se hallaron consultas SQL de negocio a rifas/boletos ni RPC Supabase en el código activo. Las consultas de negocio se realizan con Sequelize.

**Columnas aparentemente sin uso:** las tablas/modelos de carritos y promociones, y campos de asignación/entrega de cuentas, carecen de flujo operativo completo. Esto no prueba que sus datos sobren: podrían usarse manualmente o desde otro servicio. No se recomienda eliminar tablas/columnas por ausencia de referencias en este repositorio.

## 5. Flujo de compra y pagos

### Flujo solicitado de boletos

`disponible → reservado → pago PayPal → vendido → compras` **no está implementado ni verificable** en el proyecto conectado. No hay tablas de boletos/compras, expiración ni servicios de sorteos. No debe describirse como correcto a partir de la lógica de pedidos.

### Flujo existente de videojuegos

1. `POST /api/pedidos`: valida lista, IDs y cantidades; rechaza productos repetidos, admite cantidades mayores que uno y varios productos diferentes. Obtiene precio del servidor, calcula centavos y crea pedido+detalles en una transacción. No reserva stock.
2. Crear orden PayPal: bloquea pedido y persiste la clave idempotente antes del efecto externo; luego crea/reutiliza orden. Valida propietario.
3. Captura/consulta/webhook: bloquean el mismo pedido, consultan PayPal y comprueban importe, moneda, referencia y captura. Los reintentos reutilizan la orden; el webhook verifica firma.
4. Captura completada: intenta registrar pago, pedido, comprobante y entrega en una transacción. Hoy falla por C3. No asigna cuentas ni descuenta stock, aun si se corrigen los CHECK.
5. Rechazo/reembolso: intenta actualizar estados y retener entrega pendiente; los CHECK actuales impiden varias de esas operaciones. Una entrega ya realizada no se revoca mediante ese código.
6. Timeout: puede haber cobro remoto; se consulta de nuevo la misma orden. El mecanismo depende de reintento del cliente/webhook; no hay conciliación periódica implementada en este repo.
7. Orden no capturada/abandonada: devuelve estado no confirmado. No hay expiración local ni liberación de reservas porque estas no se implementan.

**Aspectos correctos:** importes del servidor, aritmética en centavos, transacción pedido/detalles, propiedad del pedido, bloqueo compartido para reintentos, claves idempotentes y firma de webhook. Esas defensas no compensan la deriva del esquema ni el inventario sin control.

## 6. Sorteos y múltiples boletos

| Regla | Resultado de auditoría |
|---|---|
| Un usuario compra varios boletos | No verificable: no existen boletos. Cantidades múltiples de productos sí se aceptan |
| Un usuario gana una vez por rifa | No hay lógica ni UNIQUE equivalente |
| Se respeta cantidad_ganadores | Campo y proceso ausentes |
| Premios asignados correctamente | Tablas/lógica ausentes |
| Sorteo repetido no duplica ganadores | No hay mecanismo auditable |

Para el proyecto de rifas correcto, comprobar: reserva atómica de un conjunto de boletos o rollback completo; UNIQUE del número por rifa; pertenencia del boleto/compra/ganador a la misma rifa; UNIQUE `(rifa_id, usuario_id)` en ganadores; unicidad de cada premio adjudicable; bloqueo de la rifa durante el sorteo; selección sin repetir usuarios elegibles; no superar plazas/premios; política explícita si hay menos participantes que cantidad_ganadores; registro durable e idempotente del resultado. No crear SQL con nombres de columnas inventados antes de inspeccionar ese proyecto.

## 7. Seguridad

1. **Crítico:** permiso de INSERT de comentarios descrito en C4. RLS habilitada no implica una política segura.
2. La conexión de Node usa un rol con `BYPASSRLS` y es propietaria de las tablas de aplicación. RLS no restringe las consultas de este backend. Las rutas deben verificar identidad/propiedad y conviene un rol runtime de privilegios mínimos, separado del rol de migraciones.
3. `src/config/database.js:30` deshabilita la validación de certificado TLS. La auditoría usó la configuración de conexión existente; no certifica autenticidad TLS. Recomendar certificado CA/validación del servidor sin modificar la conexión hasta probarlo.
4. Se imprime el destino de conexión con ocultación parcial por regex. Aunque intenta ocultar contraseña, puede mostrar otros componentes sensibles y no es un saneador general. Sustituir posteriormente por logs de estado sin URI.
5. Varios controllers devuelven `error.message` al cliente y pueden revelar SQL/esquema. Auth ya devuelve error genérico, pero tampoco registra un código diagnóstico seguro; esto dificulta distinguir tabla ausente, tipo incompatible y configuración. Registrar SQLSTATE/identificador de petición sin payload, token ni credenciales.
6. No se encontró rate limiting en dependencias, middleware o configuración versionada. La protección externa del proveedor no se pudo confirmar; no se añadió implementación.
7. Los roles cliente tienen grants amplios sobre las tablas. RLS sin políticas bloquea las operaciones por fila de esos roles en las otras 13 tablas; no se afirma exposición de usuarios/pagos por esos grants solos. Revisar privilegios de tabla/esquema y default privileges conforme al acceso realmente necesario.
8. JWT propio y tokens en localStorage amplían el impacto de XSS; no se observó un puente de identidad con Supabase Auth. Es una decisión arquitectónica a revisar, no justificación para mezclar IDs o confiar en auth.uid() sin integración.

Referencias oficiales: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [seguridad de la Data API](https://supabase.com/docs/guides/api/securing-your-api). La revisión de privilegios se basa en el catálogo remoto, no solo en recomendaciones generales.

## 8. Comprobaciones de consistencia sin revelar datos

En la instantánea:

- Grupos de emails duplicados al normalizar con lower/btrim: 0.
- Comentarios con estado NULL: 0; calificaciones fuera de 1–5: 0.
- Pagos con monto diferente al total de su pedido: 0.
- Pedidos con total distinto de subtotal menos descuento: 0.
- Filas de pagos: 0 en la consulta agrupada de estados.

Estos resultados no prueban integridad futura ni ausencia de carreras. No se simularon compras ni sorteos y no se inspeccionaron datos personales para producirlos.

## 9. Migraciones SQL recomendadas — propuestas, NO ejecutadas

**Primero confirmar qué proyecto debe usarse.** Las siguientes propuestas corresponden exclusivamente al esquema de videojuegos observado. Deben revisarse en staging, respaldarse y versionarse; no ejecutar todos los bloques como un único script. La corrección inicial de registro es de mapeo y tipos de Node.js, no requiere renombrar la BD ni regenerar PK.

### M1. Índice de correo normalizado sobre la tabla real

Reemplazar en una futura corrección el destino equivocado del archivo de migración; revisar el estado aplicado en cada ambiente antes de reescribir una migración que pudiera haberse usado en otro proyecto.

```sql
-- Revisión previa; devuelve solo cantidad de grupos, no correos.
SELECT count(*) AS grupos_duplicados
FROM (
  SELECT lower(btrim(email))
  FROM public.usuarios
  GROUP BY lower(btrim(email)) HAVING count(*) > 1
) AS d;

-- Ejecutar fuera de BEGIN/COMMIT si se elige CONCURRENTLY.
CREATE UNIQUE INDEX CONCURRENTLY usuarios_email_normalizado_unique
  ON public.usuarios (lower(btrim(email)));
```

Si existen duplicados, detener y revisarlos; no fusionar ni borrar automáticamente. Si una creación concurrente falla, comprobar `pg_index.indisvalid` y resolver el índice inválido antes de reintentar. No usar IF NOT EXISTS como prueba de definición correcta. Mantener los UNIQUE actuales hasta una revisión separada de redundancia y dependencias.

### M2. Cerrar inserción directa de comentarios

Propuesta para la arquitectura actual, donde Express crea comentarios y usa un rol de servidor:

```sql
BEGIN;
REVOKE INSERT ON TABLE public.comentarios FROM PUBLIC, anon, authenticated;
COMMIT;
```

Verificar después privilegios efectivos e INSERT por columnas; no se observaron ACL de columna explícitas en la instantánea. La lectura de aprobados puede conservarse. Una integración futura con Supabase Auth requeriría diseñar políticas nuevas y vincular identidades; no cambiar a auth.uid() a ciegas.

### M3. Compatibilidad explícita de estados financieros

Propuesta conservadora que **preserva los estados históricos** y añade los que el controlador actual utiliza. No transforma filas. Requiere aprobación del vocabulario final y prueba de flujo completo; ampliar un CHECK solo evita rechazos, no implementa por sí mismo una máquina de estados válida.

```sql
BEGIN;
ALTER TABLE public.pagos DROP CONSTRAINT pagos_estado_check;
ALTER TABLE public.pagos ADD CONSTRAINT pagos_estado_check CHECK (
  estado IN ('pendiente','aprobado','rechazado','cancelado',
             'completado','reembolsado','reembolso_parcial')
) NOT VALID;
ALTER TABLE public.pagos VALIDATE CONSTRAINT pagos_estado_check;

ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_estado_check;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_estado_check CHECK (
  estado IN ('pendiente_pago','pagado','procesando','entregado','cancelado',
             'rechazado','reembolsado','reembolso_parcial')
) NOT VALID;
ALTER TABLE public.pedidos VALIDATE CONSTRAINT pedidos_estado_check;

ALTER TABLE public.comprobantes DROP CONSTRAINT comprobantes_estado_check;
ALTER TABLE public.comprobantes ADD CONSTRAINT comprobantes_estado_check CHECK (
  estado IN ('pendiente_revision','aprobado','rechazado','reembolsado','reembolso_parcial')
) NOT VALID;
ALTER TABLE public.comprobantes VALIDATE CONSTRAINT comprobantes_estado_check;

ALTER TABLE public.entregas DROP CONSTRAINT entregas_estado_check;
ALTER TABLE public.entregas ADD CONSTRAINT entregas_estado_check CHECK (
  estado IN ('pendiente','procesando','entregado','cancelado','retenida')
) NOT VALID;
ALTER TABLE public.entregas VALIDATE CONSTRAINT entregas_estado_check;
COMMIT;
```

La transacción evita publicar un estado intermedio sin restricciones. Este DDL toma bloqueos; planificar ventana y timeout. No elimina tablas/columnas, pero reemplaza CHECK y necesita revisión antes de aplicarse. No se ha ejecutado.

### M4. Índices de apoyo

Elegir según volumen y consultas; estos prefijos no tienen cobertura válida actualmente. Cada sentencia CONCURRENTLY va fuera de una transacción explícita.

```sql
CREATE INDEX CONCURRENTLY carritos_usuario_id_idx ON public.carritos(usuario_id);
CREATE INDEX CONCURRENTLY carrito_detalle_producto_id_idx ON public.carrito_detalle(producto_id);
CREATE INDEX CONCURRENTLY comentarios_user_id_idx ON public.comentarios(user_id);
CREATE INDEX CONCURRENTLY cuentas_producto_producto_id_idx ON public.cuentas_producto(producto_id);
CREATE INDEX CONCURRENTLY cuentas_producto_pedido_id_idx ON public.cuentas_producto(pedido_id);
CREATE INDEX CONCURRENTLY pedido_detalle_pedido_id_idx ON public.pedido_detalle(pedido_id);
CREATE INDEX CONCURRENTLY pedido_detalle_producto_id_idx ON public.pedido_detalle(producto_id);
CREATE INDEX CONCURRENTLY pedidos_usuario_id_idx ON public.pedidos(usuario_id);
CREATE INDEX CONCURRENTLY promocion_productos_producto_id_idx ON public.promocion_productos(producto_id);
```

Para la consulta pública de comentarios, evaluar también un índice parcial de `fecha_creacion DESC WHERE estado='aprobado'` con EXPLAIN y volumen real, sin duplicar índices innecesariamente.

### M5. Contrato de moderación

Después de verificar estados existentes y sin rellenar datos automáticamente:

```sql
BEGIN;
ALTER TABLE public.comentarios ADD CONSTRAINT comentarios_estado_check
  CHECK (estado IN ('pendiente','aprobado','rechazado')) NOT VALID;
ALTER TABLE public.comentarios VALIDATE CONSTRAINT comentarios_estado_check;
ALTER TABLE public.comentarios ALTER COLUMN estado SET NOT NULL;
COMMIT;
```

El controlador debe ajustarse a `nombre VARCHAR(100)` y `user_id BIGINT` en el mismo cambio de contrato. Añadir CHECK no sustituye revocar la inserción pública.

### M6. Pendientes que requieren diseño coordinado

- Crear `favoritos` con migración explícita, tras definir BIGINT en el modelo y su FK a usuarios. No usar sync como reemplazo.
- Versionar una línea base fiel de la BD y un registro de migraciones; mantener runtime sin DDL.
- Revisar limpieza de los índices redundantes, sin DROP automático generado por patrones de nombres.
- Diseñar reserva de inventario con propietario/pedido, expiración e índices de estado/expiración, transacciones de asignación y conciliación de capturas tardías. No añadir una columna TTL aislada y dar por resuelta la sobreventa.
- No generar migraciones de rifas/boletos/premios/ganadores hasta tener su esquema y backend reales.

## 10. Orden recomendado de resolución

1. Confirmar proyecto/BD objetivo y mantener este informe como evidencia del esquema consultado.
2. Corregir conjuntamente tabla, correo, BIGINT y middleware de autenticación; probar registro/login/cambio de contraseña contra una BD aislada que reproduzca el contrato real.
3. Cerrar el permiso directo de comentarios y ajustar sus tipos/longitudes.
4. Alinear estados financieros y probar el ciclo PayPal completo sin tocar producción.
5. Implementar reserva/stock y reconciliación antes de considerar confiable la venta de unidades limitadas.
6. Completar migraciones, favoritos, índices y pruebas de deriva.
7. Auditar rifas solo cuando se identifique el proyecto que contiene esas tablas.

**Resultado de esta tarea:** auditoría y propuestas únicamente; sin cambios en código de aplicación, BD, migraciones existentes ni commits.

## Anexo A. Inventario completo de columnas de aplicación

Obtenido del catálogo remoto. `NO` en la columna nullable significa NOT NULL. Los nombres de secuencias se omiten; `nextval` indica default autoincremental. No contiene datos de filas.

### public.carrito_detalle

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| carrito_id | int8 | NO | — |
| producto_id | int8 | NO | — |
| cantidad | int4 | NO | 1 |
| precio_unitario | numeric(10,2) | NO | — |

Restricciones verificadas:

- `carrito_detalle_cantidad_check`: `CHECK (cantidad > 0)`.
- `carrito_detalle_carrito_id_fkey`: `FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE`.
- `carrito_detalle_pkey`: `PRIMARY KEY (id)`.
- `carrito_detalle_precio_check`: `CHECK (precio_unitario >= 0::numeric)`.
- `carrito_detalle_producto_id_fkey`: `FOREIGN KEY (producto_id) REFERENCES productos_videojuego(id)`.
- `carrito_detalle_producto_unique`: `UNIQUE (carrito_id, producto_id)`.

### public.carritos

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| usuario_id | int8 | NO | — |
| estado | varchar(20) | NO | 'activo'::character varying |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

Restricciones verificadas:

- `carritos_estado_check`: `CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'abandonado'::character varying, 'convertido'::character varying]::text[]))`.
- `carritos_pkey`: `PRIMARY KEY (id)`.
- `carritos_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id)`.

### public.comentarios

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() |
| user_id | int8 | YES | — |
| nombre | varchar(100) | NO | — |
| calificacion | int4 | NO | — |
| mensaje | text | NO | — |
| estado | varchar(20) | YES | 'pendiente'::character varying |
| fecha_creacion | timestamptz | NO | timezone('utc'::text, now()) |

Restricciones verificadas:

- `comentarios_calificacion_check`: `CHECK (calificacion >= 1 AND calificacion <= 5)`.
- `comentarios_pkey`: `PRIMARY KEY (id)`.
- `comentarios_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE`.

### public.comprobantes

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| pago_id | int8 | NO | — |
| archivo_url | text | NO | — |
| nombre_archivo | varchar(255) | YES | — |
| mime_type | varchar(100) | YES | — |
| estado | varchar(30) | NO | 'pendiente_revision'::character varying |
| observaciones | text | YES | — |
| created_at | timestamptz | NO | now() |

Restricciones verificadas:

- `comprobantes_estado_check`: `CHECK (estado::text = ANY (ARRAY['pendiente_revision'::character varying, 'aprobado'::character varying, 'rechazado'::character varying]::text[]))`.
- `comprobantes_pago_id_fkey`: `FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE`.
- `comprobantes_pago_id_key`: `UNIQUE (pago_id)`.
- `comprobantes_pkey`: `PRIMARY KEY (id)`.

### public.cuentas_producto

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| producto_id | int8 | NO | — |
| identificador_interno | varchar(100) | NO | — |
| datos_cuenta_cifrados | text | NO | — |
| estado | varchar(30) | NO | 'disponible'::character varying |
| pedido_id | int8 | YES | — |
| entregado_at | timestamptz | YES | — |
| created_at | timestamptz | NO | now() |

Restricciones verificadas:

- `cuentas_producto_estado_check`: `CHECK (estado::text = ANY (ARRAY['disponible'::character varying, 'reservada'::character varying, 'vendida'::character varying, 'cancelada'::character varying]::text[]))`.
- `cuentas_producto_identificador_interno_key`: `UNIQUE (identificador_interno)`.
- `cuentas_producto_pedido_id_fkey`: `FOREIGN KEY (pedido_id) REFERENCES pedidos(id)`.
- `cuentas_producto_pkey`: `PRIMARY KEY (id)`.
- `cuentas_producto_producto_id_fkey`: `FOREIGN KEY (producto_id) REFERENCES productos_videojuego(id)`.

### public.entregas

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| pedido_id | int8 | NO | — |
| estado | varchar(30) | NO | 'pendiente'::character varying |
| entregado_at | timestamptz | YES | — |
| notas | text | YES | — |

Restricciones verificadas:

- `entregas_estado_check`: `CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'procesando'::character varying, 'entregado'::character varying, 'cancelado'::character varying]::text[]))`.
- `entregas_pedido_id_fkey`: `FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE`.
- `entregas_pedido_id_key`: `UNIQUE (pedido_id)`.
- `entregas_pkey`: `PRIMARY KEY (id)`.

### public.pagos

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| pedido_id | int8 | NO | — |
| metodo | varchar(30) | NO | — |
| estado | varchar(30) | NO | 'pendiente'::character varying |
| referencia_externa | varchar(200) | YES | — |
| monto | numeric(10,2) | NO | — |
| fecha_pago | timestamptz | YES | — |
| created_at | timestamptz | NO | now() |
| paypal_request_id | uuid | YES | — |
| paypal_capture_id | varchar(64) | YES | — |

Restricciones verificadas:

- `pagos_estado_check`: `CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying, 'cancelado'::character varying]::text[]))`.
- `pagos_metodo_check`: `CHECK (metodo::text = ANY (ARRAY['paypal'::character varying, 'transferencia'::character varying]::text[]))`.
- `pagos_monto_check`: `CHECK (monto >= 0::numeric)`.
- `pagos_pedido_id_fkey`: `FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE`.
- `pagos_pedido_id_key`: `UNIQUE (pedido_id)`.
- `pagos_pkey`: `PRIMARY KEY (id)`.

### public.pedido_detalle

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| pedido_id | int8 | NO | — |
| producto_id | int8 | NO | — |
| titulo_snapshot | varchar(200) | NO | — |
| tipo_cuenta_snapshot | varchar(20) | NO | — |
| precio_unitario | numeric(10,2) | NO | — |
| descuento_unitario | numeric(10,2) | NO | 0 |
| cantidad | int4 | NO | 1 |
| total_linea | numeric(10,2) | NO | — |

Restricciones verificadas:

- `pedido_detalle_cantidad_check`: `CHECK (cantidad > 0)`.
- `pedido_detalle_descuento_check`: `CHECK (descuento_unitario >= 0::numeric)`.
- `pedido_detalle_pedido_id_fkey`: `FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE`.
- `pedido_detalle_pkey`: `PRIMARY KEY (id)`.
- `pedido_detalle_precio_check`: `CHECK (precio_unitario >= 0::numeric)`.
- `pedido_detalle_producto_id_fkey`: `FOREIGN KEY (producto_id) REFERENCES productos_videojuego(id)`.
- `pedido_detalle_tipo_check`: `CHECK (tipo_cuenta_snapshot::text = ANY (ARRAY['principal'::character varying, 'secundaria'::character varying]::text[]))`.
- `pedido_detalle_total_check`: `CHECK (total_linea >= 0::numeric)`.

### public.pedidos

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| usuario_id | int8 | NO | — |
| subtotal | numeric(10,2) | NO | — |
| descuento | numeric(10,2) | NO | 0 |
| total | numeric(10,2) | NO | — |
| estado | varchar(30) | NO | 'pendiente_pago'::character varying |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

Restricciones verificadas:

- `pedidos_descuento_check`: `CHECK (descuento >= 0::numeric)`.
- `pedidos_estado_check`: `CHECK (estado::text = ANY (ARRAY['pendiente_pago'::character varying, 'pagado'::character varying, 'procesando'::character varying, 'entregado'::character varying, 'cancelado'::character varying]::text[]))`.
- `pedidos_pkey`: `PRIMARY KEY (id)`.
- `pedidos_subtotal_check`: `CHECK (subtotal >= 0::numeric)`.
- `pedidos_total_check`: `CHECK (total >= 0::numeric)`.
- `pedidos_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id)`.

### public.productos_videojuego

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| videojuego_id | int8 | NO | — |
| tipo_cuenta | varchar(20) | NO | — |
| precio | numeric(10,2) | NO | — |
| stock | int4 | NO | 0 |
| activo | bool | NO | true |
| created_at | timestamptz | NO | — |

Restricciones verificadas:

- `productos_precio_check`: `CHECK (precio >= 0::numeric)`.
- `productos_stock_check`: `CHECK (stock >= 0)`.
- `productos_tipo_cuenta_check`: `CHECK (tipo_cuenta::text = ANY (ARRAY['principal'::character varying::text, 'secundaria'::character varying::text]))`.
- `productos_videojuego_pkey`: `PRIMARY KEY (id)`.
- `productos_videojuego_tipo_unique`: `UNIQUE (videojuego_id, tipo_cuenta)`.
- `productos_videojuego_videojuego_id_fkey`: `FOREIGN KEY (videojuego_id) REFERENCES videojuegos(id) ON UPDATE CASCADE ON DELETE CASCADE`.

### public.promocion_productos

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| promocion_id | int8 | NO | — |
| producto_id | int8 | NO | — |

Restricciones verificadas:

- `promocion_productos_pkey`: `PRIMARY KEY (promocion_id, producto_id)`.
- `promocion_productos_producto_id_fkey`: `FOREIGN KEY (producto_id) REFERENCES productos_videojuego(id) ON DELETE CASCADE`.
- `promocion_productos_promocion_id_fkey`: `FOREIGN KEY (promocion_id) REFERENCES promociones(id) ON DELETE CASCADE`.

### public.promociones

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| nombre | varchar(150) | NO | — |
| descripcion | text | YES | — |
| tipo | varchar(20) | NO | — |
| valor | numeric(10,2) | NO | — |
| fecha_inicio | timestamptz | NO | — |
| fecha_fin | timestamptz | NO | — |
| activo | bool | NO | true |
| created_at | timestamptz | NO | — |

Restricciones verificadas:

- `promociones_fechas_check`: `CHECK (fecha_fin > fecha_inicio)`.
- `promociones_pkey`: `PRIMARY KEY (id)`.
- `promociones_tipo_check`: `CHECK (tipo::text = ANY (ARRAY['porcentaje'::character varying::text, 'monto'::character varying::text]))`.
- `promociones_valor_check`: `CHECK (valor >= 0::numeric)`.

### public.usuarios

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| nombre | varchar(30) | NO | — |
| email | varchar(50) | NO | — |
| password_hash | text | NO | — |
| rol | varchar(20) | NO | 'cliente'::character varying |
| activo | bool | NO | true |
| created_at | timestamptz | NO | — |
| updated_at | timestamptz | NO | — |
| apellidos | varchar(30) | NO | — |

Restricciones verificadas:

- `usuarios_email_key`: `UNIQUE (email)`.
- `usuarios_pkey`: `PRIMARY KEY (id)`.
- `usuarios_rol_check`: `CHECK (rol::text = ANY (ARRAY['cliente'::character varying::text, 'admin'::character varying::text]))`.
- Adicionalmente existen `usuarios_email_key1` a `usuarios_email_key21`, equivalentes al UNIQUE de email mostrado.

### public.videojuegos

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | int8 | NO | nextval(secuencia) |
| titulo | varchar(200) | NO | — |
| descripcion | text | YES | — |
| imagen_url | text | YES | — |
| consola | varchar(100) | YES | — |
| activo | bool | NO | true |
| created_at | timestamptz | NO | — |
| updated_at | timestamptz | NO | — |
| rawg_id | int8 | YES | — |

Restricciones verificadas:

- `videojuegos_pkey`: `PRIMARY KEY (id)`.
- `videojuegos_rawg_id_key`: `UNIQUE (rawg_id)`.

## Anexo B. Inventario de índices

Todos los índices enumerados resultaron válidos en la instantánea. Un índice UNIQUE no impide varios NULL salvo que se configure explícitamente esa semántica; aquí los identificadores PayPal se completan durante el flujo.

| Tabla | Índice | Definición |
|---|---|---|
| carrito_detalle | carrito_detalle_pkey | CREATE UNIQUE INDEX carrito_detalle_pkey ON public.carrito_detalle USING btree (id) |
| carrito_detalle | carrito_detalle_producto_unique | CREATE UNIQUE INDEX carrito_detalle_producto_unique ON public.carrito_detalle USING btree (carrito_id, producto_id) |
| carritos | carritos_pkey | CREATE UNIQUE INDEX carritos_pkey ON public.carritos USING btree (id) |
| comentarios | comentarios_pkey | CREATE UNIQUE INDEX comentarios_pkey ON public.comentarios USING btree (id) |
| comprobantes | comprobantes_pago_id_key | CREATE UNIQUE INDEX comprobantes_pago_id_key ON public.comprobantes USING btree (pago_id) |
| comprobantes | comprobantes_pago_id_unique | CREATE UNIQUE INDEX comprobantes_pago_id_unique ON public.comprobantes USING btree (pago_id) |
| comprobantes | comprobantes_pkey | CREATE UNIQUE INDEX comprobantes_pkey ON public.comprobantes USING btree (id) |
| cuentas_producto | cuentas_producto_identificador_interno_key | CREATE UNIQUE INDEX cuentas_producto_identificador_interno_key ON public.cuentas_producto USING btree (identificador_interno) |
| cuentas_producto | cuentas_producto_pkey | CREATE UNIQUE INDEX cuentas_producto_pkey ON public.cuentas_producto USING btree (id) |
| entregas | entregas_pedido_id_key | CREATE UNIQUE INDEX entregas_pedido_id_key ON public.entregas USING btree (pedido_id) |
| entregas | entregas_pedido_id_unique | CREATE UNIQUE INDEX entregas_pedido_id_unique ON public.entregas USING btree (pedido_id) |
| entregas | entregas_pkey | CREATE UNIQUE INDEX entregas_pkey ON public.entregas USING btree (id) |
| pagos | pagos_paypal_capture_id_unique | CREATE UNIQUE INDEX pagos_paypal_capture_id_unique ON public.pagos USING btree (paypal_capture_id) |
| pagos | pagos_paypal_request_id_unique | CREATE UNIQUE INDEX pagos_paypal_request_id_unique ON public.pagos USING btree (paypal_request_id) |
| pagos | pagos_pedido_id_key | CREATE UNIQUE INDEX pagos_pedido_id_key ON public.pagos USING btree (pedido_id) |
| pagos | pagos_pedido_id_unique | CREATE UNIQUE INDEX pagos_pedido_id_unique ON public.pagos USING btree (pedido_id) |
| pagos | pagos_pkey | CREATE UNIQUE INDEX pagos_pkey ON public.pagos USING btree (id) |
| pagos | pagos_referencia_externa_unique | CREATE UNIQUE INDEX pagos_referencia_externa_unique ON public.pagos USING btree (referencia_externa) |
| pedido_detalle | pedido_detalle_pkey | CREATE UNIQUE INDEX pedido_detalle_pkey ON public.pedido_detalle USING btree (id) |
| pedidos | pedidos_pkey | CREATE UNIQUE INDEX pedidos_pkey ON public.pedidos USING btree (id) |
| productos_videojuego | productos_videojuego_pkey | CREATE UNIQUE INDEX productos_videojuego_pkey ON public.productos_videojuego USING btree (id) |
| productos_videojuego | productos_videojuego_tipo_unique | CREATE UNIQUE INDEX productos_videojuego_tipo_unique ON public.productos_videojuego USING btree (videojuego_id, tipo_cuenta) |
| productos_videojuego | productos_videojuego_videojuego_id_tipo_cuenta | CREATE UNIQUE INDEX productos_videojuego_videojuego_id_tipo_cuenta ON public.productos_videojuego USING btree (videojuego_id, tipo_cuenta) |
| promocion_productos | promocion_productos_pkey | CREATE UNIQUE INDEX promocion_productos_pkey ON public.promocion_productos USING btree (promocion_id, producto_id) |
| promociones | promociones_pkey | CREATE UNIQUE INDEX promociones_pkey ON public.promociones USING btree (id) |
| usuarios | usuarios_email_key | CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email) |
| usuarios | usuarios_pkey | CREATE UNIQUE INDEX usuarios_pkey ON public.usuarios USING btree (id) |
| videojuegos | videojuegos_pkey | CREATE UNIQUE INDEX videojuegos_pkey ON public.videojuegos USING btree (id) |
| videojuegos | videojuegos_rawg_id_key | CREATE UNIQUE INDEX videojuegos_rawg_id_key ON public.videojuegos USING btree (rawg_id) |
| videojuegos | videojuegos_rawg_id_unique | CREATE UNIQUE INDEX videojuegos_rawg_id_unique ON public.videojuegos USING btree (rawg_id) |

Se omiten 21 filas repetidas de `usuarios_email_key1` a `usuarios_email_key21`, todas UNIQUE(email), para facilitar la lectura. No se eliminó ningún índice.

## Anexo C. SVG de otro proyecto — referencia no auditada en vivo

| Tabla | Columnas y tipos visibles |
|---|---|
| users | id UUID; correo TEXT; password TEXT; es_admin BOOLEAN; nombre TEXT; created_at TIMESTAMPTZ; reset_token TEXT; reset_token_expires TIMESTAMP |
| rifas | id UUID; nombre TEXT; descripcion TEXT; fecha_inicio TIMESTAMP; cantidad_boletos INTEGER; admin_id UUID; cantidad_ganadores INTEGER; estado VARCHAR; modo_finalizacion VARCHAR; fecha_fin TIMESTAMP; precio NUMERIC |
| boletos | id UUID; rifa_id UUID; user_id UUID; numero INTEGER; estado TEXT; pago_id BIGINT; reservado_at TIMESTAMP; created_at TIMESTAMPTZ |
| compras | id UUID; rifa_id UUID; user_id UUID; boleto_id UUID; fecha_compra TIMESTAMPTZ; estado VARCHAR |
| premios | id UUID; rifa_id UUID; titulo TEXT; cantidad INTEGER; created_at TIMESTAMP |
| ganadores | id UUID; rifa_id UUID; premio_id UUID; boleto_id UUID; created_at TIMESTAMP |
| pagos | id BIGINT; paypal_order_id TEXT; rifa_id UUID; estado TEXT; monto NUMERIC; created_at TIMESTAMP |
| comentarios | id UUID; user_id UUID; nombre VARCHAR; calificacion INTEGER; mensaje TEXT; estado VARCHAR; fecha_creacion TIMESTAMPTZ |

El diagrama también incluye una referencia a `auth.users.id`. No se deduce de ella que el backend use Supabase Auth ni cuál sea su mecanismo de sincronización. Se requiere verificar la FK y el proceso de creación de usuarios en el catálogo real.


El SVG no permite certificar PK/FK, índices, UNIQUE, NOT NULL, defaults, triggers, funciones ni RLS de ese proyecto. No aplicar allí las propuestas SQL de esta auditoría.
