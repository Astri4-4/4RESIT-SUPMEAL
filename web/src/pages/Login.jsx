import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import {Google} from "@boxicons/react";
import {useEffect, useState} from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {authApi} from "../api/auth.js";
import {BASE_URL} from "../api/client.js";
import {useAlert} from "../context/AlertContext.jsx";

export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const {login, user, setSession} = useAuth();
    const {showError} = useAlert();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (user) {
            navigate("/dashboard");
        }
    }, [user]);

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) return;

        (async () => {
            try {
                localStorage.setItem("token", token);
                const me = await authApi.me();
                setSession(token, me);
            } catch (error) {
                console.log(error);
                localStorage.removeItem("token");
            }
        })();
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            setEmail("");
            setPassword("");
            navigate("/dashboard");
        } catch (error) {
            console.log(error);
            showError(error.message || "Identifiants incorrects.");
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit(e);
    }

    const handleOAuth = async (e) => {
        e.preventDefault();

        try {
            window.location.replace(`${BASE_URL}/auth/google`);
        } catch (error) {
            console.log(error);
        }

    }

    return (

        <div className={"bg-white min-h-screen flex flex-col justify-center items-center gap-8 py-10 px-4"} >

            <img src="/logo.svg" className={"w-[160px] sm:w-[220px] md:w-[400px] md:absolute md:top-10 md:left-10"} alt=""/>

            <div className={"w-full max-w-md sm:max-w-lg bg-white rounded-[20px] p-6 sm:p-10 md:p-16 shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >

                <h1 className={"text-center text-2xl sm:text-[32px] font-bold font-primary"} >De retour aux fourneaux !</h1>

                <div className={"flex flex-col gap-6 mt-8.75"} >

                    <Input placeholder="Nom d'utilisateur" onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} value={email} ></Input>
                    <Input placeholder="Mot de passe" type="password" onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} value={password} ></Input>

                    <Button text="Se connecter" onClick={handleSubmit} ></Button>
                    <Button icon={<Google width={30} height={30} />} variant={"blue"} text="Se connecter avec Google" onClick={handleOAuth}></Button>

                    <p className={"text-center"} >Tu n'as pas de compte ? <span onClick={() => navigate("/register")} className="text-[#6EA8FE] underline font-[700] cursor-pointer">Créé-le ici</span></p>

                </div>

            </div>

        </div>

    )
}
