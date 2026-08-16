

export default function ToggleIconButton({activeColor, inactiveColor, icon, isActive, onClick, onMouseEnter, onMouseLeave, hasTooltip=false, tooltip=null, tooltipColor=null, ...props}) {

    return (
        <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={` ${hasTooltip ? "relative group" : ""} w-10 aspect-square bg-white rounded-[6px] flex justify-center items-center cursor-pointer ${props.className}`} >
            {icon}
            {hasTooltip && (
                <div className={`absolute top-1/2 right-full mr-2.5 -translate-y-1/2 px-3 py-2 rounded-[10px]  text-sm font-normal whitespace-nowrap bg-white border ${tooltipColor ? tooltipColor : "border-black text-black"} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} >
                    {tooltip}
                </div>
            )}
        </div>
    )


}