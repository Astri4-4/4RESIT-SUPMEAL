const BG_COLOR = '#FFCC80'; // couleur du panneau orange derrière

export default function AuthShape({ children }) {
    return (
        <div className="relative" style={{ width: 1257, height: 1080 }}>
            {/* Panneau principal blanc */}
            <div
                className="absolute bg-white"
                style={{
                    left: 394.5,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderTopLeftRadius: 84,
                    borderBottomLeftRadius: 84,
                }}
            />

            {/* Onglet qui dépasse à gauche */}
            <div
                className="absolute bg-white"
                style={{
                    left: 28,
                    width: 394.5 - 28,
                    top: 398,
                    height: 536 - 398,
                    borderTopLeftRadius: 55,
                    borderBottomLeftRadius: 55,
                }}
            />

            {/* Jonction concave du HAUT : coin sec en (394.5, 398) */}
            <div
                className="absolute"
                style={{
                    left: 364.5,
                    top: 368,
                    width: 30,
                    height: 30,
                    background: `radial-gradient(circle at 100% 100%, ${BG_COLOR} 30px, transparent 30px)`,
                }}
            />

            {/* Jonction concave du BAS : coin sec en (394.5, 536) */}
            <div
                className="absolute"
                style={{
                    left: 364.5,
                    top: 536,
                    width: 30,
                    height: 30,
                    background: `radial-gradient(circle at 100% 0%, ${BG_COLOR} 30px, transparent 30px)`,
                }}
            />

            {/* Contenu par-dessus */}
            <div className="relative z-10 h-full">{children}</div>
        </div>
    );
}