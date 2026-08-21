export function timeAgo(dateString) {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;

    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
}
