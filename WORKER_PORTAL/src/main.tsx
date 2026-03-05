import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Import Tailwind and custom animations here
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
