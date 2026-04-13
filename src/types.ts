
export type OrderStatus = 'Por Validar' | 'pendiente' | 'diseño' | 'impresión' | 'taller' | 'bordado' | 'sublimación' | 'completado' | 'corte_vinil' | 'planchado';

export type TaskStatus = 'esperando' | 'proceso' | 'terminado' | 'confeccion';

export enum VoiceName {
  ZEPHYR = 'Zephyr',
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir'
}

export interface Agent {
  id: string;
  name: string; // This will now be the nickname/apodo
  fullName?: string; // Nombre Completo
  idNumber?: string; // Cédula
  nickname?: string; // Apodo (redundant with name but following request)
  role: string;
  storeId: string;
  pin?: string;
  specialty?: string;
  phone?: string;
  hourlyRateUsd?: number;
  salaryType?: 'semanal' | 'quincenal' | 'comision' | 'fijo' | 'comision/quincena';
  salaryAmountUsd?: number;
  commissionPercent?: number;
  laborPrices?: {
    garmentType: string;
    priceUsd: number;
  }[];
  attendance?: AttendanceRecord[];
  entryDate?: string;
  baseSalaryBs?: number;
  complementaryBonusUsd?: number;
  pieceWorkRecords?: any[];
  contractUrl?: string;
  vacationStart?: string;
  vacationEnd?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  checkIn: number; // timestamp
  status: 'presente' | 'ausente' | 'tarde';
  locationVerified: boolean;
  storeId: string;
}

export type WorkshopWorkflowStatus = 'Pendiente' | 'Recibido' | 'INICIAR CORTE' | 'COSTURA' | 'TERMINADO' | 'Entregado';

export interface Workshop {
  id: string;
  name: string;
  department: 'COSTURA' | 'DTF' | 'GIGANTOGRAFIA' | 'TALONARIOS' | 'OTRO';
  customDepartment?: string;
  phone: string;
  storeId: string;
  laborPrices?: {
    garmentType: string;
    priceUsd: number;
  }[];
  specialties?: string[]; // Prendas en las que se especializa
  dailyCapacity?: number; // Capacidad de producción diaria (unidades)
  availabilityStatus?: 'disponible' | 'ocupado' | 'mantenimiento';
  activeOrders?: string[]; // IDs de órdenes activas
}

export interface DebtPayment {
  id: string;
  amountUsd: number;
  date: string;
  method: string;
  reference: string;
}

export interface Debt {
  id: string;
  creditorName: string;
  description: string;
  totalAmountUsd: number;
  dateAcquired: string;
  payments: DebtPayment[];
  status: 'pendiente' | 'pagado';
}

export interface PayrollPayment {
  id: string;
  agentId?: string;
  agentName: string;
  agentFullName?: string;
  agentIdNumber?: string;
  amountUsd: number;
  amountBs: number;
  bcvRate: number;
  date: string;
  method: string;
  reference: string;
  baseSalaryUsd?: number;
  commissionsUsd?: number;
  extraBonusesUsd?: number;
  extraBonusesDescription?: string;
  advancesDeductedUsd?: number;
  absencesDeductedUsd?: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface Expense {
  id: string;
  timestamp: number;
  description: string;
  amountUsd: number;
  amountBs: number;
  bcvRate: number;
  storeId: string;
  isAdvance: boolean;
  agentId?: string;
  responsibleAgentId?: string;
  invoiceNumber?: string;
  category?: 'Logística/Gasolina' | 'Desperdicios' | 'Insumos' | 'Nómina' | 'SOCIOS' | 'Otros';
  vendorName?: string;
  vendorRif?: string;
  invoiceDate?: string;
}

export interface OrderHistory {
  timestamp: number;
  agentId: string;
  action: string;
  status: OrderStatus;
}

export interface ServiceOrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceUsd: number;
  costUsd?: number; // Costo unitario al momento del pedido
  embroideryCommissionUsd?: number;
}

export type PaymentMethod = 'DOLARES $' | 'PAGO MOVIL' | 'TRANSFERENCIA' | 'EFECTIVO' | 'PUNTO DE VENTA' | 'BIOPAGO';

export interface DesignSpecs {
  colors?: string;
  position?: string;
  personalizationName?: string;
  personalizationLocation?: string;
  threadOrDesignColors?: string;
  additionalBackDesign?: string;
  additionalSpecs?: string;
  isApprovedByClient?: boolean;
  approvedAt?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  customerName: string;
  customerCi: string;
  customerPhone: string;
  items: ServiceOrderItem[];
  totalUsd: number;
  totalBs: number;
  totalCommissionsUsd?: number;
  abonoUsd: number;
  restanteUsd: number;
  status: OrderStatus;
  taskStatus: TaskStatus;
  history: OrderHistory[];
  bcvRate: number;
  issueDate: string;
  deliveryDate: string;
  technicalDetails: any;
  designSpecs?: DesignSpecs;
  referenceImages: string[];
  assignedAgentId?: string;
  assignedWorkshopIds?: string[]; 
  workshopWorkflowStatus?: { [workshopId: string]: WorkshopWorkflowStatus };
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentCapture?: string;
  issuingBank?: string;
  receivingBank?: string;
  finalPaymentMethod?: PaymentMethod;
  finalPaymentReference?: string;
  finalPaymentAmountUsd?: number;
  finalPaymentAmountBs?: number;
  customerType?: 'B2B' | 'B2C';
  creditLimitUsd?: number; // Límite de crédito para este cliente (si es B2B)
  expectedUtilityUsd?: number; // Utilidad proyectada (Ingreso - Costo)
  isDirectSale?: boolean;
  isDelivered?: boolean;
  isLogistics?: boolean;
  receiptUrl?: string;
  reworksCount?: number;
  isUrgent?: boolean;
  paymentDate?: string;
  finalDesignUrl?: string;
  workshopReferenceImage?: string; // Imagen específica para el taller (mockup, etc)
  workshopObservations?: string; // Observaciones específicas para el taller que tienen prioridad
  isInitialQueue?: boolean; // Flag para identificar órdenes de carga inicial sin valor monetario
  issuingAgentId?: string; // ID del agente que generó la orden
  issuingAgentName?: string; // Nombre del agente que generó la orden
  color_prenda?: string;
  tipo_tela?: string;
  tallas_registro?: string;
  resumen_diseno?: string;
  assigned_workshop_name?: string;
}

export interface CostComponent {
  id: string;
  name: string;
  amountUsd: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  priceRetail: number;
  priceWholesale: number;
  costUsd?: number;
  costBs?: number;
  costBreakdown?: CostComponent[];
  embroideryPriceComponent?: number;
  estimatedLaborMinutes?: number;
  currency: 'USD' | 'BS';
  material: string;
  description: string;
  additionalConsiderations?: string;
  imageUrl?: string;
  stock: number;
  category: 'producto' | 'servicio';
  line?: 'Uniformes corporativos' | 'Deportivos full print' | 'Colegios' | 'B2C sublimación' | 'Insumos' | 'Otros';
  targetAreas?: string;
}

export interface StoreConfig {
  id: string;
  name: string;
  location: string;
  lat?: number;
  lng?: number;
  phone?: string;
  prefix: string;
  nextOrderNumber: number;
  nextDirectSaleNumber: number;
}

export interface SalesGoal {
  id: string;
  month: string; // YYYY-MM
  targetAmountUsd: number;
  description: string;
}

export type LeadStatus = 'Prospecto' | 'Contactado' | 'Reunión agendada' | 'Propuesta enviada' | 'Cliente';
export type LeadCategory = 'Potencial' | 'Frecuente' | 'Personal';
export type LeadTemperature = 'Frío' | 'Tibio' | 'Caliente' | 'Problemático';

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  instagram?: string;
  address?: string;
  status: LeadStatus;
  category: LeadCategory;
  temperature: LeadTemperature;
  notes?: string;
  lastContactDate?: string;
  createdAt: string;
}

export interface RadarAlert {
  id: string;
  timestamp: number;
  message: string;
  title?: string;
  description?: string;
  type?: string;
  customerName?: string;
  customerPhone?: string;
  status: 'pending' | 'resolved';
  agentResponse?: 'available' | 'taller';
  resolvedAt?: number;
  metadata?: any;
}

export interface AppSettings {
  masterPin: string;
  loginPin: string;
  businessName: string;
  slogan: string;
  instagram: string;
  companyPhone?: string;
  preferredTone: 'profesional' | 'casual' | 'entusiasta' | 'cercano';
  bcvRate: number;
  logoUrl?: string;
  stores: StoreConfig[];
  encryptionKey: string;
  cloudSync?: {
    enabled: boolean;
    provider: 'supabase' | 'firebase';
    apiUrl: string;
    apiKey: string;
  };
  pagoMovil?: {
    bank: string;
    idNumber: string;
    phone: string;
  };
  whatsappConfig?: {
    enabled: boolean;
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    verifyToken: string;
    useTemplates?: boolean;
  };
  salesGoals?: SalesGoal[];
  weeklyCapacityUnits?: number;
  workshopHourlyCostUsd?: number;
  landingConfig?: {
    heroImageUrl?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroDescription?: string;
    collections?: {
      id: string;
      title: string;
      subtitle: string;
      description: string;
      imageUrl?: string;
    }[];
    portfolio?: {
      title: string;
      category: string;
      imageUrl: string;
    }[];
    aboutUsImages?: string[];
  };
  investments?: {
    id: string;
    name: string;
    amountUsd: number;
    date: string;
    expectedMonthlyRevenueUsd: number;
  }[];
  accountingPermissions?: string[]; // IDs of agents allowed to see accounting
  fiscalData?: {
    legalName: string;
    rif: string;
    fiscalAddress: string;
    partners: { name: string; percentage: number }[];
  };
}

export interface Account {
  code: string;
  name: string;
  type: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESOS' | 'COSTOS' | 'GASTOS' | 'OTROS';
  category: string;
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  items: {
    accountCode: string;
    debit: number;
    credit: number;
  }[];
  referenceId?: string; // ID of order or expense
}

export interface StaffDisciplineRecord {
  id: string;
  agentId: string;
  week: string; // YYYY-WW
  correctOrdersPercent: number;
  sameDayExpensesPercent: number;
  workflowCompliancePercent: number;
  totalScore: number;
  classification: 'A' | 'B' | 'C';
  notes: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown or HTML for slides
  duration: string;
  type: 'video' | 'slides';
  videoUrl?: string;
  promptForVideo?: string; // For AI generation outside
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'VENTAS' | 'RECEPCION' | 'OPERACIONES' | 'GERENCIA' | 'DISEÑO';
  lessons: Lesson[];
  quiz: QuizQuestion[];
  minScoreToPass: number;
  topics?: any[];
}

export interface StaffEvaluation {
  id: string;
  agentId: string;
  courseId: string;
  score: number;
  completedAt: number;
  passed: boolean;
}

export interface Message {
  id: string;
  from: string; // Phone number or 'system'
  to: string; // Phone number
  body: string;
  timestamp: number;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'sending';
  customerName?: string;
  orderNumber?: string;
}

export interface FiscalInvoice {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerCi: string;
  storeId: string;
  paymentType: 'PAGO MOVIL' | 'EFECTIVO' | 'PUNTO';
  items: {
    name: string;
    quantity: number;
    priceUsd: number;
  }[];
  totalUsd: number;
  bcvRate: number;
  baseImponibleBs: number;
  ivaBs: number;
  totalBs: number;
  agentId?: string;
  agentName?: string;
}
