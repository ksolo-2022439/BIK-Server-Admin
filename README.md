# BIK Server Admin

Microservicio principal que actúa como API Gateway y panel administrativo para el Banco Informático Kinal (BIK). Desarrollado con Node.js y Express, gestiona la autenticación de usuarios, administración de cuentas y orquesta las peticiones hacia los demás servicios financieros.

## Configuración de Entorno (.env)

Crea un archivo `.env` en la raíz de la carpeta `server-admin` con las siguientes variables requeridas para su ejecución aislada o contenedorizada:

```env
PORT=3001
URI_MONGODB=mongodb://mongo-db:27017/bik_db
SECRET_KEY=TuClaveSuperSecretaBIK2026
CORE_BANKING_URL=http://core-banking:8080
CURRENCY_SERVICE_URL=http://currency-service:3002
```

## Ejecución del Proyecto

La forma recomendada de ejecutar el servicio es utilizando **Docker Compose** junto con todo el ecosistema de microservicios.

Desde la **raíz del proyecto** (donde se encuentra el archivo `docker-compose.yml`), ejecuta:

```bash
docker compose up -d --build
```

Esto iniciará el contenedor `bik-serveradmin` y el servicio quedará disponible en:

```
http://localhost:3001
```

---

## Uso de la Colección de Postman

Las pruebas del API se realizan mediante la colección **BIK-Postman_Collection.json** incluida en el proyecto.

### Pasos

1. Importa el archivo JSON en **Postman**.
2. Ve a **Variables de la Colección**.
3. Verifica que la variable `admin_base_url` tenga el valor:

```
http://localhost:3001/BIK/v1
```

4. Ejecuta el endpoint:

```
Autenticación > Iniciar sesión
```

5. El script de **Tests** guardará automáticamente el **JWT Token** en la variable:

```
{{token}}
```

6. Las demás peticiones utilizarán automáticamente ese token gracias a la configuración **Bearer Token**.

---

## Funcionalidades principales

* Autenticación de usuarios mediante **JWT**.
* Administración de usuarios del sistema.
* Gestión de cuentas bancarias.
* Comunicación con el microservicio **Core Banking**.
* Integración con el **Currency Service** para conversiones de moneda.
* Punto central de acceso para los demás servicios del ecosistema.

---
