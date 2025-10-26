FROM node:22.12.0-slim

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (solo las necesarias)
RUN npm install --omit=dev

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto (opcional, Render usa process.env.PORT)
EXPOSE 5002

# Comando de inicio
CMD ["npm", "start"]
