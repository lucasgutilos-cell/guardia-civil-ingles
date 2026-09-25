// Offline materializer. The application reads the reviewed JSON; it never runs this script.
import fs from 'node:fs';
import {loadBanks} from './banks.mjs';
import {questionTopic} from '../assets/js/services/topics.js';
import {reconstructEnglish,hasGap} from '../assets/js/services/professor.js';

const BC='https://learnenglish.britishcouncil.org/free-resources/grammar/';
const CAM='https://dictionary.cambridge.org/grammar/british-grammar/';
const catalog={};
function rule(id,title,plain,tip,example,topic,url){catalog[id]={id:'en-'+id,title,plain,sourceRefs:[{name:url.startsWith(CAM)?'Cambridge English Grammar Today':'British Council LearnEnglish',url}],tip,example,topic};}
rule('be','Be: persona, número y tiempo','Be cambia según el sujeto: I am; he/she/it is; you/we/they are. En pasado se usa was o were.','Localiza primero el sujeto; después elige am/is/are o was/were.','The visitors were outside the museum.','verb-tenses',BC+'english-grammar-reference/verb-be');
rule('present','Presente simple y concordancia','Los hábitos se expresan normalmente en presente simple. La tercera persona singular añade -s; con do/does el verbo principal queda en forma base.','La -s aparece una sola vez: she works, does she work?','Our neighbour waters the plants every evening.','verb-tenses',BC+'english-grammar-reference/present-simple');
rule('continuous','Be + verbo en -ing','El continuo combina be conjugado con la forma en -ing. Sirve para acciones en curso y para planes concretados.','Una acción en marcha necesita dos piezas: be + -ing.','The mechanic is checking a motorcycle.','verb-tenses',BC+'english-grammar-reference/present-continuous');
rule('past','Pasado simple y verbos irregulares','Un hecho situado en un pasado terminado usa pasado simple. Después de did/did not el verbo vuelve a su forma base.','Did ya marca el pasado: no lo marques otra vez en el verbo.','We caught the last bus yesterday.','verb-tenses',BC+'english-grammar-reference/past-simple');
rule('past-continuous','Acción de fondo y suceso en pasado','Was/were + -ing presenta una acción en desarrollo; el pasado simple puede introducir el hecho que ocurrió durante ella.','Imagina una escena en marcha y el hecho que la interrumpe.','I was washing a cup when the door opened.','verb-tenses',BC+'english-grammar-reference/past-continuous');
rule('perfect','Have/has + participio','El present perfect se forma con have/has y participio; vincula una experiencia o duración pasada con el presente.','Tras have o has busca el participio, no el pasado simple.','Nora has written three reports today.','verb-tenses',BC+'english-grammar-reference/present-perfect');
rule('past-perfect','Had + participio: pasado anterior','Had + participio sitúa un hecho antes de otro punto del pasado. El participio mantiene su forma con todos los sujetos.','Dibuja dos hechos pasados: had señala el anterior.','The shop had closed when we reached the square.','verb-tenses',BC+'english-grammar-reference/past-perfect');
rule('future','Will y be going to','Will va seguido de forma base; be going to necesita be conjugado y to. El contexto distingue decisiones, predicciones y planes.','Will go y is going to go son cadenas completas; no mezcles sus piezas.','I will carry the smaller suitcase.','conditionals-future',BC+'english-grammar-reference/talking-about-future');
rule('future-perfect','Will have + participio','El futuro perfecto usa will have + participio para un hecho terminado antes de un límite futuro; will have been + -ing destaca su duración.','Límite futuro: by Friday; resultado anterior: will have finished.','By June, Maya will have completed the course.','conditionals-future',BC+'b1-b2/future-continuous-future-perfect');
rule('conditional1','Condición posible: if/unless + presente','Para una condición futura posible, la subordinada suele llevar presente y el resultado will + forma base. Unless equivale a if not.','No añadas will automáticamente detrás de if o unless.','Unless it rains, we will eat outside.','conditionals-future',BC+'b1-b2/conditionals-zero-first-second');
rule('conditional2','Hipótesis: pasado + would','La segunda condicional combina una condición hipotética en pasado con would + forma base para su resultado.','If I knew, I would tell: pasado en la condición, would en el resultado.','If I owned a boat, I would sail every weekend.','conditionals-future',BC+'b1-b2/conditionals-zero-first-second');
rule('conditional3','Hipótesis pasada: had + participio','Una condición irreal pasada lleva had + participio; su resultado usa would have + participio.','El pasado imposible tiene dos cadenas: had done y would have done.','If we had left earlier, we would have caught the ferry.','conditionals-future',BC+'b1-b2/conditionals-third-mixed');
rule('modal','Modal + forma base','Can, could, may, might, must y should van seguidos de forma base sin to y no añaden -s con he/she/it.','Después de un modal, deja el verbo desnudo: can swim.','You should rest before the journey.','modals-obligation',BC+'english-grammar-reference/modal-verbs');
rule('ability','Can, could y be able to','Can/could van con infinitivo sin to. Be able to necesita be conjugado y to; el futuro se construye con will be able to.','Will no se combina con can: cambia a will be able to.','After the course, Leo will be able to drive a lorry.','modals-obligation',BC+'english-grammar-reference/can-could');
rule('obligation','Must, have to y need','Must va sin to; have to se conjuga y permite had to, will have to o may have to. Need como verbo ordinario usa does not need to.','Must go, had to go; conserva un solo to.','Yesterday we had to leave the building early.','modals-obligation',BC+'b1-b2/modals-permission-obligation');
rule('passive','Voz pasiva: be + participio','En pasiva, el sujeto recibe la acción. Se conjuga be y se añade el participio; by introduce al agente cuando se menciona.','Identifica quién recibe la acción antes de elegir activa o pasiva.','The bridge was repaired by a local company.','passive-voice',BC+'b1-b2/passives');
rule('voice-choice','Voz activa o pasiva: identifica el agente','En activa, el sujeto realiza la acción. En pasiva, el sujeto la recibe y normalmente se usa be + participio; by puede introducir al agente.','Pregunta primero: ¿el sujeto hace la acción o la recibe? Después comprueba el tiempo verbal.','Mr Johnson translated the book. / The book was translated by Mr Johnson.','passive-voice',BC+'b1-b2/passives');
rule('tag','Question tags: auxiliar y sujeto','La coletilla reproduce el auxiliar y un pronombre sujeto. Para pedir confirmación normalmente invierte la polaridad; otros usos dependen de entonación y contexto.','Copia el auxiliar, comprueba el sujeto y después la polaridad.','Eva has arrived, hasn’t she?','relatives-questions',CAM+'question-tags');
rule('relative','Pronombres relativos y función','Who se refiere a personas, which a cosas y whose expresa posesión. En relativas especificativas that puede sustituir a who/which; el relativo objeto puede omitirse.','Decide si el hueco es sujeto, objeto, posesión o lugar.','The artist who painted this mural lives nearby.','relatives-questions',BC+'english-grammar-reference/relative-pronouns-relative-clauses');
rule('question','Preguntas directas e indirectas','Las preguntas directas suelen colocar el auxiliar antes del sujeto; las indirectas conservan sujeto + verbo. How long pregunta duración y how often frecuencia.','Distingue Where does she work? de Do you know where she works?','How often does Clara visit the library?','relatives-questions',BC+'english-grammar-reference/questions-negatives');
rule('pronoun','Pronombres personales, posesivos y reflexivos','La forma depende de la función: they es sujeto, them objeto y their posesivo ante nombre. Los reflexivos concuerdan con su referente: himself, herself, ourselves, themselves.','Señala quién recibe la acción y si coincide con el sujeto.','The twins prepared the meal themselves.','relatives-questions',BC+'english-grammar-reference/personal-pronouns');
rule('possessive','Genitivo sajón','El poseedor lleva ’s; un plural ya terminado en -s añade solo apóstrofo. No se duplica el determinante del nombre poseído.','Una persona: Emma’s bag; varias chicas: the girls’ bags.','The neighbours’ garden has a new fence.','quantifiers-nouns',BC+'english-grammar-reference/possessives-nouns');
rule('quantifier','Cantidad y sustantivos contables','Many y (a) few acompañan contables plurales; much y (a) little, incontables. A lot of sirve con ambos cuando sigue un sustantivo.','Cuenta unidades: few coins; mide cantidad: little money.','We bought a few oranges and a little rice.','quantifiers-nouns',BC+'english-grammar-reference/quantifiers');
rule('some-any','Some, any y artículos','Some es habitual en afirmativas y ofertas; any, en negativas y preguntas neutrales. A/an acompaña un contable singular; an precede sonido vocálico.','No conviertas una cantidad de leche en una unidad con a/an.','There is some cheese, but there are not any crackers.','quantifiers-nouns',BC+'english-grammar-reference/quantifiers');
rule('noun','Número, artículo y forma del sustantivo','Un contable singular suele necesitar determinante. Los plurales y los incontables se comportan de modo distinto; furniture, information y news no añaden -s por cantidad.','Antes de poner a o -s, decide si puedes contar unidades del nombre.','My cousins are doctors, and my aunt is an engineer.','quantifiers-nouns',BC+'english-grammar-reference/nouns');
rule('compound','Sustantivos que modifican a otro nombre','Un nombre puede modificar al siguiente: water bottle. El último es el objeto principal y el anterior indica material, función o tipo.','Lee del final al principio: coffee cup es una taza, no café.','A stone wall surrounds the garden.','quantifiers-nouns',CAM+'nouns-compound-nouns');
rule('existential','There + be para existencia','La construcción existencial usa there y una forma de be. El número del nombre determina is/are o was/were; los tiempos compuestos conservan been.','Para decir que algo existe, empieza por there; después ajusta be.','There were three bicycles outside the shop.','quantifiers-nouns',BC+'english-grammar-reference/there-there-are');
rule('demonstrative','Demostrativos y número','This/that acompañan singular; these/those, plural. La distancia orienta this/these frente a that/those, pero necesita contexto.','Una cosa: this/that; varias: these/those.','Those houses across the river are very old.','quantifiers-nouns',BC+'english-grammar-reference/demonstratives');
rule('comparative','Comparativo, superlativo e igualdad','El comparativo suele ir con than; el superlativo destaca un elemento del conjunto. La igualdad usa as + adjetivo + as; no se duplica more con -er.','Than compara; the + superlativo destaca; as abre y cierra igualdad.','This path is narrower than the road beside it.','comparison-adverbs',BC+'english-grammar-reference/comparative-superlative-adjectives');
rule('adverb','Adjetivo, adverbio y grafía','El adjetivo caracteriza un nombre; el adverbio puede indicar cómo se realiza una acción. Muchos acaban en -ly, pero fast, hard y late no lo necesitan.','Pregunta cómo ocurre la acción: carefully, well, fast.','The nurse spoke calmly and clearly.','comparison-adverbs',BC+'english-grammar-reference/adverbials-manner');
rule('emotion','Adjetivos en -ed y -ing','Los adjetivos en -ing suelen describir lo que produce una emoción; los de -ed describen a quien la experimenta.','Un espectáculo puede ser exciting; su público, excited.','The lecture was fascinating, and the students were fascinated.','comparison-adverbs',BC+'b1-b2/adjectives-ending-ed-ing');
rule('exclamation','Exclamaciones con what y how','How intensifica un adjetivo o adverbio; what introduce un grupo nominal. Con nombre contable singular aparece a/an; con plural o incontable no.','How + cualidad; what + cosa.','What an unusual painting! How colourful it is!','comparison-adverbs',CAM+'exclamations');
rule('frequency','Adverbios de frecuencia','Los adverbios como usually y hardly ever suelen preceder al verbo léxico y seguir a be. La colocación enfática puede variar.','Hardly ever significa casi nunca; no equivale a hard.','Rosa hardly ever misses a lesson.','verb-tenses',CAM+'adverbs-and-adverb-phrases-position');
rule('time','Since, for, during, already y yet','Since introduce un punto inicial; for una duración; during un periodo identificado. Yet suele ir al final de negativas y preguntas; already expresa que algo ha sucedido.','Since responde desde cuándo; for responde cuánto tiempo.','I have lived here since April, and I have already met my neighbours.','verb-tenses',CAM+'for-or-since');
rule('preposition','Preposiciones de lugar, tiempo y régimen','La preposición depende del complemento: on Monday, in winter, at noon; on a floor, next to y in front of forman expresiones completas.','Aprende la combinación entera, incluyendo of o to cuando pertenecen a ella.','The office is on the second floor, next to the stairs.','prepositions-patterns',BC+'a1-a2/prepositions-place');
rule('transport','Preposiciones con transporte','El medio sin artículo suele usar by: by train, by bicycle. A pie se expresa on foot. Con un vehículo concreto cambian el artículo y la preposición.','By + medio; on foot es la excepción frecuente.','They travelled by bus and returned on foot.','prepositions-patterns',CAM+'by');
rule('gerund','Complementos en -ing y con to','La forma depende de la palabra anterior: enjoy/avoid/finish admiten -ing; want/refuse/promise, to + base. Una preposición suele ir seguida de -ing.','Aprende parejas: enjoy reading, refuse to answer.','Sofia avoided arguing and promised to listen.','prepositions-patterns',BC+'english-grammar-reference/verbs-followed-infinitive-ing-form');
rule('bare','Let/make + objeto + infinitivo','Let y make en activa llevan un objeto seguido del infinitivo sin to. El objeto usa me/him/her/us/them, no el pronombre sujeto.','Let me go: persona en forma de objeto y verbo sin to.','The coach let us rest after practice.','prepositions-patterns',CAM+'let');
rule('used','Used to y be used to','Used to + base expresa hábito pasado; con did se usa use to. Be used to significa estar acostumbrado y lleva nombre o -ing.','Did you use to swim? no equivale a Are you used to swimming?','I used to cycle to work, but now I walk.','verb-tenses',BC+'b1-b2/past-habits-used-would-past-simple');
rule('do-make','Combinaciones con do y make','Do aparece en actividades como homework, shopping y housework; make en expresiones como make an effort, make money o make a noise.','Aprende cada combinación completa; no traduzcas hacer con un solo verbo.','We did the shopping and made a cake.','prepositions-patterns',CAM+'do-or-make');
rule('say-tell','Say y tell','Tell normalmente lleva destinatario sin to; say introduce palabras y usa to si se añade destinatario. Se dice tell the truth, tell lies y tell a story.','Tell me; say it to me.','Elena told us the truth and said she was sorry.','prepositions-patterns',CAM+'say-or-tell');
rule('reported','Estilo indirecto: referencia y estructura','Al transmitir palabras se ajustan pronombres y referencias temporales. En narración pasada es frecuente retroceder el tiempo; las preguntas indirectas usan orden enunciativo.','Conserva quién habla, de quién habla y cuándo ocurrió antes de cambiar tiempos.','Paula said that she would call me the following morning.',null,BC+'b1-b2/reported-speech-statements');
rule('purpose','Finalidad con infinitivo','To, in order to y so as to introducen finalidad con verbo en forma base. For no se une directamente a una forma base con este sentido.','Para responder para qué con un verbo: to + verbo.','We stopped in order to check the map.','prepositions-patterns',CAM+'infinitives-with-and-without-to');
rule('connector','Conectores y tipo de complemento','Although/though enlazan cláusulas; despite/in spite of admiten nombre o -ing. Because introduce cláusula y because of un grupo nominal.','Mira lo que sigue: verbo con sujeto o grupo nominal.','Although it was windy, we walked outside.','prepositions-patterns',CAM+'although-or-though');
rule('imperative','Imperativos y propuestas con let’s','El imperativo usa forma base; la negación habitual es don’t + base. Let’s + base propone una acción conjunta y let’s not la niega.','Una orden no necesita un sujeto expreso; let’s incluye al hablante.','Please close the window. Let’s not wake the baby.','modals-obligation',BC+'english-grammar-reference/imperatives');
rule('so','Sustitución con so y respuestas concordantes','Think/hope so sustituyen una idea afirmativa. So + auxiliar + sujeto expresa coincidencia afirmativa; nor/neither se usan para una negativa.','I think so resume una idea; nor do I coincide con una negación.','Is the shop open? I think so.','prepositions-patterns',CAM+'so');
rule('vocabulary','Vocabulario y categoría de palabra','La palabra debe tener el significado y la categoría que requiere su función. Un sustantivo no sustituye automáticamente a un adjetivo o a un verbo.','Comprueba qué significa la palabra y qué trabajo hace en la frase.','The eager student asked another question.','quantifiers-nouns',CAM+'word-formation');
rule('anomaly','Ambigüedad y límites del enunciado','Una forma gramatical puede tener varias lecturas. Sin contexto suficiente o con una importación incompleta, una clave histórica no demuestra una solución única.','No confundas una respuesta guardada con una prueba de que las demás sean imposibles.','She may arrive today, or she might arrive tomorrow.',null,BC+'english-grammar-reference/modal-verbs');

const specs={};
// Each line is an item reviewed against its preserved wording: concept, explanation,
// and explicit reasons a/b/c/d (the accepted option uses the explanation itself).
function add(exam,lines){for(const line of lines.trim().split('\n')){const [n,concept,why,...reasons]=line.split('|');specs[`oficial-${exam}-${n}`]={concept,why,reasons};}}

add(1,`
1|adverb|Comfortably indica cómo dormí y conserva la grafía comfortable → comfortably.|La raíz lleva m, no n, y termina en -ably.|Comfortability es un nombre, no el adverbio de modo.||Sobra una l en la terminación.
2|frequency|Daughters-in-law es plural: hardly ever precede a go, y el destino lleva to the gym.||Goes no concuerda con el sujeto plural.|Falta to ante el destino the gym.|Hardly ever no se coloca normalmente entre go y to the gym.
3|continuous|Make a noise es la combinación léxica y is making describe el ruido que se oye ahora.|Do no forma la combinación make a noise.|Does conserva el verbo léxico equivocado para noise.|Who como sujeto singular pide makes, no make.|
4|conditional1|Won’t sign lleva forma base y unless he accepts usa presente con -s.|Después de won’t debe ir sign, no signed.|La condición con unless no usa aquí will accept.||Acept no es la grafía de accepts y no concuerda con he.
5|tag|Has heard se retoma con hasn’t y Martin se sustituye por he.|Is no retoma el auxiliar has.||Did corresponde a pasado simple, no a has heard.|Haven’t no concuerda con he.
6|perfect|Have you ever sung combina auxiliar, sujeto, ever y el participio sung.|Sang es pasado simple, no participio.||Sing no es participio y ever está mal situado.|Song es un sustantivo, no una forma verbal.
7|past-continuous|Were you doing presenta la acción en marcha; took place sitúa el apagón terminado.||Tras was se necesita doing, no do.|Falta el sujeto tras were y take place no está en pasado.|Did no forma un continuo con doing.
8|comparative|The furthest es una forma superlativa normativa de far.|Farest no es el superlativo normativo de far.|Fartherest mezcla las terminaciones de comparativo y superlativo.|Furtest pierde la h de furthest.|
9|emotion|Los niños sienten miedo: frightened; la escena lo provoca: shocking.|Intercambia quien siente miedo y lo que produce impacto.|Frighten es verbo base, no adjetivo para el estado de los niños.||Shocked atribuye a la escena la emoción que experimenta una persona.
10|noun|The dolphin puede representar la especie y a mammal es un contable singular con artículo.|Mammal singular no concuerda como clasificación plural sin determinante.||Mammal necesitaría plural mammals.|Falta a ante el contable singular mammal.
11|quantifier|People es plural, necesita how many y el verbo live.|Many requiere persons o people, no person singular.|Much no cuantifica people contable plural.|Life es nombre, no el verbo live.|
12|passive|Dress es singular: was designed; by presenta al diseñador.|Were no concuerda con dress.||Falta by antes del agente John Galliano.|Design debe ser el participio designed.
13|future|Is going to get hurt expresa el peligro visible y contiene todos los auxiliares.||Going to carece de be conjugado.|Falta to entre going y get.|Tras get se requiere injured, no injure.
14|reported|Richard pasa a he y am having se relata como was having.|Falta el sujeto he delante de was.|Was have no es un pasado continuo.|Has had cambia el aspecto y no reproduce la entrevista prevista.|
15|preposition|Se dice on the right; near une directamente el lugar sin of.|In right no expresa a la derecha.|In the right y near of no son las construcciones pedidas.||Near no necesita of delante de the town hall.
16|relative|Whom se refiere a la empleada como objeto de hired.|Who’s significa who is/has, no un objeto relativo.|Which no es el relativo personal ordinario para employee.|Whose necesitaría un nombre poseído.|
17|existential|Should there be invierte modal y there, y mantiene be sin to.|Should no va seguido de to be.||Falta there como sujeto de la construcción existencial.|Been es participio; tras should se usa be.
18|gerund|Avoid admite answering; refuse exige to make.| |Avoid no selecciona aquí to answer y refuse no lleva making.|Avoid requiere answering; refuse requiere to make.|To debe ir con make, no made.
19|passive|Houses concuerda con have y la pasiva perfecta es have been sold.|Tras has se necesita been, no being.|Has no concuerda con houses.||That es singular y sell no es el participio sold.
20|past|Ago sitúa el encuentro en un pasado terminado; met es el pasado de meet.||Has met no combina en esta lectura con 9 years ago.|Meet no es participio y ago pide pasado simple.|Meet no concuerda con she ni expresa el pasado señalado.
`);
add(2,`
1|past-continuous|Rang es el pasado de ring y was studying describe la actividad interrumpida.||Ringed no es el pasado de ring up y studying carece de auxiliar.|Rung es participio, no pasado simple.|Has rang usa el participio incorrecto y last night pide pasado simple.
2|tag|Haven’t done negativo se confirma con have you positivo.|Did no retoma have. |La coletilla necesita pronombre sujeto, no done.|Don’t no retoma el auxiliar perfecto.|
3|preposition|In a drawer indica interior y under the table va sin of.|Out necesita of delante de a drawer.||Out y under no se completan así con of.|Under no necesita of.
4|conditional1|La promoción recibida exige won’t be promoted y la condición unless you make.|Falta el participio promoted y made cambia la condición temporal.|Falta be antes de promoted.||Have make no es un perfecto: necesitaría made.
5|preposition|Las estaciones usan in y un día concreto usa on.|At no es la preposición ordinaria para winter ni New Year’s Day.|Winter no lleva on y el día no lleva at.||Invierte las preposiciones de estación y día.
6|passive|El techo recibe la pintura: will be painted.|Falta be entre will y painted.||Will necesita be, no being.|Are no concuerda con ceiling singular.
7|perfect|Have ridden usa el participio y since introduce el inicio I was a child.|Have been necesitaría riding.|Rode es pasado simple; during no introduce esta cláusula.|Ridden necesita el auxiliar have.|
8|anomaly|La primera laguna carece de segmento verbal en todas las opciones; no existe reconstrucción íntegra segura.||||
9|adverb|Considerably es el adverbio de considerable y modifica risen.|La terminación correcta es -ably, no -abilly.||Considerily no es la derivación normativa.|Consideratily no es la grafía del adverbio.
10|vocabulary|Out of order es la locución que indica que un aparato no funciona.||La locución usa of, no from.|No service no ocupa normalmente este atributo sin otra construcción.|Malfunction es nombre/verbo, no el adjetivo malfunctioning.
11|vocabulary|Peruvian es el gentilicio inglés de Peru; la frase presenta la inferencia nacional habitual.|Peruan no es el gentilicio inglés estándar.|Peruese no es el gentilicio inglés estándar.||Peruish no es el gentilicio inglés estándar.
12|demonstrative|Those, babies y are mantienen la concordancia plural.||This es singular y babys no es el plural babies.|Is no concuerda con babies.|These babies también exige are, no is.
13|past-perfect|La actuación comenzó antes de llegar: had already begun.|Haved no es un auxiliar inglés.|Begin debe ser begun y already suele seguir a had.|Began es pasado simple, no participio.|
14|relative|La relativa entre comas tiene antecedente personal y sujeto who.|Which no es el relativo personal apropiado.||That no introduce esta relativa explicativa entre comas.|Whom es objeto, pero aquí falta el sujeto de comes.
15|quantifier|Eggs es contable plural: how many y are there.|Much no cuantifica eggs.|Is there no concuerda con eggs.||Much e is no encajan con eggs plural.
16|used|Am not used to driving significa no estar acostumbrado a conducir.|Tras am falta used y to es preposición en esta construcción.||Driven no puede seguir a used to con este sentido.|Faltan to y la forma driving.
17|anomaly|Ninguna opción contiene should sleep u ought to sleep: falta una solución normativa.||||
18|reported|La orden se relata con to give, me pasa a her, your a our y tomorrow al día siguiente.|Una orden relatada necesita infinitivo, no that give.|She no es pronombre objeto y my cambia el poseedor.|The day before invierte tomorrow.|
19|quantifier|Coins es contable plural y admite a few.||Money es incontable y no admite a few.|Coins no admite a little.|Se usa a little money; of necesita determinante u otra construcción.
20|conditional3|Wouldn’t have been fired y had worked forman la hipótesis irreal pasada.|La condición no lleva normalmente would have worked.|Hadn’t been invierte las dos partes y work no es participio.||Falta been después de have.
`);
add(3,`
1|time|Ago sitúa el hecho hace cinco años sin preposición añadida.|From no se necesita delante de 5 years ago en esta respuesta.|Since expresa inicio de duración, no la fecha de become en pasado.||For expresa duración, incompatible con esta respuesta puntual con ago.
2|relative|El libro es objeto de read; en la relativa especificativa puede omitirse el pronombre.||Who se refiere a personas.|What no sigue a un antecedente nominal expreso the book.|Whose necesitaría un nombre poseído.
3|quantifier|Water es incontable: how much water; a lot puede responder sin nombre detrás.|Water no admite many y a lots no es la expresión.| |Waters cambia el nombre de masa sin contexto para pluralizarlo.|Falta a delante de lot.
4|existential|Changes es plural y el perfecto existencial es there have been.|Tras have se necesita been.|Are been no forma un tiempo verbal.|Have being no es el perfecto.|
5|comparative|Healthy cambia -y por -ier y la comparación se enlaza con than.|That no introduce el segundo término.||Healthiest es superlativo, no comparativo con than.|Health es un sustantivo, no el adjetivo healthy.
6|perfect|How long pregunta duración y have you been forma el perfecto interrogativo.||Are been no es una cadena verbal.|Being no es participio después de have.|Time incontable no admite how many time.
7|question|Does Helen take mantiene inversión y verbo base; twice a week indica frecuencia.|La expresión es once a week, sin at.|El sujeto debe seguir a does; falta a en la frecuencia.|Has no forma esta pregunta con take y se usa once, no one.|
8|exclamation|How intensifica el adjetivo beautiful sin artículo ni sustantivo.|How no lleva a delante del adjetivo.||What necesita un grupo nominal.|Falta un nombre después de what a beautiful.
9|conditional2|Knew y would all be presentan condición y resultado hipotéticos.|Had know no es forma perfecta.|Would requiere be, no been.||Would known y had all be son cadenas verbales incorrectas.
10|tag|Can afirmativo se retoma con can’t she para confirmación.||Does no retoma el modal can.|Her es objeto; la coletilla necesita she.|Does no retoma el modal ni la polaridad de confirmación.
11|preposition|Una planta usa on; next to expresa proximidad.|Near no exige of.|In no es la preposición habitual para una planta.||La locución es next to, no next of.
12|noun|Waiter singular lleva a; cooks plural no lleva artículo indefinido.||A no puede determinar cooks plural.|Waiter singular necesita a y cook debe ser plural.|Waiters no admite a.
13|passive|Frank recibe la mordedura: was + participio bitten.|Would necesita be antes del participio.||Bit se usa como participio en algunas variedades; el banco adopta bitten estándar de examen.|Bited no es el participio normativo.
14|reported|La pregunta sí/no se relata con if, sujeto they, had brought y posesivo their.|Bringed no es el participio brought.|Bought significa comprado y cambia la acción bring.|My cambia el poseedor y no conserva la referencia a sus chaquetas.|
15|adverb|Luckily es el adverbio oracional derivado de lucky.|Luckingly no es la forma normativa.|Luckly omite la i del cambio y → i.|Luckedly no es la forma normativa.|
16|say-tell|La instrucción usa told + me + to open.||Tell no concuerda con officer ni relata el pasado.|Tell lleva destinatario directo, no told to me.|Say no usa la estructura said me to.
17|noun|Después de two, hundred permanece singular y enlaza directamente con dollars.|Sobra of después del numeral exacto.|Hundreds of sirve para cantidad imprecisa, no tras two.|Thousand tampoco lleva of tras numeral exacto.|
18|question|La pregunta indirecta mantiene my glasses are y glasses concuerda en plural.|Tras know no se invierte y glass singular cambia el referente.|Is no concuerda con glasses y sobra inversión.||Glasses requiere are, no is.
19|gerund|Refused selecciona to join.|Refuse necesita to delante del infinitivo.||Deny necesita normalmente -ing, no join.|Deny no selecciona to joining.
20|vocabulary|Life sentence es la expresión para cadena perpetua.|Sentency no es la grafía de sentence.|Punish es verbo, no el sustantivo requerido.||Punish no funciona como sustantivo tras permanent.
`);
add(4,`
1|gerund|No time to waste usa infinitivo con to y verbo base.|Spent es pasado/participio, no base tras to.||Wasted no es base verbal.|Left no es base verbal tras to.
2|emotion|Los resultados provocan decepción, de modo que se usa disappointing.||Disappointment es nombre; requeriría otro marco, como such a disappointment.|Disapointed está mal escrito y describiría a quien siente decepción.|Dishearting no es la grafía de disheartening.
3|past-continuous|Didn’t answer cuenta el hecho y was having describe la entrevista en marcha.|Couldn’t exige answer, no answered.|Didn’t exige answer, no answered.||Had have no es una cadena verbal válida.
4|modal|Mustn’t speak forma una prohibición con infinitivo sin to.|Musn’t omite la t de mustn’t.|Oughtn’t necesita to speak.|Can’t necesita speak, no speaking.|
5|tag|Julie’s chosen significa Julie has chosen; la coletilla es hasn’t she.|Does no retoma has.|Chosen no funciona como auxiliar de coletilla.||Did no retoma el perfecto has chosen.
6|future|About to be promoted expresa promoción inminente y pasiva.||Promotioned no es el participio de promote.|La construcción es about to, no about of.|La pasiva requiere promoted, no promote.
7|say-tell|Se dice say that y tell lies; don’t lleva forma base tell.|Tell requiere otro régimen y no se dice say lies en este uso.||Can requiere say, no said.|Don’t exige tell, no told.
8|past-perfect|Got sitúa la llegada; had already died sitúa la muerte anterior.|Die debe ser died y yet no expresa aquí ya afirmativo.|Go no concuerda con ambulance ni expresa pasado; posición de yet inadecuada.|Dead es adjetivo, no participio de die.|
9|comparative|La expresión es the same age as you.||Your debe acompañar un sustantivo, no aparecer solo.|Same se compara con as, no that.|Same usa as, no than.
10|existential|There will be introduce la existencia futura de consecuencias.|Might exige be, no being.|Will exige be, no been.||There will have no es la construcción existencial prevista.
11|conditional3|Wouldn’t have sold y had known conservan ambos participios.|Know debe ser known.||Wouldn’t had no es correcto: would exige have.|Hadn’t sell necesita sold y no representa el mismo patrón.
12|present|Doesn’t live concuerda con Aida y Algeria es el nombre inglés del país.|Life es sustantivo y Algery no es el topónimo inglés.|Don’t no concuerda con Aida; Argely no es el topónimo.|Argelia es el nombre español, no el inglés.|
13|passive|Las preguntas reciben respuesta: will be answered.|Respond no es participio y suele requerir to para su objeto.||It duplica el sujeto plural y no concuerda.|Falta be antes de answered.
14|relative|Kitchen es objeto de repaired; el relativo puede omitirse. |What no se añade detrás del antecedente kitchen.|Whose necesita un nombre poseído.||Who se usa para personas, no kitchen.
15|reported|Asked her to buy him relata la petición y conserva los referentes.|Suggest no selecciona buy directamente.|Ask lleva objeto directo her, no to her.|To debe ir con buy, no bought.|
16|quantifier|Resources es plural contable; few expresa escasez.|A few requiere resources plural.||A little no cuantifica contables plurales.|Much no cuantifica resources.
17|present|Mike exige goes; usually precede el verbo y los domingos por la mañana llevan on.||Use to no expresa correctamente este hábito presente.|Gos no es la grafía de goes y la mañana específica no lleva in.|Uses to no es el patrón habitual moderno y Sunday mornings lleva on.
18|noun|Opticians plural va sin a; accountant singular necesita an.|An no acompaña opticians plural; falta an ante accountant.|Accountant singular necesita an.||A no acompaña opticians plural.
19|perfect|La experiencia usa flown; el viaje fechado hace dos semanas usa had a ride.|Flewn no es el participio de fly.||Have a ridden mezcla verbo y grupo nominal.|Flow no es el participio de fly.
20|past|Fell es pasado de fall y her remite a my aunt.|Falled no es el pasado de fall.|Feel es otro verbo.|Fall no está en pasado e his no conserva el referente femenino.|
`);
add(5,`
1|continuous|Am writing expresa la acción actual; takes place describe dónde transcurre la novela.|Writing no duplica la t y it exige takes.||Write no sigue la pregunta sobre la acción en curso en su lectura ordinaria.|Writing carece del auxiliar am.
2|pronoun|Yours es posesivo independiente; ones exige are y yellow no varía en plural.||Is no concuerda con ones y yellow no añade -s.|Your necesita un nombre y no sustituye a yours.|Your no es independiente y yellows pluraliza el adjetivo.
3|question|Did it happen invierte el auxiliar y conserva sujeto; nobody exige knows.|Falta did en la pregunta directa y know no concuerda.|Falta el sujeto it tras did.|How no funciona aquí como sujeto y know no concuerda.|
4|comparative|Worse es el comparativo irregular de bad y se construye con than.|Of no enlaza esta comparación.|That no sustituye a than.||Worser duplica la marca comparativa y that no es than.
5|perfect|Have they lived usa perfecto; since 2018 y since six years ago señalan puntos de inicio admisibles.|Do no combina con lived para esta pregunta.||Live no es el participio lived.|
6|ability|Will be y will be able to construyen futuro y capacidad futura.||Will exige be, no being.|Falta be antes de able.|Dos modales como will can no forman esta cadena.
7|emotion|La actuación causa asombro: amazing; quien la ve se siente excited.|Excitement es sustantivo.|Amazed describe a quien siente asombro, no el espectáculo.||Amazing y excited son las grafías normativas.
8|tag|Hid es pasado simple de hide: la confirmación es didn’t they.||Don’t es presente.|Weren’t retoma be, no hid.|Them es pronombre objeto, no sujeto.
9|past-perfect|El olvido precede a la llegada: had forgotten.|Forgotten necesita auxiliar.||Forgot es pasado simple; la forma de examen es forgotten.|Haved no existe como auxiliar.
10|conditional1|Follow va en la condición y will feel en el resultado.|Fell es pasado de fall; se necesita feel.|No corresponde will en la subordinada condicional ordinaria.||Will no va seguido de felt.
11|adverb|Fluently y easily son adverbios que describen speak.|With no se combina así con los adverbios.||Fluidity es sustantivo.|Fluency es sustantivo.
12|reported|If they had stayed y that hotel conservan la pregunta indirecta y la referencia singular.|These no concuerda con hotel singular.|Stay debe ser stayed tras had.||Wether es otra palabra; el conector es whether.
13|gerund|Enjoy selecciona la forma en -ing: travelling.||Travel no es el complemento requerido.|Enjoy no selecciona aquí to travel.|To travelling añade una preposición que enjoy no exige.
14|existential|There may be combina sujeto existencial, modal y forma base.|May no lleva to.|Been es participio, no base.|Being no es base tras may.|
15|passive|Paintings plural recibe la acción: were stolen.|Was no concuerda con paintings.||Stole es pasado simple, no participio.|Had stolen convierte las pinturas en agente y deja steal sin objeto.
16|demonstrative|These children look mantiene demostrativo y verbo plurales.||Looks no concuerda con children.|This es singular.|That es singular.
17|relative|Researcher es persona y el hueco es sujeto de developed: who.|Whose necesita nombre poseído.|El relativo sujeto no se omite.|Which no es el relativo personal ordinario.|
18|modal|El nombre en la mochila sustenta una deducción fuerte: must be.|Has be no es una cadena correcta.||Can’t expresa imposibilidad y contradice la evidencia dada.|Might no va seguido de to.
19|noun|News es incontable: good news va sin a y good no cambia.|A no determina news incontable.|New es adjetivo, no el nombre news.|Good como adjetivo no se pluraliza.|
20|continuous|I’m flying es presente continuo para un viaje concertado.|Will requiere be antes de flying.||Going necesita to delante de fly.|I necesita am delante de going.
`);
add(6,`
1|adverb|Angrily describe cómo miraron y cambia la y de angry por i antes de -ly.|With requiere el nombre anger, no angry.||Angryly no aplica el cambio y → i.|Angerily no es la formación normativa.
2|say-tell|Told you es la pregunta neutra y did tell you es posible como pregunta enfática con who sujeto.||Say no lleva you directamente sin to.|Tell lleva destinatario directo, no to you.|
3|passive|Las dudas reciben aclaración: will be clarified.||Clearly es adverbio, no el participio requerido.|Have clarified hace de doubts el agente que aclara.|It duplica el sujeto ya expreso your doubts.
4|ability|La incapacidad futura se expresa con won’t be able to.|Will no puede combinarse directamente con can.||Able necesita be.|Will not be no puede ir seguido de open como verbo.
5|past-continuous|Heard es el pasado de hear y was reading concuerda con I.|Herd significa rebaño y were no concuerda con I en este relato.||Heared no es el pasado normativo.|Reading necesita was para formar el continuo.
6|existential|There will be introduce la existencia futura de la fiesta.|Might exige be, no been.|There will have no expresa existencia de esta forma.||Will exige be, no being.
7|noun|Furniture es incontable y some permite una cantidad no especificada.||Furniture no añade -s.|Furnitures no es el plural de masa estándar.|A lot necesita of delante de furniture.
8|relative|La mujer es sujeto de found: corresponde who.|Un relativo sujeto no puede omitirse.|Whom es objeto, no sujeto de found.|Whose necesita un nombre poseído.|
9|exclamation|How wonderful intensifica un adjetivo sin nombre.|What a wonderful necesitaría un nombre.||How no usa a ante wonderful.|What wonderful necesitaría un nombre.
10|perfect|B y c usan have arrested; d usa had arrested con un punto pasado implícito. Already pospuesto en b es menos neutro, pero está admitido.|Arrest debe ser arrested detrás de have.|||
11|noun|They exige scientists plural; scientist es el nombre de profesión.|Scientific suele ser adjetivo; scientifics no nombra estas personas.|Scientist singular no clasifica a they.||A no acompaña scientists plural.
12|reported|She had never met my brother conserva el referente y usa participio met.||Haved no es forma de auxiliar.|Meet no es participio y his altera el referente.|Had exige met, no meet.
13|comparative|Lucky forma luckiest y el ámbito espacial se introduce con in the world.|Luckest omite la i y of no es la preposición de ámbito usual.||Luckiliest no deriva del adjetivo lucky.|Luckyest no aplica y → i y of cambia la construcción.
14|future|About to have expresa que el accidente era inminente.|Falta to.|To necesita have, no had.|La locución es about to, no about of.|
15|anomaly|Become aparece sin el complemento que necesita la frase; la clave no permite completar el sentido.||||
16|tag|Shouldn’t have se retoma con el modal should en positivo.||Should no se combina con had en la coletilla.|Had no es el primer auxiliar de la oración.|Have no sustituye al modal should.
17|do-make|Las combinaciones son make an effort y do well; en pasado, made y did.|Make no concuerda con Christine ni mantiene el pasado.||Do an effort y make well intercambian las combinaciones.|Made well no es la expresión de rendimiento do well.
18|demonstrative|People es plural: these people need.|Needs no concuerda con people.|That es singular.|This y needs son singulares con people plural.|
19|quantifier|How many pictures concuerda con were; las imágenes reciben la acción sold.|Picture debe ser plural.||Much no cuantifica pictures.|Did sell es activo y cambia qué se pregunta; no expresa la venta recibida.
20|gerund|Feel like requiere going out y promise selecciona to stay.||Like tras feel y promise no admiten aquí formas base sin su patrón.|To going no corresponde a feel like y promise no lleva staying.|To de infinitivo exige stay, no staying.
`);
add(7,`
1|demonstrative|These children are concuerda en plural.|This es singular.|Children ya es plural, no childrens.|Is no concuerda con children.|
2|modal|Should sleep combina el modal con verbo base.||Slept no puede seguir a should.|Ought requiere to.|Tras ought to se necesita sleep, no slept.
3|noun|Lucy y Tom son dos personas: surgeons plural sin a.||A no acompaña un plural.|Surgeon singular no clasifica al sujeto plural.|Surgicals no es el nombre de profesión.
4|past|Did ... cost mantiene verbo base; paid es el pasado de pay.|Falta inversión con did y payed no es la grafía del pago de dinero.||La pregunta necesita did y paid.|Después de did se conserva cost, no costed en este sentido.
5|connector|Although introduce la concesión seguida de sujeto y verbo.|Tough no es though.||Morover no es la grafía de moreover ni aporta la concesión prevista.|Beside es preposición, no el conector concesivo.
6|passive|Bodies plural requiere have y la pasiva perfecta conserva been. |Has no concuerda y already se coloca normalmente antes de been.|Being no sustituye a been después de have.||Has no concuerda con bodies.
7|used|Didn’t use to get expresa ausencia de hábito pasado.||Tras didn’t se escribe use, no used.|Don’t no sitúa el hábito en pasado y getting no sigue este used to.|Falta to antes de get.
8|future|I’ll get expresa la decisión de conseguir comida con will + base.|Will going necesita otra cadena verbal.|Falta am en going to.|Going necesita to delante de get.|
9|conditional1|Will be cancelled es pasiva futura; unless it stops usa sujeto y presente.|Falta sujeto it en stop raining.|Falta be y stops debe concordar con it.||Cancel no es participio; además la negación cambia la condición.
10|emotion|La actividad resulta exciting y las personas no estaban bored.|Excitement es nombre.| |Weren’t get bored no forma el atributo requerido.|Excited atribuye al paseo la emoción de quien lo realiza.
11|tag|She’s forgotten equivale a she has forgotten: hasn’t she.|Haven’t no concuerda con she.|Was no retoma has forgotten.|Did no retoma el perfecto.|
12|gerund|Chose to live usa choose + to; miss living usa miss + -ing.||Choose living y miss to live no son los patrones previstos aquí.|Chosen necesita auxiliar.|Life es nombre, no verbo después de to.
13|comparative|Drier y luckier cambian y por i y ambas comparaciones usan than.|That no enlaza la segunda comparación.|That no enlaza la primera.||Then indica tiempo; la forma comparativa usual de lucky es luckier.
14|existential|There may be combina there y modal con be sin to.||Sobra to después de may.|Been no sigue directamente a may.|Being no sigue directamente a may.
15|relative|El hombre es objeto de interviewed; el relativo objeto puede omitirse.|Which no es el relativo personal ordinario.||Whose necesitaría un nombre poseído.|Than no introduce una relativa.
16|passive|Proposals plural requiere are; la pasiva en progreso es being studied.|Is no concuerda y studyed no es la grafía de studied.|Been no forma el continuo pasivo.||Have being no es una cadena perfecta.
17|preposition|A sitúa el banco delante del centro comercial y d detrás; ambas usan next to y son gramaticales.||Near no necesita of.|Behind no lleva of.|
18|reported|Where she was going mantiene el orden enunciativo y was going.|Falta was.||La pregunta indirecta no mantiene do you go.|Falta el sujeto y were no concuerda con she.
19|noun|Some new furniture cuantifica el incontable sin pluralizarlo.|Furniture no admite a con sentido de mobiliario.|Furniture no añade -s.||Furnitures no es plural de masa estándar.
20|say-tell|Has said puede introducir la afirmación; tras mustn’t va tell lies.|Told necesita destinatario y mustn’t exige tell.||Say no concuerda con policeman.|Se dice tell lies, no say lies.
`);
add(8,`
1|conditional2|Would travel y if I had the chance forman una hipótesis presente/futura.||Would requiere travel, no travelled.|Would have necesita travelled.|Would be travel no forma un condicional correcto.
2|tag|Drew es pasado simple: la confirmación usa didn’t he.|Hasn’t corresponde a perfecto.||Don’t es presente y no concuerda.|Won’t corresponde a futuro.
3|past|Did you hide conserva el verbo base hide.|Hidden es participio.|Hid es pasado, no base tras do.|Hid no se usa después de did.|
4|past-continuous|Was the man doing presenta acción de fondo; phoned la llamada puntual.|Was phone no es un pasado continuo.|Did ... doing no forma esta pregunta.|Were no concuerda con man y phone no está en pasado.|
5|relative|Which sustituye a cottage y was sold forma la pasiva.|Whose necesita nombre poseído.|Sell debe ser sold tras was.||Whom no corresponde a cottage y sell no es participio.
6|comparative|The most exciting destaca el máximo entre las películas vistas y watched es participio.|More ... than compara dos términos, no completa este máximo entre experiencias.|La combinación duplica than y altera el tiempo.|Excitement es nombre y watch debe ser watched.|
7|preposition|Las combinaciones son fond of y keen on.||Fond no lleva on y keen no lleva in aquí.|Fond no lleva in.|Fond no lleva at y keen no lleva in.
8|existential|Controversy es incontable singular: there has been; a lot of introduce el nombre.|Will exige be, no been.||Has requiere been, no being.|Have no concuerda y a lot necesita of.
9|noun|They se clasifica con los plurales actors y musicians sin artículo indefinido.|Los dos nombres están en singular sin determinante.|A musicians mezcla artículo singular y plural.|An actors y a musicians mezclan singular y plural.|
10|quantifier|Money es incontable: how much y a little.||Many y a few se aplican a contables.|A few no cuantifica money.|Many no cuantifica money y a little of necesita otro marco.
11|reported|He was going to send conserva be going to y el destinatario pasa a me.|Falta was.||Falta to antes de send.|To requiere send, no sent.
12|perfect|How long have you been pregunta por duración con participio been.|Have necesita been, no be.|Time no admite many.|Has no concuerda con you y long no necesita time.|
13|modal|Must be expresa una deducción fuerte a partir de la falta de experiencia.|Ought necesita to.||Must no lleva to.|Must exige be, no been.
14|perfect|Has never taught contiene auxiliar singular, adverbio intermedio y participio irregular.|Have no concuerda con she y never tiene colocación poco neutra.|Teach no es participio.|Teached no es participio normativo.|
15|passive|Had already been opened combina pasado perfecto y pasiva anterior a la comprobación.||Being no sustituye a been.|Had being no es perfecto pasivo y yet no expresa ya en esta afirmativa.|Have no concuerda con envelope y yet no corresponde a esta lectura afirmativa.
16|used|Didn’t use to dance expresa que antes no bailaban salsa.|Were not use no forma be used to.|Tras didn’t se usa use, no used.||Used to de hábito requiere dance, no dancing.
17|exclamation|How cute intensifica el adjetivo sin artículo.|What necesita grupo nominal.|What a cute necesita nombre.||How no lleva a.
18|pronoun|Guys plural requiere yourselves; by myself significa por mi cuenta.|Yourself es singular y meself no es la forma estándar.|Himself y ourself no conservan los referentes.|Youselves y myselfs no son grafías normativas.|
19|adverb|As hard as expresa intensidad máxima comparada; luckily evalúa toda la situación.||Falta el segundo as y lucky es adjetivo.|Hardly significa apenas y falta as de cierre.|As exige as, no than; unlucky es adjetivo.
20|conditional1|Won’t be allowed forma pasiva futura; unless you get usa presente.|You will get no es la condición ordinaria con unless.|Will se reserva aquí para el resultado.||Falta be en will not be allowed.
`);
add(9,`
1|present|Don’t go to expresa el hábito negativo; are watching la actividad de ahora.|Go necesita to delante de the cinema.||Doesn’t no concuerda con dos sujetos y watching necesita auxiliar.|Watch no expresa la acción actual indicada por right now en esta lectura.
2|connector|Due to admite el grupo nominal weather conditions.|Because requiere una cláusula o la forma because of.||La locución es owing to, no owing for.|La locución es due to, no due of.
3|noun|A baker es singular con artículo; priests es plural sin a.||A no determina priests.|Baker singular necesita a y priest debe ser plural.|Falta a ante baker y sobra ante priests.
4|passive|Haven’t been questioned yet concuerda con witnesses y contiene participio pasivo.|Has no concuerda y question no es participio.|Being no sustituye a been.||Question necesita -ed.
5|future|Is Nadine going to take conserva inversión y toda la perífrasis.|Falta to.|Will necesita take, no taken.|Going to necesita take, no taking.|
6|relative|Whose expresa que el autor pertenece a la obra.|Who’s equivale a who is/has.||Which no marca posesión ante author.|Who no marca posesión.
7|existential|Is there anything pregunta por existencia; plenty of cuantifica food.|A lot necesita of delante de food.|Anything y food no exigen are.| |La pregunta necesita inversión y plenty necesita of.
8|existential|Could there be combina inversión y be sin to.||Could no lleva to.|Being no es forma base.|Been no es forma base.
9|used|Did you use to get up pregunta un hábito pasado con use y get en base.|Falta to.|Get up no puede ir en -ing después de use to de hábito.|Got no es base tras to.|
10|conditional2|Would become y if I sang forman una hipótesis; sang es pasado de sing.|Have sang necesitaría sung.|Will exige become, no became.|Would exige become, no became.|
11|comparative|The fastest destaca al corredor; in the world delimita el ámbito; faster than compara.|Falta the y that no equivale a than.|Fast usa normalmente -est/-er, y falta in the world.|Falta than en el segundo segmento.|
12|exclamation|What fascinating animals usa what con nombre plural sin a.||A no determina animals plural.|How no introduce de este modo animal.|How necesita adjetivo sin el nombre animals en esta construcción.
13|preposition|Under va sin of; on the chair y in the chair son posibles según la postura y el tipo de silla.|Under no lleva of.|||Under no lleva of.
14|conditional3|Had driven y wouldn’t have crashed mantienen los participios de ambas partes.|La condición ordinaria no usa would have.|Drived no es participio y crash necesita -ed.|Drove es pasado simple y crash necesita participio.|
15|tag|Mark’s been significa Mark has been: hasn’t he.|Haves no es auxiliar.|Isn’t no retoma has been.||Haven’t no concuerda con he.
16|preposition|Se dice worry about y depend on; future singular requiere depends.|Worry no lleva in y depend no concuerda.||Worry no lleva in y depend no lleva of.|Depend no selecciona about.
17|modal|Should go expresa consejo con verbo base.||Ought necesita to.|Ought to requiere go, no going.|Must no lleva to.
18|past-continuous|Didn’t answer y was driving contrastan hecho y actividad simultánea.||Driving carece de auxiliar.|Don’t answered mezcla presente y pasado.|Not answered necesita auxiliar y were no concuerda con she.
19|perfect|Has been concuerda con Mike; since 2018 indica inicio.|Have no concuerda y 2018 no es duración para for.||Being no es participio tras has.|Is been no es present perfect.
20|reported|May se relata como might y your/tomorrow pasan a our/the following day.||Might no lleva to y the day before invierte tomorrow.|Might exige be, no been.|Must cambia el grado modal y previous day invierte tomorrow.
`);
add(10,`
1|gerund|Allow necesita objeto us y to leave; will mantiene allow en base.|Will exige allow y allow no selecciona leaving así.|Falta to antes de leave.||Left no es base después de to.
2|pronoun|Ourselves concuerda con we y destaca que pintamos sin ayuda.||Ourself no es el plural requerido.|Ourselfs no es la grafía normativa.|Yourselfs cambia el referente y no es grafía normativa.
3|past-continuous|Shook es pasado de shake; everybody concuerda con was sleeping.|Shaken es participio y was sleep no forma continuo.|Shaked no es pasado normativo y everybody exige was.|Were no concuerda y sleep necesita -ing.|
4|tag|Brought es pasado simple y daughter se retoma con she: didn’t she.|Doesn’t está en presente.||Brought no sirve como auxiliar de coletilla.|He no conserva el referente daughter.
5|anomaly|El adverbio ante be puede tener foco enfático; falta contexto para imponer una única colocación.||||
6|perfect|Have read usa el participio read y since Wednesday indica punto inicial.|Wednesday es punto inicial, no duración para for.||Readed no es participio inglés.|Has no concuerda con I y reading no forma el perfecto simple.
7|conditional3|Would have sold y had made plantean una venta hipotética pasada.||Make no es participio tras had.|Sellled no existe y have make necesita made.|Would sold necesita sell o have sold.
8|question|La pregunta directa requiere does your flight leave: auxiliar, sujeto y base.|Es orden de subordinada, no de pregunta directa.|Does no forma continuo con leaving.||Does ya marca la tercera persona; leaves duplica la marca.
9|relative|Who y that pueden ser sujetos de esta relativa especificativa personal.|Which no es el relativo personal ordinario.||Whom marca objeto, pero el hueco es sujeto de feel.|
10|anomaly|El segmento after the necesita un nombre; las opciones dan preposiciones y no completan la frase.||||
11|comparative|More friendly than y not as friendly as son gramaticales; expresan comparaciones distintas y no hay contexto que decida.|||Friendship es nombre, no adjetivo dentro de as ... as.|As ... as no se cierra con than.
12|reported|He was going y the next day conservan persona, tiempo y referencia de tomorrow.||Falta was.|Falta he y previous day invierte tomorrow.|Were no concuerda con he y day before invierte tomorrow.
13|quantifier|Water incontable admite a little; coins contable plural admite a few.|Intercambia cuantificadores contables e incontables.|Water no admite a few.||Of no va directamente delante de estos nombres sin determinante.
14|conditional1|Won’t get usa forma base y unless she does conjuga la condición.|Will get not no es la negación ordinaria; unless no lleva that.||Got no sigue a won’t y do no concuerda con she.|She doing necesita verbo conjugado.
15|existential|A decrease es singular: there has been.||Have no concuerda con singular.|Have being no es perfecto.|Are been no es una cadena verbal.
16|used|Didn’t use to like expresa el hábito pasado negativo.|Don’t used mezcla tiempo y forma.|Falta to y used no queda en base tras did.|Después de did se usa use, no used.|
17|preposition|Prefer compara con to; good rige at en good at languages.|Prefer no rige than y good no rige than.|Prefer no rige than.||That no sustituye a to.
18|perfect|Have you seen pregunta experiencia reciente; saw sitúa el encuentro veinte minutos antes.|Seen no sigue a did y saw no sigue a have.||Has no concuerda con you; see no es participio.|Saw no es participio y seen carece de auxiliar en el segundo tramo.
19|purpose|In order to practise introduce la finalidad con to + base.|Falta to.|So as necesita to.|For to no es la construcción estándar aquí.|
20|past-perfect|Was fija el pasado y had never travelled mira a la experiencia anterior.||Had being no es correcto.|Haved no es auxiliar y travelling no es participio perfecto.|Had never travelling necesita been para el continuo.
`);
add(11,`
1|present|Nephew es singular y exige exercises; hardly ever precede al verbo léxico.||Exercise no concuerda con nephew.|Do no concuerda con nephew; la colocación de hardly ever tampoco es neutra.|Exercise no concuerda con nephew.
2|relative|Van es una cosa y el hueco es sujeto de is: which.|Where aporta lugar, no sujeto.|Whose necesita un nombre poseído.|Who se refiere a personas.|
3|question|How long pregunta duración; does it take you conserva auxiliar, sujeto, verbo y objeto.|La pregunta directa necesita does y take no selecciona to you aquí.||Time no admite many en este sentido.|How time no pregunta duración y falta inversión.
4|conditional3|Would you have done y had become mantienen la construcción hipotética pasada.|Would done necesita have; el orden interrogativo es incorrecto.|Invierte indebidamente los auxiliares entre las cláusulas.||Would you had no es una cadena válida.
5|anomaly|Las opciones tienen dos segmentos pero el enunciado conserva un único hueco: falta texto para completar.||||
6|preposition|Se dice sitting at the table y lying on the floor.|In no expresa estas posiciones.|In the table no significa sentada a la mesa y at no expresa sobre el suelo.|Next at no es la locución next to y at no expresa la superficie.|
7|existential|There will be presenta existencia futura de una vacuna.||Will can combina dos modales incompatibles.|Will exige be, no being.|Will exige be, no been.
8|modal|Mustn’t go expresa prohibición y shouldn’t go consejo; ambas son gramaticales y admitidas.|To go no contiene verbo conjugado.||Don’t have to expresa ausencia de obligación, no la advertencia de no entrar.|
9|conditional1|A expresa que sin comida sana no se adelgaza; d expresa la relación opuesta como generalización. Ambas construcciones son gramaticales aunque el sentido de d sea extraño.||Unless you eating carece de verbo conjugado.|Unless no admite aquí that.|
10|tag|Wasn’t wearing se confirma con was he.|Did no retoma was.|Were no concuerda con he.|Wore es verbo léxico, no auxiliar de coletilla.|
11|pronoun|They exige themselves; by themselves significa sin ayuda.|Theyselves no es la forma estándar.|Theirselfs no es la forma estándar.|Theirselves es variante no estándar para este examen.|
12|past|Did the boat sink mantiene sink en base después de did.|Sunk es participio, no base tras did.||La pregunta directa necesita inversión con did.|Does exige sink, no sunk.
13|perfect|Have you ever grown usa participio; grew sitúa el cultivo del año pasado.|Grow no es participio y ever ocupa posición inadecuada.|Growed y grewed no son las formas normativas.||Grow no es participio.
14|anomaly|El enunciado carece del sujeto interrogativo What; ninguna opción produce una pregunta íntegra.||||
15|used|Did you use to teach pregunta por hábito pasado con formas base.||Used no sigue a did.|Falta to.|Used to de hábito exige teach, no teaching.
16|preposition|At a bus stop nombra un punto y on the way home es la locución establecida.|On no es la preposición de punto y for the way no es la locución.||In front necesita of.|Besides significa además de; for no completa on the way.
17|perfect|Aunt singular exige hasn’t; chosen es participio y yet cierra la negativa.|Haven’t no concuerda con aunt.|Chosed no es pasado estándar de choose.||Choose no concuerda ni forma perfecto; yet no encaja en esta afirmativa.
18|exclamation|What an amazing experience usa what + an + adjetivo + nombre singular.||Amazing comienza con sonido vocálico: an, no a.|How no introduce este grupo nominal.|El orden how experience amazing no construye una exclamación normativa.
19|quantifier|A lot of cuantifica exams plural y little indica escasez de time incontable.|Much no cuantifica exams; many no cuantifica time.|A few no cuantifica time.|A lot necesita of y a little of no precede directamente a time.|
20|reported|He would give me relata will give you con los referentes del diálogo.||Give no concuerda con he ni conserva el tiempo.|Would exige give, no given.|Her sustituye indebidamente al destinatario me.
`);
add(12,`
1|used|Used to eat describe el hábito de la dieta y conserva eat en base.|Use no marca el hábito pasado y ate no sigue a to.||Eaten no es infinitivo base.|Ate no sigue al to de used to.
2|reported|They had had y the night before conservan el pasado y la referencia de last night.|Were having cambia el aspecto y night after invierte la referencia.|That night no conserva por sí solo la referencia al día anterior.|Had have exige participio had.|
3|tag|Goes es presente de tercera persona: doesn’t he.|Didn’t es pasado.|Don’t no concuerda con he.||Does he puede usarse como eco, pero no es la confirmación de polaridad inversa que adopta el banco.
4|comparative|Safer es comparativo de safe y usa than.|Safest es superlativo.|That no sustituye a than.|More safer duplica la comparación y that no equivale a than.|
5|past-perfect|Had already begun sitúa el comienzo antes de la llegada.|Haved no es auxiliar.||Began es pasado simple, no participio.|Began no es participio y yet no expresa ya en esta afirmativa.
6|preposition|Under y beside enlazan directamente con sus complementos.|Ninguna de las dos preposiciones necesita of.|Beside no necesita of.||Under no necesita of.
7|relative|Whose car expresa posesión: el coche de ese hombre.||Which no expresa posesión ante car.|Where expresa lugar.|Who no es posesivo.
8|existential|Milk incontable usa is y no; spoons plural usa aren’t any.|Any no expresa la afirmación negativa y spoon debería ser plural.| |Milk no concuerda con are.|Milk no concuerda con are y spoons debe ser plural.
9|existential|A gradual increase es singular: there has been.||Being no es participio tras has.|Have no concuerda y be no es participio.|Has necesita been.
10|pronoun|La orden se dirige a varios children, por lo que exige yourselves.||Yourselfs no es el plural normativo.|Youselfs no es una forma normativa.|Yourself es singular.
11|conditional2|Would get y knew expresan una situación hipotética.|Would exige get y known necesita auxiliar.|Will en la condición no corresponde a esta hipótesis.|Would know no es la condición ordinaria del patrón.|
12|past-continuous|Children plural exige were playing; started señala el inicio de la lluvia.|Playing carece de auxiliar y was start no es un tiempo verbal.|Were necesita playing.||Was no concuerda con children y was started no expresa aquí empezar a llover.
13|perfect|Ridden es participio y ever sigue al sujeto en have you ever ridden.|Rode es pasado simple.|Ride no es participio.||Ride no es participio y ever separa auxiliar y sujeto indebidamente.
14|adverb|Perfectly y very well modifican las acciones dances y moves.|Perfectedly no es forma normativa y good es adjetivo.|Perfectedly no es forma normativa.|Betterly no existe como adverbio estándar.|
15|modal|Might go expresa posibilidad y lleva verbo base.|Able necesita to.|Might no añade -s.||May no lleva to.
16|question|Does the baby wake up mantiene inversión, sujeto singular y verbo base.||Do no concuerda y wakes duplica la conjugación.|Waken también es un verbo inglés; esta alternativa necesita tratarse como variante léxica, no como mera flexión incorrecta.|Falta auxiliar antes de the baby.
17|future|I will get expresa una decisión tomada al conocer el frío.||Falta am en la perífrasis going to.|Falta to antes de get.|Will requiere get, no getting.
18|gerund|Couldn’t requiere stop en base y stop laughing significa dejar de reír.|Stopped no sigue a couldn’t y laugh debería ser laughing.|Stopped no sigue a couldn’t.|To laughing mezcla infinitivo y -ing.|
19|perfect|Margaret concuerda con has worked y for introduce doce años de duración.|Haves no es auxiliar y work no es participio.|Have no concuerda y since no expresa duración de twelve years.||From ago no introduce una duración así.
20|connector|Because of admite el nombre traffic.|Due necesita to, no a.||Owing necesita to.|Dued no es la forma del conector due to.
`);
add(13,`
1|past|Did you buy conserva buy en base y orden interrogativo.||Bought no sigue a did.|La pregunta necesita auxiliar antes del sujeto.|Buyed no es forma normativa y did exige buy.
2|question|Does she usually cook mantiene auxiliar, sujeto, adverbio y verbo base.|El sujeto she está después del verbo léxico.||Cook está situado antes del sujeto.|Falta does y cook no concuerda con she.
3|future|Will carry ofrece ayuda y mantiene carry en base.|Carried no sigue a will.|Will no lleva to.|Carrying necesita be para seguir a will.|
4|time|For six months expresa duración y since January inicio; ambas frases perfectas son correctas.||Since month ago necesita un determinante, como a month ago.|Being no sustituye al participio been.|
5|anomaly|La pregunta ya contiene la secuencia que las opciones intentan completar; no queda un hueco conservado.||||
6|pronoun|The kids plural requiere themselves en enjoy themselves.||Theirself no es la forma plural estándar.|Theirselves es variante no estándar para este examen.|Themself singular no corresponde a kids plural.
7|noun|Information es incontable: some information no añade artículo a ni plural.|Information no añade -s.|Information no añade -s.||An no determina information incontable.
8|exclamation|What bad luck usa what con nombre incontable sin a.|How no introduce así el grupo nominal.|Luck incontable no lleva a.||How no introduce así el grupo nominal.
9|ability|Can play lleva base y couldn’t permite omitir play ya mencionado.|Can necesita el verbo play; not could no es la negación estándar.|Can no lleva to y no could no forma la negación.||Played no sigue a can.
10|preposition|Una planta usa on; opposite va directamente seguido del lugar.|In no expresa la planta y opposite no lleva of.||In front necesita of.|Behind no lleva of y una planta no suele llevar at.
11|used|Didn’t use to play contrapone el hábito de rugby al voleibol.||Don’t used no es la forma negativa del hábito pasado.|Used to not playing no expresa este hábito con infinitivo.|Después de did debe ir use; playing debe ser play.
12|tag|Haven’t met se retoma con have you en positivo.|Are no retoma have.|Do no retoma have.||Met no funciona como auxiliar de coletilla.
13|anomaly|El motivo expresado por because of working no tiene contexto claro y las opciones no permiten asegurar la intención original.||||
14|relative|Where introduce el lugar en el que la mujer fue atacada.|Which necesitaría una preposición locativa para esta estructura.|What no sigue al antecedente house.||Who no se refiere a house.
15|anomaly|Ninguna pareja es inequívoca: se esperaría well / hard, que no aparece; hardly significa apenas y no justifica fijar c.||||
16|conditional2|Would be y didn’t eat expresan la hipótesis de comer menos.|Wouldn’t eat puede expresar voluntad; esa lectura necesitaría contexto adicional y no es la condición neutra adoptada.|Eaten no sigue a didn’t.|Ate no sigue a didn’t y se mezclan los marcos hipotéticos.|
17|perfect|Police es plural y have ... found ... yet usa participio en una pregunta.||Finded no es participio.|Find no es participio tras have.|Has no concuerda con police y el sujeto debe preceder a found.
18|reported|He had broken his knee y the week before conservan sujeto, posesión y tiempo.|I cambia el sujeto y week after invierte la referencia.|Have no concuerda con he.|Broke es pasado simple, no participio.|
19|existential|There will be presenta asistencia futura.|Have been es perfecto, no el futuro señalado.|Will no lleva to.||Will exige be, no being.
20|quantifier|Eggs plural admite a few y flour incontable admite a little.|A lot necesita of ante ambos nombres.|Intercambia contable e incontable.|Of no precede directamente a estos nombres sin determinante.|
`);
add(14,`
1|time|For two weeks expresa duración y since two weeks ago el punto inicial: ambas formas están admitidas.||Being no es participio y for no combina con ago para esta duración.||Have no concuerda con he y since necesita un inicio, no two weeks.
2|pronoun|Girls plural exige themselves para referirse a las mismas chicas.|Theirselve no es forma normativa.||Herselves mezcla singular her con plural.|Theirself no es plural estándar.
3|conditional2|Worked y would have forman condición hipotética y resultado.||Would no va aquí en la condición y has no sigue a would.|Will en la condición no forma este patrón.|Had no sigue directamente a would.
4|future|Will buy expresa la decisión de comprar queso.|Bought no sigue a will.||Going necesita to.|Is no concuerda con I.
5|tag|Bought es pasado simple y you se mantiene: didn’t you.|La coletilla no repite buy.|Do está en presente.|Don’t está en presente.|
6|past|Got es pasado de get; tras didn’t se conserva have.|Getted no es pasado normativo y had no sigue a did.||Don’t had mezcla auxiliar presente y verbo pasado.|Después de didn’t no se usa to have.
7|quantifier|Water es incontable: a little; apples plural: a few.||Of necesita otra construcción, no nombre directo.|Intercambia las categorías contable/incontable.|A lot necesita of delante de nombre.
8|existential|A change singular exige there has been.||Have no concuerda con a change.|Were no concuerda con singular.|Has exige been, no being.
9|used|Used to play describe el hábito de juventud.|Played no sigue a used to.|Was used play necesitaría to y -ing para otro significado.||Usually play no concuerda con Martha ni expresa el hábito pasado.
10|some-any|La negativa usa any rice y la afirmativa some bananas.|Some/any invierte la lectura neutral de esta oposición.||Anything/something son pronombres completos, no determinantes de rice/bananas.|A no determina incontable ni plural.
11|preposition|On the third floor indica planta y next to proximidad.|Opposite no necesita of.||In no expresa planta y in front necesita of.|Near no necesita of y una planta usa on.
12|relative|Which se refiere a la película en una relativa explicativa entre comas.|Whose necesita nombre poseído.|Who se refiere a personas.||Whom es objeto personal.
13|exclamation|What a beautiful bird usa nombre singular con artículo.|How no introduce a beautiful birds y a no acompaña plural.|Beautiful no se pluraliza.|El orden nominal está invertido.|
14|ability|Could you ride pregunta capacidad pasada con verbo base.|Can no expresa el pasado y ridden no es base.|Riding no sigue a could.||Can no expresa el pasado y riding no es base.
15|adverb|Fast y well son adverbios: velocidad y manera de hablar.|So faster mezcla intensificador de grado y comparativo sin contexto.|Fastly no es el adverbio ordinario y god no es well.|Fastly no es el adverbio ordinario y good es adjetivo.|
16|comparative|Cheaper than es el comparativo regular de cheap.|Cheap carece de marca comparativa.|Cheapest es superlativo.|More cheaper duplica comparación y that no sustituye a than.|
17|reported|Had lost, his y the day before conservan el relato pasado, el poseedor y yesterday.|My altera poseedor y day after invierte yesterday.||Have no concuerda con he.|Losed no es participio y day after invierte el tiempo.
18|quantifier|Noise es incontable y too much expresa exceso.|A lot necesita of.|Too solo no determina noise.|Many requiere contable plural.|
19|question|Does she want coloca auxiliar singular, sujeto y verbo base.|Do no concuerda y she debe preceder a want.|Falta auxiliar y she está mal colocado.||Do no concuerda y wants debe quedar en base.
20|past-continuous|Was studying presenta el fondo y rang es pasado de ring.|Ringed no es el pasado de ring en este sentido.||Were no concuerda y rung es participio.|Were no concuerda con she.
`);
add(15,`
1|question|Cousins plural requiere do y el orden es where + do + sujeto + work.|Does no concuerda y work precede al sujeto.|Falta auxiliar; works tampoco concuerda.|Work no debe preceder a do.|
2|past|Gave es pasado de give y didn’t say conserva say en base.||Given necesita auxiliar y said no sigue a did.|Give no expresa el pasado ni concuerda.|Said no sigue a didn’t.
3|comparative|Faster than compara las velocidades de los coches.|More faster duplica comparación y that no es than.|La forma corriente es faster y that no es than.||Fastest es superlativo.
4|time|Have been married se combina con for 12 years o since 12 years ago, duración e inicio respectivamente.|Marry es verbo base, no el adjetivo married.|||Being no sustituye a been y since no introduce 12 years sin ago.
5|past-continuous|Was it raining describe la lluvia al llegar; arrived está en pasado simple.||Falta it y arriving no es un verbo conjugado.|Did no forma continuo con raining.|Be arrived no es el pasado simple de arrive.
6|pronoun|He remite a himself en talking to himself.||Themselves es plural.|Herself no corresponde a he.|Theirselves no es la forma estándar y cambia el referente.
7|exclamation|What a sad story usa nombre contable singular con artículo.|How no introduce así story.||El orden del artículo y adjetivo es incorrecto.|Falta a ante story singular.
8|conditional2|Lived y would visit construyen la hipótesis.|Will live no es la condición del patrón hipotético.|Would visits mezcla modal y verbo conjugado.||Visited no sigue directamente a would.
9|ability|Could read y couldn’t write expresan capacidad e incapacidad pasadas.|Can no concuerda con el marco pasado y written no es base.||Could no lleva to.|Could no lleva formas en -ing.
10|anomaly|Todas las opciones carecen del sujeto I necesario para la respuesta conservada.||||
11|tag|Broke es pasado simple: didn’t they es la confirmación habitual.||Did break they repite el verbo léxico.|Did they es una coletilla eco posible con otra intención; el banco adopta la confirmación inversa.|Do está en presente.
12|some-any|Any milk pregunta cantidad y some orange juice afirma otra existencia.|A no determina orange juice incontable.|A no determina los líquidos incontables.|Anything/something no determinan estos nombres.|
13|quantifier|Food incontable admite much y milk admite a lot of.|Many no cuantifica food; a lot necesita of.|A few no cuantifica milk.||Many no cuantifica estos nombres de masa.
14|used|Used to play expresa hábito pasado y mantiene play en base.|Played no sigue a used to.||Plays no concuerda con dos sujetos y expresa presente.|Were used play necesita otra construcción.
15|preposition|Opposite no lleva of; between enlaza los dos lugares de referencia.||Opposite no necesita of.|In front necesita of y near no lleva of.|In opposite of no es la locución.
16|relative|Which y that pueden ser relativos objeto con antecedente song en esta especificativa.|Who se refiere a personas.|Whose necesita un nombre poseído.||
17|adverb|Hard significa con esfuerzo y late a hora tardía.|Hardly significa apenas y lately últimamente.||Lately no significa a una hora tardía.|Hardy es adjetivo y latte un tipo de café.
18|reported|Will be pasa a would be y tomorrow a the next day.|Will being necesita be y no conserva el retroceso previsto.|Would exige be, no being.||Could cambia el grado modal y day before invierte tomorrow.
19|existential|Twenty applications plural exige there have been.||Being no es participio después de have.|Has no concuerda con applications.|Were been no forma un tiempo verbal.
20|quantifier|Books es contable plural: too many es la única opción con determinante completo.|Much no cuantifica books.||Too solo no determina books.|A lot necesita of delante del nombre.
`);
add(16,`
1|conditional1|Will tell expresa el resultado futuro de if I see Robert.|Told no es la forma base del resultado futuro.|Would told necesita tell y otro marco.||Tell puede describir una reacción habitual, pero no la promesa futura que adopta la clave.
2|connector|While introduce la acción durante la cual se durmió.||For no introduce aquí una cláusula temporal.|During necesita nombre o grupo nominal, no she was watching.|Because expresaría causa y también puede ser gramatical; el banco solo conserva la lectura temporal.
3|comparative|Better es el comparativo irregular de good y enlaza con than.||Best es superlativo.|Gooder no es el comparativo estándar.|More good no es el comparativo ordinario.
4|relative|Woman es persona y el relativo es sujeto de came: who.|Whom es objeto.|Which no es el relativo personal ordinario.|What no sigue al antecedente nominal expreso.|
5|obligation|Mustn’t smoke expresa prohibición.|Not must no es el orden de negación modal.||Have to smoke sería una obligación de fumar, distinta del sentido de la biblioteca.|Has to no concuerda con you.
6|time|Since introduce 2019 como punto inicial de la duración actual.|From solo no es la construcción de duración usada con have been living.||For requiere duración, no fecha inicial.|During requiere un periodo, no marca el inicio hasta hoy.
7|relative|La relativa entre comas admite who como sujeto referido a sister.|That no introduce esta relativa explicativa.|Whom no es sujeto.||Which no es relativo personal ordinario.
8|adverb|Easily describe cómo aprobó el examen.||Easy es adjetivo en el inglés formal de examen.|Eased es forma de ease, no el adverbio de manera.|Ease es nombre o verbo, no este adverbio.
9|pronoun|Keys es objeto de see: them.|There indica lugar.|Their necesita nombre poseído.|They es pronombre sujeto.|
10|modal|Después de can se usa play en forma base.|Played es pasado/participio.||Plays añade -s indebidamente.|Can no lleva to.
11|past|Had a shower relata una ducha completada esta mañana.|Had got expresa posesión previa, no la actividad shower.|Have no expresa la ducha completada.||Have got expresa posesión, no tomar una ducha.
12|bare|Made me clean usa make + objeto + infinitivo sin to.||Make en activa no añade to a este infinitivo.|Cleaned no es forma base.|Cleaning no es el complemento de make causativo aquí.
13|quantifier|Milk incontable admite much bajo negación.|Many requiere contables plurales.|Few requiere contables plurales.|Some necesitaría un contexto contrastivo especial; much es la lectura de cantidad negativa.|
14|anomaly|Los conectores ofrecen relaciones discursivas diferentes que pueden ser gramaticales; falta contexto para una clave única.||||
15|be|People es plural y usually presenta una caracterización actual: are.|Were sitúa la caracterización en pasado.|Is no concuerda con people.|Was no concuerda con people.|
16|passive|Documents plural recibe el envío en pasado: were sent.|Have been sending es activa y falta objeto.||Sent sin auxiliar convierte documents en agente.|Are sending es activa y no concuerda con el pasado yesterday.
17|exclamation|How intensifica expensive en una exclamación sin artículo.|How no lleva a.||How no lleva an.|What an no puede introducir cars plural.
18|quantifier|Each determina student singular y distribuye la tarea individualmente.|All exige normalmente students plural.|Each of necesita the students u otro grupo definido plural.|All of necesita un grupo definido, no student singular.|
19|preposition|At the end of the street indica un punto espacial.|In the end significa finalmente y no esta ubicación.|On no es la locución de punto.|Into expresa movimiento hacia el interior.|
20|preposition|Un día con parte del día usa on Friday morning.|In se usa para partes del día sin el día especificado.|At no se usa con Friday morning.||When necesitaría una cláusula, no solo el grupo temporal.
`);
add(17,`
1|past|Did she come mantiene come en forma base y orden interrogativo.|Comed no es pasado normativo y falta did.|Came no sigue a did.||Coming no sigue a did.
2|present|Beatrice singular necesita takes y often precede al verbo. |Take no concuerda.|Take no concuerda y often no suele separar take de its objeto.||Tooks no es una forma verbal normativa.
3|future|Will be expresa la edad futura con base be.|Been no sigue a will.|Going necesita to.|Will no lleva to.|
4|perfect|Has lived concuerda con she; since she was five y since ten years ago son puntos iniciales admisibles.|Have no concuerda y living necesitaría been.||For no introduce ten years ago.|
5|comparative|The safest city in Spain usa superlativo y ámbito espacial.||Safer es comparativo; of no introduce aquí el país como ámbito.|Safest debe preceder al nombre city.|A no concuerda con cities y no presenta el superlativo definido.
6|pronoun|Richard y he remiten al reflexivo singular himself.|Himselves mezcla singular y plural.|Heself no es la forma normativa.|Himselve no es la grafía normativa.|
7|noun|Some nice furniture mantiene el incontable sin a ni plural.|Furniture no admite a en su lectura de mobiliario.||Furniture no añade -s.|Furniture no añade -s.
8|exclamation|What nice glasses usa what con un nombre plural sin a.|How a no construye la exclamación plural.|How no introduce así glasses.|A no determina glasses plural.|
9|ability|Could you speak pregunta capacidad pasada y couldn’t la niega.|Spoken no sigue a could.|Spoke no sigue a could y can’t cambia el tiempo.||Speaking no sigue a can.
10|preposition|Opposite y between sitúan la biblioteca respecto de los lugares dados.|Opposite no necesita of.||In front necesita of y near no lleva of.|Beside no lleva of.
11|used|Did you use to play pregunta hábito pasado con use sin -d.||Used no sigue a did.|Used debe ser use y playing debe ser play.|Used debe ser use y played debe ser play.
12|tag|Has found se retoma con hasn’t she.|Didn’t corresponde a pasado simple.|Isn’t retoma be.|Haven’t no concuerda con she.|
13|connector|Because of admite el grupo nominal his age.|In spite necesita of.||Due necesita to.|Although necesita una cláusula, no solo his age.
14|relative|Where introduce el lugar donde ocurrió la cena.||Who se refiere a personas.|Which necesita una preposición como at para esta estructura.|Whose expresa posesión y necesitaría nombre.
15|adverb|Fast modifica drive sin -ly; heavily modifica raining.|Fastly no es la forma ordinaria y heavy es adjetivo.||Heavyly no aplica y → i.|Fasten es verbo, no adverbio de velocidad.
16|conditional2|Would you do y if you won combinan pregunta y condición hipotética.|Did no sigue a would.|Done no sigue a would y win cambia el patrón temporal.||El sujeto debe preceder a do y would no forma la condición neutra aquí.
17|perfect|Show singular exige has; begun es participio y already indica ya.|Have no concuerda y yet no encaja en esta afirmativa.||Began es pasado simple.|Began es pasado simple.
18|reported|Would finish y the next day relatan will finish y tomorrow.|Finished no sigue a would.|Have necesita participio finished.|Had necesita finished y day before invierte tomorrow.|
19|existential|There will be presenta existencia de problemas futuros.||Falta there y have be no forma esta existencia.|Been no sigue a will.|Will no lleva to.
20|quantifier|Money incontable pide how much; coins plural admite a few.|Many no cuantifica money y a few of requiere otro determinante.|A little no cuantifica coins.||Many no cuantifica money y a little no cuantifica coins.
`);
add(18,`
1|preposition|La estación winter se sitúa con in.|On se usa con días, no estaciones.|At no es la preposición ordinaria de estación.|Of no sitúa la visita en invierno.|
2|perfect|Have ever exige el participio been.|Being no es participio perfecto.|Was es pasado simple.||Were es pasado simple.
3|past-continuous|Departed cuenta la salida del tren y were waiting describe la espera.|Departing carece de auxiliar.||Los dos participios en -ing carecen de auxiliares.|Were no concuerda con train.
4|purpose|La instrucción pide localizar incorrecciones: b omite a ante job y c usa for look, por eso ambas están admitidas.|To look for a job expresa finalidad correctamente: no es la incorrección pedida.|||So as to look for a job expresa finalidad correctamente.
5|question|Does Peter work mantiene auxiliar, sujeto y verbo base.||Works duplica la tercera persona ya marcada en does.|Mere no es el interrogativo where y falta auxiliar.|Working no sigue a does.
6|vocabulary|Eager es un adjetivo que admite for us to see y expresa impaciencia o entusiasmo.|Anxiety es sustantivo, no adjetivo.|Delight es nombre/verbo, no el adjetivo delighted.|Willingness es un sustantivo.|
7|question|Twice a week responde a how often, que pregunta frecuencia.|Where pregunta lugar.|How many necesita un nombre contable.||How days no forma un interrogativo de frecuencia.
8|connector|Although y though introducen una concesión seguida de I haven’t trained enough.||Even solo no introduce esta cláusula concesiva.||So expresa consecuencia, distinta de la relación concesiva de la clave.
9|past-perfect|Had written contiene participio y sitúa las cartas antes de la visita.|Has writing necesitaría been para un continuo.|Is write no es un tiempo verbal.|Writed no es participio normativo.|
10|time|For introduce una duración expresada en years.||Since necesitaría un punto inicial.|At no introduce esta duración.|Yet no enlaza con years como complemento de duración.
11|obligation|Doesn’t need permite conservar to come ya escrito y concuerda con he.||Needn’t modal no lleva to, que ya aparece fuera del hueco.|Need no concuerda con he.|Don’t no concuerda con he.
12|pronoun|They se seca a sí mismo como grupo: themselves.|They es sujeto, no objeto reflexivo.|Their es posesivo ante nombre.||Theirself no es el plural reflexivo estándar.
13|used|Used to smoke contrasta un hábito pasado con su cese actual.|Uses to no es la forma de hábito presente estándar.||Used not smoke omite to.|Smoke no concuerda con father y no expresa el pasado contrastado.
14|relative|People es antecedente personal y el relativo es sujeto de live: who.|Which no es el relativo personal ordinario.|Whose necesita nombre poseído.||What no sigue a antecedente nominal expreso.
15|bare|Let me buy lleva objeto me y base buy sin to.|Buying no es el infinitivo requerido.||Let en activa no añade to.|Bought no es forma base.
16|conditional2|Came y would forget construyen una hipótesis.|Come con would requiere una lectura mixta no especificada.||Had forget no es una cadena verbal.|Came y will no forman el patrón hipotético neutro.
17|passive|El palacio recibe la construcción: was built; by introduce al constructor.|Built sin was convierte al palacio en agente.|Falta was y from no introduce al agente.||Builded no es participio normativo y from no introduce agente.
18|connector|Despite admite having como complemento en -ing.|In spite necesita of.|However requiere otra puntuación y estructura.||Also no expresa concesión ni enlaza así con having.
19|so|Never hace negativa la primera frase: nor has he mantiene el auxiliar perfecto.|So corresponde a coincidencia afirmativa.||So no refleja la negación y did cambia el tiempo.|Did no retoma have been.
20|exclamation|La instrucción pide la expresión incorrecta: How idea brilliant altera la construcción; puede corregirse como What a brilliant idea!|What a brilliant idea es normativa, por lo que no es la incorrección solicitada.|How brilliant it is es normativa.|What an idea es normativa.|
`);

// The final historical model repeats earlier items with small spelling/key-order changes.
const repeat19={1:'tag',2:'quantifier',3:'gerund',4:'continuous',5:'imperative',6:'used',7:'pronoun',8:'preposition',9:'future-perfect',10:'16-17',11:'16-15',12:'16-7',13:'16-1',14:'16-5',15:'passive',16:'reported',17:'comparative',18:'obligation',19:'16-8',20:'question',21:'3-5',22:'3-14',23:'8-18',24:'used',25:'1-20',26:'past',27:'4-15',28:'4-16',29:'1-8',30:'reported',31:'10-4',32:'9-8',33:'9-15',34:'1-4',35:'frequency',36:'modal',37:'3-13',38:'3-3',39:'5-1',40:'1-19',41:'modal'};
for(const [n,from] of Object.entries(repeat19))if(/^\d+-\d+$/.test(from))specs[`oficial-19-${n}`]={...specs[`oficial-${from}`],reasons:[...specs[`oficial-${from}`].reasons]};
add(19,`
1|tag|Can’t negativo se confirma con can you positivo; you ya está fuera del hueco.|Can’t mantiene la misma polaridad y necesitaría otra intención de eco.||Doesn’t no retoma can.|Do no retoma can.
2|quantifier|Money es incontable: so much expresa una cantidad grande.|So solo no determina money.|Many requiere contables plurales.||Few requiere contables plurales.
3|gerund|Before funciona como preposición y admite going como complemento.|Go no es la forma requerida tras esta preposición.||To go no sigue a before en esta estructura.|Before no exige of ni forma base go.
4|continuous|Are you doing forma presente continuo para un plan de sábado.|Will necesita be antes de doing.||Going necesita to delante de do.|Falta are para formar la pregunta.
5|imperative|Don’t drink es el imperativo negativo moderno de uso habitual.|Drink not pertenece a un registro literario o arcaizante, no a la orden neutral de examen.|No no se coloca así detrás del imperativo.||No drink no es una orden personal ordinaria completa.
6|used|Used to play expresa hábito pasado con verbo base.|Use to carece de -d en la afirmativa.||Was used play necesitaría otra construcción.|Played no es base tras to.
7|pronoun|My friend se retoma con she, de modo que el reflexivo es herself.||Himself no coincide con she.|Sheself no es forma estándar.|Herselves no es forma estándar singular.
8|preposition|As a teacher expresa profesión y for two years duración.|Since necesita punto inicial. |Like a teacher expresa semejanza, no el trabajo desempeñado adoptado por la clave.|Of no expresa profesión aquí y during no introduce esta duración.|
9|future-perfect|Will have finished sitúa el final de la corrección antes de las cinco.|Finished no sigue directamente a will.||Have exige finished, no finish.|Finishes no sigue a will.
15|passive|Exercises reciben la acción: will be done; by introduce a las chicas.|Be doing expresa una acción activa, no pasiva.| |Make exercises significaría crearlos; do exercises resolverlos: la clave adopta esta última lectura.|Is no sigue a will.
16|reported|Had gone, she y her conservan el perfecto, la persona y la posesión.|Went no es participio de go.|His altera la referencia posesiva.|Go no es participio y his cambia el referente.|
17|comparative|Worse es el comparativo irregular de bad y se enlaza con than.||Worst es superlativo.|Badder no es el comparativo estándar.|Badder no es el comparativo estándar; esta opción duplica la anterior.
18|obligation|Will have to get up combina futuro y obligación con un solo to.|Have sin to no enlaza con get up.|Will no combina con must.||Had no sigue a will.
20|question|How long pregunta cuánto tiempo ha durado la espera.|How time no es el interrogativo de duración.|How far pregunta distancia.|How often pregunta frecuencia, no duración de esta espera.|
24|used|Used to play afirma un hábito pasado y didn’t use to play lo niega.|Played no sigue a used to.|Use necesita -d en afirmativa y used no sigue a did.|Playing no sigue a used to de hábito.|
26|past|Met es pasado de meet y permite narrar el encuentro en el parque.||Have no concuerda con she.|Meet no es participio después de has.|Meet no concuerda con she.
30|reported|He would lend me his car y the next day conservan persona, posesión y tomorrow.|Lend no es participio y your/previous day cambian referencias.|Would have necesita lent y cambia el aspecto.||Lent no sigue directamente a would.
35|frequency|Daughter-in-law es singular: hardly ever goes to the gym.|Go no concuerda con el sujeto singular.||Go no concuerda y falta to ante the gym.|Go no concuerda y hardly ever rompe go to the gym en la colocación neutra.
36|modal|Might go y may go son posibilidades gramaticales admitidas.|Able necesita to.|Might no añade -s.||
41|modal|Should go ofrece consejo y conserva verbo base.|Ought necesita to.|Should no lleva to.||Gone no es base tras should.
`);
// Key order differs in these repeated items; preserve the exact option diagnoses.
specs['oficial-19-29'].reasons=['Farest no es superlativo normativo.','Fartherest mezcla dos terminaciones.','','Furtest omite la h de furthest.'];
specs['oficial-19-23'].reasons[2]='Youselves omite la r de yourselves.';


// ---- Materialization -------------------------------------------------------
// The official specifications above are hand-reviewed per item. Training
// records use the reviewed bank key plus a deterministic concept catalogue;
// the runtime never invents explanations or calls a remote model.
rule('have','Have / has / had: posesión y auxiliar','Have cambia a has con tercera persona singular y a had en pasado. Como auxiliar de los tiempos perfectos, va seguido de participio.','Primero decide si have expresa posesión o forma un tiempo perfecto.','My neighbour has two bicycles.','quantifiers-nouns',BC+'english-grammar-reference/have-got-and-have');
rule('article','A, an y artículo cero','A/an acompañan un nombre contable singular; an se usa ante sonido vocálico. Los plurales e incontables pueden aparecer sin artículo según el sentido.','Escucha el sonido inicial y comprueba si el nombre es singular contable.','She bought an umbrella and a map.','quantifiers-nouns',BC+'english-grammar-reference/articles-a-an-the');
rule('greeting','Saludos y fórmulas según el momento','Las fórmulas de saludo dependen de la situación y la hora: good morning, good afternoon, good evening; good night suele usarse al despedirse o antes de dormir.','No traduzcas palabra por palabra: identifica primero el momento y si se saluda o se despide.','Good evening, everyone. See you tomorrow; good night.','quantifiers-nouns',CAM+'good-evening');

const GENERATED_CONCEPT = Object.freeze({
  'Present simple':'present','Present continuous':'continuous','Past simple':'past','Past continuous + past simple':'past-continuous',
  'Present perfect':'perfect','Future: will':'future','First conditional':'conditional1','Second conditional':'conditional2','Third conditional':'conditional3',
  'Passive voice':'passive','Modal verbs':'modal','Question tags':'tag','Relative clauses':'relative','Quantifiers':'quantifier',
  'Prepositions of time':'time','Gerund / infinitive':'gerund','Used to':'used','Comparatives':'comparative','Adverbs':'adverb','There is / There are':'existential'
});
const STANLEY_CONCEPT = Object.freeze({
  'To be':'be','There is / There are / Much / Many':'existential','Some / Any / A / An':'some-any',
  'There was / There were':'existential','Present / Habitual':'present','Do / Does / Don’t / Doesn’t':'present','Possessive case':'possessive',
  'Going to':'future','On / In / At':'preposition','Did':'past','Time / Gerund':'gerund','Future / Shall / Will / Transport':'future',
  'Do / Make':'do-make','Imperative / I think so':'so','Tell / Say / So much / So many':'say-tell','Past Continuous':'past-continuous',
  'Can / Could / To be able':'ability','Present Perfect':'perfect','Relative Pronouns':'relative','The one who / Nouns as adjectives':'relative',
  'Past Perfect':'past-perfect','Future Perfect':'future-perfect','Comparatives / Superlatives':'comparative','Must / Have to':'obligation',
  'Conditional':'conditional2','Active / Passive':'passive','Irregular comparatives / Superlatives':'comparative','Imperative':'imperative',
  'Age / Question tags':'tag','Still / Yet / Already / Since / For / During':'time'
});
const ACTIVE_VOICE_REVIEW = Object.freeze({
  'stanley-63-12':{
    why:'«Mr Johnson» realiza la acción y «this book» la recibe, así que la oración debe ir en voz activa. «Translated» es el pasado simple de translate: “Mr Johnson translated this book”. La pasiva equivalente sería “This book was translated by Mr Johnson”.',
    reasons:{
      a:'«is translated» crea una pasiva en presente y convertiría a Mr Johnson en quien recibe la acción; no encaja con “this book” como objeto.',
      b:'«translated by» es un fragmento de estructura pasiva: falta el auxiliar y “by” debería introducir al agente, no preceder al objeto “this book”.',
      c:'«translated» completa correctamente el pasado simple activo: Mr Johnson es el agente y this book es el objeto.',
      d:'«was translated by» forma una pasiva en pasado y haría que Mr Johnson fuese el receptor de la acción; además “by this book” produciría un sentido incorrecto.'
    }
  },
  'stanley-63-17':{
    why:'«They» realiza la acción sobre «this car», por lo que se necesita voz activa. Después de will va la forma base: “They will buy this car soon”.',
    reasons:{
      a:'«be bought» forma una pasiva después de will; exigiría que el sujeto fuese aquello que se compra, pero aquí “They” es quien compra.',
      b:'«buying» no puede ir sola después de will: tras will se usa la forma base.',
      c:'«buy» es la forma base correcta después de will y mantiene la oración en voz activa.',
      d:'«is bought» mezcla un presente pasivo con “will” ya presente en la oración y no puede completar la estructura.'
    }
  },
  'stanley-64-05':{
    why:'«The baby» realiza la acción de beber y «the milk» la recibe, así que corresponde la voz activa: “The baby will drink the milk”.',
    reasons:{
      a:'«is going to be drunk» convertiría al bebé en aquello que va a ser bebido y deja “the milk” sin una función correcta.',
      b:'«will drink» expresa correctamente la acción futura en voz activa: el bebé bebe la leche.',
      c:'«will be drunk by» es una pasiva; haría que el bebé fuese bebido por la leche, lo que invierte los papeles semánticos.',
      d:'«is drunk by» también es pasiva y produce la misma inversión incorrecta entre agente y receptor.'
    }
  },
  'stanley-64-14':{
    why:'«My brother» es quien realiza la reparación. “At the moment” señala una acción en curso, por eso se usa presente continuo activo: “My brother is repairing the TV set at the moment”.',
    reasons:{
      a:'«has repaired» expresa un resultado en present perfect, no una acción en desarrollo indicada por “at the moment”.',
      b:'«is repairing» combina be + -ing y describe correctamente la acción que está realizando el sujeto ahora mismo.',
      c:'«repaired» es pasado simple y no encaja con el marcador “at the moment”.',
      d:'«was repaired by» es una pasiva en pasado y además convertiría a “my brother” en receptor de la reparación.'
    }
  },
  'stanley-64-19':{
    why:'El contexto presenta a «he» como líder, es decir, como quien guía a los demás. Se necesita voz activa: “he will lead the others”.',
    reasons:{
      a:'«was led» es pasiva en pasado y significa que él fue guiado por otra persona.',
      b:'«is led» es pasiva en presente y también lo convierte en receptor de la acción.',
      c:'«will be led» es pasiva en futuro: significaría que otros lo guiarán a él.',
      d:'«will lead» mantiene a “he” como agente y expresa correctamente que él guiará a los demás.'
    }
  }
});
function conceptForTraining(q){
  if(ACTIVE_VOICE_REVIEW[q.id])return'voice-choice';
  if(GENERATED_CONCEPT[q.tema])return GENERATED_CONCEPT[q.tema];
  const accepted=String(q.opciones?.[q.respuesta_correcta]||'').toLowerCase();
  const text=`${q.pregunta||''} ${accepted}`.toLowerCase();
  if(q.tema==='Has / Have / Adjectives / Greetings'){
    if(/\b(morning|afternoon|evening|night)\b/.test(accepted))return'greeting';
    if(/\b(has|have|had)\b/.test(accepted))return'have';
    return 'vocabulary';
  }
  if(q.tema==='Had / Man-Men / Woman-Women / Child-Children / People')return /\bhad\b/.test(accepted)?'have':'noun';
  if(q.tema==='Was / Were / This / That / These / Those')return /\b(this|that|these|those)\b/.test(accepted)?'demonstrative':'be';
  if(q.tema==='Regular / Irregular verbs'){
    if(/\b(at|in|on|by|for|since|from|to|of|with|under|over|between|near)\b/.test(accepted))return'preposition';
    if(/\b(was|were)\b/.test(accepted))return'be';
    return'past';
  }
  return STANLEY_CONCEPT[q.tema] || (questionTopic('english',q)==='prepositions-patterns'?'preposition':'vocabulary');
}
function sourceOf(q){return q.id.startsWith('oficial-')?'official':q.id.startsWith('stanley-')?'stanley':'generated';}
function short(text,max=150){const value=String(text||'').replace(/\s+/g,' ').trim();return value.length<=max?value:value.slice(0,max-1).replace(/\s+\S*$/,'')+'…';}
function acceptedText(q){return (q.validAnswers||[q.respuesta_correcta]).map(k=>`${k.toUpperCase()} — ${q.opciones[k]}`).join(' / ');}
function distractorReason(concept,q,key,accepted){
  const option=String(q.opciones?.[key]??'').trim(), lower=option.toLowerCase();
  const common={
    'present':'El presente simple exige concordancia con el sujeto y, si aparece do/does, el verbo principal queda en forma base.',
    'continuous':'El continuo necesita una forma de be y un verbo en -ing que concuerden con el sujeto.',
    'past':'El pasado terminado exige la forma de pasado; después de did el verbo vuelve a la forma base.',
    'past-continuous':'El pasado continuo usa was/were + -ing; el hecho puntual que lo acompaña suele ir en pasado simple.',
    'perfect':'El present perfect usa have/has + participio, no pasado simple aislado ni una forma en -ing sin been.',
    'past-perfect':'El past perfect usa had + participio para marcar el hecho anterior a otra referencia pasada.',
    'future':'Will lleva forma base; be going to necesita am/is/are + going to + infinitivo.',
    'future-perfect':'El futuro perfecto exige will have + participio; para duración, will have been + -ing.',
    'conditional1':'La primera condicional suele usar presente tras if/unless y will + forma base en el resultado.',
    'conditional2':'La hipótesis de segundo tipo combina pasado en la condición con would + forma base en el resultado.',
    'conditional3':'La hipótesis pasada combina had + participio con would have + participio.',
    'modal':'Tras un modal se usa la forma base, sin -s y normalmente sin to.',
    'ability':'Can/could van con forma base; be able to necesita una forma de be y to.',
    'obligation':'Must va con forma base; have to se conjuga y permite had to o will have to.',
    'passive':'La voz pasiva exige una forma de be y participio; el sujeto recibe la acción.',
    'voice-choice':'En activa, el sujeto realiza la acción; en pasiva, el sujeto la recibe y normalmente aparece be + participio.',
    'tag':'La coletilla debe reutilizar el auxiliar y un pronombre que concuerde con el sujeto.',
    'relative':'El relativo depende del antecedente y de su función como sujeto, objeto o posesivo.',
    'question':'Una pregunta directa coloca normalmente auxiliar antes del sujeto; una indirecta mantiene orden enunciativo.',
    'pronoun':'El pronombre debe coincidir en persona, número y función con su referente.',
    'possessive':'El genitivo y los posesivos dependen de quién posee y de si el poseedor es singular o plural.',
    'quantifier':'El cuantificador debe concordar con un nombre contable o incontable y con su número.',
    'some-any':'A/an, some y any dependen de si el nombre es singular contable, de su sonido inicial y de la polaridad del enunciado.',
    'article':'El artículo depende de si el nombre es singular contable y del sonido inicial de la palabra siguiente.',
    'noun':'El nombre y su determinante deben respetar número y condición de contable o incontable.',
    'existential':'La construcción existencial usa there + be y ajusta be al tiempo y al número relevantes.',
    'demonstrative':'This/that son singulares y these/those plurales; la distancia depende del contexto.',
    'comparative':'La comparación exige la forma comparativa o superlativa adecuada y el enlace correcto, como than o as.',
    'adverb':'Un adverbio de modo modifica al verbo; un adjetivo no ocupa automáticamente la misma función.',
    'frequency':'Los adverbios de frecuencia tienen una posición típica y el verbo debe seguir concordando con el sujeto.',
    'time':'For expresa duración, since punto inicial y las preposiciones temporales dependen de la unidad de tiempo.',
    'preposition':'La preposición depende de la relación temporal, espacial o del régimen de la expresión completa.',
    'transport':'Los medios de transporte usan combinaciones fijas como by bus y on foot.',
    'gerund':'Cada verbo o preposición selecciona infinitivo o -ing; tras una preposición, una acción suele ir en gerundio.',
    'bare':'Let y make en activa llevan objeto + infinitivo sin to.',
    'used':'Used to + forma base expresa hábito pasado; did exige use to y be used to lleva nombre o -ing.',
    'do-make':'Do y make forman colocaciones fijas que deben aprenderse como unidades.',
    'say-tell':'Tell suele llevar destinatario directo; say necesita otra estructura y los cuantificadores dependen del nombre.',
    'reported':'El estilo indirecto conserva referentes y ajusta persona, tiempo y expresiones temporales al nuevo punto de vista.',
    'purpose':'La finalidad verbal se expresa normalmente con to/in order to/so as to + forma base.',
    'connector':'El conector debe encajar con la relación lógica y con el tipo de complemento que lo sigue.',
    'imperative':'El imperativo usa forma base; la negación habitual es don’t + base y let’s propone una acción conjunta.',
    'so':'So puede sustituir una idea afirmativa o formar respuestas concordantes; nor/neither corresponden a negativas.',
    'have':'Have/has/had debe concordar con el sujeto y con el tiempo; como auxiliar perfecto va seguido de participio.',
    'greeting':'La fórmula depende de la hora y de si se está saludando o despidiendo.',
    'vocabulary':'La opción debe aportar el significado y la categoría gramatical que exige la frase.'
  };
  const detail=common[concept]||common.vocabulary;
  return `«${option}» no es la opción adoptada en esta entrada. ${detail} Compárala con «${accepted}».`;
}
function correctionFor(q){
  const primary=q.opciones?.[q.respuesta_correcta]||'';
  const reconstructed=reconstructEnglish(q.pregunta,primary);
  return reconstructed?{text:reconstructed,kind:hasGap(q.pregunta)?'sentence':'answer'}:{text:String(primary).trim(),kind:'answer'};
}
function makeOfficial(q){
  const spec=specs[q.id];
  if(!spec)throw Error(`Missing official Professor review: ${q.id}`);
  const anomaly=!!q.neutralized;
  const concept=anomaly?'anomaly':spec.concept;
  const r=catalog[concept];if(!r)throw Error(`Unknown official concept ${concept} for ${q.id}`);
  const accepted=q.validAnswers||[q.respuesta_correcta],correction=anomaly?{text:'',kind:'none'}:correctionFor(q);
  const reason=anomaly?(q.reviewNote||'El enunciado conservado no permite afirmar una única solución con seguridad.') : spec.why;
  const optionReasons={};
  for(const [i,key] of ['a','b','c','d'].entries()){
    if(anomaly){
      const specific=spec.reasons?.[i]?.trim();
      const prefix=q.validAnswers?.includes(key)
        ? `«${q.opciones[key]}» es una de las lecturas plausibles registradas, pero el ítem está anulado y no se presenta como solución única.`
        : key===q.respuesta_correcta
          ? `«${q.opciones[key]}» es la clave histórica conservada; no se trata como una solución verificada.`
          : `«${q.opciones[key]}» no se usa para corregir porque el ítem está anulado.`;
      optionReasons[key]=specific?`${prefix} ${specific}`:`${prefix} El texto conservado no permite validar esta opción como solución única.`;
    } else if(accepted.includes(key)) optionReasons[key]=`«${q.opciones[key]}» está admitida en esta entrada. ${spec.why}`;
    else optionReasons[key]=spec.reasons?.[i]?.trim()||distractorReason(concept,q,key,q.opciones[q.respuesta_correcta]);
  }
  return {id:q.id,source:'official',status:anomaly?'anomaly':'editorial',sourceVerified:false,acceptedKeys:[...accepted],conceptId:r.id,topicId:r.topic||questionTopic('english',q),ruleId:r.id,originalText:q.pregunta,correctedText:correction.text,correctionKind:correction.kind,
    quick:anomaly?'Esta pregunta está anulada: el texto conservado no permite una solución única.':`Respuesta admitida: ${acceptedText(q)}. ${short(spec.why,115)}`,
    whyCorrect:reason,optionReasons,examTrap:r.tip,memoryTip:`Regla de bolsillo: ${r.tip}`,exampleGood:r.example,exampleContrast:anomaly?'En un ítem dañado o ambiguo, separa lo que el texto demuestra de lo que solo sugiere la clave histórica.':`Antes de responder, contrasta la estructura de «${q.opciones[q.respuesta_correcta]}» con el resto de opciones.`,
    ...(anomaly?{anomalyReason:reason}:{}),linguisticReview:'item-by-item-editorial-review',provenanceNote:'La explicación se apoya en una regla externa; la plantilla oficial de origen no fue cotejada.'};
}
function makeTraining(q){
  const concept=conceptForTraining(q),r=catalog[concept];if(!r)throw Error(`Unknown training concept ${concept} for ${q.id}`);
  const accepted=q.validAnswers||[q.respuesta_correcta],correction=correctionFor(q),primary=q.opciones[q.respuesta_correcta];
  const voiceReview=ACTIVE_VOICE_REVIEW[q.id];
  const evidence=voiceReview?voiceReview.why:short(q.reviewNote||q.regla||q.explicacion_profesor||q.explicacion||r.plain,220);
  const optionReasons={};
  for(const key of ['a','b','c','d']){
    if(voiceReview?.reasons?.[key])optionReasons[key]=voiceReview.reasons[key];
    else optionReasons[key]=accepted.includes(key)?`«${q.opciones[key]}» es una respuesta admitida. ${r.plain}`:distractorReason(concept,q,key,primary);
  }
  const whyCorrect=voiceReview?voiceReview.why:`En esta entrada, «${primary}» es la respuesta revisada. ${evidence} Regla aplicada: ${r.plain}`;
  return {id:q.id,source:sourceOf(q),status:'editorial',sourceVerified:false,acceptedKeys:[...accepted],conceptId:r.id,topicId:questionTopic('english',q)||r.topic,ruleId:r.id,originalText:q.pregunta,correctedText:correction.text,correctionKind:correction.kind,
    quick:`Respuesta admitida: ${acceptedText(q)}. ${short(voiceReview?voiceReview.why:r.plain,110)}`,
    whyCorrect,optionReasons,examTrap:r.tip,memoryTip:`Para recordarlo: ${r.tip}`,exampleGood:r.example,exampleContrast:voiceReview?'Compara la oración activa con su equivalente pasiva y comprueba quién realiza realmente la acción.':`Compara «${primary}» con el distractor que más se le parezca y localiza la diferencia de estructura antes de decidir.`,
    linguisticReview:'editorial-bank-review',provenanceNote:q.id.startsWith('stanley-')?'Clave revisada editorialmente; la plantilla Stanley de origen no se considera cotejada.':'Pregunta de entrenamiento revisada editorialmente; no es material oficial.'};
}

const {groups}=loadBanks();
const covered=[...groups.englishOfficial,...groups.englishTraining.filter(q=>q.id.startsWith('generada-')||q.answerStatus==='editorial-reviewed'&&q.reviewConfidence==='high')];
const records=covered.map(q=>q.id.startsWith('oficial-')?makeOfficial(q):makeTraining(q));
if(records.length!==1261)throw Error(`Unexpected English Professor coverage: ${records.length}`);
if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('Duplicate English Professor record ID');
fs.mkdirSync('data/professor',{recursive:true});
fs.writeFileSync('data/professor/english.json',JSON.stringify({version:1,records},null,2)+'\n');
fs.writeFileSync('data/professor/english-rules.json',JSON.stringify({version:1,rules:Object.values(catalog)},null,2)+'\n');
const by=(field)=>Object.fromEntries([...new Set(records.map(r=>r[field]))].sort().map(v=>[v,records.filter(r=>r[field]===v).length]));
const anomalies=records.filter(r=>r.status==='anomaly');
const report=`# Auditoría del Profesor: inglés\n\nCobertura materializada: **${records.length} preguntas** (401 oficiales, 500 generadas y 360 Stanley con revisión editorial alta). El generador no modifica los bancos fuente ni \`reports/baseline.json\`.\n\n## Estado\n\n\`\`\`json\n${JSON.stringify({bySource:by('source'),byStatus:by('status'),rules:Object.keys(catalog).length,anomalies:anomalies.length},null,2)}\n\`\`\`\n\nLas 401 entradas oficiales disponen de explicación revisada por ítem y diagnóstico de las cuatro opciones. Las preguntas con varias lecturas admitidas conservan todas sus \`validAnswers\`; las neutralizadas se presentan como anomalías y nunca como una solución única. Las fichas generadas y Stanley usan el dictamen editorial del banco más una regla pedagógica determinista y fuentes permitidas de British Council/Cambridge.\n\n## Seguridad y límites\n\nEl Profesor se ejecuta localmente y no consulta una IA remota. Las fuentes enlazadas respaldan reglas gramaticales, pero no certifican por sí solas la clave de una plantilla histórica. \`sourceVerified\` permanece en falso porque no se ha cotejado una plantilla oficial autenticada. Los snapshots históricos incompatibles usan el fallback seguro en lugar de fabricar una explicación.\n\n## Anomalías neutralizadas\n\n${anomalies.map(r=>`- **${r.id}**: ${String(r.anomalyReason).replace(/\s+/g,' ')}`).join('\n')}\n`;
fs.writeFileSync('reports/professor-english-audit.md',report);
console.log(JSON.stringify({records:records.length,rules:Object.keys(catalog).length,bySource:by('source'),byStatus:by('status')},null,2));
