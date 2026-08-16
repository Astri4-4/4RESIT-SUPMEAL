

export default function DisabledButton({text, disabled=true, textSize="20", weight="700",  ...props}) {
    return (
        <button className={`transition border border-black rounded-[10px] px-4 py-[7px] flex items-center justify-center gap-2 group ${disabled ? "cursor-not-allowed" : "cursor-pointer bg-primary border-0"}`} {...props}>
            <p className={`text-center text-[${textSize}px] font-[${weight}] group-hover:text-black`} >{text}</p>
        </button>
    )
}