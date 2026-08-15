

export default function ToggleIconButton({activeColor, inactiveColor, icon, isActive, onClick, onMouseEnter, onMouseLeave, ...props}) {

    return (
        <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={`w-10 aspect-square bg-white rounded-[6px] flex justify-center items-center cursor-pointer ${props.className}`} >
            {icon}
        </div>
    )


}