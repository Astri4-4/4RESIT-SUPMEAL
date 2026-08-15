import {useEffect, useState} from "react";
import {ChevronLeft, ChevronRight} from "@boxicons/react"
import ButtonCircleIcon from "./ButtonCircleIcon.jsx";
import planApi from "../../api/plan.js";

const weekDays = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

function getMonthGrid(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const start = new Date(year, month, 1 - firstWeekday);

    return Array.from({length: 42}, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
    });
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function Calendar({...props}) {

    const [date, setDate] = useState(new Date());
    const [plannedDates, setPlannedDates] = useState(new Set());
    const today = new Date();

    useEffect(() => {
        async function load() {
            const plan = await planApi.getMyPlan();
            setPlannedDates(new Set((plan.items || []).map(item => item.date.slice(0, 10))));
        }
        load()
    }, [])

    const goToPrevMonth = () => setDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const goToNextMonth = () => setDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const days = getMonthGrid(date);

    return (
        <div>
            <div className={"flex justify-between items-center pt-6"} >
                <h2 className={"font-primary text-[28px] font-bold capitalize"}>
                    {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>

                <div className={"flex gap-6"} >
                        <ButtonCircleIcon variant={"purple"} icon={<ChevronLeft></ChevronLeft>} onClick={goToPrevMonth} ></ButtonCircleIcon>
                        <ButtonCircleIcon variant={"purple"} icon={<ChevronRight></ChevronRight>} onClick={goToNextMonth} ></ButtonCircleIcon>
                </div>

            </div>

            <div className={"bg-[#FBF6FF] rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] px-10.5 pt-8.5 pb-5 mt-6"} >

                <div className={"grid grid-cols-7"} >
                    {weekDays.map(day => (
                        <div key={day} className={"h-15 flex items-center justify-center font-bold text-[20px]"} >
                            {day}
                        </div>
                    ))}
                </div>

                <div className={"grid grid-cols-7"} >
                    {days.map(day => {
                        const isCurrentMonth = day.getMonth() === date.getMonth();
                        const isToday = day.toDateString() === today.toDateString();
                        const hasPlan = plannedDates.has(toDateKey(day));

                        return (
                            <div key={day.toISOString()} className={"h-14 flex flex-col items-center justify-center gap-0.5"} >
                                <span
                                    className={`w-10.5 h-10.5 rounded-full flex items-center justify-center text-[20px] transition ${
                                        isCurrentMonth ? "text-black hover:bg-purple cursor-pointer" : "text-[#9C9C9C]"
                                    } ${isToday ? "border border-black font-bold" : "font-normal"}`}
                                >
                                    {day.getDate()}
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full ${hasPlan ? "bg-purple" : "invisible"}`} ></div>
                            </div>
                        );
                    })}
                </div>

            </div>

        </div>
    )

}