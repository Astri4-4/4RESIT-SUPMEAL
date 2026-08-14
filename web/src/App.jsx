import { Routes, Route } from "react-router-dom";
import {AuthProvider} from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Navbar from "./components/ui/Navbar.jsx";

function App() {

  return (
    <AuthProvider>
      <Routes>
        <Route path={"/login"} element={<Login />} ></Route>

        <Route path={"/dashboard"} element={
          <ProtectedRoute>
            <Navbar page={"dashboard"}>
              <Dashboard></Dashboard>
            </Navbar>
          </ProtectedRoute>
        } ></Route>

        <Route path={"*"} element={<Login />} ></Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
