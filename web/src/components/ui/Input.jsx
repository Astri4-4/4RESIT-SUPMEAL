import {Eye, EyeClosed} from "@boxicons/react"
import {useState} from "react";

export default function Input({icon=null, type="text", ...props}) {

    const [isSeen, setIsSeen] = useState(false);

    return (
        <div className={"border border-[#9C9C9C] bg-[#F2F2F2] py-[7px] px-[16px] rounded-[10px] flex"} >
            {
                icon && (
                    <span className={"mr-[10px]"}>
                        {icon}
                    </span>
                )
            }

            <input type={(type === "password" && isSeen) ? "text" : type} className={"placeholder:text-[#9C9C9C] focus:outline-none flex-1"} {...props} />

            {
                type === "password" && !isSeen && (
                    <Eye color={"#9C9C9C"} onClick={() => setIsSeen(true)} />
                )
            }

            {
                type === "password" && isSeen && (
                    <EyeClosed color={"#9C9C9C"} onClick={() => setIsSeen(false)} />
                )
            }

        </div>
    )

}