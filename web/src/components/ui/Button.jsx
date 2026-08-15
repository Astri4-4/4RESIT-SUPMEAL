
const variants = {
    "primary": "hover:bg-primary hover:border-transparent",
    "blue": "hover:bg-[#6EA8FE] hover:border-transparent",
}

export default function Button({icon=null, text, variant="primary", trailing, ...props}) {

    return (
        <div className={variants[variant] + " transition border border-black rounded-[10px] px-4 py-[7px] flex items-center justify-center gap-4 group cursor-pointer"} {...props}>
            {
                icon && (
                    <span className={variant === "primary" ? "group-hover:text-black" : "group-hover:text-white"}>
                        {icon}
                    </span>
                )
            }
            <p className={`text-center text-[20px] font-[700] ${variant === "primary" ? "group-hover:text-black" : "group-hover:text-white"}`} >{
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