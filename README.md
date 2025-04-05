# EJEMPLO DE VARIABLES DE ENTORNO PARA EL PROYECTO 

DB_NAME=AMVV_DB
DB_USER=sa
DB_PASSWORD=Univalle
DB_HOST=localhost 
JWT_SECRET= 12345
JWT_EXPIRATION=72h
CORS_ORIGIN=http://localhost:3000
PORT= 5002

API_KEY = "AIzaSyD3DxbS07OvCEjjsnbeDwyBSh-ge3PazBg"
AUTH_DOMAIN ="amvv-dbf.firebaseapp.com"
PROJECT_ID = "amvv-dbf"
STORAGE_BUCKET = "amvv-dbf.appspot.com"
MESSAGING_SENDER_ID = "760689455022"
APP_ID = "1:760689455022:web:0e81544f671bc581e4223f"

# COMANDO PARA EJECUTAR SEEDERS

node seeders/seed-roles.js
node seeders/seed-super-admin.js
node seeders/seed-categorias.js
node seeders/seed-clubes.js
node seeders/seed-equipos.js
node seeders/seed-arbitro.js
node seeders/seed-lugares.js
node seeders/seed-jugadores.js

# CREDENCIALES PARA SUPERADMIN

usuario: Admin@example.com
contraseña: 12345

# Eslint Comando

npx eslint nombre del archivo --fix

# ejemplo

npx eslint src/pages/Partidos/RegistrarResultado.js --fix

# Opcional

npx prettier --write src/pages/Partidos/PartidoDetalle.js

