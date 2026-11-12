import { EX } from "./data";

export type EquipKind =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "smith"
  | "kettlebell"
  | "band"
  | "ezbar"
  | "plate"
  | "rings"
  | "wheel"
  | "bodyweight";

export type AnimPattern =
  | "chest_press_machine"
  | "pec_deck"
  | "cable_crossover"
  | "bench_press"
  | "db_fly"
  | "pullover"
  | "landmine_press"
  | "svend_press"
  | "pushup"
  | "dips_parallel"
  | "dips_bench"
  | "dips_machine"
  | "ohp_bar"
  | "ohp_machine"
  | "ohp_arnold"
  | "handstand_pushup"
  | "front_raise"
  | "lateral_raise"
  | "lateral_machine"
  | "reverse_pec_deck"
  | "rear_delt_bent"
  | "facepull"
  | "shrug"
  | "upright_row"
  | "pullup"
  | "muscle_up"
  | "pulldown_cable"
  | "pulldown_machine"
  | "row_bent"
  | "row_one_arm"
  | "row_cable"
  | "row_machine"
  | "row_tbar"
  | "row_inverted"
  | "deadlift"
  | "back_ext"
  | "biceps_standing"
  | "biceps_preacher"
  | "biceps_incline"
  | "biceps_high_cable"
  | "triceps_pushdown"
  | "triceps_skullcrusher"
  | "triceps_overhead"
  | "triceps_kickback"
  | "forearm_curl"
  | "squat"
  | "squat_hack"
  | "squat_pistol"
  | "leg_press"
  | "leg_extension"
  | "leg_curl_prone"
  | "leg_curl_seated"
  | "lunge"
  | "step_up"
  | "hip_thrust"
  | "glute_kickback"
  | "hip_abduction"
  | "calf_standing"
  | "calf_seated"
  | "kettlebell_swing"
  | "core_wheel"
  | "core_hanging"
  | "core_cable_crunch"
  | "core_machine_crunch"
  | "core_plank"
  | "core_floor"
  | "jump_rope"
  | "burpee"
  | "olympic_bar"
  | "sled_push"
  | "wall_ball";

export interface ExerciseAnimSpec {
  pattern: AnimPattern;
  equip: EquipKind;
  equipLabel: string;
  subVariant?: "flat" | "incline" | "decline" | "floor" | "high" | "mid" | "low" | "rdl" | "sumo" | "trapbar" | "pistol" | "bulgarian" | "farmer" | "diamond" | "clap" | "adduction" | "woodchop";
  targetLabel: string;
  synergists: string;
  tempo: string;
  breathing: string;
  cues: [string, string, string];
  mistakes: [string, string];
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const EQUIP_BADGE: Record<EquipKind, string> = {
  machine: "⚙ MÁQUINA",
  cable: "〰 POLEA",
  smith: "🔩 SMITH",
  barbell: "🏋 BARRA",
  dumbbell: "⚡ MANCUERNA",
  kettlebell: "🔔 KETTLEBELL",
  band: "➿ BANDA",
  ezbar: "〰 BARRA Z",
  plate: "💿 DISCO",
  rings: "⭕ ANILLAS",
  wheel: "🛞 RUEDA AB",
  bodyweight: "💪 CORP.",
};

export function detectEquip(raw: string, isBw: boolean): EquipKind {
  if (raw.includes("anillas")) return "rings";
  if (raw.includes("smith")) return "smith";
  if (raw.includes("hammer strength") || raw.includes("contractora") || raw.includes("pec deck") || raw.includes("hack") || raw.includes("pendulo") || raw.includes("maquina") || raw.includes("máquina")) {
    return "machine";
  }
  if (raw.includes("polea") || raw.includes("cruce") || raw.includes("gironda") || raw.includes("jalon") || raw.includes("bayesiano") || raw.includes("pushdown") || raw.includes("face pull") || raw.includes("facepull") || raw.includes("pull through") || raw.includes("extension con cuerda") || raw.includes("barra v") || raw.includes("katana")) {
    return "cable";
  }
  if (raw.includes("kettlebell") || raw.includes("swing")) return "kettlebell";
  if (raw.includes("banda") || raw.includes("pull apart") || raw.includes("monster walk") || raw.includes("spanish squat") || raw.includes("clamshell")) return "band";
  if (raw.includes("barra z")) return "ezbar";
  if (raw.includes("mancuerna") || raw.includes("manc.") || raw.includes("arnold") || raw.includes("martillo") || raw.includes("kroc") || raw.includes("helms") || raw.includes("tate") || raw.includes("concentrado") || raw.includes("zottman") || raw.includes("waiter") || raw.includes("cruzado")) {
    return "dumbbell";
  }
  if (raw.includes("disco") || raw.includes("svend") || raw.includes("pinza")) return "plate";
  if (raw.includes("lastre") || raw.includes("corporal") || isBw) return "bodyweight";
  if (raw.includes("barra") || raw.includes("peso muerto") || raw.includes("sentadilla") || raw.includes("press banca") || raw.includes("press militar") || raw.includes("pendlay") || raw.includes("yates") || raw.includes("meadows") || raw.includes("rack pull") || raw.includes("clean") || raw.includes("snatch") || raw.includes("thruster") || raw.includes("hip thrust") || raw.includes("buenos dias") || raw.includes("frances") || raw.includes("rompecraneos") || raw.includes("jm")) {
    return "barbell";
  }
  return isBw ? "bodyweight" : "barbell";
}

export function resolveExerciseAnim(exId: string, exName?: string): ExerciseAnimSpec {
  const ex = EX[exId];
  const raw = norm(`${exId} ${exName ?? ex?.name ?? ""} ${ex?.sub ?? ""}`);
  const isBw = Boolean(ex?.bw);
  const equip = detectEquip(raw, isBw);
  const equipLabel = EQUIP_BADGE[equip];

  const make = (
    pattern: AnimPattern,
    targetLabel: string,
    synergists: string,
    tempo: string,
    breathing: string,
    cues: [string, string, string],
    mistakes: [string, string],
    subVariant?: ExerciseAnimSpec["subVariant"],
    overrideEquip?: EquipKind
  ): ExerciseAnimSpec => {
    const eq = overrideEquip ?? equip;
    return {
      pattern,
      equip: eq,
      equipLabel: EQUIP_BADGE[eq],
      subVariant,
      targetLabel,
      synergists,
      tempo,
      breathing,
      cues,
      mistakes,
    };
  };

  /* ---------- METCON / OLYMPIC / FULL BODY ---------- */
  if (raw.includes("saltos a la comba") || raw.includes("comba")) {
    return make("jump_rope", "Gemelos · Cardio · Coordinación", "Hombros, Antebrazo", "Rítmico · Rebote elástico", "Respiración nasal rítmica constante", [
      "Gira la comba solo con las muñecas manteniendo codos pegados.",
      "Salta apenas 2–3 cm del suelo sobre las puntas de los pies.",
      "Mantén postura erguida y mirada fija al frente.",
    ], ["Saltar demasiado alto doblando mucho rodillas atrás.", "Mover todo el brazo desde los hombros."]);
  }
  if (raw.includes("burpee")) {
    return make("burpee", "Cuerpo Completo · Potencia", "Pecho, Cuádriceps, Core", "Dinámico · Explosivo", "Exhala al extender arriba", [
      "Apoya manos firme, salta atrás a plancha sin hundir cadera.",
      "Baja el pecho controlando hasta rozar el suelo y recupera pies.",
      "Extiende caderas y salta verticalmente con brazos arriba.",
    ], ["Colapsar la zona lumbar en la posición de plancha.", "No extender la cadera por completo en el salto final."]);
  }
  if (raw.includes("trineo") || raw.includes("arrastre de trineo") || raw.includes("empuje de trineo")) {
    return make("sled_push", "Cuádriceps · Glúteos · Potencia", "Gemelos, Core", "Zancadas potentes continuas", "Respiración rítmica por cada zancada", [
      "Inclina el cuerpo a ~45° empujando desde cadera y brazos firmes.",
      "Impulsa cada zancada clavando el antepié hacia atrás en el césped.",
      "Mantén espalda neutra y cabeza alineada con la columna.",
    ], ["Ir demasiado vertical perdiendo tracción horizontal.", "Dar pasos muy largos con talón primero."], undefined, "machine");
  }
  if (raw.includes("wall ball")) {
    return make("wall_ball", "Cuádriceps · Hombros · Potencia", "Glúteos, Tríceps, Core", "Sentadilla + lanzamiento fluido", "Exhala fuerte al lanzar arriba", [
      "Sostén el balón frente al pecho con codos abajo y baja en sentadilla.",
      "Aprovecha la extensión explosiva de piernas para lanzar al objetivo.",
      "Recibe el balón absorbiendo la caída directamente hacia la siguiente rep.",
    ], ["Lanzar solo con los brazos sin usar las piernas.", "Dejar caer los codos y doblar el pecho adelante."], undefined, "plate");
  }
  if (raw.includes("clean") || raw.includes("snatch") || raw.includes("thruster")) {
    return make("olympic_bar", "Potencia · Cadena Posterior y Hombros", "Cuádriceps, Trapecio, Core", "Explosivo desde cadera", "Bloquea aire en el tirón, exhala al recibir", [
      "Acelera desde medio muslo con triple extensión de tobillo, rodilla y cadera.",
      "Mantén la barra muy pegada al cuerpo guiando codos hacia arriba.",
      "Recibe con firmeza amortiguando en media sentadilla o bloqueo.",
    ], ["Tirar demasiado pronto con los brazos doblados.", "Separar la barra hacia delante como un balanceo."]);
  }

  /* ---------- CORE / ABDOMEN ---------- */
  if (raw.includes("rueda abdominal") || raw.includes("rueda_abdominal")) {
    return make("core_wheel", "Recto Abdominal · Anti-Extensión", "Dorsales, Hombros", "3s avance · pausa · 1s retorno", "Inhala al rodar adelante, exhala fuerte al volver", [
      "Inicia en retroversión pélvica (glúteos y abdomen duros antes de mover).",
      "Desliza brazos y torso juntos al frente sin que caiga la lumbar.",
      "Tira de regreso llevando la pelvis atrás sin arquear la espalda.",
    ], ["Dejar caer la cadera arqueando la zona lumbar al máximo alcance.", "Tirar primero con caderas atrás sin activar abdomen."], undefined, "wheel");
  }
  if (raw.includes("elevacion de piernas colgado") || raw.includes("elevacion_de_piernas_colgado") || raw.includes("rodillas colgado") || raw.includes("toes to bar") || raw.includes("toes_to_bar") || raw.includes("l-sit") || raw.includes("l_sit")) {
    return make("core_hanging", "Abdomen Inferior · Flexores", "Dorsales, Agarre", "1s subida · 2s bajada sin balanceo", "Exhala subiendo pelvis, inhala al bajar", [
      "Cuelga con dorsales activos (hombros abajo) para frenar el péndulo.",
      "Lleva las piernas arriba enroscando la pelvis hacia el pecho.",
      "Desciende lento frenando cualquier balanceo atrás.",
    ], ["Tomar impulso columpio con la espalda.", "Subir solo 90° sin bascular la pelvis."]);
  }
  if (raw.includes("crunch en polea") || raw.includes("pallof") || raw.includes("lenador") || raw.includes("woodchopper")) {
    const chop = raw.includes("lenador") || raw.includes("woodchopper") || raw.includes("pallof");
    return make("core_cable_crunch", chop ? "Oblicuos · Rotación Anti-Giro" : "Recto Abdominal (Con Carga)", "Core Profundo, Hombros", "1s contracción · 2s extensión", "Exhala al cerrar costillas a pelvis", [
      "Fija las caderas inmóviles y mueve únicamente la caja torácica/columna.",
      "En crunch de polea, enrolla codos hacia la mitad de los muslos.",
      "Sube controlando el peso hasta estirar la pared abdominal arriba.",
    ], ["Sentarse sobre los talones flexionando solo la cadera.", "Tirar de la cuerda con los brazos."], chop ? "woodchop" : "flat", "cable");
  }
  if (raw.includes("crunch en maquina") || raw.includes("crunch en máquina")) {
    return make("core_machine_crunch", "Recto Abdominal en Máquina", "Flexores de Cadera", "1s flexión · pausa · 2s retorno", "Exhala fuerte al comprimir el torso", [
      "Alinea tu punto de flexión lumbar con el eje de la máquina.",
      "Contrae el abdomen acercando costillas hacia caderas sin tirar con brazos.",
      "Regresa despacio resistiendo las placas sin golpear la pila.",
    ], ["Tirar de los agarres con bíceps y cuello.", "Soltar rápido las placas en cada repetición."], undefined, "machine");
  }
  if (raw.includes("plancha") || raw.includes("hollow") || raw.includes("copenhagen") || raw.includes("bird dog")) {
    return make("core_plank", "Core Profundo · Transverso", "Hombros, Glúteos", "Isométrico · Tensión continua", "Respiración nasal controlada manteniendo abdomen firme", [
      "Línea recta de coronilla a talones; empuja el suelo con antebrazos.",
      "Aprieta glúteos e introduce el ombligo bloqueando la pelvis.",
      "Evita hundir los hombros o mirar hacia el frente forzando cuello.",
    ], ["Dejar caer la zona lumbar.", "Elevar el glúteo demasiado formando una pirámide."], "floor", "bodyweight");
  }
  if (ex?.muscle === "core" || raw.includes("crunch") || raw.includes("dragon flag") || raw.includes("v-ups") || raw.includes("v_ups") || raw.includes("russian") || raw.includes("dead bug") || raw.includes("sit up") || raw.includes("mountain")) {
    return make("core_floor", "Recto Abdominal · Oblicuos", "Flexores, Core", "1s contracción · 2s bajada", "Exhala arriba, inhala al abrir", [
      "Despega escápulas enrollando las costillas hacia la pelvis.",
      "Mantén la barbilla separada del pecho mirando a 45° arriba.",
      "Controla la bajada vértebra a vértebra sin golpear el suelo.",
    ], ["Tirar de la nuca con los dedos.", "Usar impulso de piernas."]);
  }

  /* ---------- CHEST (PECHO) ---------- */
  if (raw.includes("contractora") || raw.includes("pec deck") || raw.includes("pec_deck")) {
    return make("pec_deck", "Pectoral Mayor (Aislamiento en Máquina)", "Deltoides Anterior", "1s cierre · 1s apriete · 3s apertura", "Inhala al abrir brazos, exhala al juntar al centro", [
      "Ajusta el asiento para que los brazos queden a la altura del pecho medio.",
      "Mantén el pecho erguido y escápulas apoyadas contra el respaldo.",
      "Cierra los brazos suavemente sin golpear las placas al volver.",
    ], ["Despegar los hombros adelante perdiendo tensión pectoral.", "Doblar demasiado los codos empujando en lugar de abrir."], undefined, "machine");
  }
  if (raw.includes("cruce de poleas") || raw.includes("cruce_de_poleas") || (raw.includes("aperturas") && equip === "cable")) {
    const level = raw.includes("bajo") ? "low" : raw.includes("alto") ? "high" : "mid";
    return make("cable_crossover", level === "low" ? "Pectoral Superior (Cruce Bajo)" : level === "high" ? "Pectoral Inferior (Cruce Alto)" : "Pectoral Medio", "Deltoides Anterior", "2s cierre cruzado · 2s apertura", "Exhala al cruzar las manos al frente", [
      "Da un paso estable al frente y fija el torso ligeramente inclinado.",
      "Mantén los codos fijos ligeramente doblados en todo el arco.",
      "Aprieta el pecho juntando muñecas en el eje central sin encoger hombros.",
    ], ["Convertir el cruce en un press flexionando y extendiendo codos.", "Balancear la cintura para mover exceso de peso."], level, "cable");
  }
  if (raw.includes("press pecho") || ((raw.includes("press banca") || raw.includes("press inclinado") || raw.includes("press declinado")) && equip === "machine")) {
    return make("chest_press_machine", "Pectoral Mayor en Máquina", "Tríceps, Deltoides Anterior", "1s empuje · 2–3s retorno", "Exhala al extender al frente, inhala al volver", [
      "Regula el asiento para alinear los manerales con la mitad del pecho.",
      "Mantén escápulas pegadas al respaldo y hombros atrás al empujar.",
      "Retén las placas antes de que choquen en el reposo.",
    ], ["Adelantar los hombros perdiendo la retracción escapular.", "Bloquear codos bruscamente arriba."], raw.includes("inclinado") ? "incline" : "flat", "machine");
  }
  if (raw.includes("svend")) {
    return make("svend_press", "Pectoral Interno · Tensión Continua", "Deltoides Anterior, Tríceps", "2s extensión apretando disco · 2s vuelta", "Exhala al extender al frente", [
      "Aprieta el disco con toda la fuerza entre ambas palmas todo el tiempo.",
      "Extiende los brazos horizontales sin dejar que los hombros suban.",
      "Mantén el pecho alto y siente la contracción medial continua.",
    ], ["Sostener el disco por los bordes sin presionar hacia dentro.", "Encoger trapecios durante la extensión."], undefined, "plate");
  }
  if (raw.includes("pullover")) {
    return make("pullover", "Pectoral · Dorsal y Serrato", "Tríceps Largo, Core", "3s estiramiento atrás · 1s subida", "Inhala profundo al bajar atrás, exhala al volver", [
      "Apoya escápulas firme en el banco manteniendo codos semibloqueados.",
      "Baja la carga detrás de la cabeza hasta notar estiramiento dorsal/pectoral.",
      "Tira de regreso dibujando un arco hasta la línea del pecho.",
    ], ["Doblar mucho los codos convirtiéndolo en press francés.", "Levantar demasiado las caderas arriba."]);
  }
  if (raw.includes("aperturas") || raw.includes("apertura")) {
    const v = raw.includes("inclinada") ? "incline" : raw.includes("declinada") ? "decline" : "flat";
    return make("db_fly", v === "incline" ? "Pectoral Superior (Aperturas)" : "Pectoral Mayor (Estiramiento)", "Deltoides Anterior", "3s apertura · 1s cierre", "Inhala al abrir amplio, exhala al subir", [
      "Mantén un ángulo fijo de ~15° en los codos durante toda la serie.",
      "Desciende abriendo el pecho sin bajar las mancuernas por debajo de hombros.",
      "Sube abrazando un arco imaginario con control.",
    ], ["Bajar demasiado profundo estresando el tendón del hombro.", "Doblar codos a 90° como un press."], v, equip);
  }
  if (raw.includes("landmine") && !raw.includes("hombro")) {
    return make("landmine_press", "Pectoral Superior · Hombro Seguro", "Tríceps, Serrato", "1s empuje diagonal · 2s bajada", "Exhala al empujar arriba-alante", [
      "Sostén el extremo de la barra frente al pecho con torso ligeramente inclinado.",
      "Empuja en arco diagonal hacia arriba extendiendo el brazo con firmeza.",
      "Controla la bajada manteniendo el codo cerca del costado.",
    ], ["Torcer la cintura al empujar unilateralmente.", "Encoger el cuello arriba."], undefined, "barbell");
  }
  if (raw.includes("flexiones") && !raw.includes("pino")) {
    const v = raw.includes("diamante") ? "diamond" : raw.includes("palmada") || raw.includes("explosiva") ? "clap" : raw.includes("inclinada") ? "incline" : raw.includes("declinada") ? "decline" : "flat";
    return make("pushup", v === "diamond" ? "Pectoral Interno · Tríceps" : "Pectoral · Tríceps · Core", "Deltoides Anterior", "2s bajada · 1s empuje", "Inhala al bajar al suelo, exhala al subir", [
      "Cuerpo bloqueado en plancha rígida de talones a nuca.",
      "Codos orientados a ~45° formando una flecha (evita forma de T).",
      "Baja el pecho a 2 cm del suelo y empuja fuerte manteniendo abdomen duro.",
    ], ["Hundir la cadera antes que el pecho.", "Abrir codos a 90° en línea con los hombros."], v);
  }
  if (raw.includes("press banca") || raw.includes("press_banca") || raw.includes("press inclinado") || raw.includes("press_inclinado") || raw.includes("press declinado") || raw.includes("press suelo") || raw.includes("press guillotina") || raw.includes("press spoto") || raw.includes("press hex") || raw.includes("press squeeze") || raw.includes("press con pausa")) {
    const v = raw.includes("inclinado") ? "incline" : raw.includes("declinado") ? "decline" : raw.includes("suelo") ? "floor" : "flat";
    return make("bench_press", v === "incline" ? "Pectoral Superior" : v === "decline" ? "Pectoral Inferior" : "Pectoral Mayor", "Tríceps, Deltoides Anterior", "2–3s bajada · pausa · 1s empuje", "Bloquea aire al bajar, exhala al pasar el punto difícil", [
      "Retrae escápulas y fija pies al suelo creando un arco torácico estable.",
      "Baja controlado al esternón/clavícula con antebrazos perpendiculares.",
      "Empuja ligeramente hacia la línea de los hombros (en barra) con control.",
    ], ["Rebotar la carga en el pecho.", "Despegar el glúteo del banco o abrir codos a 90°."], v);
  }

  /* ---------- DIPS (FONDOS) ---------- */
  if (raw.includes("fondos en banco")) {
    return make("dips_bench", "Tríceps · Pectoral Inferior", "Deltoides Anterior", "2s bajada · 1s extensión", "Inhala al bajar cadera, exhala al subir", [
      "Coloca manos al borde del banco pegadas a las caderas.",
      "Baja la espalda pegada al banco hasta codos a 90°.",
      "Empuja extendiendo tríceps sin encoger hombros.",
    ], ["Alejar demasiado el cuerpo del borde estresando los hombros.", "Bajar más allá de la movilidad segura del hombro."], undefined, "bodyweight");
  }
  if (raw.includes("fondos de triceps en maquina") || raw.includes("fondos_de_triceps_en_maquina")) {
    return make("dips_machine", "Tríceps · Pecho Inferior en Máquina", "Deltoides Anterior", "1s empuje abajo · 2–3s retorno", "Exhala al empujar abajo, inhala al subir", [
      "Apoya firme la espalda contra el respaldo y agarra los manerales pegados.",
      "Empuja hacia abajo extendiendo codos sin despegar el glúteo del asiento.",
      "Controla la subida hasta ~90° de flexión en los codos.",
    ], ["Encoger los hombros hacia las orejas cuando suben los brazos.", "Levantarse del asiento por exceso de peso."], undefined, "machine");
  }
  if (exId === "dips" || raw.includes("fondo")) {
    return make("dips_parallel", "Pectoral Inferior · Tríceps", "Deltoides Anterior", "2s bajada · 1s subida", "Inhala al descender, exhala al extender", [
      "Inclina el torso levemente al frente (pecho) o vertical (tríceps).",
      "Desciende controlado hasta que los hombros alcancen el nivel del codo.",
      "Empuja de regreso deprimiendo hombros lejos de las orejas arriba.",
    ], ["Hacer medias repeticiones rápidas sin profundidad.", "Dejar que los hombros caigan hacia delante abajo."]);
  }

  /* ---------- SHOULDERS (HOMBROS) ---------- */
  if (raw.includes("contractora inversa") || raw.includes("contractora_inversa")) {
    return make("reverse_pec_deck", "Deltoides Posterior en Máquina", "Romboides, Trapecio Medio", "1s apertura atrás · 2–3s retorno", "Exhala al abrir brazos atrás, inhala al volver", [
      "Regula los agarres al nivel exacto de los hombros con pecho en el cojín.",
      "Lleva los brazos atrás en arco amplio evitando juntar demasiado escápulas al inicio.",
      "Controla la vuelta sin dejar caer las placas.",
    ], ["Encoger el cuello tirando con trapecio superior.", "Doblar los codos convirtiéndolo en un remo."], undefined, "machine");
  }
  if (raw.includes("face pull") || raw.includes("facepull") || raw.includes("cruce inverso") || raw.includes("rotacion") || raw.includes("cuban")) {
    return make("facepull", "Deltoides Posterior · Manguito Rotador", "Trapecio Medio, Romboides", "1s tirón · 1s apriete · 2s retorno", "Exhala al abrir la cuerda a la frente", [
      "Coloca la polea a la altura de la cara y separa la cuerda hacia las orejas.",
      "Finaliza en postura de doble bíceps llevando pulgares atrás.",
      "Sostén 1 segundo atrás antes de volver suavemente.",
    ], ["Poner demasiado peso y echar la espalda atrás.", "Tirar por debajo de la barbilla con codos caídos."]);
  }
  if (raw.includes("pajaros") || raw.includes("pájaros") || raw.includes("pull apart") || raw.includes("w-raise") || raw.includes("w_raise")) {
    return make("rear_delt_bent", "Deltoides Posterior", "Trapecio Medio, Romboides", "1s elevación · 2s bajada", "Exhala al elevar brazos atrás, inhala al bajar", [
      "Inclina el torso firme casi paralelo al suelo con espalda recta.",
      "Abre los brazos hacia los lados en línea perpendicular al torso.",
      "Lidera con el dorso de las manos sin columpiar la cintura.",
    ], ["Dar tirones con la zona lumbar.", "Juntar tanto brazos atrás que trabaje solo trapecio."]);
  }
  if (raw.includes("elevacion frontal") || raw.includes("elevación frontal")) {
    return make("front_raise", "Deltoides Anterior", "Pectoral Clavicular, Core", "1s subida · 2s bajada controlada", "Exhala al subir a la línea ocular, inhala al bajar", [
      "De pie firme sin balanceo de cadera, codos casi extendidos.",
      "Eleva al frente hasta la altura de los ojos o ligeramente superior.",
      "Frena la bajada resistiendo todo el recorrido sin golpear muslos.",
    ], ["Usar inercia de espalda baja para levantar la carga.", "Subir demasiado encogiendo trapecios."]);
  }
  if (raw.includes("elevaciones laterales") || raw.includes("elevacion lateral") || raw.includes("elevacion en y") || raw.includes("y-raise") || raw.includes("lu raise") || exId === "lateral") {
    if (equip === "machine") {
      return make("lateral_machine", "Deltoides Lateral en Máquina", "Supraespinoso, Trapecio", "1s apertura lateral · 2–3s bajada", "Exhala al elevar almohadillas, inhala al cerrar", [
        "Alinea los hombros con las bisagras de la máquina y apoya los codos.",
        "Empuja las almohadillas lateralmente hacia arriba hasta 90°.",
        "Frena el descenso suavemente sin que golpeen las placas.",
      ], ["Encoger los trapecios arriba.", "Despegar la espalda del respaldo."], undefined, "machine");
    }
    return make("lateral_raise", "Deltoides Lateral", "Supraespinoso, Trapecio", "1s subida · 2–3s bajada lenta", "Exhala al elevar, inhala al descender", [
      "Lleva los brazos en el plano escapular (~30° al frente) liderando con codos.",
      "Sube hasta formar una T con los hombros sin levantar el cuello.",
      "Baja en 2–3 segundos manteniendo tensión lateral antes de tocar cuerpo.",
    ], ["Balancear el torso al inicio de cada rep.", "Doblar codos más de 90° subiendo manos primero."]);
  }
  if (raw.includes("flexiones en pino") || raw.includes("press pike")) {
    return make("handstand_pushup", "Deltoides Anterior · Tríceps · Core", "Trapecio, Serrato", "2s descenso controlado · 1s empuje", "Inhala al bajar coronilla, exhala al empujar", [
      "Forma triángulo estable entre manos y punto de apoyo de la cabeza.",
      "Mantén codos metidos hacia delante (~45°), no abiertos atrás.",
      "Empuja verticalmente bloqueando hombros arriba hacia las orejas.",
    ], ["Arquear la lumbar en forma de banana.", "Abrir los codos lateralmente sobrecargando muñecas."], undefined, "bodyweight");
  }
  if (raw.includes("press arnold")) {
    return make("ohp_arnold", "Deltoides Completo (Anterior + Lateral)", "Tríceps, Trapecio", "1s rotación + empuje · 2s vuelta", "Exhala al girar y subir arriba", [
      "Empieza con palmas hacia tu cara y codos pegados al frente.",
      "Abre codos hacia fuera rotando palmas al frente mientras empujas arriba.",
      "Deshaz la rotación suavemente al bajar frente al pecho.",
    ], ["Rotar demasiado rápido abajo chocando mancuernas.", "Arquear zona lumbar arriba."], undefined, "dumbbell");
  }
  if ((raw.includes("press militar") || raw.includes("press hombro")) && equip === "machine") {
    return make("ohp_machine", "Deltoides Anterior y Medio en Máquina", "Tríceps, Trapecio", "1s empuje · 2–3s bajada", "Exhala al extender arriba, inhala al volver", [
      "Ajusta asiento para empezar con los agarres justo a la altura de las orejas.",
      "Empuja verticalmente manteniendo cabeza y espalda pegadas al respaldo.",
      "Controla la bajada hasta rozar suavemente la posición inicial sin chocar placas.",
    ], ["Despegar la lumbar del respaldo.", "Bloquear codos con golpe seco arriba."], undefined, "machine");
  }
  if (exId === "ohp" || raw.includes("press militar") || raw.includes("push press") || raw.includes("press tras nuca") || raw.includes("press z") || raw.includes("press bradford") || raw.includes("press hombro") || raw.includes("landmine de hombro")) {
    return make("ohp_bar", "Deltoides Anterior", "Tríceps, Trapecio, Core", "1s empuje · 2s bajada", "Bloquea abdomen abajo, exhala al pasar la cabeza", [
      "Aprieta glúteos y abdomen para convertir el torso en un pilar rígido.",
      "Empuja en vertical recta metiendo levemente la cabeza bajo la barra arriba.",
      "Baja controlado hasta apoyar arriba de la clavícula (antebrazos verticales).",
    ], ["Arquear la lumbar convirtiendo el ejercicio en press inclinado de pie.", "Dejar muñecas muy dobladas atrás."]);
  }

  /* ---------- BACK (ESPALDA) ---------- */
  if (raw.includes("muscle up")) {
    return make("muscle_up", "Dorsal · Pecho · Tríceps (Explosivo)", "Core, Bíceps, Antebrazo", "Tirón explosivo + transición + fondo", "Exhala en tirón explosivo y empuje", [
      "Usa falso agarre o tirón alto llevando caderas hacia la barra.",
      "Transiciona rápido llevando pecho y hombros encima de la barra.",
      "Finaliza empujando un fondo limpio arriba hasta extender brazos.",
    ], ["Subir un brazo antes que el otro (chicken wing).", "Tirar recto vertical en vez de en curva en C."]);
  }
  if (exId === "pullup" || raw.includes("dominadas") || raw.includes("chin up") || raw.includes("colgarse")) {
    return make("pullup", "Dorsal Ancho · Espalda Alta", "Bíceps, Romboides, Core", "1s subida · 2–3s bajada completa", "Exhala al subir pecho a la barra", [
      "Desbloquea bajando escápulas al iniciar el tirón (pecho orgulloso).",
      "Lleva codos hacia las costillas hasta pasar limpiamente la barbilla.",
      "Extiende brazos abajo casi al 100% controlando el peso.",
    ], ["Dar patadas de piernas o balanceo excesivo.", "Hacer medio recorrido superior sin bajar del todo."]);
  }
  if (raw.includes("australianas") || raw.includes("remo invertido")) {
    return make("row_inverted", "Espalda Media · Dorsal · Bíceps", "Core, Glúteos", "1s pecho a barra · 2s bajada", "Exhala al tirar hacia arriba", [
      "Cuerpo recto en plancha invertida apoyado en talones bajo la barra.",
      "Tira llevando el esternón hasta tocar la barra apretando escápulas.",
      "Baja lento manteniendo la cadera firme arriba.",
    ], ["Dejar caer las caderas al suelo.", "Tirar de cabeza/cuello adelante en vez del pecho."]);
  }
  if (raw.includes("jalon") && equip === "machine") {
    return make("pulldown_machine", "Dorsal Ancho en Máquina", "Bíceps, Romboides", "1s tirón · 1s abajo · 2–3s subida", "Exhala al bajar brazos, inhala al estirar arriba", [
      "Ajusta rodillos sobre los muslos para anclarte firmemente al asiento.",
      "Tira de las palancas abajo dirigiendo codos hacia los costados.",
      "Deja subir los brazos completo estirando el dorsal sin chocar placas.",
    ], ["Inclinarte exageradamente atrás.", "Encoger los hombros arriba al final."], undefined, "machine");
  }
  if (exId === "pulldown" || raw.includes("jalon") || raw.includes("pull down")) {
    return make("pulldown_cable", "Dorsal Ancho", "Bíceps, Redondo Mayor", "1s tirón · 1s esternón · 2–3s vuelta", "Exhala al bajar barra al pecho, inhala al subir", [
      "Fija rodillas bajo el rodillo e inclínate apenas ~15° atrás.",
      "Inicia bajando hombros y tira de codos abajo llevando barra a clavícula.",
      "Estira dorsales completamente arriba con control.",
    ], ["Echarte completamente atrás como si fuera un remo.", "Llevar la barra detrás de la nuca forzando cuello."], undefined, equip === "band" ? "band" : "cable");
  }
  if (raw.includes("barra t") || raw.includes("meadows")) {
    return make("row_tbar", "Espalda Media · Dorsal · Romboides", "Bíceps, Erectores", "1s tirón al pecho · 2s estiramiento", "Exhala al subir discos al pecho", [
      "Bisagra firme de cadera con espalda neutra (~45°) y pecho sobre el apoyo/barra.",
      "Tira con codos hacia atrás apretando el centro de la espalda arriba.",
      "Estira escápulas abajo sin encorvar la zona lumbar.",
    ], ["Levantarse vertical con la espalda en cada repetición.", "Rebotar discos contra el suelo."], undefined, "barbell");
  }
  if (raw.includes("hammer strength") || ((raw.includes("remo con apoyo") || raw.includes("remo alto") || raw.includes("remo sentado")) && equip === "machine")) {
    return make("row_machine", "Espalda Media · Dorsal en Máquina", "Bíceps, Trapecio Medio", "1s tirón · 1s apriete · 2s retorno", "Exhala al tirar atrás, inhala al estirar adelante", [
      "Apoya el pecho firme contra el cojín sin despegarlo durante el tirón.",
      "Tira de los manerales llevando codos bien atrás más allá del torso.",
      "Deja avanzar hombros adelante para estirar dorsales sin golpear placas.",
    ], ["Despegar el pecho del cojín usando tirón lumbar.", "Acortar el recorrido adelante."], undefined, "machine");
  }
  if (raw.includes("remo sentado") || raw.includes("gironda") || (raw.includes("remo") && equip === "cable")) {
    return make("row_cable", "Espalda Media · Dorsal (Polea)", "Bíceps, Deltoides Posterior", "1s tirón · 1s pausa · 2–3s vuelta", "Exhala al llevar agarre al abdomen, inhala al estirar", [
      "Apoya pies firmes con rodillas semidobladas y columna erguida.",
      "Lleva el agarre hacia el ombligo abriendo pecho y juntando escápulas.",
      "Permite ligera protracción escapular adelante sin redondear el lumbar.",
    ], ["Balancearse hacia delante y atrás como un remero olímpico.", "Subir hombros hacia las orejas al tirar."], undefined, "cable");
  }
  if (raw.includes("una mano") || raw.includes("kroc") || raw.includes("renegado")) {
    return make("row_one_arm", "Dorsal Unilateral · Espalda Media", "Bíceps, Oblicuos, Core", "1s tirón al bolsillo · 2s bajada", "Exhala al llevar mancuerna a cadera", [
      "Apoya mano y rodilla contraria firmes sobre el banco paralelo al suelo.",
      "Tira describiendo arco ligero llevando mancuerna hacia la cadera (no al hombro).",
      "Estira el dorsal abajo sin rotar todo el tronco como hélice.",
    ], ["Tirar recto al pecho con el codo pegado arriba.", "Girar la columna lumbar en cada rep."], undefined, "dumbbell");
  }
  if (raw.includes("encogimientos") || raw.includes("paseo del granjero")) {
    const farmer = raw.includes("granjero");
    return make("shrug", "Trapecio Superior", "Antebrazo, Agarre, Core", "1s subida · 1s pausa arriba · 2s bajada", "Exhala al encoger hacia arriba", [
      "Brazos completamente extendidos sin doblar codos durante el tirón.",
      "Eleva los hombros recto hacia arriba intentando tocar orejas.",
      "Pausa 1s en máxima contracción y desciende completo estirando.",
    ], ["Hacer círculos con los hombros (riesgo innecesario bajo carga).", "Ayudarse doblando codos o impulsando piernas."], farmer ? "farmer" : undefined);
  }
  if (raw.includes("remo al menton") || raw.includes("snatch grip high pull")) {
    return make("upright_row", "Deltoides Lateral · Trapecio", "Bíceps, Braquiorradial", "1s subida de codos · 2s bajada", "Exhala al elevar codos", [
      "Agarre ligeramente más ancho que hombros para proteger manguitos.",
      "Lidera siempre con los codos subiendo hasta la altura del esternón/hombros.",
      "Baja controlado manteniendo la barra cerca del cuerpo.",
    ], ["Agarre muy cerrado provocando pinzamiento en hombro.", "Subir muñecas más alto que los codos."]);
  }
  if (raw.includes("hiperextensiones") || raw.includes("buenos dias") || raw.includes("superman")) {
    return make("back_ext", "Erectores Espinales · Glúteos · Femoral", "Core Posterior", "2s bisagra controlada · 1s subida", "Inhala al bajar, exhala al extender a línea recta", [
      "Coloca el cojín justo por debajo de la línea pélvica para girar desde cadera.",
      "Baja con columna neutra hasta estirar femorales y glúteo.",
      "Sube apretando glúteos hasta alinear cuerpo sin hiperextender atrás.",
    ], ["Lanzar la espalda arriba sobrepasando la horizontal en arco.", "Flexionar repetidamente solo la lumbar."]);
  }
  if (exId === "deadlift" || exId === "rdl" || raw.includes("peso muerto") || raw.includes("rack pull")) {
    const v = raw.includes("sumo") ? "sumo" : raw.includes("trap") ? "trapbar" : (exId === "rdl" || raw.includes("rumano") || raw.includes("rigidas") || raw.includes("una pierna")) ? "rdl" : "flat";
    return make("deadlift", v === "rdl" ? "Femoral · Glúteos" : v === "sumo" ? "Glúteos · Aductores · Lumbar" : "Cadena Posterior · Lumbar", "Trapecio, Antebrazo, Cuádriceps", v === "rdl" ? "3s bisagra atrás · 1s subida" : "1s despegue firme · 2s bajada", "Gran respiración diafragmática (bracing) abajo", [
      v === "rdl" ? "Empuja cadera bien atrás manteniendo piernas casi rígidas y barra rozando muslos." : "Barra pegada al centro del pie; saca pecho y tensa dorsales antes de despegar.",
      "Empuja el suelo con los pies manteniendo columna lumbar completamente neutra.",
      "Bloquea arriba apretando glúteos sin echarte hacia atrás.",
    ], ["Redondear la espalda baja bajo carga.", "Alejar la barra hacia los dedos de los pies."], v);
  }
  if (exId === "row" || raw.includes("remo")) {
    return make("row_bent", "Espalda Media · Dorsal Ancho", "Bíceps, Romboides, Core", "1s tirón · 1s apriete · 2s bajada", "Exhala al tirar al abdomen, inhala al bajar", [
      "Bisagra firme a ~45° con pecho alto, espalda recta y rodillas suaves.",
      "Tira con codos hacia atrás llevando barra hacia el ombligo.",
      "Junta escápulas arriba un instante antes de bajar controlado.",
    ], ["Erguir todo el torso en cada tirón usando balanceo.", "Encorvar zona lumbar."]);
  }

  /* ---------- ARMS: BICEPS & FOREARM ---------- */
  if (raw.includes("predicador") || raw.includes("concentrado")) {
    return make("biceps_preacher", "Bíceps Braquial (Banco Scott)", "Braquial", "1s subida · 3s extensión lenta", "Exhala al subir, inhala estirando abajo", [
      "Encaja axilas y parte posterior del brazo firme contra la almohadilla inclinada.",
      "Sube manteniendo muñecas neutras sin despegar codos del banco.",
      "Desciende lento sin dejar caer de golpe la articulación abajo.",
    ], ["Despegar codos y hombros al iniciar el tirón.", "Soltar rápido en el último tramo de extensión."]);
  }
  if (raw.includes("curl inclinado") || raw.includes("spider") || raw.includes("arana") || raw.includes("araña")) {
    return make("biceps_incline", "Cabeza Larga del Bíceps", "Braquial", "1s subida · 3s bajada completa", "Exhala al flexionar, inhala al estirar atrás", [
      "Apoya espalda en banco a 45° dejando brazos colgar verticales atrás.",
      "Sube sin adelantar los codos hacia delante manteniendo el estiramiento del hombro.",
      "Extiende abajo al 100% activando tríceps brevemente en cada rep.",
    ], ["Balancear los codos hacia delante perdiendo la tensión trasera.", "Despegar cabeza y espalda del banco."], undefined, equip === "barbell" ? "barbell" : "dumbbell");
  }
  if (raw.includes("polea alta") || raw.includes("bayesiano")) {
    return make("biceps_high_cable", "Bíceps en Tensión Constante (Polea)", "Braquial, Antebrazo", "1s cierre · 2–3s estiramiento", "Exhala al llevar manos hacia cabeza/adelante", [
      "Fija los codos arriba (o por detrás del torso en bayesiano) inmóviles.",
      "Flexiona llevando manos en arco hacia la oreja/hombro apretando fuerte.",
      "Controla la vuelta dejando que el cable estire por completo el bíceps.",
    ], ["Bajar los codos a las costillas mientras tiras.", "Inclinarte adelante/atrás para robar peso."], undefined, "cable");
  }
  if (raw.includes("muneca") || raw.includes("muñeca") || raw.includes("rodillo") || raw.includes("pronacion") || raw.includes("gripper") || raw.includes("pinza") || raw.includes("camarero")) {
    return make("forearm_curl", "Antebrazos · Flexores / Extensores", "Agarre", "1s flexión · 2s extensión", "Respiración fluida constante", [
      "Apoya antebrazos completamente sobre el banco dejando muñecas libres fuera.",
      "Flexiona y extiende únicamente la articulación de la muñeca.",
      "Baja controlando hasta la punta de los dedos si realizas curl flexor.",
    ], ["Despegar los codos del banco.", "Usar demasiado peso limitando todo el rango de muñeca."]);
  }
  if (exId === "curl" || exId === "hammer" || raw.includes("curl")) {
    return make("biceps_standing", raw.includes("martillo") ? "Braquial · Bíceps · Braquiorradial" : "Bíceps Braquial", "Antebrazo", "1s subida · 2–3s bajada completa", "Exhala al subir, inhala al extender abajo", [
      "Codos fijados a los costados sin echar hombros atrás.",
      "Flexiona completo hasta sentir pico máximo sin bajar codos.",
      "Extiende abajo casi al 100% controlando el peso.",
    ], ["Columpiar el torso al arrancar.", "Hacer medias repeticiones sin bajar del todo."]);
  }

  /* ---------- ARMS: TRICEPS ---------- */
  if (raw.includes("press frances") || raw.includes("press francés") || raw.includes("rompecraneos") || raw.includes("tate")) {
    return make("triceps_skullcrusher", "Tríceps (Cabeza Larga y Medial)", "Ancóneo, Antebrazo", "3s bajada a frente · 1s extensión", "Inhala al bajar atrás/frente, exhala al bloquear", [
      "Inclina brazos ligeramente atrás (100°) para mantener tensión en pico arriba.",
      "Flexiona solo los codos llevando barra hacia la frente o detrás de cabeza.",
      "Extiende firme manteniendo codos apuntando paralelos al techo.",
    ], ["Abrir los codos lateralmente.", "Mover los hombros abajo y arriba en cada repetición."]);
  }
  if (raw.includes("patada de triceps") || raw.includes("patada_de_triceps")) {
    return make("triceps_kickback", "Tríceps (Aislamiento en Acortamiento)", "Deltoides Posterior", "1s extensión atrás · 1s apriete · 2s vuelta", "Exhala al extender brazo atrás", [
      "Torso paralelo al suelo con codo fijado alto por encima de la línea dorsal.",
      "Extiende únicamente el antebrazo atrás hasta alinear con el hombro.",
      "Pausa un segundo arriba apretando el tríceps antes de doblar a 90°.",
    ], ["Dejar caer el codo hacia abajo con fatiga.", "Balancear la mancuerna como péndulo."]);
  }
  if (raw.includes("tras nuca") || raw.includes("katana")) {
    return make("triceps_overhead", "Cabeza Larga del Tríceps (Estiramiento)", "Core, Estabilizadores", "3s bajada profunda · 1s empuje arriba", "Inhala al bajar detrás de nuca, exhala al subir", [
      "Codos altos apuntando al techo lo más cerrados que permita tu movilidad.",
      "Desciende la carga detrás de la nuca buscando máximo estiramiento del tríceps.",
      "Extiende verticalmente sin dejar caer los codos adelante.",
    ], ["Arquear excesivamente la espalda baja.", "Abrir muchísimo los codos hacia fuera."]);
  }
  if (exId === "pushdown" || raw.includes("triceps") || raw.includes("tríceps") || raw.includes("cuerda") || raw.includes("barra v") || raw.includes("extension cruzada") || raw.includes("extension unilateral")) {
    return make("triceps_pushdown", "Tríceps (3 Cabezas en Polea)", "Ancóneo", "1s bloqueo abajo · 2–3s subida", "Exhala al extender abajo, inhala al subir a 90°+", [
      "Pega codos firme a los costados inmóviles y da medio paso atrás.",
      "Extiende completo bloqueando codos abajo (abre cuerda hacia los lados).",
      "Deja subir el agarre más arriba de los 90° sin despegar codos.",
    ], ["Echarse con el peso del cuerpo empujando como fondo.", "Mover los codos alante y atrás en cada rep."]);
  }

  /* ---------- LEGS (PIERNAS & GLÚTEO) ---------- */
  if (raw.includes("hack") || raw.includes("pendulo") || raw.includes("péndulo") || raw.includes("belt squat")) {
    return make("squat_hack", "Cuádriceps (Máquina Hack / Péndulo)", "Glúteos, Aductores", "3s descenso profundo · pausa · 1s empuje", "Inhala profundo bajando, exhala empujando el carro", [
      "Apoya espalda y cadera firmes contra el respaldo durante toda la rep.",
      "Pies bajos/medios en plataforma; desciende doblando rodillas al máximo cómodo.",
      "Empuja con todo el pie dejando rodillas en línea con las puntas.",
    ], ["Despegar el lumbar/glúteo del respaldo al fondo.", "Dejar caer el carro con rebote."], undefined, "machine");
  }
  if (raw.includes("pistol")) {
    return make("squat_pistol", "Cuádriceps · Glúteos · Equilibrio", "Core, Tobillo", "3s bajada a una pierna · 1s subida", "Inhala al bajar, exhala al subir", [
      "Mantén la pierna libre estirada adelante sin tocar el suelo.",
      "Baja controlando el peso sobre medio pie de la pierna de apoyo.",
      "Usa brazos adelante para equilibrar el centro de gravedad.",
    ], ["Despegar el talón de apoyo cayendo hacia delante.", "Colapsar la rodilla de apoyo hacia dentro."], "pistol", "bodyweight");
  }
  if (exId === "squat" || raw.includes("sentadilla") || raw.includes("yoke")) {
    if (raw.includes("bulgara") || raw.includes("búlgara")) {
      return make("lunge", "Cuádriceps · Glúteo Mayor (Unilateral)", "Estabilizadores de Cadera, Core", "3s bajada · 1s empuje", "Inhala al bajar rodilla trasera, exhala al subir", [
        "Apoya empeine trasero sobre el banco a altura cómoda; torso ligeramente adelante.",
        "Desciende llevando cadera abajo y algo atrás cargando pierna delantera.",
        "Empuja fuerte a través del talón delantero sin bloquear seco.",
      ], ["Apoyar demasiada carga en la pierna trasera del banco.", "Colocar pies en la misma línea perdiendo equilibrio."], "bulgarian", equip);
    }
    return make("squat", "Cuádriceps · Glúteos", "Aductores, Core, Erectores", "2–3s bajada profunda · 1s subida", "Inhala y aprieta abdomen arriba, exhala al subir", [
      "Pies al ancho de hombros, puntas ~20° afuera con rodillas siguiendo punteras.",
      "Baja controlando pecho alto hasta romper paralelo cómodamente.",
      "Empuja fuerte el suelo repartiendo carga entre talón y metatarso.",
    ], ["Colapsar rodillas hacia dentro (valgo).", "Levantar los talones o redondear lumbar abajo."], raw.includes("frontal") || raw.includes("goblet") ? "incline" : "flat");
  }
  if (exId === "legpress" || raw.includes("prensa")) {
    const horiz = raw.includes("horizontal");
    return make("leg_press", "Cuádriceps · Glúteos en Prensa", "Aductores, Femoral", "2–3s descenso · 1s empuje", "Inhala bajando rodillas al pecho, exhala empujando", [
      "Lumbar y sacro firmemente pegados al respaldo durante toda la serie.",
      "Baja hasta flexión profunda sin que el glúteo se despegue del asiento.",
      "Extiende sin bloquear totalmente las rodillas arriba.",
    ], ["Bloquear las rodillas de golpe con carga pesada.", "Despegar el glúteo enrollando la pelvis arriba."], horiz ? "flat" : "incline", "machine");
  }
  if (raw.includes("extension de cuadriceps") || raw.includes("extension_de_cuadriceps")) {
    return make("leg_extension", "Cuádriceps (Aislamiento en Máquina)", "Recto Femoral", "1s extensión · 1s apriete arriba · 3s bajada", "Exhala al extender piernas, inhala al volver lento", [
      "Alinea la articulación de la rodilla exactamente con el eje rotatorio de la máquina.",
      "Agárrate fuerte a las asas laterales fijando la cadera contra el asiento.",
      "Sube extendiendo del todo, pausa 1s arriba y frena la bajada 3s.",
    ], ["Dar patada inicial usando impulso del torso.", "Dejar caer las placas de golpe bajando."], undefined, "machine");
  }
  if (raw.includes("curl femoral sentado") || raw.includes("femoral de pie")) {
    return make("leg_curl_seated", "Isquiosurales (Estiramiento en Máquina)", "Gemelos", "1s flexión abajo · 3s vuelta controlada", "Exhala al bajar rodillo, inhala al subir despacio", [
      "Fija bien el cojín superior apretando los muslos contra el asiento.",
      "Lleva los talones todo hacia atrás debajo del asiento contrayendo femoral.",
      "Regresa muy controlado estirando por completo la parte trasera del muslo.",
    ], ["Dejar subir el rodillo rápido perdiendo tensión abajo.", "Despegar el lumbar del respaldo al tirar."], undefined, "machine");
  }
  if (raw.includes("curl femoral") || raw.includes("curl nordico") || raw.includes("glute ham")) {
    return make("leg_curl_prone", "Isquiosurales (Femoral Tumbado)", "Gemelos, Glúteo", "1s flexión · 3s descenso lento", "Exhala al acercar talones, inhala al extender", [
      "Presiona fuertemente el pubis/cadera contra el banco sin levantarlo al tirar.",
      "Acerca el rodillo hacia los glúteos manteniendo tobillos firmes.",
      "Frena la bajada durante 2–3 segundos sin dejar rebotar placas.",
    ], ["Arquear zona lumbar despegando cadera en el tirón.", "Acortar el recorrido arriba sin extender piernas abajo."], undefined, equip === "bodyweight" ? "bodyweight" : "machine");
  }
  if (raw.includes("step up")) {
    return make("step_up", "Glúteos · Cuádriceps (Unilateral)", "Core, Estabilizadores", "1s subida sobre cajón · 2–3s bajada", "Exhala al subir sobre cajón, inhala al bajar", [
      "Apoya todo el pie firme encima del cajón e inclina levemente torso adelante.",
      "Empuja únicamente con la pierna de arriba evitando rebotar desde el suelo.",
      "Desciende lento y controlado sin dejarte caer al suelo.",
    ], ["Impulsarte dando patada con el pie de apoyo abajo.", "Cajón demasiado alto curvando la zona lumbar."]);
  }
  if (exId === "lunge" || raw.includes("zancada") || raw.includes("monster walk")) {
    return make("lunge", "Cuádriceps · Glúteos", "Core, Aductores", "2s descenso · 1s subida", "Inhala al descender vertical, exhala al impulsar", [
      "Mantén separación lateral al ancho de caderas para estabilidad firme.",
      "Baja vertical hasta formar ~90° en ambas rodillas sin golpear suelo.",
      "Empuja a través de talón y medio pie manteniendo tronco firme.",
    ], ["Dejar que la rodilla delantera se venza hacia dentro.", "Caminar sobre una sola línea recta estrecha."]);
  }
  if (raw.includes("patada de gluteo") || raw.includes("patada_de_gluteo") || raw.includes("pull through")) {
    return make("glute_kickback", "Glúteo Mayor (Extensión Cadera)", "Femoral, Core", "1s patada atrás · 1s apriete · 2s vuelta", "Exhala al extender cadera atrás", [
      "Inclina ligeramente el torso con abdomen firme (sin arquear lumbar al patear).",
      "Lleva la pierna atrás extendiendo desde la cadera y aprieta glúteo.",
      "Controla la vuelta llevando la rodilla suavemente delante.",
    ], ["Arquear la zona lumbar subiendo la pierna en exceso.", "Usar el impulso del cuello."], undefined, equip);
  }
  if (raw.includes("abduccion") || raw.includes("aduccion") || raw.includes("clamshell")) {
    const add = raw.includes("aduccion");
    return make("hip_abduction", add ? "Aductores (Cierre en Máquina)" : "Glúteo Medio · Abductores", "Estabilizadores Pélvicos", "1s apretón · 1s pausa · 2s retorno", "Exhala al abrir/cerrar, inhala al volver", [
      "Mantén glúteos y lumbar firmes apoyados o levemente inclinados adelante.",
      add ? "Cierra las almohadillas controladamente apretando cara interna del muslo." : "Abre las piernas desde las caderas apretando glúteo lateral.",
      "Frena la vuelta sin dejar golpear las placas al cerrarse.",
    ], ["Impulsarse con todo el torso hacia atrás y adelante.", "Soltar rápido en el retorno."], add ? "adduction" : undefined, equip);
  }
  if (raw.includes("hip thrust") || raw.includes("puente de gluteo") || raw.includes("frog pump")) {
    const floor = raw.includes("puente") || raw.includes("frog");
    return make("hip_thrust", "Glúteo Mayor (Máximo Acortamiento)", "Femoral, Core", "1s empuje · 1s bloqueo arriba · 2s bajada", "Exhala al bloquear arriba, inhala al bajar", [
      floor ? "Apoya espalda en el suelo con talones cerca del glúteo." : "Apoya borde inferior de escápulas en el banco manteniendo mirada al frente.",
      "Empuja vertical por los talones logrando tibias a 90° arriba.",
      "Aprieta glúteos al máximo arriba haciendo retroversión pélvica sutil.",
    ], ["Mirar hacia el techo hiperextendiendo la zona lumbar.", "Pies muy lejos (carga femoral) o muy cerca (carga rodilla)."], floor ? "floor" : "flat");
  }
  if (raw.includes("sentado") && (raw.includes("talones") || raw.includes("gemelo"))) {
    return make("calf_seated", "Sóleo (Gemelo Profundo Sentado)", "Tendón Aquiles", "1s subida · 1s estiramiento abajo · 2s bajada", "Exhala al empujar rodillas arriba, inhala abajo", [
      "Coloca metatarso sobre el borde dejando caer talones al máximo abajo.",
      "Pausa 1–2 segundos abajo eliminando el rebote elástico del tendón.",
      "Sube todo arriba empujando con el dedo gordo.",
    ], ["Rebotar rápido arriba y abajo sin pausa en estiramiento.", "Doblar rodillas para acortar rango."], undefined, "machine");
  }
  if (exId === "calf" || raw.includes("gemelo") || raw.includes("talones") || raw.includes("burro") || raw.includes("tibial")) {
    return make("calf_standing", "Gastrocnemio · Gemelos", "Sóleo", "1s punta máxima · 2s estiramiento abajo · 2s bajada", "Exhala al subir de puntillas, inhala al estirar", [
      "Mantén rodillas bloqueadas (sin doblarlas) apoyando solo metatarsos.",
      "Baja talones por debajo del escalón y aguanta 1–2s en estiramiento total.",
      "Sube en vertical todo lo posible apretando pantorrillas arriba.",
    ], ["Hacer rebotes rápidos usando la elasticidad del tendón.", "Doblar rodillas para acortar rango."]);
  }
  if (raw.includes("swing")) {
    return make("kettlebell_swing", "Cadena Posterior · Glúteos · Potencia", "Lumbar, Core, Hombros", "Chasquido rápido de cadera", "Exhala explosivo al extender cadera al frente", [
      "Es una bisagra de cadera horizontal, NO una sentadilla ni elevación frontal.",
      "Carga caderas atrás esperando la pesa hasta el último instante y extiende fuerte.",
      "De pie recto como una plancha, deja flotar la kettlebell hasta altura del pecho.",
    ], ["Levantar la kettlebell tirando con los hombros.", "Doblar mucho las rodillas bajando como sentadilla."], undefined, "kettlebell");
  }

  /* ---------- DEFAULT MUSCLE FALLBACK ---------- */
  const mus = ex?.muscle ?? "chest";
  if (mus === "back") {
    return make("row_bent", "Espalda · Dorsal", "Bíceps, Trapecio", "1s tirón · 2s retorno", "Exhala al tirar, inhala al estirar", [
      "Espalda neutra y abdomen tenso durante toda la ejecución.",
      "Dirige codos hacia atrás juntando escápulas en el punto máximo.",
      "Controla todo el retorno sintiendo el estiramiento dorsal.",
    ], ["Encorvar la zona lumbar.", "Usar demasiado impulso del torso."]);
  }
  if (mus === "shoulders") {
    return make("ohp_bar", "Deltoides", "Tríceps, Core", "1s empuje · 2s bajada", "Exhala al subir, inhala al descender", [
      "Bloquea abdomen y glúteos protegiendo la zona lumbar.",
      "Controla la trayectoria vertical sin balanceos laterales.",
      "Completa el recorrido evitando encoger trapecios arriba.",
    ], ["Arquear la lumbar hacia atrás.", "Impulsarse con piernas."]);
  }
  if (mus === "arms") {
    return make("biceps_standing", "Brazos", "Antebrazo", "1s contracción · 2s bajada", "Exhala al contraer, inhala al extender", [
      "Fija los codos cerca del cuerpo sin desplazarlos arriba o atrás.",
      "Evita columpiar el tronco.",
      "Trabaja el rango completo de flexión y extensión.",
    ], ["Balancear la espalda.", "Cortar el recorrido."]);
  }
  if (mus === "legs") {
    return make("squat", "Piernas · Cuádriceps", "Glúteos, Core", "2s bajada · 1s empuje", "Inhala al bajar, exhala al subir", [
      "Pies estables clavados al suelo con rodillas alineadas a punteras.",
      "Controla la profundidad sin doblar espalda baja.",
      "Empuja uniforme con todo el pie.",
    ], ["Colapsar rodillas hacia dentro.", "Despegar los talones."]);
  }
  return make("bench_press", "Pectoral Mayor", "Tríceps, Deltoides Anterior", "2s bajada · 1s empuje", "Inhala al bajar, exhala al subir", [
    "Retrae escápulas firmes contra el apoyo.",
    "Controla el descenso sin rebotes.",
    "Empuja estable con codos en ángulo seguro (~45°).",
  ], ["Abrir codos a 90°.", "Perder firmeza escapular."]);
}
