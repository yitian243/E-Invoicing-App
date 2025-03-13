import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './Dashboard.css'; // Dashboard styles
import './index.css';
import './InvoiceCreation.css'; // Invoice creation styles
import './InvoiceHistory.css'; // Invoice history styles
import './InvoiceSending.css'; // Invoice Sending styles
import './InvoiceUpload.css'; // Invoice Upload styles
import './InvoiceValidation.css'; // Invoice Validation styles
import './Login.css'; // Login page styles
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
