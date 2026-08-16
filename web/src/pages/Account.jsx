import Button from "../components/ui/Button.jsx";
import { Power } from "@boxicons/react"

export default function Account() {

    return (
        <div>
            <div className={"flex justify-between"}>
                <div>
                    <h1 className={"text-black text-5xl font-bold font-primary"} >Mon compte</h1>
                    <p className={"text-neutral-400 text-sm font-normal mt-3 italic"} >Modifie ici tes identifiants, ton mot de passe et paramètre tes préférences culinaires !</p>
                </div>
                <Button text={"Se déconnecter"} trailing={<Power />} variant={"ghost"} />
            </div>
        </div>
    )

}