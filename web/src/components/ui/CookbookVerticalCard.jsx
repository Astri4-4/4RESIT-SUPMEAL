import Button from "./Button.jsx";
import {ChevronRight} from "@boxicons/react";
import {BASE_URL} from "../../api/client.js";
import {useEffect, useState} from "react";
import cookbookApi from "../../api/cookbook.js";


export default function CookbookVerticalCard({cookbook, ...props}) {

    const [members, setMembers] = useState([]);

    useEffect(() => {
        (async () => {
            const response = await cookbookApi.getMemberCookbook(cookbook.id);
            setMembers(response);
        })()
    }, []);

    return (
        <div className={"shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] w-[200px] rounded-[20px]"}>
            <div className={"w-[200px] h-[200px] rounded-[20px] p-1 overflow-hidden "}>
                <img src={BASE_URL + cookbook.image_url} className={"rounded-[16px] object-cover min-h-[200px]"} alt=""/>
            </div>
            <div className={"p-2.5"} >
                <h3 className={"text-black font-bold font-primary"} >{cookbook.title}</h3>
                <p className={"mt-2 text-neutral-400 "} >{members.length} membre{(members.length > 1) ? "s" : ""}</p>
                <Button text={"Voir le cookbook"} textSize={"12"} variant={"blue"} trailing={<ChevronRight/>} className={"mt-4"} />
            </div>
        </div>
    )
}