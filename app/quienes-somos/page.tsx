"use client";

import Navbar from "@/landing/components/Navbar";
import Footer from "@/landing/components/Footer";
import Reveal from "@/landing/components/Reveal";
import { Container, Row, Col } from "react-bootstrap";

const team = [
    {
        name: "Agustín Forte",
        role: "Co-Founder",
        bio: "",
        photo: null as string | null,
        initials: "AF",
    },
    {
        name: "Manuel Forte",
        role: "Co-Founder",
        bio: "",
        photo: null as string | null,
        initials: "MF",
    },
    {
        name: "Estrella Sananes",
        role: "Co-Founder",
        bio: "",
        photo: null as string | null,
        initials: "E",
    },
    {
        name: "Maria Caviglia",
        role: "Co-Founder",
        bio: "",
        photo: null as string | null,
        initials: "M",
    },
];

const values = [
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92A8E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>, title: "Privacidad primero", description: "Tus datos son tuyos. No contamos con acceso a los estudios que usted cargue en la app." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92A8E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>, title: "Simplicidad", description: "Cada función está diseñada para ser intuitiva, sin pasos innecesarios, y facilitando la experiencia del usuario." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92A8E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>, title: "Mejora continua", description: "Escuchamos a nuestros usuarios para mejorar el producto constantemente." },
];

export default function QuienesSomosPage() {
    return (
        <>
            <Navbar whiteLogo />

            {/* Hero */}
            <section
                style={{
                    background: "linear-gradient(165deg, #1e2d4d 0%, #2F416A 40%, #3a5280 100%)",
                    paddingTop: "140px",
                    paddingBottom: "80px",
                }}
            >
                <div className="premium-container">
                    <Reveal>
                        <div style={{ maxWidth: "700px" }}>
                            <h1
                                style={{
                                    fontSize: "clamp(2.5rem, 5vw, 4rem)",
                                    fontWeight: 700,
                                    color: "#fff",
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1.1,
                                    marginBottom: "1.5rem",
                                }}
                            >
                                Las personas detrás de{" "}
                                <span style={{ color: "#92A8E0" }}>Mi Saluteca.</span>
                            </h1>
                            <p
                                style={{
                                    fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
                                    color: "rgba(255,255,255,0.75)",
                                    lineHeight: 1.7,
                                }}
                            >
                                Mi Saluteca está conformada por un equipo de profesionales de la salud que trabajan en el rubro desde hace más de 30 años. Creemos que acceder a tu información de salud debería ser tan simple como abrir una app.
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>


            {/* Equipo — white section */}
            <section
                style={{
                    background: "linear-gradient(165deg, #1e2d4d 0%, #2F416A 40%, #3a5280 100%)",
                    padding: "100px 0",
                }}
            >
                <div className="premium-container">
                    <Reveal>
                        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                            <h2
                                style={{
                                    fontSize: "clamp(2rem, 4vw, 3rem)",
                                    fontWeight: 700,
                                    color: "#fff",
                                    letterSpacing: "-0.03em",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                El equipo
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem", margin: 0 }}>
                                Las personas que hacen posible Mi Saluteca
                            </p>
                        </div>
                    </Reveal>

                    <Row className="g-4 justify-content-center">
                        {team.map((member, i) => (
                            <Col key={i} sm={6} lg={3}>
                                <Reveal delay={i * 0.1} variant="fadeUp">
                                    <div
                                        style={{
                                            background: "rgba(255,255,255,0.08)",
                                            borderRadius: "20px",
                                            padding: "2.5rem 2rem",
                                            textAlign: "center",
                                            height: "100%",
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                        }}
                                        className="hover-card"
                                    >
                                        {/* Photo */}
                                        <div
                                            style={{
                                                width: "120px",
                                                height: "120px",
                                                borderRadius: "50%",
                                                margin: "0 auto 1.5rem",
                                                background: member.photo
                                                    ? `url(${member.photo}) center/cover no-repeat`
                                                    : "linear-gradient(135deg, rgba(146,168,224,0.3) 0%, rgba(255,255,255,0.1) 100%)",
                                                border: "4px solid rgba(146,168,224,0.3)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "2rem",
                                                fontWeight: 700,
                                                color: "#92A8E0",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {!member.photo && member.initials}
                                        </div>
                                        <h3
                                            style={{
                                                fontSize: "1.125rem",
                                                fontWeight: 600,
                                                color: "#fff",
                                                marginBottom: "0.5rem",
                                            }}
                                        >
                                            {member.name}
                                        </h3>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                fontSize: "0.8125rem",
                                                fontWeight: 600,
                                                color: "#fff",
                                                background: "rgba(146,168,224,0.2)",
                                                padding: "0.25rem 1rem",
                                                borderRadius: "999px",
                                                marginBottom: "1rem",
                                            }}
                                        >
                                            {member.role}
                                        </span>
                                        {member.bio && (
                                            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9375rem", margin: 0, lineHeight: 1.6 }}>
                                                {member.bio}
                                            </p>
                                        )}
                                    </div>
                                </Reveal>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            {/* Valores — dark section */}
            <section
                style={{
                    background: "#f4f7fb",
                    padding: "100px 0",
                }}
            >
                <div className="premium-container">
                    <Reveal>
                        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                            <h2
                                style={{
                                    fontSize: "clamp(2rem, 4vw, 3rem)",
                                    fontWeight: 700,
                                    color: "#2F416A",
                                    letterSpacing: "-0.03em",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                Nuestros valores
                            </h2>
                        </div>
                    </Reveal>

                    <Row className="g-4 justify-content-center">
                        {values.map((value, i) => (
                            <Col key={i} md={6} lg={4}>
                                <Reveal delay={i * 0.1} variant="fadeUp">
                                    <div
                                        style={{
                                            background: "#fff",
                                            borderRadius: "16px",
                                            padding: "2rem 1.5rem",
                                            height: "100%",
                                            border: "1px solid rgba(146,168,224,0.15)",
                                            borderTop: "3px solid #92A8E0",
                                            boxShadow: "0 2px 12px rgba(47,65,106,0.06)",
                                        }}
                                    >
                                        <div style={{ marginBottom: "1rem" }}>
                                            {value.icon}
                                        </div>
                                        <h3
                                            style={{
                                                fontSize: "1rem",
                                                fontWeight: 600,
                                                color: "#1e2d4d",
                                                marginBottom: "0.5rem",
                                            }}
                                        >
                                            {value.title}
                                        </h3>
                                        <p style={{ margin: 0, color: "#5a6a8a", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                                            {value.description}
                                        </p>
                                    </div>
                                </Reveal>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            {/* Misión — white section */}
            <section
                style={{
                    background: "linear-gradient(165deg, #1e2d4d 0%, #2F416A 40%, #3a5280 100%)",
                    padding: "100px 0",
                }}
            >
                <div className="premium-container">
                    <Reveal>
                        <div
                            style={{
                                maxWidth: "700px",
                                margin: "0 auto",
                                textAlign: "center",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "clamp(2rem, 4vw, 3rem)",
                                    fontWeight: 700,
                                    color: "#fff",
                                    letterSpacing: "-0.03em",
                                    marginBottom: "1.5rem",
                                }}
                            >
                                Nuestra misión
                            </h2>
                            <p
                                style={{
                                    fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
                                    color: "rgba(255,255,255,0.75)",
                                    lineHeight: 1.8,
                                    margin: 0,
                                }}
                            >
                                Hacer que el acceso y la gestión de información de la salud sea simple, segura y práctica. Creemos que cada familia debería poder acceder a su historial médico en cualquier momento y en cualquier lugar.
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </>
    );
}
