import Link from "next/link"

export const metadata = {
  title: "Términos de uso · MDCONGRESS",
  description: "Términos y condiciones de uso de MDCONGRESS AI Companion.",
}

const LAST_UPDATED = "11 de mayo de 2026"

export default function TerminosPage() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
          Documento Legal Corporativo
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Términos de uso</h1>
        <p className="text-sm text-slate-500 mt-2">Última actualización: {LAST_UPDATED}</p>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          Documento elaborado tomando como referencia: Ley 1581 de 2012 y Decreto 1377 de 2013
          (Colombia), Reglamento (UE) 2016/679 (GDPR), Ley 13.709 de 2018 (LGPD Brasil), normativa
          INVIMA sobre dispositivos médicos, Reglamento (UE) 2017/745 (MDR), 21 CFR 820 (FDA).
          Este acuerdo vincula legalmente al usuario y a MDCONGRESS en la jurisdicción de operación.
        </p>
      </header>

      <h2>1. Naturaleza del servicio</h2>
      <p>
        MDCONGRESS AI Companion (en adelante, &ldquo;la Herramienta&rdquo;) es una aplicación web
        diseñada para ayudar a profesionales de la salud a organizar material académico recopilado
        durante congresos médicos. La Herramienta permite cargar fotografías de diapositivas, posters
        u otro material gráfico, extraer texto mediante reconocimiento óptico de caracteres (OCR) e
        inteligencia artificial (IA), clasificarlo por temas, detectar referencias bibliográficas y
        generar resúmenes y reportes académicos.
      </p>

      <h2>2. No es un dispositivo médico — Estado regulatorio</h2>
      <p>
        La Herramienta <strong>NO</strong> está registrada, certificada ni autorizada como
        dispositivo médico ni como software como dispositivo médico (SaMD) ante:
      </p>
      <ul>
        <li>INVIMA (Instituto Nacional de Vigilancia de Medicamentos y Alimentos, Colombia).</li>
        <li>FDA (Food and Drug Administration, Estados Unidos).</li>
        <li>EMA / autoridades nacionales bajo el Reglamento (UE) 2017/745 (MDR).</li>
        <li>ANVISA (Brasil), COFEPRIS (México), ni autoridad equivalente alguna.</li>
      </ul>
      <p>
        La Herramienta no está destinada a diagnosticar, tratar, prevenir, mitigar ni curar
        enfermedad alguna. No reemplaza el criterio clínico, la consulta con colegas, ni la lectura
        original de la literatura científica. El usuario reconoce que cualquier decisión clínica
        basada en información extraída o generada por la Herramienta es de su exclusiva
        responsabilidad.
      </p>

      <h2>3. Uso académico personal y restricciones</h2>
      <p>
        La Herramienta está autorizada exclusivamente para uso académico personal del usuario
        registrado: estudio individual, preparación de presentaciones internas no comerciales, notas
        personales y materiales docentes propios.
      </p>
      <p>El usuario se compromete a NO realizar las siguientes conductas:</p>
      <ul>
        <li>Compartir su cuenta, credenciales o sesión activa con terceros.</li>
        <li>
          Usar la Herramienta mediante bots, scripts automatizados o cualquier tipo de scraping no
          autorizado.
        </li>
        <li>
          Realizar ingeniería inversa, descompilación o desensamblado del software, ni intentar
          extraer modelos de IA, prompts internos o lógica propietaria.
        </li>
        <li>
          Eludir, deshabilitar o interferir con los controles de seguridad, cuotas o auditoría.
        </li>
        <li>
          Sublicenciar, revender, alquilar o redistribuir el contenido generado por la Herramienta
          sin verificación independiente y atribución apropiada.
        </li>
        <li>
          Usar la Herramienta para generar contenido difamatorio, fraudulento, discriminatorio o que
          infrinja derechos de terceros.
        </li>
        <li>
          Cargar material protegido por derechos de autor sin autorización del titular cuando ese
          uso exceda lo permitido por las excepciones académicas locales.
        </li>
      </ul>

      <h2>4. Datos identificables de pacientes y discreción médica</h2>
      <p>
        Entendemos que en diversas especialidades médicas (ej. dermatología, cirugía, anatomía patológica) el registro fotográfico es un componente esencial del material académico expuesto en los congresos. Por ello, solicitamos a nuestros usuarios ejercer la máxima <strong>discreción médica</strong> al capturar y subir imágenes.
      </p>
      <p>
        El usuario se compromete a no cargar imágenes ni textos que contengan Datos de Salud Protegidos (PHI) evidentes o directos. Esto incluye:
      </p>
      <ul>
        <li>Nombres completos, números de identificación, números de historia clínica o de seguridad social.</li>
        <li>Datos de contacto directos del paciente.</li>
        <li>Fotografías de rostros no anonimizados o rasgos altamente identificativos que no hayan sido previamente difuminados o tapados en la presentación original del congreso.</li>
      </ul>
      <p>
        El usuario es el único responsable del contenido que carga. Si el equipo de la Herramienta detecta carga de datos manifiestamente identificables de pacientes, procederá a notificar al usuario para la inmediata eliminación o anonimización del material. El Operador se reserva el derecho de suspender la cuenta sin previo aviso únicamente en casos de vulneración maliciosa, sistemática o negligencia grave frente a la privacidad del paciente.
      </p>

      <h2>5. Inteligencia artificial y Motor Anti-Alucinación</h2>
      <p>
        La extracción de texto, la clasificación temática y la generación de resúmenes utilizan modelos de Inteligencia Artificial (IA) generativa de última generación. Reconocemos que, por su naturaleza, los modelos generativos puros pueden producir resultados inexactos o inventar información (fenómeno conocido como &ldquo;alucinación&rdquo;).
      </p>
      <p>
        Para mitigar este riesgo, MDCONGRESS ha desarrollado un <strong>Motor Anti-Alucinación (Consensus Engine)</strong> exclusivo para el ámbito médico. Nuestro sistema no confía ciegamente en la IA generativa para los datos científicos; en su lugar, cruza y verifica matemáticamente cada referencia bibliográfica detectada contra las bases de datos académicas mundiales de mayor rigor (CrossRef, PubMed/NCBI, OpenAlex).
      </p>
      <p>
        A través de este motor, las referencias se marcan con uno de los siguientes estados:
      </p>
      <ul>
        <li>
          <strong>Evidencia Validada</strong>: Existe coincidencia exacta y confiable en bases de datos externas de autoridad.
        </li>
        <li>
          <strong>Validación Parcial / Confirmación Pendiente</strong>: Hay coincidencia parcial o ambigua; el sistema solicitará la revisión humana.
        </li>
        <li>
          <strong>No Verificada</strong>: Detección incompleta, se muestra el texto original (OCR) sin validación externa.
        </li>
        <li>
          <strong>⚠️ Retractado</strong>: Nuestro sistema incluye detección de artículos retractados, alertando visualmente al usuario para evitar citar ciencia invalidada.
        </li>
      </ul>
      <p>
        Aunque nuestro Motor Anti-Alucinación ofrece un estándar de precisión de clase mundial, el usuario final, como profesional de la salud, mantiene la responsabilidad indelegable de confirmar el contexto clínico y la pertinencia de la evidencia antes de aplicarla en su práctica, publicarla o usarla académicamente.
      </p>

      <h2>6. Procesamiento por terceros</h2>
      <p>
        Para prestar el servicio, la Herramienta envía contenido del usuario a servicios externos de
        cómputo e inteligencia artificial. Al usar la Herramienta, el usuario autoriza este
        procesamiento. Los proveedores actuales y su jurisdicción se detallan en la{" "}
        <Link href="/dashboard/legal/privacidad" className="underline underline-offset-2">
          Política de Privacidad
        </Link>
        .
      </p>

      <h2>7. Propiedad intelectual y licencia de uso</h2>
      <p>
        Las fotografías y textos originales cargados por el usuario siguen siendo de su exclusiva propiedad (o de los autores originales del material expuesto en el congreso). La Herramienta no reclama propiedad sobre el contenido fotográfico bruto del usuario.
      </p>
      <p>
        Para la correcta operación del servicio, el usuario otorga al operador una <strong>licencia mundial, no exclusiva, libre de regalías y transferible</strong>, con el propósito de:
      </p>
      <ul>
        <li>Almacenar, alojar y procesar el contenido en nuestra infraestructura en la nube.</li>
        <li>Procesar el contenido a través de nuestros motores de IA y bases de datos bibliográficas.</li>
        <li>Generar y entregar al usuario los reportes, resúmenes y transcripciones solicitadas.</li>
      </ul>
      <p>
        <strong>Monetización de Datos Agregados y Anonimizados (Pharma Insights):</strong><br/>
        El operador no venderá, cederá ni licenciará sus fotografías originales ni sus datos personales (nombre, correo) a terceros para fines de marketing directo. Sin embargo, el usuario reconoce y acepta que el operador tiene el derecho irrevocable de <strong>anonimizar, desidentificar y agregar los datos derivados</strong> (tales como tópicos clínicos emergentes, frecuencias de citación bibliográfica, tendencias de congresos y estadísticas de uso) para crear bases de datos agregadas e inteligencia de mercado. El operador retiene todos los derechos de propiedad intelectual sobre estas bases de datos agregadas y podrá comercializarlas, licenciarlas o compartirlas con la industria farmacéutica, sociedades científicas y otros actores del ecosistema de la salud (&ldquo;Pharma Insights&rdquo;). Esta información agregada se produce mediante procesos tecnológicos rigurosos y <strong>nunca</strong> permitirá la identificación individual del usuario ni de pacientes.
      </p>

      <h2>8. Cuotas, planes y precios</h2>
      <p>
        La Herramienta aplica cuotas mensuales por plan. El plan gratuito tiene límites de análisis
        de imagen, reportes generados y un tope económico de procesamiento de IA. Los planes pagos
        amplían estos límites. Las cuotas y precios pueden cambiar con previo aviso de al menos 30
        días calendario, comunicado a través de la Herramienta o por correo electrónico.
      </p>

      <h2>9. Garantías y limitación de responsabilidad corporativa</h2>
      <p>
        MDCONGRESS realiza esfuerzos a nivel empresarial para asegurar la exactitud técnica de su plataforma, respaldados por nuestro Motor Anti-Alucinación. No obstante, la Herramienta se ofrece como un producto de software como servicio (SaaS) bajo la premisa de &ldquo;tal cual&rdquo; (<em>as is</em>) y &ldquo;según disponibilidad&rdquo; (<em>as available</em>). No garantizamos que la plataforma estará libre de interrupciones técnicas o errores imprevistos.
      </p>
      <p>
        En la máxima extensión permitida por el derecho aplicable, MDCONGRESS y sus filiales, directores o empleados <strong>no serán responsables</strong> por daños indirectos, incidentales, punitivos, consecuenciales, lucro cesante, pérdida de datos, ni por ninguna contingencia médica, diagnóstico erróneo o decisión clínica derivada de la interpretación del contenido generado por la plataforma.
      </p>
      <p>
        Nuestra responsabilidad total, conjunta y acumulada por cualquier reclamación derivada de la prestación del servicio se limitará estrictamente al monto total que el usuario haya pagado efectivamente a MDCONGRESS durante los doce (12) meses anteriores al evento que origina el reclamo, o en su defecto, a la suma de cien dólares estadounidenses (USD $100.00). Esta limitación de responsabilidad es un elemento fundamental de la base del acuerdo entre MDCONGRESS y el usuario.
      </p>
      <p>
        Las exclusiones y limitaciones anteriores no aplicarán a la responsabilidad por dolo o culpa
        grave imputable al operador, ni a derechos del consumidor que sean irrenunciables conforme
        a la legislación local.
      </p>

      <h2>10. Terminación y eliminación de datos</h2>
      <p>
        El usuario puede eliminar su cuenta en cualquier momento desde Ajustes. Una vez recibida la
        solicitud:
      </p>
      <ul>
        <li>
          El acceso a la Herramienta se revoca <strong>inmediatamente</strong>.
        </li>
        <li>
          El contenido cargado y los datos derivados se eliminan dentro de los siguientes{" "}
          <strong>30 días calendario</strong>, salvo aquellos que el operador esté obligado a
          conservar por requisitos legales, tributarios o de auditoría.
        </li>
        <li>
          Los datos retenidos por obligación legal se conservarán durante el plazo mínimo exigido
          por la norma aplicable (típicamente entre 5 y 10 años para registros tributarios) y luego
          se eliminarán.
        </li>
      </ul>
      <p>
        El operador podrá suspender o terminar la cuenta del usuario, con o sin previo aviso, en
        caso de incumplimiento material de estos Términos, fraude, uso abusivo, o si la continuidad
        del servicio expone al operador a riesgos legales.
      </p>

      <h2>11. Cambios a estos términos</h2>
      <p>
        El operador puede actualizar estos Términos. Cambios sustanciales se comunicarán con
        antelación razonable (mínimo 15 días) a través de la Herramienta o por correo. El uso
        continuado tras la fecha de entrada en vigor implica aceptación. Si el usuario no está de
        acuerdo, podrá terminar su cuenta antes de esa fecha.
      </p>

      <h2>12. Cesión</h2>
      <p>
        El usuario no podrá ceder, transferir ni delegar sus derechos u obligaciones bajo estos
        Términos sin consentimiento previo y por escrito del operador.
      </p>
      <p>
        El operador podrá ceder estos Términos en el contexto de una fusión, adquisición, venta de
        activos o reorganización societaria, notificando al usuario con antelación razonable.
      </p>

      <h2>13. Divisibilidad</h2>
      <p>
        Si alguna cláusula de estos Términos resulta inválida, ilegal o inejecutable, dicha cláusula
        se interpretará en la máxima extensión permitida por la ley o, si no es posible, se separará
        de los Términos sin afectar la validez de las demás cláusulas.
      </p>

      <h2>14. Acuerdo completo</h2>
      <p>
        Estos Términos, junto con la{" "}
        <Link href="/dashboard/legal/privacidad" className="underline underline-offset-2">
          Política de Privacidad
        </Link>
        , constituyen el acuerdo completo entre el usuario y el operador respecto al uso de la
        Herramienta. Sustituyen cualquier comunicación, propuesta o acuerdo previo, oral o escrito,
        sobre el mismo objeto.
      </p>

      <h2>15. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen e interpretan conforme a las leyes de la República de Colombia, sin
        atender a sus normas sobre conflicto de leyes.
      </p>
      <p>
        Cualquier controversia que surja de o se relacione con estos Términos se someterá, en
        primera instancia, a un proceso de mediación voluntaria a través del Centro de Arbitraje y
        Conciliación de la Cámara de Comercio de Bogotá, durante un plazo no mayor a 30 días
        calendario.
      </p>
      <p>
        Si la mediación no resuelve la controversia, las partes podrán someterse a arbitraje en
        equidad ante el mismo Centro, con sede en Bogotá D.C., o, alternativamente, recurrir a los
        jueces de la República de Colombia con sede en Bogotá D.C., a elección de la parte
        demandante.
      </p>
      <p>
        Lo anterior se entiende sin perjuicio de los derechos del consumidor que sean
        irrenunciables y del foro de protección al consumidor que la ley local le otorgue.
      </p>

      <h2>16. Contacto</h2>
      <p>
        Para preguntas sobre estos Términos, escriba a{" "}
        <a href="mailto:cacristanchoo@gmail.com" className="underline underline-offset-2">
          cacristanchoo@gmail.com
        </a>
        .
      </p>

      <footer className="not-prose mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-2">
        <p>
          Ver también:{" "}
          <Link href="/dashboard/legal/privacidad" className="underline underline-offset-2 text-slate-700">
            Política de Privacidad
          </Link>
          .
        </p>
        <p>
          MDCONGRESS Legal Team. La
          identificación comercial y fiscal del operador está disponible a petición directa para instituciones y procesos formales.
        </p>
      </footer>
    </article>
  )
}
