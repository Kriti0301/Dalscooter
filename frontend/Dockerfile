# Stage 1: Build React App
FROM node:20-alpine as build
WORKDIR /app

# Copy dependencies & install
COPY package.json package-lock.json ./
RUN npm install

# Copy app source
COPY . .

# Define build-time environment variables
ARG REACT_APP_USER_POOL_ID
ARG REACT_APP_CLIENT_ID
ARG REACT_APP_BACKEND_BASE_URL
ARG REACT_APP_MAPBOX_TOKEN

# Inject them into environment for React to use during build
ENV REACT_APP_USER_POOL_ID=$REACT_APP_USER_POOL_ID
ENV REACT_APP_CLIENT_ID=$REACT_APP_CLIENT_ID
ENV REACT_APP_BACKEND_BASE_URL=$REACT_APP_BACKEND_BASE_URL
ENV REACT_APP_MAPBOX_TOKEN=$REACT_APP_MAPBOX_TOKEN

# Build React app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
