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

## API Endpoints

This table details the available API endpoints for the application.

| HTTP Method | Endpoint Path                            | Description                                                            | Authorization      | Request Body / Params                                                                                                                               | Successful Response         |
|-------------|------------------------------------------|------------------------------------------------------------------------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|
| **Auth Endpoints** |                                          |                                                                        |                    |                                                                                                                                     |                             |
| POST        | `/api/auth/signup`                       | Registers a new user.                                                  | None               | JSON: `{ "email": string, "password": string, "name": string, "role": string (optional, defaults to 'user') }`                                      | JSON: User/token details    |
| POST        | `/api/auth/login`                        | Logs in an existing user.                                              | None               | JSON: `{ "email": string, "password": string }`                                                                                                     | JSON: User/token details    |
| POST        | `/api/auth/logout`                       | Logs out the currently authenticated user.                             | Bearer Token       | None                                                                                                                                                | JSON: `{ "success": true }` or empty body |
| GET         | `/api/auth/validate-token`               | Validates the provided authentication token.                           | Bearer Token       | None                                                                                                                                                | JSON: Validation status/data|
| **Business Endpoints** |                                          |                                                                        |                    |                                                                                                                                     |                             |
| POST        | `/api/business`                          | Creates a new business profile.                                        | Bearer Token       | JSON: `{ "name": string, "tax_id": string, "address"?: string, "email"?: string, "default_currency"?: string, "password": string, "admin_id": string, "admin_name": string, "admin_email": string }` | JSON: Created business details |
| GET         | `/api/business/:businessId`              | Retrieves details for a specific business by its ID.                   | Bearer Token       | Path Param: `businessId` (string)                                                                                                                    | JSON: Business details      |
| GET         | `/api/business/user/:userId`             | Retrieves all businesses associated with a specific user ID.           | Bearer Token       | Path Param: `userId` (string)                                                                                                                      | JSON: Array of businesses |
| PUT         | `/api/business/:businessId`              | Updates the details of an existing business.                           | Bearer Token       | Path Param: `businessId` (string), JSON Body: `{ "name": string, "tax_id": string, "address"?: string, "email"?: string, "default_currency"?: string, "password": string, "user_id": string }` | JSON: Updated business details |
| POST        | `/api/business/join`                     | Allows a user to join an existing business using its name and password. | Bearer Token       | JSON: `{ "businessName": string, "password": string, "userId": string, "userName": string, "userEmail": string }`                                   | JSON: Join confirmation/details |
| GET         | `/api/business/:businessId/members`      | Retrieves the list of members for a specific business.                 | Bearer Token       | Path Param: `businessId` (string)                                                                                                                    | JSON: Array of members    |
| PUT         | `/api/business/:businessId/members/:memberId` | Updates the role of a specific member within a business. Requires admin privileges. | Bearer Token | Path Params: `businessId` (string), `memberId` (string), JSON Body: `{ "role": string, "user_id": string (ID of requesting user) }`                  | JSON: Update confirmation |
| DELETE      | `/api/business/:businessId/members/:memberId` | Removes a member from a business. Requires admin privileges.          | Bearer Token | Path Params: `businessId` (string), `memberId` (string), JSON Body: `{ "user_id": string (ID of requesting user) }`                  | JSON: Deletion confirmation |
| **Invoice Endpoints** |                                          |                                                                        |                    |                                                                                                                                     |                             |
| POST        | `/api/invoice/create`                    | Creates a new invoice.                                                 | *(Likely Bearer Token)* | JSON: `{ "invoiceNumber": string, "client": string, "issueDate": string, "dueDate": string, "subtotal": number, "tax": number, "total": number, "status": string, "items": array, "notes"?: string, "terms"?: string }` | JSON: Created invoice details |
| DELETE      | `/api/invoice/delete/:id`                | Deletes an invoice by its ID.                                          | *(Likely Bearer Token)* | Path Param: `id` (number)                                                                                                                            | 204 No Content              |
| GET         | `/api/invoice/get`                       | Retrieves a list of all invoices.                                      | *(Likely Bearer Token)* | None                                                                                                                                                | JSON: Array of invoices   |
| **Testing Endpoints** |                                          |                                                                        |                    |                                                                                                                                     |                             |
| DELETE      | `/api/testing/clear-users`               | *Testing Only:* Resets the data store, clearing all users/data.      | None               | None                                                                                                                                                | JSON: `{ "success": true }` |

**Notes:**

* **Authorization:** Endpoints requiring authentication expect a standard `Authorization: Bearer <token>` header. Invoice endpoints are marked as *likely* requiring auth; verify implementation with Ollie.
* `?` indicates optional fields in the request body.
* `:paramName` indicates a URL path parameter.

## File Heirarchy Visualisation:
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
=======
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

## File Heirarchy Visualisation:
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
