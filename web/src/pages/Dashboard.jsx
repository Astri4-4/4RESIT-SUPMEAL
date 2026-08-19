import { useAuth } from "../context/AuthContext.jsx";
import Calendar from "../components/ui/Calendar.jsx";
import Input from "../components/ui/Input.jsx";
import ShoppingList from "../components/ui/ShoppingList.jsx";
import {Search, ChevronRight} from "@boxicons/react"
import Button from "../components/ui/Button.jsx";
import LongRecipeCard from "../components/ui/LongRecipeCard.jsx";
import recipeApi from "../api/recipe.js";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";


export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        async function load() {
            setRecipes(await recipeApi.getUserRecipes())
        }
        load()
    }, [])

    return (
        <div className={"flex-1"}>
            <div>
                <h1 className={"font-primary text-5xl font-bold"} >Bonjour {user?.username} !</h1>
            </div>

            <div className={"flex gap-25 mt-3.25"} >
                <div className={"w-[38%] flex flex-col"} >
                    <Calendar></Calendar>

                    <ShoppingList className={"flex flex-col flex-1 mt-8"}></ShoppingList>

                </div>
                <div className={"flex-1"}>
                    <Input placeholder={"Que veux-tu cuisiner aujourd'hui ?"} trailing={<Search color={"#9C9C9C"} />} />

                    <div className={"py-10 px-9.5 bg-[#E8F1FF] rounded-[20px] mt-12 shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                        <h1 className={"font-primary text-[32px] font-bold"}>Ajouter vos propres recettes !</h1>
                        <p className={"text-[20px] mt-[38px]"} >Téléchargez vos recettes à partir d’un simple lien internet, et partagez-les avec vos amis dans des cookbooks à l’infini !</p>
                    </div>

                    <div className={"mt-8.75"} >
                        <div className={"flex items-center justify-between"} >
                            <h2 className={"font-primary text-[28px] font-bold py-6"} >Les dernières recettes ajoutées</h2>
                            <Button variant={"blue"} text={"Voir toutes les recettes"} trailing={<ChevronRight />} onClick={() => navigate("/recipes")} ></Button>
                        </div>

                        {
                            recipes.slice(-4).reverse().map((recipe) => (
                                <div key={recipe.id} className={"mt-6"}>
                                    <LongRecipeCard recipe={recipe}></LongRecipeCard>
                                </div>
                            ))
                        }

                    </div>

                </div>
            </div>

        </div>
    )
}
