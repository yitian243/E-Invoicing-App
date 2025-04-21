import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Import common styles first
import './styles/common.css';
// Then import other styles
import './styles/Business.css';
import './styles/Contacts.css';
import './styles/Dashboard.css';
import './styles/index.css';
import './styles/InvoiceCreation.css';
import './styles/InvoiceHistory.css';
import './styles/InvoiceSending.css';
import './styles/InvoiceUpload.css';
import './styles/InvoiceValidation.css';
import './styles/Login.css';

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
