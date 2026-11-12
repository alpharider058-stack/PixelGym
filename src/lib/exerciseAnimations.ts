import { EX } from "./data";

export type AnimPattern =
  | "bench_press"
  | "chest_fly"
  | "pushup"
  | "dips"
  | "ohp"
  | "lateral_raise"
  | "facepull"
  | "pullup"
  | "pulldown"
  | "row"
  | "deadlift"
  | "pushdown"
  | "curl"
  | "squat"
  | "leg_press"
  | "lunge"
  | "hip_thrust"
  | "leg_curl"
  | "calf_raise"
  | "core";

export interface ExerciseGuide {
  pattern: AnimPattern;
  variant?: "flat" | "incline" | "decline" | "rdl" | "plank" | "cable" | "dumbbell" | "leg_ext";
  targetLabel: string;
  synergists: string;
  tempo: string;
  breathing: string;
  cues: [string, string, string];
  mistakes: [string, string];
}

export const ANW = 48;
export const ANH = 48;

const slugNorm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Maps any Exercise ID or Spanish name (18 core + 250+ variants) to a biomechanical guide & animation */
export function getExerciseGuide(exId: string, exName?: string): ExerciseGuide {
  const ex = EX[exId];
  const raw = slugNorm(`${exId} ${exName ?? ex?.name ?? ""} ${ex?.sub ?? ""}`);

  // Specific core / abs
  if (
    raw.includes("plancha") ||
    raw.includes("hollow") ||
    raw.includes("l_sit") ||
    raw.includes("copenhagen") ||
    raw.includes("bird_dog")
  ) {
    return {
      pattern: "core",
      variant: "plank",
      targetLabel: "Core · Transverso",
      synergists: "Hombros, Glúteos",
      tempo: "Isométrico · Tensión continua",
      breathing: "Respiración nasal lenta manteniendo abdomen duro",
      cues: [
        "Alinea cabeza, espalda y talones en una sola línea.",
        "Retroversión pélvica ligera: aprieta glúteos y abdomen.",
        "Empuja el suelo con antebrazos sin hundir los hombros.",
      ],
      mistakes: ["Arquear o dejar caer la zona lumbar.", "Subir demasiado la cadera en forma de V."],
    };
  }
  if (
    raw.includes("crunch") ||
    raw.includes("elevacion_de_piernas") ||
    raw.includes("elevacion de piernas") ||
    raw.includes("elevacion_de_rodillas") ||
    raw.includes("elevacion de rodillas") ||
    raw.includes("toes_to_bar") ||
    raw.includes("toes to bar") ||
    raw.includes("rueda_abdominal") ||
    raw.includes("rueda abdominal") ||
    raw.includes("dragon_flag") ||
    raw.includes("dragon flag") ||
    raw.includes("v_ups") ||
    raw.includes("v-ups") ||
    raw.includes("russian") ||
    raw.includes("pallof") ||
    raw.includes("lenador") ||
    raw.includes("woodchopper") ||
    raw.includes("dead_bug") ||
    raw.includes("sit_up") ||
    raw.includes("sit up") ||
    raw.includes("mountain") ||
    ex?.muscle === "core"
  ) {
    return {
      pattern: "core",
      variant: "flat",
      targetLabel: "Recto Abdominal",
      synergists: "Oblicuos, Flexores",
      tempo: "2s excéntrica · 1s contracción",
      breathing: "Exhala fuerte al contraer, inhala al bajar",
      cues: [
        "Flexiona la columna llevando costillas hacia la pelvis.",
        "Evita tirar del cuello con las manos; mira a un punto fijo.",
        "Controla la bajada sin golpear la espalda contra el suelo.",
      ],
      mistakes: ["Usar impulso de cadera o balanceo.", "No exhalar todo el aire en el punto máximo."],
    };
  }

  // Chest
  if (raw.includes("apertura") || raw.includes("cruce_de_poleas") || raw.includes("cruce de poleas") || raw.includes("pec_deck") || raw.includes("pec deck") || raw.includes("svend")) {
    return {
      pattern: "chest_fly",
      targetLabel: "Pectoral Mayor",
      synergists: "Deltoides Anterior",
      tempo: "3s apertura · 1s apriete",
      breathing: "Inhala al abrir brazos, exhala al juntar al centro",
      cues: [
        "Mantén una ligera semiflexión fija en los codos.",
        "Abre en arco amplio hasta sentir estiramiento en el pecho.",
        "Imagina abrazar un barril grande al juntar las manos.",
      ],
      mistakes: ["Convertir las aperturas en un press doblando mucho los codos.", "Perder la retracción escapular al abrir."],
    };
  }
  if (raw.includes("flexiones") && !raw.includes("pino")) {
    return {
      pattern: "pushup",
      targetLabel: "Pectoral · Tríceps",
      synergists: "Deltoides Anterior, Core",
      tempo: "2s bajada · 1s empuje",
      breathing: "Inhala al bajar el pecho, exhala al empujar",
      cues: [
        "Cuerpo rígido en plancha de cabeza a talones.",
        "Codos apuntando a ~45° respecto al torso (no en T).",
        "Baja el pecho hasta casi rozar el suelo y extiende arriba.",
      ],
      mistakes: ["Dejar caer la cadera antes que el pecho.", "Abrir los codos a 90° sobrecargando hombros."],
    };
  }
  if (exId === "dips" || raw.includes("fondo")) {
    return {
      pattern: "dips",
      targetLabel: "Pectoral Inferior · Tríceps",
      synergists: "Deltoides Anterior",
      tempo: "2s bajada · 1s subida",
      breathing: "Inhala bajando controlado, exhala al extender",
      cues: [
        "Inclina ligeramente el torso adelante para enfatizar pectoral.",
        "Baja hasta que el hombro quede igual o debajo del codo (~90°).",
        "Mantén hombros lejos de las orejas al subir arriba.",
      ],
      mistakes: ["Encoger los hombros hacia el cuello arriba.", "Hacer medio recorrido rápido sin profundidad."],
    };
  }
  if (
    exId === "incline" ||
    raw.includes("press inclinado") ||
    raw.includes("press_inclinado")
  ) {
    return {
      pattern: "bench_press",
      variant: "incline",
      targetLabel: "Pectoral Superior (Clavicular)",
      synergists: "Deltoides Anterior, Tríceps",
      tempo: "2s bajada · pausa · 1s subida",
      breathing: "Inhala al bajar hacia la clavícula, exhala al empujar",
      cues: [
        "Ajusta el banco a 30°–45° para maximizar pecho superior.",
        "Retrae escápulas contra el respaldo antes de descolgar.",
        "Baja la carga a la parte alta del pecho con codos a 45°.",
      ],
      mistakes: ["Banco demasiado vertical (>60°), robando trabajo al pecho.", "Despegar los glúteos o escápulas del banco."],
    };
  }
  if (
    exId === "bench" ||
    raw.includes("press banca") ||
    raw.includes("press_banca") ||
    raw.includes("press declinado") ||
    raw.includes("press_declinado") ||
    raw.includes("press suelo") ||
    raw.includes("press_suelo") ||
    raw.includes("press guillotina") ||
    raw.includes("press spoto") ||
    raw.includes("press hex") ||
    raw.includes("press squeeze") ||
    raw.includes("press pecho") ||
    raw.includes("press con pausa") ||
    raw.includes("pullover")
  ) {
    const isDb = raw.includes("mancuerna");
    return {
      pattern: "bench_press",
      variant: raw.includes("declinado") ? "decline" : isDb ? "dumbbell" : "flat",
      targetLabel: "Pectoral Mayor",
      synergists: "Tríceps, Deltoides Anterior",
      tempo: "2–3s bajada · toque firme · 1s subida",
      breathing: "Bloquea aire arriba, baja controlado, exhala al superar el punto crítico",
      cues: [
        "Junta y baja escápulas contra el banco creando base sólida.",
        "Pies firmes empujando el suelo (leg drive) sin levantar glúteo.",
        "Baja la barra a la altura del esternón con antebrazos verticales.",
      ],
      mistakes: ["Rebotar la barra en el pecho.", "Abrir codos a 90° en línea con los hombros."],
    };
  }

  // Shoulders
  if (
    exId === "lateral" ||
    raw.includes("elevaciones laterales") ||
    raw.includes("elevaciones_laterales") ||
    raw.includes("elevacion_lateral") ||
    raw.includes("lu_raise") ||
    raw.includes("pajaros") ||
    raw.includes("y_raise") ||
    raw.includes("w_raise")
  ) {
    return {
      pattern: "lateral_raise",
      targetLabel: "Deltoides Lateral",
      synergists: "Trapecio Superior",
      tempo: "1s subida · 2–3s bajada controlada",
      breathing: "Exhala al elevar los brazos, inhala al bajar",
      cues: [
        "Lidera la subida con los codos y antebrazos ligeramente hacia delante (~30°).",
        "Sube hasta la línea paralela de los hombros sin encoger trapecio.",
        "Frena la bajada resistiendo la gravedad hasta casi tocar caderas.",
      ],
      mistakes: ["Balancear el torso o doblar mucho los codos.", "Subir demasiado por encima de la cabeza encogiendo cuello."],
    };
  }
  if (
    exId === "facepull" ||
    raw.includes("face pull") ||
    raw.includes("face_pull") ||
    raw.includes("contractora inversa") ||
    raw.includes("cruce inverso") ||
    raw.includes("pull apart") ||
    raw.includes("rotacion") ||
    raw.includes("cuban")
  ) {
    return {
      pattern: "facepull",
      targetLabel: "Deltoides Posterior · Manguito",
      synergists: "Trapecio Medio, Romboides",
      tempo: "1s tirón · 1s apriete atrás · 2s vuelta",
      breathing: "Exhala al abrir la cuerda hacia la frente",
      cues: [
        "Coloca la polea a la altura del rostro y tira separando la cuerda.",
        "Lleva los pulgares hacia atrás (rotación externa) al nivel de las orejas.",
        "Aprieta las escápulas atrás un segundo completo antes de soltar.",
      ],
      mistakes: ["Poner demasiado peso y echar el cuerpo atrás.", "Bajar los codos por debajo de los hombros sin rotar."],
    };
  }
  if (
    exId === "ohp" ||
    raw.includes("press militar") ||
    raw.includes("press_militar") ||
    raw.includes("press arnold") ||
    raw.includes("push press") ||
    raw.includes("press hombro") ||
    raw.includes("press z") ||
    raw.includes("press bradford") ||
    raw.includes("elevacion frontal") ||
    raw.includes("press pike") ||
    raw.includes("flexiones en pino") ||
    raw.includes("thruster")
  ) {
    return {
      pattern: "ohp",
      variant: raw.includes("mancuerna") || raw.includes("arnold") ? "dumbbell" : "flat",
      targetLabel: "Deltoides Anterior",
      synergists: "Tríceps, Trapecio, Core",
      tempo: "1s empuje vertical · 2s bajada",
      breathing: "Inhala y aprieta abdomen abajo, exhala al bloquear arriba",
      cues: [
        "Aprieta glúteos y abdomen para evitar arquear la zona lumbar.",
        "Empuja la barra en línea recta vertical pasando cerca de la nariz.",
        "Mete ligeramente la cabeza adelante al pasar la barra arriba.",
      ],
      mistakes: ["Hiperextender la espalda baja inclinando el torso atrás.", "Dejar las muñecas muy dobladas hacia atrás."],
    };
  }

  // Arms - Triceps & Biceps
  if (
    exId === "pushdown" ||
    raw.includes("triceps") ||
    raw.includes("tríceps") ||
    raw.includes("press frances") ||
    raw.includes("press francés") ||
    raw.includes("rompecraneos") ||
    raw.includes("extension con cuerda") ||
    raw.includes("extension barra v") ||
    raw.includes("extension tras nuca") ||
    raw.includes("extension katana") ||
    raw.includes("extension cruzada") ||
    raw.includes("extension unilateral")
  ) {
    return {
      pattern: "pushdown",
      targetLabel: "Tríceps (3 Cabezas)",
      synergists: "Ancóneo, Antebrazo",
      tempo: "1s extensión · 2–3s flexión lenta",
      breathing: "Exhala al extender abajo, inhala al subir a 90°+",
      cues: [
        "Fija los codos pegados a los costados sin moverlos adelante/atrás.",
        "Extiende completamente el codo apretando el tríceps abajo.",
        "Deja subir las manos controlando el peso hasta estirar por completo.",
      ],
      mistakes: ["Mover los hombros y balancearse encima de la polea.", "No completar la extensión completa abajo."],
    };
  }
  if (
    exId === "curl" ||
    exId === "hammer" ||
    raw.includes("curl_") ||
    raw.includes("curl ") ||
    raw.includes("muneca") ||
    raw.includes("muñeca") ||
    raw.includes("pronacion") ||
    raw.includes("gripper") ||
    raw.includes("pinza") ||
    raw.includes("rodillo")
  ) {
    return {
      pattern: "curl",
      variant: raw.includes("martillo") ? "dumbbell" : "flat",
      targetLabel: raw.includes("martillo") ? "Braquial · Bíceps · Antebrazo" : "Bíceps Braquial",
      synergists: "Braquiorradial, Flexores",
      tempo: "1s subida · 2–3s bajada completa",
      breathing: "Exhala al flexionar arriba, inhala al extender abajo",
      cues: [
        "Mantén los codos anclados al costado del torso durante toda la serie.",
        "Gira las palmas arriba (o neutras en martillo) y contrae fuerte arriba.",
        "Extiende casi por completo el brazo abajo para trabajar todo el rango.",
      ],
      mistakes: ["Tirar con la espalda baja haciendo péndulo.", "Acortar el recorrido dejando los brazos a mitad abajo."],
    };
  }

  // Back
  if (exId === "pullup" || raw.includes("dominadas") || raw.includes("muscle up") || raw.includes("chin up") || raw.includes("colgarse")) {
    return {
      pattern: "pullup",
      targetLabel: "Dorsal Ancho · Espalda Alta",
      synergists: "Bíceps, Romboides, Core",
      tempo: "1s subida · 2–3s bajada hasta colgar",
      breathing: "Exhala subiendo hacia la barra, inhala bajando",
      cues: [
        "Inicia el tirón deprimiendo escápulas (pecho hacia la barra).",
        "Lleva los codos hacia abajo y atrás hasta superar con la barbilla.",
        "Estira brazos completamente abajo sin dejarte caer de golpe.",
      ],
      mistakes: ["Patear o hacer kipping con las piernas si buscas hipertrofia.", "Quedarte en medias repeticiones sin bajar ni subir del todo."],
    };
  }
  if (exId === "pulldown" || raw.includes("jalon") || raw.includes("jalón") || raw.includes("pullover en polea") || raw.includes("pull down")) {
    return {
      pattern: "pulldown",
      targetLabel: "Dorsal Ancho",
      synergists: "Bíceps, Redondo Mayor",
      tempo: "1s tirón · 1s pecho · 2–3s vuelta",
      breathing: "Exhala al bajar barra al esternón, inhala al subir",
      cues: [
        "Fija bien los muslos bajo el rodillo e inclina el torso ligeramente atrás (~15°).",
        "Tira con los codos hacia las caderas llevando la barra a la clavícula.",
        "Deja que los hombros suban suavemente arriba para estirar el dorsal.",
      ],
      mistakes: ["Llevar la barra detrás de la nuca forzando el cuello.", "Echarte todo hacia atrás usando puro impulso lumbar."],
    };
  }
  if (
    exId === "deadlift" ||
    exId === "rdl" ||
    raw.includes("peso muerto") ||
    raw.includes("peso_muerto") ||
    raw.includes("clean") ||
    raw.includes("snatch") ||
    raw.includes("swing") ||
    raw.includes("atlas") ||
    raw.includes("turkish") ||
    raw.includes("burpees") ||
    raw.includes("man maker")
  ) {
    const isRdl = exId === "rdl" || raw.includes("rumano") || raw.includes("rigidas") || raw.includes("una pierna");
    return {
      pattern: "deadlift",
      variant: isRdl ? "rdl" : "flat",
      targetLabel: isRdl ? "Femoral · Glúteos" : "Cadena Posterior · Lumbar",
      synergists: isRdl ? "Erectores Espinales" : "Cuádriceps, Trapecio, Glúteos",
      tempo: isRdl ? "3s bisagra lenta · 1s subida" : "1s despegue firme · 2s bajada controlada",
      breathing: "Gran toma de aire (bracing) abajo antes de despegar",
      cues: isRdl
        ? [
            "Desbloquea ligeramente rodillas y empuja la cadera atrás.",
            "Mantén la barra pegada a muslos/espinillas todo el recorrido.",
            "Baja hasta mitad de espinilla con espalda recta y sube apretando glúteo.",
          ]
        : [
            "Coloca la barra pegada al medio del pie y tensa dorsales antes de tirar.",
            "Espalda neutra y pecho alto: empuja el suelo con las piernas.",
            "Bloquea arriba llevando la cadera a la barra sin hiperextender atrás.",
          ],
      mistakes: ["Redondear la zona lumbar al despegar o bajar.", "Alejar la barra del cuerpo aumentando la palanca lumbar."],
    };
  }
  if (
    exId === "row" ||
    raw.includes("remo") ||
    raw.includes("encogimientos") ||
    raw.includes("rack pull") ||
    raw.includes("buenos dias") ||
    raw.includes("hiperextension") ||
    raw.includes("superman") ||
    raw.includes("paseo del granjero")
  ) {
    return {
      pattern: "row",
      variant: raw.includes("polea") || raw.includes("sentado") || raw.includes("gironda") ? "cable" : "flat",
      targetLabel: "Espalda Media · Dorsal",
      synergists: "Romboides, Trapecio, Bíceps",
      tempo: "1s tirón · 1s apriete · 2s vuelta",
      breathing: "Exhala al llevar barra al ombligo, inhala al estirar",
      cues: [
        "Inclina el torso firme (~45°) con cadera atrás y espalda neutra.",
        "Lleva la carga hacia la boca del estómago o ombligo (codos cerca).",
        "Aprieta escápulas juntas atrás antes de bajar controlado.",
      ],
      mistakes: ["Subir y bajar el torso en cada rep haciendo 'trampa'.", "Tirar hacia el cuello usando solo trapecio y bíceps."],
    };
  }

  // Legs
  if (exId === "legpress" || raw.includes("prensa")) {
    return {
      pattern: "leg_press",
      targetLabel: "Cuádriceps · Glúteo",
      synergists: "Aductores, Femoral",
      tempo: "2–3s bajada profunda · 1s empuje",
      breathing: "Inhala bajando rodillas al pecho, exhala empujando",
      cues: [
        "Coloca los pies al ancho de hombros y mantén la lumbar pegada al respaldo.",
        "Baja la plataforma todo lo posible sin despegar el glúteo del asiento.",
        "Empuja con todo el pie dejando una microflexión de rodilla arriba.",
      ],
      mistakes: ["Bloquear las rodillas bruscamente al extender del todo.", "Despegar el sacro del asiento abajo redondeando espalda."],
    };
  }
  if (
    raw.includes("hip thrust") ||
    raw.includes("hip_thrust") ||
    raw.includes("puente de gluteo") ||
    raw.includes("puente_de_gluteo") ||
    raw.includes("frog pump")
  ) {
    return {
      pattern: "hip_thrust",
      targetLabel: "Glúteo Mayor",
      synergists: "Femoral, Core",
      tempo: "1s subida · 1s apriete arriba · 2s bajada",
      breathing: "Exhala y aprieta arriba, inhala al bajar cadera",
      cues: [
        "Apoya la parte baja de las escápulas sobre el banco estable.",
        "Mantén barbilla pegada al pecho (mirada al frente) y tibias verticales arriba.",
        "Aprieta el glúteo al máximo logrando línea recta hombro-cadera-rodilla.",
      ],
      mistakes: ["Mirar al techo hiperextendiendo la zona lumbar.", "Separar mucho o acercar demasiado los pies de la cadera."],
    };
  }
  if (
    raw.includes("curl femoral") ||
    raw.includes("curl_femoral") ||
    raw.includes("curl nordico") ||
    raw.includes("glute ham") ||
    raw.includes("extension de cuadriceps") ||
    raw.includes("extension_de_cuadriceps")
  ) {
    const isExt = raw.includes("cuadriceps");
    return {
      pattern: "leg_curl",
      variant: isExt ? "leg_ext" : "flat",
      targetLabel: isExt ? "Cuádriceps" : "Isquiosurales (Femoral)",
      synergists: isExt ? "Recto Femoral" : "Gemelos, Glúteo",
      tempo: "1s contracción · 1s pico · 2–3s vuelta",
      breathing: "Exhala al contraer, inhala al volver lento",
      cues: isExt
        ? [
            "Alinea el eje de la máquina exactamente con tu rodilla.",
            "Sube extendiendo rodillas al 100% manteniendo caderas pegadas al asiento.",
            "Retén la bajada 2–3 segundos sin dejar caer las placas.",
          ]
        : [
            "Fija bien la cadera contra el banco sin despegar los glúteos al tirar.",
            "Lleva los talones hacia el glúteo flexionando fuerte el femoral.",
            "Controla el retorno hasta extender las piernas sin dar tirones.",
          ],
      mistakes: ["Levantar la cadera del asiento para ayudarse con lumbar.", "Soltar la máquina de golpe en la fase negativa."],
    };
  }
  if (exId === "calf" || raw.includes("gemelo") || raw.includes("talones") || raw.includes("burro") || raw.includes("tibial") || raw.includes("comba")) {
    return {
      pattern: "calf_raise",
      targetLabel: "Gemelos (Gastrocnemio · Sóleo)",
      synergists: "Tibial, Pie",
      tempo: "1s subida · 1s pico · 2s estiramiento abajo",
      breathing: "Exhala arriba de puntillas, inhala estirando abajo",
      cues: [
        "Apoya solo el metatarso dejando los talones libres para bajar al máximo.",
        "Pausa 1–2s en estiramiento completo abajo (evita el rebote elástico).",
        "Sube verticalmente hasta la punta máxima del dedo gordo y aprieta.",
      ],
      mistakes: ["Rebotar rápido arriba y abajo sin pausa en el estiramiento.", "Doblar las rodillas para compensar falta de fuerza."],
    };
  }
  if (exId === "lunge" || raw.includes("zancada") || raw.includes("bulgara") || raw.includes("búlgara") || raw.includes("step up") || raw.includes("patada de gluteo") || raw.includes("abduccion") || raw.includes("aduccion") || raw.includes("monster walk") || raw.includes("pull through")) {
    return {
      pattern: "lunge",
      targetLabel: "Cuádriceps · Glúteos",
      synergists: "Estabilizadores de Cadera, Core",
      tempo: "2s descenso controlado · 1s impulso arriba",
      breathing: "Inhala bajando la rodilla atrás, exhala empujando arriba",
      cues: [
        "Da un paso estable al ancho de tus caderas (evita caminar sobre una cuerda floja).",
        "Baja verticalmente flexionando ambas rodillas a ~90° sin golpear el suelo.",
        "Empuja fuerte a través del talón y planta del pie delantero.",
      ],
      mistakes: ["Dejar que la rodilla delantera se meta hacia dentro (valgo).", "Paso demasiado corto cargando excesivamente el tendón rotuliano."],
    };
  }
  if (exId === "squat" || raw.includes("sentadilla") || raw.includes("yoke")) {
    return {
      pattern: "squat",
      variant: raw.includes("goblet") ? "dumbbell" : "flat",
      targetLabel: "Cuádriceps · Glúteos",
      synergists: "Aductores, Core, Erectores",
      tempo: "2–3s bajada · pausa breve · 1s subida",
      breathing: "Inhala y aprieta abdomen arriba, aguanta abajo, exhala al subir",
      cues: [
        "Pies al ancho de hombros, puntas ligeramente hacia fuera (~15–30°).",
        "Desciende abriendo rodillas en línea con las puntas hasta romper el paralelo.",
        "Mantén el pecho orgulloso y la barra centrada sobre la mitad del pie.",
      ],
      mistakes: ["Colapsar las rodillas hacia dentro al empujar.", "Levantar los talones del suelo o doblar el lumbar abajo."],
    };
  }

  // Fallback by muscle group if custom/obscure
  const mus = ex?.muscle ?? "chest";
  if (mus === "back") {
    return {
      pattern: "row",
      targetLabel: "Espalda · Dorsal",
      synergists: "Bíceps, Trapecio",
      tempo: "1s tirón · 2s retorno",
      breathing: "Exhala al tirar, inhala al volver",
      cues: [
        "Mantén espalda neutra y abdomen firme durante todo el movimiento.",
        "Tira con los codos acercando las escápulas atrás.",
        "Controla el estiramiento completo sin soltar de golpe.",
      ],
      mistakes: ["Encorvar la zona lumbar.", "Usar demasiado impulso del torso."],
    };
  }
  if (mus === "shoulders") {
    return {
      pattern: "ohp",
      targetLabel: "Deltoides",
      synergists: "Tríceps, Trapecio",
      tempo: "1s empuje · 2s bajada",
      breathing: "Exhala al elevar, inhala al descender",
      cues: [
        "Aprieta el abdomen para estabilizar la columna.",
        "Controla la carga sin balanceos ni tirones.",
        "Completa el rango sin encoger el cuello hacia las orejas.",
      ],
      mistakes: ["Arquear en exceso la lumbar.", "Balancear el cuerpo con impulso."],
    };
  }
  if (mus === "arms") {
    return {
      pattern: "curl",
      targetLabel: "Brazos",
      synergists: "Antebrazo",
      tempo: "1s subida · 2–3s bajada",
      breathing: "Exhala al contraer, inhala al extender",
      cues: [
        "Mantén los codos fijos cerca del cuerpo.",
        "Evita impulsarte con los hombros o la espalda.",
        "Trabaja el rango completo controlando la fase negativa.",
      ],
      mistakes: ["Balancear los codos arriba.", "Acortar la extensión."],
    };
  }
  if (mus === "legs") {
    return {
      pattern: "squat",
      targetLabel: "Piernas",
      synergists: "Glúteos, Core",
      tempo: "2s bajada · 1s empuje",
      breathing: "Inhala al bajar, exhala al empujar",
      cues: [
        "Pies firmes y estables empujando todo el suelo.",
        "Alinea rodillas con las puntas de los pies sin colapsar.",
        "Mantén el torso firme con profundidad controlada.",
      ],
      mistakes: ["Despegar talones del suelo.", "Perder la estabilidad lumbar."],
    };
  }

  return {
    pattern: "bench_press",
    targetLabel: "Pectoral",
    synergists: "Tríceps, Deltoides Anterior",
    tempo: "2s bajada · 1s subida",
    breathing: "Inhala al bajar, exhala al empujar",
    cues: [
      "Escápulas retraídas y pecho alto durante toda la serie.",
      "Controla el peso en la bajada hasta sentir tensión.",
      "Empuja con trayectoria estable sin bloquear brusco.",
    ],
    mistakes: ["Perder firmeza de hombros.", "Rebotar sin control."],
  };
}

/* ============================================================================
 * 48x48 Crisp Pixel-Art Rep Animator
 * Two-pass articulated athlete sprite (Outline -> Solid Fills -> Target Glow -> Gear)
 * ============================================================================ */

const P_OUT = "#090b12";
const P_SKIN = "#e0a370";
const P_SKIN_SHADE = "#b2703f";
const P_SHIRT = "#38bdf8";
const P_SHIRT_SHADE = "#0284c7";
const P_SHORTS = "#1e293b";
const P_SHOE = "#f1f5f9";
const P_HAIR = "#3f2414";
const P_STEEL = "#cbd5e1";
const P_STEEL_DARK = "#475569";
const P_PLATE = "#ef4444";
const P_PLATE_HI = "#f87171";
const P_BENCH = "#334155";
const P_BENCH_PAD = "#475569";
const P_CABLE = "#ffe14d";

/** Normalized cyclic repetition progress: returns 0 (rest/stretch) -> 1 (peak contraction) -> 0 */
function repCycle(tMs: number, speed = 1): { p: number; phase: "CON" | "HOLD" | "EXC" } {
  const period = 2600 / Math.max(0.25, speed);
  const f = (tMs % period) / period; // 0..1
  if (f < 0.36) {
    // Concentric drive: 0 -> 1 smoothly
    const u = f / 0.36;
    return { p: 0.5 - 0.5 * Math.cos(u * Math.PI), phase: "CON" };
  }
  if (f < 0.52) {
    // Peak contraction hold: 1
    return { p: 1, phase: "HOLD" };
  }
  if (f < 0.90) {
    // Controlled eccentric lowering: 1 -> 0
    const u = (f - 0.52) / 0.38;
    return { p: 0.5 + 0.5 * Math.cos(u * Math.PI), phase: "EXC" };
  }
  return { p: 0, phase: "HOLD" };
}

type RectFn = (x: number, y: number, w: number, h: number, col: string) => void;
type SegFn = (x1: number, y1: number, x2: number, y2: number, thick: number, col: string) => void;

export function drawExerciseFrame(
  ctx: CanvasRenderingContext2D,
  guide: ExerciseGuide,
  timeMs: number,
  options?: { speed?: number; showMuscleGlow?: boolean }
) {
  const speed = options?.speed ?? 1;
  const showGlow = options?.showMuscleGlow ?? true;

  const r: RectFn = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };

  // Crisp stepped pixel line segment with rounded pixel endcaps
  const seg: SegFn = (x1, y1, x2, y2, thick, col) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 1.4));
    const half = (thick - 1) / 2;
    ctx.fillStyle = col;
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(x1 + (dx * i) / steps - half);
      const py = Math.round(y1 + (dy * i) / steps - half);
      ctx.fillRect(px, py, Math.max(1, Math.round(thick)), Math.max(1, Math.round(thick)));
    }
  };

  // Background arcade blueprint grid
  r(0, 0, ANW, ANH, "#0c0f1b");
  ctx.fillStyle = "#141a2e";
  for (let gx = 0; gx < ANW; gx += 8) ctx.fillRect(gx, 0, 1, ANH);
  for (let gy = 0; gy < ANH; gy += 8) ctx.fillRect(0, gy, ANW, 1);
  // Floor baseline
  r(0, 41, ANW, 7, "#131726");
  r(0, 41, ANW, 1, "#2a3352");

  const { p, phase } = repCycle(timeMs, speed);
  const pulse = showGlow && p > 0.65;
  const CHEST_COL = pulse && (guide.pattern === "bench_press" || guide.pattern === "chest_fly" || guide.pattern === "pushup" || guide.pattern === "dips")
    ? "#fb7185"
    : P_SHIRT;
  const BACK_COL = pulse && (guide.pattern === "pullup" || guide.pattern === "pulldown" || guide.pattern === "row" || guide.pattern === "deadlift")
    ? "#fb923c"
    : P_SHIRT;
  const DELT_COL = pulse && (guide.pattern === "ohp" || guide.pattern === "lateral_raise" || guide.pattern === "facepull")
    ? "#facc15"
    : P_SKIN;
  const ARM_COL = pulse && (guide.pattern === "curl" || guide.pattern === "pushdown")
    ? "#facc15"
    : P_SKIN;
  const LEG_COL = pulse && (guide.pattern === "squat" || guide.pattern === "leg_press" || guide.pattern === "lunge" || guide.pattern === "hip_thrust" || guide.pattern === "leg_curl" || guide.pattern === "calf_raise")
    ? "#fb7185"
    : P_SHORTS;

  // Helper to draw directional pixel chevron indicator
  const arrow = (x: number, y: number, dir: "up" | "down" | "left" | "right", activeCol: string) => {
    ctx.fillStyle = activeCol;
    if (dir === "up") {
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x - 1, y + 1, 3, 1);
    } else if (dir === "down") {
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y + 1, 1, 1);
    } else if (dir === "left") {
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x + 1, y - 1, 1, 3);
    } else {
      ctx.fillRect(x, y - 1, 1, 3);
      ctx.fillRect(x + 1, y, 1, 1);
    }
  };

  switch (guide.pattern) {
    /* 1. BENCH PRESS (Flat / Incline / Dumbbell) */
    case "bench_press": {
      const incline = guide.variant === "incline";
      const pressY = 23 - p * 11; // bar travels y=23 (chest) -> y=12 (lockout)
      // Bench frame behind athlete
      if (incline) {
        r(14, 34, 2, 7, P_BENCH);
        r(30, 32, 2, 9, P_BENCH);
        seg(12, 34, 24, 24, 3, P_BENCH_PAD); // angled backrest
        r(24, 33, 10, 3, P_BENCH_PAD); // seat
      } else {
        r(12, 33, 2, 8, P_BENCH);
        r(32, 33, 2, 8, P_BENCH);
        r(10, 30, 26, 3, P_BENCH_PAD);
      }

      // Two-pass athlete on bench
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        if (incline) {
          // Reclined chest torso + thighs + shins + head + pressing arms
          seg(16, 28, 25, 33, 5 + e, o ? P_OUT : CHEST_COL);
          seg(25, 33, 33, 33, 4 + e, o ? P_OUT : P_SHORTS);
          seg(33, 33, 35, 40, 3 + e, o ? P_OUT : P_SKIN);
          r(33 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
          r(11 - e / 2, 21 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
          if (!o) r(11, 21, 5, 2, P_HAIR);
          const shX = 18, shY = 27;
          const elX = shX - 2 + p * 2, elY = shY + 2 - p * 7;
          const handX = 19, handY = pressY - 2;
          seg(shX, shY, elX, elY, 2.6 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, handX, handY, 2.4 + e, o ? P_OUT : P_SKIN);
        } else {
          // Flat bench: head on left, chest up, knees bent to floor on right
          r(9 - e / 2, 26 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
          if (!o) r(9, 26, 3, 5, P_HAIR);
          seg(15, 28, 26, 28, 5 + e, o ? P_OUT : CHEST_COL);
          seg(26, 29, 34, 29, 4 + e, o ? P_OUT : P_SHORTS);
          seg(34, 29, 36, 39, 3 + e, o ? P_OUT : P_SKIN);
          r(35 - e / 2, 38 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
          const shX = 18, shY = 27;
          const elX = 16 + p * 2, elY = 30 - p * 11;
          const handX = 18, handY = pressY;
          seg(shX, shY, elX, elY, 2.6 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, handX, handY, 2.4 + e, o ? P_OUT : P_SKIN);
        }
      }

      // Barbell / Plate endcap facing side view
      const barX = incline ? 19 : 18;
      const barY = incline ? pressY - 2 : pressY;
      r(barX - 4, barY - 4, 8, 8, P_OUT);
      r(barX - 3, barY - 3, 6, 6, P_PLATE);
      r(barX - 2, barY - 2, 4, 2, P_PLATE_HI);
      r(barX - 1, barY - 1, 2, 2, P_STEEL);
      arrow(6, 15, phase === "EXC" ? "down" : "up", phase === "CON" ? "#ffe14d" : "#3df2ff");
      break;
    }

    /* 2. CHEST FLY / PEC DECK (Front view opening arms) */
    case "chest_fly": {
      const open = 1 - p; // 1 = wide open stretch, 0 = squeezed center
      const handOffset = 2 + open * 12;
      r(19, 38, 10, 3, P_BENCH); // bench pad below
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Seated torso front view
        r(21 - e / 2, 7 - e / 2, 6 + e, 6 + e, o ? P_OUT : P_SKIN);
        if (!o) {
          r(21, 7, 6, 2, P_HAIR);
          r(22, 10, 1, 1, P_OUT); r(25, 10, 1, 1, P_OUT);
        }
        r(19 - e / 2, 14 - e / 2, 10 + e, 15 + e, o ? P_OUT : CHEST_COL);
        r(20 - e / 2, 29 - e / 2, 8 + e, 7 + e, o ? P_OUT : P_SHORTS);
        r(20 - e / 2, 36 - e / 2, 3 + e, 5 + e, o ? P_OUT : P_SKIN);
        r(25 - e / 2, 36 - e / 2, 3 + e, 5 + e, o ? P_OUT : P_SKIN);
        // Arcing left & right arms
        for (const s of [-1, 1]) {
          const shX = 24 + s * 5;
          const shY = 16;
          const elX = 24 + s * (6 + open * 7);
          const elY = 18 + open * 3;
          const hx = 24 + s * handOffset;
          const hy = 17 + open * 1;
          seg(shX, shY, elX, elY, 2.5 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, hx, hy, 2.5 + e, o ? P_OUT : P_SKIN);
        }
      }
      // Dumbbells in both hands
      for (const s of [-1, 1]) {
        const hx = Math.round(24 + s * handOffset);
        const hy = Math.round(17 + open);
        r(hx - 2, hy - 3, 4, 6, P_OUT);
        r(hx - 1, hy - 2, 2, 4, P_PLATE);
        r(hx - 1, hy, 2, 1, P_STEEL);
      }
      arrow(10, 11, p > 0.5 ? "right" : "left", "#3df2ff");
      arrow(36, 11, p > 0.5 ? "left" : "right", "#3df2ff");
      break;
    }

    /* 3. PUSHUP (Side plank over gym mat) */
    case "pushup": {
      const drop = (1 - p) * 7; // p=1 top, p=0 bottom chest near floor
      const shY = 23 + drop;
      const hipY = 28 + drop * 0.45;
      r(6, 40, 36, 1, "#334155"); // mat
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Straight plank leg -> hip -> torso -> head
        seg(8, 39, 20, hipY, 3 + e, o ? P_OUT : P_SHORTS);
        seg(20, hipY, 32, shY, 5 + e, o ? P_OUT : CHEST_COL);
        r(33 - e / 2, shY - 5 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(34, shY - 5, 4, 2, P_HAIR);
        r(7 - e / 2, 38 - e / 2, 3 + e, 2 + e, o ? P_OUT : P_SHOE);
        // Arm bending down to hand planted at (32, 39)
        const elX = 32 - (1 - p) * 5;
        const elY = (shY + 39) / 2;
        seg(32, shY + 1, elX, elY, 2.5 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, 32, 39, 2.5 + e, o ? P_OUT : P_SKIN);
      }
      arrow(41, 24, phase === "EXC" ? "down" : "up", "#ffe14d");
      break;
    }

    /* 4. DIPS (Parallel rails, vertical bend & press) */
    case "dips": {
      const dipDrop = (1 - p) * 8;
      // Back dip stanchion
      r(14, 22, 2, 19, P_BENCH);
      r(32, 22, 2, 19, P_BENCH);
      r(12, 22, 24, 2, P_STEEL_DARK);

      const torsoTopY = 12 + dipDrop;
      const hipY = 24 + dipDrop;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Head, slight forward lean torso, bent knees suspended
        r(21 - e / 2, torsoTopY - 6 - e / 2, 6 + e, 6 + e, o ? P_OUT : P_SKIN);
        if (!o) {
          r(21, torsoTopY - 6, 6, 2, P_HAIR);
          r(22, torsoTopY - 3, 1, 1, P_OUT); r(25, torsoTopY - 3, 1, 1, P_OUT);
        }
        r(19 - e / 2, torsoTopY - e / 2, 10 + e, 12 + e, o ? P_OUT : CHEST_COL);
        r(20 - e / 2, hipY - e / 2, 8 + e, 7 + e, o ? P_OUT : P_SHORTS);
        // Legs bent slightly behind
        seg(22, hipY + 6, 20, hipY + 11, 3 + e, o ? P_OUT : P_SKIN);
        seg(26, hipY + 6, 24, hipY + 11, 3 + e, o ? P_OUT : P_SKIN);
        // Arms gripping rails at y=22, x=15 & 33
        for (const s of [-1, 1]) {
          const shX = 24 + s * 5;
          const shY = torsoTopY + 2;
          const elX = 24 + s * (8 + (1 - p) * 3);
          const elY = shY + 4 - (1 - p) * 2;
          seg(shX, shY, elX, elY, 2.5 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, 24 + s * 9, 22, 2.5 + e, o ? P_OUT : P_SKIN);
        }
      }
      arrow(7, 16, phase === "EXC" ? "down" : "up", "#ffe14d");
      break;
    }

    /* 5. OVERHEAD PRESS / MILITARY PRESS (Front view pressing barbell overhead) */
    case "ohp": {
      const barY = 16 - p * 10; // chest/clavicle y=16 -> overhead y=6
      const isDb = guide.variant === "dumbbell";
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(21 - e / 2, 9 - e / 2, 6 + e, 6 + e, o ? P_OUT : P_SKIN);
        if (!o) {
          r(21, 9, 6, 2, P_HAIR);
          r(22, 12, 1, 1, P_OUT); r(25, 12, 1, 1, P_OUT);
        }
        r(19 - e / 2, 16 - e / 2, 10 + e, 12 + e, o ? P_OUT : P_SHIRT);
        r(20 - e / 2, 28 - e / 2, 8 + e, 6 + e, o ? P_OUT : P_SHORTS);
        r(20 - e / 2, 34 - e / 2, 3 + e, 6 + e, o ? P_OUT : P_SKIN);
        r(25 - e / 2, 34 - e / 2, 3 + e, 6 + e, o ? P_OUT : P_SKIN);
        r(19 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        r(25 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        // Delts highlight + pressing arms
        for (const s of [-1, 1]) {
          const shX = 24 + s * 6;
          const shY = 17;
          const elX = 24 + s * (8 + (1 - p) * 2);
          const elY = barY + 4 + (1 - p) * 3;
          const handX = 24 + s * 7;
          r(shX - 1 - e / 2, shY - 1 - e / 2, 3 + e, 3 + e, o ? P_OUT : DELT_COL);
          seg(shX, shY, elX, elY, 2.5 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, handX, barY, 2.4 + e, o ? P_OUT : P_SKIN);
        }
      }
      if (isDb) {
        for (const s of [-1, 1]) {
          const hx = 24 + s * 7;
          r(hx - 3, Math.round(barY) - 2, 6, 4, P_OUT);
          r(hx - 2, Math.round(barY) - 1, 4, 2, P_PLATE);
        }
      } else {
        r(9, Math.round(barY), 30, 2, P_STEEL);
        r(7, Math.round(barY) - 3, 3, 8, P_OUT);
        r(8, Math.round(barY) - 2, 2, 6, P_PLATE);
        r(38, Math.round(barY) - 3, 3, 8, P_OUT);
        r(38, Math.round(barY) - 2, 2, 6, P_PLATE);
      }
      arrow(43, 10, phase === "EXC" ? "down" : "up", "#3df2ff");
      break;
    }

    /* 6. LATERAL RAISE (Front view wings abducting outward to shoulder height) */
    case "lateral_raise": {
      const ang = (1 - p) * 1.25; // p=1 -> horizontal arms out; p=0 -> hanging near sides
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(21 - e / 2, 7 - e / 2, 6 + e, 6 + e, o ? P_OUT : P_SKIN);
        if (!o) {
          r(21, 7, 6, 2, P_HAIR);
          r(22, 10, 1, 1, P_OUT); r(25, 10, 1, 1, P_OUT);
        }
        r(19 - e / 2, 14 - e / 2, 10 + e, 13 + e, o ? P_OUT : P_SHIRT);
        r(20 - e / 2, 27 - e / 2, 8 + e, 7 + e, o ? P_OUT : P_SHORTS);
        r(20 - e / 2, 34 - e / 2, 3 + e, 6 + e, o ? P_OUT : P_SKIN);
        r(25 - e / 2, 34 - e / 2, 3 + e, 6 + e, o ? P_OUT : P_SKIN);
        r(19 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        r(25 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        for (const s of [-1, 1]) {
          const shX = 24 + s * 5;
          const shY = 16;
          const hx = shX + s * Math.cos(ang) * 12;
          const hy = shY + Math.sin(ang) * 12;
          r(shX - 1 - e / 2, shY - 1 - e / 2, 3 + e, 3 + e, o ? P_OUT : DELT_COL);
          seg(shX, shY, hx, hy, 2.5 + e, o ? P_OUT : P_SKIN);
        }
      }
      for (const s of [-1, 1]) {
        const hx = Math.round(24 + s * 5 + s * Math.cos(ang) * 12);
        const hy = Math.round(16 + Math.sin(ang) * 12);
        r(hx - 2, hy - 2, 4, 4, P_OUT);
        r(hx - 1, hy - 1, 2, 2, P_PLATE);
      }
      arrow(7, 13, phase === "EXC" ? "down" : "up", "#ffe14d");
      arrow(40, 13, phase === "EXC" ? "down" : "up", "#ffe14d");
      break;
    }

    /* 7. FACEPULL / REAR DELT (High pulley on left, athlete pulling rope to forehead) */
    case "facepull": {
      const pullX = 22 + p * 6; // hand travels from pulley x=22 -> face x=28
      // Left pulley tower
      r(5, 6, 3, 35, P_STEEL_DARK);
      r(4, 9, 6, 2, P_BENCH);
      r(4, 24 - p * 4, 5, 10, P_BENCH_PAD); // weight stack moving

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Staggered athletic stance on right facing left
        r(28 - e / 2, 8 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(29, 8, 4, 2, P_HAIR);
        seg(30, 14, 31, 26, 5 + e, o ? P_OUT : P_SHIRT);
        seg(30, 26, 26, 39, 3 + e, o ? P_OUT : P_SHORTS);
        seg(32, 26, 36, 39, 3 + e, o ? P_OUT : P_SHORTS);
        r(24 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        r(34 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        const shX = 30, shY = 16;
        const elX = pullX + 1, elY = 14 - p * 2;
        r(shX - 1 - e / 2, shY - 1 - e / 2, 3 + e, 3 + e, o ? P_OUT : DELT_COL);
        seg(shX, shY, elX, elY, 2.5 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, pullX, 11, 2.3 + e, o ? P_OUT : P_SKIN);
      }
      // Cable line from pulley (9,10) to hand (pullX, 11)
      seg(9, 10, pullX, 11, 1, P_CABLE);
      r(Math.round(pullX) - 1, 9, 2, 4, P_OUT);
      r(Math.round(pullX) - 1, 10, 2, 2, P_PLATE);
      arrow(18, 6, phase === "EXC" ? "left" : "right", "#3df2ff");
      break;
    }

    /* 8. PULLUP (Overhead bar, hanging -> chin over bar) */
    case "pullup": {
      const pullY = p * 9; // body lifts 9px up!
      // Pullup rig uprights + top bar
      r(8, 7, 2, 34, P_STEEL_DARK);
      r(38, 7, 2, 34, P_STEEL_DARK);
      r(8, 7, 32, 2, P_STEEL);

      const torsoY = 20 - pullY;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(21 - e / 2, torsoY - 6 - e / 2, 6 + e, 6 + e, o ? P_OUT : P_SKIN);
        if (!o) {
          r(21, torsoY - 6, 6, 2, P_HAIR);
          r(22, torsoY - 3, 1, 1, P_OUT); r(25, torsoY - 3, 1, 1, P_OUT);
        }
        r(19 - e / 2, torsoY - e / 2, 10 + e, 11 + e, o ? P_OUT : BACK_COL);
        r(20 - e / 2, torsoY + 11 - e / 2, 8 + e, 6 + e, o ? P_OUT : P_SHORTS);
        // Legs slightly crossed behind at bottom
        seg(22, torsoY + 17, 21, torsoY + 23, 3 + e, o ? P_OUT : P_SKIN);
        seg(26, torsoY + 17, 25, torsoY + 23, 3 + e, o ? P_OUT : P_SKIN);
        // Arms fixed hands at (16, 8) and (32, 8), elbows pull down & out
        for (const s of [-1, 1]) {
          const shX = 24 + s * 5;
          const shY = torsoY + 1;
          const elX = 24 + s * (7 + p * 3);
          const elY = (shY + 8) / 2 + p * 3;
          seg(shX, shY, elX, elY, 2.5 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, 24 + s * 8, 8, 2.5 + e, o ? P_OUT : P_SKIN);
        }
      }
      arrow(42, 16, phase === "EXC" ? "down" : "up", "#ffe14d");
      break;
    }

    /* 9. LAT PULLDOWN (Seated cable machine) */
    case "pulldown": {
      const barY = 10 + p * 10; // overhead y=10 -> upper chest y=20
      // Machine frame behind seated athlete
      r(23, 4, 3, 37, P_STEEL_DARK);
      r(21, 29, 7, 3, P_BENCH_PAD); // seat
      r(19, 4, 10, 2, P_STEEL_DARK); // overhead boom
      seg(24, 6, 24, barY, 1, P_CABLE);

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(21 - e / 2, 15 - e / 2, 6 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(21, 15, 6, 2, P_HAIR);
        r(19 - e / 2, 20 - e / 2, 10 + e, 10 + e, o ? P_OUT : BACK_COL);
        r(19 - e / 2, 29 - e / 2, 10 + e, 5 + e, o ? P_OUT : P_SHORTS);
        r(18 - e / 2, 33 - e / 2, 3 + e, 7 + e, o ? P_OUT : P_SKIN);
        r(27 - e / 2, 33 - e / 2, 3 + e, 7 + e, o ? P_OUT : P_SKIN);
        for (const s of [-1, 1]) {
          const shX = 24 + s * 5;
          const shY = 21;
          const elX = 24 + s * (7 + p * 2);
          const elY = barY + 2 + p * 6;
          seg(shX, shY, elX, elY, 2.4 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, 24 + s * 8, barY, 2.4 + e, o ? P_OUT : P_SKIN);
        }
      }
      // Lat bar held by hands
      r(12, Math.round(barY), 24, 2, P_STEEL);
      arrow(8, 14, phase === "CON" ? "down" : "up", "#3df2ff");
      break;
    }

    /* 10. BENT-OVER ROW (Side view hinged torso rowing barbell to hip) */
    case "row": {
      const pullY = 31 - p * 8; // bar travels from knee height y=31 -> waist y=23
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Side view facing right: feet grounded at x=16..20, hips back at (15,24), shoulders forward at (28,18)
        seg(17, 25, 19, 39, 3.5 + e, o ? P_OUT : P_SHORTS);
        r(18 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        seg(16, 25, 29, 17, 5 + e, o ? P_OUT : BACK_COL);
        r(29 - e / 2, 13 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(29, 13, 4, 2, P_HAIR);
        // Arm pulls elbow upward & back behind torso!
        const shX = 27, shY = 19;
        const elX = 25 - p * 5;
        const elY = 24 - p * 8;
        const handX = 25 - p * 2;
        seg(shX, shY, elX, elY, 2.6 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, handX, pullY, 2.4 + e, o ? P_OUT : P_SKIN);
      }
      // Plate facing side
      const bx = 25 - p * 2;
      r(bx - 4, pullY - 4, 8, 8, P_OUT);
      r(bx - 3, pullY - 3, 6, 6, P_PLATE);
      r(bx - 1, pullY - 1, 2, 2, P_STEEL);
      arrow(37, 22, phase === "EXC" ? "down" : "up", "#ffe14d");
      break;
    }

    /* 11. DEADLIFT / RDL (Side view hip-hinge to lockout) */
    case "deadlift": {
      const isRdl = guide.variant === "rdl";
      // p=0 bottom (hinged), p=1 standing tall lockout!
      // Notice for RDL start height is slightly higher & knees straighter
      const hipX = 20 - (1 - p) * 5;
      const hipY = 23 + (1 - p) * (isRdl ? 2 : 5);
      const shX = 22 + (1 - p) * 7;
      const shY = 12 + (1 - p) * (isRdl ? 9 : 11);
      const kneeX = 21 + (1 - p) * (isRdl ? 1 : 3);
      const barY = isRdl ? 31 - p * 6 : 36 - p * 11;
      const barX = shX - (1 - p) * 1;

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Foot fixed at x=21..24, y=39
        seg(22, 39, kneeX, 32, 3 + e, o ? P_OUT : P_SKIN);
        seg(kneeX, 32, hipX, hipY, 4 + e, o ? P_OUT : P_SHORTS);
        r(20 - e / 2, 39 - e / 2, 5 + e, 2 + e, o ? P_OUT : P_SHOE);
        seg(hipX, hipY, shX, shY, 5 + e, o ? P_OUT : BACK_COL);
        r(shX - 2 - e / 2, shY - 5 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(shX - 2, shY - 5, 4, 2, P_HAIR);
        // Straight arm holding bar directly under shoulder
        seg(shX, shY + 2, barX, barY, 2.5 + e, o ? P_OUT : P_SKIN);
      }
      // Large Olympic 20kg bumper plate
      r(barX - 5, barY - 5, 10, 10, P_OUT);
      r(barX - 4, barY - 4, 8, 8, P_PLATE);
      r(barX - 3, barY - 3, 6, 2, P_PLATE_HI);
      r(barX - 1, barY - 1, 2, 2, P_STEEL);
      arrow(38, 20, phase === "EXC" ? "down" : "up", "#ffe14d");
      break;
    }

    /* 12. TRICEPS PUSHDOWN (High cable left, side athlete locking forearms downward) */
    case "pushdown": {
      const ang = p * 1.35; // 0 = 90deg up, 1.35 = extended down!
      r(6, 6, 3, 35, P_STEEL_DARK);
      r(5, 8, 8, 2, P_BENCH);
      r(5, 22 - p * 4, 5, 10, P_BENCH_PAD);

      const elX = 24, elY = 21;
      const hx = elX - 7 + p * 4;
      const hy = elY - 4 + Math.sin(ang) * 9;

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(24 - e / 2, 8 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(25, 8, 4, 2, P_HAIR);
        seg(26, 14, 27, 26, 5 + e, o ? P_OUT : P_SHIRT);
        seg(27, 26, 26, 39, 3.5 + e, o ? P_OUT : P_SHORTS);
        r(24 - e / 2, 39 - e / 2, 5 + e, 2 + e, o ? P_OUT : P_SHOE);
        // Upper arm pinned straight down to (24,21), forearm hinges to handle!
        seg(25, 15, elX, elY, 2.6 + e, o ? P_OUT : ARM_COL);
        seg(elX, elY, hx, hy, 2.4 + e, o ? P_OUT : ARM_COL);
      }
      seg(12, 10, hx, hy, 1, P_CABLE);
      r(Math.round(hx) - 1, Math.round(hy) - 1, 3, 2, P_STEEL);
      arrow(15, 23, phase === "EXC" ? "up" : "down", "#3df2ff");
      break;
    }

    /* 13. BICEPS / HAMMER CURL (Front/3Q view curling dumbbell up) */
    case "curl": {
      const curlY = 27 - p * 11; // hand bottom y=27 -> shoulder top y=16
      const curlX = 16 + p * 2;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(21 - e / 2, 7 - e / 2, 6 + e, 6 + e, o ? P_OUT : P_SKIN);
        if (!o) {
          r(21, 7, 6, 2, P_HAIR);
          r(22, 10, 1, 1, P_OUT); r(25, 10, 1, 1, P_OUT);
        }
        r(19 - e / 2, 14 - e / 2, 10 + e, 13 + e, o ? P_OUT : P_SHIRT);
        r(20 - e / 2, 27 - e / 2, 8 + e, 7 + e, o ? P_OUT : P_SHORTS);
        r(20 - e / 2, 34 - e / 2, 3 + e, 6 + e, o ? P_OUT : P_SKIN);
        r(25 - e / 2, 34 - e / 2, 3 + e, 6 + e, o ? P_OUT : P_SKIN);
        r(19 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        r(25 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        for (const s of [-1, 1]) {
          const shX = 24 + s * 5;
          const elX = 24 + s * 7;
          const elY = 22;
          const hx = 24 + s * (8 - p * 2);
          seg(shX, 16, elX, elY, 2.7 + e, o ? P_OUT : ARM_COL);
          seg(elX, elY, hx, curlY, 2.5 + e, o ? P_OUT : ARM_COL);
        }
      }
      for (const s of [-1, 1]) {
        const hx = Math.round(24 + s * (8 - p * 2));
        r(hx - 2, Math.round(curlY) - 2, 4, 4, P_OUT);
        r(hx - 1, Math.round(curlY) - 1, 2, 2, P_PLATE);
      }
      arrow(7, 20, phase === "EXC" ? "down" : "up", "#ffe14d");
      void curlX;
      break;
    }

    /* 14. SQUAT (Side view barbell back/goblet squat) */
    case "squat": {
      // p=0 bottom parallel hole, p=1 upright standing lockout!
      const drop = (1 - p) * 10;
      const hipX = 22 - (1 - p) * 6;
      const hipY = 23 + drop;
      const kneeX = 23 + (1 - p) * 4;
      const kneeY = 32 + drop * 0.25;
      const shX = 23 + (1 - p) * 2;
      const shY = 12 + drop * 0.9;

      // Squat rack safety upright behind
      r(11, 8, 2, 33, P_STEEL_DARK);
      r(9, 28, 6, 1, P_BENCH);

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(22, 39, kneeX, kneeY, 3 + e, o ? P_OUT : P_SKIN);
        seg(kneeX, kneeY, hipX, hipY, 4 + e, o ? P_OUT : LEG_COL);
        r(20 - e / 2, 39 - e / 2, 5 + e, 2 + e, o ? P_OUT : P_SHOE);
        seg(hipX, hipY, shX, shY, 5 + e, o ? P_OUT : P_SHIRT);
        r(shX - 2 - e / 2, shY - 5 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(shX - 2, shY - 5, 4, 2, P_HAIR);
        // Arms holding bar across upper back
        seg(shX, shY + 2, shX - 2, shY, 2.5 + e, o ? P_OUT : P_SKIN);
      }
      // Olympic plate right at rear upper trap
      const bx = shX - 1;
      const by = shY;
      r(bx - 4, by - 4, 8, 8, P_OUT);
      r(bx - 3, by - 3, 6, 6, P_PLATE);
      r(bx - 1, by - 1, 2, 2, P_STEEL);
      arrow(38, 20, phase === "EXC" ? "down" : "up", "#3df2ff");
      break;
    }

    /* 15. LEG PRESS 45° (Angled sled pushing knees out & up) */
    case "leg_press": {
      // Seat & backrest on bottom-left, 45° rails going up-right
      seg(8, 26, 16, 35, 3, P_BENCH_PAD);
      seg(14, 35, 22, 36, 3, P_BENCH_PAD);
      seg(18, 36, 40, 14, 2, P_STEEL_DARK); // 45 deg rail!

      const push = p * 7;
      const footX = 27 + push;
      const footY = 23 - push;
      const kneeX = 20 + push * 0.45;
      const kneeY = 27 - push * 0.25;

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(9 - e / 2, 21 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(9, 21, 4, 2, P_HAIR);
        seg(11, 27, 17, 34, 4.5 + e, o ? P_OUT : P_SHIRT);
        seg(17, 34, kneeX, kneeY, 4 + e, o ? P_OUT : LEG_COL);
        seg(kneeX, kneeY, footX, footY, 3 + e, o ? P_OUT : P_SKIN);
      }
      // Heavy sled plate carriage pressed by feet!
      seg(footX + 2, footY - 4, footX - 2, footY + 5, 3, P_STEEL);
      r(Math.round(footX) + 1, Math.round(footY) - 6, 6, 6, P_OUT);
      r(Math.round(footX) + 2, Math.round(footY) - 5, 4, 4, P_PLATE);
      arrow(37, 11, phase === "CON" ? "up" : "down", "#ffe14d");
      break;
    }

    /* 16. LUNGE (Split-stance descending vertically) */
    case "lunge": {
      const drop = (1 - p) * 8;
      const hipY = 22 + drop;
      const hipX = 23;
      const frontKneeX = 31 + (1 - p) * 2;
      const frontKneeY = 31 + drop * 0.2;
      const backKneeX = 16;
      const backKneeY = 30 + drop * 0.9;

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Back leg + shoe
        seg(hipX, hipY, backKneeX, backKneeY, 3 + e, o ? P_OUT : LEG_COL);
        seg(backKneeX, backKneeY, 12, 39, 3 + e, o ? P_OUT : P_SKIN);
        r(10 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        // Front leg + shoe
        seg(hipX, hipY, frontKneeX, frontKneeY, 3.5 + e, o ? P_OUT : LEG_COL);
        seg(frontKneeX, frontKneeY, 32, 39, 3 + e, o ? P_OUT : P_SKIN);
        r(31 - e / 2, 39 - e / 2, 5 + e, 2 + e, o ? P_OUT : P_SHOE);
        // Upright torso & head holding dumbbells down
        seg(hipX, hipY, 24, 12 + drop, 5 + e, o ? P_OUT : P_SHIRT);
        r(22 - e / 2, 6 + drop - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(22, 6 + drop, 4, 2, P_HAIR);
        seg(24, 14 + drop, 23, 25 + drop, 2.5 + e, o ? P_OUT : P_SKIN);
      }
      r(21, Math.round(24 + drop), 4, 4, P_OUT);
      r(22, Math.round(25 + drop), 2, 2, P_PLATE);
      arrow(7, 20, phase === "EXC" ? "down" : "up", "#3df2ff");
      break;
    }

    /* 17. HIP THRUST (Upper back on bench, driving barbell hip bridge up) */
    case "hip_thrust": {
      const thrustY = 35 - p * 9; // hips go from floor y=35 up to straight bridge y=26!
      // Bench supporting upper back on left
      r(8, 28, 10, 13, P_BENCH);
      r(7, 27, 12, 3, P_BENCH_PAD);

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Upper back pivoted on bench edge (18, 27), head slightly tucked forward
        r(11 - e / 2, 20 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(11, 20, 4, 2, P_HAIR);
        seg(17, 26, 26, thrustY, 5 + e, o ? P_OUT : P_SHIRT);
        // Thighs to knee at (33, 27), vertical shins down to floor
        seg(26, thrustY, 34, 27, 4 + e, o ? P_OUT : LEG_COL);
        seg(34, 27, 35, 39, 3 + e, o ? P_OUT : P_SKIN);
        r(34 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        seg(19, 26, 25, thrustY - 1, 2.2 + e, o ? P_OUT : P_SKIN);
      }
      // Barbell resting cleanly on hip crease (26, thrustY)
      r(22, Math.round(thrustY) - 4, 8, 8, P_OUT);
      r(23, Math.round(thrustY) - 3, 6, 6, P_PLATE);
      r(25, Math.round(thrustY) - 1, 2, 2, P_STEEL);
      arrow(26, 14, phase === "EXC" ? "down" : "up", "#fb7185");
      break;
    }

    /* 18. LEG CURL / LEG EXTENSION (Machine bench pad) */
    case "leg_curl": {
      const isExt = guide.variant === "leg_ext";
      if (isExt) {
        // Seated leg extension!
        r(13, 22, 4, 19, P_BENCH);
        r(15, 29, 13, 3, P_BENCH_PAD);
        const legAng = p * 1.2; // 0 hanging straight down -> 1.2 horizontal!
        const footX = 27 + Math.sin(legAng) * 11;
        const footY = 30 + Math.cos(legAng) * 11;
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          r(15 - e / 2, 12 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
          if (!o) r(15, 12, 4, 2, P_HAIR);
          seg(17, 18, 18, 29, 4.5 + e, o ? P_OUT : P_SHIRT);
          seg(18, 29, 27, 29, 4 + e, o ? P_OUT : LEG_COL);
          seg(27, 29, footX, footY, 3 + e, o ? P_OUT : P_SKIN);
        }
        r(Math.round(footX) - 2, Math.round(footY) - 2, 4, 4, P_PLATE);
        arrow(39, 28, phase === "EXC" ? "down" : "up", "#3df2ff");
      } else {
        // Lying prone leg curl!
        r(14, 29, 22, 3, P_BENCH_PAD);
        r(16, 32, 3, 9, P_BENCH);
        r(30, 32, 3, 9, P_BENCH);
        const ang = p * 1.45; // foot curls cleanly up from straight (0 rad) toward glutes (1.45 rad)
        const footX = 16 - Math.cos(ang) * 9;
        const footY = 28 - Math.sin(ang) * 9;
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          r(34 - e / 2, 23 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
          if (!o) r(35, 23, 4, 2, P_HAIR);
          seg(33, 27, 25, 28, 4.5 + e, o ? P_OUT : P_SHIRT);
          seg(25, 28, 16, 28, 4 + e, o ? P_OUT : LEG_COL);
          seg(16, 28, footX, footY, 3 + e, o ? P_OUT : P_SKIN);
        }
        r(Math.round(footX) - 2, Math.round(footY) - 2, 4, 4, P_PLATE);
        arrow(10, 15, phase === "EXC" ? "down" : "up", "#fb7185");
      }
      break;
    }

    /* 19. CALF RAISE (Standing on edge of step block) */
    case "calf_raise": {
      const lift = p * 5; // heel rises up on tiptoes!
      // Stepper block at bottom
      r(19, 37, 10, 4, P_BENCH);
      r(19, 37, 10, 1, P_STEEL_DARK);

      const bodyY = -lift;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        r(21 - e / 2, 6 + bodyY - e / 2, 6 + e, 5 + e, o ? P_OUT : P_SKIN);
        if (!o) r(21, 6 + bodyY, 6, 2, P_HAIR);
        r(19 - e / 2, 12 + bodyY - e / 2, 10 + e, 11 + e, o ? P_OUT : P_SHIRT);
        r(20 - e / 2, 23 + bodyY - e / 2, 8 + e, 7 + e, o ? P_OUT : P_SHORTS);
        // Calves highlighted!
        r(20 - e / 2, 30 + bodyY - e / 2, 3 + e, 6 + e, o ? P_OUT : LEG_COL);
        r(25 - e / 2, 30 + bodyY - e / 2, 3 + e, 6 + e, o ? P_OUT : LEG_COL);
        // Feet gripping edge of step
        r(19 - e / 2, 36 + bodyY * 0.4 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        r(25 - e / 2, 36 + bodyY * 0.4 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
        // Arms holding dumbbells at sides
        seg(18, 14 + bodyY, 17, 25 + bodyY, 2.5 + e, o ? P_OUT : P_SKIN);
        seg(30, 14 + bodyY, 31, 25 + bodyY, 2.5 + e, o ? P_OUT : P_SKIN);
      }
      r(15, Math.round(24 + bodyY), 4, 4, P_PLATE);
      r(29, Math.round(24 + bodyY), 4, 4, P_PLATE);
      arrow(37, 20, phase === "EXC" ? "down" : "up", "#ffe14d");
      break;
    }

    /* 20. CORE / PLANK OR CRUNCH */
    case "core": {
      r(5, 40, 38, 1, P_BENCH); // mat
      if (guide.variant === "plank") {
        // Breathing isometric micro-brace glow
        const braceGlow = Math.sin(timeMs / 250) > 0;
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          // Straight horizontal plank on forearms (31,39) & toes (9,39)
          seg(10, 39, 20, 31, 3 + e, o ? P_OUT : P_SHORTS);
          seg(20, 31, 32, 30, 4.5 + e, o ? P_OUT : (braceGlow ? "#38bdf8" : P_SHIRT_SHADE));
          r(34 - e / 2, 26 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
          if (!o) r(35, 26, 4, 2, P_HAIR);
          seg(32, 31, 32, 39, 2.5 + e, o ? P_OUT : P_SKIN);
          seg(32, 39, 36, 39, 2 + e, o ? P_OUT : P_SKIN);
        }
        // Core stability indicator lines
        r(22, 25, 8, 1, braceGlow ? "#ffe14d" : "#3df2ff");
      } else {
        // Dynamic Crunch / V-up on floor
        const liftX = 24 - p * 4;
        const liftY = 37 - p * 10;
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          // Knees bent feet on ground right (33..37)
          seg(25, 38, 30, 29, 3.5 + e, o ? P_OUT : P_SHORTS);
          seg(30, 29, 35, 39, 3 + e, o ? P_OUT : P_SKIN);
          r(34 - e / 2, 39 - e / 2, 4 + e, 2 + e, o ? P_OUT : P_SHOE);
          // Torso curling ribs to knees
          seg(23, 38, liftX - 9, liftY, 4.5 + e, o ? P_OUT : (p > 0.65 ? "#fb7185" : P_SHIRT));
          r(liftX - 13 - e / 2, liftY - 4 - e / 2, 5 + e, 5 + e, o ? P_OUT : P_SKIN);
          if (!o) r(liftX - 13, liftY - 4, 4, 2, P_HAIR);
          seg(liftX - 8, liftY, liftX - 3, liftY - 3, 2.2 + e, o ? P_OUT : P_SKIN);
        }
        arrow(12, 22, phase === "EXC" ? "down" : "up", "#ffe14d");
      }
      break;
    }
  }

  // Bottom mini phase bar (subtle visual tempo gauge across bottom 2px)
  const fillW = Math.round(p * (ANW - 4));
  r(2, ANH - 3, ANW - 4, 1, "#1e293b");
  if (fillW > 0) {
    r(2, ANH - 3, fillW, 1, phase === "CON" ? "#ffe14d" : phase === "HOLD" ? "#ff3f6c" : "#3df2ff");
  }
}
