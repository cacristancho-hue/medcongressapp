import Link from "next/link"

export const metadata = {
  title: "Términos de uso · MedCongress",
  description: "Términos y condiciones de uso de MedCongress AI Companion.",
}

const LAST_UPDATED = "9 de mayo de 2026"

export default function TerminosPage() {
  return (
    <article className="max-w-3xl mx-auto py-8 px-4 prose prose-slate prose-sm sm:prose-base">
      <header className="not-prose mb-8 pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
          Borrador para revisión legal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Términos de uso</h1>
        <p className="text-sm text-slate-500 mt-2">Última actualización: {LAST_UPDATED}</p>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          Documento elaborado tomando como referencia: Ley 1581 de 2012 y Decreto 1377 de 2013
          (Colombia), Reglamento (UE) 2016/679 (GDPR), Ley 13.709 de 2018 (LGPD Brasil), normativa
          INVIMA sobre dispositivos médicos, Reglamento (UE) 2017/745 (MDR), 21 CFR 820 (FDA).
          Antes de uso en producción debe ser revisado y firmado por un asesor legal con conocimiento
          de software médico, protección de datos y derecho del consumidor en la jurisdicción de
          operación.
        </p>
      </header>

      <h2>1. Naturaleza del servicio</h2>
      <p>
        MedCongress AI Companion (en adelante, &ldquo;la Herramienta&rdquo;) es una aplicación web
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

      <h2>4. Datos identificables de pacientes — Prohibición expresa</h2>
      <p>
        El usuario se compromete expresamente a <strong>no cargar</strong> imágenes ni textos que
        contengan datos identificables de pacientes. Esto incluye, sin limitarse a:
      </p>
      <ul>
        <li>Nombres, números de identificación, datos de contacto.</li>
        <li>Números de historia clínica, expediente o registro hospitalario.</li>
        <li>Fotografías clínicas en las que el paciente sea identificable.</li>
        <li>Cualquier combinación de variables que permita reidentificar a una persona natural.</li>
      </ul>
      <p>
        El usuario es el único responsable del contenido que carga. La Herramienta no realiza
        verificación automática del contenido cargado y no asume responsabilidad por incumplimientos
        del usuario en esta materia. Si el equipo de la Herramienta detecta carga de datos
        identificables de pacientes, podrá suspender la cuenta sin previo aviso, eliminar el
        contenido infractor y, en casos graves, reportar al usuario ante la autoridad correspondiente.
      </p>

      <h2>5. Inteligencia artificial — Limitaciones declaradas</h2>
      <p>
        La extracción de texto, la clasificación temática y los resúmenes generados utilizan modelos
        de IA que pueden producir resultados inexactos, incompletos, o inventar información
        (alucinaciones). El usuario debe verificar la información antes de utilizarla en cualquier
        contexto profesional.
      </p>
      <p>
        Las referencias bibliográficas detectadas se marcan con uno de los siguientes estados, según
        verificación contra bases externas (CrossRef, PubMed/NCBI, OpenAlex):
      </p>
      <ul>
        <li>
          <strong>Verificada</strong>: existe coincidencia confiable en al menos una base
          bibliográfica externa.
        </li>
        <li>
          <strong>Parcialmente verificada</strong>: hay coincidencia parcial; revise manualmente.
        </li>
        <li>
          <strong>Ambigua</strong>: hay múltiples candidatos posibles.
        </li>
        <li>
          <strong>No verificada</strong>: no se encontraron coincidencias suficientes.
        </li>
        <li>
          <strong>Retractada</strong>: la fuente externa indica que el artículo fue retractado;
          NO debe citarse como evidencia válida.
        </li>
      </ul>
      <p>
        El usuario es responsable de confirmar manualmente toda cita antes de publicarla, citarla
        en clase o usarla como sustento de cualquier afirmación clínica o académica.
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

      <h2>7. Propiedad intelectual y licencia limitada</h2>
      <p>
        Las fotografías y textos cargados siguen perteneciendo al autor original del material o al
        usuario que los captó, según corresponda. La Herramienta no reclama propiedad sobre el
        contenido del usuario.
      </p>
      <p>
        Sin embargo, para que la Herramienta pueda prestar el servicio, el usuario otorga al
        operador una <strong>licencia mundial, no exclusiva, libre de regalías, gratuita,
        intransferible y limitada en el tiempo de uso del servicio</strong>, con el único propósito
        de:
      </p>
      <ul>
        <li>
          Almacenar el contenido en la infraestructura del servicio (Supabase Storage en Estados
          Unidos).
        </li>
        <li>
          Procesar el contenido a través de los modelos de IA y servicios de verificación
          bibliográfica enumerados en la Política de Privacidad.
        </li>
        <li>
          Generar resúmenes, transcripciones, clasificaciones y reportes derivados, los cuales se
          entregan exclusivamente al usuario que los originó.
        </li>
        <li>
          Mostrarle al usuario el contenido y sus derivados a través de la interfaz de la
          Herramienta.
        </li>
      </ul>
      <p>
        Esta licencia <strong>no</strong> autoriza al operador a publicar el contenido, compartirlo
        con terceros distintos a los procesadores declarados, ni a usarlo para entrenar modelos de
        IA propios. La licencia termina cuando el usuario elimina el contenido o cierra la cuenta.
      </p>
      <p>
        Los resúmenes y reportes generados son resultado de procesamiento automatizado y se
        entregan al usuario sin garantía de originalidad ni de no infracción. El usuario es
        responsable de respetar los derechos de autor del material original al usar el contenido
        derivado.
      </p>

      <h2>8. Cuotas, planes y precios</h2>
      <p>
        La Herramienta aplica cuotas mensuales por plan. El plan gratuito tiene límites de análisis
        de imagen, reportes generados y un tope económico de procesamiento de IA. Los planes pagos
        amplían estos límites. Las cuotas y precios pueden cambiar con previo aviso de al menos 30
        días calendario, comunicado a través de la Herramienta o por correo electrónico.
      </p>

      <h2>9. Garantías y limitación de responsabilidad</h2>
      <p>
        La Herramienta se ofrece &ldquo;tal cual&rdquo; (<em>as is</em>) y &ldquo;según
        disponibilidad&rdquo; (<em>as available</em>), sin garantía de disponibilidad continua,
        ausencia de errores, exactitud, integridad ni adecuación a propósito particular.
      </p>
      <p>
        En la máxima extensión permitida por la ley aplicable, el operador <strong>no será
        responsable</strong> por daños indirectos, incidentales, especiales, consecuenciales,
        morales, lucro cesante, pérdida de oportunidad, pérdida de datos, ni decisiones clínicas
        derivadas del uso del contenido generado.
      </p>
      <p>
        La responsabilidad total del operador por cualquier reclamo derivado de o relacionado con la
        Herramienta no excederá, en el agregado, el mayor de: <strong>(i)</strong> el monto pagado
        por el usuario al operador en los doce (12) meses inmediatamente anteriores al hecho que
        origina la reclamación, o <strong>(ii)</strong> cien dólares de los Estados Unidos de
        América (USD $100).
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
          Borrador interno · Pendiente de firma por asesor legal antes de uso en producción. La
          identificación del operador (nombre, NIT/CC, dirección, teléfono) debe completarse antes
          de publicar.
        </p>
      </footer>
    </article>
  )
}
