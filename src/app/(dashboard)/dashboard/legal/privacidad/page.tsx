import Link from "next/link"

export const metadata = {
  title: "Política de privacidad · MDCONGRESS",
  description: "Política de tratamiento de datos personales — MDCONGRESS AI Companion.",
}

const LAST_UPDATED = "9 de mayo de 2026"

export default function PrivacidadPage() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
          Borrador para revisión legal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Política de tratamiento de datos personales
        </h1>
        <p className="text-sm text-slate-500 mt-2">Última actualización: {LAST_UPDATED}</p>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          Documento elaborado conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Colombia),
          el Reglamento (UE) 2016/679 (GDPR), la Ley 13.709 de 2018 (LGPD Brasil) y la Ley Federal
          de Protección de Datos Personales en Posesión de los Particulares (México). Antes de su
          uso en producción debe ser revisado y firmado por un asesor legal y, en Colombia,
          inscrito en el Registro Nacional de Bases de Datos (RNBD) ante la Superintendencia de
          Industria y Comercio (SIC).
        </p>
      </header>

      <h2>1. Identificación del responsable del tratamiento</h2>
      <p>
        <strong>[Pendiente de completar antes de publicar — datos requeridos por Ley 1581 art.
        15]</strong>
      </p>
      <ul>
        <li>
          <strong>Razón social / nombre del titular</strong>:{" "}
          <span className="text-slate-500">[Pendiente]</span>
        </li>
        <li>
          <strong>Documento de identificación (NIT o cédula)</strong>:{" "}
          <span className="text-slate-500">[Pendiente]</span>
        </li>
        <li>
          <strong>Dirección física</strong>:{" "}
          <span className="text-slate-500">[Pendiente — Colombia]</span>
        </li>
        <li>
          <strong>Correo electrónico</strong>:{" "}
          <a href="mailto:cacristanchoo@gmail.com" className="underline underline-offset-2">
            cacristanchoo@gmail.com
          </a>
        </li>
        <li>
          <strong>Teléfono de contacto</strong>:{" "}
          <span className="text-slate-500">[Pendiente]</span>
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

      <h2>3. Datos que el usuario NO debe cargar — Categoría especial</h2>
      <p>
        El usuario se compromete expresamente a no cargar datos identificables de pacientes ni
        datos sensibles de terceros. Esto incluye:
      </p>
      <ul>
        <li>Nombres, identificación, datos de contacto o historia clínica de cualquier paciente.</li>
        <li>Imágenes clínicas en las que el paciente sea identificable.</li>
        <li>Información de salud personal de terceros sin su consentimiento.</li>
      </ul>
      <p>
        Si el Operador detecta o recibe noticia de la carga de este tipo de información, podrá
        suspender la cuenta sin previo aviso, eliminar de inmediato el contenido infractor y, en
        casos graves, reportar el hecho ante la SIC u otra autoridad competente.
      </p>

      <h2>4. Finalidades del tratamiento</h2>
      <p>Tratamos los datos exclusivamente para las siguientes finalidades:</p>
      <ul>
        <li>Prestar y operar el servicio de organización académica.</li>
        <li>Procesar imágenes y textos a través de servicios de IA de terceros.</li>
        <li>
          Verificar referencias bibliográficas en bases académicas externas (CrossRef, PubMed/NCBI,
          OpenAlex).
        </li>
        <li>Aplicar cuotas mensuales y, cuando aplique, facturar planes pagos.</li>
        <li>
          Comunicarnos con el usuario sobre el servicio (cambios sustanciales, incidentes,
          actualizaciones).
        </li>
        <li>
          Cumplir obligaciones legales, tributarias, contables y responder requerimientos de
          autoridad competente.
        </li>
        <li>Auditar el uso de IA y prevenir fraude, abuso o ataques.</li>
        <li>Mejorar la Herramienta de forma agregada y anónima (estadísticas no individuales).</li>
      </ul>
      <p>
        <strong>No vendemos datos personales a terceros. No usamos los datos del usuario, ni los
        derivados (OCR, resúmenes), para entrenar modelos de IA propios ni de terceros.</strong>
      </p>

      <h2>5. Base legal del tratamiento</h2>
      <p>El tratamiento se ampara en las siguientes bases legales:</p>
      <ul>
        <li>
          <strong>Consentimiento expreso</strong> del titular al registrarse y aceptar estos
          Términos (Ley 1581 art. 9; GDPR art. 6.1.a).
        </li>
        <li>
          <strong>Ejecución de contrato</strong> de prestación de servicio (GDPR art. 6.1.b).
        </li>
        <li>
          <strong>Obligación legal</strong> en lo concerniente a registros contables y de seguridad
          (GDPR art. 6.1.c).
        </li>
        <li>
          <strong>Interés legítimo</strong> del Operador en prevenir fraude y mantener la seguridad
          de la Herramienta (GDPR art. 6.1.f).
        </li>
      </ul>

      <h2>6. Encargados y procesadores externos</h2>
      <p>
        Para prestar el servicio compartimos datos con los siguientes encargados de tratamiento.
        El usuario, al usar la Herramienta, autoriza esta transferencia.
      </p>
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Finalidad</th>
            <th>País / Sede</th>
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
            <td>OpenAI, L.L.C.</td>
            <td>OCR de imágenes y síntesis de texto (modelos GPT)</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>Anthropic, PBC</td>
            <td>Razonamiento y síntesis (modelos Claude), si está habilitado</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>Google LLC</td>
            <td>Procesamiento multimodal (modelos Gemini), si está habilitado</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>Crossref (Publishers International Linking Association)</td>
            <td>Verificación de referencias bibliográficas (DOI)</td>
            <td>Reino Unido</td>
          </tr>
          <tr>
            <td>National Center for Biotechnology Information (NCBI / PubMed)</td>
            <td>Verificación de referencias biomédicas</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>OpenAlex (OurResearch, sin ánimo de lucro)</td>
            <td>Verificación de referencias académicas amplias</td>
            <td>Estados Unidos / Canadá</td>
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
        Bajo la <strong>Ley 1581 de 2012 (Colombia)</strong>, se entiende que esta transferencia
        cuenta con el consentimiento del titular. Adicionalmente, el Operador procura suscribir con
        cada encargado las cláusulas contractuales tipo o equivalentes mecanismos de garantía
        previstos en el Decreto 1377 de 2013.
      </p>
      <p>
        Bajo el <strong>GDPR (UE)</strong>, las transferencias a Estados Unidos se amparan en las{" "}
        <em>Cláusulas Contractuales Tipo</em> aprobadas por la Comisión Europea o, cuando aplique,
        en el <em>EU-U.S. Data Privacy Framework</em> al que están adheridas las contrapartes que lo
        permitan. El usuario reconoce que el régimen jurídico de los Estados Unidos en materia de
        protección de datos puede diferir del europeo y, no obstante ello, autoriza expresamente la
        transferencia.
      </p>

      <h2>8. Tiempo de conservación</h2>
      <ul>
        <li>
          <strong>Datos de cuenta y perfil</strong>: mientras la cuenta esté activa, más 30 días
          calendario tras solicitud de eliminación, salvo obligación legal de retención.
        </li>
        <li>
          <strong>Contenido cargado y derivados</strong>: mientras el usuario los conserve. El
          usuario puede borrar fotos individuales, congresos completos o su cuenta entera en
          cualquier momento.
        </li>
        <li>
          <strong>Logs de uso de IA y de seguridad</strong>: 12 meses, para auditoría de cuotas y
          detección de abuso.
        </li>
        <li>
          <strong>Registros contables y tributarios</strong>: el plazo mínimo exigido por la
          legislación aplicable (Estatuto Tributario Colombia: 5 años; equivalente local).
        </li>
      </ul>

      <h2>9. Derechos del titular</h2>
      <p>
        Conforme a la Ley 1581 de 2012, el GDPR y normas equivalentes, el titular tiene derecho a:
      </p>
      <ul>
        <li>
          <strong>Conocer, actualizar y rectificar</strong> sus datos personales.
        </li>
        <li>
          <strong>Solicitar prueba</strong> de la autorización otorgada al Operador.
        </li>
        <li>
          Ser informado, previa solicitud, respecto del uso que se ha dado a sus datos.
        </li>
        <li>
          <strong>Acceder y obtener copia</strong> de los datos personales tratados (portabilidad).
        </li>
        <li>
          <strong>Revocar el consentimiento</strong> y solicitar la <strong>supresión</strong> de
          los datos.
        </li>
        <li>
          <strong>Oponerse</strong> al tratamiento basado en interés legítimo.
        </li>
        <li>
          <strong>Limitar</strong> el tratamiento en casos previstos por la ley.
        </li>
        <li>
          Presentar quejas ante la <strong>Superintendencia de Industria y Comercio</strong>{" "}
          (Colombia) o la autoridad de protección de datos correspondiente a su país.
        </li>
      </ul>
      <p>
        <strong>Plazos de respuesta (Ley 1581):</strong>
      </p>
      <ul>
        <li>
          <strong>Consultas</strong>: máximo 10 días hábiles desde recibida la solicitud, prorrogable
          por 5 días hábiles más con justificación.
        </li>
        <li>
          <strong>Reclamos</strong>: máximo 15 días hábiles desde el día siguiente a la recepción,
          prorrogable por 8 días hábiles más con justificación.
        </li>
      </ul>
      <p>
        Para ejercer estos derechos, escriba a{" "}
        <a href="mailto:cacristanchoo@gmail.com" className="underline underline-offset-2">
          cacristanchoo@gmail.com
        </a>{" "}
        indicando: nombre completo, identificación, descripción del derecho que ejerce y dirección
        de notificación.
      </p>

      <h2>10. Medidas de seguridad</h2>
      <p>El Operador aplica las siguientes medidas técnicas y organizativas:</p>
      <ul>
        <li>Cifrado en tránsito (HTTPS / TLS 1.2 o superior) en todas las comunicaciones.</li>
        <li>
          Cifrado en reposo en la base de datos y el almacenamiento (provisto por Supabase /
          Amazon RDS).
        </li>
        <li>
          Aislamiento por usuario mediante <em>Row-Level Security</em> en la base de datos.
        </li>
        <li>
          Control de acceso por autenticación obligatoria, contraseñas <em>hashed</em> con bcrypt.
        </li>
        <li>Auditoría de accesos y operaciones de IA (tabla <code>ai_usage</code>).</li>
        <li>Cuotas y topes de costo para prevenir uso indebido.</li>
        <li>Revisiones periódicas de las políticas de Row-Level Security.</li>
      </ul>
      <p>
        Ninguna medida es absolutamente impenetrable. Si detectamos un incidente de seguridad que
        comprometa datos personales, notificaremos al usuario afectado en el plazo más breve
        posible y, cuando aplique, a la SIC dentro de los <strong>15 días hábiles</strong>{" "}
        siguientes (Circular Externa SIC 002 de 2015) o a la autoridad europea correspondiente
        dentro de las <strong>72 horas</strong> (GDPR art. 33).
      </p>

      <h2>11. Menores de edad</h2>
      <p>
        La Herramienta está dirigida exclusivamente a profesionales de la salud y estudiantes
        universitarios mayores de 18 años. No tratamos deliberadamente datos personales de menores
        de edad. Si un padre, madre o tutor identifica que un menor ha creado una cuenta,
        contáctenos para eliminarla de forma inmediata.
      </p>

      <h2>12. Inscripción ante autoridades</h2>
      <p>
        El Operador se compromete a inscribir las bases de datos relevantes en el Registro Nacional
        de Bases de Datos (RNBD) ante la Superintendencia de Industria y Comercio (Colombia), una
        vez supere los umbrales de inscripción obligatoria establecidos por la ley aplicable, o
        antes si así lo exige la normativa.
      </p>

      <h2>13. Cambios a esta política</h2>
      <p>
        El Operador puede actualizar esta política. Los cambios sustanciales se comunicarán con
        antelación razonable a través de la aplicación o por correo electrónico. La fecha de
        &ldquo;última actualización&rdquo; siempre será visible al inicio de este documento.
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
          Borrador interno · Pendiente de firma por asesor legal e inscripción RNBD ante SIC. La
          identificación del Operador (NIT, dirección física, teléfono) debe completarse antes de
          publicar.
        </p>
      </footer>
    </article>
  )
}
