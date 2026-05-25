import Link from "next/link"
import { getLocale } from "next-intl/server"

export async function generateMetadata() {
  const locale = await getLocale()
  return locale === "en"
    ? {
        title: "Privacy policy · MDCONGRESS",
        description: "Personal data processing policy — MDCONGRESS AI Companion.",
      }
    : {
        title: "Política de privacidad · MDCONGRESS",
        description: "Política de tratamiento de datos personales — MDCONGRESS AI Companion.",
      }
}

const LAST_UPDATED_ES = "11 de mayo de 2026"
const LAST_UPDATED_EN = "May 11, 2026"

export default async function PrivacidadPage() {
  const locale = await getLocale()
  return locale === "en" ? <PrivacyEn /> : <PrivacyEs />
}

function PrivacyEs() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
          Documento Legal Corporativo
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Política de tratamiento de datos personales
        </h1>
        <p className="text-sm text-slate-500 mt-2">Última actualización: {LAST_UPDATED_ES}</p>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          Documento elaborado conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Colombia),
          el Reglamento (UE) 2016/679 (GDPR), la Ley 13.709 de 2018 (LGPD Brasil) y la Ley Federal
          de Protección de Datos Personales en Posesión de los Particulares (México).
        </p>
      </header>

      <h2>1. Identificación del responsable del tratamiento</h2>
      <p>
        <strong>MDCONGRESS AI Companion</strong>
      </p>
      <ul>
        <li>
          <strong>Razón social / nombre del titular</strong>:{" "}
          <span className="text-slate-500">MDCONGRESS (Operaciones Globales)</span>
        </li>
        <li>
          <strong>Correo electrónico</strong>:{" "}
          <a href="mailto:cacristanchoo@gmail.com" className="underline underline-offset-2">
            cacristanchoo@gmail.com
          </a>
        </li>
      </ul>
      <p>
        En adelante, el responsable del tratamiento se denomina &ldquo;el Operador&rdquo; y la
        aplicación, &ldquo;la Herramienta&rdquo;.
      </p>

      <h2>2. Datos personales que tratamos</h2>
      <h3>2.1. Datos aportados directamente por el usuario</h3>
      <ul>
        <li>
          <strong>Datos de cuenta</strong>: correo electrónico, contraseña cifrada (hash), fecha de
          registro, fecha del último acceso.
        </li>
        <li>
          <strong>Perfil profesional</strong>: nombre, especialidad, rol (residente, fellow,
          especialista, profesor) y país.
        </li>
        <li>
          <strong>Contenido cargado</strong>: fotografías de material académico que el usuario
          decide subir, junto con metadatos técnicos (tamaño, formato, resolución, fecha y hora de
          captura cuando esté disponible en EXIF).
        </li>
      </ul>
      <h3>2.2. Datos derivados generados por la Herramienta</h3>
      <ul>
        <li>Texto extraído por OCR.</li>
        <li>Resúmenes generados por IA.</li>
        <li>Tópicos detectados.</li>
        <li>Referencias bibliográficas detectadas y sus estados de verificación.</li>
        <li>
          Reportes académicos derivados (resumen, esquema políglota, bibliografía consolidada).
        </li>
      </ul>
      <h3>2.3. Datos técnicos automáticos</h3>
      <ul>
        <li>
          <strong>Dirección IP</strong> (anonimizada parcialmente cuando es técnicamente posible).
        </li>
        <li>Tipo y versión de navegador (User-Agent).</li>
        <li>Sistema operativo del dispositivo.</li>
        <li>
          Timestamps de operaciones (login, carga, procesamiento), por seguridad y trazabilidad.
        </li>
        <li>
          Logs de uso de modelos de IA (modelo invocado, tokens de entrada, tokens de salida, costo
          estimado), para aplicar cuotas mensuales y prevenir abuso.
        </li>
      </ul>
      <h3>2.4. Cookies y almacenamiento local</h3>
      <p>
        La Herramienta utiliza cookies estrictamente necesarias y almacenamiento local
        (localStorage) para mantener la sesión autenticada (mediante Supabase Auth) y para guardar
        la confirmación del aviso de uso. <strong>No utilizamos</strong> cookies publicitarias ni
        de seguimiento de terceros con fines de marketing. Por ser estrictamente necesarias, no
        requieren consentimiento previo bajo GDPR ni Ley 1581.
      </p>

      <h2>3. Datos que el usuario NO debe cargar y discreción médica</h2>
      <p>
        Entendemos que el registro fotográfico es crucial en ciertas especialidades, pero el usuario se compromete expresamente a ejercer discreción médica y no cargar datos directos o manifiestamente identificables de pacientes ni datos sensibles de terceros. Esto incluye:
      </p>
      <ul>
        <li>Nombres completos, identificación, datos de contacto directos o historia clínica de cualquier paciente.</li>
        <li>Imágenes clínicas de rostros no difuminados en las que el paciente sea inequívocamente identificable.</li>
        <li>Información de salud personal de terceros sin su consentimiento o anonimización previa.</li>
      </ul>
      <p>
        Si el Operador detecta o recibe noticia de la carga maliciosa de este tipo de información, solicitará su anonimización inmediata y podrá suspender la cuenta en casos de negligencia grave.
      </p>

      <h2>4. Finalidades del tratamiento y Explotación de Datos Agregados</h2>
      <p>Tratamos los datos para las siguientes finalidades principales:</p>
      <ul>
        <li>Prestar y operar el servicio de organización académica para el usuario.</li>
        <li>Procesar imágenes y textos a través de servicios de IA de terceros bajo estrictos acuerdos de procesamiento (DPA).</li>
        <li>
          Verificar referencias bibliográficas mediante nuestro Motor Anti-Alucinación en bases académicas externas (CrossRef, PubMed/NCBI, OpenAlex).
        </li>
        <li>Aplicar cuotas mensuales y, cuando aplique, facturar planes pagos.</li>
        <li>Mejorar la seguridad de la Herramienta, auditar el uso de IA y prevenir fraude o abuso.</li>
      </ul>
      <p className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium my-6">
        <strong>Uso Comercial y Pharma Insights:</strong> MDCONGRESS NO vende, alquila ni comparte datos personales identificables (como su nombre, correo o perfil) a terceros para fines de marketing. Tampoco usamos sus fotografías originales para entrenar modelos de IA generativa fundacionales.<br/><br/>
        Sin embargo, MDCONGRESS procesa los datos derivados de la plataforma (como las referencias bibliográficas más citadas, las tendencias en patologías emergentes y los tópicos abordados en congresos globales) para crear conjuntos de datos <strong>completamente anonimizados y agregados</strong>. Esta inteligencia de mercado (&quot;Pharma Insights&quot;) es propiedad exclusiva de MDCONGRESS y puede ser comercializada, licenciada o compartida con la industria farmacéutica y sociedades científicas. Al aceptar esta política, usted consiente la agregación y desidentificación irreversible de los datos de uso para estos fines.
      </p>

      <h2>5. Base legal del tratamiento</h2>
      <p>El tratamiento se ampara en las siguientes bases legales:</p>
      <ul>
        <li>
          <strong>Consentimiento expreso</strong> del titular al registrarse y aceptar nuestros
          Términos (Ley 1581 art. 9; GDPR art. 6.1.a).
        </li>
        <li>
          <strong>Ejecución de contrato</strong> de prestación de servicio (GDPR art. 6.1.b).
        </li>
        <li>
          <strong>Interés legítimo comercial</strong> del Operador en procesar datos completamente anonimizados para la creación de métricas e inteligencia de mercado, así como para la seguridad del sistema (GDPR art. 6.1.f).
        </li>
      </ul>

      <h2>6. Encargados y procesadores externos</h2>
      <p>
        Para prestar el servicio compartimos datos con los siguientes encargados de tratamiento.
        El usuario, al usar la Herramienta, autoriza esta transferencia. Estos proveedores tienen prohibido usar los datos del usuario para entrenar sus propios modelos fundacionales (Zero Data Retention / API Data Privacy).
      </p>
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Finalidad</th>
            <th>Sede Principal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase Inc.</td>
            <td>Autenticación, base de datos, almacenamiento de archivos</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Alojamiento de la aplicación web y funciones serverless</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>OpenAI, L.L.C. / Google LLC / Anthropic, PBC</td>
            <td>Procesamiento multimodal y de texto vía API (No entrenamiento)</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>Crossref / NCBI (PubMed) / OpenAlex</td>
            <td>Motor Anti-Alucinación (Verificación bibliográfica)</td>
            <td>UK / EE.UU.</td>
          </tr>
        </tbody>
      </table>

      <h2>7. Transferencia internacional de datos</h2>
      <p>
        El usuario reconoce y autoriza expresamente que sus datos personales podrán ser transferidos
        y tratados fuera de su país de residencia, principalmente en los Estados Unidos de América
        y otros países donde nuestros encargados operen.
      </p>
      <p>
        Bajo la <strong>Ley 1581 de 2012 (Colombia)</strong> y equivalentes regionales, se entiende que esta transferencia
        cuenta con el consentimiento explícito del titular. Bajo el <strong>GDPR (UE)</strong>, las transferencias a Estados Unidos se amparan en las <em>Cláusulas Contractuales Tipo</em> o el <em>Data Privacy Framework</em>.
      </p>

      <h2>8. Tiempo de conservación</h2>
      <ul>
        <li>
          <strong>Datos de cuenta y perfil</strong>: mientras la cuenta esté activa, más 30 días
          calendario tras solicitud de eliminación, salvo obligación legal de retención.
        </li>
        <li>
          <strong>Contenido cargado</strong>: mientras el usuario no lo elimine. El
          usuario tiene control total para borrar fotos o congresos en cualquier momento.
        </li>
        <li>
          <strong>Datos anonimizados agregados</strong>: MDCONGRESS retiene permanentemente las estadísticas desidentificadas (&quot;Pharma Insights&quot;) derivadas del uso histórico de la plataforma.
        </li>
      </ul>

      <h2>9. Derechos del titular</h2>
      <p>
        Conforme a la Ley 1581 de 2012, el GDPR y normas equivalentes, el titular tiene derecho a:
      </p>
      <ul>
        <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales.</li>
        <li><strong>Acceder y obtener copia</strong> de los datos (portabilidad).</li>
        <li><strong>Revocar el consentimiento y solicitar la supresión</strong> de los datos.</li>
        <li><strong>Oponerse</strong> al tratamiento basado en interés legítimo.</li>
      </ul>
      <p>
        Para ejercer estos derechos, escriba a{" "}
        <a href="mailto:cacristanchoo@gmail.com" className="underline underline-offset-2">
          cacristanchoo@gmail.com
        </a>{" "}
        indicando: nombre completo, identificación y descripción del derecho que ejerce. Las consultas se resolverán en un máximo de 10 días hábiles y los reclamos en 15 días hábiles.
      </p>

      <h2>10. Medidas de seguridad</h2>
      <p>El Operador aplica las siguientes medidas técnicas y organizativas de nivel empresarial:</p>
      <ul>
        <li>Cifrado en tránsito (HTTPS / TLS 1.2 o superior) en todas las comunicaciones.</li>
        <li>Cifrado en reposo en la base de datos y el almacenamiento (AWS/Supabase).</li>
        <li>Aislamiento por usuario mediante <em>Row-Level Security</em> (RLS) en la base de datos.</li>
        <li>Control de acceso por autenticación robusta y cifrado de contraseñas (bcrypt).</li>
        <li>Monitoreo y auditoría activa de uso de IA y seguridad de infraestructura.</li>
      </ul>
      <p>
        Si detectamos un incidente de seguridad que comprometa datos personales, notificaremos al usuario afectado y a la autoridad competente dentro de los plazos legales estipulados (ej. 72 horas para GDPR).
      </p>

      <h2>11. Menores de edad</h2>
      <p>
        La Herramienta está dirigida exclusivamente a profesionales de la salud y estudiantes
        universitarios mayores de 18 años. No tratamos deliberadamente datos personales de menores
        de edad.
      </p>

      <h2>12. Cambios a esta política</h2>
      <p>
        El Operador puede actualizar esta política para reflejar evoluciones operativas, comerciales o legales. Los cambios sustanciales se comunicarán a través de la aplicación o por correo electrónico. El uso continuado tras la publicación constituye la aceptación tácita de los nuevos términos.
      </p>

      <footer className="not-prose mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-2">
        <p>
          Ver también:{" "}
          <Link href="/dashboard/legal/terminos" className="underline underline-offset-2 text-slate-700">
            Términos de uso
          </Link>
          .
        </p>
        <p>
          MDCONGRESS Legal & Privacy Team. La
          identificación comercial y fiscal del operador está disponible a petición directa para instituciones y procesos formales.
        </p>
      </footer>
    </article>
  )
}

function PrivacyEn() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
          Corporate Legal Document
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Personal data processing policy
        </h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: {LAST_UPDATED_EN}</p>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          Document prepared in accordance with Law 1581 of 2012 and Decree 1377 of 2013 (Colombia),
          Regulation (EU) 2016/679 (GDPR), Law 13.709 of 2018 (LGPD Brazil) and the Federal Law on
          the Protection of Personal Data Held by Private Parties (Mexico).
        </p>
      </header>

      <p className="not-prose mb-6 text-xs text-slate-500 italic">
        This is an English translation provided for convenience. In case of any discrepancy, the Spanish-language version prevails.
      </p>

      <h2>1. Identification of the data controller</h2>
      <p>
        <strong>MDCONGRESS AI Companion</strong>
      </p>
      <ul>
        <li>
          <strong>Legal / holder name</strong>:{" "}
          <span className="text-slate-500">MDCONGRESS (Global Operations)</span>
        </li>
        <li>
          <strong>Email</strong>:{" "}
          <a href="mailto:cacristanchoo@gmail.com" className="underline underline-offset-2">
            cacristanchoo@gmail.com
          </a>
        </li>
      </ul>
      <p>
        Hereinafter, the data controller is referred to as &ldquo;the Operator&rdquo; and the
        application as &ldquo;the Tool&rdquo;.
      </p>

      <h2>2. Personal data we process</h2>
      <h3>2.1. Data provided directly by the user</h3>
      <ul>
        <li>
          <strong>Account data</strong>: email, encrypted password (hash), registration date, last
          login date.
        </li>
        <li>
          <strong>Professional profile</strong>: name, specialty, role (resident, fellow,
          specialist, professor) and country.
        </li>
        <li>
          <strong>Uploaded content</strong>: photographs of academic material the user chooses to
          upload, together with technical metadata (size, format, resolution, capture date and time
          when available in EXIF).
        </li>
      </ul>
      <h3>2.2. Derived data generated by the Tool</h3>
      <ul>
        <li>Text extracted by OCR.</li>
        <li>AI-generated summaries.</li>
        <li>Detected topics.</li>
        <li>Detected bibliographic references and their verification statuses.</li>
        <li>
          Derived academic reports (summary, polyglot outline, consolidated bibliography).
        </li>
      </ul>
      <h3>2.3. Automatic technical data</h3>
      <ul>
        <li>
          <strong>IP address</strong> (partially anonymized where technically possible).
        </li>
        <li>Browser type and version (User-Agent).</li>
        <li>Device operating system.</li>
        <li>
          Operation timestamps (login, upload, processing), for security and traceability.
        </li>
        <li>
          AI model usage logs (model invoked, input tokens, output tokens, estimated cost), to apply
          monthly quotas and prevent abuse.
        </li>
      </ul>
      <h3>2.4. Cookies and local storage</h3>
      <p>
        The Tool uses strictly necessary cookies and local storage (localStorage) to keep the
        authenticated session (via Supabase Auth) and to store confirmation of the usage notice.
        <strong> We do not use</strong> advertising cookies or third-party tracking for marketing
        purposes. Being strictly necessary, they do not require prior consent under GDPR or Law 1581.
      </p>

      <h2>3. Data the user must NOT upload and medical discretion</h2>
      <p>
        We understand that photographic records are crucial in certain specialties, but the user
        expressly undertakes to exercise medical discretion and not upload direct or manifestly
        identifiable patient data or sensitive third-party data. This includes:
      </p>
      <ul>
        <li>Full names, identification, direct contact details or medical history of any patient.</li>
        <li>Clinical images of non-blurred faces in which the patient is unequivocally identifiable.</li>
        <li>Personal health information of third parties without their consent or prior anonymization.</li>
      </ul>
      <p>
        If the Operator detects or is notified of the malicious upload of this type of information,
        it will request immediate anonymization and may suspend the account in cases of gross negligence.
      </p>

      <h2>4. Purposes of processing and Exploitation of Aggregated Data</h2>
      <p>We process data for the following main purposes:</p>
      <ul>
        <li>To provide and operate the academic organization service for the user.</li>
        <li>To process images and text through third-party AI services under strict data processing agreements (DPA).</li>
        <li>
          To verify bibliographic references through our Anti-Hallucination Engine against external academic databases (CrossRef, PubMed/NCBI, OpenAlex).
        </li>
        <li>To apply monthly quotas and, where applicable, bill paid plans.</li>
        <li>To improve the Tool&rsquo;s security, audit AI usage and prevent fraud or abuse.</li>
      </ul>
      <p className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium my-6">
        <strong>Commercial Use and Pharma Insights:</strong> MDCONGRESS does NOT sell, rent or share identifiable personal data (such as your name, email or profile) with third parties for marketing purposes. Nor do we use your original photographs to train foundational generative AI models.<br/><br/>
        However, MDCONGRESS processes data derived from the platform (such as the most cited bibliographic references, trends in emerging pathologies and the topics addressed at global congresses) to create <strong>fully anonymized and aggregated</strong> datasets. This market intelligence (&quot;Pharma Insights&quot;) is the exclusive property of MDCONGRESS and may be commercialized, licensed or shared with the pharmaceutical industry and scientific societies. By accepting this policy, you consent to the irreversible aggregation and de-identification of usage data for these purposes.
      </p>

      <h2>5. Legal basis for processing</h2>
      <p>Processing is supported by the following legal bases:</p>
      <ul>
        <li>
          <strong>Express consent</strong> of the data subject upon registering and accepting our
          Terms (Law 1581 art. 9; GDPR art. 6.1.a).
        </li>
        <li>
          <strong>Performance of a contract</strong> for the provision of the service (GDPR art. 6.1.b).
        </li>
        <li>
          <strong>Legitimate commercial interest</strong> of the Operator in processing fully anonymized data for the creation of metrics and market intelligence, as well as for system security (GDPR art. 6.1.f).
        </li>
      </ul>

      <h2>6. External processors and sub-processors</h2>
      <p>
        To provide the service we share data with the following data processors. By using the Tool,
        the user authorizes this transfer. These providers are prohibited from using the user&rsquo;s
        data to train their own foundational models (Zero Data Retention / API Data Privacy).
      </p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Main Headquarters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase Inc.</td>
            <td>Authentication, database, file storage</td>
            <td>United States</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Hosting of the web application and serverless functions</td>
            <td>United States</td>
          </tr>
          <tr>
            <td>OpenAI, L.L.C. / Google LLC / Anthropic, PBC</td>
            <td>Multimodal and text processing via API (No training)</td>
            <td>United States</td>
          </tr>
          <tr>
            <td>Crossref / NCBI (PubMed) / OpenAlex</td>
            <td>Anti-Hallucination Engine (Bibliographic verification)</td>
            <td>UK / USA</td>
          </tr>
        </tbody>
      </table>

      <h2>7. International data transfer</h2>
      <p>
        The user acknowledges and expressly authorizes that their personal data may be transferred
        and processed outside their country of residence, primarily in the United States of America
        and other countries where our processors operate.
      </p>
      <p>
        Under <strong>Law 1581 of 2012 (Colombia)</strong> and regional equivalents, this transfer
        is deemed to have the explicit consent of the data subject. Under the <strong>GDPR (EU)</strong>, transfers to the United States are covered by <em>Standard Contractual Clauses</em> or the <em>Data Privacy Framework</em>.
      </p>

      <h2>8. Retention period</h2>
      <ul>
        <li>
          <strong>Account and profile data</strong>: while the account is active, plus 30 calendar
          days after a deletion request, unless there is a legal retention obligation.
        </li>
        <li>
          <strong>Uploaded content</strong>: until the user deletes it. The user has full control to
          delete photos or congresses at any time.
        </li>
        <li>
          <strong>Aggregated anonymized data</strong>: MDCONGRESS permanently retains the de-identified statistics (&quot;Pharma Insights&quot;) derived from the historical use of the platform.
        </li>
      </ul>

      <h2>9. Rights of the data subject</h2>
      <p>
        In accordance with Law 1581 of 2012, the GDPR and equivalent rules, the data subject has the right to:
      </p>
      <ul>
        <li><strong>Know, update and rectify</strong> their personal data.</li>
        <li><strong>Access and obtain a copy</strong> of the data (portability).</li>
        <li><strong>Revoke consent and request deletion</strong> of the data.</li>
        <li><strong>Object</strong> to processing based on legitimate interest.</li>
      </ul>
      <p>
        To exercise these rights, write to{" "}
        <a href="mailto:cacristanchoo@gmail.com" className="underline underline-offset-2">
          cacristanchoo@gmail.com
        </a>{" "}
        stating: full name, identification and a description of the right being exercised. Inquiries will be resolved within a maximum of 10 business days and claims within 15 business days.
      </p>

      <h2>10. Security measures</h2>
      <p>The Operator applies the following enterprise-level technical and organizational measures:</p>
      <ul>
        <li>Encryption in transit (HTTPS / TLS 1.2 or higher) in all communications.</li>
        <li>Encryption at rest in the database and storage (AWS/Supabase).</li>
        <li>Per-user isolation through <em>Row-Level Security</em> (RLS) in the database.</li>
        <li>Access control through robust authentication and password encryption (bcrypt).</li>
        <li>Active monitoring and auditing of AI usage and infrastructure security.</li>
      </ul>
      <p>
        If we detect a security incident that compromises personal data, we will notify the affected
        user and the competent authority within the stipulated legal timeframes (e.g., 72 hours for GDPR).
      </p>

      <h2>11. Minors</h2>
      <p>
        The Tool is intended exclusively for healthcare professionals and university students over
        18 years of age. We do not deliberately process personal data of minors.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        The Operator may update this policy to reflect operational, commercial or legal developments.
        Substantial changes will be communicated through the application or by email. Continued use
        after publication constitutes tacit acceptance of the new terms.
      </p>

      <footer className="not-prose mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-2">
        <p>
          See also:{" "}
          <Link href="/dashboard/legal/terminos" className="underline underline-offset-2 text-slate-700">
            Terms of use
          </Link>
          .
        </p>
        <p>
          MDCONGRESS Legal &amp; Privacy Team. The Operator&rsquo;s commercial and tax identification
          is available upon direct request for institutions and formal processes.
        </p>
      </footer>
    </article>
  )
}
