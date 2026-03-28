# Prometheus Demo Repo

Demo Express application instrumented with prometheus-auto-instrument, integrated dashboard, Redis and MongoDB support, and k6 load testing.

## What this project includes

- Automatic Prometheus metrics for HTTP traffic
- Built-in monitoring dashboard from prometheus-auto-instrument v1.2.0
- WebSocket live dashboard updates
- Redis and MongoDB integration (with in-memory fallback when unavailable)
- Docker Compose stack for Redis and MongoDB
- Attack-style k6 load test scenarios

## Tech stack

- Node.js (CommonJS)
- Express 5
- prometheus-auto-instrument 1.2.0
- Redis client 5
- Mongoose 9
- Docker Compose
- k6

## Project structure

- server.js: Main app, metrics setup, dashboard integration, routes
- db.js: MongoDB connection with fallback mock model
- redis.js: Redis connection with fallback mock client
- docker-compose.yml: Local Redis and MongoDB services
- load-tests/attack-test.js: k6 attack and pressure scenarios

## Prerequisites

- Node.js 18 or newer recommended
- npm
- Docker Desktop (for Redis and MongoDB)
- k6 installed (Windows path used in examples: C:\\Program Files\\k6\\k6.exe)

## Installation

```powershell
npm install
```

## Run with Docker dependencies

```powershell
npm run docker:up
npm start
```

App URLs:

- API: http://localhost:3000
- Metrics: http://localhost:3000/metrics
- Dashboard: http://localhost:3000/dashboard/
- Legacy monitor route: http://localhost:3000/__monitor (redirects to dashboard)

## Useful npm scripts

```powershell
npm start
npm run docker:up
npm run docker:down
npm run docker:logs
npm run k6:attack
npm run k6:attack:summary
```

## k6 load testing

Important: load-tests/attack-test.js is a k6 script, not a Node.js script.

Do not run this:

```powershell
node .\load-tests\attack-test.js
```

Run with k6:

```powershell
& "C:\\Program Files\\k6\\k6.exe" run .\load-tests\attack-test.js
```

Quick mode with custom base URL:

```powershell
$env:QUICK='true'
$env:BASE_URL='http://localhost:3000'
& "C:\\Program Files\\k6\\k6.exe" run .\load-tests\attack-test.js --no-usage-report
```

## Available API routes

- GET /hello
- GET /users/:id
- GET /cache/:key
- GET /error
- GET /slow

## Monitoring notes

- Metrics route is excluded from instrumentation to avoid skew
- Dashboard internal routes are excluded from instrumentation
- Error classification is based on HTTP status classes (4xx and 5xx in dashboard logic)

## Troubleshooting

### Dashboard loads but charts are empty

- Confirm app is started from this repo
- Open http://localhost:3000/metrics and verify metric text is returned
- Check browser console for blocked scripts
- Make sure no stale Node process is binding the same port with older code

### npm start fails due port conflict

Run on another port:

```powershell
$env:PORT='3002'
npm start
```

Then open:

- http://localhost:3002/dashboard/

### k6 command not found

Use full executable path on Windows:

```powershell
& "C:\\Program Files\\k6\\k6.exe" version
```

## License

ISC
