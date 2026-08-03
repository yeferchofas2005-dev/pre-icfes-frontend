# PREICFES Gratuito Frontend

![Logo PREICFES Gratuito](https://www.preicfesgratuito.com/assets/icon/logo.png)

[![Angular](https://img.shields.io/badge/Angular-21-0F172A?logo=angular)](https://angular.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/) [![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/)

Plataforma web moderna y visual para PREICFES Gratuito, diseñada para acercar preparación académica, simulacros, información y oportunidades de crecimiento a jóvenes de Bogotá y alrededores.

- 🌐 Sitio oficial: https://www.preicfesgratuito.com/
- 📸 Branding y logo: https://www.preicfesgratuito.com/assets/icon/logo.png
- 📱 Redes: Instagram, Facebook y TikTok

## ¿Qué hace este proyecto?

Este frontend transforma la propuesta educativa de PREICFES Gratuito en una experiencia digital elegante, clara y atractiva. Entre sus capacidades destacan:

- Landing page premium con diseño responsivo y animaciones.
- Secciones de información, simulacros, testimonios y comunidad.
- Formularios de inscripción y suscripción con integración de servicios.
- Diseño preparado para fortalecer la identidad visual del programa.
- Arquitectura escalable basada en Angular 21 y TypeScript.

## Características principales

- Diseño institucional y moderno para una marca con impacto social.
- Experiencia optimizada para móvil y escritorio.
- Integración con servicios de correo y formularios.
- Componentes reutilizables y estructura organizada para mantenimiento.
- Preparado para despliegue en entornos productivos con variables de entorno.

## Stack tecnológico

- Angular 21
- TypeScript
- RxJS
- Angular Router y Forms
- EmailJS para envíos de correo
- HTML2Canvas y jsPDF para generación de documentos
- AOS para animaciones de interfaz

## Inicio rápido

### 1) Instala dependencias

```bash
npm install
```

### 2) Configura tus variables de entorno

El proyecto usa un script de generación de entornos antes de iniciar o construir la app. Asegúrate de tener tu archivo de entorno configurado correctamente.

```bash
cp .env.example .env
```

### 3) Ejecuta el proyecto localmente

```bash
npm start
```

Abre tu navegador en:

```text
http://localhost:4200/
```

## Scripts disponibles

```bash
npm start        # inicia el servidor de desarrollo
npm run build    # construye la app para producción
npm test         # ejecuta pruebas
```

## Variables de entorno

El flujo del proyecto está preparado para cargar valores desde variables de entorno y generarlos automáticamente para Angular mediante el script de soporte en:

- scripts/set-env.js
- src/environments/environment.ts
- src/environments/environment.development.ts

Esto ayuda a mantener datos sensibles fuera del código fuente y facilita el despliegue en plataformas como Vercel.

## Estructura del proyecto

```text
src/
  app/
    landing/        # página principal
    login/          # autenticación
    inscripcion/    # flujo de inscripción
    services/       # conexiones y lógica de negocio
  environments/     # configuración por entorno
scripts/            # generación de variables de entorno
```

## Vista previa y experiencia de marca

PREICFES Gratuito se enfoca en una experiencia visual moderna, cercana y confiable. El frontend está pensado para reforzar la confianza en la causa y mejorar la conversión de usuarios interesados en participar del programa.

> El proyecto combina branding, contenido educativo y una experiencia digital limpia para representar una iniciativa seria, social y con alto impacto.

## Contribución

Si quieres colaborar:

1. Crea una rama nueva.
2. Realiza tus cambios con buena organización.
3. Abre un pull request con una descripción clara.

## Contacto

PREICFES Gratuito para Jóvenes  
Bogotá D.C., Colombia
