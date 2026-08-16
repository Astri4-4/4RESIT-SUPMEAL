import {X} from "@boxicons/react"

export default function Popup({children, onClose, isOpen, ...props}) {

    return (
        isOpen && (
            <div className="absolute flex justify-center items-center top-0 left-0 w-full h-full bg-black/20">
                <div className={"relative bg-white rounded-[20px]"} >
                    <button className="absolute top-3.25 right-3.25 bg-[#FF5757] text-white rounded-md cursor-pointer" onClick={onClose}>
                        <X size={24} />
                    </button>
                    <div className={"py-13.5 px-16"}>
                        {children}
                    </div>
                </div>
            </div>
        )
    )

}