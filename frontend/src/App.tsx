
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Layout from "./components/Layout"
import Companies from "./pages/Companies"
import Workers from "./pages/Workers"
import Dosimeters from "./pages/Dosimeters"
import Periods from "./pages/Periods"
import Assignments from "./pages/Assignments"
import Readings from "./pages/Readings"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import QRTest from "./pages/QRTest"

import WorkerDetails from "./pages/WorkerDetails"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/workers/:id" element={<WorkerDetails />} />
          <Route path="/dosimeters" element={<Dosimeters />} />
          <Route path="/periods" element={<Periods />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          {/* Future routes like /companies will go here */}
        </Route>

        <Route path="/qr-test" element={<QRTest />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
