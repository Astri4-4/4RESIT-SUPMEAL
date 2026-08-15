

export default function DurationTag({duration, ...props}) {

    const convertToHoursAndMinutes = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${(hours > 0) ? `${hours}h` : ''}${(remainingMinutes < 10) ? '0' : ""}${remainingMinutes}${(hours > 0) ? '' : 'min'}`;
    };

    return (
        <div className={"flex justify-center items-center bg-[#F5F5F5] border-2 border-[#D9D9D9] rounded-[9px] w-fit py-1 px-2 " + props.className} >
            <span className={"text-[#9C9C9C] text-[12px]"} >{convertToHoursAndMinutes(duration)}</span>
        </div>
    )
}