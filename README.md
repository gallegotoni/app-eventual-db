# app-eventual-db

Aplicación distribuida que implementa un contador replicado con consistencia eventual usando microservicios en Node.js (TypeScript). Se compone de dos microservicios:

- `mic-apiservice`: interfaz RESTful para operar con el contador (add, get, increment, decrement, delete).
- `mic-dbservice`: almacén distribuido que sincroniza estados entre nodos y converge mediante CRDT (Counter basado en G-Counters).

Usa un balanceador Traefik para distribuir carga entre réplicas de `mic-dbservice`.

---

## 📚 Estructura de Carpetas

```
app-eventual-db/
├── mic-apiservice/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── main.ts
├── mic-dbservice/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── main.ts
│       └── peer-manager.ts
├── docker-compose.yaml
```

---

## 🛠️ Comando de Build y Arranque

```bash
docker-compose up -d
```

Por defecto lanzará una replica de la API (mic-apiservice) y una replica de la base de datos (mic-dbservice), además del balanceador de carga.

---

## 🌎 API REST (mic-apiservice)

URL base: `http://localhost:3000/api`

### POST `/increment`
```json
{ "key": "counter1", "value": 5 }
```

### POST `/decrement`
```json
{ "key": "counter1", "value": 2 }
```

### POST `/add`
```json
{ "key": "counter1", "value": 100 }
```

### DELETE `/delete`
```json
{ "key": "counter1" }
```

### GET `/get?key=databaseKey`
```js
1 
```

---

## 📊 mic-dbservice

Cada instancia mantiene su propio estado local:

```ts
interface DataEntry {
  P: number[];
  N: number[];
  value: number;
}
```

Las instancias intercambian su estado mediante `/sync` y aplican convergencia periódica si no hay escrituras.

### POST `/sync`
```json
{ "key": "databaseKey", "P": [1,2,3], "N": [1] }
```

Aplica la política de convergencia local:
```ts
value = sum(P) - sum(N)
```

---

## 🌐 Traefik como Balanceador

El archivo `docker-compose.yaml` ya incluye la configuración para Traefik como proxy inverso y balanceador de carga para los servicios API y DB.  
La API se expone bajo `/api` y la DB bajo `/db`.

---

## 📍 Variables de entorno

### mic-apiservice
- `API_PORT` (por defecto `3000`)
- `DB_SERVICE_URL` (por defecto `http://traefik/db` el balanceador de carga)

### mic-dbservice
- `DB_PORT` (por defecto `4000`)
- `DNS_SERVICE_NAME` (por defecto `mic-db`)
- `PEERS` (OPCIONAL, lista separada por comas de URLs de otras instancias)

---

## 🚀 Escalado Dinámico

```bash
docker compose up -d --scale mic-db=n
```
Siendo n el numero de replicas deseadas de la base de datos

---

## 📝 TODO

- Aplicar la convergencia entre replicas
- Vacíar los arrays de positivos y negativos
- Evaluar las políticas de convergencia