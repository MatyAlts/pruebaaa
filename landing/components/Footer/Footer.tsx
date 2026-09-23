"use client";

import { Container, Row, Col, Modal } from "react-bootstrap";
import { useState } from "react";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <footer className={styles.footer}>
      <div className="premium-container">
        {/* Top section */}
        <div className={styles.footerTop}>
          <Row className="align-items-start">
            {/* Brand column */}
            <Col xs={12} md={5} className="mb-4 mb-md-0">
              <div className={styles.brand}>
                <div className={styles.logoWrap}>
                  <img
                    src="/images/logoblanco.png"
                    alt="Mi Saluteca"
                    width={36}
                    height={36}
                    className={styles.logoImg}
                  />
                  <span className={styles.logoText}>Mi Saluteca</span>
                </div>
                <p className={styles.brandDescription}>
                  Tu historial médico digital. Guardá, organizá y compartí tus
                  estudios de forma simple y segura.
                </p>
              </div>
            </Col>

            {/* Links columns */}
            <Col xs={4} md={2} className="mb-4 mb-md-0">
              <h4 className={styles.columnTitle}>Producto</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#como-funciona" className={styles.link}>
                    Cómo funciona
                  </a>
                </li>
                <li>
                  <a href="#beneficios" className={styles.link}>
                    Beneficios
                  </a>
                </li>
                <li>
                  <a href="#faq" className={styles.link}>
                    FAQ
                  </a>
                </li>
              </ul>
            </Col>

            <Col xs={4} md={2} className="mb-4 mb-md-0">
              <h4 className={styles.columnTitle}>Empresa</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#quienes-somos" className={styles.link}>
                    Quiénes somos
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={styles.link}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowContactModal(true);
                    }}
                  >
                    Contacto
                  </a>
                </li>
              </ul>
            </Col>

            <Col xs={4} md={3}>
              <h4 className={styles.columnTitle}>Legal</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="/privacidad" className={styles.link}>
                    Políticas de privacidad
                  </a>
                </li>
                <li>
                  <a href="/terminos" className={styles.link}>
                    Términos y Condiciones
                  </a>
                </li>
              </ul>
            </Col>
          </Row>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom bar */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {currentYear} Mi Saluteca. Todos los derechos reservados.
          </p>
          <p className={styles.madeWith}>
            Hecho con <em className={styles.greenHeart}>♥</em> en Argentina
          </p>
        </div>
      </div>

      <Modal
        show={showContactModal}
        onHide={() => setShowContactModal(false)}
        centered
      >
        <Modal.Header closeButton style={{ borderBottom: "none" }}>
          <Modal.Title style={{ color: "#2F416A", fontWeight: "700" }}>
            Contacto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center px-4 pb-5 pt-3">
          <div style={{ marginBottom: "1.5rem" }}>
            <span
              style={{
                color: "#4a5568",
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "600",
              }}
            >
              Teléfono
            </span>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#2F416A",
                fontWeight: "500",
                marginTop: "0.2rem",
              }}
            >
              +54 9 11 1234-5678
            </p>
          </div>
          <div>
            <span
              style={{
                color: "#4a5568",
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "600",
              }}
            >
              Email
            </span>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#2F416A",
                fontWeight: "500",
                marginTop: "0.2rem",
                marginBottom: 0,
              }}
            >
              contacto@misaluteca.com
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </footer>
  );
}
