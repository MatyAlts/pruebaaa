"use client";

import Reveal from "../Reveal/Reveal";
import { HiShieldCheck } from "react-icons/hi2";
import styles from "./Privacy.module.css";

export default function Privacy() {
  return (
    <section id="privacidad" className={`premium-section ${styles.privacySection}`}>
      <div className="premium-container">
        <Reveal>
          <div className={styles.privacyContentWrapper}>
            <div className={styles.privacyIconLarge}>
              <HiShieldCheck />
            </div>
            <h2 className={`fw-semibold ${styles.title}`}>
              Cuidamos tu privacidad
            </h2>
            <p className={`${styles.subtitle}`}>
              Garantizamos la confidencialidad de tu información. Vos decidís qué, cuándo y con quién compartir.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
