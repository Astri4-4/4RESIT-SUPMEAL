import {BASE_URL} from "../../api/client.js";
import DurationTag from "./DurationTag.jsx";
import Button from "./Button.jsx";
import {ChevronRight} from "@boxicons/react";
import ToggleIconButton from "./ToggleIconButton.jsx";
import {Heart} from "@boxicons/react";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import favoriteApi from "../../api/favorite.js";


export default function RecipeVerticalCard({recipe: initialRecipe}) {
    const [recipe, setRecipe] = useState(initialRecipe);
    const [isFavoriteHovered, setIsFavoriteHovered] = useState(false);
    const navigate = useNavigate();

    const showAsFavorite = isFavoriteHovered ? !recipe.favorite : recipe.favorite;

    const handleToggleFavorite = async () => {
        try {
            if (recipe.favorite) {
                await favoriteApi.remove(recipe.favoriteId);
                setRecipe({...recipe, favorite: false, favoriteId: null});
            } else {
                const created = await favoriteApi.add(recipe.id);
                setRecipe({...recipe, favorite: true, favoriteId: created.id});
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleClickRecipe = (e) => {
        e.preventDefault();
        navigate(`/recipe/${recipe.id}`);
    }

    return (
        <div className={"flex flex-col rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] p-1 max-w-[250px]"}>
            <div className={"relative flex items-center justify-center"} >
                <img src={BASE_URL + recipe.image_url || "https://placehold.co/200x200"} className={"w-full aspect-square rounded-[18px] object-cover"} alt=""/>
                <ToggleIconButton className={"absolute top-2.5 right-2.5"} icon={<Heart width={20} height={20} color={showAsFavorite ? "#FF5757" : "#9C9C9C"} />} isActive={recipe.favorite} onClick={handleToggleFavorite} onMouseEnter={() => setIsFavoriteHovered(true)} onMouseLeave={() => setIsFavoriteHovered(false)} ></ToggleIconButton>
            </div>

            <div className={"flex flex-col flex-1 py-3.5 px-[9px]"} >
                <h2 className={"text-lg font-bold line-clamp-1"}>{recipe.title}</h2>
                <p className={"text-gray-600 max-w-[200px] min-h-[68px] line-clamp-3"}>{recipe.description}</p>
                <div className={`flex ${(recipe.preptime + recipe.cooktime > 60) ? "gap-10" : "gap-6"} items-center mt-auto pt-4`} >
                    <DurationTag duration={recipe.preptime + recipe.cooktime}></DurationTag>
                    <Button variant={"blue"} textSize={"12"} text={"Voir la recette"} weight={"400"} trailing={<ChevronRight width={16} height={16}  ></ChevronRight>} className={"flex-1"} onClick={handleClickRecipe} ></Button>
                </div>

            </div>

        </div>
    )

}