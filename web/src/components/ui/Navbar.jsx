import {HomeAlt2, BowlHot, BookLibrary, UserCircle, Robot} from "@boxicons/react";
import {useNavigate} from "react-router-dom";

const variants = {
    "dashboard": "bg-green",
    "recipes": "bg-[#FFE7C5]",
    "account": "bg-[#F6EBFF]",
    "cookbooks": "bg-[#E8F1FF]",
    "ai": "bg-[#E8F1FF]"
}

const navItems = [
    {key: "dashboard", label: "Accueil", path: "/dashboard", icon: HomeAlt2, activeClass: "text-[#B7E4AA]"},
    {key: "recipes", label: "Recettes", path: "/recipes", icon: BowlHot, activeClass: "text-[#FFB857]"},
    {key: "cookbooks", label: "Cookbooks", path: "/cookbooks", icon: BookLibrary, activeClass: "text-[#A2BADE]"},
    {key: "ai", label: "AI", path: "/ai", icon: Robot, activeClass: "text-[#A2BADE]"},
]

const accountItem = {key: "account", label: "Mon compte", path: "/account", icon: UserCircle, activeClass: "text-purple"}

export default function Navbar({page, children}) {

    const navigate = useNavigate();

    return (
        <div className={"min-h-screen md:h-screen flex flex-col md:flex-row " + variants[page]} >

            <div className={"hidden md:flex w-42.5 h-screen py-8.75 flex-col items-between justify-between shrink-0"} >
                <div>
                    <div className={"mb-25 flex justify-center bg-white mx-5 rounded-full aspect-square"} >
                        <img src="/favicon.svg" className={"rounded-full w-[40px] bg-white"} alt="favicon"/>
                    </div>

                    <div className={"w-full flex flex-col gap- justify-center px-5"} >
                        {navItems.map((item) => (
                            <div key={item.key} onClick={() => navigate(item.path)} className={`${(page === item.key) ? `bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] ${item.activeClass}` : "text-[#9C9C9C]"} aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25 cursor-pointer`} >
                                <item.icon width={48} height={48} />
                                <p className={`${(page === item.key) ? "font-bold" : ""} text-[16px]`} >{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={"px-5"}>
                    <div onClick={() => navigate(accountItem.path)} className={`${(page === accountItem.key) ? `bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] ${accountItem.activeClass}` : "text-[#9C9C9C]"} aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25 cursor-pointer`} >
                        <accountItem.icon width={48} height={48} />
                        <p className={`${(page === accountItem.key) ? "font-bold" : ""} text-[16px]`} >{accountItem.label}</p>
                    </div>
                </div>

            </div>

            <div className={"flex-1 relative md:min-h-screen bg-white shadow-[0px_8px_22px_0px_rgba(0,0,0,0.10)] py-6 px-4 sm:px-8 md:py-8.75 md:px-16 pb-24 md:pb-8.75 overflow-y-auto"} >
                {children}
            </div>

            <div className={"md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0px_-4px_20px_0px_rgba(0,0,0,0.10)] flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]"} >
                {[...navItems, accountItem].map((item) => (
                    <div key={item.key} onClick={() => navigate(item.path)} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 cursor-pointer ${(page === item.key) ? item.activeClass : "text-[#9C9C9C]"}`} >
                        <item.icon width={24} height={24} />
                        <p className={`${(page === item.key) ? "font-bold" : ""} text-[10px] whitespace-nowrap`} >{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    )

}
