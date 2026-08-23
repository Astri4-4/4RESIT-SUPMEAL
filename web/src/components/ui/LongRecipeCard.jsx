import {BASE_URL} from "../../api/client.js";

export default function LongRecipeCard({recipe}) {
    return (
        <div className={"bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] rounded-[20px] overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-8"} >
            <div className={"shrink-0 w-full sm:w-[282px] h-40 sm:h-auto sm:min-h-32.5 sm:max-h-38 p-[2px] rounded-[20px] overflow-hidden"}>
                <img src={(recipe?.image_url) ? BASE_URL + recipe?.image_url : "https://placehold.co/1920x1080"} className={"w-full h-full object-cover rounded-[20px]"} alt=""/>
            </div>
            <div className={"py-0 sm:py-4 px-4 pb-4 sm:px-0 sm:pb-0"} >
                <h2 className={"font-primary text-[20px] font-bold line-clamp-1 sm:pr-12"}>{recipe?.title || "Recette inconnue"}</h2>
                <p className={"text-[16px] text-[#9C9C9C] mt-2 line-clamp-3 sm:pr-12"}>{recipe?.description || "Aucune description disponible"}</p>
            </div>
        </div>
    )
}