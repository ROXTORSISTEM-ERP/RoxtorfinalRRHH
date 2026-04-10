/**
 * LÓGICA DE RECURSOS HUMANOS - INVERSIONES ROXTOR C.A.
 * Este archivo centraliza los cálculos legales sin modificar la base de datos.
 */

export const LEGAL_CONSTANTS = {
  SALARIO_MINIMO_BS: 130.00,
  DIAS_PRESTACIONES_MES: 5, // Art. 142 LOTTT (15 días por trimestre = 5 por mes)
  DIAS_VACACIONES_BASE: 15, // Art. 190 LOTTT
  ARTICULOS_LEY: [
    { art: "141", desc: "Derecho a prestaciones sociales que compensen la antigüedad." },
    { art: "142a", desc: "Depósito de 15 días por trimestre (5 por mes) por garantía de prestaciones." },
    { art: "190", desc: "Derecho a vacaciones remuneradas tras un año ininterrumpido." },
    { art: "192", desc: "Bono vacacional equivalente a los días de vacaciones correspondientes." }
  ]
};

/**
 * Calcula la liquidación legal basada ESTRICTAMENTE en la ley de Venezuela.
 * @param fechaIngreso string en formato YYYY-MM-DD
 * @param bcvRate tasa del BCV actual
 */
export const calcularLiquidacionLegal = (fechaIngreso: string, bcvRate: number) => {
  if (!fechaIngreso) return null;

  const inicio = new Date(fechaIngreso);
  const hoy = new Date();
  
  // Cálculo de meses totales de antigüedad
  const mesesTotales = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
  
  const salarioDiarioBs = LEGAL_CONSTANTS.SALARIO_MINIMO_BS / 30;

  // 1. Prestaciones Sociales (Garantía - Art. 142)
  const diasAcumulados = mesesTotales * LEGAL_CONSTANTS.DIAS_PRESTACIONES_MES;
  const montoPrestacionesBs = diasAcumulados * salarioDiarioBs;

  // 2. Estimación de Conceptos Fraccionados (Vacaciones, Bono Vacacional, Utilidades)
  // Basado en el mínimo de ley (aprox 40 días por año)
  const diasFraccionados = (mesesTotales / 12) * 40;
  const montoFraccionadosBs = diasFraccionados * salarioDiarioBs;

  const totalBs = montoPrestacionesBs + montoFraccionadosBs;

  return {
    antiguedadMeses: mesesTotales,
    diasGarantia: diasAcumulados,
    montoBs: totalBs.toFixed(2),
    montoUsd: (totalBs / bcvRate).toFixed(2),
    baseLegal: `Salario Base: Bs. ${LEGAL_CONSTANTS.SALARIO_MINIMO_BS}`
  };
};

/**
 * Lógica para resetear visualmente los retrasos (22 días) sin borrar al agente.
 * Esta función determina si un día debe contarse como ausencia o no.
 */
export const debeContarAsistencia = (fechaEvaluada: string, fechaLanzamientoERP: string = '2026-03-24') => {
  const evaluada = new Date(fechaEvaluada);
  const lanzamiento = new Date(fechaLanzamientoERP);
  
  // Si la fecha que el sistema está evaluando es anterior al lanzamiento, se ignora (no hay falta)
  return evaluada >= lanzamiento;
};