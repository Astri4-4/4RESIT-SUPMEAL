import { Routes, Route } from "react-router-dom";
import {AuthProvider} from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {

  return (
    <AuthProvider>
      <Routes>
        <Route path={"/login"} element={<Login />} ></Route>

        <Route path={"/dashboard"} element={
          <ProtectedRoute>
            <Dashboard></Dashboard>
          </ProtectedRoute>
        } ></Route>

        <Route path={"*"} element={<Login />} ></Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
