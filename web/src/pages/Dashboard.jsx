import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate("/login", { replace: true })
    }

    return (
        <>
            <h1>Dashboard</h1>
            <p>Connecté en tant que {user?.username}</p>
            <button onClick={handleLogout}>Se déconnecter</button>
        </>
    )
}
