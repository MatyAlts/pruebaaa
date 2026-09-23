"use client";

import { Container, Row, Col, Button } from "react-bootstrap";
import Reveal from "../Reveal/Reveal";
import styles from "./FinalCTA.module.css";

export default function FinalCTA() {
  return (
    <section className={`premium-section ${styles.finalCtaSection}`}>
      {/* Gradient accents */}
      <div className={styles.gradientAccent}></div>

      <div className="premium-container position-relative" style={{ zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Reveal>
              <h2 className={`fw-bold mb-4 ${styles.title}`}>
                Empezá en minutos.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className={styles.description}>
                Tu historial médico organizado, seguro y siempre disponible.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <Button
                size="lg"
                href="/app"
                className={`${styles.btnCtaFinal} px-5 py-3`}
              >
                Crear cuenta
              </Button>
            </Reveal>
          </Col>
        </Row>
      </div>
    </section>
  );
}
