import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { UserProvider } from './context/UserContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
