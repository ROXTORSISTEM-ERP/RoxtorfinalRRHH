import React, { useState, useRef } from 'react';
import { Course, Lesson, QuizQuestion, StaffEvaluation, Agent, AppSettings } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../utils/supabase';
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  Clock, 
  Zap, 
  Target,
  Users,
  Star,
  ShieldCheck,
  Layout,
  FileText,
  MessageCircle,
  Video,
  Presentation,
  GraduationCap,
  X,
  Download,
  Loader2
} from 'lucide-react';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  agents: Agent[];
  evaluations: StaffEvaluation[];
  setEvaluations: React.Dispatch<React.SetStateAction<StaffEvaluation[]>>;
  currentAgentId?: string | null;
  settings: AppSettings;
  onUpdateAgent: (agent: Agent) => void;
}

const INITIAL_COURSES: Course[] = [
  {
     id: 'contrato-legal',
    title: 'CONTRATO LABORAL Y CÓDIGO DE ÉTICA',
    description: 'Registro de condiciones de trabajo, beneficios LOTTT y compromiso Roxtor.',
    category: 'GERENCIA',
    lessons: [
      {
        id: 'l1',
        title: 'Términos de Contratación y Código de Ética',
        duration: '5 min',
        type: 'slides',
        content: `TÉRMINOS DE CONTRATACIÓN - ROXTOR\n\n
1. OBJETO: Prestación de servicios personales bajo dependencia en el cargo asignado.\n
2. REMUNERACIÓN: Se establece un sueldo base de 130,00 Bs. mensuales (pagaderos semanalmente), más bonos de productividad y asistencia en USD (tasa BCV).\n
3. JORNADA LABORAL: De Lunes a Sábado, de 8:00 AM a 5:00 PM (45 horas semanales según LOTTT).\n
4. VACACIONES: 2 semanas anuales. 1 semana de descanso en Diciembre (con aguinaldo) y 1 semana flexible durante el año.\n
5. CONFIDENCIALIDAD Y ÉTICA: Prohibido filtrar diseños o información interna. Prohibido el uso de equipos para fines personales. El maltrato a la maquinaria o falta de ética es causal de despido justificado.\n
6. COMPROMISO ROXTOR: La empresa dotará de uniformes, herramientas y ambiente seguro en Ciudad Guayana.`
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: "¿Entiende que su salario cuenta con un sueldo base y el excedente son Bonos laborales? Que no se puede usar los equipos de la empresa para beneficio propio sin autorización y Que la filtración de diseños,y la ausencia laboral consecutiva, es causal de despido?",
        options: ["Sí, lo Entiendo y acepto los términos", "No acepto, no deseo continuar en la empresa"],
        correctAnswer: 0
      }
    ],
    minScoreToPass: 100,
    topics: [
      "Salario Base 130,00 Bs y Bonos.",
      "Beneficios LOTTT y Vacaciones",
      "Causales de Despido Justificado",
      "Protección de Diseños Full-Print",
      "Seguridad y Dotación Roxtor"
    ]
  }, 
  {
    id: 'course_sales',
    title: 'Maestría en Ventas y Atención Roxtor',
    description: 'Aprende a vender con narrativa emocional, cerrar pedidos y manejar clientes difíciles.',
    category: 'VENTAS',
    minScoreToPass: 80,
    lessons: [
      {
        id: 'l1',
        title: 'El ADN de Roxtor: Soluciones Creativas',
        content: `
          # Bienvenido a la Academia Roxtor
          
          En Roxtor, vendemos **Soluciones Creativas**. Todo es en PRO de SOLUCIONAR las Demandas del cliente, dentro de nuestras Politicas de Venta
          
          ### Pilares de la Venta:
          1. **Escucha Activa:** Entiende el motivo del cliente (cumpleaños, evento, marca).
          2. **Asesoría Técnica:** Recomienda la tela correcta (Microdurazno, Algodón, Terry Spun, Piqué, Jersey o dryfit,etc).
          3. **Narrativa Emocional:** Haz que el cliente se imagine con el producto final.
          
          ### El Cierre Perfecto:
          - Solicita el 50% de abono.
          - Confirma fecha de entrega (3-45 días hábiles, segun corresponda).
          - Pide el capture de pago y los archivos de referencia.
        `,
        duration: '5 min',
        type: 'slides'
      },
      {
        id: 'l2',
        title: 'Manejo de Objeciones y Tiempos',
        content: `
          # Manejo de Objeciones
          
          ### "Está muy caro"
          - Respuesta: "Nuestra calidad en sublimación y bordado garantiza durabilidad. Es una inversión en tu imagen."
          
          ### "Lo necesito para mañana"
          - Respuesta: "Podemos aplicar el **Protocolo Express** con un recargo adicional si el pedido entra antes de las 12:00 PM."
          
          ### Check-list de Recepción:
          - Nombre completo y Cédula.
          - Teléfono de contacto.
          - Talla y Color exactos.
          - Motivo del diseño.
        `,
        duration: '7 min',
        type: 'slides'
      },
      {
        id: 'l_v3',
        title: 'Upselling: Ventas Sugeridas para incrementar ventas',
        content: `
          # Vender más es Asesorar mejor
          
          El Upselling no es presionar, es ofrecer complementos que el cliente necesita pero no ha pensado.
          
          ### Estrategias:
          1. **Combos:** "Por solo $5 más, llévate la gorra personalizada a juego con tu franela."
          2. **Calidad Premium:** "Esta tela tiene tecnología dry-fit, ideal para el evento deportivo que mencionas."
          3. **Cantidad:** "A partir de 12 unidades, el precio baja un 15%. ¿Te gustaría incluir a todo el equipo?"
        `,
        duration: '6 min',
        type: 'slides'
      },
      {
        id: 'l_v4',
        title: 'Atención Post-Venta y Reclamos',
        content: `
          # El Cliente es nuestro Embajador
          
          Un reclamo bien manejado convierte a un cliente molesto en un fan leal.
          
          ### Protocolo de Reclamo:
          1. **Calma:** Escucha sin interrumpir.
          2. **Validación:** "Entiendo su molestia, vamos a revisar qué sucedió."
          3. **Solución:** Si es error de Roxtor, se repite el trabajo sin costo. Si es error del cliente, ofrece un descuento para la corrección.
          
          **Nunca digas "No es mi culpa". Di "Vamos a solucionarlo".**
        `,
        duration: '8 min',
        type: 'slides'
      },
      {
        id: 'l_manual_1',
        title: 'Manual: Propósito y Filosofía ROXTOR',
        content: `
          # MANUAL DE CAPACITACIÓN: Atención al Cliente
          
          ### 1. Propósito del manual
          Este manual establece el modelo de atención al cliente de ROXTOR.
          Objetivos:
          - Estandarizar la forma de atender clientes.
          - Reducir errores en pedidos.
          - Mejorar la experiencia del cliente.
          - Aumentar ventas recurrentes.
          - Proteger la reputación de la empresa.
          
          ### 2. Filosofía de servicio ROXTOR
          En ROXTOR no solo vendemos prendas personalizadas. Ayudamos a proyectar identidad.
          Nuestro servicio debe ser: **Profesional, Claro, Responsable y Orientado a Soluciones.**
          
          ### 3. Tipos de clientes
          - **Cliente B2B (Empresas):** Colegios, clínicas, restaurantes. Buscan uniformidad, imagen corporativa y durabilidad. Representan estabilidad y volumen.
          - **Cliente B2C (Consumidor final):** Buscan franelas personalizadas, gorras, estampados. Generan flujo de caja inmediato.
        `,
        duration: '10 min',
        type: 'slides'
      },
      {
        id: 'l_manual_2',
        title: 'Manual: Principios y Proceso Estándar',
        content: `
          # Principios de Atención ROXTOR
          
          1. **Escuchar primero:** Entender qué, para qué, cuándo y cuántas unidades necesita.
          2. **Orientar al cliente:** Asesorar sobre bordado, DTF, vinil, sublimación o confección.
          3. **Confirmar detalles:** Diseño, colores, tallas, telas, cantidad, ubicación del logo. Evita errores en producción.
          4. **Comunicación clara:** Tiempos de entrega, costos y condiciones de pago. **Nunca prometer tiempos irreales.**
          
          ### Proceso Estándar de Atención:
          - **Paso 1 - Saludo:** "Buenos días, bienvenido a ROXTOR. ¿En qué podemos ayudarte hoy?"
          - **Paso 2 - Identificar necesidad:** Preguntar por tipo de evento, cantidad, logo y fecha.
          - **Paso 3 - Presentar opciones:** Explicar por qué una técnica es mejor que otra.
          - **Paso 4 - Cotización:** Incluir prenda, técnica, cantidad, precio y tiempo.
          - **Paso 5 - Confirmación:** Diseño final, tallas y forma de pago antes de producción.
        `,
        duration: '12 min',
        type: 'slides'
      },
      {
        id: 'l_manual_3',
        title: 'Manual: Gestión de Crisis y Errores',
        content: `
          # Manejo de Clientes Difíciles
          
          Reglas importantes:
          - Mantener la calma.
          - Escuchar sin interrumpir.
          - Mostrar empatía.
          - Buscar una solución.
          *Ejemplo:* "Entiendo su preocupación. Permítame revisar su pedido y encontrar una solución."
          **NUNCA DISCUTIR CON UN CLIENTE.**
          
          ### Errores que debemos evitar (PROHIBIDO):
          - Ignorar mensajes de clientes.
          - Prometer entregas imposibles.
          - Aceptar pedidos sin confirmar detalles.
          - Discutir con clientes.
          - Transferir problemas sin resolverlos.
          
          *Estos errores generan pérdidas económicas directas.*
        `,
        duration: '10 min',
        type: 'slides'
      },
      {
        id: 'l_manual_4',
        title: 'Manual: Comunicación Digital e Imagen',
        content: `
          # Comunicación Digital (WhatsApp/Instagram)
          
          - Responder con rapidez.
          - Mantener tono profesional.
          - Evitar mensajes informales.
          - Explicar claramente precios y tiempos.
          
          ### Importancia de la Imagen
          El personal representa la marca. Debe mantener: **Uso correcto del Uniforme, Actitud profesional, Respeto, Comunicación clara y Disposición para ayudar.**
          
          ### Cierre de la Experiencia
          - Confirmar satisfacción.
          - Agradecer la compra.
          - Invitar a futuras órdenes.
          *Ejemplo:* "Gracias por confiar en ROXTOR. Estamos a su disposición para futuros pedidos."
          
          ### Compromiso del Equipo
          Cada empleado es responsable de cuidar la experiencia del cliente y representar profesionalmente a la empresa.
        `,
        duration: '10 min',
        type: 'slides'
      }
    ],
    quiz: [
      { id: 'q1', question: '¿Cuál es el eslogan de Roxtor?', options: ['Ventas al Mayor', 'Soluciones Creativas', 'Estampados Rápidos', 'La Mejor Tela'], correctAnswer: 1 },
      { id: 'q2', question: '¿Qué porcentaje de abono es obligatorio para iniciar un pedido?', options: ['20%', '30%', '50%', '100%'], correctAnswer: 2 },
      { id: 'qv3', question: '¿Qué es el Upselling en Roxtor?', options: ['Bajar los precios para vender', 'Ofrecer productos complementarios o de mayor calidad', 'Ignorar al cliente', 'Vender solo lo que el cliente pide'], correctAnswer: 1 },
      { id: 'qm4', question: '¿Qué tipo de cliente busca principalmente uniformidad e imagen corporativa?', options: ['Cliente B2C', 'Cliente B2B (Empresas)', 'Clientes de paso', 'Amigos de la empresa'], correctAnswer: 1 },
      { id: 'qm5', question: 'Según el manual, ¿cuál de estas acciones está PROHIBIDA?', options: ['Saludar profesionalmente', 'Asesorar sobre técnicas textiles', 'Discutir con un cliente', 'Confirmar tallas antes de producir'], correctAnswer: 2 }
    ]
  },
  {
    id: 'course_ops',
    title: 'Gestión de Operaciones y Flujo de Combate',
    description: 'Domina el Tablero de Combate, carga de gastos y mantenimiento de equipos.',
    category: 'OPERACIONES',
    minScoreToPass: 90,
    lessons: [
      {
        id: 'l3',
        title: 'El Tablero de Combate',
        content: `
          # Trazabilidad Total
          El sistema ROXTOR ERP funciona solo si alimentas los datos.
          ### El Flujo de la Orden:
          1. **Pendiente:** Recepción inicial.
          2. **Diseño:** Creación del arte.
          3. **Producción:** Bordado, Sublimación o Taller.
          4. **Entrega:** Control de calidad final.
          ### Regla de Oro:
          Nunca muevas una orden a 'Completado' sin haber registrado el pago final y la entrega física.
        `,
        duration: '10 min',
        type: 'slides'
      },
      {
        id: 'l_o2',
        title: 'Carga de Retiros y Gastos Diarios',
        content: `
          # Disciplina Financiera
          Cada dólar que sale de caja debe estar registrado.
          ### Tipos de Gastos:
          1. **Insumos:** Hilos, tintas, papel.
          2. **Logística:** Gasolina, envíos.
          3. **Retiros de Socios:** Deben cargarse bajo la categoría 'SOCIOS'.
          **Regla IDO:** Todo gasto debe cargarse el mismo día. Si se olvida, el Índice de Disciplina Operativa baja.
        `,
        duration: '8 min',
        type: 'slides'
      },
      {
        id: 'l_o3',
        title: 'Mantenimiento y Reducción de Desperdicios',
        content: `
          # Eficiencia Productiva
          ### Mantenimiento Preventivo:
          - Limpieza de cabezales de impresión cada mañana.
          - Lubricación de máquinas de bordado semanal.
          ### Reducción de Desperdicios:
          - Revisa el diseño antes de imprimir.
          - Haz pruebas de color en retazos de tela.
          - **Meta:** Menos del 2% de desperdicio por lote.
        `,
        duration: '12 min',
        type: 'slides'
      }
    ],
    quiz: [
      { id: 'q3', question: '¿Qué significa el prefijo WEB en una orden?', options: ['Pedido de tienda', 'Pedido generado desde el Radar/Web', 'Pedido de aliado', 'Pedido urgente'], correctAnswer: 1 },
      { id: 'qo2', question: '¿Cuándo debe cargarse un gasto en el sistema para no afectar el IDO?', options: ['Al final de la semana', 'El mismo día que ocurre', 'Cuando el gerente pregunte', 'Al mes siguiente'], correctAnswer: 1 }
    ]
  },
  {
    id: 'course_design',
    title: 'Protocolo de Diseño y Preparación Técnica',
    description: 'Aprende a preparar archivos para impresión, bordado y comunicación visual efectiva.',
    category: 'DISEÑO',
    minScoreToPass: 85,
    lessons: [
      {
        id: 'l4',
        title: 'Interpretación de Requerimientos',
        content: `
          # El Diseño como Base de la Producción
          Un error en diseño es un error en toda la cadena de producción.
          ### Pasos Críticos:
          1. **Lectura del Radar:** Revisa las notas técnicas y las imágenes de referencia cargadas por ventas.
          2. **Verificación de Formatos:** ¿Es para bordado o sublimación?
          3. **Mockup Digital:** Crea un montaje realista sobre la prenda para aprobación final del cliente.
        `,
        duration: '8 min',
        type: 'slides'
      },
      {
        id: 'l5',
        title: 'Preparación para Salida de Producción',
        content: `
          # Preparación Técnica Final
          ### Checklist de Salida:
          - **Vectores:** Todo el texto debe estar convertido en vector.
          - **Espejado:** Si es sublimación, el archivo debe estar en espejo (mirror).
          - **Medidas Reales:** Asegúrate de que el diseño en el archivo coincida con las medidas solicitadas.
          ### Aprobación:
          Carga el diseño final en el sistema y marca la orden como 'Lista para Producción'.
        `,
        duration: '10 min',
        type: 'slides'
      },
      {
        id: 'l_d3',
        title: 'Optimización para DTF y Sublimación',
        content: `
          # Técnicas de Impresión Especiales
          ### DTF (Direct to Film):
          - Fondo PNG transparente obligatorio.
          - Líneas mínimas de 0.5mm.
          ### Sublimación:
          - Archivos en CMYK, 300 DPI, en espejo (Mirror).
        `,
        duration: '12 min',
        type: 'slides'
      }
    ],
    quiz: [
      { id: 'q4', question: '¿En qué modo de color deben prepararse los archivos para impresión?', options: ['RGB', 'CMYK', 'Escala de Grises', 'Pantone Hexachrome'], correctAnswer: 1 },
      { id: 'q5', question: '¿Qué debe hacerse con los textos antes de enviar a producción?', options: ['Dejarlos como texto editable', 'Convertirlos a vectores', 'Rasterizarlos a 72 DPI', 'Cambiarles el color a rojo'], correctAnswer: 1 },
      { id: 'qd3', question: '¿Cuál es el requisito principal para un archivo DTF?', options: ['Fondo blanco', 'Fondo transparente', 'Estar en formato Word', 'Tener baja resolución'], correctAnswer: 1 }
    ]
  },
  {
    id: 'course_conduct',
    title: 'Cultura y Código de Conducta ROXTOR',
    description: 'Principios éticos, valores fundamentales y normas de comportamiento profesional.',
    category: 'GERENCIA',
    minScoreToPass: 100,
    lessons: [
      {
        id: 'lc1',
        title: 'Propósito y Valores ROXTOR',
        content: `
          # CÓDIGO DE CONDUCTA ROXTOR
          ### 1. Propósito
          Establece los principios que guían el comportamiento profesional.
          ### 2. Valores Fundamentales
          - Profesionalismo, Respeto, Disciplina Operativa, Orientación al Cliente, Excelencia y Confidencialidad.
        `,
        duration: '10 min',
        type: 'slides'
      },
      {
        id: 'lc2',
        title: 'Normas de Conducta y Responsabilidad',
        content: `
          ### 3. Normas de Conducta Profesional
          Respeto, cumplimiento de órdenes y ética. Tu comportamiento habla de ti.
          ### 4. Atención al Cliente
          Saludar siempre con actitud positiva. *"Con gusto le ayudamos a encontrar la mejor solución para su proyecto."*
        `,
        duration: '10 min',
        type: 'slides'
      },
      {
        id: 'lc3',
        title: 'Recursos, Confidencialidad e Imagen',
        content: `
          ### 5. Uso Responsable de Recursos
          Maquinaria y equipos exclusivos para uso laboral.
          ### 6. Confidencialidad
          Proteger diseños y estrategias.
          ### 7. Imagen Profesional
          Uso correcto del uniforme, orden y puntualidad.
        `,
        duration: '10 min',
        type: 'slides'
      }
    ],
    quiz: [
      { id: 'qc1', question: '¿Cuál es el objetivo principal del Código de Conducta?', options: ['Solo vigilar', 'Garantizar servicio de alto nivel y proteger la reputación', 'Precios', 'Logo'], correctAnswer: 1 },
      { id: 'qc2', question: '¿Qué debe hacer un colaborador si tiene un desacuerdo con una orden?', options: ['Ignorar', 'Comunicarlo de forma respetuosa', 'Discutir', 'Renunciar'], correctAnswer: 1 }
    ]
  }
];

const TrainingAcademy: React.FC<Props> = ({ agents, evaluations, setEvaluations, currentAgentId, settings, onUpdateAgent }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleStartCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentLessonIdx(0);
    setCurrentQuizIdx(0);
    setShowQuiz(false);
    setQuizResult(null);
    setQuizAnswers([]);
  };

  const handleNextLesson = () => {
    if (!selectedCourse) return;
    if (currentLessonIdx < selectedCourse.lessons.length - 1) {
      setCurrentLessonIdx(currentLessonIdx + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handleSubmitQuiz = () => {
    if (!selectedCourse) return;

    let correctCount = 0;
    const isContract = selectedCourse.id === 'contrato-legal';

    // 1. Calculamos las respuestas correctas comparando con .answer
    selectedCourse.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / selectedCourse.quiz.length) * 100;
    
    // 2. Definimos si pasó. 
    // Para el contrato exigimos 100% (aceptación total). Para otros, usamos su minScore o 80 por defecto.
    const minRequired = isContract ? 100 : (selectedCourse.minScoreToPass || 80);
    const passed = score >= minRequired;
    
    setQuizResult({ score, passed });

    // 3. Guardamos la evaluación en el historial
    if (currentAgentId) {
      const newEval: StaffEvaluation = {
        id: `eval_${Date.now()}`,
        agentId: currentAgentId,
        courseId: selectedCourse.id,
        score,
        completedAt: Date.now(),
        passed
      };

      // Guardamos en el estado global de evaluaciones
      setEvaluations(prev => [...prev, newEval]);

      // Si tienes Supabase configurado, aquí podrías disparar el insert a la tabla 'evaluations'
    }
  };

  const fiscalData = {
    name: "Inversiones Roxtor, C.A",
    rif: "J-40295973-7",
    address: "Ciudad Guayana, Estado Bolívar"
  };

  const generateCertificate = async () => {
    if (!certificateRef.current || !currentAgentId) return;
    setIsGeneratingCert(true);
    
    try {
      const agent = agents.find(a => a.id === currentAgentId);
      const isContract = selectedCourse?.id === 'contrato-legal';

      // Configuramos el PDF: Portrait para contrato, Landscape para diploma
      // Media Carta: 139.7 x 215.9 mm
      const pdf = new jsPDF({
        orientation: isContract ? 'portrait' : 'landscape',
        unit: 'mm',
        format: isContract ? [139.7, 215.9] : [279.4, 215.9]
      });

      if (isContract) {
        // --- LÓGICA DE CONTRATO (PÁGINA ÚNICA VERTICAL) ---
        const contractPage = certificateRef.current.querySelector('#contract-page') as HTMLElement;
        const canvas = await html2canvas(contractPage, { 
          scale: 2, 
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // --- LÓGICA DE DIPLOMA (PÁGINA 1 Y 2 HORIZONTAL) ---
        // Página 1: Diploma Neón
        const page1 = certificateRef.current.querySelector('#cert-page-1') as HTMLElement;
        const canvas1 = await html2canvas(page1, { 
          scale: 2, 
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#000814'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas1.height * pdfWidth) / canvas1.width;
        pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Página 2: Pensum Académico
        pdf.addPage([279.4, 215.9], 'landscape');
        const page2 = certificateRef.current.querySelector('#cert-page-2') as HTMLElement;
        const canvas2 = await html2canvas(page2, { 
          scale: 2, 
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `contratos/${currentAgentId}_${Date.now()}.pdf`;
      
      if (supabase) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(fileName, pdfBlob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contracts')
          .getPublicUrl(fileName);

        // Actualizar agente con el link del contrato si aplica
        if (isContract && agent) {
          const updatedAgent = { ...agent, contractUrl: publicUrl };
          onUpdateAgent(updatedAgent);
        }
      }

      const docType = isContract ? 'Contrato' : 'Certificado';
      pdf.save(`${docType}_Roxtor_${(agent?.fullName || 'Colaborador').replace(/\s+/g, '_')}.pdf`);
      alert(isContract ? 'Contrato generado y guardado exitosamente' : 'Certificado generado exitosamente');
    } catch (error) {
      console.error('Error en generación:', error);
      alert('Error al generar el documento');
    } finally {
      setIsGeneratingCert(false);
    }
  };

  return (
    <>
      {selectedCourse ? (
        <div className="fixed inset-0 z-[200] bg-[#000814] flex flex-col italic animate-in fade-in">
          <header className="h-20 border-b border-white/10 flex items-center justify-between px-10 bg-[#000814]/50 backdrop-blur-xl">
            <div className="flex items-center gap-6">
              <button onClick={() => setSelectedCourse(null)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all"><X size={24} /></button>
              <div>
                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedCourse.title}</h4>
                <p className="text-[9px] font-black text-blue-400 uppercase italic tracking-widest mt-1">{showQuiz ? 'EVALUACIÓN FINAL' : `LECCIÓN ${currentLessonIdx + 1}`}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-10 flex items-center justify-center">
            {!showQuiz ? (
              <div className="max-w-4xl w-full bg-white rounded-[4rem] p-16 shadow-2xl space-y-10 animate-in slide-in-from-bottom-8">
                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-lg">{selectedCourse.lessons[currentLessonIdx].content}</div>
                <div className="flex justify-between items-center pt-10 border-t border-slate-100">
                  <button disabled={currentLessonIdx === 0} onClick={() => setCurrentLessonIdx(currentLessonIdx - 1)} className="flex items-center gap-3 px-8 py-4 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ChevronLeft size={20} /> Anterior</button>
                  <button onClick={handleNextLesson} className="flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-[10px] uppercase italic bg-[#000814] text-white shadow-xl hover:bg-blue-600 transition-all">
                    {currentLessonIdx === selectedCourse.lessons.length - 1 ? 'Iniciar Evaluación' : 'Siguiente'} <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ) : quizResult ? (
              <div className="max-w-xl w-full bg-white rounded-[4rem] p-16 shadow-2xl text-center space-y-10 animate-in zoom-in-95">
                 <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-3 ${quizResult.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {quizResult.passed ? <Award size={64} /> : <X size={64} />}
                 </div>
                 <h3 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">
      {quizResult.passed 
        ? '¡PASO APROBADO!' 
        : (selectedCourse.id === 'contrato-legal' 
            ? 'DEBE ACEPTAR LOS TÉRMINOS PARA TRABAJAR EN ROXTOR' 
            : 'INTENTA DE NUEVO')}
    </h3>
                 <div className="bg-slate-50 p-8 rounded-3xl"><p className="text-5xl font-black italic text-[#000814]">{quizResult.score.toFixed(0)}%</p></div>
                 <div className="flex flex-col gap-4">
                   {quizResult.passed && (
                     <button onClick={generateCertificate} disabled={isGeneratingCert} className="w-full py-6 rounded-[2.5rem] font-black text-xs uppercase italic tracking-widest bg-emerald-600 text-white shadow-xl flex items-center justify-center gap-3">
                       {isGeneratingCert ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />} Descargar Certificado
                     </button>
                   )}
                   <button onClick={() => quizResult.passed ? setSelectedCourse(null) : handleStartCourse(selectedCourse)} className="w-full py-6 rounded-[2.5rem] font-black text-xs uppercase italic tracking-widest bg-[#000814] text-white">
                     {quizResult.passed ? 'Finalizar y Salir' : 'Reiniciar Curso'}
                   </button>
                 </div>
              </div>
            ) : (
              <div className="max-w-2xl w-full bg-white rounded-[4rem] p-16 shadow-2xl space-y-12 animate-in slide-in-from-bottom-8">
                 <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-blue-500 uppercase italic tracking-widest">Pregunta {currentQuizIdx + 1} de {selectedCourse.quiz.length}</p>
                      <div className="h-1 flex-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${((currentQuizIdx + 1) / selectedCourse.quiz.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                       <p className="font-black text-slate-800 uppercase italic text-lg leading-tight">
                         {selectedCourse.quiz[currentQuizIdx].question}
                       </p>
                       <div className="grid grid-cols-1 gap-4">
                          {selectedCourse.quiz[currentQuizIdx].options.map((opt, optIdx) => (
                            <button 
                              key={optIdx} 
                              onClick={() => { 
                                const newAns = [...quizAnswers]; 
                                newAns[currentQuizIdx] = optIdx; 
                                setQuizAnswers(newAns); 
                              }} 
                              className={`p-6 rounded-3xl border-4 text-left font-bold text-sm transition-all ${
                                quizAnswers[currentQuizIdx] === optIdx 
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 scale-[1.02] shadow-lg' 
                                  : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${quizAnswers[currentQuizIdx] === optIdx ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>
                                  {quizAnswers[currentQuizIdx] === optIdx && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                {opt}
                              </div>
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-8 border-t border-slate-100">
                    <button 
                      disabled={currentQuizIdx === 0} 
                      onClick={() => setCurrentQuizIdx(currentQuizIdx - 1)} 
                      className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase italic bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all disabled:opacity-30"
                    >
                      Anterior
                    </button>
                    
                    {currentQuizIdx < selectedCourse.quiz.length - 1 ? (
                      <button 
                        disabled={quizAnswers[currentQuizIdx] === undefined}
                        onClick={() => setCurrentQuizIdx(currentQuizIdx + 1)} 
                        className="flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase italic bg-[#000814] text-white shadow-xl hover:bg-blue-600 transition-all disabled:opacity-30"
                      >
                        Siguiente Pregunta
                      </button>
                    ) : (
                      <button 
                        disabled={quizAnswers.length < selectedCourse.quiz.length || quizAnswers.some(a => a === undefined)} 
                        onClick={handleSubmitQuiz} 
                        className="flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase italic bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-30"
                      >
                        Finalizar Evaluación
                      </button>
                    )}
                 </div>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-700 italic">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
              <h3 className="text-4xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Academia ROXTOR</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><GraduationCap size={14} className="text-violet-500" /> CAPACITACIÓN PROFESIONAL</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {INITIAL_COURSES.map((course) => {
              const isCompleted = evaluations.some(e => e.courseId === course.id && e.passed && e.agentId === currentAgentId);
              const isContract = course.id === 'contrato-legal';

              return (
                <div key={course.id} className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full italic">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-5 rounded-3xl text-white ${isCompleted ? 'bg-emerald-500' : (isContract ? 'bg-rose-600' : 'bg-[#004ea1]')}`}>
                      {isCompleted ? <CheckCircle2 size={28} /> : (isContract ? <ShieldCheck size={28} /> : <Star size={28} />)}
                    </div>
                    {isCompleted && <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full font-black text-[9px] uppercase italic">Completado</span>}
                  </div>

                  <div className="space-y-4 flex-1">
                    <h4 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter leading-tight">{course.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">{course.description}</p>
                  </div>

                  <div className="mt-10">
                    {isCompleted ? (
                      <button 
                        onClick={() => { setSelectedCourse(course); setQuizResult({ passed: true, score: 100 }); setShowQuiz(true); }}
                        className="w-full py-5 rounded-[2rem] font-black text-[10px] uppercase italic tracking-widest bg-emerald-600 text-white shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700"
                      >
                        <Download size={16} /> {isContract ? 'Descargar Contrato' : 'Ver Certificado'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStartCourse(course)} 
                        className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase italic tracking-widest text-white shadow-xl transition-all ${isContract ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#000814] hover:bg-blue-600'}`}
                      >
                        {isContract ? 'Firmar Contrato' : 'Iniciar Curso'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div> {/* CIERRE DE LA GRID */}
        </div> // CIERRE DEL CONTENEDOR DE CURSOS
      )}

      {/* --- BLOQUE OCULTO PARA CAPTURA (DISEÑO PREMIUM ROXTOR) --- */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div ref={certificateRef} className="flex flex-col">
          
          {/* PÁGINA 1: DIPLOMA FRONT (DISEÑO NEÓN) */}
          <div id="cert-page-1" className="w-[1100px] h-[850px] bg-[#000814] relative flex flex-col items-center justify-between p-20 overflow-hidden">
            {/* Luces Neón de Fondo */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -ml-40 -mb-40" />
            
            {/* Header aligned Left */}
            <div className="w-full flex items-center gap-6">
              <div className="w-24 h-24 flex items-center justify-center shadow-2xl">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-20 h-20 bg-[#004ea1] rounded-2xl flex items-center justify-center border-2 border-white/10">
                    <span className="text-white text-5xl font-black italic">R</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col text-left">
                <h1 className="text-white text-4xl font-black italic leading-none tracking-tighter">ACADEMY</h1>
                <p className="text-blue-400 text-xs font-black tracking-[0.4em] uppercase mt-1">Capacitación Profesional</p>
              </div>
            </div>

            {/* Main Body */}
            <div className="text-center z-10 flex flex-col items-center">
              <p className="text-white/60 text-2xl font-light italic mb-6">Se otorga con distinción el presente reconocimiento a:</p>
              <div className="mb-8 space-y-2">
                <h2 className="text-[80px] font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                  {agents.find(a => a.id === currentAgentId)?.fullName || 'COLABORADOR ROXTOR'}
                </h2>
                <p className="text-white/40 text-xl font-black tracking-[0.2em]">
                  C.I. {agents.find(a => a.id === currentAgentId)?.idNumber || 'V-00.000.000'}
                </p>
              </div>
              <div className="space-y-4 max-w-4xl">
                <p className="text-white/80 text-2xl font-light italic">Por haber completado satisfactoriamente el programa de formación avanzada y acreditación en:</p>
                <h3 className="text-5xl font-black text-blue-500 uppercase italic tracking-tight drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  {selectedCourse?.title || "Cultura y Código de Conducta ROXTOR"}
                </h3>
                <p className="text-white/80 text-xl font-light italic pt-4 px-12">
                  demostrando el compromiso, disciplina y dominio técnico exigidos por los estándares de calidad de la empresa.
                </p>
              </div>
            </div>

            {/* Footer Side Aligned */}
            <div className="w-full flex justify-between items-end border-t border-white/5 pt-12">
              <div className="text-left">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">FECHA DE EMISIÓN</p>
                <p className="text-white/70 text-2xl font-black italic uppercase">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="text-center">
                <div className="w-64 h-[1px] bg-white/20 mb-4 mx-auto" />
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">DIRECCIÓN GENERAL ROXTOR PZO</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">VALIDACIÓN TÉCNICA</p>
                <p className="text-white/70 text-xl font-mono font-bold tracking-tighter">RX-{currentAgentId?.substring(0,5).toUpperCase()}-{selectedCourse?.id?.substring(0,4).toUpperCase()}</p>
              </div>
            </div>

            {/* Bottom Legal Border */}
            <div className="absolute bottom-6 w-full text-center">
              <p className="text-white/40 text-[10px] font-black uppercase italic tracking-[0.2em]">
                INVERSIONES ROXTOR C.A. | RIF: J-402959737 | CIUDAD GUAYANA, ESTADO BOLÍVAR, VENEZUELA.
              </p>
            </div>
          </div>

          {/* PÁGINA 2: CONTENIDO ACADÉMICO (DINÁMICO SEGÚN CURSO) */}
          <div id="cert-page-2" className="w-[1100px] h-[850px] bg-white relative flex flex-col p-20 pb-32 border-[30px] border-slate-50 italic">
            
            {/* Header de la Hoja de Contenido */}
            <div className="flex justify-between items-start mb-16 border-b-4 border-slate-900 pb-8">
              <div>
                <h3 className="text-4xl font-black text-slate-900 uppercase leading-none">PENSUM DE</h3>
                <h3 className="text-5xl font-black text-blue-600 uppercase tracking-tighter">ACREDITACIÓN</h3>
              </div>
              <div className="text-right">
                <p className="text-slate-900 font-black text-2xl italic">{selectedCourse?.title || "PROGRAMA DE FORMACIÓN"}</p>
                <p className="text-blue-500 font-bold text-sm uppercase tracking-widest">Código de Curso: {selectedCourse?.id?.toUpperCase() || 'RT-GEN-01'}</p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-4">Módulos Completados:</h4>
              <div className="grid grid-cols-1 gap-4">
                {(selectedCourse?.topics || selectedCourse?.lessons.map(l => l.title) || []).map((topic, idx) => (
                  <div key={idx} className="flex items-center gap-6 border-l-8 border-blue-600 pl-8 py-6 bg-slate-50 rounded-r-[2rem]">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">{idx + 1}</div>
                    <p className="text-slate-900 font-black text-2xl uppercase italic">{topic}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 pt-10 border-t-2 border-slate-200 flex justify-between items-end">
              <div className="text-left space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validado por:</p>
                <p className="text-lg font-black text-slate-900 uppercase italic leading-none">INVERSIONES ROXTOR C.A.</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">RIF: J-402959737 | SEDE PRINCIPAL: CIUDAD GUAYANA, EDO. BOLÍVAR.</p>
              </div>
              <div className="text-right">
                <div className="w-48 h-12 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                  <span className="text-[8px] font-black text-slate-300 uppercase">Sello Digital Roxtor</span>
                </div>
              </div>
            </div>
          </div>

          {/* PÁGINA 3: CONTRATO (VERTICAL TAMAÑO MEDIA CARTA) */}
          <div id="contract-page" className="w-[139.7mm] min-h-[215.9mm] bg-white p-12 flex flex-col border border-slate-100 relative text-black">
            {(() => {
              const agent = agents.find(a => a.id === currentAgentId);
              if (!agent) return null;
              return (
                <div className="max-w-2xl mx-auto space-y-4 font-serif text-[10px] leading-relaxed text-justify">
                  <div className="text-center space-y-1 mb-6">
                    <h1 className="text-sm font-bold uppercase underline">CONTRATO INDIVIDUAL DE TRABAJO</h1>
                    <p className="text-[8px] font-bold">{fiscalData.name} - RIF {fiscalData.rif}</p>
                  </div>

                  <p>
                    Entre la sociedad mercantil <b>{fiscalData.name.toUpperCase()}</b>, domiciliada en {fiscalData.address}, debidamente inscrita ante el Registro Mercantil, 
                    representada en este acto por su Gerencia General, quien en lo sucesivo y a los efectos de este contrato se denominará <b>EL PATRONO</b>, 
                    por una parte; y por la otra el ciudadano(a) <b>{agent.fullName?.toUpperCase()}</b>, 
                    titular de la cédula de identidad Nro. <b>{agent.idNumber}</b>, quien en lo sucesivo se denominará 
                    <b> EL TRABAJADOR</b>, se ha convenido en celebrar el presente contrato de trabajo sujeto a las cláusulas que se detallan a continuación:
                  </p>

                  <div className="space-y-2">
                    <p><b>PRIMERA (OBJETO):</b> EL TRABAJADOR se obliga a prestar sus servicios personales bajo la dependencia de EL PATRONO, desempeñando el cargo de <b>{agent.role.toUpperCase()}</b>, realizando las funciones inherentes a dicha posición y aquellas que le sean asignadas de acuerdo a su capacidad y naturaleza del servicio.</p>
                    
                    <p><b>SEGUNDA (FECHA DE INGRESO):</b> La relación laboral objeto de este contrato inicia el día <b>{agent.entryDate ? format(new Date(agent.entryDate), "dd 'de' MMMM 'de' yyyy", { locale: es }) : '__________'}</b>. Se establece un período de prueba de noventa (90) días, conforme a la normativa legal vigente.</p>
                    
                    <p><b>TERCERA (REMUNERACIÓN Y MONEDA DE CUENTA):</b> Se establece un sueldo base mensual de <b>130 Bolívares</b>, el cual será cancelado mediante cuotas semanales. Adicionalmente, se acuerda el pago de un Bono de Productividad y Asistencia equivalente a la cantidad de <b>{agent.complementaryBonusUsd || 0} Dólares Americanos</b>, utilizando como única referencia de cálculo el tipo de cambio oficial publicado por el Banco Central de Venezuela (BCV) vigente a la fecha de cada pago efectivo.</p>
                    
                    <p><b>CUARTA (JORNADA LABORAL Y ASISTENCIA):</b> La jornada de trabajo será de Lunes a Sábado, en el horario de 8:00 AM a 5:00 PM, con una (1) hora de descanso intermedio. EL TRABAJADOR acepta que el registro de asistencia se llevará a través del sistema Roxtor ERP, y que los retrasos injustificados generarán los descuentos proporcionales correspondientes sobre su remuneración integral.</p>
                    
                    <p><b>QUINTA (VACACIONES Y BENEFICIOS):</b> Se establecen dos (2) semanas de vacaciones anuales colectivas. La primera semana se disfrutará en el mes de Diciembre (remunerada con salario correspondiente a 1 semana más 1 semana de sueldo como aguinaldo) y la segunda semana será de disfrute con el pago de su otra semana de salario previa planificación acordada con la Gerencia.</p>
                    
                    <p><b>SEXTA (CONFIDENCIALIDAD Y CÓDIGO DE ÉTICA):</b> EL TRABAJADOR se compromete formalmente a mantener la más estricta confidencialidad sobre los diseños, procesos de fabricación, cartera de clientes y cualquier información interna de {fiscalData.name.toUpperCase()}. Queda prohibida la reproducción o filtración de material propiedad de la empresa. El maltrato intencional de la maquinaria, equipos de computación o mobiliario será causal de despido justificado según lo previsto en la LOTTT.</p>
                    
                    <p><b>SÉPTIMA (COMPROMISO Y DOMICILIO):</b> La empresa se compromete a dotar de uniformes, herramientas de trabajo y ambiente de trabajo seguro. Para todos los efectos derivados de este contrato, las partes eligen como domicilio especial y excluyente a la ciudad de Puerto Ordaz, Ciudad Guayana, Estado Bolívar.</p>
                  </div>

                  <p className="pt-2">
                    Se firman dos (2) ejemplares de un mismo tenor y a un solo efecto, en Ciudad Guayana, a los {format(new Date(), 'dd')} días del mes de {format(new Date(), 'MMMM', { locale: es })} de 2026.
                  </p>

                  <div className="pt-12 grid grid-cols-2 gap-20 text-center">
                    <div className="border-t border-black pt-2">
                      <p className="font-bold">POR EL PATRONO</p>
                      <p className="text-[8px]">{fiscalData.name}</p>
                    </div>
                    <div className="border-t border-black pt-2">
                      <p className="font-bold">POR EL TRABAJADOR</p>
                      <p className="text-[8px]">{agent.fullName}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
};

export default TrainingAcademy;
