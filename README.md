# SmartInvoice Application

A modern invoice management system built with React and Node.js.

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
