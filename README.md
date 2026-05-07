# BIK - Server Admin (Backend Core)

Servidor principal de la plataforma bancaria BIK (Banco Informático Kinal). Actúa como el núcleo de la lógica de negocios, interactuando con la base de datos de MongoDB, resolviendo peticiones de ambas interfaces frontend (Usuario y Administrador) y coordinándose con el microservicio de autenticación.

## Módulos Principales
- **Gestión de Usuarios y Roles**: Administración de clientes y roles corporativos.
- **Transacciones y Cuentas**: Transferencias internas, externas (ACH), remesas e historial atómico de movimientos.
- **Divisas**: Conversión y negociación de múltiples monedas (GTQ y USD) con tasas de cambio dinámicas en tiempo real.
- **Seguridad y Auditoría**: Registro centralizado de todas las peticiones a la API.

## Tecnologías
- Node.js & Express
- MongoDB (Mongoose)
- Swagger (Documentación de API en `/api-docs`)

## Configuración y Despliegue
Este repositorio contiene el archivo `docker-compose.yml` maestro que orquesta todos los contenedores del ecosistema BIK.
Para iniciar todo el sistema localmente, ejecuta:
```bash
docker-compose up -d --build
```
