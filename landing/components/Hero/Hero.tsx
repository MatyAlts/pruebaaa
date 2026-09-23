"use client";

import { Container, Row, Col, Button } from "react-bootstrap";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { HiComputerDesktop, HiDevicePhoneMobile } from "react-icons/hi2";
import Reveal from "../Reveal/Reveal";
import LoginModal from "../LoginModal/LoginModal";
import styles from "./Hero.module.css";

export default function Hero() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const scrollToHowItWorks = () => {
    document
      .getElementById("como-funciona")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 500], [0, 150]);
  const contentY = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section
      className={`${styles.heroImageSection} position-relative overflow-hidden`}
      id="home"
    >
      {/* Image Background with Parallax */}
      <motion.div className={styles.heroImageWrapperBg} style={{ y: videoY }}>
        <div
          className={`${styles.heroImageBg} ${styles.heroImageDesktop}`}
          style={{
            backgroundImage: "url('/images/herodesktoponew.png')",
          }}
        ></div>
        <div
          className={`${styles.heroImageBg} ${styles.heroImageMobile}`}
          style={{
            backgroundImage: "url('/images/heronewmobilee2.png')",
          }}
        ></div>
        <div className={styles.heroImageOverlay}></div>
      </motion.div>

      {/* Content with Parallax */}
      <motion.div style={{ y: contentY, opacity }}>
        <Container className={`position-relative ${styles.heroContent}`}>
          <Row className={styles.heroRow}>
            <Col lg={10} xl={9}>
              <Reveal delay={0.2} variant="fadeUp">
                <h1 className={`${styles.heroTitle} mb-2`}>
                  Tu historial de salud,
                  <br className={styles.mobileBreak} /> en un solo lugar.
                </h1>
              </Reveal>

              <Reveal delay={0.4} variant="fadeUp">
                <p className={`${styles.heroSubtitle} mb-3`}>
                  Organizá, guardá y compartí
                  <br className={styles.mobileBreak} /> tu información médica
                  <br className={styles.mobileBreak} /> de forma simple y
                  segura.
                </p>
              </Reveal>

              <Reveal delay={0.5} variant="fadeUp">
                <div className={`mb-4 ${styles.platformStrip}`}>
                  <span className={styles.platformLabel}>Disponible en</span>
                  <div className={styles.platformBadge}>
                    <HiComputerDesktop className={styles.platformIcon} />
                    <span>Web</span>
                  </div>
                  <span className={styles.platformAnd}>&</span>
                  <div className={styles.platformBadge}>
                    <HiDevicePhoneMobile className={styles.platformIcon} />
                    <span>App</span>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.6} variant="fadeIn">
                <div className="d-flex gap-3 flex-wrap justify-content-center justify-content-md-start">
                  <Button
                    onClick={() => {
                      if (status === "authenticated" && session) {
                        router.push("/app");
                      } else {
                        setShowModal(true);
                      }
                    }}
                    className={styles.btnHeroPrimary}
                  >
                    Acceder
                  </Button>
                  <Button
                    onClick={scrollToHowItWorks}
                    className={styles.btnHeroSecondary}
                  >
                    Ver cómo funciona
                  </Button>
                </div>
              </Reveal>
            </Col>
          </Row>
        </Container>
      </motion.div>

      <LoginModal show={showModal} onHide={() => setShowModal(false)} />
    </section>
  );
}
