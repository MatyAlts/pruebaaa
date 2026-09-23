"use client";

import { Container, Row, Col } from "react-bootstrap";
import Reveal from "./Reveal";

export default function AboutUs() {
  return (
    <section id="quienes-somos" className="py-5">
      <Container>
        <Reveal>
          <h2 className="mb-4" style={{ color: "#016390" }}>
            Quiénes somos
          </h2>
        </Reveal>

        <Reveal>
          <Row className="justify-content-center">
            <Col lg={8}>
              <p className="mb-4" style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
                <strong>Mi Saluteca</strong> nace de una necesidad real: ayudar a nuestros seres queridos a organizar su historial médico y compartirlo de forma segura.
              </p>

              <p className="mb-4" style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
                Sabemos lo frustrante que es buscar estudios antiguos entre carpetas y papeles, o tener que llevar pilas de documentos a cada consulta médica. Por eso creamos una solución simple y accesible, pensada especialmente para adultos mayores y sus familias.
              </p>

              <p className="mb-4" style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
                Somos un equipo comprometido con la privacidad y la transparencia. Este es un MVP que estamos mejorando continuamente, siempre con el foco en la seguridad de tus datos y la facilidad de uso.
              </p>

              <div className="mt-5">
                <div className="p-4" style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  borderLeft: "4px solid #0d9488"
                }}>
                  <p className="mb-2" style={{ fontSize: "1.1rem", fontWeight: 600, color: "#016390" }}>
                    Nuestra misión
                  </p>
                  <p className="mb-0" style={{ fontSize: "1rem", lineHeight: "1.7" }}>
                    Hacer que el acceso y la gestión de información de la salud sea simple, segura y práctica. Creemos que cada familia debería poder acceder a su historial médico en cualquier momento y en cualquier lugar.
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Reveal>
      </Container>
    </section>
  );
}
