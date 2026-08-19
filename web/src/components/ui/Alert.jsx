

export default function Alert({type, message, ...props}) {

    return (
        <div className={`px-2 py-4 rounded-[10px] border w-fit ${(type === "success") ? "bg-[#F3FFEB] border-[#B7E4AA]" : "bg-[#FFE3E3] border-[#FF5757]"}`} >
            <p className={`text-[20px] ${(type === "success") ? "text-[#81B970]" : "text-[#FF5757]"}`}>{message}</p>
        </div>
    )

}