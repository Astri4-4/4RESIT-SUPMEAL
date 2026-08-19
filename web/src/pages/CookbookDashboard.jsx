import CookbookVerticalCard from "../components/ui/CookbookVerticalCard.jsx";
import {useEffect, useState} from "react";
import cookbookApi from "../api/cookbook.js";
import userApi from "../api/user.js";
import {ChevronRight, Plus} from "@boxicons/react";
import Button from "../components/ui/Button.jsx";
import {BASE_URL} from "../api/client.js";
import {useNavigate} from "react-router-dom";

function timeAgo(dateString) {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;

    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
}

function getActivityContent(activity) {
    const recipeTag = {label: activity.recipe_title, color: "#FFB857"};
    const cookbookTag = {label: "Cookbook: " + activity.cookbook_title, color: "#6EA8FE"};
    const image = activity.cookbook_image_url;

    switch (activity.type) {
        case "comment":
            return {
                headline: `${activity.actor_username} a commenté ${activity.recipe_title}`,
                body: activity.excerpt ? `« ${activity.excerpt} »` : null,
                tags: [cookbookTag],
                buttonText: "Voir le commentaire",
                image,
                to: `/recipe/${activity.recipe_id}`,
                height: "h-[150px]"
            };
        case "join":
            return {
                headline: `${activity.actor_username} a rejoint un cookbook`,
                tags: [cookbookTag],
                buttonText: "Voir le cookbook",
                image,
                to: `/cookbooks/${activity.cookbook_id}`,
                height: "h-[130px]"
            };
        case "recipe_added":
            return {
                headline: `${activity.actor_username} a ajouté ${activity.recipe_title}`,
                tags: [cookbookTag],
                buttonText: "Voir la recette",
                image,
                to: `/recipe/${activity.recipe_id}`,
                height: "h-[130px]"
            };
        case "recipe_updated":
            return {
                headline: `${activity.actor_username} a modifié ${activity.recipe_title}`,
                tags: [cookbookTag],
                buttonText: "Voir la recette",
                image,
                to: `/recipe/${activity.recipe_id}`,
                height: "h-[130px]"
            };
        default:
            return null;
    }
}

function ActivityCard({activity, navigate}) {
    const content = getActivityContent(activity);
    if (!content) return null;

    return (
        <div className={"bg-white rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] " + content.height + " shrink-0 flex overflow-hidden"}>
            <div className={"w-[220px] shrink-0 bg-[#D9D9D9]"}>
                {content.image && (
                    <img src={BASE_URL + content.image} className={"w-full h-full object-cover"} alt=""/>
                )}
            </div>

            <div className={"flex-1 p-5 flex flex-col gap-2.5"}>
                <div className={"flex items-start justify-between gap-4"}>
                    <p className={"font-bold text-[16px] line-clamp-1"}>{content.headline}</p>
                    <p className={"text-[#9C9C9C] text-[16px] whitespace-nowrap"}>{timeAgo(activity.created_at)}</p>
                </div>

                {content.body && (
                    <p className={"text-[#9C9C9C] text-[16px] line-clamp-1"}>{content.body}</p>
                )}

                <div className={"flex items-center justify-between gap-4 mt-auto"}>
                    <div className={"flex gap-2.5 flex-wrap"}>
                        {content.tags.filter((tag) => tag.label).map((tag, index) => (
                            <div
                                key={index}
                                className={"bg-white border rounded-[10px] px-4 py-[3px] text-[16px]"}
                                style={{borderColor: tag.color, color: tag.color}}
                            >
                                {tag.label}
                            </div>
                        ))}
                    </div>

                    <Button
                        text={content.buttonText}
                        textSize={"12"}
                        weight={"400"}
                        trailing={<ChevronRight width={16} height={16}/>}
                        onClick={() => navigate(content.to)}
                        className={"shrink-0"}
                        variant={"blue"}
                    />
                </div>
            </div>
        </div>
    )
}

export default function CookbookDashboard() {

    const [cookbooks, setCookbooks] = useState([]);
    const [activities, setActivities] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const userCookbooks = await cookbookApi.getUserCookbook();
            setCookbooks((userCookbooks || []).slice().reverse());
        })()
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const recentActivities = await userApi.getActivities(10);
                setActivities(recentActivities || []);
            } catch (error) {
                console.log(error);
            }
        })()
    }, []);

    return (
        <div className={"px-[85px] py-[27px]"}>
            <p className={"text-neutral-400 text-sm italic"}>Retrouve tes recettes et les dernières activités de tes cookbooks !</p>

            <div className={"mt-6 flex gap-[150px]"} >

                <div className={"w-[30%]"}>
                    <h2 className={"text-3xl font-bold font-primary"}>Mes cookbooks récents</h2>

                    <div className={"mt-[55px] grid grid-cols-2 gap-x-[76px] gap-y-[50px]"}>

                        {cookbooks.slice(0, 3).map((cookbook) => (
                            <CookbookVerticalCard key={cookbook.id} cookbook={cookbook} />
                        ))}
                        <div onClick={() => navigate("/cookbooks/create")} className={"group w-[250px] h-[319px] flex flex-col justify-center items-center rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] p-1 max-w-[200px] border-2 border-dotted border-[#9C9C9C] hover:bg-[#F5F5F5] transition cursor-pointer"}>
                            <Plus color="#9C9C9C" width={85} height={85} />
                            <p className={"text-black text-xl font-bold group-hover:font-bold font-secondary w-28 text-center mt-8"} >Créer un cookbook</p>

                        </div>
                    </div>

                    {
                        cookbooks.length !== 0 && cookbooks.length > 3 && (
                            <div className={"flex justify-center"} >
                                <Button text={"Voir tous mes cookbooks"} variant={"blue"} trailing={<ChevronRight/>} className={"mt-[50px] w-fit"} />
                            </div>
                        )
                    }

                </div>

                <div className={"flex-1"} >
                    <h2 className={"text-3xl font-bold font-primary"}>Dernières activités</h2>

                    <div className={"mt-[55px] flex flex-col gap-[30px] max-h-[700px] overflow-y-auto pr-2"}>
                        {activities.length === 0 && (
                            <p className={"text-neutral-400 italic"}>Aucune activité récente pour le moment.</p>
                        )}
                        {activities.map((activity) => (
                            <ActivityCard key={activity.id} activity={activity} navigate={navigate} />
                        ))}
                    </div>
                </div>

            </div>

        </div>
    )

}
