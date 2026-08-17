import Button from "../components/ui/Button.jsx";
import {Power, Cloud} from "@boxicons/react"
import Input from "../components/ui/Input.jsx";
import TagCategoryList from "../components/ui/TagCategoryList.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";
import DisabledButton from "../components/ui/DisabledButton.jsx";
import googleLogo from "../assets/account/google.png";
import userApi from "../api/user.js";
import tagApi from "../api/tag.js";
import Popup from "../components/Popup.jsx";

export default function Account() {

    const {logout, setSession} = useAuth();
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [allTags, setAllTags] = useState([]);
    const [initialPreferenceIds, setInitialPreferenceIds] = useState([]);
    const [preferenceIds, setPreferenceIds] = useState([]);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);

    const [isDraggingFile, setIsDraggingFile] = useState(false);

    const [isDeleteAccountPopupOpen, setIsDeleteAccountPopupOpen] = useState(false);

    const linkError = searchParams.get("error");

    const loadUser = async () => {
        const me = await userApi.getMe();
        setUser(me);
        setUsername(me.username || "");
        setEmail(me.email || "");
        setSession(localStorage.getItem("token"), me);
        return me;
    }

    // Comes back from the /auth/google/link redirect with a fresh token.
    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) return;

        (async () => {
            try {
                localStorage.setItem("token", token);
                const me = await userApi.getMe();
                setSession(token, me);
            } catch (error) {
                console.log(error);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            await loadUser();
        })();

        (async () => {
            try {
                setAllTags(await tagApi.getAll() || []);
            } catch (error) {
                console.log(error);
            }
        })();

        (async () => {
            try {
                const preferences = await userApi.getPreferences();
                const ids = (preferences || []).map((tag) => tag.id);
                setInitialPreferenceIds(ids);
                setPreferenceIds(ids);
            } catch (error) {
                console.log(error);
            }
        })();
    }, []);

    const hasChanged = username !== (user?.username || "")
        || email !== (user?.email || "")
        || password !== ""
        || confirmPassword !== "";

    const preferencesChanged = JSON.stringify([...preferenceIds].sort())
        !== JSON.stringify([...initialPreferenceIds].sort());

    const handleTogglePreference = (tagId) => {
        setPreferenceIds((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
    }

    const handleSubmitIdentifiants = async () => {
        if (!hasChanged || isSubmitting) return;
        if (password !== confirmPassword) return;

        setIsSubmitting(true);
        try {
            const updates = {};
            if (username !== user?.username) updates.username = username;
            if (email !== user?.email) updates.email = email;
            if (password !== "") updates.password = password;

            await userApi.update(updates);
            setPassword("");
            setConfirmPassword("");
            await loadUser();
        } catch (error) {
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleSavePreferences = async () => {
        if (!preferencesChanged || isSavingPreferences) return;

        setIsSavingPreferences(true);
        try {
            await userApi.updatePreferences(preferenceIds);
            setInitialPreferenceIds(preferenceIds);
        } catch (error) {
            console.log(error);
        } finally {
            setIsSavingPreferences(false);
        }
    }

    const handleLinkGoogle = () => {
        if (user?.googleLinked) return;
        window.location.href = userApi.googleLinkUrl();
    }

    const handleExport = async () => {
        try {
            const data = await userApi.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "supmeal-export.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.log(error);
        }
    }

    const handleImportFile = async (file) => {
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await userApi.importData(data);
            alert("Import réussi !");
        } catch (error) {
            console.log(error);
            alert("Le fichier importé est invalide.");
        }
    }

    const handleDeleteAccount = async () => {
        if (!window.confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return;
        try {
            await userApi.remove();
            logout();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div>
            <div className={"flex justify-between"}>
                <div>
                    <h1 className={"text-black text-5xl font-bold font-primary"} >Mon compte</h1>
                    <p className={"text-neutral-400 text-sm font-normal mt-3 italic"} >Modifie ici tes identifiants, ton mot de passe et paramètre tes préférences culinaires !</p>
                </div>
                <Button text={"Se déconnecter"} trailing={<Power />} variant={"ghost"} onClick={logout} />
            </div>

            <div className={"mt-9 flex gap-9 items-start"}>

                <div className={"flex flex-col gap-9 w-[34%]"}>
                    <div className={"shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] w-full p-[42px] rounded-[20px] flex flex-col gap-6"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Modifier mes identifiants</h2>

                        <Input placeholder={ user?.username || "Nom d'utilisateur"} value={username} onChange={(e) => setUsername(e.target.value)} />
                        <Input placeholder={user?.email || "Adresse e-mail"} value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Input placeholder={"Nouveau mot de passe"} type={"password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Input placeholder={"Confirmer le nouveau mot de passe"} type={"password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                        <DisabledButton disabled={!hasChanged || isSubmitting} text={"Appliquer les modifications"} variant={"primary"} onClick={handleSubmitIdentifiants} />
                    </div>

                    <div className={"shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] w-full p-[42px] rounded-[20px] flex flex-col gap-4"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Compte lié</h2>

                        <div className={"flex items-center justify-between"}>
                            <div className={"flex items-center gap-8"}>
                                <img src={googleLogo} alt="Google" className={"w-12 h-12"} />
                                <p className={"text-[#9C9C9C] text-2xl font-bold"} >Google</p>
                            </div>

                            <button
                                onClick={handleLinkGoogle}
                                disabled={user?.googleLinked}
                                className={`rounded-[10px] px-6 py-3.5 text-[20px] font-bold text-white ${user?.googleLinked ? "bg-[#9C9C9C] cursor-default" : "bg-[#6EA8FE] cursor-pointer"}`}
                            >
                                {user?.googleLinked ? "Lié" : "Lier"}
                            </button>
                        </div>

                        {linkError && <p className={"text-[#FF5757] text-sm"} >{linkError}</p>}
                    </div>
                </div>

                <div className={"flex flex-col gap-9 flex-1"}>
                    <div className={"shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] w-full p-[42px] rounded-[20px] flex flex-col gap-6"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Mes préférences culinaires</h2>

                        <TagCategoryList
                            tags={allTags}
                            isSelected={(tag) => preferenceIds.includes(tag.id)}
                            onToggle={(tag) => handleTogglePreference(tag.id)}
                        />

                        <div className={"flex justify-end"}>
                            <DisabledButton
                                disabled={!preferencesChanged || isSavingPreferences}
                                text={"Enregistrer mes préférences"}
                                variant={"primary"}
                                onClick={handleSavePreferences}
                            />
                        </div>
                    </div>

                    <div className={"shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] w-full p-[42px] rounded-[20px] flex gap-9"} >
                        <div className={"flex-1 flex flex-col gap-4"}>
                            <h2 className={"text-black text-2xl font-bold font-primary"} >Importer mes données</h2>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {e.preventDefault(); setIsDraggingFile(true);}}
                                onDragLeave={() => setIsDraggingFile(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDraggingFile(false);
                                    handleImportFile(e.dataTransfer.files?.[0]);
                                }}
                                className={`w-full max-w-[341px] h-[93px] border-2 border-dashed rounded-[10px] flex items-center gap-4 px-6 cursor-pointer ${isDraggingFile ? "border-[#6EA8FE] bg-[#E8F1FF]" : "border-[#9C9C9C]"}`}
                            >
                                <Cloud color={"#9C9C9C"} width={32} height={32} className={"shrink-0"} />
                                <div>
                                    <p className={"text-black text-sm font-bold"} >Déposer ou charger un fichier</p>
                                    <p className={"text-[#9C9C9C] text-sm"} >Format JSON</p>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type={"file"}
                                accept={"application/json"}
                                className={"hidden"}
                                onChange={(e) => handleImportFile(e.target.files?.[0])}
                            />
                        </div>

                        <div className={"flex-1 flex flex-col gap-4"}>
                            <h2 className={"text-black text-2xl font-bold font-primary"} >Exporter mes recettes et cookbooks</h2>

                            <button
                                onClick={handleExport}
                                className={"self-start rounded-[10px] px-6 py-3.5 text-[20px] font-bold text-white bg-[#6EA8FE] cursor-pointer"}
                            >
                                Exporter au format JSON
                            </button>
                        </div>
                    </div>

                    <div className={"text-neutral-400 text-sm flex gap-16"} >
                        <p className={"italic"}>Tu as le droit de demander la suppression de tes données personnelles à tout moment. Clique sur « Supprimer le compte » pour supprimer ton compte et les données qui y sont associées.
                            Une confirmation te sera demandée avant de poursuivre cette action.</p>
                        <button
                            onClick={() => setIsDeleteAccountPopupOpen(true)}
                            className={"self-end rounded-[10px] min-w-fit px-6 py-3.5 text-[20px] font-bold text-white bg-[#FF5757] cursor-pointer"}
                        >
                            Supprimer le compte
                        </button>
                    </div>
                </div>

            </div>

            <Popup isOpen={isDeleteAccountPopupOpen} onClose={() => setIsDeleteAccountPopupOpen(false)}>
                <h2 className="text-xl font-bold mb-4 text-center">Supprimer mon compte ?</h2>
                <p className={"text-neutral-400 text-base font-normal"}>
                    Es-tu sûr(e) de toi ? <br/>
                    La suppression de ton compte est définitive. <br/>
                    Tes données personnelles, recettes, cookbooks et informations associées seront définitivement supprimées et ne pourront pas être récupérées. <br/> <br/>

                    Clique sur « Supprimer mon compte » pour confirmer.
                </p>
                <div className={"flex justify-center gap-8 mt-8"}>
                    <Button text={"Annuler"} variant={"blue"} onClick={() => setIsDeleteAccountPopupOpen(false)} />
                    <button className={"bg-[#FF5757] rounded-[10px] px-4 py-[7px] flex items-center justify-center gap-2 text-center text-[20px] font-[700] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"} onClick={handleDeleteAccount} disabled={false} >
                        {"Supprimer mon compte"}
                    </button>
                </div>
            </Popup>

        </div>
    )

}
