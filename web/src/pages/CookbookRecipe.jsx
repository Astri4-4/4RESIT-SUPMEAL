import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import Tag from "../components/ui/Tag.jsx";
import Popup from "../components/Popup.jsx";
import Button from "../components/ui/Button.jsx";
import ToggleIconButton from "../components/ui/ToggleIconButton.jsx";
import ButtonCircleIcon from "../components/ui/ButtonCircleIcon.jsx";
import {ChefHat, Oven, ForkKnife, X, CalendarPlus, CalendarCheck, CartPlus, CartCheck, ChevronLeft, ChevronRight} from "@boxicons/react";
import cookbookApi from "../api/cookbook.js";
import recipeApi from "../api/recipe.js";
import planApi from "../api/plan.js";
import {BASE_URL} from "../api/client.js";
import {useAuth} from "../context/AuthContext.jsx";
import {useAlert} from "../context/AlertContext.jsx";
import {timeAgo} from "../utils/date.js";

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

function EditIcon({...props}) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
            <path d="M5 21H19C20.1 21 21 20.1 21 19V12H19V19H5V5H12V3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21Z" fill="currentColor"/>
            <path d="M7.00002 12.9998V15.9998C7.00002 16.5498 7.45002 16.9998 8.00002 16.9998H11C11.27 16.9998 11.52 16.8898 11.71 16.7098L20.71 7.70977C20.8027 7.61725 20.8763 7.50737 20.9264 7.38639C20.9766 7.26542 21.0025 7.13574 21.0025 7.00477C21.0025 6.8738 20.9766 6.74412 20.9264 6.62314C20.8763 6.50217 20.8027 6.39228 20.71 6.29977L17.71 3.29977C17.6175 3.20706 17.5076 3.13352 17.3866 3.08334C17.2657 3.03315 17.136 3.00732 17.005 3.00732C16.874 3.00732 16.7444 3.03315 16.6234 3.08334C16.5024 3.13352 16.3925 3.20706 16.3 3.29977L7.29002 12.2898C7.19734 12.3832 7.12401 12.494 7.07425 12.6159C7.02448 12.7377 6.99926 12.8682 7.00002 12.9998ZM17 5.40977L18.59 6.99977L17.5 8.08977L15.91 6.49977L17 5.40977ZM9.00002 13.4098L14.5 7.90977L16.09 9.49977L10.59 14.9998H9.00002V13.4098Z" fill="currentColor"/>
        </svg>
    )
}

export default function CookbookRecipe() {

    const {cookbookId, recipeId} = useParams();
    const navigate = useNavigate();
    const {user} = useAuth();
    const {showError} = useAlert();

    const [cookbook, setCookbook] = useState(null);
    const [recipe, setRecipe] = useState(null);
    const [comments, setComments] = useState([]);

    const [newComment, setNewComment] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isMealPlanHovered, setIsMealPlanHovered] = useState(false);
    const [isShoppingListHovered, setIsShoppingListHovered] = useState(false);
    const [isPlanPopupOpen, setIsPlanPopupOpen] = useState(false);
    const [plan, setPlan] = useState(null);
    const [viewDate, setViewDate] = useState(() => new Date());
    const [isTogglingDate, setIsTogglingDate] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [cookbookData, recipeData, commentsData] = await Promise.all([
                    cookbookApi.getCookbook(cookbookId),
                    recipeApi.getRecipe(recipeId),
                    cookbookApi.getComments(cookbookId, recipeId),
                ]);
                setCookbook(cookbookData);
                setRecipe(recipeData);
                setComments(commentsData || []);
            } catch (error) {
                console.log(error);
            }
        })()
    }, [cookbookId, recipeId]);

    const convertToHoursAndMinutes = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${(hours > 0) ? `${hours} heures ` : ''}${(remainingMinutes > 0) ? `${remainingMinutes} minutes` : ''}`;
    };

    const handlePostComment = async () => {
        const text = newComment.trim();
        if (!text || isPosting) return;

        setIsPosting(true);
        try {
            const created = await cookbookApi.addComment(cookbookId, recipeId, text);
            setComments((prev) => [...prev, created]);
            setNewComment("");
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de publier ce commentaire.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleStartEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditingText(comment.comment);
    };

    const handleSaveEditComment = async () => {
        const text = editingText.trim();
        if (!text) return;

        try {
            const updated = await cookbookApi.updateComment(cookbookId, recipeId, editingCommentId, text);
            setComments((prev) => prev.map((comment) => comment.id === editingCommentId ? updated : comment));
            setEditingCommentId(null);
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de modifier ce commentaire.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await cookbookApi.deleteComment(cookbookId, recipeId, commentId);
            setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de supprimer ce commentaire.");
        }
    };

    const handleDeleteRecipe = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await recipeApi.deleteRecipe(recipeId);
            navigate(`/cookbooks/${cookbookId}`);
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de supprimer cette recette.");
        } finally {
            setIsDeleting(false);
        }
    };

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
    };

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
            showError(error.message || "Impossible de planifier cette recette.");
        } finally {
            setIsTogglingDate(false);
        }
    };

    const handlePrevMonth = () => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleAddToShoppingList = async () => {
        try {
            await recipeApi.addIngredientsToShoppingList(recipe.id);
            setRecipe((prev) => ({...prev, inShoppingList: true}));
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible d'ajouter à la liste de courses.");
        }
    };

    if (!cookbook || !recipe) {
        return <div>Chargement...</div>;
    }

    const plannedDates = new Set(
        (plan?.items || [])
            .filter((item) => item.recipe_id === recipe.id)
            .map((item) => item.date)
    );
    const hasPlannedDate = plan ? plannedDates.size > 0 : recipe.inMealPlan;
    const showAsInMealPlan = isMealPlanHovered ? !hasPlannedDate : hasPlannedDate;
    const showAsInShoppingList = isShoppingListHovered ? !recipe.inShoppingList : recipe.inShoppingList;

    const members = cookbook.members || [];
    const owner = members.find((member) => member.role === "owner");
    const myRole = members.find((member) => member.id === user?.id)?.role;
    const canEditRecipes = myRole === "owner" || myRole === "editor";
    const usernameOf = (userId) => members.find((member) => member.id === userId)?.username || "Utilisateur";

    return (
        <div>
            <div className={"w-full flex items-center justify-between mb-[55px]"}>
                <Breadcrumb path={[
                    {label: "Accueil", link: "/dashboard"},
                    {label: "Cookbooks", link: "/cookbooks"},
                    {label: `Cookbook: ${cookbook.title}`, link: `/cookbooks/${cookbookId}`},
                    {label: recipe.title},
                ]} />

                {owner && <p className={"text-sm text-neutral-400 font-normal"}>Cookbook créé par {owner.username}</p>}
            </div>

            <div className={"flex gap-15"}>
                <div className={"w-[54%]"}>

                    <div className={"px-[42px] py-[18px] bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"}>
                        <h1 className={"text-black text-3xl font-bold font-primary text-center"}>{recipe.title}</h1>

                        <div className={"flex items-center justify-center gap-4 h-11 mt-[15px]"}>
                            <ChefHat color={"#A2BADE"} width={24} height={24} />
                            <p>Temps de préparation: {convertToHoursAndMinutes(recipe.preptime)}</p>
                            <div className={"border-r border-black h-full w-4"}></div>
                            {
                                recipe.cooktime !== undefined && recipe.cooktime > 0 && (
                                    <>
                                        <Oven color={"#A2BADE"} />
                                        <p>Temps de cuisson: {convertToHoursAndMinutes(recipe.cooktime)}</p>
                                        <div className={"border-r border-black h-full w-4"}></div>
                                    </>
                                )
                            }
                            <ForkKnife color={"#A2BADE"} />
                            <p>{recipe.servings} personne{(recipe.servings > 1) ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className={"px-[42px] py-[18px] bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[38px]"}>
                        <h2 className={"text-black text-2xl font-bold font-primary"}>Étapes de la préparation</h2>

                        <ol className={"list-none"}>
                            {
                                recipe.steps.map((step, index) => (
                                    <li key={index} className={"flex items-center gap-4 mt-6"}>
                                        <p className={"text-[#A2BADE] text-2xl font-bold font-primary text-right shrink-0 w-[2ch]"}>{index + 1}</p>
                                        <p className={"text-black text-base font-normal"}>{step.description}</p>
                                    </li>
                                ))
                            }
                        </ol>
                    </div>

                    <div className={"px-[42px] py-[18px] bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[38px]"}>
                        <h2 className={"text-black text-2xl font-bold font-primary"}>Commentaires</h2>

                        <div className={"flex flex-col gap-4 mt-6"}>
                            {comments.map((comment) => (
                                <div key={comment.id} className={"bg-white drop-shadow-[0px_0px_10px_rgba(0,0,0,0.1)] rounded-[20px] px-4 py-[15px]"}>
                                    <div className={"flex items-start justify-between gap-4"}>
                                        <p className={"font-bold text-black text-[16px]"}>{usernameOf(comment.user_id)}</p>
                                        <div className={"flex items-center gap-2.5 shrink-0"}>
                                            <p className={"text-[#9C9C9C] text-[16px] whitespace-nowrap"}>{timeAgo(comment.created_at)}</p>
                                            {comment.user_id === user?.id && (
                                                <>
                                                    <button onClick={() => handleStartEditComment(comment)} className={"text-[#9C9C9C] rounded-md p-0.5 cursor-pointer"}>
                                                        <EditIcon width={24} height={24} />
                                                    </button>
                                                    <button onClick={() => handleDeleteComment(comment.id)} className={"bg-[#FF5757] text-white rounded-md p-0.5 cursor-pointer"}>
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {editingCommentId === comment.id ? (
                                        <div className={"flex items-center gap-2.5 mt-2"}>
                                            <input
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleSaveEditComment()}
                                                autoFocus
                                                className={"flex-1 bg-[#F2F2F2] rounded-[10px] px-3 py-1 text-black text-[16px] focus:outline-none"}
                                            />
                                            <button onClick={handleSaveEditComment} className={"bg-[#D9D9D9] rounded-[10px] px-3 py-1 text-[16px] cursor-pointer shrink-0"}>Valider</button>
                                        </div>
                                    ) : (
                                        <p className={"text-[#9C9C9C] text-[16px] mt-1"}>« {comment.comment} »</p>
                                    )}
                                </div>
                            ))}

                            {comments.length === 0 && (
                                <p className={"text-neutral-400 italic"}>Aucun commentaire pour le moment.</p>
                            )}
                        </div>

                        <div className={"bg-[#F2F2F2] flex items-center justify-between px-4 py-[6px] rounded-[10px] mt-4"}>
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                                placeholder={"Écrire un commentaire"}
                                className={"bg-transparent flex-1 text-black text-[16px] focus:outline-none placeholder:text-[#9C9C9C]"}
                            />
                            <button
                                onClick={handlePostComment}
                                disabled={!newComment.trim() || isPosting}
                                className={"bg-[#D9D9D9] rounded-[10px] px-4 py-[9px] text-[16px] cursor-pointer disabled:opacity-60 shrink-0"}
                            >
                                Publier
                            </button>
                        </div>
                    </div>

                </div>

                <div className={"flex-1"}>

                    <div className={"relative w-full aspect-650/340 rounded-[20px] overflow-hidden shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] bg-[#D9D9D9] border-3 border-solid border-white"}>
                        {recipe.image_url && (
                            <img src={BASE_URL + recipe.image_url} className={"w-full h-full object-cover"} alt="" />
                        )}

                        <div className={"absolute top-4.5 right-3.5 flex flex-col gap-2.5"}>
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
                        {recipe.tags.map((tag, index) => (
                            <Tag key={tag.id} text={tag.name} colorIndex={index} />
                        ))}
                    </div>

                    <div className={"px-[42px] py-[18px] bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] mt-[37px]"}>
                        <h2 className={"text-black text-2xl font-bold font-primary"}>Ingrédients</h2>

                        <ul className={"columns-2 gap-x-[54px] mt-4"}>
                            {
                                recipe.ingredients.map((ingredient) => (
                                    <li key={ingredient.id} className={"flex items-center gap-3 py-2 break-inside-avoid"}>
                                        <div className={"h-5 aspect-square rounded-full bg-[#A2BADE] shrink-0"}></div>
                                        <p className={"text-black text-base font-normal"}>{Number(ingredient.quantity) > 0 && <>{Number(ingredient.quantity)}{(ingredient.unit === "unité") ? "" : ingredient.unit}  </>}{ingredient.name}</p>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>

                    {canEditRecipes && (
                        <div className={"flex justify-end gap-4 mt-[37px]"}>
                            <button
                                onClick={() => navigate(`/recipe/${recipe.id}/edit`)}
                                className={"bg-primary rounded-[10px] px-4 py-[7px] text-[20px] font-[700] text-black cursor-pointer"}
                            >
                                Modifier la recette
                            </button>
                            <button
                                onClick={() => setIsDeletePopupOpen(true)}
                                className={"bg-[#FF5757] rounded-[10px] px-4 py-[7px] text-[20px] font-[700] text-white cursor-pointer"}
                            >
                                Supprimer la recette
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <Popup isOpen={isDeletePopupOpen} onClose={() => setIsDeletePopupOpen(false)}>
                <h2 className="text-xl font-bold mb-4 text-center">Adieu, petite recette !</h2>
                <p className={"text-neutral-400 text-base font-normal"}>
                    Es-tu sûr(e) de vouloir supprimer cette recette ?<br/>
                    Cette action est définitive et la recette ne pourra pas être récupérée. <br/><br/>

                    Clique sur « Supprimer la recette » pour confirmer.
                </p>
                <div className={"flex justify-center gap-8 mt-8"}>
                    <Button text={"Annuler"} variant={"blue"} onClick={() => setIsDeletePopupOpen(false)} />
                    <button className={"bg-[#FF5757] rounded-[10px] px-4 py-[7px] flex items-center justify-center gap-2 text-center text-[20px] font-[700] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"} onClick={handleDeleteRecipe} disabled={isDeleting}>
                        {isDeleting ? "Suppression..." : "Supprimer la recette"}
                    </button>
                </div>
            </Popup>

            <Popup isOpen={isPlanPopupOpen} onClose={() => setIsPlanPopupOpen(false)}>
                <div className={"w-[380px]"}>
                    <div className={"flex items-center justify-center gap-4"}>
                        <ButtonCircleIcon variant={"purple"} icon={<ChevronLeft width={16} height={16} />} onClick={handlePrevMonth} />
                        <h2 className={"text-xl font-bold text-center capitalize"}>
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
