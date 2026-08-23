import Button from "./Button.jsx";
import {ChevronRight} from "@boxicons/react";
import {BASE_URL} from "../../api/client.js";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import cookbookApi from "../../api/cookbook.js";


export default function CookbookVerticalCard({cookbook, ...props}) {

    const [members, setMembers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const response = await cookbookApi.getMemberCookbook(cookbook.id);
            setMembers(response);
        })()
    }, []);

    return (
        <div className={"shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] w-full max-w-[200px] rounded-[20px]"}>
            <div className={"w-full aspect-square rounded-[20px] p-1 overflow-hidden "}>
                <img src={BASE_URL + cookbook.image_url} className={"w-full h-full rounded-[16px] object-cover"} alt=""/>
            </div>
            <div className={"p-2.5"} >
                <h3 className={"text-black font-bold font-primary"} >{cookbook.title}</h3>
                <p className={"mt-2 text-neutral-400 "} >{members.length} membre{(members.length > 1) ? "s" : ""}</p>
                <Button text={"Voir le cookbook"} textSize={"12"} variant={"blue"} trailing={<ChevronRight/>} className={"mt-4"} onClick={() => navigate(`/cookbooks/${cookbook.id}`)} />
            </div>
        </div>
    )
}