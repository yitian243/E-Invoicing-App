![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
# SmartInvoice App | UNSW Capstone Project
**Full-Stack Invoice Management System**

## Project Overview
SmartInvoice is a modern, containerized invoice management system designed to streamline business-to-client billing workflows. Developed as a **Capstone Project at UNSW (COMP3900)**, the application focuses on robust data persistence, secure user authentication, and an automated notification pipeline.

## My Key Engineering Contributions
While contributing to the full stack, I served as the **Feature Owner** for the core business domain, specifically managing the **Invoice and Contact modules**.

### **Backend Architecture & Logic**
* **RESTful API Design:** Architected and implemented secure endpoints for `/api/invoice` and `/api/contact` using **Node.js** and **Express**.
* **State Management:** Developed the server-side logic to handle complex invoice lifecycle states (Draft, Sent, Paid, Overdue).
* **Data Persistence:** Designed relational database interactions with **PostgreSQL (Supabase)** to ensure data integrity across client records and financial documents.
* **Validation:** Implemented strict server-side validation to ensure invoice data compliance before processing and storage.

### **Frontend Implementation**
* **Functional Page Development:** Developed the primary React pages for Invoice Creation and Contact Management.
* **Asynchronous Integration:** Integrated frontend forms with backend services, handling loading states and error boundaries for a seamless user experience.

### **DevOps & Infrastructure**
* **Containerization:** Configured multi-stage **Docker** builds for both frontend and backend to ensure a consistent environment from development to production.
* **Environment Orchestration:** Managed service networking and volume persistence using **Docker Compose**.

## 🛠 Tech Stack
* **Frontend:** React.js, Nginx (Production)
* **Backend:** Node.js, Express, TypeScript
* **Database:** PostgreSQL (via Supabase)
* **Infrastructure:** Docker, Docker Compose
* **Notifications:** Resend API

## Features

- User authentication and authorization
- Business profile management
- Contact management
- Invoice creation, validation, and sending
- Email notifications via Resend API
- Database storage with Supabase

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- Docker and Docker Compose (for containerized deployment)
- Supabase account (for database)

### Local Development

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and update the values with your Supabase credentials

4. Run database migrations:
   ```
   # Run migrations to set up the database schema
   cd backend
   npm run migrate
   ```

5. Start the development servers:
   ```
   # Start backend server
   cd backend
   npm start

   # In a new terminal, start frontend server
   cd frontend
   npm start
   ```

6. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Production Deployment

### Using Docker Compose

1. Make sure Docker and Docker Compose are installed on your system

2. Set up environment variables:
   - Copy `.env.example` to `.env` and update the values with your production credentials
   - The following environment variables are required:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     SUPABASE_SERVICE_KEY=your_supabase_service_key
     RESEND_API_KEY=your_resend_api_key
     RESEND_FROM=your_email@example.com
     ```

3. Build and start the containers:
   ```
   docker-compose up -d --build
   ```

4. Access the application:
   - Frontend: http://localhost (port 80)
   - Backend API: http://localhost:5000

### Deployment to a Cloud Provider

1. Set up your cloud provider (AWS, Azure, GCP, etc.)

2. Configure environment variables in your cloud provider's dashboard

3. Build the Docker images:
   ```
   docker-compose build
   ```

4. Push the images to a container registry (Docker Hub, ECR, etc.)

5. Deploy the containers to your cloud provider using their respective services:
   - AWS: ECS, EKS, or Elastic Beanstalk
   - Azure: AKS or App Service
   - GCP: GKE or Cloud Run

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase public key
- `SUPABASE_SERVICE_KEY`: Your Supabase service key
- `RESEND_API_KEY`: Your Resend API key
- `RESEND_FROM`: Email address to send from

## Project Structure

- `/backend`: Node.js Express server
  - `/src`: TypeScript source files
  - `/dist`: Compiled JavaScript files (generated)

- `/frontend`: React application
  - `/public`: Static files
  - `/src`: React components and logic
  - `/build`: Production build (generated)

## Docker Configuration

- `docker-compose.yml`: Defines the services, networks, and volumes
- `backend/Dockerfile`: Multi-stage build for the backend
- `frontend/Dockerfile`: Multi-stage build for the frontend
- `frontend/nginx.conf`: Nginx configuration for serving the frontend
- `backend/docker-entrypoint.sh`: Script to set up environment variables for the backend
- `frontend/docker-entrypoint.sh`: Script to set up environment variables for the frontend

## API Documentation

The backend API provides the following endpoints:

- Authentication: `/api/auth/*`
- Business: `/api/business/*`
- Contacts: `/api/contact/*`
- Invoices: `/api/invoice/*`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

