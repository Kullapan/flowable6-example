# Policy Request & Approval System

A high-performance insurance policy orchestration system leveraging **Flowable 6**, **Spring Boot**, and **React**. This project demonstrates a clean separation between business logic (BFF) and workflow state management (Engine).

## 🏗️ Architecture Overview

The system follows a **Hybrid Implementation** model:
- **Infrastructure (Docker)**: Managed PostgreSQL 15 and Flowable UI (Modeler/Admin).
- **Core Orchestration (Local)**: A custom-built Java service (`flowable-engine`) hosting the Flowable Engine and REST API.
- **Business logic (Local)**: A Spring Boot 3 BFF (`custom-backend`) that manages application data and triggers workflows.
- **Interface (Local)**: A modern React dashboard (`web-client`) with high-density Glassmorphism design.

## 🛠️ Tech Stack

| Component | Technology | Version | Port |
| :--- | :--- | :--- | :--- |
| **Web Client** | React 18 + Tailwind | Latest | 5173 |
| **Custom Backend** | Spring Boot 3 + Java 17 | 3.2.x | 8081 |
| **Flowable Engine** | Spring Boot 2 + Java 11 | 2.7.x | 8083 |
| **Flowable UI** | Docker Image | 6.7.2 | 8080 |
| **Database** | PostgreSQL | 15 | 5432 |

---

## 🚀 Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Java 11 (for Engine) and Java 17 (for Backend)
- Maven 3.x
- Node.js & npm

### 2. Launch Infrastructure
Start the database and Flowable UI monitoring tools:
```bash
docker-compose up -d
```

### 3. Start the Custom Engine
```bash
cd flowable-engine
mvn spring-boot:run
```

### 4. Start the Custom Backend (BFF)
```bash
cd custom-backend
mvn spring-boot:run
```

### 5. Start the Web Client
```bash
cd web-client
npm install
npm run dev
```

---

## 📂 Workflow Configuration

The business logic is defined in `workflow/policy-request.bpmn20.xml`. 

### Deployment
To deploy the workflow to the custom engine, use the **Flowable UI** at `http://localhost:8080/flowable-ui/` or run this CURL:

```bash
curl -u admin:test -X POST http://localhost:8083/repository/deployments \
  -F "file=@workflow/policy-request.bpmn20.xml"
```

---

## 🧪 Verification Flow

1. **Submit Application**: Open the web client, select the **Requester** role, and submit a new policy request.
2. **Review Task**: Switch to the **Underwriter** role. You will see the pending task retrieved from the custom engine.
3. **Approve/Reject**: Completing the task will trigger the `custom-backend` callback to finalize the policy record.
4. **Audit**: Use the **Flowable Admin** (available via Flowable UI) to inspect the execution variables and history.

---

> [!NOTE]
> This system is designed for **high density** and **technical precision**. All UI components follow the specifications defined in `DESIGN.md`.
