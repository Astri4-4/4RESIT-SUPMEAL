import {HomeAlt2, BowlHot, BookLibrary, UserCircle} from "@boxicons/react";

const variants = {
    "dashboard": "bg-green"
}

export default function Navbar({page, children, ...props}) {

    return (
        <div className={"w-screen h-screen flex " + variants[page]} >

            <div className={"w-42.5 h-screen py-8.75 flex flex-col items-between justify-between"} >
                <div>
                    <div className={"mb-25 flex justify-center"} >
                        <img src="https://placehold.co/80x80" className={"rounded-full"} alt="favicon"/>
                    </div>

                    <div className={"w-full flex flex-col gap- justify-center px-5"} >

                        <div className={`${(page === "dashboard") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#B7E4AA]" : "text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25`} >
                            <HomeAlt2 width={48} height={48} />
                            <p className={`${(page === "dashboard") ? "font-bold" : ""} text-[16px]`} >Accueil</p>
                        </div>

                        <div className={`${(page === "recipes") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#B7E4AA]" : " text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25`} >
                            <BowlHot width={48} height={48}/>
                            <p className={`${(page === "recipes") ? "font-bold" : ""} text-[16px]`} >Recettes</p>
                        </div>

                        <div className={`${(page === "cookbooks") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#B7E4AA]" : " text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25`} >
                            <BookLibrary width={48} height={48}/>
                            <p className={`${(page === "cookbooks") ? "font-bold" : ""} text-[16px]`} >Cookbooks</p>
                        </div>

                    </div>
                </div>

                <div className={`${(page === "profile") ? "bg-white  shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] text-[#B7E4AA]" : "text-[#9C9C9C]" } aspect-square w-full rounded-[25px] flex flex-col items-center justify-center gap-3.25`} >
                    <UserCircle width={48} height={48} />
                    <p className={`${(page === "profile") ? "font-bold" : ""} text-[16px]`} >Mon compte</p>
                </div>

            </div>

            <div className={"flex-1 h-screen bg-white shadow-[0px_8px_22px_0px_rgba(0,0,0,0.10)] py-8.75 px-16"} >
                {children}
            </div>
        </div>
    )

}