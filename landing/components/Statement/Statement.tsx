"use client";

import Reveal from "../Reveal/Reveal";
import styles from "./Statement.module.css";

export default function Statement() {
  return (
    <section className={`premium-section ${styles.statementSection}`}>
      {/* Subtle gradient accent */}
      <div className={styles.gradientAccent}></div>

      <div className="premium-container position-relative" style={{ zIndex: 1 }}>
        <div>
          <Reveal variant="scale" delay={0.1}>
            <h2 className={`fw-bold mb-4 ${styles.title}`}>
              Tus estudios, listos cuando los necesitás.
            </h2>
          </Reveal>
          <Reveal variant="fadeUp" delay={0.3}>
            <p className={styles.description}>
              Organizá, guardá y compartí tu información médica de forma simple y segura.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
