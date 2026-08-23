import {X} from "@boxicons/react"

export default function Popup({children, onClose, isOpen, ...props}) {

    return (
        isOpen && (
            <div className="fixed md:absolute flex justify-center items-center top-0 left-0 w-full h-full bg-black/20 p-4 z-50">
                <div className={"relative bg-white rounded-[20px] w-full max-w-[90vw] sm:max-w-fit max-h-[90vh] overflow-y-auto"} >
                    <button className="absolute top-3.25 right-3.25 bg-[#FF5757] text-white rounded-md cursor-pointer" onClick={onClose}>
                        <X size={24} />
                    </button>
                    <div className={"py-10 px-6 sm:py-13.5 sm:px-16"}>
                        {children}
                    </div>
                </div>
            </div>
        )
    )

}