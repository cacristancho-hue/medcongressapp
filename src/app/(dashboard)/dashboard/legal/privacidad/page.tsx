import Link from "next/link"

export const metadata = {
  title: "Política de privacidad · MDCONGRESS",
  description: "Política de tratamiento de datos personales — MDCONGRESS AI Companion.",
}

const LAST_UPDATED = "11 de mayo de 2026"

export default function PrivacidadPage() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
          Documento Legal Corporativo
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Política de tratamiento de datos personales
        </h1>
        <p className="text-sm text-slate-500 mt-2">Última actualización: {LAST_UPDATED}</p>
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
