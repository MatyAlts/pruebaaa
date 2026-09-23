"use client";

import Navbar from "@/landing/components/Navbar";
import Footer from "@/landing/components/Footer";
import Reveal from "@/landing/components/Reveal";

export default function TerminosPage() {
  return (
    <>
      <Navbar whiteLogo />

      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(165deg, #1e2d4d 0%, #2F416A 40%, #3a5280 100%)",
          paddingTop: "140px",
          paddingBottom: "80px",
        }}
      >
        <div className="premium-container">
          <Reveal>
            <div style={{ maxWidth: "900px" }}>
              <h1
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  marginBottom: "1.5rem",
                  textTransform: "uppercase",
                }}
              >
                Términos y Condiciones de Uso.
              </h1>
              <p
                style={{
                  fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  maxWidth: "560px",
                  margin: 0,
                }}
              >
                Mi Saluteca — Aplicación de Salud Digital<br />
                Última actualización: mayo de 2026 · Versión 1.1
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Secciones de contenido */}
      <section
        style={{
          background: "#f4f7fb",
          padding: "100px 0",
        }}
      >
        <div className="premium-container">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3rem",
            }}
          >
            <Reveal delay={0} variant="fadeUp">
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  <strong>Titular de la Aplicación:</strong> MCO S.A., CUIT 30-69798889-7, con domicilio en Pringles 609, Ciudad Autónoma de Buenos Aires, República Argentina.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Antes de continuar, lea atentamente este documento. Al utilizar esta aplicación, usted acepta los presentes Términos y Condiciones. Si no está de acuerdo con alguna de sus disposiciones, le solicitamos que se abstenga de usarla.
                </p>
              </div>
            </Reveal>

            {/* 1. ACEPTACIÓN DE LOS TÉRMINOS */}
            <Reveal delay={0.05} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  1. ACEPTACIÓN DE LOS TÉRMINOS
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Al acceder y utilizar esta aplicación (en adelante, "la Aplicación"), usted acepta en forma expresa, libre e informada los presentes Términos y Condiciones de Uso (en adelante, "los Términos"), así como nuestra Política de Privacidad. La aceptación de estos Términos constituye un acuerdo vinculante entre usted y MCO S.A., titular de la Aplicación.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  El uso continuado de la Aplicación implica la aceptación plena y sin reservas de todas las disposiciones aquí establecidas, incluyendo cualquier modificación futura debidamente notificada. Si usted es menor de 18 años, deberá contar con la autorización de su representante legal para utilizar el servicio.
                </p>
              </div>
            </Reveal>

            {/* 2. OBJETO Y DESCRIPCIÓN DEL SERVICIO */}
            <Reveal delay={0.1} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  2. OBJETO Y DESCRIPCIÓN DEL SERVICIO
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  La Aplicación tiene por objeto facilitar la carga, almacenamiento, gestión y consulta de información relacionada con la salud del usuario (en adelante, "Datos de Salud"). A través de ella, usted podrá registrar y acceder a su historia clínica digital, cargar estudios médicos, análisis e informes diagnósticos, registrar medicación, tratamientos activos y antecedentes de salud, y compartir su información con profesionales médicos de su confianza cuando así lo decida expresamente.
                </p>
                <div
                  style={{
                    marginTop: "1rem",
                    background: "rgba(122,187,133,0.06)",
                    border: "1px solid rgba(122,187,133,0.2)",
                    borderLeft: "3px solid #7ABB85",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    fontSize: "0.9375rem",
                    color: "#5a6a8a",
                    lineHeight: 1.7,
                    maxWidth: "700px",
                  }}
                >
                  <strong style={{ color: "#5a8f62" }}>Importante:</strong> la Aplicación es una herramienta de gestión de información y no reemplaza la consulta médica profesional, el diagnóstico clínico ni ningún tipo de tratamiento. Cualquier decisión de salud debe tomarse en conjunto con un profesional habilitado.
                </div>
              </div>
            </Reveal>

            {/* 3. TRATAMIENTO DE DATOS PERSONALES Y DATOS DE SALUD */}
            <Reveal delay={0.15} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  3. TRATAMIENTO DE DATOS PERSONALES Y DATOS DE SALUD
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  <strong>MARCO LEGAL APLICABLE</strong><br />
                  El tratamiento de sus datos personales y datos sensibles de salud se rige por la Ley N.º 25.326 de Protección de Datos Personales y sus normas reglamentarias, la Ley N.º 26.529 sobre Derechos del Paciente en su relación con los profesionales e instituciones de salud, y demás normativa vigente en la República Argentina.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  <strong>DATOS QUE SE RECOPILAN</strong><br />
                  Para brindar el servicio, la Aplicación recopila datos de identificación (nombre, apellido, DNI, fecha de nacimiento, correo electrónico y teléfono), datos de salud cargados por usted (diagnósticos, estudios, análisis clínicos, medicamentos, vacunas y antecedentes médicos), y datos técnicos de uso (dirección IP, tipo de dispositivo y sistema operativo), estos últimos utilizados exclusivamente con fines de seguridad y mejora del servicio.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  <strong>FINALIDAD DEL TRATAMIENTO</strong><br />
                  Sus datos serán utilizados únicamente para prestar y mejorar los servicios de la Aplicación, permitirle gestionar y acceder a su propia información de salud, facilitar la comunicación con profesionales sanitarios cuando usted lo autorice de manera expresa e individual, y cumplir con las obligaciones legales y regulatorias vigentes en la República Argentina.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  <strong>CONSENTIMIENTO INFORMADO</strong><br />
                  Conforme a lo dispuesto por la Ley N.º 25.326, los datos sensibles de salud requieren su consentimiento expreso e informado para ser tratados. Al aceptar estos Términos, usted otorga dicho consentimiento. Podrá revocarlo en cualquier momento a través de los canales habilitados en la Aplicación, sin que ello afecte la licitud del tratamiento realizado con anterioridad a la revocación.
                </p>
              </div>
            </Reveal>

            {/* 4. DERECHOS DEL TITULAR DE LOS DATOS */}
            <Reveal delay={0.2} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  4. DERECHOS DEL TITULAR DE LOS DATOS
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  En virtud de la Ley N.º 25.326, usted tiene derecho a acceder a sus datos de forma gratuita al menos cada seis (6) meses, a rectificar información inexacta o incompleta, a cancelar datos que resulten innecesarios o excesivos para la finalidad que justificó su recolección, y a oponerse al tratamiento de sus datos en los casos previstos por la ley. Estos derechos se conocen colectivamente como derechos ARCO.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Para ejercerlos, puede contactarnos a través de misaluteca@gmail.com o mediante la sección "Mi cuenta" dentro de la Aplicación. Daremos respuesta a su solicitud dentro del plazo legal de cinco (5) días hábiles. Si considera que sus derechos han sido vulnerados, puede presentar una denuncia ante la Agencia de Acceso a la Información Pública (AAIP) en www.argentina.gob.ar/aaip.
                </p>
              </div>
            </Reveal>

            {/* 5. GESTIÓN DE GRUPO FAMILIAR */}
            <Reveal delay={0.25} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  5. GESTIÓN DE GRUPO FAMILIAR
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  La Aplicación permite agregar miembros del grupo familiar y gestionar información de salud en su nombre.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Al cargar información correspondiente a un familiar, usted declara bajo juramento que:
                </p>
                <ul
                  style={{
                    paddingLeft: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  <li>(i) Cuenta con el consentimiento expreso e informado de dicha persona para almacenar y gestionar su información médica en la Aplicación.</li>
                  <li>(ii) En el caso de menores de edad o personas declaradas incapaces conforme al Código Civil y Comercial de la Nación, usted ejerce su representación legal.</li>
                  <li>(iii) Es responsable exclusivo ante cualquier reclamo del titular de los datos o de terceros derivado de la ausencia o defecto de dicho consentimiento.</li>
                </ul>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  La Aplicación se reserva el derecho de suspender o cancelar la cuenta ante un reclamo verosímil del titular de los datos.
                </p>
              </div>
            </Reveal>

            {/* 6. SEGURIDAD DE LA INFORMACIÓN */}
            <Reveal delay={0.3} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  6. SEGURIDAD DE LA INFORMACIÓN
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Implementamos medidas técnicas y organizativas adecuadas para proteger sus Datos de Salud frente al acceso no autorizado, la alteración, la divulgación o la destrucción. Entre ellas se incluyen el cifrado de datos en tránsito (TLS/SSL) y en reposo, controles de acceso basados en roles, autenticación segura, auditorías de seguridad periódicas, y políticas internas de confidencialidad para todo el personal con acceso a los datos.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  No obstante, ninguna transmisión por Internet ni sistema de almacenamiento electrónico es completamente infalible. En caso de detectar una brecha de seguridad que afecte sus datos, le notificaremos en el menor plazo posible y tomaremos las medidas correctivas que correspondan, conforme a la normativa vigente.
                </p>
              </div>
            </Reveal>

            {/* 7. PLAZOS DE RETENCIÓN DE DATOS */}
            <Reveal delay={0.35} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  7. PLAZOS DE RETENCIÓN DE DATOS
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Sus datos se conservan conforme a los siguientes plazos:
                </p>
                <ul
                  style={{
                    paddingLeft: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  <li>(i) Mientras su cuenta se encuentre activa, sus datos permanecerán almacenados para permitirle acceder al servicio.</li>
                  <li>(ii) Una vez solicitada la eliminación de su cuenta, sus datos serán borrados del sistema activo de forma inmediata, y eliminados completamente de los respaldos (backups) en un plazo máximo de noventa (90) días.</li>
                  <li>(iii) Los registros técnicos y de seguridad (logs) se conservan por un plazo de doce (12) meses, conforme a obligaciones legales aplicables.</li>
                  <li>(iv) Si requiere la eliminación inmediata de sus datos, incluso de los respaldos, podrá solicitarlo expresamente a misaluteca@gmail.com.</li>
                </ul>
              </div>
            </Reveal>

            {/* 8. COMPARTICIÓN DE DATOS CON TERCEROS */}
            <Reveal delay={0.4} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  8. COMPARTICIÓN DE DATOS CON TERCEROS
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Sus datos personales y de salud no serán vendidos ni cedidos a terceros con fines comerciales bajo ninguna circunstancia. Solo podrán compartirse en los siguientes supuestos: con profesionales de salud, cuando usted otorgue su consentimiento expreso para hacerlo; con proveedores técnicos que colaboran en la operación de la Aplicación (como servicios de almacenamiento en la nube), quienes están contractualmente obligados a mantener la confidencialidad y no pueden utilizar los datos para fines propios; y cuando la divulgación sea requerida por ley, orden judicial o autoridad competente.
                </p>
              </div>
            </Reveal>

            {/* 9. PROCESAMIENTO MEDIANTE INTELIGENCIA ARTIFICIAL */}
            <Reveal delay={0.45} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  9. PROCESAMIENTO MEDIANTE INTELIGENCIA ARTIFICIAL
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Para clasificar y organizar automáticamente sus estudios médicos, la Aplicación utiliza servicios de inteligencia artificial provistos por terceros, actualmente OpenAI Inc., con sede en los Estados Unidos de América.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Esto implica que parte del contenido de sus estudios (texto extraído y/o imágenes) es transmitida temporalmente a los servidores del proveedor para su procesamiento automatizado.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Hemos suscripto un Acuerdo de Procesamiento de Datos (DPA) con dicho proveedor, que establece que su información no será utilizada para el entrenamiento de modelos de inteligencia artificial y será eliminada de sus servidores en un plazo máximo de treinta (30) días.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  La clasificación automática es orientativa y puede contener errores. Usted podrá revisar y corregir manualmente toda la información generada por la inteligencia artificial antes de guardarla.
                </p>
              </div>
            </Reveal>

            {/* 10. TRANSFERENCIA INTERNACIONAL DE DATOS */}
            <Reveal delay={0.5} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  10. TRANSFERENCIA INTERNACIONAL DE DATOS
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Para la prestación del servicio, sus datos pueden ser almacenados o procesados en servidores ubicados fuera de la República Argentina, específicamente en los Estados Unidos de América, donde operan nuestros proveedores de infraestructura tecnológica y servicios de inteligencia artificial.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Estos proveedores se encuentran contractualmente obligados, mediante Acuerdos de Procesamiento de Datos (DPA), a mantener estándares de seguridad y confidencialidad equivalentes o superiores a los exigidos por la legislación argentina, y a no utilizar su información con fines propios.
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Conforme al artículo 12 de la Ley N.º 25.326, al aceptar estos Términos, usted otorga su consentimiento expreso e informado para esta transferencia internacional de datos personales y datos sensibles de salud.
                </p>
              </div>
            </Reveal>

            {/* 11. RESPONSABILIDADES DEL USUARIO */}
            <Reveal delay={0.55} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  11. RESPONSABILIDADES DEL USUARIO
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Al utilizar la Aplicación, usted se compromete a proporcionar información veraz, exacta y actualizada; a mantener la confidencialidad de sus credenciales de acceso y no compartir su cuenta con terceros; a notificar de inmediato cualquier uso no autorizado de su cuenta o vulneración de seguridad que detecte; y a utilizar la Aplicación únicamente para fines lícitos y conforme a la normativa vigente. El incumplimiento de estas obligaciones podrá dar lugar a la suspensión o cancelación de su cuenta.
                </p>
              </div>
            </Reveal>

            {/* 12. LIMITACIÓN DE RESPONSABILIDAD */}
            <Reveal delay={0.6} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  12. LIMITACIÓN DE RESPONSABILIDAD
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  La Aplicación es una herramienta de gestión de información de salud. No asumimos responsabilidad por decisiones médicas o de salud que usted adopte basándose exclusivamente en la información contenida en ella. Nuestra responsabilidad se limita a los daños directos probados que resulten de un incumplimiento imputable a la Aplicación, en los términos del Código Civil y Comercial de la Nación Argentina. Quedan excluidos los daños indirectos, lucro cesante o pérdida de datos derivados de causas ajenas a nuestra voluntad.
                </p>
              </div>
            </Reveal>

            {/* 13. MODIFICACIONES A LOS TÉRMINOS */}
            <Reveal delay={0.65} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  13. MODIFICACIONES A LOS TÉRMINOS
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Nos reservamos el derecho de modificar los presentes Términos en cualquier momento. Cuando los cambios sean sustanciales, le notificaremos a través de la Aplicación o por correo electrónico con una antelación mínima de treinta (30) días corridos antes de su entrada en vigencia. El uso continuado de la Aplicación tras ese plazo implica la aceptación de los nuevos Términos. Si no está de acuerdo con las modificaciones, podrá solicitar la cancelación de su cuenta antes de la fecha de entrada en vigencia.
                </p>
              </div>
            </Reveal>

            {/* 14. JURISDICCIÓN Y LEY APLICABLE */}
            <Reveal delay={0.7} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  14. JURISDICCIÓN Y LEY APLICABLE
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  Los presentes Términos se rigen por las leyes de la República Argentina. Para cualquier controversia derivada de su interpretación o aplicación, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
                </p>
              </div>
            </Reveal>

            {/* 15. CONTACTO */}
            <Reveal delay={0.75} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  15. CONTACTO
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1rem",
                  }}
                >
                  Para consultas, ejercicio de derechos o reclamos relacionados con estos Términos o con el tratamiento de sus datos, puede comunicarse con nosotros a través de los siguientes canales:
                </p>
                <ul
                  style={{
                    paddingLeft: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    listStyleType: "none",
                    marginLeft: 0,
                    padding: 0,
                    marginBottom: "1rem",
                  }}
                >
                  <li><strong>Titular:</strong> MCO S.A. (CUIT 30-69798889-7)</li>
                  <li><strong>Correo electrónico:</strong> misaluteca@gmail.com</li>
                  <li><strong>Dirección postal:</strong> Pringles 609, Ciudad Autónoma de Buenos Aires, Argentina</li>
                  <li><strong>Horario de atención:</strong> lunes a viernes de 9 a 18 hs.</li>
                </ul>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                  }}
                >
                  <strong>Organismo de control:</strong> Agencia de Acceso a la Información Pública (AAIP) — www.argentina.gob.ar/aaip — 0800-999-2247.
                </p>
              </div>
            </Reveal>

            {/* DECLARACIÓN DE ACEPTACIÓN */}
            <Reveal delay={0.8} variant="fadeUp">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e2d4d",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  DECLARACIÓN DE ACEPTACIÓN
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5a6a8a",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    maxWidth: "700px",
                    marginBottom: "1.5rem",
                  }}
                >
                  Al presionar "Acepto los Términos y Condiciones" dentro de la Aplicación, usted declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones y la Política de Privacidad, y consiente expresamente el tratamiento de sus datos sensibles de salud conforme a lo aquí establecido, incluyendo el procesamiento mediante inteligencia artificial y la transferencia internacional de datos descripta en las cláusulas 9 y 10.
                </p>
                <div
                  style={{
                    marginTop: "2rem",
                    paddingTop: "2rem",
                    borderTop: "1px solid #e1e7f0",
                    color: "#8a9bb5",
                    fontSize: "0.875rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <span>Versión 1.1 · República Argentina · Ley 25.326 · Ley 26.529</span>
                  <span>MCO S.A. — CUIT 30-69798889-7</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
