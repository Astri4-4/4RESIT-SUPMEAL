import {useNavigate} from "react-router-dom";

export default function Breadcrumb({path, ...props}) {

    const navigate = useNavigate();

    const last = path[path.length - 1];
    const remaining = path.slice(0, path.length - 1);

    return (
        <p className={"text-[14px]"} >{
            remaining.map((item, index) => (
                <span key={index} onClick={() => navigate(item.link)} className={"text-[14px] text-[#9C9C9C] cursor-pointer"} >{item.label} / </span>
            ))
        }{last.label}</p>

    )

}