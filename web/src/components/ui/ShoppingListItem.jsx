import {X} from "@boxicons/react";

const NO_SPACE_UNITS = new Set(["g", "mg", "L", "l", "ml", "cl", "kg"]);

export function formatShoppingListItemLabel(item) {
    const quantity = Number(item.quantity);
    const hasQuantity = quantity > 0;
    const showsUnit = hasQuantity && item.unit && item.unit !== "unité";
    const needsSpace = showsUnit && !NO_SPACE_UNITS.has(item.unit);

    if (!hasQuantity) return item.name;
    return `${quantity}${showsUnit && needsSpace ? " " : ""}${showsUnit ? item.unit : ""} ${item.name}`;
}

export default function ShoppingListItem({item, onRemove, ...props}) {
    return (
        <div className={"group flex gap-3.25 items-start min-w-0"}>
            <button
                onClick={onRemove}
                title={"Retirer de la liste"}
                className={"h-5 aspect-square rounded-full border border-black shrink-0 cursor-pointer flex items-center justify-center hover:bg-[#FF5757] hover:border-[#FF5757] transition"}
            >
                <X className={"opacity-0 group-hover:opacity-100 transition"} color={"white"} width={12} height={12} />
            </button>
            <p className={"text-[16px] min-h-full w-fit"} >{formatShoppingListItemLabel(item)}</p>
        </div>
    )
}