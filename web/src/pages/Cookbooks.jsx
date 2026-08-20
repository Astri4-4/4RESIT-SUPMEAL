import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import Input from "../components/ui/Input.jsx";
import FilterMenu from "../components/ui/FilterMenu.jsx";
import CookbookVerticalCard from "../components/ui/CookbookVerticalCard.jsx";
import cookbookApi from "../api/cookbook.js";
import {Search, Plus} from "@boxicons/react";

const SORT_OPTIONS = [
    {key: "date", label: "Date de création"},
    {key: "name", label: "Nom"},
];

export default function Cookbooks() {

    const navigate = useNavigate();

    const [cookbooks, setCookbooks] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [order, setOrder] = useState("asc");

    useEffect(() => {
        (async () => {
            const userCookbooks = await cookbookApi.getUserCookbook(100);
            setCookbooks((userCookbooks || []).slice().reverse());
        })()
    }, []);

    const filteredCookbooks = cookbooks.filter((cookbook) => cookbook.title.toLowerCase().includes(search.trim().toLowerCase()));

    const displayedCookbooks = [...filteredCookbooks].sort((a, b) => {
        if (!sortBy) return 0;

        let diff = 0;
        switch (sortBy) {
            case "date":
                diff = new Date(a.created_at) - new Date(b.created_at);
                break;
            case "name":
                diff = a.title.localeCompare(b.title);
                break;
        }

        return order === "desc" ? -diff : diff;
    });

    return (
        <div>
            <Breadcrumb path={[{label: "Accueil", link: "/dashboard"}, {label: "Cookbooks", link: "/cookbooks"}, {label: "Tous mes cookbooks !", link: "/cookbooks/all"}]} />

            <div className={"flex flex-col items-center gap-8 mt-6"}>
                <h1 className={"font-primary text-[32px] font-bold text-center"}>L’intégralité de tes cookbooks au même endroit</h1>
                <div className={"w-[54%] flex gap-3.75"}>
                    <Input
                        placeholder="Rechercher un cookbook"
                        className={"flex-1"}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        trailing={<Search color="#9C9C9C" width={24} height={24} />}
                    ></Input>
                    <FilterMenu sortBy={sortBy} order={order} onSortByChange={setSortBy} onOrderChange={setOrder} options={SORT_OPTIONS} />
                </div>
            </div>

            <div className={"flex flex-wrap gap-[75px] justify-start mt-8"}>
                <div className={"group w-[200px] h-[319px] flex flex-col justify-center items-center rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] p-1 border-2 border-dotted border-[#9C9C9C] hover:bg-[#F5F5F5] transition cursor-pointer"} onClick={() => navigate("/cookbooks/create")}>
                    <Plus color="#9C9C9C" width={85} height={85} />
                    <p className={"text-black text-xl font-bold group-hover:font-bold font-secondary w-28 text-center mt-8"}>Créer un cookbook</p>
                </div>
                {displayedCookbooks.map((cookbook) => (
                    <CookbookVerticalCard key={cookbook.id} cookbook={cookbook} />
                ))}
            </div>
        </div>
    )

}
