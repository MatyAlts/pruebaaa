"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageMagnifierProps {
    src: string;
    alt?: string;
    /** Zoom factor inside the lens (default 2.5) */
    zoomLevel?: number;
    /** Diameter of the magnifier lens in px (default 180) */
    lensSize?: number;
    /** Additional className for the wrapper */
    className?: string;
    /** Additional style for the wrapper */
    style?: React.CSSProperties;
}

export default function ImageMagnifier({
    src,
    alt = "Imagen",
    zoomLevel = 1.8,
    lensSize = 120,
    className = "",
    style = {},
}: ImageMagnifierProps) {
    const [showLens, setShowLens] = useState(false);
    const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
    const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleImageLoad = useCallback(() => {
        if (imgRef.current) {
            setImgNaturalSize({
                w: imgRef.current.naturalWidth,
                h: imgRef.current.naturalHeight,
            });
        }
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current || !imgRef.current) return;

            const rect = imgRef.current.getBoundingClientRect();

            // Cursor position relative to the rendered image
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Clamp inside the image bounds
            const clampedX = Math.max(0, Math.min(x, rect.width));
            const clampedY = Math.max(0, Math.min(y, rect.height));

            // Position the lens centered on cursor
            setLensPos({
                x: e.clientX - containerRef.current.getBoundingClientRect().left - lensSize / 2,
                y: e.clientY - containerRef.current.getBoundingClientRect().top - lensSize / 2,
            });

            // Background offset so the zoomed region stays under the cursor
            const bgX = (clampedX / rect.width) * imgNaturalSize.w * zoomLevel - lensSize / 2;
            const bgY = (clampedY / rect.height) * imgNaturalSize.h * zoomLevel - lensSize / 2;

            setBgPos({ x: bgX, y: bgY });
        },
        [imgNaturalSize, lensSize, zoomLevel]
    );

    const handleMouseEnter = useCallback(() => setShowLens(true), []);
    const handleMouseLeave = useCallback(() => setShowLens(false), []);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: "relative",
                cursor: showLens ? "none" : "zoom-in",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                ...style,
            }}
            onMouseMove={isMobile ? undefined : handleMouseMove}
            onMouseEnter={isMobile ? undefined : handleMouseEnter}
            onMouseLeave={isMobile ? undefined : handleMouseLeave}
        >
            {/* The original image */}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                    objectFit: "contain",
                    maxHeight: "600px",
                    maxWidth: "100%",
                    userSelect: "none",
                    display: "block",
                }}
            />

            {/* Magnifier lens */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: `${lensPos.x}px`,
                    top: `${lensPos.y}px`,
                    width: `${lensSize}px`,
                    height: `${lensSize}px`,
                    borderRadius: "50%",
                    border: "3px solid rgba(1, 99, 144, 0.6)",
                    boxShadow:
                        "0 0 0 1px rgba(255,255,255,0.5), 0 8px 32px rgba(0,0,0,0.25), inset 0 0 30px rgba(255,255,255,0.08)",
                    backgroundImage: `url(${src})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${imgNaturalSize.w * zoomLevel}px ${imgNaturalSize.h * zoomLevel}px`,
                    backgroundPosition: `-${bgPos.x}px -${bgPos.y}px`,
                    pointerEvents: "none",
                    zIndex: 50,
                    opacity: showLens ? 1 : 0,
                    transform: showLens ? "scale(1)" : "scale(0.6)",
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                    // Subtle crosshair in center of lens
                    backgroundBlendMode: "normal",
                }}
            >
                {/* Center crosshair */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            width: "1px",
                            height: "16px",
                            background: "rgba(1, 99, 144, 0.4)",
                            position: "absolute",
                            left: "50%",
                            top: "-8px",
                            transform: "translateX(-50%)",
                        }}
                    />
                    <div
                        style={{
                            width: "16px",
                            height: "1px",
                            background: "rgba(1, 99, 144, 0.4)",
                            position: "absolute",
                            top: "50%",
                            left: "-8px",
                            transform: "translateY(-50%)",
                        }}
                    />
                </div>
            </div>

            {/* Hint badge — only on desktop, hidden on touch devices */}
            {!showLens && !isMobile && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        background: "rgba(1, 99, 144, 0.85)",
                        backdropFilter: "blur(8px)",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        padding: "5px 10px",
                        borderRadius: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        animation: "magnifierHintPulse 2.5s infinite ease-in-out",
                    }}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            cx="11"
                            cy="11"
                            r="7"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <path
                            d="M16.5 16.5L21 21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path
                            d="M8 11H14M11 8V14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                    Pasá el mouse para ampliar
                </div>
            )}

            {/* Keyframe for hint pulse */}
            <style>{`
                @keyframes magnifierHintPulse {
                    0%, 100% { opacity: 0.85; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}
