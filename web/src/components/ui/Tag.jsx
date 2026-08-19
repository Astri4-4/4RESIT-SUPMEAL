const COLORS = [
    {bg: "#F3FFEB", border: "#B7E4AA"}, // vert
    {bg: "#FFEBEB", border: "#FFB8B8"}, // rouge
    {bg: "#FFF3E0", border: "#FFCC80"}, // orange
    {bg: "#FFFBE5", border: "#FFE58A"}, // jaune
    {bg: "#E8F1FF", border: "#A2BADE"}, // bleu
    {bg: "#F6EBFF", border: "#E5C7FF"}, // violet
];

export default function Tag({text, colorIndex = 0, selected = true, ...props}) {

    const {bg, border} = COLORS[colorIndex % COLORS.length];
    const style = selected ? {backgroundColor: bg, borderColor: border} : {backgroundColor: "#F5F5F5", borderColor: "#D9D9D9"};

    return (
        <div
            className={`px-4 py-2 rounded-[10px] border text-[16px] whitespace-nowrap ${selected ? "font-bold text-black" : "font-normal text-[#9C9C9C]"} ${props.onClick ? "cursor-pointer" : ""}`}
            style={style}
            {...props}
        >
            {text}
        </div>
    )

}
