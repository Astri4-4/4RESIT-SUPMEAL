import {useEffect, useRef, useState} from "react";
import {MessageCircleReply, Send, X} from "@boxicons/react";
import {useAuth} from "../context/AuthContext.jsx";
import useCookbookChat from "../hooks/useCookbookChat.js";

function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a, b) => a.toDateString() === b.toDateString();

    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, yesterday)) return "Hier";
    return date.toLocaleDateString("fr-FR", {day: "numeric", month: "long", year: "numeric"});
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"});
}

function groupMessagesByDay(messages) {
    const groups = [];
    for (const message of messages) {
        const label = formatDateLabel(message.created_at);
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.label === label) {
            lastGroup.messages.push(message);
        } else {
            groups.push({label, messages: [message]});
        }
    }
    return groups;
}

export default function ChatWidget({cookbookId}) {
    const {user} = useAuth();
    const {messages, sendMessage} = useCookbookChat(cookbookId);

    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [draft, setDraft] = useState("");

    const hasLoadedRef = useRef(false);
    const previousLengthRef = useRef(0);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            previousLengthRef.current = messages.length;
            return;
        }

        if (messages.length > previousLengthRef.current) {
            const newMessages = messages.slice(previousLengthRef.current);
            previousLengthRef.current = messages.length;
            if (!isOpen) {
                const fromOthers = newMessages.filter((message) => message.user_id !== user?.id).length;
                setUnreadCount((count) => count + fromOthers);
            }
        } else {
            previousLengthRef.current = messages.length;
        }
    }, [messages, isOpen, user?.id]);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
        setUnreadCount(0);
    };

    const handleSend = () => {
        const content = draft.trim();
        if (!content) return;
        sendMessage(content);
        setDraft("");
    };

    if (!cookbookId) return null;

    if (!isOpen) {
        return (
            <button
                onClick={handleOpen}
                className={"fixed bottom-10 right-10 z-50 bg-white rounded-[10px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.2)] flex items-center gap-2.5 px-4 py-[7px] cursor-pointer"}
            >
                <div className={"relative shrink-0"}>
                    <MessageCircleReply size={24} color={"#000"} />
                    {unreadCount > 0 && (
                        <span className={"absolute -top-1.5 -right-1.5 bg-[#FF5757] text-white text-[10px] font-bold leading-none rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
                <p className={"text-black text-[20px] font-bold"}>Messages</p>
            </button>
        );
    }

    const groups = groupMessagesByDay(messages);

    return (
        <div className={"fixed bottom-10 right-10 z-50 bg-white w-[400px] h-[566px] rounded-[10px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden"}>
            <div className={"flex items-center justify-between px-4 pt-[18px] pb-2.5 shrink-0"}>
                <p className={"text-black text-2xl font-bold font-primary"}>Messages</p>
                <button onClick={() => setIsOpen(false)} className={"text-[#9C9C9C] cursor-pointer shrink-0"}>
                    <X size={20} />
                </button>
            </div>

            <div ref={scrollRef} className={"flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3"}>
                {groups.length === 0 && (
                    <p className={"text-neutral-400 italic text-sm m-auto"}>Aucun message pour le moment.</p>
                )}

                {groups.map((group, groupIndex) => (
                    <div key={groupIndex} className={"flex flex-col gap-3"}>
                        <div className={"flex items-center gap-2.5"}>
                            <div className={"flex-1 h-px bg-[#D9D9D9]"}></div>
                            <p className={"text-[#9C9C9C] text-xs shrink-0"}>{group.label}</p>
                            <div className={"flex-1 h-px bg-[#D9D9D9]"}></div>
                        </div>

                        {group.messages.map((message) => {
                            const isMine = message.user_id === user?.id;
                            return (
                                <div key={message.id} className={`flex flex-col gap-1 max-w-[85%] ${isMine ? "self-end items-end" : "self-start items-start"}`}>
                                    <p className={"text-[#9C9C9C] text-xs"}>{isMine ? "Moi" : message.username}</p>
                                    <div
                                        className={`px-4 py-2.5 text-[15px] whitespace-pre-wrap break-words ${
                                            isMine
                                                ? "bg-[#6EA8FE] text-white rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[10px]"
                                                : "bg-[#E8F1FF] text-black rounded-tl-[10px] rounded-tr-[10px] rounded-br-[10px]"
                                        }`}
                                    >
                                        {message.message}
                                    </div>
                                    <p className={"text-[#9C9C9C] text-xs"}>{formatTime(message.created_at)}</p>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className={"px-4 pb-[18px] pt-2 shrink-0"}>
                <div className={"bg-[#F2F2F2] flex items-center justify-between px-4 py-[6px] rounded-[10px]"}>
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={"Écrire un message"}
                        maxLength={500}
                        className={"bg-transparent flex-1 text-black text-[16px] focus:outline-none placeholder:text-[#9C9C9C]"}
                    />
                    <button onClick={handleSend} disabled={!draft.trim()} className={"shrink-0 cursor-pointer disabled:opacity-40"}>
                        <Send size={24} color={"#9C9C9C"} />
                    </button>
                </div>
            </div>
        </div>
    );
}
