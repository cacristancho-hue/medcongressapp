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
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-2 font-mono">
          Documento de Cumplimiento Corporativo v2.0
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Términos de uso</h1>
        <p className="text-sm text-slate-500 mt-2 italic">Nivel de Seguridad: Estándar Académico Internacional</p>
        <p className="text-sm text-slate-400">Última actualización: {LAST_UPDATED}</p>
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
        Para combatir las limitaciones inherentes a la IA generativa comercial, MDCONGRESS emplea un **Consensus Engine (Motor Anti-Alucinación)** de grado industrial. Este sistema implementa tres capas de blindaje:
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
        El usuario captura fotografías de material protegido por derechos de autor (diapositivas, posters). El usuario garantiza que dicho uso se ampara bajo las excepciones legales de **Uso Justo (Fair Use)**, uso académico, cita científica o investigación personal. 
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
        <li><strong>Inteligencia de Mercado Agregada (Pharma Insights)</strong>: Podremos procesar estadísticas macroscópicas y anónimas (ej. "¿Cuáles son los temas más discutidos en cardiología este mes?") para generar reportes de valor para sociedades científicas e industria. Estos reportes son siempre de carácter estadístico y nunca comprometen la identidad del médico ni el contenido privado de su biblioteca.</li>
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
