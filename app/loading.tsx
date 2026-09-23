export default function Loading() {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
        >
            <div style={{ textAlign: "center" }}>
                {/* Pulsing logo */}
                <div
                    style={{
                        width: "56px",
                        height: "56px",
                        margin: "0 auto 1.5rem",
                        animation: "salutecaPulse 1.2s ease-in-out infinite",
                    }}
                >
                    <img
                        src="/images/Logo_Saluteca_AzulNew.png"
                        alt="Cargando"
                        width={56}
                        height={56}
                        style={{ height: "auto", width: "100%" }}
                    />
                </div>

                {/* Loading bar */}
                <div
                    style={{
                        width: "120px",
                        height: "3px",
                        borderRadius: "999px",
                        background: "#e0f2fe",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: "40%",
                            height: "100%",
                            borderRadius: "999px",
                            background: "linear-gradient(90deg, #016390, #0284c7)",
                            animation: "salutecaSlide 1s ease-in-out infinite",
                        }}
                    />
                </div>

                <style>{`
          @keyframes salutecaPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.92); }
          }
          @keyframes salutecaSlide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
            </div>
        </div>
    );
}
