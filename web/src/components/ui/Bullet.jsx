

export default function Bullet({text, active, onClick, ...props}) {

    return (

        <div className={"flex items-center gap-2.5 cursor-pointer"} onClick={onClick} {...props}>
            <div className={"w-5 aspect-square rounded-full border border-[#9C9C9C] p-[2px]"}>
                {
                    active && (
                        <div className={"w-full h-full bg-primary rounded-full"}></div>
                    )
                }
            </div>
            <p>{text}</p>
        </div>

    )

}