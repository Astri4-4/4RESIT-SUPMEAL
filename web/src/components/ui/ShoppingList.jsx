import ShoppingListItem from "./ShoppingListItem.jsx";
import recipeApi from "../../api/recipe.js";
import {useEffect, useState} from "react";

export default function ShoppingList({...props}) {

    const [list, setList] = useState([]);

    useEffect(() => {
        async function load() {
            setList(await recipeApi.getShoppingList())
        }
        load()
    }, [])

    return (
        <div className={props.className} >
            <h2 className={"font-primary text-[28px] font-bold py-6"} >Liste de courses</h2>

            <div className={"py-9 px-9 bg-[#FFF3E3] rounded-[20px] h-100 flex flex-wrap gap-x-[47px] gap-y-3 overflow-y-auto shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)]"} >
                {list.map((item, index) => (
                    <ShoppingListItem key={index} item={item} ></ShoppingListItem>
                ))}
            </div>

        </div>
    )

}
