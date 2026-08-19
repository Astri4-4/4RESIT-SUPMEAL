import {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import DurationTag from "../components/ui/DurationTag.jsx";
import Button from "../components/ui/Button.jsx";
import DisabledButton from "../components/ui/DisabledButton.jsx";
import {ImagePlus, ChevronRight, Search, X, Plus} from "@boxicons/react";
import cookbookApi from "../api/cookbook.js";
import recipeApi from "../api/recipe.js";
import userApi from "../api/user.js";
import {BASE_URL} from "../api/client.js";
import {useAuth} from "../context/AuthContext.jsx";
import {useAlert} from "../context/AlertContext.jsx";

const ROLE_LABELS = {
    owner: "Créateur",
    editor: "Éditeur",
    viewer: "Lecteur",
};

const ROLE_COLORS = {
    owner: "#FF9191",
    editor: "#6EA8FE",
    viewer: "#81B970",
};

export default function Cookbook() {

    const {id} = useParams();
    const navigate = useNavigate();
    const {user} = useAuth();
    const {showSuccess, showError} = useAlert();
    const fileInputRef = useRef(null);

    const [cookbook, setCookbook] = useState(null);
    const [recipes, setRecipes] = useState([]);

    const [userRecipes, setUserRecipes] = useState([]);
    const [recipeSearch, setRecipeSearch] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [inviteError, setInviteError] = useState(null);
    const [isInviting, setIsInviting] = useState(false);

    const loadCookbook = async () => {
        try {
            const [cookbookData, recipesData] = await Promise.all([
                cookbookApi.getCookbook(id),
                cookbookApi.getCookbookRecipes(id),
            ]);
            setCookbook(cookbookData);
            setRecipes(recipesData || []);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        loadCookbook();
    }, [id]);

    useEffect(() => {
        (async () => {
            try {
                setUserRecipes(await recipeApi.getUserRecipes() || []);
            } catch (error) {
                console.log(error);
            }
        })();
    }, []);

    const handleAddRecipe = async (recipeId) => {
        try {
            await cookbookApi.addRecipe(id, recipeId);
            setRecipeSearch("");
            showSuccess("Recette ajoutée au cookbook !");
            await loadCookbook();
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible d'ajouter cette recette.");
        }
    };

    const handleRemoveRecipe = async (recipeId) => {
        try {
            await cookbookApi.removeRecipe(id, recipeId);
            showSuccess("Recette retirée du cookbook.");
            await loadCookbook();
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de retirer cette recette.");
        }
    };

    const handleChangeRole = async (userId, role) => {
        try {
            await cookbookApi.changeRole(id, userId, role);
            showSuccess("Rôle mis à jour !");
            await loadCookbook();
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de mettre à jour ce rôle.");
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Exclure ce membre du cookbook ?")) return;

        try {
            await cookbookApi.removeMember(id, userId);
            showSuccess("Membre exclu du cookbook.");
            await loadCookbook();
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible d'exclure ce membre.");
        }
    };

    const handleStartEditing = () => {
        setTitle(cookbook.title || "");
        setDescription(cookbook.description || "");
        setImageFile(null);
        setImagePreview(cookbook.image_url ? BASE_URL + cookbook.image_url : null);
        setInviteEmail("");
        setInviteRole("viewer");
        setInviteError(null);
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleInviteMember = async () => {
        const email = inviteEmail.trim();
        if (!email || isInviting) return;

        setIsInviting(true);
        setInviteError(null);
        try {
            const foundUser = await userApi.lookupByEmail(email);
            if (members.some((member) => member.id === foundUser.id)) {
                setInviteError("Ce membre fait déjà partie du cookbook.");
                showError("Ce membre fait déjà partie du cookbook.");
                return;
            }
            await cookbookApi.addMember(id, foundUser.id, inviteRole);
            setInviteEmail("");
            showSuccess("Membre ajouté au cookbook !");
            await loadCookbook();
        } catch (error) {
            console.log(error);
            const message = "Aucun utilisateur trouvé avec cette adresse e-mail.";
            setInviteError(message);
            showError(message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleSelectImage = (file) => {
        if (!file) return;
        setImageFile(file);
        setImagePreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    const handleSave = async () => {
        if (title.trim() === "" || isSaving) return;

        setIsSaving(true);
        try {
            await cookbookApi.update(id, {title: title.trim(), description: description.trim(), imageFile});
            showSuccess("Cookbook modifié avec succès !");
            await loadCookbook();
            setIsEditing(false);
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de modifier ce cookbook.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Supprimer définitivement ce cookbook ? Cette action est irréversible.")) return;

        setIsDeleting(true);
        try {
            await cookbookApi.remove(id);
            showSuccess("Cookbook supprimé.");
            navigate("/cookbooks");
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de supprimer ce cookbook.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!cookbook) {
        return <div>Chargement...</div>;
    }

    const members = cookbook.members || [];
    const owner = members.find((member) => member.role === "owner");
    const isOwner = owner && user && owner.id === user.id;
    const myRole = members.find((member) => member.id === user?.id)?.role;
    const canEditRecipes = myRole === "owner" || myRole === "editor";

    const trimmedSearch = recipeSearch.trim().toLowerCase();
    const matchingCookbookRecipes = trimmedSearch === ""
        ? recipes
        : recipes.filter((recipe) => recipe.title.toLowerCase().includes(trimmedSearch));
    const matchingOutsideRecipes = (trimmedSearch !== "" && canEditRecipes)
        ? userRecipes.filter((recipe) =>
            !recipes.some((r) => r.id === recipe.id)
            && recipe.title.toLowerCase().includes(trimmedSearch)
        )
        : [];
    const displayedRecipes = [
        ...matchingCookbookRecipes.map((recipe) => ({recipe, inCookbook: true})),
        ...matchingOutsideRecipes.map((recipe) => ({recipe, inCookbook: false})),
    ];

    return (
        <div>
            <div className={"flex items-start justify-between"}>
                <Breadcrumb path={[{ label: "Accueil", link: "/dashboard" }, { label: "Cookbooks", link: "/cookbooks" }, { label: `Cookbook: ${cookbook.title}`, link: `/cookbooks/${id}` }]} />
                {owner && <p className={"text-[#9C9C9C] text-sm"}>Cookbook créé par {owner.username}</p>}
            </div>

            <div className={"flex gap-15 mt-[38px]"} >

                <div className={"w-[56%]"}>

                    <div className={"py-4.5 px-12 bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                        {isEditing ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <h1 className={"text-black text-3xl font-bold font-primary text-center"}>{cookbook.title}</h1>
                                {cookbook.description && (
                                    <p className={"text-[#9C9C9C] text-center text-base font-normal mt-[15px]"}>{cookbook.description}</p>
                                )}
                            </>
                        )}
                    </div>

                    <div className={"bg-[#F2F2F2] flex items-center justify-between px-4 py-2.5 rounded-[10px] mt-[38px]"}>
                        <input
                            value={recipeSearch}
                            onChange={(e) => setRecipeSearch(e.target.value)}
                            placeholder={"Rechercher une recette"}
                            className={"bg-transparent flex-1 text-black text-xl focus:outline-none placeholder:text-[#9C9C9C]"}
                        />
                        <Search color={"#9C9C9C"} width={24} height={24} />
                    </div>

                    <div className={"flex flex-wrap gap-[30px] mt-[30px]"}>
                        {displayedRecipes.map(({recipe, inCookbook}) => (
                            <div key={recipe.id} className={"relative w-[200px] flex flex-col rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] p-1"}>
                                {inCookbook && canEditRecipes && (
                                    <button
                                        onClick={() => handleRemoveRecipe(recipe.id)}
                                        className={"absolute top-2.5 right-2.5 border border-white bg-[#FF5757] text-white rounded-md p-0.5 cursor-pointer z-10"}
                                    >
                                        <X size={16} />
                                    </button>
                                )}

                                <img
                                    src={recipe.image_url ? BASE_URL + recipe.image_url : "https://placehold.co/200x200"}
                                    className={"w-full aspect-square rounded-[18px] object-cover"}
                                    alt=""
                                />

                                <div className={"flex flex-col flex-1 py-3 px-2.5 gap-1"}>
                                    <h3 className={"text-black text-base font-bold line-clamp-1"}>{recipe.title}</h3>
                                    <p className={"text-[#9C9C9C] text-sm line-clamp-3"}>{recipe.description}</p>
                                    <div className={"flex items-center gap-2 mt-auto pt-2"}>
                                        <DurationTag duration={recipe.preptime + recipe.cooktime} />
                                        {inCookbook ? (
                                            <Button variant={"blue"} textSize={"12"} weight={"400"} text={"Voir la recette"} trailing={<ChevronRight width={16} height={16} />} className={"flex-1"} onClick={() => navigate(`/recipe/${recipe.id}`)} />
                                        ) : (
                                            <Button variant={"primary"} textSize={"12"} weight={"400"} text={"Ajouter"} trailing={<Plus width={16} height={16} />} className={"flex-1"} onClick={() => handleAddRecipe(recipe.id)} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {displayedRecipes.length === 0 && (
                            <p className={"text-neutral-400 italic"}>
                                {trimmedSearch === "" ? "Aucune recette dans ce cookbook pour le moment." : "Aucune recette ne correspond à ta recherche."}
                            </p>
                        )}
                    </div>

                </div>

                <div className={"flex-1"} >

                    {isEditing ? (
                        <>
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
                        </>
                    ) : (
                        <div className={"relative w-full aspect-650/340 rounded-[20px] overflow-hidden shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] bg-[#D9D9D9] flex items-center justify-center border-3 border-solid border-white"}>
                            {cookbook.image_url ? (
                                <img src={BASE_URL + cookbook.image_url} className={"w-full h-full object-cover"} alt="" />
                            ) : (
                                <div className={"flex flex-col items-center gap-2 px-4"}>
                                    <ImagePlus color={"#9C9C9C"} width={64} height={64} />
                                    <p className={"text-[#9C9C9C] text-xl font-bold text-center"} >Aucune image</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={"px-10 py-10 bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[37px] flex flex-col gap-7"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >{members.length} membre{members.length > 1 ? "s" : ""} dans ce cookbook !</h2>

                        <div className={"flex flex-col gap-2.5 w-full"}>
                            {members.map((member) => {
                                const canManageMember = isOwner && member.role !== "owner";

                                return (
                                    <div key={member.id} className={"flex items-center justify-between px-4 py-2 rounded-[10px] bg-white"}>
                                        <p className={"text-black text-base"}>{member.username}</p>
                                        <div className={"flex items-center gap-3"}>
                                            {canManageMember ? (
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                                    className={"rounded-[10px] px-3 py-1 text-white text-base cursor-pointer focus:outline-none"}
                                                    style={{backgroundColor: ROLE_COLORS[member.role]}}
                                                >
                                                    <option value={"viewer"}>Lecteur</option>
                                                    <option value={"editor"}>Éditeur</option>
                                                </select>
                                            ) : (
                                                <div className={"rounded-[10px] px-4 py-1"} style={{backgroundColor: ROLE_COLORS[member.role]}}>
                                                    <p className={"text-white text-base"}>{ROLE_LABELS[member.role] || member.role}</p>
                                                </div>
                                            )}

                                            {canManageMember && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className={"bg-[#FF5757] text-white rounded-md p-0.5 cursor-pointer"}
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {isEditing && (
                            <div className={"flex flex-col gap-2.5 w-full"}>
                                <div className={"flex items-center gap-3 bg-[#F2F2F2] rounded-[10px] px-4 py-1.5"}>
                                    <input
                                        value={inviteEmail}
                                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                                        onKeyDown={(e) => e.key === "Enter" && handleInviteMember()}
                                        placeholder={"ajoute une adresse mail"}
                                        className={"flex-1 bg-transparent text-black text-base focus:outline-none placeholder:text-[#9C9C9C]"}
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className={"bg-[#9C9C9C] text-[#F2F2F2] text-base rounded-[10px] px-3 py-1 cursor-pointer focus:outline-none"}
                                    >
                                        <option value={"viewer"}>Lecteur</option>
                                        <option value={"editor"}>Éditeur</option>
                                    </select>
                                    <button onClick={handleInviteMember} disabled={isInviting} className={"shrink-0 disabled:opacity-60 cursor-pointer"}>
                                        <Plus color={"#9C9C9C"} width={24} height={24} />
                                    </button>
                                </div>

                                {inviteError && <p className={"text-[#FF5757] text-sm"}>{inviteError}</p>}
                            </div>
                        )}
                    </div>

                    {isOwner && (
                        <div className={"flex gap-[20px] mt-[37px]"}>
                            {isEditing ? (
                                <>
                                    <DisabledButton disabled={title.trim() === "" || isSaving} text={isSaving ? "Enregistrement..." : "Enregistrer"} variant={"primary"} onClick={handleSave} className={"flex-1"} />
                                    <button
                                        onClick={handleCancelEditing}
                                        disabled={isSaving}
                                        className={"flex-1 border border-black rounded-[10px] px-4 py-[7px] text-[20px] font-[700] text-black cursor-pointer disabled:opacity-60"}
                                    >
                                        Annuler
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleStartEditing}
                                        className={"flex-1 bg-[#FFD498] rounded-[10px] px-4 py-[7px] text-[20px] font-[700] text-black cursor-pointer"}
                                    >
                                        Modifier le cookbook
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className={"flex-1 bg-[#FF5757] rounded-[10px] px-4 py-[7px] text-[20px] font-[700] text-white cursor-pointer disabled:opacity-60"}
                                    >
                                        Supprimer le cookbook
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                </div>

            </div>

        </div>
    )
}
