const COLORS = [
    {bg: "#F3FFEB", border: "#B7E4AA"}, // vert
    {bg: "#F6EBFF", border: "#E5C7FF"}, // violet
    {bg: "#E8F1FF", border: "#A2BADE"}, // bleu
];

export default function Tag({text, colorIndex = 0, ...props}) {

    const {bg, border} = COLORS[colorIndex % COLORS.length];

    return (
        <div
            className={"px-4 py-2 rounded-[10px] border font-bold text-[16px] text-black whitespace-nowrap"}
            style={{backgroundColor: bg, borderColor: border}}
            {...props}
        >
            {text}
        </div>
    )

}
