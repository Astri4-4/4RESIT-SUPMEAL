import {HomeAlt2, BowlHot, BookLibrary, UserCircle, Robot} from "@boxicons/react";
import {useNavigate} from "react-router-dom";

const variants = {
    "dashboard": "bg-green",
    "recipes": "bg-[#FFE7C5]",
    "account": "bg-[#F6EBFF]",
    "cookbooks": "bg-[#E8F1FF]",
    "ai": "bg-[#E8F1FF]"
}

export default function Navbar({page, children, ...props}) {

    const navigate = useNavigate();

    return (
        <div className={"w-screen h-screen flex " + variants[page]} >

            <div className={"w-42.5 h-screen py-8.75 flex flex-col items-between justify-between"} >
                <div>
                    <div className={"mb-25 flex justify-center bg-white mx-5 rounded-full aspect-square"} >
                        <img src="/favicon.svg" className={"rounded-full w-[40px] bg-white"} alt="favicon"/>
                    </div>

                    <div className={"w-full flex flex-col gap- justify-center px-5"} >

                        <div onClick={() => navigate("/dashboard")} className={`${(page === "dashboard") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#B7E4AA]" : "text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25 cursor-pointer`} >
                            <HomeAlt2 width={48} height={48} />
                            <p className={`${(page === "dashboard") ? "font-bold" : ""} text-[16px]`} >Accueil</p>
                        </div>

                        <div onClick={() => navigate("/recipes")} className={`${(page === "recipes") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#FFB857]" : " text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25 cursor-pointer`} >
                            <BowlHot width={48} height={48}/>
                            <p className={`${(page === "recipes") ? "font-bold" : ""} text-[16px]`} >Recettes</p>
                        </div>

                        <div onClick={() => navigate("/cookbooks")} className={`${(page === "cookbooks") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#A2BADE]" : " text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25 cursor-pointer`} >
                            <BookLibrary width={48} height={48}/>
                            <p className={`${(page === "cookbooks") ? "font-bold" : ""} text-[16px]`} >Cookbooks</p>
                        </div>

                        <div onClick={() => navigate("/ai")} className={`${(page === "ai") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#A2BADE]" : " text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25 cursor-pointer`} >
                            <Robot width={48} height={48}/>
                            <p className={`${(page === "ai") ? "font-bold" : ""} text-[16px]`} >AI</p>
                        </div>

                    </div>
                </div>

                <div className={"px-5"}>
                    <div onClick={() => navigate("/account")} className={`${(page === "account") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-purple" : "text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25 cursor-pointer`} >
                        <UserCircle width={48} height={48} />
                        <p className={`${(page === "account") ? "font-bold" : ""} text-[16px]`} >Mon compte</p>
                    </div>
                </div>

            </div>

            <div className={"flex-1 relative min-h-screen bg-white shadow-[0px_8px_22px_0px_rgba(0,0,0,0.10)] py-8.75 px-16 overflow-y-auto"} >
                {children}
            </div>
        </div>
    )

}