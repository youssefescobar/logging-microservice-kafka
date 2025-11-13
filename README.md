# Microservice Kafka Project

This project demonstrates a microservice architecture that uses Kafka for asynchronous communication between services, includes log generation, Api endpoint to query logs, all containerized and ready for deployment.

## Live Demo

A live version of this project is running on an AWS EKS cluster. You can interact with it right now

**Frontend UI:** [http://a010bfab96a5b46e1b35526c5abaee8f-63120397.eu-north-1.elb.amazonaws.com:5000/](http://a010bfab96a5b46e1b35526c5abaee8f-63120397.eu-north-1.elb.amazonaws.com:5000/)

**API Endpoint:** `http://a010bfab96a5b46e1b35526c5abaee8f-63120397.eu-north-1.elb.amazonaws.com:5000`

You can use the UI to see logs in real-time or use the API to fetch data (see [API Reference](#api-reference) below).

---

## 🏗️ Architecture

### System Architecture

The project consists of several key components working together:

*   **Frontend:** A simple web interface to display logs.
*   **Logging Microservice (Node.js):**
    *   Exposes a REST API to query logs from the database.
    *   Includes a traffic generator to simulate log production.
*   **Kafka:** Acts as a message broker, decoupling the log producers from the consumers. It's deployed in Kraft mode, eliminating the need for a separate Zookeeper cluster.
*   **MongoDB:** A NoSQL database used to store and query the logs.

### Code Architecture

The Node.js microservice follows a layered architecture, promoting separation of concerns and maintainability:

*   **`domain`**: Contains the core business logic and data models (e.g., `log.model.js`).
*   **`application`**: Holds application-specific logic and use cases, like the log traffic generator (`log.generator.js`).
*   **`infrastructure`**: Manages connections to external systems like Kafka (`consumer.js`, `producer.js`) and MongoDB (`db_connection.js`).
*   **`interfaces`**: Defines the entry points to the application, such as the Express.js REST API controllers (`index.js`).

---

## 💻 Local Setup

You can run the entire stack on your local machine using either Docker Compose or a local Kubernetes cluster.

### 1. Using Docker Compose

This is the simplest way to get started.

1.  **Build and Run:**
    ```bash
    docker-compose up --build -d
    ```
2.  **Access the Service:**
    *   **UI:** Open your browser to [http://localhost:5000](http://localhost:5000).
    *   **API:** The API is available at `http://localhost:5000`. You can use a tool like Postman or `curl` to interact with it. See the [API Reference](#api-reference).

### 2. Using Kubernetes (Minikube / Docker Desktop)

This method simulates a cloud deployment more closely.

1.  **Start Your Cluster:**
    Ensure you have a local Kubernetes cluster running (e.g., `minikube start` or enable Kubernetes in Docker Desktop).

2.  **Deploy Persistent Storage:**
    Apply the Persistent Volume Claims (PVCs) for Kafka and MongoDB.
    ```bash
    kubectl apply -f k8s/pvc-mongo.yaml
    kubectl apply -f k8s/pvc-kafka.yaml
    ```

3.  **Deploy Kafka & MongoDB:**
    Deploy the database and message broker.
    ```bash
    kubectl apply -f k8s/mongo.yaml
    kubectl apply -f k8s/kafka.yaml
    ```
    **Wait** for these pods to be in the `Running` state before proceeding. You can check their status with:
    ```bash
    kubectl get pods -n logging-stack
    ```

4.  **Deploy the Application:**
    Finally, deploy the Node.js logging microservice.
    ```bash
    kubectl apply -f k8s/node-app.yaml
    ```

5.  **Access the Service:**
    *   **Minikube:** Forward the service to your local machine:
        ```bash
        minikube service logging-ms -n logging-stack
        ```
        This will open the service in your browser.
    *   **Docker Desktop:** The service should be available at [http://localhost:5000](http://localhost:5000).

---

## ☁️ Cloud Deployment (AWS EKS)

The `k8s/eks-cluster.yaml` file is configured to provision a cluster on AWS EKS using `eksctl`.

1.  **Prerequisites:**
    Ensure you have `eksctl` and the `aws-cli` installed and configured with appropriate credentials.

2.  **Create the Cluster:**
    ```bash
    eksctl create cluster -f k8s/eks-cluster.yaml
    ```
    This command can take several minutes to complete.

3.  **Deploy the Application:**
    Once the cluster is ready, you can deploy the entire stack using the `all-in-one.yaml` manifest, which is designed for environments where PVCs are dynamically provisioned.
    ```bash
    kubectl apply -f k8s/all-in-one.yaml
    ```

4.  **Access the Service:**
    The manifest creates a `LoadBalancer` service. Find its external address:
    ```bash
    kubectl get svc logging-ms -n logging-stack
    ```
    The URL will be in the `EXTERNAL-IP` column.

---

## 📖 API Reference

All endpoints are `GET` requests. The base URL depends on your deployment environment (`http://localhost:5000` for local, or the live demo URL for cloud).

### Fetch Logs

Retrieves a paginated and filtered list of logs.

`GET /logs`

**Query Parameters:**

| Parameter   | Type     | Default | Description                                          |
|-------------|----------|---------|------------------------------------------------------|
| `page`      | `number` | `1`     | The page number to retrieve.                         |
| `limit`     | `number` | `10`    | The number of logs to return per page.               |
| `userId`    | `string` |         | Filter logs by a specific user ID.                   |
| `action`    | `string` |         | Filter logs by a specific action (e.g., `login`).    |
| `startDate` | `Date`   |         | The start date for the time range (ISO 8601 format). |
| `endDate`   | `Date`   |         | The end date for the time range (ISO 8601 format).   |

**Example Request:**

```
http://<BASE_URL>/logs?page=1&limit=5&action=logout
```

### Start Traffic Generation

Starts a process that generates random logs and sends them to Kafka.

`GET /start-traffic`

**Query Parameters:**

| Parameter  | Type     | Default | Description                                  |
|------------|----------|---------|----------------------------------------------|
| `interval` | `number` | `1000`  | The interval in milliseconds between each log. |

**Example Request:**

```
http://<BASE_URL>/start-traffic?interval=500
```

### Stop Traffic Generation

Stops the log generation process.

`GET /stop-traffic`

**Example Request:**

```
http://<BASE_URL>/stop-traffic
```
