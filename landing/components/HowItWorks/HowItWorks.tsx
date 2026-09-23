"use client";

import { Row, Col } from "react-bootstrap";
import Reveal from "../Reveal/Reveal";
import styles from "./HowItWorks.module.css";

const steps = [
  { number: "1", title: "Subís tus estudios" },
  { number: "2", title: "Se integran con IA" },
  { number: "3", title: "Accedé cuando los necesites" },
  { number: "4", title: "Compartilos con quien desees" },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className={`premium-section ${styles.section}`}>
      <div className="premium-container">
        <Reveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.title}>¿Cómo funciona?</h2>
            <p className={styles.subtitle}>
              En solo 4 pasos tenés toda tu salud organizada y accesible
            </p>
          </div>
        </Reveal>

        <div className={styles.timeline}>
          {steps.map((step, index) => (
            <Reveal key={index} delay={index * 0.18} variant="fadeUp" className={styles.timelineStep}>
              <div className={styles.circleWrap}>
                <div className={styles.circle}>
                  <span className={styles.circleNumber}>{step.number}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={styles.connector} aria-hidden="true" />
                )}
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
