import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import DisabledButton from "../components/ui/DisabledButton.jsx";
import DurationTag from "../components/ui/DurationTag.jsx";
import Button from "../components/ui/Button.jsx";
import {ImagePlus, X, Search, ChevronRight, Plus} from "@boxicons/react";
import cookbookApi from "../api/cookbook.js";
import recipeApi from "../api/recipe.js";
import userApi from "../api/user.js";
import {BASE_URL} from "../api/client.js";
import {useAlert} from "../context/AlertContext.jsx";

const ROLE_LABELS = {
    viewer: "Lecteur",
    editor: "Éditeur",
};

export default function CreateCookbook() {

    const navigate = useNavigate();
    const {showSuccess, showError} = useAlert();
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);

    const [userRecipes, setUserRecipes] = useState([]);
    const [recipeSearch, setRecipeSearch] = useState("");
    const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);

    const [members, setMembers] = useState([]);
    const [memberEmail, setMemberEmail] = useState("");
    const [memberRole, setMemberRole] = useState("viewer");
    const [memberError, setMemberError] = useState(null);
    const [isLookingUpMember, setIsLookingUpMember] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValid = title.trim() !== "";

    useEffect(() => {
        (async () => {
            try {
                setUserRecipes(await recipeApi.getUserRecipes() || []);
            } catch (error) {
                console.log(error);
            }
        })();
    }, []);

    const handleSelectImage = (file) => {
        if (!file) return;
        setImageFile(file);
        setImagePreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    const selectedRecipes = selectedRecipeIds
        .map((id) => userRecipes.find((recipe) => recipe.id === id))
        .filter(Boolean);

    const recipeSearchResults = recipeSearch.trim() === ""
        ? []
        : userRecipes.filter((recipe) =>
            !selectedRecipeIds.includes(recipe.id)
            && recipe.title.toLowerCase().includes(recipeSearch.trim().toLowerCase())
        );

    const handleAddRecipe = (recipeId) => {
        setSelectedRecipeIds((prev) => [...prev, recipeId]);
        setRecipeSearch("");
    };

    const handleRemoveRecipe = (recipeId) => {
        setSelectedRecipeIds((prev) => prev.filter((id) => id !== recipeId));
    };

    const handleAddMember = async () => {
        const email = memberEmail.trim();
        if (!email || isLookingUpMember) return;

        setIsLookingUpMember(true);
        setMemberError(null);
        try {
            const user = await userApi.lookupByEmail(email);
            if (members.some((member) => member.userId === user.id)) {
                setMemberError("Ce membre a déjà été ajouté.");
                return;
            }
            setMembers((prev) => [...prev, {userId: user.id, username: user.username, role: memberRole}]);
            setMemberEmail("");
        } catch (error) {
            console.log(error);
            setMemberError("Aucun utilisateur trouvé avec cette adresse e-mail.");
        } finally {
            setIsLookingUpMember(false);
        }
    };

    const handleRemoveMember = (userId) => {
        setMembers((prev) => prev.filter((member) => member.userId !== userId));
    };

    const handleSubmit = async () => {
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const cookbook = await cookbookApi.create({title: title.trim(), description: description.trim(), imageFile});

            for (const recipeId of selectedRecipeIds) {
                await cookbookApi.addRecipe(cookbook.id, recipeId);
            }

            for (const member of members) {
                await cookbookApi.addMember(cookbook.id, member.userId, member.role);
            }

            showSuccess("Cookbook créé avec succès !");
            navigate("/cookbooks");
        } catch (error) {
            console.log(error);
            showError(error.message || "Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <Breadcrumb path={[{ label: "Accueil", link: "/dashboard" }, { label: "Cookbooks", link: "/cookbooks" }, { label: "Créer un cookbook", link: "/cookbooks/create" }]} />

            <div className={"flex gap-15 mt-[38px]"} >

                <div className={"w-[56%]"}>

                    <div className={"py-4.5 px-12 bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={"Nom du cookbook"}
                            className={"text-black text-3xl font-bold font-primary text-center w-full focus:outline-none placeholder:text-[#9C9C9C]"}
                        />
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={"Description"}
                            className={"text-[#9C9C9C] text-center text-base font-normal mt-[15px] w-full focus:outline-none"}
                        />
                    </div>

                    <div className={"relative mt-[38px]"}>
                        <div className={"bg-[#F2F2F2] flex items-center justify-between px-4 py-2.5 rounded-[10px]"}>
                            <input
                                value={recipeSearch}
                                onChange={(e) => setRecipeSearch(e.target.value)}
                                placeholder={"Rechercher une recette"}
                                className={"bg-transparent flex-1 text-black text-xl focus:outline-none placeholder:text-[#9C9C9C]"}
                            />
                            <Search color={"#9C9C9C"} width={24} height={24} />
                        </div>

                        {recipeSearchResults.length > 0 && (
                            <div className={"absolute z-10 left-0 right-0 bg-white rounded-[10px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-2 max-h-[220px] overflow-y-auto"}>
                                {recipeSearchResults.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        onClick={() => handleAddRecipe(recipe.id)}
                                        className={"px-4 py-2.5 hover:bg-[#F5F5F5] cursor-pointer"}
                                    >
                                        {recipe.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={"flex flex-wrap gap-[30px] mt-[30px]"}>
                        {selectedRecipes.map((recipe) => (
                            <div key={recipe.id} className={"relative w-[200px] flex flex-col rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] p-1"}>
                                <button
                                    onClick={() => handleRemoveRecipe(recipe.id)}
                                    className={"absolute top-2.5 right-2.5 bg-[#FF5757] text-white rounded-md p-0.5 cursor-pointer z-10"}
                                >
                                    <X size={16} />
                                </button>

                                <img
                                    src={recipe.image_url ? BASE_URL + recipe.image_url : "https://placehold.co/200x200"}
                                    className={"w-full aspect-square rounded-[18px] object-cover"}
                                    alt=""
                                />

                                <div className={"flex flex-col flex-1 py-3 px-2.5 gap-1"}>
                                    <h3 className={"text-black text-base font-bold line-clamp-1"}>{recipe.title}</h3>
                                    <p className={"text-[#9C9C9C] text-sm line-clamp-3"}>{recipe.description}</p>

                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                <div className={"flex-1"} >

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {e.preventDefault(); setIsDraggingImage(true);}}
                        onDragLeave={() => setIsDraggingImage(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingImage(false);
                            handleSelectImage(e.dataTransfer.files?.[0]);
                        }}
                        className={`relative w-full aspect-650/340 rounded-[20px] overflow-hidden shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] bg-[#D9D9D9] flex items-center justify-center cursor-pointer border-3 border-solid ${isDraggingImage ? "border-[#6EA8FE]" : "border-white"}`}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} className={"w-full h-full object-cover"} alt="" />
                        ) : (
                            <div className={"flex flex-col items-center gap-2 px-4"}>
                                <ImagePlus color={"#9C9C9C"} width={64} height={64} />
                                <p className={"text-[#9C9C9C] text-xl font-bold text-center"} >Importer une image</p>
                                <p className={"text-[#9C9C9C] text-sm text-center"} >formats acceptés : .jpeg, .jpg, .png, .webp</p>
                            </div>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type={"file"}
                        accept={"image/jpeg,image/png,image/webp"}
                        className={"hidden"}
                        onChange={(e) => handleSelectImage(e.target.files?.[0])}
                    />

                    <div className={"px-10 py-10 bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[37px] flex flex-col gap-7"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Invite des membres à rejoindre ton cookbook !</h2>

                        <div className={"flex flex-col gap-2.5"}>
                            {members.map((member) => (
                                <div key={member.userId} className={"group flex items-center justify-between px-4 py-2 rounded-[10px] bg-[#F2F2F2]"}>
                                    <p className={"text-black text-base"}>{member.username}</p>
                                    <div className={"flex items-center gap-3"}>
                                        <div className={"bg-[#81B970] group-hover:hidden rounded-[10px] px-4 py-1"}>
                                            <p className={"text-[#F2F2F2] text-base"}>{ROLE_LABELS[member.role]}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            className={"hidden group-hover:flex bg-[#FF5757] text-white rounded-md p-0.5 cursor-pointer"}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className={"flex items-center gap-3 bg-[#F2F2F2] rounded-[10px] px-4 py-1.5"}>
                                <input
                                    value={memberEmail}
                                    onChange={(e) => { setMemberEmail(e.target.value); setMemberError(null); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                                    placeholder={"ajoute une adresse mail"}
                                    className={"flex-1 bg-transparent text-black text-base focus:outline-none placeholder:text-[#9C9C9C]"}
                                />
                                <select
                                    value={memberRole}
                                    onChange={(e) => setMemberRole(e.target.value)}
                                    className={"bg-[#9C9C9C] text-[#F2F2F2] text-base rounded-[10px] px-3 py-1 cursor-pointer focus:outline-none"}
                                >
                                    <option value={"viewer"}>Lecteur</option>
                                    <option value={"editor"}>Éditeur</option>
                                </select>
                                <button onClick={handleAddMember} disabled={isLookingUpMember} className={"shrink-0 disabled:opacity-60 cursor-pointer"}>
                                    <Plus color={"#9C9C9C"} width={24} height={24} />
                                </button>
                            </div>

                            {memberError && <p className={"text-[#FF5757] text-sm"}>{memberError}</p>}
                        </div>
                    </div>

                    <div className={"flex justify-end mt-[37px]"}>
                        <DisabledButton disabled={!isValid || isSubmitting} text={isSubmitting ? "Création..." : "Créer le cookbook"} variant={"primary"} onClick={handleSubmit} />
                    </div>

                </div>

            </div>

        </div>
    )
}
