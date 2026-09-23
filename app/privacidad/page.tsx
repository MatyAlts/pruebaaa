"use client";

import Navbar from "@/landing/components/Navbar";
import Footer from "@/landing/components/Footer";
import Reveal from "@/landing/components/Reveal";

const sections = [
  {
    title: "1. Introducción y alcance",
    content:
      "En Mi Saluteca valoramos enormemente tu privacidad. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y compartimos la información personal y médica de nuestros usuarios al acceder y utilizar nuestra plataforma. Al utilizar Mi Saluteca, consentís el procesamiento de tu información según lo estipulado en este documento.",
  },
  {
    title: "2. Información que recopilamos",
    content:
      "Podemos recopilar y procesar los siguientes tipos de información:",
    list: [
      "Datos de cuenta: Nombre, dirección de correo electrónico y foto de perfil a través de la autenticación de Google.",
      "Datos de salud: Los archivos, estudios médicos o documentos que decidas subir a la plataforma.",
      "Datos técnicos: Como tu dirección IP, tipo de navegador, fecha y hora de acceso, y otra información técnica para mejorar la experiencia de usuario.",
    ],
  },
  {
    title: "3. Uso de la información",
    content: "Utilizamos tu información personal y médica exclusivamente para:",
    list: [
      "Brindarte acceso seguro a tu cuenta y a la plataforma.",
      "Almacenar y organizar tus estudios médicos de forma privada.",
      "Utilizar inteligencia artificial para extraer información básica de tus estudios (título, fecha, centro médico) con el objetivo de organizarlos automáticamente en tu perfil.",
      "Permitirte compartir estudios mediante links seguros si así lo decidís.",
      "Mejorar el rendimiento y soporte técnico de Mi Saluteca.",
    ],
    important:
      "Nunca venderemos ni cederemos tus datos a terceros con fines publicitarios, de marketing ni a compañías farmacéuticas o aseguradoras.",
  },
  {
    title: "4. Inteligencia artificial y privacidad",
    content:
      "En Mi Saluteca empleamos IA para facilitar la organización de tus documentos médicos. Al subir un estudio, este es analizado temporalmente por nuestros algoritmos para extraer datos estructurados. Una vez extraídos, los metadatos se guardan en tu cuenta, y el documento se almacena cifrado en la nube.",
    important:
      "Tus datos de salud no son utilizados para entrenar modelos de IA de dominio público de terceros.",
  },
  {
    title: "5. Almacenamiento y retención",
    content:
      "Los archivos e información que subís a la plataforma se almacenan en servidores con altos estándares de seguridad. Conservaremos tus datos mientras mantengas tu cuenta activa. Podés eliminar archivos individuales o tu cuenta por completo en cualquier momento, lo cual removerá tus datos de nuestros sistemas de manera irreversible.",
  },
  {
    title: "6. Seguridad de los datos",
    content:
      "Implementamos medidas de seguridad técnicas y organizativas líderes en la industria para proteger tus estudios médicos contra acceso, alteración, divulgación o destrucción no autorizada.",
    important:
      "Recomendamos usar una contraseña fuerte en tu cuenta de Google y asegurarte de cerrar sesión en dispositivos públicos compartidos.",
  },
  {
    title: "7. Opciones y control sobre tus datos",
    content: "En cualquier momento tenés derecho a:",
    list: [
      "Acceder, modificar o rectificar tus datos.",
      "Eliminar cualquier estudio médico, archivo o documento subido a la plataforma.",
      "Eliminar el acceso a cualquier link compartido, bloqueando su visualización inmediatamente.",
      "Eliminar definitivamente tu cuenta de Mi Saluteca perdiendo acceso y borrando todo el historial y contenido.",
    ],
  },
  {
    title: "8. Interacciones con terceros y enlaces",
    content:
      "Nuestro servicio puede facilitar el intercambio de información con terceros (por ejemplo, mediante nuestros links temporales para compartir estudios). Tené en cuenta que al proporcionar acceso a los links, las prácticas de privacidad y confidencialidad son responsabilidad del tercero con quien decidís compartir.",
  },
  {
    title: "9. Cambios a esta Política de Privacidad",
    content:
      "Podemos modificar esta Política en cualquier momento. De realizarse cambios significativos sobre la privacidad de tus datos de salud, te lo notificaremos al correo electrónico asociado a tu cuenta o publicaremos los cambios de manera visible en la plataforma. Seguir usando el servicio después de las modificaciones indica la aceptación de estas políticas.",
  },
  {
    title: "10. Contacto",
    content:
      "Si tenés preguntas sobre estas políticas, podés contactarnos a través de la plataforma o escribirnos a nuestro correo electrónico de soporte. Estaremos a tu disposición para clarificar cualquier aspecto de la privacidad de tus datos.",
  },
];

export default function PrivacidadPage() {
  const currentYear = new Date().getFullYear();

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
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  marginBottom: "1.5rem",
                }}
              >
                Política de Privacidad.
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
                Última actualización: febrero {currentYear}
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
            {sections.map((section, i) => (
              <Reveal key={i} delay={i * 0.05} variant="fadeUp">
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
                    {section.title}
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
                    {section.content}
                  </p>
                  {section.list && (
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
                      {section.list.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.important && (
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
                      <strong style={{ color: "#5a8f62" }}>Importante:</strong>{" "}
                      {section.important}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
