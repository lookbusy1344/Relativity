use astro_float::expr;
use astro_tools::{bigfloat_fmt_dp, bigfloat_fmt_sig, Relativity};

// Note astro-float values are unweildy to work with directly (because of the required context),
// so the expr!() macro is used to simplify context handling in equations, eg instead of..
// let result = a.mul(&b, &mut ctx).add(&c, &mut ctx).div(&d, &mut ctx);
// ..we can write..
// let result = expr!(a * b + c / d, &mut ctx);

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
}
