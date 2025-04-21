import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/Dashboard.css'; // Dashboard styles
import './styles/index.css';
import './styles/InvoiceCreation.css'; // Invoice creation styles
import './styles/InvoiceHistory.css'; // Invoice history styles
import './styles/InvoiceSending.css'; // Invoice Sending styles
import './styles/InvoiceUpload.css'; // Invoice Upload styles
import './styles/InvoiceValidation.css'; // Invoice Validation styles
import './styles/Login.css'; // Login page styles
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
