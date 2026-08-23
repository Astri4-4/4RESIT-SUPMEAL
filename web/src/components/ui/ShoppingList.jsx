import ShoppingListItem, {formatShoppingListItemLabel} from "./ShoppingListItem.jsx";
import recipeApi from "../../api/recipe.js";
import {useEffect, useState} from "react";
import {useAlert} from "../../context/AlertContext.jsx";

function escapeICSText(text) {
    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

function formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildShoppingListICS(list) {
    const now = formatICSDate(new Date());
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SupMeal//Liste de courses//FR",
        "CALSCALE:GREGORIAN",
    ];

    list.forEach((item) => {
        lines.push(
            "BEGIN:VTODO",
            `UID:supmeal-shopping-${item.id}@supmeal.app`,
            `DTSTAMP:${now}`,
            `SUMMARY:${escapeICSText(formatShoppingListItemLabel(item))}`,
            "STATUS:NEEDS-ACTION",
            "END:VTODO"
        );
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
}

export default function ShoppingList({...props}) {

    const [list, setList] = useState([]);
    const {showSuccess, showError} = useAlert();

    useEffect(() => {
        async function load() {
            setList(await recipeApi.getShoppingList())
        }
        load()
    }, [])

    const handleRemove = async (itemId) => {
        try {
            await recipeApi.removeFromShoppingList(itemId);
            setList((prev) => prev.filter((item) => item.id !== itemId));
        } catch (error) {
            console.log(error);
            showError(error.message || "Impossible de retirer cet article.");
        }
    };

    const handleExport = () => {
        if (list.length === 0) return;

        try {
            const ics = buildShoppingListICS(list);
            const blob = new Blob([ics], {type: "text/calendar;charset=utf-8"});
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "liste-de-courses.ics";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showSuccess("Liste exportée ! Ouvre le fichier .ics sur ton téléphone pour l'ajouter à tes rappels.");
        } catch (error) {
            console.log(error);
            showError("Impossible d'exporter la liste.");
        }
    };

    return (
        <div className={props.className} >
            <div className={"flex items-center justify-between py-6"}>
                <h2 className={"font-primary text-[28px] font-bold"} >Liste de courses</h2>
                <button
                    onClick={handleExport}
                    disabled={list.length === 0}
                    className={"text-[14px] font-bold text-[#6EA8FE] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"}
                >
                    Exporter (.ics)
                </button>
            </div>

            <div className={"py-5 px-5 sm:py-9 sm:px-9 bg-[#FFF3E3] rounded-[20px] h-100 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-[24px] gap-y-3 content-start overflow-y-auto shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                {list.map((item) => (
                    <ShoppingListItem key={item.id} item={item} onRemove={() => handleRemove(item.id)} ></ShoppingListItem>
                ))}
            </div>

        </div>
    )

}
