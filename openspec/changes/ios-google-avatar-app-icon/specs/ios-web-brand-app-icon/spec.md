## Purpose

Identificar la aplicación iOS instalada mediante el símbolo médico del favicon existente de Mi Saluteca, con recursos adecuados para distribución nativa.

## ADDED Requirements

### Requirement: Icono instalado consistente con la web
La aplicación SHALL usar el símbolo original de carpeta azul con círculo verde y corazón azul del favicon web como icono instalado, conservando proporciones, contornos y colores. El recurso de distribución SHALL cumplir las dimensiones nativas requeridas y presentar el símbolo legible a tamaño de icono instalado, con fondo opaco, sin esquinas redondeadas dibujadas y sin estirar el símbolo. La evidencia SHALL reconocer la resolución limitada de la fuente raster y no afirmar detalle adicional por escalarla. SHALL conservar `com.matyalts.misaluteca` como identificador predeterminado.

#### Scenario: Recurso nativo válido
- **WHEN** se prepara el icono para el build iOS
- **THEN** se obtiene un PNG cuadrado de 1024 por 1024 píxeles sin transparencia, con el símbolo centrado y sin deformación.

#### Scenario: Instalación en dispositivo
- **WHEN** se firma e instala el IPA nuevo en iPhone
- **THEN** la pantalla de inicio y la ficha de aplicación muestran el símbolo del favicon, legible y sin recorte del corazón ni de la carpeta.

### Requirement: Verificación del recurso empaquetado
La entrega SHALL registrar el commit, el origen del símbolo y evidencia de que el build contiene el icono configurado; la presencia de un PNG fuente aislado no SHALL considerarse suficiente para afirmar aceptación física.

#### Scenario: Build compilado
- **WHEN** GitHub Actions publica un IPA de este change
- **THEN** los metadatos y el catálogo de recursos compilados corresponden al icono nuevo y se registra su verificación.

#### Scenario: Prueba física pendiente
- **WHEN** el IPA ya existe pero aún no se comprobó el icono instalado
- **THEN** la aceptación en dispositivo permanece identificada como pendiente.
