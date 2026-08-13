import {useState} from "react";
import {useAuth} from "../context/AuthContext.jsx";
import {useLocation, useNavigate} from "react-router-dom";


export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth()
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            await login(username, password)
            const redirectTo = location.state?.from?.pathname || "/dashboard"
            navigate(redirectTo, { replace: true })
        } catch (error) {
            setError(error.data?.message || error.message || "Connexion impossible")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} value={username} />
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} value={password} />
                <button type="submit" disabled={submitting}>
                    {submitting ? "Connexion..." : "Submit"}
                </button>
            </form>
            {error && <p role="alert">{error}</p>}
        </>
    )
}
