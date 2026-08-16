import Input from "../components/ui/Input.jsx";
import {Search, Plus} from "@boxicons/react"
import FilterMenu from "../components/ui/FilterMenu.jsx";
import Tag from "../components/ui/Tag.jsx";
import {useEffect, useState} from "react";
import {tagApi} from "../api/tag.js";
import RecipeVerticalCard from "../components/ui/RecipeVerticalCard.jsx";
import recipeApi from "../api/recipe.js";
import Popup from "../components/Popup.jsx";
import DisabledButton from "../components/ui/DisabledButton.jsx";
import * as url from "node:url";
import Button from "../components/ui/Button.jsx";

export default function Recipes() {

    const [tags, setTags] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [isUrlPopupOpen, setIsUrlPopupOpen] = useState(false);
    const [isUrlEntered, setIsUrlEntered] = useState(false);
    const [url, setUrl] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const data = await tagApi.getAll();
                const recipe = await recipeApi.getUserRecipes()
                console.log(recipe)
                setTags(data || []);
                setRecipes(recipe || []);
            } catch (error) {
                console.log(error);
            }
        })();
    }, []);

    return (

        <div>
            <div className={"flex flex-col items-center gap-8"} >
                <h1 className={"font-primary text-[32px] font-bold text-center"} >Retrouve ici toutes tes recettes enregistrées !</h1>
                <div className={"w-[54%] flex gap-3.75"}>
                    <Input placeholder="Rechercher une recette..." className={"flex-1"} trailing={<Search color="#9C9C9C" width={24} height={24} />} ></Input>
                    <FilterMenu></FilterMenu>
                </div>
                <div className={"flex flex-wrap gap-2.5"}>
                    {tags.map((tag, index) => (
                        <Tag key={tag.id} text={tag.name} colorIndex={index} />
                    ))}
                </div>
            </div>

            <div className={"flex flex-wrap gap-[75px] justify-start mt-8"}>
                <div className={"group w-[250px] flex flex-col justify-center items-center rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] p-1 max-w-[250px] border-2 border-dotted border-[#9C9C9C] hover:bg-[#F5F5F5] transition cursor-pointer"} onClick={() => setIsUrlPopupOpen(true)}>
                    <Plus color="#9C9C9C" width={85} height={85} />
                    <p className={"text-black text-xl font-bold group-hover:font-bold font-secondary w-28 text-center mt-8"} >Ajouter une recette</p>

                </div>
                {recipes.map((recipe) => (
                    <RecipeVerticalCard key={recipe.id} recipe={recipe} />
                ))}
            </div>

            <Popup isOpen={isUrlPopupOpen} onClose={() => setIsUrlPopupOpen(false)}>
                    <h2 className="text-xl font-bold mb-4 text-center">Une nouvelle recette à ajouter ? C'est par ici !</h2>
                    <div className={"flex gap-9.5"}>
                        <Input
                            placeholder="Colle le lien de la recette ici..."
                            onChange={(e) => {
                                setUrl(e.target.value)
                                if (e.target.value === "") {
                                    setIsUrlEntered(false)
                                } else {
                                    setIsUrlEntered(true)
                                }
                            }}
                        />
                        <DisabledButton text={"Importer la recette"} disabled={!isUrlEntered}></DisabledButton>
                    </div>

                    <div className={"flex items-center gap-9.5 mt-[26px]"} >
                        <div  className={"flex-1 h-[1px] bg-[#9B9B9B]"}></div>
                        <p className={"text-[#9B9B9B] text-2xl"} > OU </p>
                        <div className={"flex-1 h-[1px] bg-[#9B9B9B]"}></div>
                    </div>

                    <div className={"mt-[26px]"}>
                        <Button text={"Créer ma propre recette"} variant={"blue"} />
                    </div>

            </Popup>

        </div>

    )

}