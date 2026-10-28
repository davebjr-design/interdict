# Crew roster and departments (Dave, 2026-10-28; revised to main cast only)

**Six people aboard, and that is the whole crew.** The ship was built for about eighty. It is run by six, which is only possible because Pell does the work of the rest. That gap is not a shortcut, it is the premise: the patron is paying the captain to stop AI development, and the captain could not fly home without an AI. Many stations are unmanned or sheeted over, most bunks are folded flat and stacked with crates, and the mess seats twenty-five for six.

Abara oversees both Tactical and Navigation, which makes Abara the de facto second in command. This is never stated formally. No chief of the boat, no enlisted ranks.

Tone: closer to Firefly than to the Star Wolf rundowns (about 80 crew). Personality "modeled on" notes are temperament profiles only. Characters are original: no likenesses, no borrowed names, no catchphrases.

| Department | Crew | Personality profile | Station |
|---|---|---|---|
| Command | Captain (the player, after the intro sequence) | blank slate | Control room |
| Engineering | Castellan | warm, hands-on, folksy tinkerer (Trip Tucker profile) | Engineering, both levels (DRIVE mount) |
| Thermal Management | Dace | brilliant, eager, a bit showy idealist (Julian Bashir profile) | Thermal control (SINK mount) |
| Sensors and ECM | Quill | stiff, formal, wary, dry (Malcolm Reed profile) | Control room, aft zone (SENSOR mount) |
| Tactical, Weapons, Astrogation and Helm | Abara | humorous but serious and competent (Miles O'Brien profile) | Control room, attack center (WEAPON mount) |
| Supply, Mess and Maintenance | Fenwick, quartermaster and galley cook (male; "Fen") | corny, annoying comic relief with a big heart (Neelix profile) | Mess and galley |
| Ship AI | Pell | hides a larger mind behind the firewalls | Core pedestal in the control room, nodes throughout |
| Medical | nobody | | Sickbay dormant, inside the utility compartment |

## Headcount
- Six aboard: the captain, Castellan, Dace, Quill, Abara, Fenwick. All six have full Meshy models and sprite sheets already.
- No ambient or background crew. If a compartment is empty, it is empty.
- **Visitors** are the exception and arrive by story: survivors off a derelict, a salvage crew taken aboard for a job, prisoners from Corvane's ship. They are temporary and scripted, never standing crew.

## Keeping the ship from feeling dead
Twelve compartments and six people means several rooms would otherwise never hold anyone. Three fixes, none of which add crew:
1. **Officers move.** Their posts are a default, not a fixture. Between hunts they are scripted into other compartments: Castellan digging a part out of the bunk stowage, Quill eating in the mess, Dace asleep. Cheap to implement, since it is a cell reassignment per state.
2. **Compartments hold things, not people.** A canister to inspect, a reading that is drifting, a repair, a locker that was not stowed properly.
3. **Pell talks from anywhere.** No room is silent even when it is empty. See the Pell architecture in `docs/ship_inventory_and_art_plan.md` section 21.

## Berths
- **Captain's stateroom**, off the aft end of the control room. Small. The only private space on the ship.
- **Officer berths**, forward end of the lower deck: three cabins, two sides each. Abara with Castellan, Dace with Quill, Fenwick with a spare side kept for a visitor.
- **Crew bunk compartment** (lower deck, around the missile tube bases): racks folded flat against the walls with crates strapped into them. Two or three racks are still made up, which is where visitors sleep. This compartment is stowage first and berthing second.
- All berths follow the art staging standard: per side, a bunk-wall panel, a shelf or desk, a locker door.

## Art budget
- Six named models: **done**, no further character art needed for the standing crew.
- Visitors reuse the base-body approach when a story beat needs one: about 40 credits each, generated on demand rather than up front.
- Compartment art: twelve scenes, about 12 credits each. Equipment mount parts about 500 credits, still outstanding.
- Dave says credits are not a constraint; order work by what gets built first.

## Notes
- Abara is one character with the O'Brien profile and covers Tactical, Weapons, Astrogation and Helm. De facto second in command, never stated in game.
- No separate named navigator. The cool, logical Spock-style temperament that used to describe the navigator group has no one left to attach to; drop it or fold a trace of it into Quill.
- Earlier drafts had 28 aboard with "+n" support per department and three eight-rack bunk rooms. Superseded by this revision (Dave, 2026-10-28).
