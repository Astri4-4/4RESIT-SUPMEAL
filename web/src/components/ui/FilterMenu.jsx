import {useState} from "react";
import Bullet from "./Bullet.jsx";

export const SORT_OPTIONS = [
    {key: "date", label: "Date d'ajout"},
    {key: "preptime", label: "Temps de préparation"},
    {key: "cooktime", label: "Temps de cuisson"},
    {key: "favorite", label: "Favoris"},
];

const ORDER_OPTIONS = [
];

export default function FilterMenu({sortBy, order, onSortByChange, onOrderChange}) {

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={"relative"}>
            <div className={"w-12 aspect-square border-2 border-black rounded-[10px] flex justify-center items-center cursor-pointer"} onClick={() => setIsOpen(!isOpen)}>
                <svg width="33" height="26" viewBox="0 0 33 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.36395 19.1819C6.36395 19.7342 6.81167 20.1819 7.36395 20.1819C7.91624 20.1819 8.36395 19.7342 8.36395 19.1819L7.36395 19.1819L6.36395 19.1819ZM8.07106 0.292959C7.68054 -0.0975647 7.04737 -0.0975647 6.65685 0.292959L0.292885 6.65692C-0.097639 7.04744 -0.0976391 7.68061 0.292885 8.07113C0.68341 8.46166 1.31657 8.46166 1.7071 8.07113L7.36395 2.41428L13.0208 8.07113C13.4113 8.46166 14.0445 8.46166 14.435 8.07113C14.8255 7.68061 14.8255 7.04745 14.435 6.65692L8.07106 0.292959ZM7.36395 19.1819L8.36395 19.1819L8.36395 1.00007L7.36395 1.00007L6.36395 1.00007L6.36395 19.1819L7.36395 19.1819Z" fill="black"/>
                    <path d="M26.5458 6.81836C26.5458 6.26607 26.0981 5.81836 25.5458 5.81836C24.9935 5.81836 24.5458 6.26607 24.5458 6.81836H25.5458H26.5458ZM24.8387 25.7073C25.2292 26.0978 25.8624 26.0978 26.2529 25.7073L32.6168 19.3433C33.0074 18.9528 33.0074 18.3196 32.6168 17.9291C32.2263 17.5386 31.5932 17.5386 31.2026 17.9291L25.5458 23.586L19.8889 17.9291C19.4984 17.5386 18.8652 17.5386 18.4747 17.9291C18.0842 18.3196 18.0842 18.9528 18.4747 19.3433L24.8387 25.7073ZM25.5458 6.81836H24.5458V25.0002H25.5458H26.5458V6.81836H25.5458Z" fill="black"/>
                </svg>
            </div>

            {isOpen && (
                <div className={"absolute top-16 left-0 bg-white w-60 rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.10)] z-10"} >
                    <div className={"py-4 px-3"} >
                        <p className={"text-[#9C9C9C]"}>Trier par</p>
                        <div className={"ml-2 mt-3 flex flex-col gap-[12px]"}>
                            {SORT_OPTIONS.map((option) => (
                                <Bullet
                                    key={option.key}
                                    text={option.label}
                                    active={sortBy === option.key}
                                    onClick={() => onSortByChange(sortBy === option.key ? null : option.key)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )

}
