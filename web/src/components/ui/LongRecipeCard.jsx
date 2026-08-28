import {useNavigate} from "react-router-dom";
import Button from "./Button.jsx";
import {BASE_URL} from "../../api/client.js";
import {ChevronRight} from "@boxicons/react"

export default function LongRecipeCard({recipe}) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (recipe?.id) navigate(`/recipe/${recipe.id}`);
    }

    return (
        <div
            className={"group/card bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] rounded-[20px] overflow-hidden flex gap-8 hover:scale-98 transition-scale duration-300 cursor-pointer"}
            onClick={handleClick}
        >
            <div className={"shrink-0 w-[282px] min-h-32.5 max-h-38 p-[2px] rounded-[20px] overflow-hidden"}>
                <img src={(recipe?.image_url) ? BASE_URL + recipe?.image_url : "https://placehold.co/1920x1080"} className={"w-full h-full object-cover rounded-[20px]"} alt=""/>
            </div>
            <div className={"py-4"} >
                <h2 className={"font-primary text-[20px] font-bold line-clamp-1 pr-12"}>{recipe?.title || "Recette inconnue"}</h2>
                <p className={"text-[16px] text-[#9C9C9C] mt-2 line-clamp-3 pr-12"}>{recipe?.description || "Aucune description disponible"}</p>
            </div>

            <div className={"ml-auto flex items-center pr-4 translate-x-[10px] opacity-0 group-hover/card:translate-x-0 group-hover/card:opacity-100 transition-all duration-300"}>
                <Button
                    text={"Voir"}
                    variant={"blue"}
                    trailing={<ChevronRight className={"text-[20px]"} />}
                    onClick={handleClick}
                />
            </div>

        </div>
    )
}
