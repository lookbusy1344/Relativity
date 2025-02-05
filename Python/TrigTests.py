"""
Both at 300 decimal places of precision
Python and C# match to within 87-90 decimal places

                 0        1         2         3         4         5         6         7         8         9         10
Number count     12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890

C# Cosh(0.5) = 1.127625965206380785226225161402672012547847118098667483628985735187858770303982016315712065 8462491753056539757794361865670019201439143760931687853767690233912429978231325945416685450643388209803873261132075415556186697972528111991929675128125257696972967395854237082630788790993392467498779296875000
Py Cosh(0.5) = 1.127625965206380785226225161402672012547847118098667483628985735187858770303982016315712065 78217804951464521377517366109060448753039127784659107563771886861081850195280762592799623218175369490007062873859358580210384263298778774231025015105090994251395204467912323113079697454501250718983123007902021

C# Sinh(0.5) = 0.521095305493747361622425626411491559105928982611480527946093576452802250890233592317064454 63413444012721649592915632103210801119341091989577548883869143138017515754701527083971037482416389172435329645489340869520032746284062777340320852415834508480789848410170972403676614703726954758167266845703125
Py Sinh(0.5) = 0.521095305493747361622425626411491559105928982611480527946093576452802250890233592317064454 27418859348822142398113413591406667944482833131324989581477119118611092070629077798672371628290579434482624016674283266361699843366907205777867483016080234486126292751638874047823711657060729268000873056363488

C# Tanh(0.5) = 0.4621171572600097585023184836436725487302892803301130385527318158380809061404092787749490641 63404954547690500324317360605546721031418196680507872304069067122456304459173218885781215702371116196892668944464526328985299263354102277304493481616673698593397045424405189528727078140946105122566223144531250
Py Tanh(0.5) = 0.4621171572600097585023184836436725487302892803301130385527318158380809061404092787749490641 51962490584348932986281549132882265461869597895957144611615878563329132704166776939197372567930770270037301448608599262409581783611892899146703802769221335681782847733322189941264788013079341287738074200200096

C# Acosh(1.123) = 0.491035786957973891353286858955502250090621789095766806865735361988627555435033439178700 7005721213576875324403214044368643789422418971583458306159615036775892971635264736845288215725677400932049103564265427732284145623136412529574069462081269343142275155840838565812767058105237083509564399719238281250
Py Acosh(1.123) = 0.491035786957973891353286858955502250090621789095766806865735361988627555435033439178700 699705943082871312376482952658864680437901327040485564140342526054250202470542620325960855014747995948802781802381194747189377457442878078669703772717282261386076533115465723683447540331743478712659557445904127076

C# Asinh(0.5) = 0.481211825059603447497758913424368423135184334385660519661018168840163867608221774412009429 4243519885834838413995468376845294739489013600582655750047049136695802804019588538795676907903500247797719016297373903705956743223743844093523447029538281915057782760149381051650863128088531084358692169189453125
Py Asinh(0.5) = 0.481211825059603447497758913424368423135184334385660519661018168840163867608221774412009429 12272347499723183995829365641127256832372673762275305924186440975418241700721183715022382393746918727524327919301879707900356172679694454575230534543418876528553256490207399693496618755630102123996367930820636

C# Atanh(0.5) = 0.54930614433405484569762261846126285232374527891137472586734716681874714660930448343680 8812487998211357193588320278928006659392775734239370484260393338398009625197468844579428276225885809938939797869550533686797605505547968609358444227732861342091308937203206728960847016196566983126103878021240234375
Py Atanh(0.5) = 0.54930614433405484569762261846126285232374527891137472586734716681874714660930448343680 7877406866044393985014532978932871184002112965259910526400935383638705301581384591690683589686849422180479951871285158397955760572795958875335673527470083387790111101585126473448780345053260752821434069018158686649

Larger numbers:

C# Cosh(23.123) = 5510123201.2791443111282650818613420258334379988732434146167393484301023462314485352303197 37404847996446785387028463567331476616356242205188052470286478002948899308547927927557554114264570729057349437003264343747091710832553370802641972032998030073258632910437881946563720703125
Py Cosh(23.123) = 5510123201.2791443111282650818613420258334379988732434146167393484301023462314485352303197 0955128411171838132510884403729979648113145226014288075570307221399997571142118913265124076194819770885815330760567987582828025342875949859547942365319652846817322865633214063264303746998352885789699886964986056

C# Sinh(23.123) = 5510123201.2791443110375230091824720154574534984149498488347041994981721609742487011890505 32467491620849455615983372681359397032579903848435063113667106615529546644549216676286717011836090939934196976527686409523197283289898899910112741069856401310289584216661751270294189453125
Py Sinh(23.123) = 5510123201.2791443110375230091824720154574534984149498488347041994981721609742487011890505 0636187512966417968251016358517559975961327679407135437731259437330157296305180985020269889325154573748931342084155034147308030071234165405879398789072119388756735143035811143672513434473318392297875939001716899

C# Tanh(23.123) = 0.999999999999999999983531752491885345637693289166333624661533063277950117780606843868154379 582978724491871472990559793495836181245724841022633845185233835192300446863089374504633481867081040543299638221853405204207223764395097820226530727350396945957455602672220296156524455000180751085281372070312500
Py Tanh(23.123) = 0.999999999999999999983531752491885345637693289166333624661533063277950117780606843868154379 765470420474221097526796382622376114576762869195722370750965031740995499127782347779096457666967818156592040017088983957629859064832822774675201193782243108354628049649315400218368536400248812147461276635731872

C# Acosh(23.123) = 3.83350707005452496032980848816385219844752978697584207291775379143490402561638082518313 69444788158845528483494490414080049221843623901639286312391838619081808300290102712625400480359405518868422578357445599673557021538337831222230152708409906581494357136717654466195881468593142926692962646484375000
Py Acosh(23.123) = 3.83350707005452496032980848816385219844752978697584207291775379143490402561638082518313 13326711431539175885760480789833225084065650483888552214520831060845195913458751675339449127484572350501275236526991496538390705079497675153039678008022965617464425380934835633787640794802841063172918047480254749

C# Asinh(23.123) = 3.8344422215279376450102962515522411667143870333260936479360674824158551808074032678562 342606863158506842154849571125397380064627828844347021781982336643848060213848126534801849827208893426125006379533665825236228124343963639430227003281071513621614314681787342997676404365847702138125896453857421875
Py Asinh(23.123) = 3.8344422215279376450102962515522411667143870333260936479360674824158551808074032678562 2864925128072584279295111720951969298927686911841406659395449393943400721060176742249236774712983261820645281827769386530025793321342055461194710773168623996094790156870734592123363375965420942192131730865442525498
"""

from mpmath import mp
from pyparsing import C

mp.dps = 300;
value = mp.mpf("0.5")
value2 = mp.mpf("1.123")
value3 = mp.mpf("23.123")

print(f"Cosh(0.5) = {mp.cosh(value)}")
print(f"Sinh(0.5) = {mp.sinh(value)}")
print(f"Tanh(0.5) = {mp.tanh(value)}")
print(f"Acosh(1.123) = {mp.acosh(value2)}")
print(f"Asinh(0.5) = {mp.asinh(value)}")
print(f"Atanh(0.5) = {mp.atanh(value)}")
print()
print(f"Cosh(23.123) = {mp.cosh(value3)}")
print(f"Sinh(23.123) = {mp.sinh(value3)}")
print(f"Tanh(23.123) = {mp.tanh(value3)}")
print(f"Acosh(23.123) = {mp.acosh(value3)}")
print(f"Asinh(23.123) = {mp.asinh(value3)}")
