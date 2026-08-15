
export default function ShoppingListItem({item, ...props}) {
    return (
        <div className={"flex gap-3.25 items-center shrink-0 w-[115px]"}>
            <div className={"h-5 aspect-square rounded-full border border-black"} ></div>
            <p className={"text-[16px]"} >{item.name}</p>
        </div>
    )
}