import type { Exercise, Group, Muscle } from "./data";

/** Equipment variants (name suffix, default-kg multiplier) */
const EQ: Record<string, [string, number]> = {
  B: ["con Barra", 1], M: ["con Mancuernas", 0.4], P: ["en Polea", 0.5], Q: ["en Máquina", 0.8],
  S: ["en Smith", 0.9], K: ["con Kettlebell", 0.35], L: ["con Banda", 0], Z: ["con Barra Z", 0.7],
  C: ["con Peso Corporal", 0], U: ["Unilateral", 0.4], T: ["con Lastre", 0.25], D: ["con Disco", 0.3],
};

/** [muscle, group, sub-muscle, baseKg, reps, "Movement:EQUIPCODES" | "Movement"] */
type Def = [Muscle, Group, string, number, number, string[]];

const DEFS: Def[] = [
  ["chest", "push", "Pecho", 60, 8, [
    "Press Banca:BMSQKL", "Press Inclinado:BMSQ", "Press Declinado:BMSQ", "Press Banca Agarre Cerrado:BMS",
    "Press Suelo:BMK", "Aperturas Planas:MPQL", "Aperturas Inclinadas:MP", "Aperturas Declinadas:MP",
    "Press Guillotina:BS", "Press con Pausa:BS", "Press Spoto:B", "Press Hex:M", "Press Squeeze:MD",
    "Pullover:MPB", "Cruce de Poleas Alto", "Cruce de Poleas Medio", "Cruce de Poleas Bajo",
    "Contractora Pec Deck", "Press Pecho Sentado:QU", "Press Landmine:BU", "Svend Press:D",
  ]],
  ["chest", "push", "Pecho (Peso corporal)", 0, 15, [
    "Flexiones", "Flexiones Diamante", "Flexiones Declinadas", "Flexiones Inclinadas", "Flexiones Abiertas",
    "Flexiones Arqueras", "Flexiones Explosivas", "Flexiones con Palmada", "Flexiones Pseudo Planche",
    "Flexiones en Anillas", "Fondos en Paralelas:CT", "Fondos en Anillas", "Flexiones con Lastre",
  ]],
  ["back", "pull", "Dorsal", 50, 10, [
    "Jalón al Pecho:PQ", "Jalón Agarre Estrecho:P", "Jalón Agarre Neutro:P", "Jalón Tras Nuca:P",
    "Jalón Unilateral:P", "Jalón Brazos Rectos:PL", "Dominadas Pronas:CTL", "Dominadas Supinas:CT",
    "Dominadas Neutras:CT", "Dominadas Anchas:CT", "Dominadas Arqueras", "Dominadas Negativas",
    "Muscle Up", "Pullover en Polea", "Pull Down Kayak:P", "Remo Invertido:C", "Australianas en Anillas",
  ]],
  ["back", "pull", "Espalda Media", 60, 10, [
    "Remo Inclinado:BMSKL", "Remo Pendlay:B", "Remo Yates:B", "Remo con Apoyo en Pecho:MQ",
    "Remo Sentado:PQ", "Remo Gironda:P", "Remo a Una Mano:MKP", "Remo Kroc:M", "Remo Meadows:B",
    "Remo en Barra T", "Remo Seal:BM", "Remo Hammer Strength", "Remo Renegado:MK", "Remo Alto:PQ",
    "Remo Helms:M",
  ]],
  ["back", "pull", "Trapecio", 60, 12, [
    "Encogimientos:BMSPQK", "Encogimientos Tras la Espalda:BS", "Encogimientos Trap Bar",
    "Paseo del Granjero:MK", "Remo al Mentón:BMPZ", "Y-Raise:MP", "Rack Pull", "Snatch Grip High Pull",
  ]],
  ["back", "pull", "Lumbar", 80, 8, [
    "Peso Muerto Convencional", "Peso Muerto Sumo", "Peso Muerto Trap Bar", "Peso Muerto Déficit",
    "Peso Muerto con Pausa", "Peso Muerto Snatch Grip", "Hiperextensiones:CD", "Hiperextensiones Inversas",
    "Buenos Días:BSL", "Superman", "Jefferson Curl:BK", "Bird Dog",
  ]],
  ["shoulders", "push", "Deltoides Anterior", 40, 8, [
    "Press Militar:BMSQK", "Press Militar Sentado:BMS", "Press Arnold:MK", "Push Press:BMK",
    "Press Tras Nuca:BS", "Press Z:BM", "Press Bradford:B", "Press Landmine de Hombro:BU",
    "Elevación Frontal:BMPDLK", "Press Pike", "Flexiones en Pino", "Press Hombro Unilateral:MKP",
  ]],
  ["shoulders", "push", "Deltoides Lateral", 10, 15, [
    "Elevaciones Laterales:MPQLK", "Elevaciones Laterales Sentado:M", "Elevaciones Laterales Inclinado:M",
    "Elevaciones Laterales Lean Away:MP", "Elevaciones Laterales Parciales:M", "Elevación en Y:MP",
    "Remo al Mentón Abierto:BP", "Elevación Lateral Egipcia:P", "Elevación Lu Raise:MD",
  ]],
  ["shoulders", "pull", "Deltoides Posterior", 12, 15, [
    "Face Pull:PL", "Pájaros:MPQ", "Pájaros Inclinado:M", "Contractora Inversa", "Remo Posterior Alto:MP",
    "Pull Apart:L", "Cruce Inverso en Polea", "W-Raise:M", "Rotación Externa:MPL", "Rotación Interna:PL",
    "Cuban Press:M",
  ]],
  ["arms", "pull", "Bíceps", 12.5, 12, [
    "Curl Bíceps:BMPZLKQ", "Curl Martillo:MPL", "Curl Concentrado:M", "Curl Predicador:BMZQ",
    "Curl Inclinado:M", "Curl Spider:BMZ", "Curl Bayesiano:P", "Curl Araña", "Curl Zottman:M",
    "Curl 21s:BZ", "Curl Drag:B", "Curl Cruzado:M", "Curl Arrastre:Z", "Curl Waiter:M",
    "Curl en Polea Alta", "Curl Reverso:BZPM", "Chin Up Bíceps",
  ]],
  ["arms", "push", "Tríceps", 25, 12, [
    "Extensión de Tríceps:PQL", "Extensión con Cuerda:P", "Extensión Barra V:P", "Extensión Tras Nuca:MPZ",
    "Press Francés:BZM", "Rompecráneos:BZM", "Patada de Tríceps:MP", "Press JM:BS",
    "Press Tate:M", "Extensión Katana:P", "Extensión Unilateral:P", "Fondos en Banco:CT",
    "Extensión Cruzada:P", "Fondos de Tríceps en Máquina",
  ]],
  ["arms", "pull", "Antebrazo", 20, 15, [
    "Curl de Muñeca:BMPZ", "Curl de Muñeca Inverso:BMZ", "Rodillo de Muñeca", "Colgarse de la Barra",
    "Pinza con Discos", "Gripper", "Pronación Supinación:M", "Desviación Radial:M", "Paseo del Camarero:MK",
  ]],
  ["legs", "legs", "Cuádriceps", 80, 8, [
    "Sentadilla Trasera:BS", "Sentadilla Frontal:BSK", "Sentadilla Goblet:MK", "Sentadilla Hack:QB",
    "Sentadilla Búlgara:BMSK", "Sentadilla Zercher:B", "Sentadilla Sissy:CT", "Sentadilla Pistol:CK",
    "Sentadilla con Pausa:B", "Sentadilla Box:B", "Sentadilla Belt Squat", "Sentadilla Péndulo",
    "Prensa 45°", "Prensa Horizontal", "Prensa Unilateral", "Extensión de Cuádriceps:QU",
    "Zancadas Frontales:BMSK", "Zancadas Caminando:BMK", "Zancadas Inversas:BMS", "Step Up:BMK",
    "Sentadilla Cossack:CK", "Spanish Squat:L", "Sentadilla con Salto:CM",
  ]],
  ["legs", "legs", "Femoral", 60, 10, [
    "Peso Muerto Rumano:BMSK", "Peso Muerto Piernas Rígidas:BM", "Peso Muerto a Una Pierna:MK",
    "Curl Femoral Tumbado:Q", "Curl Femoral Sentado:Q", "Curl Femoral de Pie:Q", "Curl Nórdico",
    "Curl Femoral con Fitball", "Curl Femoral en Deslizadores", "Glute Ham Raise", "Swing:KM",
  ]],
  ["legs", "legs", "Glúteo", 80, 10, [
    "Hip Thrust:BMSQL", "Puente de Glúteo:BMCL", "Puente de Glúteo Unilateral:CM", "Patada de Glúteo:PQL",
    "Abducción de Cadera:QPL", "Aducción de Cadera:QP", "Pull Through:PL", "Frog Pump",
    "Zancada Lateral:MK", "Zancada Curtsy:MK", "Monster Walk:L", "Clamshell:L",
  ]],
  ["legs", "legs", "Gemelo", 60, 15, [
    "Elevación de Talones de Pie:BMSQ", "Elevación de Talones Sentado:QB", "Elevación de Talones en Prensa",
    "Burro", "Elevación de Talones Unilateral:MC", "Tibial Raise:CD", "Saltos a la Comba",
  ]],
  ["chest", "push", "Abdomen", 0, 15, [
    "Crunch:CDP", "Crunch en Máquina", "Crunch Inverso", "Crunch Bicicleta", "Crunch en Polea Arrodillado",
    "Elevación de Piernas Colgado", "Elevación de Rodillas Colgado", "Elevación de Piernas Tumbado",
    "Toes to Bar", "Plancha", "Plancha Lateral", "Plancha con Lastre", "Rueda Abdominal", "Dragon Flag",
    "Hollow Hold", "V-Ups", "Russian Twist:CMD", "Pallof Press:PL", "Leñador:PL", "Dead Bug",
    "L-Sit", "Mountain Climbers", "Sit Up:CD", "Woodchopper con Mancuerna", "Copenhagen Plank",
  ]],
  ["legs", "legs", "Cuerpo Completo", 40, 8, [
    "Clean:BMK", "Power Clean", "Hang Clean", "Snatch:BMK", "Clean and Jerk", "Thruster:BMK",
    "Burpees", "Turkish Get Up:KM", "Man Maker:M", "Wall Ball", "Arrastre de Trineo", "Empuje de Trineo",
    "Volteo de Neumático", "Atlas Stone", "Yoke Walk", "Carry de Saco",
  ]],
];

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function buildExercises(existing: Set<string>): Exercise[] {
  const out: Exercise[] = [];
  const seen = new Set(existing);
  for (const [muscle, group, sub, kg, reps, moves] of DEFS) {
    for (const m of moves) {
      const [name, codes] = m.split(":");
      const variants: [string, number][] = codes ? [...codes].map((c) => [`${name} ${EQ[c][0]}`, EQ[c][1]]) : [[name, 1]];
      for (const [full, mult] of variants) {
        const id = slug(full);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ id, name: full, muscle, group, sub, defKg: Math.round((kg * mult) / 2.5) * 2.5, defReps: reps });
      }
    }
  }
  return out;
}
