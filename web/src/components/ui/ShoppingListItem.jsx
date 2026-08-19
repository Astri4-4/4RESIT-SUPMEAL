const NO_SPACE_UNITS = new Set(["g", "mg", "L", "l", "ml", "cl", "kg"]);

export default function ShoppingListItem({item, ...props}) {

    const quantity = Number(item.quantity);
    const hasQuantity = quantity > 0;
    const showsUnit = hasQuantity && item.unit && item.unit !== "unité";
    const needsSpace = showsUnit && !NO_SPACE_UNITS.has(item.unit);

    return (
        <div className={"flex gap-3.25 items-start min-w-0"}>
            <div className={"h-5 aspect-square rounded-full border border-black"} ></div>
            <p className={"text-[16px] min-h-full w-fit"} >{hasQuantity && <>{quantity}{showsUnit && needsSpace ? " " : ""}{showsUnit ? item.unit : ""}{" "}</>}{item.name}</p>
        </div>
    )
}