# Flowable 6 Insurance Policy Processing System

A full-stack, entirely containerized workflow orchestration system built with **Flowable 6**, **Spring Boot**, and **React**.

This project provides a complete microservice-oriented architecture where a Custom Backend acts as the API Gateway (BFF) and the Flowable Engine is embedded as a standalone REST microservice. It is orchestrated seamlessly via Docker Compose.

---

## 🏗️ Architecture Overview

The system runs entirely via Docker containers on a shared bridge network (`policy-network`), eliminating CORS issues via Nginx reverse proxies and keeping internal communication fully contained.

| Container Service | Responsibility | Framework / Tech | Internal Port | Exposed Port |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | Database for Flowable Engine & Custom App | PostgreSQL 15 | 5432 | `:5432` |
| **`pgadmin`** | Database admin interface | pgAdmin 4 | 80 | `:5050` |
| **`flowable-ui`** | Official Modeler, Admin & IDM apps | Flowable 6.7.2 | 8080 | `:8086` |
| **`flowable-engine`** | Headless BPMN runtime & REST API | Spring Boot 2.7 (Java 11) | 8081 | `:8081` |
| **`custom-backend`** | Custom API Gateway & Persistence layer | Spring Boot 3.1 (Java 17) | 8080 | `:8080` |
| **`webapp-client`** | Public policy submission frontend | React / Nginx | 80 | `:3000` |
| **`webapp-admin`** | Underwriter approval & task dashboard | React / Nginx | 80 | `:3001` |

---

## 🚀 Getting Started

The entire stack is containerized using optimized, multi-stage Dockerfiles. You do not need Java, Node.js, or Gradle installed on your host machine to run the project.

### 1. Launch the Stack
Start the databases, Flowable UI, the Engine, Backend, and both Frontends:
```bash
docker compose up --build -d
```

### 2. Access the Applications
Once all containers are healthy, open your browser:
*   **Submit a Policy (Client App):** [http://localhost:3000](http://localhost:3000)
*   **Approve a Policy (Admin App):** [http://localhost:3001](http://localhost:3001)
*   **Flowable UI (Modeler/Admin):** [http://localhost:8086/flowable-ui](http://localhost:8086/flowable-ui)
*   **pgAdmin (Database UI):** [http://localhost:5050](http://localhost:5050)

### 3. Teardown & Reset
To stop all services:
```bash
docker compose down
```
To stop everything and **wipe the database completely** (factory reset):
```bash
docker compose down -v
```

---

## 🔒 Credentials & Git Security Review

This repository has been reviewed down to the configuration level prior to Git commit. 

**There are NO sensitive AWS/Stripe/Cloud API keys in this project.** 
The credentials defined throughout the application are strictly **development defaults**. They are completely safe to be committed to version control so that other developers can start the project instantly.

### Default Development Credentials
*   **Flowable REST Basic Auth:** `admin` / `test`
*   **Flowable UI App (Modeller/IDM):** `admin` / `test`
*   **PostgreSQL User / Password:** `flowable` / `flowable`
*   **PgAdmin Web UI:** `admin@admin.com` / `admin`

*(If you ever deploy this to a public cloud production cluster, you must inject real secrets via external CI/CD Environment Variables instead of the `docker-compose.yml` defaults).*

---

## 🧪 System Roles & Workflow

1.  **Policy Submit (Client UI):** A public user lands on `webapp-client` to submit their policy details (Premium, Type, Customer Name).
2.  **API Gateway (Custom Backend):** Receives the HTTP payload, sets up system-level DB records in `custom_app_db`, and triggers the workflow over the Docker network.
3.  **Process Engine:** Deploys internal variables and enters a User Task awaiting the Underwriting Group.
4.  **Underwriter Approval (Admin UI):** The underwriter accesses `webapp-admin` to fetch pending tasks from the flowable engine. Upon approval, a BPMN Service Task uses `JavaDelegate` to ping the `custom-backend` to persist the definitive Policy.
