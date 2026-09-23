"use client";

import { Container, Row, Col } from "react-bootstrap";
import Reveal from "../Reveal/Reveal";
import { HiSparkles, HiLink, HiLockClosed, HiUserGroup } from "react-icons/hi2";
import styles from "./Benefits.module.css";

const benefits = [
  {
    title: "Todo en un solo lugar",
    description: "Subí tu estudio y nuestra IA hace el resto.",
    icon: HiSparkles,
  },
  {
    title: "Compartilos",
    description: "Generá un link y envialo por WhatsApp o email.",
    icon: HiLink,
  },
  {
    title: "Acceso gratuito",
    description: "Usá Mi Saluteca sin costo.",
    icon: HiLockClosed,
  },
  {
    title: "Gestioná tu grupo familiar",
    description:
      "Cargá estudios para tus familiares y tené todo en un solo lugar.",
    icon: HiUserGroup,
  },
];

export default function Benefits() {
  return (
    <section
      id="beneficios"
      className={`premium-section ${styles.benefitsSection}`}
    >
      <div className="premium-container">
        <Reveal>
          <h2 className={`fw-semibold mb-5 ${styles.title}`}>Beneficios</h2>
        </Reveal>
        <Row className="g-4">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <Col key={index} md={6} lg={3}>
                <Reveal delay={index * 0.1} variant="fadeUp" className="h-100">
                  <div
                    className={`${styles.premiumBenefitCard} h-100 d-flex flex-column`}
                  >
                    <div className="mb-4">
                      <IconComponent
                        className={`${styles.icon} ${index % 2 !== 0 ? styles.iconGreen : ""}`}
                      />
                    </div>
                    <h3 className={`fw-bold mb-3 ${styles.benefitTitle}`}>
                      {benefit.title}
                    </h3>
                    <p
                      className={`${styles.benefitDescription} mb-0 flex-grow-1`}
                    >
                      {benefit.description}
                    </p>
                  </div>
                </Reveal>
              </Col>
            );
          })}
        </Row>
      </div>
    </section>
  );
}
