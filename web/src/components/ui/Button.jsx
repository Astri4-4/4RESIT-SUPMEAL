
const variants = {
    "primary": "hover:bg-primary hover:border-transparent",
    "blue": "hover:bg-[#6EA8FE] hover:border-transparent",
    "ghost": "hover:bg-black hover:border-transparent hover:text-white",
}

export default function Button({icon=null, text, textSize="20", weight="700", variant="primary", trailing, onClick=() => {}, active=true,  ...props}) {

    return (
        <div className={` ${(active) ? variants[variant] : ""} ${active ? "cursor-pointer" : ""} transition border border-black rounded-[10px] px-4 py-[7px] flex items-center justify-center gap-2 group ` + " " + props.className} onClick={(active ? onClick : null)}>
            {
                icon && (
                    <span className={variant === "primary" ? "group-hover:text-black" : "group-hover:text-white"}>
                        {icon}
                    </span>
                )
            }
            <p className={`text-center text-[${textSize}px] font-[${weight}] ${(variant === "primary" && active)  ? "group-hover:text-black" : (active) ? "group-hover:text-white" : ""}`} >{
                text
            }</p>

            {
                trailing && (
                    <span className={variant === "primary" ? "group-hover:text-black" : "group-hover:text-white"}>
                        {trailing}
                    </span>
                )
            }

        </div>
    )

}