# Business Process for SMEs Utilizing E-invoicing API
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=18452976&assignment_repo_type=AssignmentRepo)
<br>

# Running the Web Application

## Development Commands

### Starting Frontend Server

Execute the following command in the `./frontend/` directory:

```bash
npm start
```

### Starting Backend Server

Execute the following command in the `./backend/` directory:

```bash
npm start
```

## Docker

### Creating Docker App in Root Directory

```bash
docker-compose up --build
```

> **Note:** The current Dockerfile for the frontend uses **nginx** for production, but it can be changed to use `npm` with `react-scripts start` if refresh issues continue.

File Heirarchy Visualisation:
```
CAPSTONE-PROJECT-2025-T1-ZST1-3900-F13B-BANANA
├── backend
│   ├── node_modules
│   ├── src
│   │   ├── auth.test.ts
│   │   ├── auth.ts
│   │   ├── authWrapper.ts
│   │   ├── business.test.ts
│   │   ├── business.ts
│   │   ├── businessWrapper.ts
│   │   ├── config.ts
│   │   ├── dataStore.ts
│   │   ├── db.ts
│   │   ├── invoice.test.ts
│   │   ├── invoice.ts
│   │   ├── invoiceWrapper.ts
│   │   ├── jest.config.js
│   │   ├── server.ts
│   │   └── types.ts
│   ├── database.json
│   ├── Dockerfile
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── frontend
│   ├── node_modules
│   ├── public
│   ├── src
│   │   ├── components
│   │   │   ├── AuthContext.js
│   │   │   ├── Business.js
│   │   │   ├── config.js
│   │   │   ├── Contacts.js
│   │   │   ├── Dashboard.js
│   │   │   ├── InvoiceCreation.js
│   │   │   ├── InvoiceHistory.js
│   │   │   ├── InvoiceSending.js
│   │   │   ├── InvoiceUpload.js
│   │   │   ├── InvoiceValidation.js
│   │   │   ├── Login.js
│   │   │   ├── Profile.js
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── Sidebar.js
│   │   │   └── Signup.js
│   │   ├── styles/
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.js
│   │   ├── logo.svg
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   ├── Dockerfile
│   ├── package-lock.json
│   └── package.json
├── Dockerfile
├── package-lock.json
├── package.json
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```
