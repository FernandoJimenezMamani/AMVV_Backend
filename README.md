# AMVV Backend

## Desarrollo Normal (Sin Docker)
npm install
npm run dev

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

# Eslint Comando

npx eslint nombre del archivo --fix

# ejemplo

npx eslint src/pages/Partidos/RegistrarResultado.js --fix

# Opcional

npx prettier --write src/pages/Partidos/PartidoDetalle.js

# DOCKER

# Primera vez
docker-compose up --build

# Iniciar  

docker-compose up

# Detener
docker-compose down

# Ver logs
docker-compose logs -f

