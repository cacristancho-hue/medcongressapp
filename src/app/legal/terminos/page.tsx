import { getLocale } from "next-intl/server"

export async function generateMetadata() {
  const locale = await getLocale()
  return locale === "en"
    ? {
        title: "Terms of use · MDCONGRESS",
        description: "Terms and conditions of use of MDCONGRESS AI Companion.",
      }
    : {
        title: "Términos de uso · MDCONGRESS",
        description: "Términos y condiciones de uso de MDCONGRESS AI Companion.",
      }
}

const LAST_UPDATED_ES = "11 de mayo de 2026"
const LAST_UPDATED_EN = "May 11, 2026"

export default async function TerminosPage() {
  const locale = await getLocale()
  return locale === "en" ? <TermsEn /> : <TermsEs />
}

function TermsEs() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-2 font-mono">
          Documento de Cumplimiento Corporativo v2.0
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Términos de uso</h1>
        <p className="text-sm text-slate-500 mt-2 italic">Nivel de Seguridad: Estándar Académico Internacional</p>
        <p className="text-sm text-slate-400">Última actualización: {LAST_UPDATED_ES}</p>
      </header>

      <h2>1. Naturaleza del servicio y Ecosistema de Datos</h2>
      <p>
        MDCONGRESS AI Companion (en adelante, &ldquo;la Herramienta&rdquo;) opera como una infraestructura de inteligencia académica diseñada para la captura, síntesis y consolidación de conocimiento médico. La Herramienta actúa como un procesador de datos especializado que transforma registros fotográficos brutos en activos de información estructurada y verificada.
      </p>

      <h2>2. Exención de Acto Médico y Mala Praxis</h2>
      <p className="p-4 bg-red-50 border-l-4 border-red-500 text-red-900 font-bold uppercase text-[11px] leading-relaxed">
        ADVERTENCIA LEGAL CRÍTICA: EL USO DE MDCONGRESS NO CONSTITUYE BAJO NINGUNA CIRCUNSTANCIA LA PRESTACIÓN DE SERVICIOS DE SALUD, TELEMEDICINA, ASESORÍA MÉDICA NI DIAGNÓSTICO. LA INTERPRETACIÓN DE LA EVIDENCIA SUGERIDA POR NUESTROS MOTORES ES UN ACTO PURAMENTE INTELECTUAL Y DISCRECIONAL DEL USUARIO, QUIEN MANTIENE LA RESPONSABILIDAD TOTAL E INDELEGABLE POR CUALQUIER ACTO DE MALA PRAXIS MÉDICA, DECISIÓN CLÍNICA O RESULTADO EN PACIENTES DERIVADO DE SUS PROPIAS CONCLUSIONES. EL OPERADOR NO ES UN PROFESIONAL DE LA SALUD EN EL EJERCICIO DE ESTA PLATAFORMA.
      </p>

      <h2>3. No es un dispositivo médico — Estado regulatorio</h2>
      <p>
        La Herramienta <strong>NO</strong> está registrada ni certificada como dispositivo médico (SaMD) ante el INVIMA, FDA, EMA o autoridades equivalentes. Su propósito es estrictamente académico y de soporte a la investigación personal.
      </p>

      <h2>4. Datos identificables de pacientes y discreción médica</h2>
      <p>
        Reconocemos que en especialidades como dermatología, cirugía o patología, el registro fotográfico clínico es un pilar del intercambio científico. Por ello, solicitamos <strong>discreción médica profesional</strong>.
      </p>
      <p>
        El usuario garantiza que cualquier imagen cargada ha sido capturada en un entorno académico donde el paciente (si es visible) ha otorgado su consentimiento para fines docentes, o que la imagen ha sido suficientemente anonimizada. MDCONGRESS no realiza auditoría proactiva de PHI (Protected Health Information), siendo el usuario el único responsable legal frente a las leyes de privacidad del paciente en su jurisdicción.
      </p>

      <h2>5. Motor Anti-Alucinación de Élite (Consensus Engine)</h2>
      <p>
        Para combatir las limitaciones inherentes a la IA generativa comercial, MDCONGRESS emplea un <strong>Consensus Engine (Motor Anti-Alucinación)</strong> de grado industrial. Este sistema implementa tres capas de blindaje:
      </p>
      <ul>
        <li>
          <strong>Identidad Bibliográfica</strong>: Verificación matemática del DOI/PMID contra el grafo de conocimiento mundial (CrossRef, PubMed, OpenAlex).
        </li>
        <li>
          <strong>Alineamiento Semántico (Semantic Grounding)</strong>: Comparación de los reclamos generados por la IA contra el texto íntegro de los Abstracts oficiales para prevenir invenciones de resultados.
        </li>
        <li>
          <strong>Detección de Retractación Activa</strong>: Alerta inmediata sobre evidencia invalidada por la comunidad científica.
        </li>
      </ul>
      <p>
        A pesar de este rigor, el usuario acepta que la tecnología es un asistente de soporte y no un oráculo de verdad absoluta.
      </p>

      <h2>6. Propiedad Intelectual de Terceros e Indemnidad</h2>
      <p>
        El usuario captura fotografías de material protegido por derechos de autor (diapositivas, posters). El usuario garantiza que dicho uso se ampara bajo las excepciones legales de <strong>Uso Justo (Fair Use)</strong>, uso académico, cita científica o investigación personal.
      </p>
      <p className="font-bold underline italic">
        El usuario se compromete a mantener indemne a MDCONGRESS frente a cualquier reclamación de propiedad intelectual iniciada por conferencistas, sociedades científicas o la industria farmacéutica derivada del material capturado por el usuario.
      </p>

      <h2>7. Mejora Continua y Ecosistema de Datos Académicos</h2>
      <p>
        El usuario retiene la propiedad de sus fotografías. MDCONGRESS respeta profundamente el trabajo intelectual de los conferencistas y autores del material capturado. Con el fin de elevar la precisión clínica del sistema y beneficiar a toda la comunidad médica usuaria, MDCONGRESS aplica procesos de:
      </p>
      <ul>
        <li><strong>Optimización de Algoritmos</strong>: MDCONGRESS podrá utilizar metadatos técnicos desidentificados y patrones de error en la detección OCR para mejorar la sensibilidad y especificidad de sus motores de búsqueda bibliográfica. En ningún momento se utilizarán las fotografías originales para entrenar modelos de IA generativa fundacionales.</li>
        <li><strong>Inteligencia de Mercado Agregada (Pharma Insights)</strong>: Podremos procesar estadísticas macroscópicas y anónimas (ej. &quot;¿Cuáles son los temas más discutidos en cardiología este mes?&quot;) para generar reportes de valor para sociedades científicas e industria. Estos reportes son siempre de carácter estadístico y nunca comprometen la identidad del médico ni el contenido privado de su biblioteca.</li>
      </ul>

      <h2>8. Garantías y Limitación de Responsabilidad Corporativa</h2>
      <p>
        La responsabilidad total de MDCONGRESS por cualquier incidente técnico o legal se limita estrictamente a: (i) el monto pagado por el usuario en los últimos 12 meses, o (ii) USD $100.00. Esta cláusula es la piedra angular que permite la viabilidad comercial y tecnológica de la Herramienta.
      </p>

      <h2>9. Ley aplicable y jurisdicción</h2>
      <p>
        Este acuerdo se rige por las leyes de la República de Colombia. Cualquier disputa será resuelta mediante arbitraje en equidad en la Cámara de Comercio de Bogotá, renunciando las partes a cualquier otra jurisdicción, salvo derechos del consumidor irrenunciables.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Consultas legales: <a href="mailto:cacristanchoo@gmail.com" className="underline">cacristanchoo@gmail.com</a>.
      </p>

      <footer className="not-prose mt-12 pt-6 border-t border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
        MDCONGRESS LEGAL SHIELD · SECURE ACADEMIC ENVIRONMENT
      </footer>
    </article>
  )
}

function TermsEn() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-2 font-mono">
          Corporate Compliance Document v2.0
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Terms of use</h1>
        <p className="text-sm text-slate-500 mt-2 italic">Security level: International Academic Standard</p>
        <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED_EN}</p>
      </header>

      <p className="not-prose mb-6 text-xs text-slate-500 italic">
        This is an English translation provided for convenience. In case of any discrepancy, the Spanish-language version prevails, as this agreement is governed by the laws of the Republic of Colombia.
      </p>

      <h2>1. Nature of the service and Data Ecosystem</h2>
      <p>
        MDCONGRESS AI Companion (hereinafter, &ldquo;the Tool&rdquo;) operates as an academic intelligence infrastructure designed for the capture, synthesis and consolidation of medical knowledge. The Tool acts as a specialized data processor that transforms raw photographic records into structured and verified information assets.
      </p>

      <h2>2. Disclaimer of Medical Practice and Malpractice</h2>
      <p className="p-4 bg-red-50 border-l-4 border-red-500 text-red-900 font-bold uppercase text-[11px] leading-relaxed">
        CRITICAL LEGAL WARNING: THE USE OF MDCONGRESS DOES NOT UNDER ANY CIRCUMSTANCE CONSTITUTE THE PROVISION OF HEALTHCARE SERVICES, TELEMEDICINE, MEDICAL ADVICE OR DIAGNOSIS. THE INTERPRETATION OF THE EVIDENCE SUGGESTED BY OUR ENGINES IS A PURELY INTELLECTUAL AND DISCRETIONARY ACT OF THE USER, WHO RETAINS FULL AND NON-DELEGABLE RESPONSIBILITY FOR ANY ACT OF MEDICAL MALPRACTICE, CLINICAL DECISION OR PATIENT OUTCOME DERIVED FROM THEIR OWN CONCLUSIONS. THE OPERATOR IS NOT A HEALTHCARE PROFESSIONAL IN THE USE OF THIS PLATFORM.
      </p>

      <h2>3. Not a medical device — Regulatory status</h2>
      <p>
        The Tool is <strong>NOT</strong> registered or certified as a medical device (SaMD) with INVIMA, the FDA, the EMA or equivalent authorities. Its purpose is strictly academic and to support personal research.
      </p>

      <h2>4. Identifiable patient data and medical discretion</h2>
      <p>
        We recognize that in specialties such as dermatology, surgery or pathology, clinical photographic records are a cornerstone of scientific exchange. We therefore ask for <strong>professional medical discretion</strong>.
      </p>
      <p>
        The user warrants that any uploaded image was captured in an academic setting where the patient (if visible) has given consent for teaching purposes, or that the image has been sufficiently anonymized. MDCONGRESS does not perform proactive auditing of PHI (Protected Health Information); the user is the sole party legally responsible under the patient privacy laws of their jurisdiction.
      </p>

      <h2>5. Elite Anti-Hallucination Engine (Consensus Engine)</h2>
      <p>
        To counter the limitations inherent to commercial generative AI, MDCONGRESS employs an industrial-grade <strong>Consensus Engine (Anti-Hallucination Engine)</strong>. This system implements three layers of protection:
      </p>
      <ul>
        <li>
          <strong>Bibliographic Identity</strong>: Mathematical verification of the DOI/PMID against the global knowledge graph (CrossRef, PubMed, OpenAlex).
        </li>
        <li>
          <strong>Semantic Grounding</strong>: Comparison of AI-generated claims against the full text of official Abstracts to prevent fabricated results.
        </li>
        <li>
          <strong>Active Retraction Detection</strong>: Immediate alert on evidence invalidated by the scientific community.
        </li>
      </ul>
      <p>
        Despite this rigor, the user accepts that the technology is a support assistant and not an oracle of absolute truth.
      </p>

      <h2>6. Third-Party Intellectual Property and Indemnity</h2>
      <p>
        The user captures photographs of copyright-protected material (slides, posters). The user warrants that such use is covered by the legal exceptions of <strong>Fair Use</strong>, academic use, scientific citation or personal research.
      </p>
      <p className="font-bold underline italic">
        The user agrees to hold MDCONGRESS harmless against any intellectual property claim brought by speakers, scientific societies or the pharmaceutical industry arising from the material captured by the user.
      </p>

      <h2>7. Continuous Improvement and Academic Data Ecosystem</h2>
      <p>
        The user retains ownership of their photographs. MDCONGRESS deeply respects the intellectual work of the speakers and authors of the captured material. In order to raise the clinical accuracy of the system and benefit the entire community of medical users, MDCONGRESS applies processes of:
      </p>
      <ul>
        <li><strong>Algorithm Optimization</strong>: MDCONGRESS may use de-identified technical metadata and error patterns in OCR detection to improve the sensitivity and specificity of its bibliographic search engines. At no time will the original photographs be used to train foundational generative AI models.</li>
        <li><strong>Aggregated Market Intelligence (Pharma Insights)</strong>: We may process macroscopic, anonymous statistics (e.g., &quot;What are the most discussed topics in cardiology this month?&quot;) to generate valuable reports for scientific societies and industry. These reports are always statistical in nature and never compromise the physician&rsquo;s identity or the private content of their library.</li>
      </ul>

      <h2>8. Warranties and Limitation of Corporate Liability</h2>
      <p>
        MDCONGRESS&rsquo;s total liability for any technical or legal incident is strictly limited to: (i) the amount paid by the user in the last 12 months, or (ii) USD $100.00. This clause is the cornerstone that enables the commercial and technological viability of the Tool.
      </p>

      <h2>9. Governing law and jurisdiction</h2>
      <p>
        This agreement is governed by the laws of the Republic of Colombia. Any dispute shall be resolved through equity arbitration at the Bogotá Chamber of Commerce, with the parties waiving any other jurisdiction, except for non-waivable consumer rights.
      </p>

      <h2>10. Contact</h2>
      <p>
        Legal inquiries: <a href="mailto:cacristanchoo@gmail.com" className="underline">cacristanchoo@gmail.com</a>.
      </p>

      <footer className="not-prose mt-12 pt-6 border-t border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
        MDCONGRESS LEGAL SHIELD · SECURE ACADEMIC ENVIRONMENT
      </footer>
    </article>
  )
}
