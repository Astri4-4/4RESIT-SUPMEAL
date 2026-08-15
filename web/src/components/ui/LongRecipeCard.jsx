import {BASE_URL} from "../../api/client.js";

export default function LongRecipeCard({recipe}) {
    return (
        <div className={"bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] rounded-[20px] overflow-hidden flex gap-8"} >
            <div className={"p-[2px] rounded-[20px] overflow-hidden"}>
                <img src={(recipe?.image_url) ? BASE_URL + recipe?.image_url : "https://placehold.co/1920x1080"} className={"h-32.5 aspect-282/130 object-cover rounded-[20px]"} alt=""/>
            </div>
            <div className={"py-4"} >
                <h2 className={"font-primary text-[20px] font-bold"}>{recipe?.title || "Recette inconnue"}</h2>
                <p className={"text-[16px] text-[#9C9C9C] mt-2"}>{recipe?.description || "Aucune description disponible"}</p>
            </div>
        </div>
    )
}