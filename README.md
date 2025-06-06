# Social Network

Facebook-like social network project with user profiles, posts, followers, groups, events, notifications, chat etc.<br>
Backend is built with Golang and frontend is built with React by [Tanel Dubolazov](https://github.com/TanelDubolazov).

## Prerequisites

[Install Go](https://go.dev)<br>
[Install Node.js](https://nodejs.org/en/)<br>
[Install Docker](https://www.docker.com)<br>

## Project installation

#### Clone the repository

```
git clone https://github.com/MeelisM/social-network.git && cd social-network
```

#### Run the project with Docker

```
docker compose up --build
```

#### Run the backend without Docker

```
go run cmd/server/main.go
```

#### Run the frontend without Docker

```
cd web && npm install && npm run dev
```

Backend is served @ [http://www.localhost:8080](http://www.localhost:8080)<br>
Frontend is served @ [http://www.localhost:5173](http://www.localhost:5173)
