import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import {Google} from "@boxicons/react";
import {useEffect, useState} from "react";
import {useAuth} from "../context/AuthContext.jsx";
import {useNavigate} from "react-router-dom";
import {authApi} from "../api/auth.js";
import {BASE_URL} from "../api/client.js";

export default function Register() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rgpd, setRgpd] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {user} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/dashboard");
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        if (!rgpd) {
            setError("Tu dois accepter la politique de confidentialité.");
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await authApi.register({username, email, password, rgpd});
            navigate("/login");
        } catch (err) {
            setError(err.message || "Erreur lors de la création du compte");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit(e);
    }

    const handleOAuth = (e) => {
        e.preventDefault();

        try {
            window.location.replace(`${BASE_URL}/auth/google`);
        } catch (error) {
            console.log(error);
        }
    }

    return (

        <div className={"bg-primary w-screen h-screen flex justify-center items-center"} >

            <div className={"bg-white rounded-[20px] p-16 shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >

                <h1 className={"text-center text-[32px] font-bold"} >Créé ton compte</h1>

                <div className={"flex flex-col gap-6 mt-8.75"} >

                    <Input placeholder="pseudo" onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyDown} value={username} ></Input>
                    <Input placeholder="adresse email" onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} value={email} ></Input>
                    <Input placeholder="mot de passe" type="password" onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} value={password} ></Input>
                    <Input placeholder="confirmer le mot de passe" type="password" onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKeyDown} value={confirmPassword} ></Input>

                    <Button text="Créer mon compte" onClick={handleSubmit} ></Button>

                    <div className={"flex items-center gap-3"} >
                        <button
                            type={"button"}
                            onClick={() => setRgpd(!rgpd)}
                            className={`w-10 h-6 rounded-full relative shrink-0 transition-colors cursor-pointer ${rgpd ? "bg-[#B7E4AA]" : "bg-[#D9D9D9]"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${rgpd ? "translate-x-4" : ""}`} ></span>
                        </button>
                        <p className={"text-[16px] text-[#9C9C9C]"} >J’ai lu et j’accepte la <span className={"text-[#FFB857] underline"} >politique de confidentialité</span></p>
                    </div>

                    {error && <p className={"text-[#FF5757] text-sm text-center"} >{error}</p>}

                    <div className={"flex items-center gap-3"} >
                        <div className={"flex-1 h-px bg-[#9C9C9C]"} ></div>
                        <p className={"text-[#9C9C9C] text-2xl"} >OU</p>
                        <div className={"flex-1 h-px bg-[#9C9C9C]"} ></div>
                    </div>

                    <Button icon={<Google width={30} height={30} />} variant={"blue"} text="Créer mon compte avec Google" onClick={handleOAuth}></Button>

                    <p className={"text-center"} >Tu as déjà un compte ? <span onClick={() => navigate("/login")} className="text-black underline font-[700] cursor-pointer">Connecte-toi</span></p>

                </div>

            </div>

        </div>

    )
}
