"""Operating rules v0.1: concrete numbers for the first slice. Pure functions, no randomness except where a rng is passed.
Terms follow docs/glossary.md. Tuned values are marked TUNE and should move to data files once the playable hunt exists."""
import math, random
# ---- Afterlight and the Fan ------------------------------------------------------------------
LAG_MIN_PER_KM = 0.08         # TUNE: reading age in game minutes per km of range (41 km ~ 3.3 min)
FAN_BASE_KM = 2.0             # Fan radius at age 0 (1 sigma, km)
FAN_GROWTH_KM_PER_MIN = 0.8   # sigma growth per minute of afterlight
AWARE_FAN_MULT = 1.6          # an aware target maneuvers: wider Fan
SEEKER_RADIUS_KM = 3.0        # a missile kills if its aim error is inside this
def reading_age(range_km, ping_fresh=False): return 0.0 if ping_fresh else range_km * LAG_MIN_PER_KM
def fan_sigma(age_min, aware=False, track_quality=0.5):
    """1 sigma of target position error. Better track quality tightens the Fan (0.5 = nominal)."""
    s = FAN_BASE_KM + FAN_GROWTH_KM_PER_MIN * age_min
    return s * (AWARE_FAN_MULT if aware else 1.0) * (1.5 - track_quality)
def single_hit(sigma): return math.erf(SEEKER_RADIUS_KM / (sigma * math.sqrt(2)))
# ---- Volleys -----------------------------------------------------------------------------------
def volley_hit_prob(n, sigma, spacing_sigma, pd_channels=0, pd_kill=0.6, lures=0, lure_fidelity=0.7, quench=0, pd_stagger=1.0, rng=None, N=6000):
    """P(target destroyed) for a volley of n sleepers. spacing_sigma: 0 = stacked, ~1.25 = spread across the Fan."""
    rng = rng or random.Random(3); wins = 0
    offs = [(i - (n - 1) / 2.0) * spacing_sigma * sigma for i in range(n)]
    for _ in range(N):
        t = rng.gauss(0, sigma)
        live = [o for o in offs if rng.random() < 1.0 / (1.0 + lures * lure_fidelity)]   # lures split the volley
        windows = 1.0 + min(1.0, spacing_sigma / 1.25) * pd_stagger                       # a spread volley arrives staggered: scatter grid gets more windows
        engaged = int(round(pd_channels * windows))
        for _c in range(engaged):                                                        # each engagement may kill one
            if live and rng.random() < pd_kill: live.pop(rng.randrange(len(live)))
        hits = sum(1 for o in live if abs(t - o) < SEEKER_RADIUS_KM)
        wins += hits > quench
    return wins / N
# ---- Cold running, sump and bloom -----------------------------------------------------------------
SUMP_FILL_PCT_PER_MIN = 100 / 52.0   # TUNE: base fill rate at heat management 1.0, no friction
LEAK_START_PCT = 40.0                # above this the enemy can detect passively
def sump_fill_rate(heat_mgmt, friction=0.0, overload=0.0, idle_extra=0.0):
    return SUMP_FILL_PCT_PER_MIN * (1 + friction + overload + idle_extra) / heat_mgmt
def leak_hazard(heat_pct, range_km, base=0.0004):
    """Per-minute chance the enemy notices a leaking ship (zero below the leak line); closer is worse."""
    return base * max(0.0, heat_pct - LEAK_START_PCT) * (60.0 / max(range_km, 10.0))
# ---- Movement ---------------------------------------------------------------------------------------
def rotation_time_min(mass): return 0.4 + 0.6 * mass        # mass 0.5 scout .. 2.0 bastion; TUNE
BURN_BLOOM_GM = 20                                          # exposure in 'gm' from the sim; ignition ends cold running
# ---- Breach (FTL) ----------------------------------------------------------------------------------------
def plot_time_min(nav_skill, rushed=False): return max(0.5, (4.0 - 0.5 * nav_skill)) * (0.5 if rushed else 1.0)
def plot_error(nav_skill, rushed=False): return max(0.0, 0.25 - 0.04 * nav_skill) + (0.20 if rushed else 0.0)   # chance of a bad arrival
KNELL_EXPOSURE = 60          # everyone in the system hears it
RELAY_STAGES = ['quiet', 'noticed', 'watched', 'found']
def relay_advance(same_vector_repeats, common_track_min):
    """Expected stages of exposure added by one breach: repeats from the same vector raise it, a common track lowers it."""
    return max(0.0, 0.3 + 0.35 * same_vector_repeats - 0.04 * common_track_min)
# ---- Comms ------------------------------------------------------------------------------------------------------
SNAP_BUDGET_PER_SORTIE = 3          # snaps before the patrol can triangulate you
