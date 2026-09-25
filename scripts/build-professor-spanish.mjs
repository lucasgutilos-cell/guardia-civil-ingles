// Materializes reviewed sidecars only. Never writes source question banks.
import fs from 'node:fs';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const save = (name, data) => fs.writeFileSync(`data/professor/${name}.json`, JSON.stringify(data, null, 2) + '\n');
fs.mkdirSync('data/professor', { recursive: true });
const rules = new Map();
function rule(id, title, plain, entry, exampleGood, memoryTip, examTrap, topicId, source = 'dpd') {
  const value = { id: `es-${id}`, title, plain, sourceRefs: [{ name: `RAE/ASALE · ${source === 'dpd' ? 'Diccionario panhispánico de dudas' : 'Diccionario de la lengua española'} · ${entry}`, url: `https://${source === 'dpd' ? 'www.rae.es/dpd' : 'dle.rae.es'}/${encodeURIComponent(entry)}` }], exampleGood, memoryTip, examTrap, topicId };
  rules.set(value.id, value); return value.id;
}
const G = {};
function gr(id, ...args) { G[id] = rule(id, ...args); }
gr('haber', 'Haber existencial impersonal', 'Haber existencial no tiene sujeto y se usa en singular.', 'haber', 'Hubo tres llamadas esta tarde.', 'Existencia: hay, había, hubo, habrá.', 'El nombre plural pospuesto no es el sujeto de haber.', 'agreement-impersonal');
gr('haber-nosotros', 'Haber existencial y primera persona', 'Para incluir al hablante en un grupo se prefiere éramos o estábamos; haber existencial sigue en singular.', 'haber', 'Éramos seis esperando el autobús.', 'Si te incluyes en el grupo, elige estar o ser.', 'Habíamos como equivalente de estábamos no es el uso formal recomendado.', 'agreement-impersonal');
gr('dequeismo', 'Subordinada sin de con opinar y afirmar', 'Opinar y afirmar introducen el contenido mediante que, sin de.', 'dequeísmo', 'Opino que el puente es seguro.', 'Prueba con opino eso, no opino de eso.', 'No añadas una preposición solo porque después aparezca que.', 'que-regime');
gr('queismo', 'Complementos que conservan de ante que', 'Convencido, certeza, condición y espera conservan de ante una oración con que.', 'queísmo', 'Tengo la certeza de que llegará.', 'Sustituye la oración por eso: convencido de eso.', 'La subordinada no elimina la preposición que exige el nombre o adjetivo.', 'que-regime');
gr('acordarse', 'Régimen de acordarse de', 'Acordarse se construye con de; ante el artículo el se escribe del.', 'acordar', 'Me acordé del cumpleaños de Rosa.', 'Recordar algo, pero acordarse de algo.', 'No confundas el régimen de dos verbos de significado parecido.', 'que-regime');
gr('insistir', 'Régimen de insistir en', 'El asunto en que se insiste se introduce con en, también delante de que.', 'insistir', 'Insistió en llamar a Marta.', 'Insiste en algo: conserva en.', 'Cambiar en por de o suprimirlo altera el régimen.', 'que-regime');
gr('leismo', 'Complemento directo femenino: la', 'Una mujer como complemento directo de ver se representa con la.', 'leísmo', 'A mi vecina la vi ayer.', 'Ver a una mujer: la veo.', 'La a personal no convierte el complemento directo en indirecto.', 'pronouns-relatives');
gr('laismo', 'Complemento indirecto: le', 'La persona destinataria de dar algo es complemento indirecto y se expresa con le, sea hombre o mujer.', 'laísmo', 'A mi hermana le di un regalo.', 'Algo es lo dado; le señala a quién se da.', 'El género femenino no justifica la como indirecto.', 'pronouns-relatives');
gr('leismo-cosa', 'Complemento directo de cosa: lo', 'El referente masculino inanimado de un complemento directo se representa con lo.', 'leísmo', 'Ese abrigo no pienso usarlo.', 'Para una cosa masculina: lo uso.', 'La admisión de le para personas masculinas no se extiende a objetos.', 'pronouns-relatives');
gr('indirecto', 'Pronombres de complemento indirecto', 'Le y les señalan destinatarios; delante de lo, la, los o las se convierten en se.', 'pronombres personales átonos', 'Se las envié a mis primos.', 'Le más lo se convierte en se lo.', 'Se no cambia de forma aunque haya varios destinatarios.', 'pronouns-relatives');
gr('clitic-order', 'Orden de se y otros pronombres', 'Se precede a me, te, nos y os en un grupo de pronombres átonos.', 'pronombres personales átonos', 'Se me cayó el cuaderno.', 'El grupo comienza por se.', 'El orden me se no es el estándar.', 'pronouns-relatives');
gr('delante', 'Delante y detrás con pronombre personal', 'En el registro formal general se recomienda delante de mí o de él, sin posesivo.', 'delante', 'La mochila está delante de ti.', 'Después de de, usa mí, ti, él o ella.', 'Delante mío está extendido regionalmente, pero no es la recomendación formal general.', 'pronouns-relatives');
gr('lado', 'Concordancia del posesivo con lado', 'Lado es masculino: a mi lado o al lado mío; también al lado de mí.', 'lado', 'Siéntate al lado mío.', 'El posesivo concuerda con lado, no con la persona.', 'Al lado mía mezcla un sustantivo masculino y un posesivo femenino.', 'pronouns-relatives');
gr('relativo', 'Relativo que para antecedente de cosa', 'Que puede retomar una cosa; quien se reserva para personas o entidades personificadas.', 'quien', 'El museo al que fuimos estaba cerrado.', 'Para un edificio: al que.', 'No elijas quien solo porque la construcción lleve a.', 'pronouns-relatives');
gr('relativo-simple', 'Relativo que sin artículo innecesario', 'En una relativa especificativa con antecedente expreso, que puede funcionar directamente como complemento.', 'que', 'La carta que escribiste ya llegó.', 'Antecedente seguido de que: la carta que escribí.', 'No añadas el entre el antecedente y que cuando no lo exige la construcción.', 'pronouns-relatives');
gr('cuyo', 'Cuyo concuerda con lo poseído', 'Cuyo expresa relación posesiva y concuerda con el nombre que le sigue.', 'cuyo', 'Vino la autora cuya novela leí.', 'Mira el nombre posterior: cuya novela.', 'No hagas concordar cuyo con el poseedor.', 'pronouns-relatives');
gr('a-personal', 'A ante complemento directo personal', 'El complemento directo que designa una persona concreta suele introducirse con a.', 'a', 'Ayudamos a la nueva profesora.', 'Persona identificada: ayudar a alguien.', 'Ayudar y la presencia de un nombre personal no permiten omitir automáticamente a.', 'pronouns-relatives');
gr('subjuntivo', 'Subjuntivo con negación, deseo o probabilidad', 'Deseos, negaciones de creencia y valoraciones de probabilidad suelen introducir una subordinada en subjuntivo.', 'subjuntivo', 'Espero que encuentres las llaves.', 'Quiero que suceda: subjuntivo.', 'El indicativo afirma un hecho; aquí se expresa deseo, duda o valoración.', 'verb-mood', 'dle');
gr('sin-que', 'Sin que con subjuntivo', 'Sin que presenta una circunstancia que no se realiza y selecciona subjuntivo.', 'sin', 'Salió sin que nadie lo viera.', 'Sin que ocurra, no sin que ocurre.', 'La afirmación en indicativo choca con la subordinada negativa.', 'verb-mood');
gr('condicion', 'Si hipotético con subjuntivo', 'Una condición hipotética usa si tuviera o tuviese, seguida normalmente de un condicional.', 'si', 'Si lloviera, llevaría paraguas.', 'Si pudiera, lo haría.', 'El condicional no sustituye al subjuntivo detrás de si en esta lectura.', 'verb-mood');
gr('condicion-pasada', 'Condición irreal del pasado', 'Si hubiera sucedido plantea la condición pasada; habría sucedido expresa su consecuencia.', 'si', 'Si me hubieras avisado, habría ido.', 'Primero hubiera; después habría.', 'Hubiera también puede aparecer en la consecuencia: no es ese el error de si habría.', 'verb-mood');
gr('andar', 'Pretérito irregular de andar', 'El pasado simple de andar usa la raíz anduv-: anduvo, anduvieron.', 'andar', 'Anduvimos hasta el refugio.', 'Andar se apoya en anduv-.', 'No regularices el pretérito como andó.', 'verb-mood');
gr('satisfacer', 'Conjugación de satisfacer', 'Satisfacer sigue la irregularidad de hacer: satisfizo, satisficiera.', 'satisfacer', 'La explicación satisfizo a Inés.', 'Hizo ayuda a recordar satisfizo.', 'Satisfació es una regularización ajena a la norma.', 'verb-mood');
gr('prever', 'Prever sigue a ver', 'Prever se conjuga como ver: previó, prevén, previeron.', 'prever', 'No previeron aquella tormenta.', 'Pre más ver conserva la conjugación de ver.', 'No mezcles prever con proveer.', 'verb-mood');
gr('poner', 'Pretérito irregular de poner', 'El pretérito de poner tiene la raíz pus-: puso, pusieron.', 'poner', 'Pusieron una señal nueva.', 'Poner en pasado: puso.', 'Ponieron copia una terminación regular que no corresponde.', 'verb-mood');
gr('conducir', 'Pretérito de verbos en -ducir', 'Conducir y producir tienen pretéritos en -dujo y -dujeron.', 'conducir', 'El guía condujo al grupo al teatro.', 'Condujo en singular, condujeron en plural.', 'La raíz del infinitivo no se conserva como conducieron.', 'verb-mood');
gr('otros-irregulares', 'Raíz irregular del pretérito', 'Los derivados conservan las irregularidades del verbo base: contuvieron, predijeron, atuvieron.', 'conjugación', 'Las alumnas mantuvieron la calma.', 'Relaciona contener con tener y predecir con decir.', 'No formes estos pasados como verbos regulares.', 'verb-mood', 'dle');
gr('llegar', 'Llegamos en pasado indicativo', 'Anoche sitúa un hecho pasado afirmado y corresponde llegamos, no lleguemos.', 'llegar', 'El sábado llegamos al amanecer.', 'Llegamos cuenta; lleguemos propone.', 'Lleguemos es subjuntivo, no el pasado simple de llegar.', 'verb-mood', 'dle');
gr('imperativo', 'Imperativo dirigido a vosotros', 'Las órdenes directas afirmativas a vosotros usan formas como callad, escuchad y coged.', 'infinitivo', 'Abrid el paquete con cuidado.', 'Para vosotros, buscad la d final.', 'El infinitivo es válido en avisos impersonales, pero no sustituye sin más a la orden personal.', 'verb-mood');
gr('encliticos', 'Pronombres unidos al imperativo', 'Los pronombres pospuestos se escriben unidos al verbo y el conjunto sigue las reglas de tilde.', 'pronombres personales átonos', 'Explícamelo con calma.', 'En un imperativo afirmativo, une el verbo y los pronombres y vuelve a comprobar la tilde.', 'No separes los pronombres pospuestos del imperativo: di + me = dime; diga + me + lo = dígamelo.', 'pronouns-relatives');
gr('nos-imperativo', 'Pérdida de s ante nos', 'El exhortativo de primera persona plural pierde la s final al añadirse nos.', 'pronombres personales átonos', 'Sentémonos cerca de la ventana.', 'Sentemos más nos da sentémonos.', 'No se acumulan s y n en sentémosnos.', 'pronouns-relatives');
gr('concordancia', 'Concordancia de sujeto y verbo', 'El verbo concuerda en número con el sujeto.', 'concordancia', 'Las ventanas permanecieron abiertas.', 'Localiza quién realiza la acción.', 'Un nombre cercano no siempre es el núcleo del sujeto.', 'agreement-impersonal');
gr('participio', 'Concordancia de adjetivo y participio', 'El participio adjetival concuerda en género y número con el nombre al que se refiere.', 'concordancia', 'Las puertas quedaron cerradas.', 'Puertas: femenino plural, cerradas.', 'El participio con haber es invariable; con quedar o tener puede concordar.', 'agreement-impersonal');
gr('mayoria', 'Concordancia con mayoría y complemento plural', 'La mayoría de más un plural permite verbo singular o plural.', 'concordancia', 'La mayoría de las vecinas llegaron temprano.', 'Mayoría no impone siempre singular.', 'No condenes aprobaron si el sujeto es la mayoría de los aspirantes.', 'agreement-impersonal');
gr('colectivo', 'Sujeto colectivo singular', 'Un colectivo singular como equipo suele concordar en singular cuando se presenta como unidad.', 'concordancia', 'El equipo entregó el proyecto.', 'El equipo actúa como una unidad.', 'No conviertas automáticamente en sujeto el plural de investigadores.', 'agreement-impersonal');
gr('epiceno', 'Género de sustantivos de animales', 'La concordancia sigue al género del sustantivo; macho y hembra no lo cambian.', 'género', 'La jirafa macho es alta.', 'Macho indica sexo, no género gramatical.', 'Una orca sigue siendo femenina aunque sea macho.', 'agreement-impersonal');
gr('elefanta', 'Femenino de elefante', 'La forma específica para la hembra es elefanta.', 'elefante', 'La elefanta protegió a su cría.', 'Elefante forma el femenino elefanta.', 'No trates todos los nombres de animales como comunes en cuanto al género.', 'agreement-impersonal');
gr('abadesa', 'Femenino de abad', 'El femenino de abad es abadesa.', 'abad', 'La abadesa abrió el archivo.', 'Abad y abadesa forman pareja.', 'Cambiar solo el artículo no forma el femenino normativo.', 'agreement-impersonal', 'dle');
gr('partitiva', 'Concordancia tras soy de los que', 'Tras soy de los que se prefiere verbo en tercera persona plural.', 'concordancia', 'Soy de los que escuchan primero.', 'Los que apoyan, aunque empiece por yo.', 'No atraigas el verbo de la relativa hacia la primera persona.', 'agreement-impersonal');
gr('impersonal-se', 'Impersonal con se y persona precedida de a', 'Con se impersonal y complemento personal precedido de a, el verbo permanece singular.', 'se', 'Se entrevistó a las testigos.', 'Se busca a alguien: singular.', 'No combines el plural de una pasiva refleja con a personal.', 'agreement-impersonal');
gr('tratarse', 'Tratarse de impersonal', 'Tratarse de es impersonal y se mantiene singular.', 'tratar', 'Se trata de documentos antiguos.', 'Se trata de uno o de varios.', 'El plural detrás de de no es sujeto.', 'agreement-impersonal');
gr('cuantas', 'Cuanto determinante concuerda con el nombre', 'Cuanto lleva género y número cuando determina un sustantivo.', 'cuanto', 'Cuantas más páginas leas, mejor.', 'Mira el nombre: cuantas pruebas.', 'No uses cuanto invariable ante un sustantivo femenino plural.', 'normative-constructions');
gr('cuanto', 'Cuanto adverbial y correlación proporcional', 'Cuanto más modifica un verbo o una cantidad; contra más no forma esta correlación.', 'cuanto', 'Cuanto más practiques, mejor saldrá.', 'Con un verbo: cuanto más.', 'Contra es preposición, no el correlativo de más.', 'normative-constructions');
gr('correlativa-coma', 'Coma en construcciones correlativas', 'La coma separa los dos miembros de la correlación cuanto más, mejor.', 'coma', 'Cuanto antes llegues, mejor.', 'Separa la condición proporcional y su resultado.', 'La concordancia puede ser correcta y faltar la coma.', 'normative-constructions');
gr('mejor', 'Mejor ya expresa comparación', 'Mejor es comparativo de bueno y no lleva más antepuesto en la misma comparación.', 'mejor', 'Esta solución es la mejor.', 'Mejor ya incluye más bueno.', 'Más mejor duplica el grado comparativo.', 'normative-constructions');
gr('durante', 'Durante introduce directamente su término', 'Durante funciona como preposición temporal sin añadir en detrás.', 'durante', 'Durante la reunión tomé notas.', 'Durante más nombre: durante la clase.', 'Durante en acumula dos preposiciones sin función en este contexto.', 'que-regime', 'dle');
gr('necesario', 'Es necesario más infinitivo', 'El infinitivo que expresa lo necesario se une directamente a es necesario.', 'necesario', 'Es necesario descansar un poco.', 'Es necesario hacerlo.', 'La preposición de no introduce aquí el infinitivo.', 'normative-constructions', 'dle');
gr('deber', 'Deber y deber de', 'Deber suele expresar obligación y deber de suele expresar suposición, con usos cultos compartidos.', 'deber', 'Debemos revisar las fechas.', 'Para ordenar, prefiere deber sin de.', 'La preferencia no permite declarar siempre incorrecto deber de.', 'normative-constructions');
gr('hay-que', 'Obligación impersonal con hay que', 'Hay que más infinitivo expresa necesidad general.', 'haber', 'Hay que apagar las luces.', 'La fórmula es hay que hacer.', 'No sustituyas que por de en esta perífrasis.', 'normative-constructions');
gr('gerundio', 'Gerundio de modo o simultaneidad', 'El gerundio puede describir cómo ocurre una acción o una acción simultánea.', 'gerundio', 'Cruzó la plaza silbando.', 'Pregunta si ambas acciones pueden coincidir.', 'No presupongas posterioridad cuando la frase admite simultaneidad.', 'verb-mood');
gr('contraccion', 'Contracciones al y del', 'Las preposiciones a y de se unen al artículo el: al, del; no se contraen ante El de un nombre propio.', 'contracción', 'Volvió del mercado al hotel.', 'A más el da al; de más el da del.', 'El Escorial mantiene su artículo como parte del nombre propio.', 'que-regime');
gr('ordinales', 'Ordinal frente a fraccionario', 'Duodécimo y decimosegundo expresan posición; doceavo expresa una parte.', 'duodécimo', 'Mi habitación está en el duodécimo piso.', 'Orden: duodécimo; fracción: doceavo.', 'Numerar pisos no equivale a dividirlos en doce partes.', 'normative-constructions');
gr('tilde', 'Acentuación y tilde diacrítica', 'La tilde depende de la pronunciación y función; los interrogativos tónicos la llevan.', 'tilde', 'No sé cuántos vendrán mañana.', 'Interrogación indirecta también puede llevar tilde.', 'No pongas tildes por énfasis ni las suprimas porque no haya signos.', 'normative-constructions');
gr('aun', 'Aún temporal y aun concesivo', 'Aún lleva tilde si equivale a todavía; aun suele equivaler a incluso o aunque.', 'aun', 'Aún no ha vuelto del trabajo.', 'Sustituye por todavía.', 'Aun cuando puede ser concesivo y escribirse sin tilde.', 'normative-constructions');
gr('aunque', 'Aunque como conjunción', 'Aunque se escribe en una palabra cuando introduce una concesión.', 'aunque', 'Aunque haga frío, saldré.', 'La concesión se une en aunque.', 'Separar aun que cambia la estructura.', 'normative-constructions');
gr('consigo', 'Pronombre consigo en una palabra', 'Consigo es la forma reflexiva de tercera persona tras con.', 'consigo', 'Estaba contenta consigo misma.', 'Con él mismo: consigo mismo.', 'No separes con sigo.', 'pronouns-relatives');
gr('sin-embargo', 'Locución adversativa sin embargo', 'La locución sin embargo se escribe con embargo, sin en intercalado.', 'embargo', 'Llovía; sin embargo, salimos.', 'Dos palabras: sin embargo.', 'No mezcles sin embargo y en cambio.', 'normative-constructions', 'dle');
gr('locuciones', 'Separación de palabras en locuciones', 'A gusto, así que, cuesta arriba y a cambio mantienen sus palabras separadas.', 'locución', 'Subimos cuesta arriba sin prisa.', 'Aprende la locución como unidad de sentido, no como una palabra.', 'La unidad de significado no obliga a unir sus grafías.', 'normative-constructions', 'dle');
gr('con-que', 'Preposición con más conjunción que', 'Basta con que mantiene separadas la preposición exigida por bastar y la conjunción.', 'conque', 'Basta con que firmes aquí.', 'Basta con eso: conserva con.', 'Conque unido expresa una consecuencia, no el requisito de bastar.', 'que-regime');
gr('prefijo', 'Prefijos unidos a base de una palabra', 'Los prefijos se unen a una base de una palabra: semitransparente, sobreesfuerzo, cuasidelito.', 'prefijos', 'El cristal es semitransparente.', 'Una base, una palabra prefijada.', 'No insertes un espacio después de semi cuando la base es simple.', 'normative-constructions');
gr('siquiera', 'Siquiera en una palabra', 'Siquiera equivale aquí a al menos y forma una palabra.', 'siquiera', 'No quiso siquiera escucharme.', 'Ni siquiera: una sola palabra final.', 'Si quiera separado contiene si y un verbo y cambia el análisis.', 'normative-constructions');
gr('a-ver', 'A ver frente a haber', 'A ver contiene el infinitivo ver; haber es otro verbo.', 'haber', 'Vamos a ver qué ocurre.', 'Si significa mirar o comprobar: a ver.', 'La coincidencia de sonido no hace intercambiables ambas grafías.', 'verb-mood');
gr('adicto', 'Régimen de adicto a', 'Adicto introduce su complemento mediante a.', 'adicto', 'Es adicta al café.', 'Adicto a algo.', 'El régimen no se forma con de.', 'que-regime');
gr('antinieblas', 'Adjetivo antiniebla', 'Antiniebla es el adjetivo usado para los dispositivos que ayudan a ver con niebla.', 'antiniebla', 'Encendió las luces antiniebla.', 'Luces antiniebla: el compuesto conserva su forma.', 'No copies la s del plural luces dentro del compuesto.', 'agreement-impersonal', 'dle');
gr('régimen-correcto', 'Preposición exigida por el verbo', 'Apropiarse de, atenerse a e incautarse de conservan la preposición propia de cada verbo.', 'incautar', 'Se incautaron de la mercancía.', 'Aprende el verbo junto con su preposición.', 'No suprimas la preposición por analogía con un verbo transitivo.', 'que-regime');
gr('adverbio', 'Adverbio y complemento de modo o lugar', 'Los adverbios pueden modificar al verbo y expresar modo, lugar o grado sin concordar como adjetivos.', 'adverbio', 'Aprieta fuerte y mira arriba.', 'Pregunta cómo o dónde ocurre.', 'Fuerte puede ser adverbio; no tiene por qué cambiar de género.', 'normative-constructions', 'dle');
gr('declarativa', 'Oración declarativa y concordancia', 'Una oración declarativa puede ser gramatical aunque exprese una negación o un hecho discutible.', 'oración', 'Febrero no tiene treinta y un días.', 'Valora la forma, no solo si el hecho te sorprende.', 'Corrección gramatical y verdad del contenido son criterios distintos.', 'agreement-impersonal', 'dle');
gr('le-persona', 'Leísmo admitido de persona masculina', 'Le puede representar un complemento directo de persona masculina en el uso admitido.', 'leísmo', 'A mi hermano le vi en la estación.', 'La admisión depende del referente, no solo del verbo.', 'No extiendas esta posibilidad automáticamente a mujeres o cosas.', 'pronouns-relatives');
gr('afeccion', 'Verbos de afección con experimentante', 'El pronombre señala a quien experimenta el sentimiento y la causa funciona como sujeto.', 'leísmo', 'Me alegra tu visita.', 'Qué produce el sentimiento es el sujeto.', 'El pronombre me no obliga al verbo a ir en primera persona.', 'pronouns-relatives');
gr('a-tonica', 'Nombres femeninos con a tónica inicial', 'Ante un nombre femenino singular que empieza por a tónica se usa el, pero los adjetivos y demostrativos siguen en femenino.', 'el', 'Esta águila tiene el ala herida.', 'El arma, pero esta arma cargada.', 'El artículo el no convierte el sustantivo en masculino.', 'agreement-impersonal');
gr('antes-que', 'Antes de que con subjuntivo', 'Antes de que introduce un hecho todavía no realizado desde la referencia temporal y admite subjuntivo.', 'antes', 'Volveremos antes de que amanezca.', 'Antes de que ocurra: subjuntivo.', 'La referencia futura no exige futuro de indicativo en la subordinada.', 'verb-mood');
gr('exclamativo-que', 'Que exclamativo átono', 'Que puede introducir una exclamación intensificadora sin tilde cuando no es el interrogativo o exclamativo tónico qué.', 'que', '¡Que te caes!', 'Distingue que introductor de qué intenso.', 'Los signos de exclamación no ponen tilde a todas las apariciones de que.', 'normative-constructions');
const mapping = {
  'oficial-2': ['haber','indirecto','leismo','dequeismo','subjuntivo','satisfacer','cuanto','delante','delante','andar','queismo','queismo','condicion','queismo','prever','indirecto','haber-nosotros','prever','imperativo','relativo'],
  'oficial-4': ['condicion-pasada','clitic-order','insistir','régimen-correcto','lado','mejor','subjuntivo','otros-irregulares','nos-imperativo','participio','prefijo','indirecto','aunque','tilde','correlativa-coma','llegar','participio','cuyo','encliticos','leismo'],
  'oficial-10': ['subjuntivo','ordinales','adicto','epiceno','relativo','aun','consigo','adverbio','sin-embargo','contraccion','concordancia','encliticos','prefijo','aun','locuciones','partitiva','gerundio','tilde','adverbio','tilde'],
  'oficial-12': ['tilde','sin-que','condicion-pasada','locuciones','con-que','contraccion','tilde','locuciones','elefanta','encliticos','impersonal-se','clitic-order','locuciones','prefijo','tilde','siquiera','encliticos','cuanto','otros-irregulares','sin-que'],
  'oficial-14': ['queismo','tilde','epiceno','concordancia','hay-que','adverbio','subjuntivo','poner','queismo','a-ver','tilde','mayoria','gerundio','adverbio','tilde','imperativo','adverbio','haber','indirecto','a-personal'],
  'oficial-16': ['gerundio','tratarse','subjuntivo','indirecto','mejor','tilde','colectivo','conducir','subjuntivo','leismo-cosa','tilde','adverbio','participio','clitic-order','subjuntivo','otros-irregulares','queismo','concordancia','concordancia','cuantas'],
  'oficial-18': ['abadesa','participio','declarativa','declarativa','concordancia','régimen-correcto','adverbio','antinieblas','concordancia','participio','concordancia','subjuntivo','llegar','encliticos','tilde','haber','concordancia','laismo','imperativo','condicion']
};
const trainingRules = ['haber','haber','dequeismo','queismo','acordarse','insistir','mayoria','concordancia','leismo','delante','cuantas','cuanto','satisfacer','andar','condicion','condicion-pasada','relativo-simple','durante','participio','necesario','gerundio','colectivo','a-personal','deber','hay-que'];
const old = read('data/grammar/explanations.json');
const grammar = [];
const grammarReasons = {
 'oficial-2-2':'Se sustituye a les ante lo; lo representa lo entregado y a los interesados identifica a los destinatarios. Se lo no debe pluralizarse como se los si se entrega una sola cosa.',
 'oficial-2-5':'Es probable que presenta una posibilidad: desciendan es subjuntivo y concuerda con temperaturas.',
 'oficial-2-11':'Alegrarse de algo conserva de cuando el complemento es que hayas superado la prueba; la presencia de de no es dequeísmo.',
 'oficial-2-14':'Darse cuenta de algo conserva de delante del nombre la gravedad; la negación no altera esa construcción.',
 'oficial-2-16':'Se proporcionó concuerda con todo el material, singular; les representa a los nuevos empleados, el destinatario plural.',
 'oficial-2-18':'Prevén es la tercera persona plural de prever, como ven de ver; concuerda con fuertes ráfagas en la pasiva con se.',
 'oficial-4-1-op1':'Hubieras hecho expresa la condición no realizada y habría ido su consecuencia. Ambos tiempos están correctamente distribuidos.',
 'oficial-4-1-op4':'Apropiarse selecciona de para introducir lo tomado: de su casa. Se han apropiado conserva la construcción pronominal.',
 'oficial-4-2-op3':'Sino que contrapone el motivo del reproche y admite no hubiese llamado en subjuntivo; el reproche puede presentarse como valoración del hecho.',
 'oficial-4-2-op4':'Atuvieron es pasado de atenerse, conjugado como tener; a su derecho mantiene el régimen atenerse a.',
 'oficial-4-3-op1':'Alegrémonos resulta de alegremos más nos, con pérdida de s. Lleva tilde porque la palabra resultante es esdrújula.',
 'oficial-4-3-op2':'Impreso es el participio irregular admitido de imprimir y concuerda con documento, masculino singular.',
 'oficial-4-3-op3':'Sobreesfuerzo une el prefijo sobre y esfuerzo; conserva las dos e contiguas de la formación.',
 'oficial-4-3-op4':'Lo que me estás contando es el sujeto singular de entristece; me representa a la persona que experimenta tristeza.',
 'oficial-4-4-op2':'Quién es interrogativo tónico y lleva tilde; ha dicho está formado por haber y el participio de decir.',
 'oficial-4-5-op2':'Cuya expresa que la madre pertenece al entorno familiar del amigo y concuerda con madre en femenino singular.',
 'oficial-4-5-op3':'Digamos + le forma digámosle: el pronombre le señala al destinatario Juan. Al unirse al verbo, digámosle es esdrújula y conserva la tilde.',
 'oficial-4-5-op4':'Le puede referirse al hijo como persona masculina, uso admitido. No debe rechazarse automáticamente como si tuviera referente inanimado.',
 'oficial-10-1-op1':'No cree que niega la creencia y justifica entiendan en subjuntivo; la es complemento directo femenino de entender.',
 'oficial-10-2-op1':'Con la que retoma arma manteniendo el género femenino. El arma lleva el por su a tónica inicial, pero la concordancia sigue siendo femenina.',
 'oficial-10-2-op2':'Aun cuando equivale a aunque y va sin tilde; luchando expresa la actividad que seguía realizando.',
 'oficial-10-2-op4':'De arriba abajo es una locución de recorrido espacial; abajo se escribe junto en ese valor adverbial.',
 'oficial-10-3-op3':'Los hechos es sujeto plural y ocurrieron concuerda en plural; aquella determina época en femenino singular.',
 'oficial-10-3-op4':'Cógete une coge y te; la palabra resultante es esdrújula. Cogerse de un brazo permite la preposición de.',
 'oficial-10-4-op1':'Cuasidelito se forma uniendo cuasi a delito, una base de una sola palabra. La formación no requiere espacio ni guion.',
 'oficial-10-4-op2':'Aún equivale a todavía y por ello lleva tilde. Queda concuerda con dinero, singular.',
 'oficial-10-5-op1':'Estaba divirtiendo forma la perífrasis progresiva y el pronombre me señala el uso pronominal divertirse; divirtiendo tiene la vocal irregular i.',
 'oficial-10-5-op3':'Fuerte funciona como adverbio de modo, equivalente a con fuerza; no necesita concordar con la persona abrazada.',
 'oficial-12-1-op3':'De haberlo sabido expresa una condición pasada no realizada; habría dicho es una consecuencia compatible.',
 'oficial-12-2-op2':'El artículo forma parte del topónimo El Escorial, por lo que se conserva separado de de y con mayúscula.',
 'oficial-12-2-op3':'Quién introduce una interrogación indirecta y mantiene la tilde aunque la oración completa no tenga signos de pregunta.',
 'oficial-12-3-op2':'Déjame une deja y me y forma una esdrújula. En paz conserva la locución.',
 'oficial-12-3-op4':'Se me mantiene el orden normativo de los pronombres; olvidó concuerda con el sujeto singular sobreentendido.',
 'oficial-12-5-op3':'Contuvieron conserva la raíz irregular de tuvieron, pues contener se conjuga como tener.',
 'oficial-12-5-op4':'Sin que introduce una condición no realizada; des es presente de subjuntivo de dar y no lleva tilde. La forma dé singular sí tiene tilde diacrítica, pero esa distinción no afecta a des.',
 'oficial-14-1-op2':'Entre sí son dos palabras; sí es pronombre tónico reflexivo con tilde, no la conjunción condicional si.',
 'oficial-14-1-op3':'Área es femenino aunque pueda llevar el en singular; el demostrativo esta y el adjetivo concreta mantienen ese género.',
 'oficial-14-1-op4':'La primera y la segunda designan dos soluciones; son y buenas soluciones van correctamente en plural.',
 'oficial-14-2-op1':'Habría que mantiene el singular de la perífrasis impersonal haber que; tener en cuenta completa la obligación.',
 'oficial-14-2-op2':'Donde introduce el lugar conocido, sin pregunta ni énfasis interrogativo; por eso no lleva tilde.',
 'oficial-14-2-op3':'No creo que admite vengan en subjuntivo porque se niega la creencia en esa llegada.',
 'oficial-14-3-op1':'Certeza se construye con de; al introducir una oración se mantiene de que vendrá.',
 'oficial-14-3-op3':'Qué introduce una interrogación indirecta dependiente de no sabemos y conserva su tilde.',
 'oficial-14-3-op4':'La mitad de los trabajadores admite concordancia plural con trabajadores. Eran inmigrantes no debe forzarse al singular por mitad.',
 'oficial-14-4-op1':'Acercándose es el gerundio pronominal de acercarse: se une al verbo y se acentúa según la palabra resultante.',
 'oficial-14-4-op2':'De su gusto es un grupo preposicional con valor adjetival y puede intensificarse con muy.',
 'oficial-14-4-op3':'Frío necesita tilde por el hiato con i tónica. El condicional cerraríamos puede tener un valor de propuesta cortés y no necesita convertirse obligatoriamente en futuro.',
 'oficial-14-5-op1':'Cuando expresa el momento en que ocurrió el hecho, sin valor interrogativo; mejor modifica a estábamos y permanece invariable.',
 'oficial-14-5-op3':'Le representa a la hija como destinataria; un ramo de flores es el complemento directo. El femenino del destinatario no exige la.',
 'oficial-14-5-op4':'Obligar a alguien a hacer algo mantiene la preposición a delante del infinitivo; me representa a la persona obligada.',
 'oficial-16-1-op1':'Estaban divirtiendo forma la perífrasis de estar más gerundio y concuerda con un sujeto plural sobreentendido; se señala el uso pronominal divertirse y no expresa número por sí solo.',
 'oficial-16-1-op3':'Que baje expresa una orden indirecta en subjuntivo; quien quiera tiene antecedente humano inespecífico y no es una pregunta.',
 'oficial-16-1-op4':'Se sustituye a le ante lo; lo representa eso y se retoma a Ana, destinataria de la información.',
 'oficial-16-2-op2':'Cómo introduce la forma de llegar en una interrogación indirecta y lleva tilde.',
 'oficial-16-2-op3':'La mayor parte de la gente lleva complemento colectivo singular y el verbo irá se mantiene singular.',
 'oficial-16-3-op1':'Antes de que anochezca usa subjuntivo para un suceso pendiente desde la perspectiva futura de llegará.',
 'oficial-16-3-op2':'El coche está destacado al principio como tema y el sujeto de llevo puede ser yo. Como el pronombre retoma una cosa masculina, corresponde lo: hay que sustituir «le» por «lo» y escribir usarlo.',
 'oficial-16-3-op4':'Más abajo compara una posición mediante un adverbio; abajo se escribe en una palabra y no concuerda con cuadro.',
 'oficial-16-4-op1':'Arma es femenino y exige cargada, aunque lleve el por a tónica inicial. Aún significa todavía y lleva tilde.',
 'oficial-16-4-op2':'Tú es pronombre tónico con tilde y te precede a lo en la construcción pronominal merecerse algo.',
 'oficial-16-4-op4':'Predijeron es el pasado plural de predecir y mantiene la irregularidad de dijeron.',
 'oficial-16-5-op3':'Se hacen arreglos es pasiva refleja: arreglos de ropa es sujeto plural y justifica hacen.',
 'oficial-16-5-op4':'Cuanta concuerda con gente, femenino singular; la coma separa el primer miembro de la correlación y el resultado mejor.',
 'oficial-18-1-op2':'Actualizado concuerda con el antivirus, masculino singular, en la construcción tener algo actualizado.',
 'oficial-18-1-op3':'Este y el alcalde mantienen la concordancia masculina singular con señor y es.',
 'oficial-18-1-op4':'Tiene concuerda con mes y la negación no introduce ningún defecto gramatical; se valora la forma del enunciado.',
 'oficial-18-2-op1':'Tanto la joven como el anciano reúne dos sujetos; parecen y sospechosos van en plural y el género conjunto es masculino.',
 'oficial-18-2-op2':'Incautarse de admite se incautó de; un helicóptero es el complemento introducido por de.',
 'oficial-18-2-op3':'Mi es posesivo sin tilde y el de Juan recupera el sustantivo lápiz; ambos verbos concuerdan con sujetos singulares.',
 'oficial-18-3-op1':'Mil quinientos concuerda con euros en masculino plural y al mes contiene la contracción normativa.',
 'oficial-18-3-op2':'Compuesta concuerda con escuadrilla, femenino singular; compuesta de introduce sus componentes.',
 'oficial-18-3-op4':'Mira que intensifica una exclamación; que es introductor átono y eres sigue en indicativo.',
 'oficial-18-4-op2':'Tener que más infinitivo expresa obligación; entreteneros une entretener y os sin perder la r del infinitivo.',
 'oficial-18-4-op4':'Había es impersonal y permanece singular ante muchos jóvenes; sobre todo es una locución escrita en dos palabras.',
 'oficial-18-5-op1':'Esta casa y aquellas otras mantienen sus respectivas concordancias; otras recupera el nombre plural casas.',
 'oficial-18-5-op3':'Coged y venid son imperativos de vosotros; conmigo es la forma normativa del pronombre tras con.',
 'oficial-18-5-op4':'Como si presenta una situación hipotética y lleva imperfecto de subjuntivo: conociera.'
};
const ruleOverrides={'oficial-4-3-op4':'afeccion','oficial-4-5-op4':'le-persona','oficial-10-2-op1':'a-tonica','oficial-14-1-op3':'a-tonica','oficial-16-3-op1':'antes-que','oficial-16-4-op1':'a-tonica','oficial-18-3-op4':'exclamativo-que'};
function minimalDiff(a,b) { let start=0,endA=a.length,endB=b.length; while(start<endA&&start<endB&&a[start]===b[start])start++; while(endA>start&&endB>start&&a[endA-1]===b[endB-1]){endA--;endB--;} return {start,before:a.slice(start,endA),after:b.slice(start,endB)}; }
function readableDiff(a,b,d=minimalDiff(a,b)) {
  const span=(text,start,end)=>{
    let left=start,right=end;
    while(left>0&&!/\s/u.test(text[left-1]))left--;
    while(right<text.length&&!/\s/u.test(text[right]))right++;
    return text.slice(left,right).trim();
  };
  return {before:span(a,d.start,d.start+d.before.length),after:span(b,d.start,d.start+d.after.length)};
}
function changeInstruction(change) {
  const stop=text=>/[.!?…]$/u.test(text||'')?'':'.';
  if(change.before&&change.after)return `Cambia «${change.before}» por «${change.after}»${stop(change.after)}`;
  if(change.after)return `Añade «${change.after}»${stop(change.after)}`;
  if(change.before)return `Elimina «${change.before}»${stop(change.before)}`;
  return 'Revisa la construcción completa.';
}
function makeGrammar(q, source, key) {
  key=ruleOverrides[q.id]||key;
  const r=rules.get(G[key]); if(!r)throw new Error(`Unknown grammar rule ${q.id}: ${key}`);
  let corrected=q.respuesta==='B'?q.frase:(source==='training'?q.frase_correcta:old[q.frase]?.correct);
  let anomalyReason='';
  if(q.id==='oficial-2-8'){corrected=q.frase;anomalyReason='El banco conserva M, pero detrás de mí está bien formado; la explicación anterior también lo reconocía. No hay una corrección normativa que justifique esa clave.';}
  if(q.id==='oficial-12-5-op1')corrected='Dime lo que tengo que hacer.';
  if(q.id==='oficial-16-3-op2')corrected='El coche llevo mucho tiempo sin usarlo.';
  if(q.id==='oficial-14-4-op3')corrected='Si tenéis frío, cerraríamos la ventana.';
  if(q.id==='oficial-2-17')corrected='Estábamos muchos opositores esperando la publicación de las notas.';
  if(q.id==='oficial-12-3-op1')corrected='La elefanta es muy grande.';
  if(q.id==='oficial-12-3-op3')corrected='Se busca a los culpables.';
  if(q.id==='oficial-18-3-op3')corrected='El primer y segundo cuarto del partido fueron más intensos en ataque.';
  if(source==='training') {
    if(q.respuesta==='M'&&key==='mayoria')anomalyReason='La clave M contradice una concordancia admitida: la mayoría de los aspirantes puede llevar aprobaron o aprobó. La versión singular no invalida la plural.';
    if(q.respuesta==='M'&&key==='gerundio')anomalyReason='Salir cerrando admite una lectura simultánea o de modo. El enunciado no obliga a interpretar una segunda acción posterior, por lo que la clave M no es inequívoca.';
    if(q.respuesta==='M'&&key==='deber')anomalyReason='Debe de revisar puede expresar suposición y también obligación en el uso culto. El contexto no impone la lectura exclusiva que justificaría M.';
    if(/\b(?:de|a) el\b/u.test(q.frase)||/\b(?:de|a) el\b/u.test(corrected)) {
      anomalyReason+=(anomalyReason?' ':'')+'La plantilla conserva una preposición seguida del artículo el sin la contracción del/al. La explicación heredada no cubre ese defecto adicional.';
      if(q.respuesta==='M')corrected=corrected.replace(/\bde el\b/g,'del').replace(/\ba el\b/g,'al');
    }
  }
  if(!corrected||corrected.startsWith('['))throw new Error(`Missing correction ${q.id}`);
  const diff=minimalDiff(q.frase,corrected),readable=readableDiff(q.frase,corrected,diff),instruction=changeInstruction(readable);
  const quick=anomalyReason?`La clave ${q.respuesta} requiere revisión: ${anomalyReason.split('. ')[0]}.`:q.respuesta==='B'?`Se conserva la frase: ${r.title.toLowerCase()}.`:instruction;
  const why=anomalyReason?anomalyReason:grammarReasons[q.id]||(q.respuesta==='B'?`En esta frase, ${r.plain.charAt(0).toLowerCase()+r.plain.slice(1)} La construcción conservada satisface esa regla.`:`${instruction} ${r.plain} Así queda resuelta la relación gramatical que fallaba en la frase original.`);
  grammar.push({id:q.id,questionId:q.id,source,status:anomalyReason?'anomaly':'editorial',sourceVerified:false,acceptedKeys:[q.respuesta],expectedBM:q.respuesta,conceptId:r.id,topicId:r.topicId,ruleId:r.id,originalText:q.frase,correctedText:corrected,fraseNormativa:corrected,changedSegment:diff,quick,whyCorrect:why,examTrap:r.examTrap,memoryTip:r.memoryTip,exampleGood:r.exampleGood,...(anomalyReason?{anomalyReason,advisoryCorrection:corrected}:{}),linguisticReview:'editorial-context-review',provenanceNote:'Texto y clave del banco preservados; sin cotejo con plantilla oficial.'});
}
for(const q of read('data/grammar/official.json').oficial){const m=q.id.match(/^(oficial-\d+)-(\d+)(?:-op(\d+))?$/);const index=m[3]?(+m[2]-1)*4+(+m[3]-1):+m[2]-1;makeGrammar(q,'official',mapping[m[1]][index]);}
read('data/grammar/training.json').nuevas.forEach((q,i)=>makeGrammar(q,'training',trainingRules[Math.floor(i/20)]));

// Official orthography corrections are keyed by occurrence, not by a global word dictionary.
const officialCorrections = {
 'oficial-1-1':{4:'vasta'},'oficial-1-2':{1:'habilidad',3:'fe'},'oficial-1-3':{3:'alboroto'},'oficial-1-4':{3:'revelar'},'oficial-1-5':{1:'desalojo',2:'enredadera',4:'excesivo'},
 'oficial-3-1':{1:'pajarillos',3:'revoloteaban'},'oficial-3-2':{2:'vio'},'oficial-3-3':{3:'hechos',4:'abominables'},'oficial-3-4':{3:'hocico'},'oficial-3-5':{2:'existen'},
 'oficial-5-1':{1:'Cogí',3:'devolví'},'oficial-5-2':{1:'girar',4:'gente'},'oficial-5-3':{1:'dije',2:'movilidad',4:'gustaba'},'oficial-5-4':{1:'Buceando',4:'venerado'},'oficial-5-5':{2:'bienestar',3:'beneficencia'},'oficial-5-6':{1:'Vizconde',3:'extrañaba',4:'extraordinariamente'},'oficial-5-7':{1:'injerto',4:'vergel'},'oficial-5-8':{3:'espontánea',4:'extravagante'},'oficial-5-9':{3:'bajan'},'oficial-5-10':{2:'revenido',4:'encogido'},
 'oficial-6-1':{4:'lacerante'},'oficial-6-2':{2:'desvencijado',3:'desvaneció'},'oficial-6-3':{1:'histriónico',4:'inefable'},'oficial-6-4':{1:'Escrutaba',2:'gerente',3:'execrable'},'oficial-6-5':{1:'litigio',2:'suburbio',3:'subyugó',4:'sucumbir'},'oficial-6-6':{1:'virulenta',2:'ebullición',4:'virtuoso'},'oficial-6-7':{1:'Yantaba',3:'haber'},'oficial-6-8':{1:'Apercibió',3:'hostigamiento'},'oficial-6-9':{2:'benevolente',4:'cónyuge'},'oficial-6-10':{3:'aboquillado'},
 'oficial-7-1':{1:'acalambrarse',3:'abigarrado'},'oficial-7-2':{1:'devaluación',2:'devoción',4:'devaneador'},'oficial-7-3':{1:'facsímil',2:'adyacente'},'oficial-7-4':{1:'halitosis',4:'obvio'},'oficial-7-5':{1:'ujier',2:'ufano',3:'ubicó',4:'úlcera'},'oficial-7-6':{1:'Vituperó',3:'avituallador',4:'grageas'},'oficial-7-7':{1:'A ver',3:'halaga',4:'rival'},'oficial-7-8':{2:'axiológica',3:'afligido'},'oficial-7-9':{2:'divergencia',3:'axioma'},'oficial-7-10':{1:'abotagamiento',3:'abochornó'},
 'oficial-8-1':{1:'adicción',3:'cocaína'},'oficial-8-2':{1:'legionarios',3:'liturgia'},'oficial-8-3':{},'oficial-8-4':{3:'ungüento',4:'labios'},'oficial-8-5':{1:'Sorbía',4:'bisnieto'},
 'oficial-9-1':{1:'hurgaba',3:'había'},'oficial-9-2':{2:'callejeando',3:'angostos'},'oficial-9-3':{1:'beligerantes',3:'hipnotizados'},'oficial-9-4':{},'oficial-9-5':{4:'vocales'},
 'oficial-11-1':{1:'Momentáneamente',3:'apabullado'},'oficial-11-2':{3:'chabola'},'oficial-11-3':{2:'fueron',4:'exculpados'},'oficial-11-4':{4:'constipar'},'oficial-11-5':{2:'burlado',3:'indígenas',4:'vudú'},
 'oficial-13-1':{1:'habilitación',2:'condición',4:'adquirir'},'oficial-13-2':{1:'cocinero',3:'hirviendo'},'oficial-13-3':{1:'holograma',2:'experiencia'},'oficial-13-4':{1:'extranjero',3:'dubitativo'},'oficial-13-5':{1:'huellas'},
 'oficial-15-1':{1:'región',2:'usar'},'oficial-15-2':{2:'celda',3:'embarrado'},'oficial-15-3':{1:'hortelano',2:'cebollas'},'oficial-15-4':{4:'desmayó'},'oficial-15-5':{2:'autobús',3:'atropelló'},
 'oficial-17-1':{1:'árbol',2:'hecho',4:'enrojecidas'},'oficial-17-2':{1:'vizconde',4:'económicamente'},'oficial-17-3':{1:'bicolor',2:'estaba',4:'avería'},'oficial-17-4':{1:'dedujimos',2:'hombre sexagenario'},'oficial-17-5':{1:'constipado',2:'hizo',4:'oposición'},
 'oficial-19-1':{3:'sobrecogió',4:'corregidor'},'oficial-19-2':{3:'apoteosis',4:'evento'},'oficial-19-3':{2:'vasallo',3:'desasir'},'oficial-19-4':{1:'agalla',2:'excrecencia'},'oficial-19-5':{1:'Deambular',2:'erial',3:'embrollaba'},'oficial-19-6':{3:'quejido',4:'debla'},'oficial-19-7':{2:'esclavina',3:'atezada',4:'boga'},'oficial-19-8':{1:'A ver',2:'acarreás'},'oficial-19-9':{2:'bulbo',4:'jengibre'},'oficial-19-10':{2:'bóveda',4:'majestuosa'},
 'oficial-20-1':{1:'dije'},'oficial-20-2':{1:'Anhelo',2:'sigáis'},'oficial-20-3':{1:'gendarmes',2:'cogiendo',3:'caravanas',4:'oriundos'},'oficial-20-4':{3:'horrendos'},'oficial-20-5':{2:'hasta',4:'exhausto'},'oficial-20-6':{1:'Sustrajeron',3:'cavidad'},'oficial-20-7':{1:'conminaba',4:'envergadura'},'oficial-20-8':{},'oficial-20-9':{1:'improvisar',2:'aprovisionamiento',3:'viandas'},'oficial-20-10':{1:'azada',3:'guadaña',4:'herrumbre'},
 'oficial-21-1':{3:'ágape'},'oficial-21-2':{1:'dijimos',3:'satisficiera'},'oficial-21-3':{3:'recibieron'},'oficial-21-4':{3:'extraños'},'oficial-21-5':{2:'embistió'},'oficial-21-6':{1:'Debéis',2:'produjeron',3:'exhumaciones'},'oficial-21-7':{2:'condujeron',3:'Nicaragua'},'oficial-21-8':{},'oficial-21-9':{1:'exánime',2:'trágico',3:'encomiable',4:'hazañas'},'oficial-21-10':{2:'pececillos',4:'erráticos'},
 'oficial-22-1':{1:'ha'},'oficial-22-2':{3:'cerrajería',4:'acero'},'oficial-22-3':{1:'¿Por qué',2:'solo',4:'trajeses'},'oficial-22-4':{2:'fobias'},'oficial-22-5':{2:'observaban',3:'expectantes',4:'función'},'oficial-22-6':{1:'terapia',3:'terapeuta'},'oficial-22-7':{1:'Cogió',3:'paraguas',4:'botas'},'oficial-22-8':{1:'Atribuyeron',2:'huellas',3:'rehenes'},'oficial-22-9':{},'oficial-22-10':{3:'vaivenes',4:'atalaya'},
 'oficial-23-1':{1:'Coged',2:'esas',3:'herramientas'},'oficial-23-2':{},'oficial-23-3':{2:'anorexia',3:'relacionadas',4:'ingesta'},'oficial-23-4':{2:'prohíbe',4:'hirviendo'},'oficial-23-5':{2:'vergüenza',3:'enarbolar',4:'extranjera'},'oficial-23-6':{2:'reveló'},'oficial-23-7':{2:'osamenta'},'oficial-23-8':{},'oficial-23-9':{2:'finalmente',3:'amplia',4:'explanada'},'oficial-23-10':{2:'documentación',3:'enviasteis',4:'rellenar'}
};
const OA = {
 'oficial-8-1:2':['El banco marca B, pero la palabra conservada opíaceos desplaza la tilde; la forma normativa es opiáceos.','opiáceos'],
 'oficial-11-4:2':['El banco marca B para refujio, pero el sustantivo se escribe refugio.','refugio'],
 'oficial-20-8:3':['El banco marca B para acerbo, pero un conjunto de normas es un acervo; acerbo significa áspero o cruel.','acervo'],
 'oficial-19-7:3':['El elemento hatazada no coincide con hatezada en la frase: hay corrupción de transcripción. Atezada es una lectura editorial posible, no una reconstrucción acreditada.','atezada'],
 'oficial-22-7:1':['Cojá no permite recuperar con certeza el tiempo ni la persona originales; cogió encaja con se marchó, pero es una hipótesis editorial.','Cogió'],
 'oficial-5-6:3':['Estranaba parece una transcripción dañada. Extrañaba encaja con las comidas en el extranjero, pero no acredita el texto original.','extrañaba'],
 'oficial-5-8:4':['Estravagantante tiene una secuencia duplicada o corrupta; extravagante es una reconstrucción editorial probable.','extravagante'],
 'oficial-6-7:1':['Llantaba no identifica de forma segura el verbo original. Yantaba (comía) es una lectura posible para la yegua; no está acreditada por una plantilla.','Yantaba'],
 'oficial-21-4:3':['Estrafios parece una lectura OCR de extraños; el sentido lo permite, pero no garantiza la grafía original.','extraños']
};
const specifics={
 'oficial-1-1:4':'La llanura es extensa: corresponde vasta con v. Basta con b significa tosca o es una forma de bastar.',
 'oficial-1-4:3':'Descubrir un misterio es revelar con v; rebelar con b se relaciona con la rebelión.',
 'oficial-1-2:3':'Fe es monosílaba y no tiene pareja que exija tilde diacrítica; se escribe sin tilde.',
 'oficial-1-5:2':'Después de n se escribe r sencilla aunque suene fuerte: enredadera, como enredar.',
 'oficial-3-2:2':'Vio se considera monosílaba a efectos de acentuación y no lleva tilde.',
 'oficial-3-2:3':'Aquí traje es el sustantivo que nombra una prenda; se escribe con j y sin tilde por ser llana terminada en vocal.',
 'oficial-3-2:4':'Aquí traje es la primera persona del pretérito de traer; su raíz irregular es traj-, con j.',
 'oficial-3-3:3':'Los actos cometidos son hechos, participio sustantivado de hacer, y llevan h.',
 'oficial-6-7:3':'Tras introduce el infinitivo compuesto haber deambulado; a ver no forma tiempos compuestos.',
 'oficial-7-7:1':'A ver si expresa expectación; puede entenderse como veamos si.',
 'oficial-8-1:1':'La dependencia de sustancias es adicción, con doble c; adición significa suma.',
 'oficial-9-5:4':'Las cuerdas de la voz son vocales con v; bucal se relaciona con la boca.',
 'oficial-11-3:2':'Fueron es llana terminada en n y no lleva tilde; ue se mantiene como diptongo.',
 'oficial-15-4:1':'Asta sin h nombra el cuerno del animal; no es la preposición hasta.',
 'oficial-17-1:2':'Está hecho usa el participio de hacer con h; echo es una forma de echar.',
 'oficial-17-1:4':'Después de n la r puede representar el sonido fuerte sin duplicarse: enrojecidas, de enrojecer.',
 'oficial-19-8:1':'A ver si contiene la preposición a y el verbo ver, no el infinitivo haber.',
 'oficial-19-8:2':'Acarreás sin h es una forma voseante válida; con tuteo sería acarreas. El contexto no obliga a cambiar la variante personal.',
 'oficial-20-5:2':'Hasta que expresa el límite temporal; aquí no se habla de un asta o cuerno.',
 'oficial-21-2:4':'Creísteis lleva tilde en la i tónica porque forma hiato con la e anterior: cre-ís-teis. No debe confundirse con pretéritos como fuisteis o enviasteis.',
 'oficial-22-1:1':'Ha ordenado es un tiempo compuesto de haber; la preposición a no puede ser auxiliar.',
 'oficial-22-3:1':'La pregunta por una causa usa por qué separado y con tilde; porqué unido es un sustantivo.',
 'oficial-22-3:2':'Solo equivale aquí a sin compañía y funciona como adjetivo: no lleva tilde.',
 'oficial-22-6:1':'Terapia es llana terminada en vocal; la secuencia ia forma diptongo en esta palabra y no requiere tilde.',
 'oficial-22-6:3':'Terapeuta es llana terminada en vocal y no lleva tilde; eu constituye el diptongo de la sílaba tónica.',
 'oficial-22-7:3':'Paraguas contiene gua, donde la u ya se pronuncia sin diéresis. Los dos puntos se usan para güe o güi.',
 'oficial-23-1:2':'Esas determina al sustantivo herramientas; los demostrativos determinantes no llevan tilde.',
 'oficial-23-6:2':'La autopsia puso al descubierto lesiones: reveló con v; rebeló con b se refiere a una rebelión.',
 'oficial-23-9:2':'Finalmente conserva la ausencia de tilde de final al añadir -mente; no se añade una tilde en mente.',
 'oficial-23-9:3':'Amplia es llana terminada en vocal y no lleva tilde; no es la forma verbal amplía.',
 'oficial-23-10:3':'Enviasteis es llana terminada en s y no lleva tilde; no se debe trasladar la tilde de envié a todas las formas del pretérito.'
};
const familyRules={
 'B/V':['B y v en el léxico','B y v representan el mismo sonido en el español general; su elección se aprende con la forma y familia de cada palabra.','b','La biblioteca conserva varios volúmenes.','Asocia cada palabra con su familia escrita.','El oído no permite decidir por sí solo entre b y v.','bv'],
 'G/J':['G y j ante e, i','Ante e o i, g y j pueden representar el mismo sonido; cada palabra y su familia determinan la grafía.','g','El general corrigió la agenda.','Relaciona corregir con corregido.','La coincidencia de sonido no autoriza a intercambiar g y j.','consonant-spellings'],
 'H':['H y palabras homófonas','La h normalmente no representa sonido; su presencia pertenece a la grafía de la palabra y puede distinguir significados.','h','El huerto estaba húmedo.','Comprueba la familia y el significado, no solo el sonido.','No borres una h porque no se pronuncie.','h-accent'],
 'Acentuación':['Tildes, hiatos y palabras compuestas','La tilde marca la sílaba tónica según las reglas de acentuación o distingue determinadas funciones.','tilde','El árbol crecía junto al río.','Localiza primero dónde recae la voz.','Una tilde añadida por intuición puede crear otra pronunciación.','h-accent'],
 'Diéresis':['Diéresis en güe y güi','La diéresis hace que se pronuncie la u en güe y güi; no se usa con gua o guo.','diéresis','La cigüeña extendió las alas.','Güe y güi necesitan dos puntos para que suene la u.','No añadas diéresis a paraguas.','h-accent'],
 'LL/Y':['Distinción escrita de ll e y','Ll e y siguen grafías distintas aunque muchos hablantes las pronuncien igual.','y','Hallaron huellas junto a la valla.','El diminutivo -illo se escribe con ll.','El yeísmo no permite sustituir ll por y al escribir.','consonant-spellings'],
 'X/S':['X y s en la escritura','X y s pertenecen a grafías distintas; la pronunciación simplificada de x no cambia la escritura.','x','La excursión cruzó una explanada.','Conserva ex- en explanada y experiencia.','Pronunciar una x como s no convierte la palabra en una grafía con s.','consonant-spellings'],
 'C/S/Z':['C, s y z en las familias léxicas','C, s y z no son intercambiables; el seseo no cambia su distribución escrita.','c','El cocinero cerró la cocina.','Relaciona cocinero con cocina.','La variedad de pronunciación no modifica la grafía normativa.','consonant-spellings'],
 'Grafía':['Secuencias de letras y familias léxicas','Los grupos de letras y las formas verbales deben conservar la escritura de la palabra y su conjugación.','ortografía','El hombre recibió un mensaje.','Compara la raíz y la terminación por separado.','Una forma familiar al oído puede contener letras omitidas o duplicadas.','consonant-spellings'],
 'Lexical':['Grafía léxica conservada','Una palabra correctamente escrita conserva las letras y los signos propios de su forma; los errores de otra palabra no la alteran.','ortografía','El informe llegó esta mañana.','Revisa cada elemento por separado.','No marques una palabra correcta solo porque la frase contenga otros errores.',undefined]
};
const FR={};for(const [f,[title,plain,entry,example,tip,trap,topic]] of Object.entries(familyRules))FR[f]=rule(`ortho-${f.toLowerCase().replaceAll('/','-')}`,title,plain,entry,example,tip,trap,topic,['ortografía'].includes(entry)?'dle':'dpd');
const orthoVerbRules = [
 [['dije','dijimos'], 'decir', 'Decir tiene pasado irregular con j: dije, dijimos.', 'Ayer dije la verdad.', 'Dijo se escribe con j; dijimos conserva esa raíz.'],
 [['sustrajeron','trajeses'], 'traer', 'Traer y sus derivados forman el pasado con traj-; sustraer tiene sustraj-.', 'Trajeron dos mantas.', 'Trajo ayuda a recordar trajeron y sustrajeron.'],
 [['dedujimos','produjeron','condujeron'], 'conducir', 'Los verbos en -ducir forman el pasado con -duj- y el plural en -dujeron.', 'Produjeron suficientes alimentos.', 'Condujo conserva la j en condujeron.'],
 [['satisficiera'], 'satisfacer', 'Satisfacer sigue a hacer; el imperfecto de subjuntivo es satisficiera o satisficiese.', 'Buscaba algo que lo satisficiera.', 'Hiciera se reconoce dentro de satisficiera.'],
 [['gustaba','estaba','observaban'], 'b', 'Las terminaciones -aba, -abas, -ábamos, -abais y -aban se escriben con b.', 'Cantaban mientras trabajaban.', 'El imperfecto de los verbos en -ar conserva -aba.'],
 [['atribuyeron'], 'atribuir', 'Atribuir forma la tercera persona del pretérito con y: atribuyó, atribuyeron.', 'Atribuyeron el dibujo a otra autora.', 'Atribuyó conserva la y en atribuyeron.'],
 [['cogí','cogiendo','coged','sobrecogió','encogido'], 'coger', 'Coger y sus derivados conservan g delante de e e i; se usa j delante de a y o cuando se mantiene el mismo sonido.', 'Cogieron la cuerda.', 'Coger y cogido comparten g; coja cambia ante a.']
];
const orthoVerbIndex=new Map();
for(const [words,entry,plain,example,tip]of orthoVerbRules){const id=rule(`ortho-verb-${entry}`,`Grafía de las formas de ${entry==='b'?'imperfecto en -aba':entry}`,plain,entry,example,tip,'Una conjugación irregular no se obtiene cambiando solo la terminación.', 'consonant-spellings');for(const w of words)orthoVerbIndex.set(w,id);}
function accentReason(word){const w=word.normalize('NFC');if(/mente$/i.test(w))return `«${word}» conserva la acentuación del adjetivo base al añadirse -mente.`;if(/[aeo][íú]|[íú][aeo]/i.test(w))return `En «${word}», la vocal cerrada tónica í o ú forma hiato con la vocal abierta contigua y lleva tilde.`;if(/^[Éé]l$|^tú$|^té$|^más$/i.test(w))return `La tilde de «${word}» distingue aquí su función de la forma átona sin tilde.`;if(/[áéó][nñs]$/i.test(w)||/[íú]$/i.test(w))return `«${word}» es aguda terminada en vocal, n o s y por ello lleva tilde.`;if(/[áéíóú]/i.test(w))return `La tilde de «${word}» señala su vocal tónica conforme a la acentuación de esta forma; debe conservarse en esa vocal.`;return '';}
function family(a,b){const aa=a.normalize('NFC'),bb=b.normalize('NFC');if(aa!==bb){const strip=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(strip(aa)===strip(bb))return /ü/.test(aa+bb)?'Diéresis':'Acentuación';const d=minimalDiff(aa.toLowerCase(),bb.toLowerCase()),pair=d.before+d.after;if(/^[bv]+$/.test(pair))return'B/V';if(/^[h]+$/.test(pair))return'H';if(/^[gj]+$/.test(pair))return'G/J';if(/^[ly]+$/.test(pair))return'LL/Y';if(/^[xs]+$/.test(pair))return'X/S';if(/^[csz]+$/.test(pair))return'C/S/Z';return'Grafía';}if(/[áéíóú]/i.test(bb))return'Acentuación';if(/ü/i.test(bb))return'Diéresis';if(/h/i.test(bb))return'H';if(/ll|y/i.test(bb))return'LL/Y';if(/b|v/i.test(bb))return'B/V';if(/g[ei]|j/i.test(bb))return'G/J';if(/x/i.test(bb))return'X/S';return'Lexical';}
function feature(word){const w=word.normalize('NFC');const groups=[...new Set(w.match(/ll|rr|ch|qu|gü|gu[ei]|[bvjhxñ]|[áéíóúü]/gi)||[])];return groups.length?`La escritura de «${word}» conserva ${groups.map(g=>`«${g}»`).join(', ')}.`:`La forma «${word}» se conserva completa: no necesita añadir, quitar ni cambiar letras o tildes.`;}
const orthographyPedagogy={
 'envergadura':{
  why:'«Envergadura» se escribe con la secuencia en-ver-ga-du-ra: después de en- aparece v. La grafía «embergadura» altera la forma de esta palabra; no debe presentarse el cambio mb → nv como una regla general.',
  examTrap:'No apliques automáticamente la regla de m ante b: aquí la palabra correcta lleva n seguida de v, «envergadura».',
  memoryTip:'Sepárala mentalmente: en-ver-ga-du-ra. El tramo clave es «nv».',
  exampleGood:'El avión tiene una gran envergadura.'
 },
 'conminaba':{
  why:'«Conminaba» es una forma del verbo «conminar» y conserva la n de su familia: conminar, conminaba, conminación. El imperfecto de los verbos en -ar añade la terminación -aba.',
  examTrap:'No dupliques la m por semejanza sonora: la raíz es conmin-, con n.',
  memoryTip:'Conminar → conminaba → conminación: la familia conserva n.',
  exampleGood:'El juez lo conminaba a cumplir la resolución.'
 },
 'residuos':{
  why:'«Residuos» es el plural de «residuo»: conserva íntegra la base residuo y añade -s. No necesita tilde ni cambio de letras.',
  examTrap:'No marques como incorrecta una palabra bien escrita solo porque en la misma frase haya otros elementos con error.',
  memoryTip:'Residuo → residuos: solo se añade la -s del plural.',
  exampleGood:'Los residuos deben depositarse en el contenedor adecuado.'
 }
};
function orthographyTeaching(correct,e,diff,r,baseWhy){
 const curated=orthographyPedagogy[correct.toLowerCase()];
 if(curated)return {...curated,why:curated.why};
 const changed=e.respuesta==='M';
 const segmentAfter=diff.after||correct;
 const segmentBefore=diff.before||'';
 const memoryTip=changed
  ?`Fija la grafía completa «${correct}»${segmentAfter?` y, en especial, el tramo «${segmentAfter}»`:''}.`
  :`Fija la forma completa «${correct}» y no la cambies por contagio de otros errores de la frase.`;
 const examTrap=changed
  ?`No sustituyas ${segmentAfter?`«${segmentAfter}»`: 'la grafía correcta'}${segmentBefore?` por «${segmentBefore}»`:''} solo por semejanza sonora o visual.`
  :`Una palabra correcta no se vuelve incorrecta porque otro elemento de la misma frase sí lo sea.`;
 const exampleGood=`La palabra «${correct}» se escribe exactamente así en este contexto.`;
 return {why:baseWhy,memoryTip,examTrap,exampleGood};
}
const orthography=[];
function makeOrtho(q,e,source){const id=`${q.id}:${e.posicion}`;const correct=e.respuesta==='B'?e.texto:source==='training'?e.forma_correcta:officialCorrections[q.id]?.[e.posicion];if(!correct)throw new Error(`Missing ortho ${id}`);const diff=minimalDiff(e.texto.normalize('NFC'),correct.normalize('NFC'));const f=family(e.texto,correct),r=rules.get(orthoVerbIndex.get(correct.toLowerCase())||FR[f]);const anomaly=source==='official'?OA[id]:null;
 const explanation=orthoVerbIndex.has(correct.toLowerCase())?`La forma «${correct}» sigue esta pauta: ${r.plain}`:f==='Acentuación'&&accentReason(correct)||feature(correct);
 const why=anomaly?anomaly[0]:(specifics[id]||(e.respuesta==='M'?`La forma «${correct}» requiere ${diff.before?`sustituir «${diff.before}»`:'añadir el segmento omitido'} ${diff.after?`por «${diff.after}»`:'sin conservarlo'}. ${explanation}`:`${explanation} La marca B corresponde a mantener exactamente esta grafía.`));
 const teaching=orthographyTeaching(correct,e,diff,r,why);
 orthography.push({id,questionId:q.id,posicion:e.posicion,source,status:anomaly?'anomaly':'editorial',sourceVerified:false,acceptedKeys:[e.respuesta],expectedBM:e.respuesta,conceptId:r.id,topicId:r.topicId,ruleId:r.id,originalText:e.texto,texto:e.texto,correctedText:correct,formaCorrecta:correct,changedSegment:diff,family:f,originalPhrase:q.frase,quick:anomaly?`Hay conflicto en el elemento «${e.texto}»: requiere revisión humana.`:e.respuesta==='B'?`«${e.texto}» se conserva, sin cambiar letras ni tildes.`:`En este contexto debe escribirse «${correct}».`,whyCorrect:teaching.why,examTrap:teaching.examTrap,memoryTip:teaching.memoryTip,exampleGood:teaching.exampleGood,...(anomaly?{anomalyReason:anomaly[0],advisoryCorrection:anomaly[1]}:{}),...(source==='training'?{bankRule:e.regla,metadataRuleDisagrees:e.regla!==f&&e.regla!=='Grafía correcta'}:{}),linguisticReview:'editorial-context-review',provenanceNote:'Texto y clave preservados; las referencias sustentan la regla, no acreditan una plantilla oficial.'});
}
for(const exam of read('data/orthography/official.json').oficial)for(const q of exam.preguntas)for(const e of q.elementos_destacados)makeOrtho(q,e,'official');
for(const q of read('data/orthography/training.json').nuevas)for(const e of q.elementos_destacados)makeOrtho(q,e,'training');
save('orthography',{version:1,records:orthography});save('grammar',{version:1,records:grammar});save('spanish-rules',{version:1,rules:[...rules.values()]});
const counts=records=>Object.fromEntries(['official','training'].map(source=>[source,Object.fromEntries(['editorial','anomaly'].map(status=>[status,records.filter(r=>r.source===source&&r.status===status).length]))]));
const anomalies=[...orthography.map(r=>({...r,module:'Ortografía'})),...grammar.map(r=>({...r,module:'Gramática'}))].filter(r=>r.status==='anomaly');
fs.writeFileSync('reports/professor-spanish-audit.md',`# Auditoría del Profesor: español\n\nLos seis bancos y baseline.json no son salidas de este generador. La cobertura materializada es de 2480 elementos ortográficos y 640 frases gramaticales. Todos los dictámenes son editoriales o anomalías: no se cotejó ninguna clave con una plantilla oficial.\n\n## Cobertura\n\n\`\`\`json\n${JSON.stringify({orthography:counts(orthography),grammar:counts(grammar)},null,2)}\n\`\`\`\n\n## Revisión lingüística\n\nSe revisaron los 120 contextos ortográficos oficiales, sus 480 elementos (237 M y 243 B), las 140 frases gramaticales oficiales y las familias de entrenamiento. Las correcciones oficiales ortográficas están asignadas por ID y posición, incluidas las dos apariciones de asta. Se verificaron invariantes B/M, diferencias y pertenencia a las familias; se conservan como bankRule las etiquetas de entrenamiento, algunas imprecisas, y se explica la grafía real en el archivo lateral.\n\nLas explicaciones antiguas genéricas no se reutilizan. En particular Dime lo que tengo que hacer y El coche llevo mucho tiempo sin usarlo evitan dos reparaciones incorrectas anteriores. La lectura acarreás se conserva como voseo, sin imponer tuteo.\n\nLa consulta normativa de DPD confirmó la doble concordancia con mayoría, la posible simultaneidad del gerundio y los usos cultos compartidos de deber/deber de. Estas familias contienen claves M discutibles y se señalan, sin cambiarlas. Las anomalías no acreditan una nueva clave ni alteran automáticamente la puntuación del banco.\n\nReferencias consultadas: [haber](https://www.rae.es/dpd/haber), [leísmo](https://www.rae.es/dpd/le%C3%ADsmo), [concordancia](https://www.rae.es/dpd/concordancia), [deber](https://www.rae.es/dpd/deber), [gerundio](https://www.rae.es/dpd/gerundio), [delante](https://www.rae.es/dpd/delante), [tilde](https://www.rae.es/dpd/tilde), [dequeísmo](https://www.rae.es/dpd/deque%C3%ADsmo), [elefante](https://www.rae.es/dpd/elefante), [duodécimo](https://www.rae.es/dpd/duod%C3%A9cimo). Las otras referencias de regla son orientación normativa enlazada, sin afirmar cotejo individual de plantilla.\n\n## Anomalías que exigen revisión humana\n\n| Módulo | ID | Clave conservada | Motivo |\n|---|---|---|---|\n${anomalies.map(r=>`| ${r.module} | ${r.id} | ${r.expectedBM} | ${r.anomalyReason.replaceAll('|','/')} |`).join('\n')}\n\n## Límites\n\nLa comprobación estructural automática no equivale a revisión lingüística independiente ni a cotejo con originales oficiales. Las reconstrucciones de grafías corruptas se muestran como propuestas editoriales y nunca como certeza documental. El catálogo temático conserva sus filtros y conteos solicitados aunque existan anomalías pedagógicas: resolver las claves requiere una autorización separada.\n`);
console.log(JSON.stringify({orthography:counts(orthography),grammar:counts(grammar),rules:rules.size,anomalies:anomalies.length},null,2));
