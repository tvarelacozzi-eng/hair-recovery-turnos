# Hair Recovery - Sistema de turnos

Prototipo web para presentar una experiencia de reserva de turnos para Hair Recovery, con vista pública para pacientes y panel administrador para gestionar sedes, profesionales, servicios y turnos.

## Demo

El proyecto está pensado como demo frontend para publicar rápido en Vercel o Netlify.

### Acceso administrador

- Email: `admin@admin.com`
- Contraseña: `admin`

## Funciones incluidas

- Landing inspirada en la estética de Hair Recovery.
- Navegación interna: `Turno Web`, `Tratamientos`, `Nosotros` y `Sedes`.
- Link externo a `https://eshop.hairrecovery.com.ar`.
- Flujo de reserva por pasos:
  - Sede.
  - Servicio.
  - Profesional.
  - Fecha y horario.
  - Datos del paciente.
- Validación obligatoria de nombre, teléfono y email.
- Panel administrador protegido por login demo.
- Selector maestro de sede en el administrador.
- Gestión de turnos por sede.
- Gestión de profesionales por sede, servicios realizados y disponibilidad.
- Gestión de servicios.
- Persistencia local con `localStorage`.

## Importante

Esta versión no tiene backend ni base de datos real. Los turnos y cambios del administrador se guardan en el navegador de cada persona usando `localStorage`.

Para producción real haría falta agregar:

- Base de datos.
- Autenticación segura.
- Usuarios por sede.
- API backend.
- Notificaciones por email o WhatsApp.
- Roles y permisos.

## Requisitos

- Node.js 20 o superior recomendado.
- npm.

## Comandos locales

Instalar dependencias:

```bash
npm install
```

Levantar entorno de desarrollo:

```bash
npm run dev
```

Crear build de producción:

```bash
npm run build
```

Ejecutar lint:

```bash
npm run lint
```

Vista previa del build:

```bash
npm run preview
```

En Windows PowerShell, si `npm` está bloqueado por la política de ejecución, usar `npm.cmd`:

```bash
npm.cmd run dev
```

## Deploy recomendado en Vercel

Vercel detecta automáticamente que es un proyecto Vite.

Configuración:

- Framework: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

El archivo `vercel.json` ya deja esta configuración preparada.
