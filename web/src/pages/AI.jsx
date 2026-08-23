import Input from "../components/ui/Input.jsx";
import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {ChefHat, Send, UserCircle} from "@boxicons/react";
import Button from "../components/ui/Button.jsx";
import recipeApi from "../api/recipe.js";
import {useAlert} from "../context/AlertContext.jsx";

function isValidRecipe(data) {
    if (!data || typeof data !== "object") return false;
    if (typeof data.title !== "string" || data.title.trim() === "") return false;
    if (typeof data.prepTime !== "number") return false;
    if (typeof data.servings !== "number") return false;
    if (!Array.isArray(data.ingredients) || !Array.isArray(data.steps)) return false;

    const ingredientsValid = data.ingredients.every(
        (ingredient) => ingredient && typeof ingredient.name === "string" && typeof ingredient.quantity === "number"
    );
    const stepsValid = data.steps.every(
        (step) => step && typeof step.step_number === "number" && typeof step.description === "string"
    );

    return ingredientsValid && stepsValid;
}

// The model sometimes wraps the JSON in a ```json fence or adds surrounding text.
function extractRecipeFromText(text) {
    if (!text) return null;

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : text;

    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    let parsed;
    try {
        parsed = JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return null;
    }

    return isValidRecipe(parsed) ? parsed : null;
}

function TypingBubble() {
    return (
        <div className={"flex items-end gap-3 self-start animate-chat-in"}>
            <div className={"w-9 h-9 rounded-full bg-[#A2BADE] text-white flex items-center justify-center shrink-0"}>
                <ChefHat width={20} height={20}/>
            </div>
            <div className={"bg-[#E8F1FF] rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center"}>
                <span className={"w-2 h-2 rounded-full bg-[#6EA8FE] animate-bounce"} style={{animationDelay: "0ms"}}></span>
                <span className={"w-2 h-2 rounded-full bg-[#6EA8FE] animate-bounce"} style={{animationDelay: "150ms"}}></span>
                <span className={"w-2 h-2 rounded-full bg-[#6EA8FE] animate-bounce"} style={{animationDelay: "300ms"}}></span>
            </div>
        </div>
    )
}

export default function AI() {

    const navigate = useNavigate();
    const {showSuccess, showError} = useAlert();

    const [prompt, setPrompt] = useState("");
    const [chat, setChat] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [importingIndex, setImportingIndex] = useState(null);

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth", block: "end"});
    }, [chat, isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedPrompt = prompt.trim();
        if (trimmedPrompt === "" || isLoading) return;

        setChat((prev) => [...prev, {role: "user", content: trimmedPrompt}]);
        setPrompt("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:3000/ai/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "prompt": trimmedPrompt,
                })
            })

            const data = await response.json();
            const recipe = extractRecipeFromText(data.result);
            setChat((prev) => [...prev, {role: "assistant", content: data.result, recipe}]);
        } catch (error) {
            showError("Impossible de contacter l'assistant. Réessaie plus tard.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleImport = async (recipe, index) => {
        setImportingIndex(index);
        try {
            const payload = {
                title: recipe.title,
                description: recipe.description ?? "",
                prepTime: recipe.prepTime,
                cookTime: recipe.cookTime ?? 0,
                servings: recipe.servings,
                ingredients: recipe.ingredients.map((ingredient) => ({
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    ...(ingredient.unit ? {unit: ingredient.unit} : {}),
                    ...(ingredient.type ? {type: ingredient.type} : {}),
                })),
                steps: recipe.steps.map((step) => ({
                    step_number: step.step_number,
                    description: step.description,
                })),
            };

            const created = await recipeApi.createRecipe(payload);
            showSuccess("Recette ajoutée à mes recettes !");
            navigate(`/recipe/${created.id}`);
        } catch (error) {
            showError(error.message || "Erreur lors de l'ajout de la recette.");
        } finally {
            setImportingIndex(null);
        }
    }


    return (
        <div className={"w-full h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-4.375rem)] flex flex-col"} >
            <div className={"flex items-center gap-3 mb-5 shrink-0"} >
                <div className={"w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#A2BADE] text-white flex items-center justify-center shrink-0"} >
                    <ChefHat width={22} height={22} className={"sm:w-[26px] sm:h-[26px]"} />
                </div>
                <div className={"min-w-0"}>
                    <h1 className={"text-xl sm:text-2xl font-[700]"} >Assistant recettes</h1>
                    <p className={"text-xs sm:text-sm text-[#9C9C9C] truncate"} >Décris un plat, je te génère la recette</p>
                </div>
            </div>

            <div className={"flex-1 overflow-y-auto flex flex-col gap-4 pr-1"} >
                {
                    chat.length === 0 && !isLoading && (
                        <div className={"flex-1 flex flex-col items-center justify-center gap-2 text-[#9C9C9C] text-center px-4"} >
                            <ChefHat width={40} height={40} className={"sm:w-14 sm:h-14"} />
                            <p className={"text-base sm:text-lg font-[700]"} >Décris le plat que tu veux cuisiner</p>
                            <p className={"text-xs sm:text-sm"} >Ex : "Une recette de tarte aux pommes pour 6 personnes"</p>
                        </div>
                    )
                }

                {chat.map((message, index) => (
                    <div key={index} className={`flex items-end gap-3 animate-chat-in ${message.role === "user" ? "self-end flex-row-reverse" : "self-start"}`} >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${message.role === "user" ? "bg-primary" : "bg-[#A2BADE] text-white"}`} >
                            {message.role === "user" ? <UserCircle width={20} height={20} /> : <ChefHat width={20} height={20} />}
                        </div>

                        <div className={`max-w-[85%] sm:max-w-[65%] flex flex-col gap-3 px-4 py-3 rounded-2xl ${message.role === "user" ? "bg-[#FFE7C5] rounded-br-sm" : "bg-[#E8F1FF] rounded-bl-sm"}`} >
                            <p className={"text-base whitespace-pre-wrap break-words"} >{message.content}</p>

                            {
                                message.recipe && (
                                    <Button
                                        text={importingIndex === index ? "Ajout en cours..." : "Ajouter à mes recettes"}
                                        variant={"blue"}
                                        active={importingIndex === null}
                                        onClick={() => handleImport(message.recipe, index)}
                                        className={"self-start bg-white"}
                                    ></Button>
                                )
                            }
                        </div>
                    </div>
                ))}

                {isLoading && <TypingBubble/>}

                <div ref={bottomRef}></div>
            </div>

            <form onSubmit={handleSubmit} className={"flex gap-4 pt-4 mt-2 border-t border-black/10 shrink-0"} >
                <Input
                    placeholder={"Enter your prompt here"}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    className={"flex-1"}
                ></Input>
                <Button
                    onClick={handleSubmit}
                    text={"Envoyer"}
                    trailing={<Send width={18} height={18} />}
                    active={!isLoading && prompt.trim() !== ""}
                ></Button>
            </form>
        </div>
    )

}
