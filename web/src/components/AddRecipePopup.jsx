import Popup from "./Popup.jsx";
import Input from "./ui/Input.jsx";
import DisabledButton from "./ui/DisabledButton.jsx";
import Button from "./ui/Button.jsx";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import recipeApi from "../api/recipe.js";
import {useAlert} from "../context/AlertContext.jsx";

export default function AddRecipePopup({isOpen, onClose}) {

    const [url, setUrl] = useState("");
    const [isUrlEntered, setIsUrlEntered] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState(null);

    const navigate = useNavigate();
    const {showSuccess, showError} = useAlert();

    const handleClose = () => {
        onClose();
        setUrl("");
        setIsUrlEntered(false);
        setImportError(null);
    };

    const handleImportRecipe = async () => {
        if (!isUrlEntered || isImporting) return;

        setIsImporting(true);
        setImportError(null);
        try {
            const recipe = await recipeApi.importFromUrl(url);
            showSuccess("Recette importée avec succès !");
            navigate(`/recipe/${recipe.id}`);
        } catch (error) {
            console.log(error);
            const message = error.message || "Impossible d'importer cette recette.";
            setImportError(message);
            showError(message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Popup isOpen={isOpen} onClose={handleClose}>
            <h2 className="text-xl font-bold mb-4 text-center">Une nouvelle recette à ajouter ? C'est par ici !</h2>
            <div className={"flex gap-9.5"}>
                <Input
                    placeholder="Lien marmiton..."
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value)
                        setImportError(null)
                        setIsUrlEntered(e.target.value !== "")
                    }}
                />
                <DisabledButton text={isImporting ? "Import..." : "Importer la recette"} disabled={!isUrlEntered || isImporting} onClick={handleImportRecipe}></DisabledButton>
            </div>

            {importError && <p className={"text-[#FF5757] text-sm mt-2"} >{importError}</p>}

            <div className={"flex items-center gap-9.5 mt-[26px]"} >
                <div className={"flex-1 h-[1px] bg-[#9B9B9B]"}></div>
                <p className={"text-[#9B9B9B] text-2xl"} > OU </p>
                <div className={"flex-1 h-[1px] bg-[#9B9B9B]"}></div>
            </div>

            <div className={"mt-[26px]"}>
                <Button text={"Créer ma propre recette"} variant={"blue"} onClick={() => navigate("/create-recipe")} />
            </div>
        </Popup>
    )

}
