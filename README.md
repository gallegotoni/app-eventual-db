# app-eventual-db

Aplicación distribuida que implementa un contador replicado con consistencia eventual usando microservicios en Node.js (TypeScript). Se compone de dos microservicios:

- `mic-apiservice`: interfaz RESTful para operar con el contador (add, get, increment, decrement, delete).
- `mic-dbservice`: almacén distribuido que sincroniza estados entre nodos y converge mediante CRDT (Counter basado en G-Counters).

Usa un balanceador NGINX para distribuir carga entre réplicas de `mic-dbservice`.

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
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
```

---

## 🛠️ Comando de Build y Arranque

```bash
# Asigna número de réplicas modificando directamente docker-compose.yml y nginx.conf

# Construir e iniciar contenedores
docker-compose up --build
```


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
{ "key": "dataseKey", "P": [1,2,3], "N": [1] }
```

Aplica la política de convergencia local:
```ts
value = sum(P) - sum(N)
```

---

## 📦 Dockerfile - mic-apiservice

```Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/main.js"]
```

## 📦 Dockerfile - mic-dbservice

```Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/main.js"]
```

---

## 🌐 NGINX como Balanceador

`nginx.conf` define las réplicas de `mic-dbservice`:

```nginx
upstream db_cluster {
  server db1:4000;
  server db2:4000;
  server db3:4000;
}
server {
  listen 4000;
  location / {
    proxy_pass http://db_cluster;
  }
}
```

---

## 📍 Variables de entorno

### mic-apiservice
- `API_PORT` (por defecto `3000`)
- `DB_SERVICE_URL` (por defecto `http://localhost:4000`)

### mic-dbservice
- `DB_PORT` (por defecto `4000`)
- `PEERS` (lista separada por comas de URLs de otras instancias)

---

🚀 Escalado Dinámico

Modifica el número de réplicas manualmente en `docker-compose.yml` y `nginx.conf`.

---