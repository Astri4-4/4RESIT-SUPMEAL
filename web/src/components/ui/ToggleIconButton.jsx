

export default function ToggleIconButton({activeColor, inactiveColor, icon, isActive, onClick, ...props}) {

    return (
        <div onClick={onClick} className={`w-8 aspect-square bg-white rounded-[6px] flex justify-center items-center cursor-pointer ${props.className}`} >
            {icon}
        </div>
    )


}