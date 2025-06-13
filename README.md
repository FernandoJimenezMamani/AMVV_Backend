# EJEMPLO DE VARIABLES DE ENTORNO PARA EL PROYECTO 

DB_NAME=xxxx
DB_USER=xxxxx
DB_PASSWORD=xxxxxxx
DB_HOST=localhost 
JWT_SECRET= xxxxxxx
JWT_EXPIRATION=72h
CORS_ORIGIN=http://xxxxxx:3000
PORT= 5002

API_KEY = "xxxxxxxxxxxxx"
AUTH_DOMAIN ="xxxxxxxx"
PROJECT_ID = "xxxxxx"
STORAGE_BUCKET = "xxxxxxxxx"
MESSAGING_SENDER_ID = "xxxxxxxxx"
APP_ID = "xxxxxxxxxxxxxxxx"

EMAIL_USER = 'xxxxxxxxxx'
EMAIL_PASS = 'xxxxxxxxxxxxx'

SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxx
NODE_ENV=development


# COMANDO PARA EJECUTAR SEEDERS

node seeders/seed-roles.js
node seeders/seed-super-admin.js
node seeders/seed-categorias.js
node seeders/seed-clubes.js
node seeders/seed-equipos.js
node seeders/seed-arbitro.js
node seeders/seed-lugares.js
node seeders/seed-jugadores.js
node seeders/seed-presidente-club.js
node seeders/seed-delegados-club.js

# CREDENCIALES PARA SUPERADMIN

usuario: Admin@example.com
contraseña: 12345

# Eslint Comando

npx eslint nombre del archivo --fix

# ejemplo

npx eslint src/pages/Partidos/RegistrarResultado.js --fix

# Opcional

npx prettier --write src/pages/Partidos/PartidoDetalle.js

