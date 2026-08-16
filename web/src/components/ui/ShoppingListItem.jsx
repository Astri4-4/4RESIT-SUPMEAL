
export default function ShoppingListItem({item, ...props}) {
    return (
        <div className={"flex gap-3.25 items-start shrink-0 w-[150px]"}>
            <div className={"h-5 aspect-square rounded-full border border-black"} ></div>
            <p className={"text-[16px] min-h-full w-fit"} >{Number(item.quantity) > 0 && <>{Number(item.quantity)}{(item.unit === "unité") ? "" : item.unit}  </>}{item.name}</p>
        </div>
    )
}