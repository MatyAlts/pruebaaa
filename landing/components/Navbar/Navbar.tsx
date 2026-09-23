"use client";

import { Navbar as BSNavbar, Container, Nav, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginModal from "../LoginModal/LoginModal";
import styles from "./Navbar.module.css";
import heroStyles from "../Hero/Hero.module.css";

export default function Navbar({ whiteLogo = false }: { whiteLogo?: boolean }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // setIsMobile(window.innerWidth <= 768);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { y: -100 }, visible: { y: 0 } }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <BSNavbar
        expand="lg"
        fixed="top"
        className={`${styles.navbarCustom} ${scrolled ? styles.navbarScrolled : ""}`}
      >
        <BSNavbar.Brand
          href="/#home"
          className={`d-flex align-items-center gap-2 ${styles.navbarBrandCustom}`}
        >
          <img
            src={
              whiteLogo && !scrolled && !isMobile
                ? "/images/logoblanco.png"
                : "/images/Logo_Saluteca_AzulNew.png"
            }
            alt="Mi Saluteca"
            width={42}
            height={12}
            style={{ height: "auto" }}
            className={styles.navbarLogo}
          />
          <span className={styles.navbarBrandText}>Mi Saluteca</span>
        </BSNavbar.Brand>
        <BSNavbar.Toggle
          aria-controls="basic-navbar-nav"
          className={styles.navbarTogglerCustom}
        />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-start align-items-lg-center gap-3 mt-3 mt-lg-0">
            <Nav.Link href="/#como-funciona" className={styles.navLinkCustom}>
              Cómo funciona
            </Nav.Link>
            <Nav.Link href="/#beneficios" className={styles.navLinkCustom}>
              Beneficios
            </Nav.Link>
            <Nav.Link
              onClick={() => handleNavigate("/quienes-somos")}
              className={styles.navLinkCustom}
              style={{ cursor: "pointer" }}
            >
              Quiénes somos
            </Nav.Link>

            <Nav.Link href="/#faq" className={styles.navLinkCustom}>
              FAQ
            </Nav.Link>
            <Button
              className={heroStyles.btnHeroPrimary}
              onClick={() => {
                if (status === "authenticated" && session) {
                  router.push("/app");
                } else {
                  setShowModal(true);
                }
              }}
              style={{
                padding: "0.5rem 1.5rem", // Adjust padding for navbar context while keeping the style
                fontSize: "0.9rem",
              }}
            >
              Acceder
            </Button>

            <style>{`
              @keyframes navSpinner {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </Nav>
        </BSNavbar.Collapse>
      </BSNavbar>

      <LoginModal show={showModal} onHide={() => setShowModal(false)} />
    </motion.div>
  );
}
