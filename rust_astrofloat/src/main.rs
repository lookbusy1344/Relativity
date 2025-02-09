use crate::astro_tools::C_FLOAT;
use astro_float::expr;
use astro_tools::{bigfloat_fmt_dp, bigfloat_fmt_sig, Relativity};
// Note astro-float values are unweildy to work with directly (because of the required context),
// so the expr!() macro is used to simplify context handling in equations, eg instead of..
// let result = a.mul(&b, &mut ctx).add(&c, &mut ctx).div(&d, &mut ctx);
// ..we can write..
// let result = expr!((a * b + c) / d, &mut ctx);

mod astro_tools;

fn main() {
    // Create a new Relativity object with a precision of 300 decimal places
    let mut rel = Relativity::new(300);

    // Calculate the Lorentz factor for a velocity of 299,792,457.99999 m/s
    let lorentz_factor = rel.lorentz_factor(&rel.bigfloat_from_f64(299_792_457.999_99));
    println!(
        "Formatted lorentz factor {}",
        bigfloat_fmt_dp(&lorentz_factor, 10).unwrap()
    );

    // Calculate the Lorentz factor for a velocity of 299,792,457.9999999 m/s
    let lorentz_factor = rel.lorentz_factor(&rel.bigfloat_from_f64(299_792_457.999_999_9));
    println!(
        "Formatted lorentz factor {}",
        bigfloat_fmt_dp(&lorentz_factor, 5).unwrap()
    );

    // let x = Relativity::bigfloat_from_str("0.0001234");
    // println!("{}", bigfloat_fmt_sig(&x, 10, '0').unwrap());

    // initial velocity = 299792457.9999999 m/s
    let initial = Relativity::bigfloat_from_str("299792457.9999999");
    // convert to rapidity
    let rapidity = rel.rapidity_from_velocity(&initial);
    // double the rapidity
    let rap2 = expr!(rapidity * 2, &mut rel.ctx);
    // convert back to velocity
    let velocity = rel.velocity_from_rapidity(&rap2);

    // display the results
    println!(
        "Initial velocity = {}",
        bigfloat_fmt_dp(&initial, -1).unwrap()
    );
    println!("Rapidity = {}", bigfloat_fmt_dp(&rapidity, 5).unwrap());
    println!("Doubled rapidity = {}", bigfloat_fmt_dp(&rap2, 5).unwrap());
    println!(
        "Doubled vel = {}",
        bigfloat_fmt_sig(&velocity, 3, '9').unwrap()
    );

    // flip-and-burn 4 light years at 1g
    let distance = rel.light_years(4.0);
    let accel = rel.get_g().clone();
    let half_way = expr!(distance / 2, &mut rel.ctx);
    let time_half_way = rel.relativistic_time_for_distance(&accel, &half_way);
    let peak_velocity = rel.relativistic_velocity(&accel, &time_half_way);
    let peak_velocity_c = rel.velocity_as_c(&peak_velocity);
    let peak_rapidity = rel.rapidity_from_velocity(&peak_velocity);
    let peak_lorentz = rel.lorentz_factor(&peak_velocity);
    let time_total_years = expr!(time_half_way * 2 / 60 / 60 / 24 / 365.25, &mut rel.ctx);

    println!();
    println!("Flip and burn 4 light years at 1g:");
    println!("Distance = {} m", bigfloat_fmt_dp(&distance, 1).unwrap());
    println!("Acceleration = {} m/s", bigfloat_fmt_dp(&accel, 4).unwrap());
    println!(
        "Time half way = {} s",
        bigfloat_fmt_dp(&time_half_way, 2).unwrap()
    );
    println!(
        "Peak velocity = {} m/s",
        bigfloat_fmt_sig(&peak_velocity, 2, '9').unwrap()
    );
    println!(
        "Peak velocity = {} c",
        bigfloat_fmt_sig(&peak_velocity_c, 2, '9').unwrap()
    );
    println!(
        "Peak rapidity = {}",
        bigfloat_fmt_dp(&peak_rapidity, 5).unwrap()
    );
    println!(
        "Peak Lorentz factor = {}",
        bigfloat_fmt_dp(&peak_lorentz, 5).unwrap()
    );
    println!(
        "Total time = {} years",
        bigfloat_fmt_dp(&time_total_years, 2).unwrap()
    );

    // spacetime intervals
    let interval1 = rel.spacetime_interval_1d_f64((1.1, 1.0), (10.0, 5.0));
    let interval2 = rel.spacetime_interval_3d_f64((2.0, 1.0, 1.0, 1.0), (10.0, 5.0, 10.0, 100.0));
    let interval3 = rel.spacetime_interval_1d_f64((1.1, 1.0), (1.1, 5.0));
    let interval4 = rel.spacetime_interval_1d_f64((0.0, 0.0), (2.0, C_FLOAT * 2.0));

    println!();
    println!("Spacetime interval: {}", bigfloat_fmt_dp(&interval1, 4).unwrap());
    println!("Spacetime interval: {}", bigfloat_fmt_dp(&interval2, 4).unwrap());
    println!("Spacetime interval: {}", bigfloat_fmt_dp(&interval3, 4).unwrap());
    println!("Spacetime interval: {}", bigfloat_fmt_dp(&interval4, 4).unwrap());

    //trig_tests();
}

fn trig_tests() {
    /*
        All at 300 decimal places of precision
        Python and C# match to within 87-90 decimal places
        Rust is significantly weaker, matching to only 8 decimal places in some cases

                         0        1         2         3         4         5         6         7         8         9         10
        Number count     12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890

        C# Cosh(0.5) = 1.127625965206380785226225161402672012547847118098667483628985735187858770303982016315712065 8462491753056539757794361865670019201439143760931687853767690233912429978231325945416685450643388209803873261132075415556186697972528111991929675128125257696972967395854237082630788790993392467498779296875000
        Py Cosh(0.5) = 1.127625965206380785226225161402672012547847118098667483628985735187858770303982016315712065 78217804951464521377517366109060448753039127784659107563771886861081850195280762592799623218175369490007062873859358580210384263298778774231025015105090994251395204467912323113079697454501250718983123007902021
        Ru Cosh(0.5) = 1.127625965206380785226225161402672012547847118098667483628985735187858770303982016315712065 78217804951464521377517366109060448753039127784659107563771886861081850195280762592799623218175369490007062873

        C# Sinh(0.5) = 0.521095305493747361622425626411491559105928982611480527946093576452802250890233592317064454 63413444012721649592915632103210801119341091989577548883869143138017515754701527083971037482416389172435329645489340869520032746284062777340320852415834508480789848410170972403676614703726954758167266845703125
        Py Sinh(0.5) = 0.521095305493747361622425626411491559105928982611480527946093576452802250890233592317064454 27418859348822142398113413591406667944482833131324989581477119118611092070629077798672371628290579434482624016674283266361699843366907205777867483016080234486126292751638874047823711657060729268000873056363488
        Ru Sinh(0.5) = 0.521095305493747361622425626411491559105928982611480527946093576452802250890233592317064454 27418859348822142398113413591406667944482833131324989581477119118611092070629077798672371628290579434482624016

        C# Tanh(0.5) = 0.4621171572600097585023184836436725487302892803301130385527318158380809061404092787749490641 63404954547690500324317360605546721031418196680507872304069067122456304459173218885781215702371116196892668944464526328985299263354102277304493481616673698593397045424405189528727078140946105122566223144531250
        Py Tanh(0.5) = 0.4621171572600097585023184836436725487302892803301130385527318158380809061404092787749490641 51962490584348932986281549132882265461869597895957144611615878563329132704166776939197372567930770270037301448608599262409581783611892899146703802769221335681782847733322189941264788013079341287738074200200096
        Ru Tanh(0.5) = 0.4621171572600097585023184836436725487302892803301130385527318158380809061404092787749490641 5196249058434893298628154913288226546186959789595714461161587856332913270416677693919737256793077027003730144

        The Rust result differs after only 18 decimal places
        Using 1.123
        C# Acosh(  ) = 0.491035786957973891353286858955502250090621789095766806865735361988627555435033439178700 7005721213576875324403214044368643789422418971583458306159615036775892971635264736845288215725677400932049103564265427732284145623136412529574069462081269343142275155840838565812767058105237083509564399719238281250
        Py Acosh(  ) = 0.491035786957973891353286858955502250090621789095766806865735361988627555435033439178700 699705943082871312376482952658864680437901327040485564140342526054250202470542620325960855014747995948802781802381194747189377457442878078669703772717282261386076533115465723683447540331743478712659557445904127076
        Ru Acosh(  ) = 0.491035786957973891 27181381458259416070548656784155083436110574185560788712573192090973306588897799261527526253331273539886065242455108466811363818272715564262566299636917912038359936034289435248923833
        Wolfram        0.4910357869579738913532868589555022500906217890957668068657353619886275554350334391787006997059430828713123764829526588646804379013270404855641403425260542502024705426203259608550147479959488027818023811947471893774574428780786697037727172822613860765331154657236834475403317434787126596

        Using 0.5
        C# Asinh(  ) = 0.481211825059603447497758913424368423135184334385660519661018168840163867608221774412009429 4243519885834838413995468376845294739489013600582655750047049136695802804019588538795676907903500247797719016297373903705956743223743844093523447029538281915057782760149381051650863128088531084358692169189453125
        Py Asinh(  ) = 0.481211825059603447497758913424368423135184334385660519661018168840163867608221774412009429 12272347499723183995829365641127256832372673762275305924186440975418241700721183715022382393746918727524327919301879707900356172679694454575230534543418876528553256490207399693496618755630102123996367930820636
        Ru Asinh(  ) = 0.481211825059603447497758913424368423135184334385660519661018168840163867608221774412009429 12272347499723183995829365641127256832372673762275305924186440975418241700721183715022382393746918727524327919

        C# Atanh(  ) = 0.54930614433405484569762261846126285232374527891137472586734716681874714660930448343680 8812487998211357193588320278928006659392775734239370484260393338398009625197468844579428276225885809938939797869550533686797605505547968609358444227732861342091308937203206728960847016196566983126103878021240234375
        Py Atanh(  ) = 0.54930614433405484569762261846126285232374527891137472586734716681874714660930448343680 7877406866044393985014532978932871184002112965259910526400935383638705301581384591690683589686849422180479951871285158397955760572795958875335673527470083387790111101585126473448780345053260752821434069018158686649
        Ru Atanh(  ) = 0.54930614433405484569762261846126285232374527891137472586734716681874714660930448343680 787740686604439398501453297893287118400211296525991052640093538363870530158138459169068358968684942218047995187128

        Larger numbers:

        Rust differs after only 8 dp
        C# Cosh(23.123) = 5510123201.2791443111282650818613420258334379988732434146167393484301023462314485352303197 37404847996446785387028463567331476616356242205188052470286478002948899308547927927557554114264570729057349437003264343747091710832553370802641972032998030073258632910437881946563720703125
        Py Cosh(23.123) = 5510123201.2791443111282650818613420258334379988732434146167393484301023462314485352303197 0955128411171838132510884403729979648113145226014288075570307221399997571142118913265124076194819770885815330760567987582828025342875949859547942365319652846817322865633214063264303746998352885789699886964986056
        Ru Cosh(23.123) = 5510123201.27914431 089886012011454020747750851816313401582187883904202315740580097416682544095198650748683055947619756929083226581348737435974855022674793867299968079286548039631927210519515907988436341036246015
        Wolfram           5510123201.27914431112826508186134202583343799887324341461673934843010234623144853523031970955128411171838132510884403729979648113145226014288075570307221399997571142118913265124076194819770885815330760567987582828025342875949859547942365319652846817322865633214063264303746998352885790

        Rust differs after only 8 dp
        C# Sinh(23.123) = 5510123201.2791443110375230091824720154574534984149498488347041994981721609742487011890505 32467491620849455615983372681359397032579903848435063113667106615529546644549216676286717011836090939934196976527686409523197283289898899910112741069856401310289584216661751270294189453125
        Py Sinh(23.123) = 5510123201.2791443110375230091824720154574534984149498488347041994981721609742487011890505 0636187512966417968251016358517559975961327679407135437731259437330157296305180985020269889325154573748931342084155034147308030071234165405879398789072119388756735143035811143672513434473318392297875939001716899
        Ru Sinh(23.123) = 5510123201.27914431 080811804743567019709774612001520454338791520888557391805885178584252057226526023115450401450911914977954369750651375423322588966867887086932810237790444363960651856311590134657826052098125168

        Rust differs after 38 dp
        C# Tanh(23.123) = 0.999999999999999999983531752491885345637693289166333624661533063277950117780606843868154379 582978724491871472990559793495836181245724841022633845185233835192300446863089374504633481867081040543299638221853405204207223764395097820226530727350396945957455602672220296156524455000180751085281372070312500
        Py Tanh(23.123) = 0.999999999999999999983531752491885345637693289166333624661533063277950117780606843868154379 765470420474221097526796382622376114576762869195722370750965031740995499127782347779096457666967818156592040017088983957629859064832822774675201193782243108354628049649315400218368536400248812147461276635731872
        Ru Tanh(23.123) = 0.99999999999999999998353175249188534563 632203209942851850569866444521841581171835710600268042051748268387488794537606542210763152761787102869009284214634092340848029108246062133336708766998295479478132
        Wolfram           0.999999999999999999983531752491885345637693289166333624661533063277950117780606843868154379765470420474221097526796382622376114576762869195722370750965031740995499127782347779096457666967818156592040017088983957629859064832822774675201193782243108354628049649315400218368536400248812147

        Rust differs after 20 dp
        C# Acosh(23.123) = 3.83350707005452496032980848816385219844752978697584207291775379143490402561638082518313 69444788158845528483494490414080049221843623901639286312391838619081808300290102712625400480359405518868422578357445599673557021538337831222230152708409906581494357136717654466195881468593142926692962646484375000
        Py Acosh(23.123) = 3.83350707005452496032980848816385219844752978697584207291775379143490402561638082518313 13326711431539175885760480789833225084065650483888552214520831060845195913458751675339449127484572350501275236526991496538390705079497675153039678008022965617464425380934835633787640794802841063172918047480254749
        Ru Acosh(23.123) = 3.83350707005452496032 800628466108528872301600573373755739901644561214379112218243665844115133220566036011386312664802735059129242882431469894385945427770118838972443360260065606602071890749722106862386
        Wolfram            3.833507070054524960329808488163852198447529786975842072917753791434904025616380825183131332671143153917588576048078983322508406565048388855221452083106084519591345875167533944912748457235050127523652699149653839070507949767515303967800802296561746442538093483563378764079480284106317292

        Rust differs after 20 dp
        C# Asinh(23.123) = 3.8344422215279376450102962515522411667143870333260936479360674824158551808074032678562 342606863158506842154849571125397380064627828844347021781982336643848060213848126534801849827208893426125006379533665825236228124343963639430227003281071513621614314681787342997676404365847702138125896453857421875
        Py Asinh(23.123) = 3.8344422215279376450102962515522411667143870333260936479360674824158551808074032678562 2864925128072584279295111720951969298927686911841406659395449393943400721060176742249236774712983261820645281827769386530025793321342055461194710773168623996094790156870734592123363375965420942192131730865442525498
        Ru Asinh(23.123) = 3.8344422215279376450 0849741556734778010131588632828540486761656612254614991368577639337791044327623898206535623729598314642214316652291587647862309632204064248883020863518474371499556523688092446215348

        C# matches Python and Wolfram up to between 85-90 dp
        Rust Acosh(1.123) is weak (18dp)
        Rust Cosh(23.123) is extremely weak (8dp)
        Rust Sinh(23.123) is extremely weak (8dp)
        Rust Acosh(23.123) is very weak (20dp)
        Rust Asinh(23.123) is very weak (20dp)
     */

    let mut rel = Relativity::new(300);
    let value1 = Relativity::bigfloat_from_str("0.5");
    let value2 = Relativity::bigfloat_from_str("1.123");
    let value3 = Relativity::bigfloat_from_str("23.123");

    let cosh1 = expr!(cosh(value1), &mut rel.ctx);
    let sinh1 = expr!(sinh(value1), &mut rel.ctx);
    let tanh1 = expr!(tanh(value1), &mut rel.ctx);
    let acosh1 = expr!(acosh(value2), &mut rel.ctx);
    let asinh1 = expr!(asinh(value1), &mut rel.ctx);
    let atanh1 = expr!(atanh(value1), &mut rel.ctx);

    println!("Ru Cosh(0.5) = {}", bigfloat_fmt_dp(&cosh1, 200).unwrap());
    println!("Ru Sinh(0.5) = {}", bigfloat_fmt_dp(&sinh1, 200).unwrap());
    println!("Ru Tanh(0.5) = {}", bigfloat_fmt_dp(&tanh1, 200).unwrap());
    println!("Ru Acosh(1.123) = {}", bigfloat_fmt_dp(&acosh1, 200).unwrap());
    println!("Ru Asinh(0.5) = {}", bigfloat_fmt_dp(&asinh1, 200).unwrap());
    println!("Ru Atanh(0.5) = {}", bigfloat_fmt_dp(&atanh1, 200).unwrap());

    let cosh2 = expr!(cosh(value3), &mut rel.ctx);
    let sinh2 = expr!(sinh(value3), &mut rel.ctx);
    let tanh2 = expr!(tanh(value3), &mut rel.ctx);
    let acosh2 = expr!(acosh(value3), &mut rel.ctx);
    let asinh2 = expr!(asinh(value3), &mut rel.ctx);

    println!("Ru Cosh(23.123) = {}", bigfloat_fmt_dp(&cosh2, 200).unwrap());
    println!("Ru Sinh(23.123) = {}", bigfloat_fmt_dp(&sinh2, 200).unwrap());
    println!("Ru Tanh(23.123) = {}", bigfloat_fmt_dp(&tanh2, 200).unwrap());
    println!("Ru Acosh(23.123) = {}", bigfloat_fmt_dp(&acosh2, 200).unwrap());
    println!("Ru Asinh(23.123) = {}", bigfloat_fmt_dp(&asinh2, 200).unwrap());
}