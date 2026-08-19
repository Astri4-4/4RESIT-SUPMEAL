import Input from "../components/ui/Input.jsx";
import {Search, Plus} from "@boxicons/react"
import FilterMenu from "../components/ui/FilterMenu.jsx";
import Tag from "../components/ui/Tag.jsx";
import {CATEGORY_ORDER} from "../components/ui/TagCategoryList.jsx";
import {useEffect, useState} from "react";
import userApi from "../api/user.js";
import RecipeVerticalCard from "../components/ui/RecipeVerticalCard.jsx";
import recipeApi from "../api/recipe.js";
import AddRecipePopup from "../components/AddRecipePopup.jsx";
import {useSearchParams} from "react-router-dom";

export default function Recipes() {

    const [searchParams] = useSearchParams();

    const [tags, setTags] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [sortBy, setSortBy] = useState(null);
    const [order, setOrder] = useState("asc");
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [isUrlPopupOpen, setIsUrlPopupOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await userApi.getPreferences();
                const recipe = await recipeApi.getUserRecipes()
                console.log(recipe)
                setTags(data || []);
                setRecipes(recipe || []);
            } catch (error) {
                console.log(error);
            }
        })();
    }, []);

    const handleToggleTag = (tagId) => {
        setSelectedTagIds((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
    };

    const matchesSearch = (recipe, query) => {
        if (!query) return true;

        const haystack = [
            recipe.title,
            recipe.description,
            ...(recipe.ingredientNames || []),
            ...(recipe.stepDescriptions || []),
            ...(recipe.tags || []).map((tag) => tag.name),
        ].filter(Boolean).join(" ").toLowerCase();

        return haystack.includes(query);
    };

    const filteredRecipes = recipes
        .filter((recipe) => selectedTagIds.length === 0 || (recipe.tags || []).some((tag) => selectedTagIds.includes(tag.id)))
        .filter((recipe) => matchesSearch(recipe, search.trim().toLowerCase()));

    const displayedRecipes = [...filteredRecipes].sort((a, b) => {
        if (!sortBy) return 0;

        let diff = 0;
        switch (sortBy) {
            case "date":
                diff = new Date(a.created_at) - new Date(b.created_at);
                break;
            case "preptime":
                diff = a.preptime - b.preptime;
                break;
            case "cooktime":
                diff = a.cooktime - b.cooktime;
                break;
            case "favorite":
                diff = (a.favorite === b.favorite) ? 0 : (a.favorite ? -1 : 1);
                break;
        }

        return order === "desc" ? -diff : diff;
    });

    return (

        <div>
            <div className={"flex flex-col items-center gap-8"} >
                <h1 className={"font-primary text-[32px] font-bold text-center"} >Retrouve ici toutes tes recettes enregistrées !</h1>
                <div className={"w-[54%] flex gap-3.75"}>
                    <Input
                        placeholder="Rechercher une recette..."
                        className={"flex-1"}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                        trailing={<Search color="#9C9C9C" width={24} height={24} />}
                    ></Input>
                    <FilterMenu sortBy={sortBy} order={order} onSortByChange={setSortBy} onOrderChange={setOrder} />
                </div>
                <div className={"flex flex-wrap gap-2.5"}>
                    {tags.map((tag) => {
                        const categoryIndex = CATEGORY_ORDER.indexOf(tag.category || "");
                        return (
                            <Tag
                                key={tag.id}
                                text={tag.name}
                                colorIndex={categoryIndex === -1 ? 0 : categoryIndex}
                                selected={selectedTagIds.includes(tag.id)}
                                onClick={() => handleToggleTag(tag.id)}
                            />
                        );
                    })}
                </div>
            </div>

            <div className={"flex flex-wrap gap-[75px] justify-start mt-8"}>
                <div className={"group w-[250px] flex flex-col justify-center items-center rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] p-1 max-w-[250px] border-2 border-dotted border-[#9C9C9C] hover:bg-[#F5F5F5] transition cursor-pointer"} onClick={() => setIsUrlPopupOpen(true)}>
                    <Plus color="#9C9C9C" width={85} height={85} />
                    <p className={"text-black text-xl font-bold group-hover:font-bold font-secondary w-28 text-center mt-8"} >Ajouter une recette</p>

                </div>
                {displayedRecipes.map((recipe) => (
                    <RecipeVerticalCard key={recipe.id} recipe={recipe} />
                ))}
            </div>

            <AddRecipePopup isOpen={isUrlPopupOpen} onClose={() => setIsUrlPopupOpen(false)} />

        </div>

    )

}