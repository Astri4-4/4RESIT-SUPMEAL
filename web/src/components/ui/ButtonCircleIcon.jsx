const variants = {
    "purple": "hover:bg-purple hover:border-transparent hover:text-black"
}

export default function ButtonCircleIcon({icon, variant, onClick, ...props}) {

    return (
        <div className={`w-6 h-6 rounded-full border border-black flex justify-center items-center transition ${variants[variant] || ""}`} onClick={onClick} {...props} >
            {icon}
        </div>
    )

}