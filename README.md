# Microservice Kafka Project

This project demonstrates a microservice architecture utilizing Kafka for inter-service communication.

## Architecture Choices

This project leverages a microservice architecture. Key components include:
*   **Kraft Kafka:** Kafka is deployed in Kraft mode, which integrates metadata management directly into Kafka brokers, removing the need for a separate Zookeeper ensemble. This simplifies deployment and management.
*   **Microservices:** Individual services communicate asynchronously via Kafka topics.

## Setup Instructions

To get the project up and running locally using Docker Compose:

1.  **Build and Run Services:**
    Navigate to the root directory of the project and execute the following command:
    ```bash
    docker-compose up --build -d
    ```
    This command will build the necessary Docker images and start all services in detached mode.

2.  **Access Services:**
    Once the services are running, you can access the frontend application via your web browser. Check your `docker-compose.yml` for specific port mappings.

## Kubernetes Deployment

This project includes Kubernetes manifests for deploying the application to a Kubernetes cluster.

### Local Deployment (Minikube / Docker Desktop)

For local development and testing, you can use `minikube` or the Kubernetes cluster provided by Docker Desktop. The `all-in-one.yaml` file is provided for this purpose. It will deploy all the necessary components (MongoDB, Kafka, and the logging microservice) in a `logging-stack` namespace.

**Note:** This manifest uses `emptyDir` for volumes, which means data will be lost if pods restart. This is suitable for local testing but not for production.

1.  **Start your local Kubernetes cluster:**
    *   **Minikube:** `minikube start`
    *   **Docker Desktop:** Enable Kubernetes in the Docker Desktop settings.

2.  **Apply the manifest:**
    ```bash
    kubectl apply -f k8s/all-in-one.yaml
    ```

3.  **Access the service:**
    The `logging-ms` service is exposed as a `LoadBalancer`. In a local environment, you can access it using the following command:
    *   **Minikube:** `minikube service logging-ms -n logging-stack`
    *   **Docker Desktop:** The service should be available at `localhost:5000`.

### AWS EKS Deployment

For a production-like environment on AWS, you can use Amazon EKS (Elastic Kubernetes Service).

1.  **Create the EKS cluster:**
    The `k8s/eks-cluster.yaml` file defines an EKS cluster using `eksctl`. To create the cluster, you need to have `eksctl` and `aws-cli` installed and configured.

    ```bash
    eksctl create cluster -f k8s/eks-cluster.yaml
    ```
    This command will provision an EKS cluster with the specified configuration. This can take several minutes.

2.  **Deploy the application:**
    Once the cluster is ready, you can deploy the application using the same `all-in-one.yaml` manifest.

    ```bash
    kubectl apply -f k8s/all-in-one.yaml
    ```

    **Note:** For a production deployment, you should use PersistentVolumeClaims (PVCs) instead of `emptyDir` for data persistence. The provided `pvc-kafka.yaml`, `pvc-mongo.yaml`, and `pvc-zk.yaml` can be used as a reference. You would also need to modify the deployments to use these PVCs.

3.  **Access the service:**
    The `logging-ms` service is exposed as a `LoadBalancer`. On AWS, this will provision an Elastic Load Balancer (ELB). You can get the external IP of the service by running:
    ```bash
    kubectl get svc logging-ms -n logging-stack
    ```
    The external IP will be listed in the `EXTERNAL-IP` column. You can then access the service at `http://<EXTERNAL-IP>:5000`.

    Example: `http://a010bfab96a5b46e1b35526c5abaee8f-63120397.eu-north-1.elb.amazonaws.com:5000/`

    The API endpoints are accessible regardless of whether the service is deployed locally or on the cloud. Simply replace the base URL (`localhost:5000` for local, or the ELB URL for AWS) with the appropriate address.

    *   Get logs: `http://<BASE_URL>/logs?page=1&limit=1&userId=&action=logout&startDate=&endDate=`
        Example (AWS): `http://a010bfab96a5b46e1b35526c5abaee8f-63120397.eu-north-1.elb.amazonaws.com:5000/logs?page=1&limit=1&userId=&action=logout&startDate=&endDate=`
    *   Start traffic generation: `http://<BASE_URL>/start-traffic?interval=500`
        Example (Local): `http://localhost:5000/start-traffic?interval=500`
    *   Stop traffic generation: `http://<BASE_URL>/stop-traffic`
        Example (Local): `http://localhost:5000/stop-traffic`