import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import recipeApi from "../api/recipe.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import {BASE_URL} from "../api/client.js";
import ToggleIconButton from "../components/ui/ToggleIconButton.jsx";
import ButtonCircleIcon from "../components/ui/ButtonCircleIcon.jsx";
import {Heart, CalendarPlus, CalendarCheck, CartPlus, CartCheck, ChefHat, Oven, ForkKnife, ChevronLeft, ChevronRight} from "@boxicons/react";
import favoriteApi from "../api/favorite.js";
import planApi from "../api/plan.js";
import Tag from "../components/ui/Tag.jsx";
import Button from "../components/ui/Button.jsx";
import Popup from "../components/Popup.jsx";

const WEEKDAY_LABELS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getCalendarDays(viewDate) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);

    const days = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        days.push({date, inMonth: date.getMonth() === month});
    }
    return days;
}

export default function RecipeDetail() {

    const params = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [multilineSteps, setMultilineSteps] = useState({});
    const stepTextRefs = useRef({});

    const [isFavoriteHovered, setIsFavoriteHovered] = useState(false);
    const [isMealPlanHovered, setIsMealPlanHovered] = useState(false);
    const [isShoppingListHovered, setIsShoppingListHovered] = useState(false);
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isPlanPopupOpen, setIsPlanPopupOpen] = useState(false);
    const [plan, setPlan] = useState(null);
    const [viewDate, setViewDate] = useState(() => new Date());
    const [isTogglingDate, setIsTogglingDate] = useState(false);

    const plannedDates = new Set(
        (plan?.items || [])
            .filter((item) => item.recipe_id === recipe?.id)
            .map((item) => item.date)
    );
    const hasPlannedDate = plan ? plannedDates.size > 0 : recipe?.inMealPlan;

    const showAsFavorite = isFavoriteHovered ? !recipe?.favorite : recipe?.favorite;
    const showAsInMealPlan = isMealPlanHovered ? !hasPlannedDate : hasPlannedDate;
    const showAsInShoppingList = isShoppingListHovered ? !recipe?.inShoppingList : recipe?.inShoppingList;

    useEffect(() => {
        (async () => {
            const response = await recipeApi.getRecipe(params.id);
            setRecipe(response);
        })()
    }, [])

    useEffect(() => {
        if (!recipe?.steps) return;

        const checkMultiline = (index, el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const isMultiline = range.getClientRects().length > 1;
            setMultilineSteps((prev) => (prev[index] === isMultiline ? prev : {...prev, [index]: isMultiline}));
        };

        const observers = recipe.steps.map((_, index) => {
            const el = stepTextRefs.current[index];
            if (!el) return null;

            checkMultiline(index, el);

            const observer = new ResizeObserver(() => checkMultiline(index, el));
            observer.observe(el);
            return observer;
        });

        return () => observers.forEach((observer) => observer?.disconnect());
    }, [recipe?.steps]);

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

    const handleOpenPlanPopup = async () => {
        setIsPlanPopupOpen(true);
        if (!plan) {
            try {
                const data = await planApi.getMyPlan();
                setPlan(data);
            } catch (error) {
                console.log(error);
            }
        }
    }

    const handleToggleDate = async (date) => {
        if (!plan || isTogglingDate) return;

        const dateStr = formatDate(date);
        const existing = plan.items.find((item) => item.recipe_id === recipe.id && item.date === dateStr);

        setIsTogglingDate(true);
        try {
            if (existing) {
                await planApi.removeItem(plan.id, existing.id);
                setPlan((prev) => ({...prev, items: prev.items.filter((item) => item.id !== existing.id)}));
            } else {
                const created = await planApi.addItem(plan.id, dateStr, recipe.id);
                setPlan((prev) => ({...prev, items: [...prev.items, {...created, date: dateStr}]}));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsTogglingDate(false);
        }
    }

    const handlePrevMonth = () => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }

    const handleNextMonth = () => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }

    const handleAddToShoppingList = async () => {
        try {
            await recipeApi.addIngredientsToShoppingList(recipe.id);
            setRecipe({...recipe, inShoppingList: true});
        } catch (error) {
            console.log(error);
        }
    }

    const handleDeleteRecipe = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await recipeApi.deleteRecipe(recipe.id);
            navigate("/recipes");
        } catch (error) {
            console.log(error);
        } finally {
            setIsDeleting(false);
        }
    }

    const convertToHoursAndMinutes = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${(hours > 0) ? `${hours} heures ` : ''}${(remainingMinutes > 0) ? `${remainingMinutes} minutes` : ''}`;
    };

    return (
        <div>
            <div className={"w-full flex items-center justify-between mb-[55px]"}>
                <Breadcrumb path={[
                    {label: "Accueil", link: "/dashboard"},
                    {label: "Mes recettes", link: "/recipes"},
                    {label: recipe?.title || "Recipe"}
                ]} />

                <p className={"text-sm text-neutral-400 font-normal"}>Recette ajoutée par {recipe?.owner_username}</p>

            </div>

            <div className="flex gap-15" >
                <div className={"w-[54%]"} >

                    <div className={"px-[42px] py-[18px]  bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                        <h1 className={"text-black text-3xl font-bold font-primary text-center"} >{recipe?.title}</h1>

                        <div className={"flex items-center justify-center gap-4 h-11 mt-[15px]"}>
                            <ChefHat color={"#FFB857"} width={24} height={24} />
                            <p>Temps de préparation: {convertToHoursAndMinutes(recipe?.preptime)}</p>
                            <div className={"border-r border-black h-full w-4"} ></div>
                            {
                                recipe?.cooktime !== undefined && recipe?.cooktime > 0 && (
                             <>
                                 <Oven color={"#FFB857"}/>
                                 <p>Temps de cuisson: {convertToHoursAndMinutes(recipe?.cooktime)}</p>
                                 <div className={"border-r border-black h-full w-4"} ></div>
                             </>
                                )
                            }
                            <ForkKnife color={"#FFB857"}/>
                            <p>{recipe?.servings} personne{(recipe?.servings > 1) ? 's' : ''}</p>

                        </div>

                        <p className={"text-[#9C9C9C] text-center text-base font-normal mt-[15px]"} >{recipe?.description}</p>

                    </div>

                    <div className={"px-[42px] py-[18px]  bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[38px]"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Étapes de la préparation</h2>

                        <ol className={"list-none"} >
                            {
                                recipe?.steps.map((step, index) => (
                                    <li key={index} className={`flex gap-4 mt-6 ${multilineSteps[index] ? "items-start" : "items-center"}`} >
                                        <p className={"text-amber-300 text-2xl font-bold font-primary text-right shrink-0 w-[2ch]"} >{index + 1}</p>
                                        <p ref={(el) => (stepTextRefs.current[index] = el)} className={"text-black text-base font-normal"} >{step.description}</p>
                                    </li>
                                ))
                            }
                        </ol>

                    </div>

                </div>
                <div className={"flex-1"} >

                    <div className={"relative w-full rounded-[20px] overflow-hidden shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                        <img src={BASE_URL + recipe?.image_url} className={"w-full aspect-650/340 object-cover"} alt=""/>

                        <div className={"absolute top-4.5 right-3.5 flex flex-col gap-2.5"} >
                            <ToggleIconButton
                                icon={<Heart color={showAsFavorite ? "#FF5757" : "#9C9C9C"} />}
                                className={` ${showAsFavorite ? "border-[#FF5757] border-2" : ""}`}
                                onClick={handleToggleFavorite}
                                onMouseEnter={() => setIsFavoriteHovered(true)}
                                onMouseLeave={() => setIsFavoriteHovered(false)}
                                hasTooltip={true}
                                tooltip={"Ajouter au favori"}
                                tooltipColor={"border-[#FF5757] text-[#FF5757]"}
                            />
                            <ToggleIconButton
                                icon={showAsInMealPlan ? <CalendarCheck color={"#6EA8FE"} /> : <CalendarPlus color={"#9C9C9C"} />}
                                className={` ${showAsInMealPlan ? "border-[#6EA8FE] border-2" : ""}`}
                                onClick={handleOpenPlanPopup}
                                onMouseEnter={() => setIsMealPlanHovered(true)}
                                onMouseLeave={() => setIsMealPlanHovered(false)}
                                hasTooltip={true}
                                tooltip={"Planifier ma recette"}
                                tooltipColor={"border-[#6EA8FE] text-[#6EA8FE]"}
                            />
                            <ToggleIconButton
                                icon={showAsInShoppingList ? <CartCheck color={"#FFB857"} /> : <CartPlus color={"#9C9C9C"} />}
                                className={` ${showAsInShoppingList ? "border-[#FFB857] border-2" : ""}`}
                                onClick={handleAddToShoppingList}
                                onMouseEnter={() => setIsShoppingListHovered(true)}
                                onMouseLeave={() => setIsShoppingListHovered(false)}
                                hasTooltip={true}
                                tooltip={"Ajouter à la liste de courses"}
                                tooltipColor={"border-[#FFB857] text-[#FFB857]"}
                            />
                        </div>

                    </div>

                    <div className={"flex flex-wrap gap-2.5 mt-[37px]"}>
                        {recipe?.tags.map((tag, index) => (
                            <Tag key={tag.id} text={tag.name} colorIndex={index} />
                        ))}
                    </div>

                    <div className={"px-[42px] py-[18px]  bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[37px]"} >
                        <h2 className={"text-black text-2xl font-bold font-primary"} >Ingrédients</h2>

                        <ul className={"columns-2 gap-x-[54px] mt-4"}>
                            {
                                recipe?.ingredients.map((ingredient) => (
                                    <li key={ingredient.id} className={"flex items-center gap-3 py-2 break-inside-avoid"} >
                                        <div className={"h-5 aspect-square rounded-full bg-[#FFB857AA] shrink-0"} ></div>
                                        <p className={"text-black text-base font-normal"} >{Number(ingredient.quantity) > 0 && <>{Number(ingredient.quantity)}{(ingredient.unit === "unité") ? "" : ingredient.unit}  </>}{ingredient.name}</p>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>

                </div>
            </div>
            <div className={"flex justify-end gap-4 mt-[37px]"}>
                <Button variant={"primary"} text={"Modifier la recette"} className={"w-fit"} onClick={() => navigate(`/recipe/${recipe.id}/edit`)} />
                <button className={"bg-[#FF5757] rounded-[10px] px-4 py-[7px] flex items-center justify-center gap-2 text-center text-[20px] font-[700] text-white cursor-pointer"} onClick={() => setIsDeletePopupOpen(true)} >
                    Supprimer la recette
                </button>
            </div>
            <Popup isOpen={isDeletePopupOpen} onClose={() => setIsDeletePopupOpen(false)}>
                <h2 className="text-xl font-bold mb-4 text-center">Adieu, petite recette !</h2>
                <p className={"text-neutral-400 text-base font-normal"}>
                    Es-tu sûr(e) de vouloir supprimer cette recette ?<br/>
                    Cette action est définitive et ta recette ne pourra pas être récupérée. <br/><br/>

                    Clique sur « Supprimer la recette » pour confirmer.
                </p>
                <div className={"flex justify-center gap-8 mt-8"}>
                    <Button text={"Annuler"} variant={"blue"} onClick={() => setIsDeletePopupOpen(false)} />
                    <button className={"bg-[#FF5757] rounded-[10px] px-4 py-[7px] flex items-center justify-center gap-2 text-center text-[20px] font-[700] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"} onClick={handleDeleteRecipe} disabled={isDeleting} >
                        {isDeleting ? "Suppression..." : "Supprimer la recette"}
                    </button>
                </div>
            </Popup>
            <Popup isOpen={isPlanPopupOpen} onClose={() => setIsPlanPopupOpen(false)}>
                <div className={"w-[380px]"}>
                    <div className={"flex items-center justify-center gap-4"}>
                        <ButtonCircleIcon variant={"purple"} icon={<ChevronLeft width={16} height={16} />} onClick={handlePrevMonth} />
                        <h2 className={"text-xl font-bold text-center capitalize"} >
                            {viewDate.toLocaleDateString("fr-FR", {month: "long", year: "numeric"})}
                        </h2>
                        <ButtonCircleIcon variant={"purple"} icon={<ChevronRight width={16} height={16} />} onClick={handleNextMonth} />
                    </div>

                    <div className={"grid grid-cols-7 mt-4 text-center text-sm font-bold"}>
                        {WEEKDAY_LABELS.map((label) => (
                            <div key={label}>{label}</div>
                        ))}
                    </div>

                    <div className={"grid grid-cols-7 gap-y-2 mt-2"}>
                        {
                            getCalendarDays(viewDate).map(({date, inMonth}) => {
                                const dateStr = formatDate(date);
                                const isToday = dateStr === formatDate(new Date());
                                const isPlanned = plannedDates.has(dateStr);
                                return (
                                    <button
                                        key={dateStr}
                                        disabled={!inMonth || !plan}
                                        onClick={() => handleToggleDate(date)}
                                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm
                                            ${!inMonth ? "text-[#9C9C9C] cursor-default" : "text-black cursor-pointer"}
                                            ${isToday ? "border border-black" : ""}
                                            ${isPlanned ? "bg-[#E5C7FF] font-bold" : ""}
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })
                        }
                    </div>

                    <div className={"flex justify-center mt-6"}>
                        <Button text={"Valider"} variant={"blue"} onClick={() => setIsPlanPopupOpen(false)} />
                    </div>
                </div>
            </Popup>
        </div>
    )
}