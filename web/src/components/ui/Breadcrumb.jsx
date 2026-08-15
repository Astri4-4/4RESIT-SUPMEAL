

export default function Breadcrumb({path, ...props}) {

    const last = path[path.length - 1];
    const remaining = path.slice(0, path.length - 1);

    return (
        <p className={"text-[14px]"} >{
            remaining.map((item, index) => (
                <a href={item.link} className={"text-[14px] text-[#9C9C9C]"} >{item.label} / </a>
            ))
        }{last.label}</p>

    )

}