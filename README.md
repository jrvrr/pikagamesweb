# PikaGames

PikaGames es una tienda web de videojuegos digitales. Permite explorar el catálogo, consultar información de juegos, registrarse e iniciar sesión, guardar favoritos, comprar productos digitales y administrar pedidos y comentarios.

El proyecto está dividido en dos aplicaciones:

- `pikaweb/`: este repositorio, con el frontend web construido con Next.js.
- `../backend/`: API REST independiente construida con Node.js y Express.

## Funcionalidades

- Catálogo de videojuegos y productos digitales.
- Integración con RAWG para información adicional de videojuegos.
- Registro, inicio de sesión, recuperación de contraseña e inicio con Google.
- Perfiles de usuario y gestión de juegos guardados.
- Checkout y pagos con PayPal.
- Historial de pedidos.
- Comentarios moderables desde el área administrativa.
- SEO básico mediante sitemap, robots y páginas dinámicas.
- Envío de correos de soporte y recuperación de contraseña.

## Tecnologías

### Frontend

- Next.js `16.3.1` con App Router.
- React `19.2.8` y TypeScript.
- Tailwind CSS 4, shadcn/ui y Lucide React.
- Framer Motion para animaciones.
- React Hook Form y Zod para formularios y validación.
- PayPal React SDK.
- Vercel Speed Insights.

### Backend

- Node.js y Express.
- PostgreSQL.
- Sequelize para la conexión y los modelos utilizados por la API.
- Prisma como cliente/esquema complementario.
- JWT para autenticación.
- bcryptjs para contraseñas.
- Nodemailer y Resend para correo.
- PayPal REST API.

## Requisitos

- Node.js 18 o superior.
- npm.
- PostgreSQL accesible desde el backend.
- Credenciales de RAWG, Google y PayPal si se quieren habilitar esas funciones.

## Instalación local

El frontend y el backend se instalan y ejecutan por separado.

### 1. Backend

Desde la carpeta del backend:

```powershell
cd ../backend
npm install
Copy-Item .env.example .env
npm run dev
```

En macOS o Linux, usa:

```bash
cp .env.example .env
```

El backend queda disponible en `http://localhost:5000`.

### 2. Base de datos

Configura `DATABASE_URL` en `backend/.env` y aplica los archivos SQL versionados de `backend/migrations/` en el orden correspondiente.

Este proyecto no ejecuta `sync`, `alter`, `force` ni migraciones automáticamente al arrancar. Tampoco se debe usar `prisma db push` como sustituto de las migraciones SQL. Antes de aplicar migraciones en producción, revisa `backend/migrations/README.md` y realiza un respaldo de la base de datos.

### 3. Frontend

Desde la raíz del repositorio:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

En macOS o Linux, usa:

```bash
cp .env.example .env.local
```

Abre [http://localhost:3000](http://localhost:3000).

## Configuración

Copia los archivos `.env.example` correspondientes y completa localmente la configuración necesaria para la base de datos y los servicios externos. No subas `.env`, `.env.local` ni secretos al repositorio.

## Scripts disponibles

### Frontend

```bash
npm run dev       # servidor de desarrollo
npm run build     # compilación de producción
npm run start     # servidor de producción
npm run lint      # revisión de ESLint
npx vitest run    # pruebas disponibles
```

### Backend

```bash
npm run dev       # backend con nodemon
npm start         # backend en producción
npm test          # pruebas de Node.js
```

## API

La API usa el prefijo `/api`. Entre sus grupos principales están:

- `/api/auth`: registro, login, Google, sesión y recuperación de contraseña.
- `/api/videojuegos`: catálogo administrable de videojuegos.
- `/api/productos`: productos digitales y precios.
- `/api/favoritos`: juegos guardados por usuario.
- `/api/pedidos`: creación e historial de pedidos.
- `/api/paypal`: configuración, creación, captura y webhook de PayPal.
- `/api/comentarios`: comentarios públicos y moderación administrativa.
- `/api/pagos`: operaciones administrativas de pagos.

La ruta raíz del backend (`GET /`) devuelve un mensaje de comprobación de disponibilidad.

## Despliegue

### Backend en Vercel

El backend incluye `../backend/vercel.json` para desplegar `src/app.js` como función Node.js:

1. Crea un proyecto nuevo en Vercel apuntando a la carpeta `../backend`.
2. Configura en Vercel los secretos y valores requeridos por el backend.
3. Usa PostgreSQL administrado y verifica que permita conexiones desde el proveedor de despliegue.
4. Aplica las migraciones SQL antes de enviar tráfico al nuevo backend.
5. Comprueba `https://tu-backend.vercel.app/` y una ruta de API, por ejemplo `/api/productos`.

### Frontend en Vercel

1. Crea otro proyecto de Vercel apuntando a la raíz de este repositorio.
2. Configura en Vercel los valores requeridos por el frontend.
3. Define `NEXT_PUBLIC_API_URL` con la URL pública del backend, terminando en `/api`.
4. Ejecuta un despliegue y valida login, catálogo, favoritos y checkout.

Para PayPal, utiliza `sandbox` y credenciales de prueba durante las pruebas. Cambia a `live` únicamente cuando el backend y el frontend estén configurados con credenciales de producción y el webhook esté registrado en PayPal.

## Estructura del repositorio

```text
.
├── app/                  # rutas, layouts y páginas de Next.js
├── components/           # componentes React reutilizables
├── lib/                  # API, autenticación, RAWG y utilidades
├── public/               # imágenes, iconos y recursos estáticos
├── google-apps-script/   # endpoint opcional para soporte por correo
├── .env.example          # variables del frontend
└── package.json          # scripts y dependencias del frontend
```

La API vive en el repositorio hermano `../backend` y se despliega como un proyecto independiente.

## Publicar en GitHub

Antes de publicar:

1. Verifica que `.env`, `.env.local`, credenciales, tokens y dumps de base de datos estén ignorados.
2. Revisa el historial de Git: un secreto eliminado del archivo aún puede existir en commits anteriores.
3. Añade una descripción del repositorio, por ejemplo: `Tienda web de videojuegos digitales con Next.js, Express, PostgreSQL y PayPal`.
4. Recomendación de topics: `nextjs`, `react`, `typescript`, `express`, `postgresql`, `sequelize`, `prisma`, `paypal`, `videojuegos`, `ecommerce`.
5. Configura los secretos únicamente en Vercel o GitHub Actions, nunca en el código fuente.
6. Si el repositorio será público, define una licencia antes de aceptar contribuciones. Actualmente el frontend no declara una licencia pública.

## Contribución

1. Crea una rama descriptiva a partir de la rama principal.
2. Instala las dependencias del frontend y backend.
3. Ejecuta `npm run lint`, `npm run build` y las pruebas correspondientes.
4. Describe en el pull request los cambios, variables nuevas y migraciones de base de datos.

## Estado del proyecto

Proyecto en desarrollo. Las migraciones de base de datos y las credenciales de servicios externos deben revisarse antes de cada despliegue.
