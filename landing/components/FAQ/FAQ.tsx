"use client";

import { Container, Row, Col, Accordion } from "react-bootstrap";
import Reveal from "../Reveal/Reveal";
import styles from "./FAQ.module.css";

const faqs = [
  {
    question: "¿Qué archivos puedo subir?",
    answer:
      "Podés subir estudios en todo tipo de archivos e imágenes. También podés sacarle una foto desde tu celular al estudio en papel y subirla directo. Son los formatos más comunes que entregan clínicas y laboratorios.",
  },
  {
    question: "¿Qué hace la inteligencia artificial?",
    answer:
      "Cuando subís un estudio, nuestra IA analiza el documento y completa automáticamente el título, la fecha, la institución y genera una observación con los datos más relevantes. Vos podés revisar y editar todo antes de guardarlo.",
  },
  {
    question: "¿Cómo comparto un estudio?",
    answer:
      "Seleccionás el estudio, generás un link temporal y lo enviás por WhatsApp, email o el medio que prefieras. (no poner link temporal) mas simple.",
  },
  {
    question: "¿Puedo revocar acceso?",
    answer:
      "Sí, podés revocar cualquier link con un solo clic desde tu panel, incluso antes de que expire automáticamente.",
  },
  {
    question: "¿Puedo borrar mi cuenta y mis archivos?",
    answer:
      "Sí, podés eliminar tu cuenta y todos tus archivos en cualquier momento. La eliminación es permanente e irreversible.",
  },
  {
    question: "¿Es segura la aplicación?",
    answer: "Sí, sólo tú tienes acceso a tu información.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className={`premium-section ${styles.faqSection}`}>
      <div className="premium-container">
        <Row className="justify-content-center">
          <Col lg={9}>
            <Reveal>
              <h2 className={`fw-semibold mb-5 ${styles.title}`}>
                Preguntas frecuentes
              </h2>
            </Reveal>
            <Reveal>
              <Accordion className={styles.premiumAccordion}>
                {faqs.map((faq, index) => (
                  <Accordion.Item key={index} eventKey={index.toString()}>
                    <Accordion.Header>
                      <strong className={styles.question}>
                        {faq.question}
                      </strong>
                    </Accordion.Header>
                    <Accordion.Body className={styles.answer}>
                      {faq.answer}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Reveal>
          </Col>
        </Row>
      </div>
    </section>
  );
}
