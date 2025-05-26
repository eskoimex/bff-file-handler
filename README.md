# 📁 BFF File Handler Service (NestJS)

A secure, resilient, and dynamically throttled file upload service built with NestJS. Supports large (~250MB) CSV file uploads and system-aware request handling.

---

## 🚀 Features

- 📤 Multipart CSV Uploads up to 250MB
- 🔐 Basic Authentication on all endpoints
- ⚖️ Dynamic Throttling based on CPU and memory usage
- 🛑 Circuit Breaker with configurable thresholds
- ⏳ Rate Limiting: 1 request every 10 seconds per client
- 🧵 Concurrency Limiting: Max 5 parallel uploads
- 🔁 Resilient Streaming with filesystem error fallback
- 📊 `/health` endpoints for observability, system's CPU pressure, available memory,and the health status of all external dependencies.
- 📈 Structured Logging with per-request correlation (`requestId`)
- 🐳 Docker-ready, with CI/CD support

---

## 🧪 API Endpoints

### `POST /upload`

- Uploads a CSV file securely.

#### 🔐 Headers
- `Authorization: Basic <base64(user:pass)>`
- `Content-Type: multipart/form-data`

#### 📦 Body
- Key: `file`
- Value: CSV file (up to 250MB)

#### ⚠️ Constraints
- File type: `.csv` only
- Max 5 concurrent uploads
- 1 upload per 10 seconds per client
- Uploads rejected under high CPU/memory load

# Postman curl sample for pload endpoint
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Basic $(echo -n 'user:pass' | base64)" \
  -F "file=@./your-file.csv"


### `GET /health`

Returns system health metrics:

```json
{
    "status": "ok",
    "cpu": "31.9%",
    "freeMemory": "1263.81MB",
    "dependencies": {
        "fileSystemWritable": true,
        "circuitBreaker": "healthy"
    }
}
```

# Postman curl sample for health endpoint
```bash
curl -X GET http://localhost:3000/health
```


# Expected behaviour under load
```
| Condition                            | Expected Behavior                                                |
| ------------------------------------ | ---------------------------------------------------------------- |
| CPU Load > Configured Threshold      | Upload requests are rejected with HTTP `400` and logged          |
| Free Memory < Configured Threshold   | Uploads are rejected with HTTP `400`                             |
| > 5 Concurrent Uploads               | Requests are queued or rejected with HTTP `429`                  |
| > 1 Request / 10s from same client   | Request is throttled with HTTP `429`                             |
| Circuit Breaker Open                 | Uploads are blocked; clients receive HTTP `503`                  |
| Upload Exceeds Max File Size (250MB) | Rejected with HTTP `413 Payload Too Large`                       |
| Unexpected File System Error         | Handled with retry logic; if persistent, upload fails gracefully |
| Invalid File Type or Extension       | Rejected with HTTP `400`                                         |
```

# Error handling
```
| Status | Reason                               | Message                               |
| ------ | ------------------------------------ | ------------------------------------- |
| 400    | Invalid input / wrong file extension | `"Only .csv files are allowed"`       |
| 400    | System resources exceeded            | `"System under high load, try later"` |
| 401    | Missing or invalid credentials       | `"Unauthorized"`                      |
| 413    | File exceeds max size                | `"File too large"`                    |
| 429    | Rate limit exceeded (1 per 10s)      | `"Too many requests"`                 |
| 503    | Circuit breaker open (high failure)  | `"Service temporarily unavailable"`   |
| 500    | Unhandled errors                     | `"Internal server error"`             |

```

# Clone project
git clone https://github.com/eskoimex/bff-file-handler.git
cd bff-file-handler

# Install dependencies
npm install

# Create uploads folder
mkdir uploads

# Add env vars
cp .env.example .env


# Returns recent structured logs for debugging and traceability.

- **Headers**: Basic Auth required
- **Query Params**: `limit` (optional, default: 100)


- **Headers**: Basic Auth required

```
| Variable          | Description             |
| ----------------- | ----------------------- |
| `BASIC_AUTH_USER` | Username for Basic Auth |
| `BASIC_AUTH_PASS` | Password for Basic Auth |

```


# run test
npm run test


## 🛡️ Security & Resilience

- All endpoints require Basic Authentication.
- Uploads are protected by rate limiting and concurrency controls.
- Circuit breaker prevents system overload and enables graceful degradation.
- Health and metrics endpoints provide real-time observability.

---

## 🐳 Docker Usage

Build and run with:

```bash
docker build -t bff-file-handler .
docker run -p 3000:3000 bff-file-handler
```

