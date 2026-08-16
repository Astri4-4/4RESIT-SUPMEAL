import { Routes, Route } from "react-router-dom";
import {AuthProvider} from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Navbar from "./components/ui/Navbar.jsx";
import Recipes from "./pages/Recipes.jsx";
import RecipeDetail from "./pages/RecipeDetail.jsx";
import Account from "./pages/Account.jsx";
import CreateRecipe from "./pages/CreateRecipe.jsx";

function App() {

  return (
    <AuthProvider>
      <Routes>
        <Route path={"/login"} element={<Login />} ></Route>

        <Route path={"/register"} element={<Register />} ></Route>

        <Route path={"/dashboard"} element={
          <ProtectedRoute>
            <Navbar page={"dashboard"}>
              <Dashboard></Dashboard>
            </Navbar>
          </ProtectedRoute>
        } ></Route>

        <Route path={"/recipes"} element={
          <ProtectedRoute>
            <Navbar page={"recipes"}>
              <Recipes></Recipes>
            </Navbar>
          </ProtectedRoute>
        } ></Route>

        <Route path={"/recipe/:id"} element={
          <ProtectedRoute>
            <Navbar page={"recipes"}>
              <RecipeDetail></RecipeDetail>
            </Navbar>
          </ProtectedRoute>
        } ></Route>

        <Route path={"/account"} element={
          <ProtectedRoute>
            <Navbar page={"account"}>
              <Account></Account>
            </Navbar>
          </ProtectedRoute>
        } ></Route>

        <Route path={"/create-recipe"} element={
          <ProtectedRoute>
            <Navbar page={"recipes"}>
              <CreateRecipe></CreateRecipe>
            </Navbar>
          </ProtectedRoute>
        } ></Route>

        <Route path={"*"} element={<Login />} ></Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
