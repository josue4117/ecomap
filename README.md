# EcoMapa

EcoMapa ayuda a equipos de reciclaje en Aguascalientes a registrar centros de acopio, distinguir su estado operativo y delimitar zonas de cobertura. Cada cuenta administra sus propios datos. Los registros de demostración son ficticios.

## Ejecutar en local

Usa Node.js 20 o superior y un servidor MongoDB local o un clúster Atlas.

1. En `backend/`, ejecuta `npm ci` y copia `.env.example` a `.env`.
2. Configura `MONGODB_URI` y genera un valor privado para `JWT_SECRET` con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Ejecuta `npm start`.
3. En otra terminal, desde `frontend/`, ejecuta `npm ci`, copia `.env.example` a `.env` y ejecuta `npm run dev`. Abre la URL de Vite. Si cambia el puerto de Vite, ajusta `FRONTEND_ORIGIN` en el backend.
4. Registra una cuenta y crea una categoría en **Catálogos**. En **Mapa**, usa **Nuevo punto** o **Dibujar zona** y haz clic en el mapa.

En PowerShell puedes copiar el archivo con `Copy-Item .env.example .env`. Las teselas del mapa requieren acceso a internet.

## Cuenta de revisión

Define `DEMO_EMAIL` y `DEMO_PASSWORD` en el entorno del backend y ejecuta `npm run seed` contra la base que utilizará la aplicación. La cuenta recibe tres puntos, una zona, dos categorías, un material y una organización. Una segunda ejecución repone registros con nombres de ejemplo que falten. Comparte las credenciales de revisión por el canal de entrega y mantén el archivo `.env` fuera del repositorio.

## API y persistencia

| Recurso | Rutas |
| --- | --- |
| Estado de la API | `GET /api/health` |
| Acceso | `POST /api/auth/register` y `POST /api/auth/login` |
| Catálogos | `/api/categories`, `/api/materials` y `/api/organizations` |
| Mapa | `/api/locations` y `/api/zones` |

Los cinco recursos autenticados permiten listar y crear con `GET` y `POST` en la colección y consultar, editar y eliminar con `GET`, `PUT` y `DELETE` en `/:id`. Envía `Authorization: Bearer <token>`. Las ubicaciones aceptan `?search=alameda&category=<id>&status=Activo`. La API devuelve geometrías GeoJSON en `geometry`. El frontend invierte el orden al pasarlas a Leaflet.

En `backend/src`, `config` conecta Mongoose, `models` define los esquemas, `routes` conecta HTTP con los servicios, `services` contiene las operaciones, `middlewares` valida y maneja errores y `utils` contiene `AppError`. Ubicaciones y zonas indexan su geometría con `2dsphere`. Los registros pertenecen a un usuario mediante `owner`. La ubicación referencia una categoría mediante ObjectId y las consultas cargan su nombre con `populate`.

## Publicación

1. Crea el clúster de MongoDB Atlas, el usuario de base de datos y el acceso de red para el servicio de la API.
2. Publica este directorio como repositorio con los dos proyectos. Crea un servicio web de Node con raíz `backend`, comando de construcción `npm ci` y comando de arranque `npm start`. Configura `MONGODB_URI` con la cadena de Atlas y `JWT_SECRET` con un secreto nuevo.
3. Publica el frontend como sitio estático con raíz `frontend`, comando de construcción `npm ci && npm run build` y directorio de salida `dist`. Configura `VITE_API_URL` con la URL HTTPS del backend seguida de `/api`. Configura `FRONTEND_ORIGIN` en el backend con el origen HTTPS del sitio, sin diagonal final.
4. Ejecuta el seed una vez apuntando a Atlas y prueba el acceso desde el sitio público. Conserva disponibles ambos servicios y el clúster durante la revisión.
