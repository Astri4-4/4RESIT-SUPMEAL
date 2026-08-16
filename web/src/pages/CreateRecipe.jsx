import {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import Tag from "../components/ui/Tag.jsx";
import DisabledButton from "../components/ui/DisabledButton.jsx";
import {ChefHat, Oven, ForkKnife, ImagePlus, X} from "@boxicons/react";
import recipeApi from "../api/recipe.js";
import {BASE_URL} from "../api/client.js";

export default function CreateRecipe() {

    const navigate = useNavigate();
    const {id} = useParams();
    const isEditMode = !!id;
    const fileInputRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(!isEditMode);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [cookTime, setCookTime] = useState("");
    const [servings, setServings] = useState("");

    const [steps, setSteps] = useState([""]);
    const [ingredients, setIngredients] = useState([{quantity: "", unit: "", name: ""}]);

    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState([]);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValid = title.trim() !== "" && prepTime !== "" && servings !== "";

    useEffect(() => {
        if (!isEditMode) return;

        (async () => {
            try {
                const recipe = await recipeApi.getRecipe(id);
                setTitle(recipe.title || "");
                setDescription(recipe.description || "");
                setPrepTime(String(recipe.preptime ?? ""));
                setCookTime(String(recipe.cooktime ?? ""));
                setServings(String(recipe.servings ?? ""));
                setSteps([...(recipe.steps || []).map((step) => step.description), ""]);
                setIngredients([
                    ...(recipe.ingredients || []).map((ingredient) => ({
                        quantity: Number(ingredient.quantity) > 0 ? String(ingredient.quantity) : "",
                        unit: ingredient.unit || "",
                        name: ingredient.name,
                    })),
                    {quantity: "", unit: "", name: ""},
                ]);
                setTags((recipe.tags || []).map((tag) => tag.name));
                if (recipe.image_url) setImagePreview(BASE_URL + recipe.image_url);
            } catch (error) {
                console.log(error);
            } finally {
                setIsLoaded(true);
            }
        })();
    }, [id]);

    const handleStepChange = (index, value) => {
        setSteps((prev) => {
            const next = [...prev];
            next[index] = value;
            if (index === next.length - 1 && value !== "") {
                next.push("");
            }
            return next;
        });
    };

    const handleRemoveStep = (index) => {
        setSteps((prev) => prev.filter((_, i) => i !== index));
    };

    const handleIngredientChange = (index, field, value) => {
        setIngredients((prev) => {
            const next = prev.map((ingredient, i) => i === index ? {...ingredient, [field]: value} : ingredient);
            const last = next[next.length - 1];
            if (index === next.length - 1 && (last.name !== "" || last.quantity !== "")) {
                next.push({quantity: "", unit: "", name: ""});
            }
            return next;
        });
    };

    const handleRemoveIngredient = (index) => {
        setIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddTag = () => {
        const value = tagInput.trim();
        setTagInput("");
        if (!value || tags.includes(value)) return;
        setTags((prev) => [...prev, value]);
    };

    const handleTagKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleRemoveTag = (value) => {
        setTags((prev) => prev.filter((tag) => tag !== value));
    };

    const handleSelectImage = (file) => {
        if (!file) return;
        setImageFile(file);
        setImagePreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    const handleSubmit = async () => {
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const cleanedSteps = steps.map((step) => step.trim()).filter((step) => step !== "");
            const cleanedIngredients = ingredients
                .filter((ingredient) => ingredient.name.trim() !== "")
                .map((ingredient) => {
                    const payload = {
                        name: ingredient.name.trim(),
                        quantity: parseFloat(ingredient.quantity) || 0,
                    };
                    if (ingredient.unit.trim() !== "") payload.unit = ingredient.unit.trim();
                    return payload;
                });

            const payload = {
                title: title.trim(),
                description: description.trim(),
                prepTime: parseInt(prepTime, 10),
                cookTime: cookTime === "" ? 0 : parseInt(cookTime, 10),
                servings: parseInt(servings, 10),
                ingredients: cleanedIngredients,
                steps: cleanedSteps.map((stepDescription, index) => ({step_number: index + 1, description: stepDescription})),
            };

            let recipeId;
            if (isEditMode) {
                payload.tags = tags;
                await recipeApi.updateRecipe(id, payload);
                recipeId = id;
            } else {
                const created = await recipeApi.createRecipe(payload);
                recipeId = created.id;
                if (tags.length > 0) {
                    await recipeApi.updateRecipe(recipeId, {tags});
                }
            }

            if (imageFile) {
                await recipeApi.uploadImage(recipeId, imageFile);
            }

            navigate(`/recipe/${recipeId}`);
        } catch (error) {
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isEditMode && !isLoaded) {
        return <div>Chargement...</div>;
    }

    return (
        <div>
            <Breadcrumb path={[{ label: "Accueil", link: "/dashboard" }, { label: "Recettes", link: "/recipes" }, { label: isEditMode ? "Modifier la recette" : "Créer une recette", link: "/create-recipe" }]} />

            <div className={"flex gap-15 mt-[38px]"} >

                <div className={"w-[56%]"}>

                    <div className={"py-4.5 px-12 bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={"Titre de la recette"}
                            className={"text-black text-3xl font-bold font-primary text-center w-full focus:outline-none placeholder:text-[#9C9C9C]"}
                        />

                        <div className={"flex items-center justify-center gap-4 h-11 mt-[15px]"}>
                            <ChefHat color={"#FFB857"} width={24} height={24} />
                            <div className={"flex items-center gap-1"}>
                                <span>Temps de préparation :</span>
                                <input type={"number"} min={0} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder={"-"} className={"w-12 text-center border-b border-transparent focus:border-[#9C9C9C] focus:outline-none"} />
                                <span>min</span>
                            </div>
                            <div className={"border-r border-black h-full w-4"} ></div>
                            <Oven color={"#FFB857"}/>
                            <div className={"flex items-center gap-1"}>
                                <span>Temps de cuisson :</span>
                                <input type={"number"} min={0} value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder={"-"} className={"w-12 text-center border-b border-transparent focus:border-[#9C9C9C] focus:outline-none"} />
                                <span>min</span>
                            </div>
                            <div className={"border-r border-black h-full w-4"} ></div>
                            <ForkKnife color={"#FFB857"}/>
                            <div className={"flex items-center gap-1"}>
                                <input type={"number"} min={1} value={servings} onChange={(e) => setServings(e.target.value)} placeholder={"-"} className={"w-12 text-center border-b border-transparent focus:border-[#9C9C9C] focus:outline-none"} />
                                <span>personne{(servings > 1) ? 's' : ''}</span>
                            </div>
                        </div>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={"Description"}
                            rows={2}
                            className={"text-[#9C9C9C] text-center text-base font-normal mt-[15px] w-full resize-none focus:outline-none"}
                        />
                    </div>

                    <div className={"px-[42px] py-[18px] bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[38px]"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Étapes de la préparation</h2>

                        <ol className={"list-none"} >
                            {
                                steps.map((step, index) => {
                                    const isLast = index === steps.length - 1;
                                    return (
                                        <li key={index} className={"flex items-center gap-4 mt-6 group"} >
                                            <p className={`text-2xl font-bold font-primary text-right shrink-0 w-[2ch] ${step === "" ? "text-[#9C9C9C]" : "text-amber-300"}`} >{index + 1}</p>
                                            <input
                                                value={step}
                                                onChange={(e) => handleStepChange(index, e.target.value)}
                                                placeholder={"Ajouter une étape"}
                                                className={"flex-1 text-black text-base font-normal focus:outline-none border-b border-transparent focus:border-[#9C9C9C]"}
                                            />
                                            {!isLast && (
                                                <button onClick={() => handleRemoveStep(index)} className={"opacity-0 group-hover:opacity-100 transition shrink-0"} >
                                                    <X color={"#9C9C9C"} width={18} height={18} />
                                                </button>
                                            )}
                                        </li>
                                    );
                                })
                            }
                        </ol>
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

                    <div className={"flex flex-wrap gap-2 items-center bg-[#F2F2F2] border border-[#9C9C9C] rounded-[10px] px-4 py-2.5 mt-[37px]"} >
                        {tags.map((tag, index) => (
                            <Tag key={tag} text={tag} colorIndex={index} onClick={() => handleRemoveTag(tag)} title={"Cliquer pour retirer"} />
                        ))}
                        <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={handleAddTag}
                            placeholder={"Ajouter des tags"}
                            className={"flex-1 min-w-[120px] bg-transparent focus:outline-none placeholder:text-[#9C9C9C]"}
                        />
                    </div>

                    <div className={"px-[42px] py-[18px] bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[37px]"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Ingrédients</h2>

                        <ul className={"mt-4 flex flex-col gap-3"}>
                            {
                                ingredients.map((ingredient, index) => {
                                    const isLast = index === ingredients.length - 1;
                                    const isEmpty = ingredient.name === "" && ingredient.quantity === "";
                                    return (
                                        <li key={index} className={"flex items-center gap-2 group"} >
                                            <div className={`h-5 aspect-square rounded-full shrink-0 ${isEmpty ? "border border-[#9C9C9C]" : "bg-[#FFB857AA]"}`} ></div>
                                            <input type={"number"} min={0} value={ingredient.quantity} onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)} placeholder={"Qté"} className={"w-12 text-black text-base focus:outline-none border-b border-transparent focus:border-[#9C9C9C]"} />
                                            <input value={ingredient.unit} onChange={(e) => handleIngredientChange(index, "unit", e.target.value)} placeholder={"Unité"} className={"w-16 text-black text-base focus:outline-none border-b border-transparent focus:border-[#9C9C9C]"} />
                                            <input value={ingredient.name} onChange={(e) => handleIngredientChange(index, "name", e.target.value)} placeholder={"Ajouter un ingrédient"} className={"flex-1 text-black text-base font-normal focus:outline-none border-b border-transparent focus:border-[#9C9C9C]"} />
                                            {!isLast && (
                                                <button onClick={() => handleRemoveIngredient(index)} className={"opacity-0 group-hover:opacity-100 transition shrink-0"} >
                                                    <X color={"#9C9C9C"} width={16} height={16} />
                                                </button>
                                            )}
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </div>

                    <div className={"flex justify-end mt-[37px]"}>
                        <DisabledButton disabled={!isValid || isSubmitting} text={isEditMode ? "Enregistrer les modifications" : "Créer la recette"} variant={"primary"} onClick={handleSubmit} />
                    </div>

                </div>

            </div>

        </div>
    )
}
