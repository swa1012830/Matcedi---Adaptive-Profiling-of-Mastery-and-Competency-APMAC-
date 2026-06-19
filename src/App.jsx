import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── DESIGN TOKENS — Light · Energetic · Growth ──────────────────────────────
const C = {
  bg:      "#F4F7FF",
  surface: "#FFFFFF",
  raised:  "#EEF2FF",
  border:  "#DDE3F5",
  muted:   "#9AA5C4",
  dim:     "#6B7A99",
  text:    "#1A2340",
  white:   "#FFFFFF",
  blue:    "#2563EB",
  cyan:    "#0891B2",
  green:   "#059669",
  orange:  "#EA580C",
  purple:  "#7C3AED",
  red:     "#DC2626",
  yellow:  "#D97706",
  gold:    "#B45309",
};

const TIERS = [
  { level: 0, name: "Unverified",  color: C.muted,  min: 0,  max: 59  },
  { level: 1, name: "Apprentice",  color: C.blue,   min: 60, max: 74  },
  { level: 2, name: "Journeyman",  color: C.green,  min: 75, max: 84  },
  { level: 3, name: "Craftsman",   color: C.orange, min: 85, max: 93  },
  { level: 4, name: "Master",      color: C.purple, min: 94, max: 100 },
];

const getTier = (score) => TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];

const TRADES = [
  { id:"aviation",   label:"Aviation Maintenance", icon:"✈️",  color:C.blue,   tagline:"Aircraft systems, powerplant, airframe, avionics" },
  { id:"electrical", label:"Electrician",          icon:"⚡",  color:C.yellow, tagline:"Residential, commercial & industrial electrical" },
  { id:"hvac",       label:"HVAC Technician",      icon:"❄️",  color:C.cyan,   tagline:"Heating, ventilation, refrigeration & controls" },
  { id:"automotive", label:"Automotive Mechanic",  icon:"🔧",  color:C.orange, tagline:"Diagnostics, repair, modern vehicle systems" },
  { id:"plumbing",   label:"Plumber",              icon:"🔩",  color:C.green,  tagline:"Piping, fixtures, code compliance" },
  { id:"welding",    label:"Welder/Fabricator",    icon:"🔥",  color:C.red,    tagline:"Structural, pipe, and precision welding" },
  { id:"general",    label:"General/Other Trade",  icon:"🛠️",  color:C.purple, tagline:"Don't see your trade? Start here" },
];

const CATEGORIES = [
  { id: "powerplant",  label: "Powerplant",             icon: "⚙️",  color: C.orange },
  { id: "airframe",    label: "Airframe",                icon: "✈️",  color: C.blue   },
  { id: "hydraulics",  label: "Hydraulics",              icon: "💧",  color: C.cyan   },
  { id: "electrical",  label: "Electrical Systems",      icon: "⚡",  color: C.yellow },
  { id: "safety",      label: "Safety & FOD",            icon: "🛡️",  color: C.green  },
  { id: "avionics",    label: "Avionics",                icon: "📡",  color: C.purple },
  { id: "qa",          label: "Quality Assurance",       icon: "✅",  color: C.red    },
  { id: "tools",       label: "Tools & Equipment",       icon: "🔧",  color: C.gold   },
  { id: "planning",    label: "Maintenance Planning",    icon: "📋",  color: C.green  },
  { id: "support",     label: "Maintenance Support",     icon: "🤝",  color: C.blue   },
  { id: "wiring",      label: "Wiring & Circuits",       icon: "🔌",  color: C.yellow },
  { id: "code",        label: "Code & Compliance",       icon: "📐",  color: C.blue   },
  { id: "panels",      label: "Panels & Distribution",   icon: "⚡",  color: C.orange },
  { id: "controls",    label: "Controls & Automation",   icon: "🎛️",  color: C.purple },
  // HVAC categories
  { id: "refrig",      label: "Refrigeration Cycle",     icon: "❄️",  color: C.cyan   },
  { id: "airflow",     label: "Airflow & Ductwork",      icon: "💨",  color: C.blue   },
  // Automotive categories
  { id: "diagnostics", label: "Diagnostics & Scan Tools",icon: "🔍",  color: C.orange },
  { id: "engine",      label: "Engine & Drivetrain",     icon: "🚗",  color: C.red    },
  // Plumbing categories
  { id: "piping",      label: "Piping & Fixtures",       icon: "🔩",  color: C.green  },
  { id: "drainage",    label: "Drainage & Venting",      icon: "🚰",  color: C.cyan   },
  // Welding categories
  { id: "weldproc",    label: "Welding Process",         icon: "🔥",  color: C.red    },
  { id: "metallurgy",  label: "Material & Joint Integrity",icon: "🧲", color: C.gold   },
];

const BENCHMARKS = [
  { id: "ap",    label: "FAA A&P — Airframe & Powerplant", body: "FAA",        color: C.blue,   passScore: 70, categories: ["powerplant","airframe","hydraulics","electrical","avionics"] },
  { id: "epa",   label: "EPA Section 608 — HVAC",          body: "EPA",        color: C.green,  passScore: 70, categories: ["hydraulics","electrical","safety","tools"] },
  { id: "asvab", label: "ASVAB — Military Classification", body: "DoD",        color: C.purple, passScore: 50, categories: ["powerplant","electrical","avionics","planning"] },
  { id: "osha",  label: "OSHA 30 — General Industry",      body: "OSHA",       color: C.orange, passScore: 75, categories: ["safety","tools","planning","support"] },
  { id: "nec",   label: "NEC — Journeyman Electrician",    body: "State",      color: C.yellow, passScore: 70, categories: ["electrical","safety","tools","planning"] },
];

// ─── TOPIC CATALOG ────────────────────────────────────────────────────────────
const TOPICS = [
  // POWERPLANT
  { id:"pp-01", trade:"aviation", cat:"powerplant", title:"Engine Oil System Basics", tier:1, scenario:"Post-flight oil level is below MIN on a T700-GE-401C dipstick. Before anyone touches the reservoir, supervisor wants your full thought process out loud.", keySkills:["oil system function","servicing limits","safety sequence","documentation"], seedMessages:[{user:"Supervisor",role:"senior",avatar:"SV",color:C.orange,text:"Oil is below MIN post-flight. Before you grab a quart — talk me through what's going on in that oil system and why this reading matters."},{user:"Airman Cole",role:"peer",avatar:"AC",color:C.blue,text:"Don't we need to check the tech manual first? Can't just fill it to the top, right?"},{user:"Supervisor",role:"senior",avatar:"SV",color:C.orange,text:"Cole is right on documentation. Why do the servicing limits exist — what's the engineering reason?"}], rubric:{causal:["thermal expansion","oil passages","circulation","drain back","cooldown"],sequence:["tech manual","check limit","service to midpoint","inspect","document"],risk:["overfill","seal damage","over-pressure","false reading","in-flight loss"],platform:["t700","dipstick","oil system","engine"],terminology:["servicing limit","MRC","discrepancy","sign-off"]} },
  { id:"pp-02", trade:"aviation", cat:"powerplant", title:"Chip Light — First Response", tier:1, scenario:"Pilot returns with engine chip light illuminated. You are first to the aircraft as an Apprentice. Supervisor is watching.", keySkills:["chip detector function","metal contamination","grounding decision","reporting"], seedMessages:[{user:"Duty Chief",role:"senior",avatar:"DC",color:C.orange,text:"Chip light just landed. You're first on scene. What does that light tell you?"},{user:"Airman Torres",role:"peer",avatar:"AT",color:C.blue,text:"Metal in the oil, right? But I'm not sure if that auto-grounds it or if there's a check first."},{user:"Duty Chief",role:"senior",avatar:"DC",color:C.orange,text:"Torres is partially right. Walk me through what the chip detector actually is and what metal in oil means mechanically."}], rubric:{causal:["metal particles","wear","bearing","magnetic","contamination"],sequence:["ground aircraft","notify supervisor","inspect chip detector","oil sample","QA"],risk:["continued flight","catastrophic failure","bearing seizure"],platform:["chip detector","magnetic plug","oil sample","T700"],terminology:["chip light","metal contamination","oil analysis","ground"]} },
  { id:"pp-03", trade:"aviation", cat:"powerplant", title:"Engine Inlet & Exhaust Inspection", tier:1, scenario:"Senior tech asks you to explain inlet and exhaust inspection to the new airman beside you — what you look for and why each item matters.", keySkills:["FOD inspection","blade damage identification","exhaust check","visual standards"], seedMessages:[{user:"Senior Tech",role:"senior",avatar:"ST",color:C.orange,text:"Explain to Airman Reeves what we look for on inlet and exhaust inspection. Walk him through it like you own it."},{user:"Airman Reeves",role:"peer",avatar:"AR",color:C.blue,text:"I know we're checking for FOD but what specifically am I looking for on the actual blades?"},{user:"Senior Tech",role:"senior",avatar:"ST",color:C.orange,text:"What does blade damage actually look like and what do we do when we find something beyond limits?"}], rubric:{causal:["FOD ingestion","blade damage","compressor failure","imbalance","vibration"],sequence:["inlet first","blade by blade","exhaust section","document findings","report"],risk:["FOD ingestion","engine failure","blade separation","compressor stall"],platform:["inlet","compressor blade","exhaust","turbine"],terminology:["nick","dent","scratch","FOD","serviceable","beyond limits"]} },
  // AIRFRAME
  { id:"af-01", trade:"aviation", cat:"airframe", title:"Corrosion Identification", tier:1, scenario:"Gray-white powdery residue on aluminum tail panel. QA Inspector asks what you see and what it means before you touch anything.", keySkills:["corrosion types","identification","reporting","documentation"], seedMessages:[{user:"QA Inspector",role:"senior",avatar:"QI",color:C.orange,text:"You found something on that tail panel. Before you do anything — tell me what you see and what type of corrosion you think this is."},{user:"Airman Kim",role:"peer",avatar:"AK",color:C.blue,text:"I see white powdery stuff. I think corrosion but I don't know which kind or how serious."},{user:"QA Inspector",role:"senior",avatar:"QI",color:C.orange,text:"What causes that white residue on aluminum and why does the location near the tail matter for your assessment?"}], rubric:{causal:["moisture","oxidation","galvanic","aluminum oxide","dissimilar metals"],sequence:["identify","do not touch","document","photograph","report to QA"],risk:["structural weakness","hidden damage","spread","airworthiness"],platform:["aluminum","tail section","skin","panel"],terminology:["surface corrosion","galvanic corrosion","pitting","exfoliation","serviceable"]} },
  { id:"af-02", trade:"aviation", cat:"airframe", title:"Skin Panel Fastener Inspection", tier:1, scenario:"Inspecting fuselage skin fasteners. Crew Chief stops you and asks you to explain failure signs and structural significance to the crew.", keySkills:["fastener types","failure signs","structural significance","reporting"], seedMessages:[{user:"Crew Chief",role:"senior",avatar:"CC",color:C.orange,text:"Before we move on — explain what we're looking for at each fastener and why a bad fastener is more than a loose screw."},{user:"Airman Davis",role:"peer",avatar:"AD",color:C.blue,text:"I know loose fasteners are bad but what else are we looking for besides tightness?"},{user:"Crew Chief",role:"senior",avatar:"CC",color:C.orange,text:"What does a fastener that's been moving tell you about what's happening to the skin around it?"}], rubric:{causal:["fatigue","vibration","load transfer","shear","structural integrity"],sequence:["visual inspection","check for play","check skin around fastener","document","report"],risk:["skin separation","structural failure","fatigue crack propagation"],platform:["fuselage","skin panel","fastener","rivet","bolt"],terminology:["countersunk","shear","fatigue","fretting","serviceability"]} },
  { id:"af-03", trade:"aviation", cat:"airframe", title:"Door & Access Panel Rigging", tier:1, scenario:"Panel reinstalled after removal. Lead Tech asks you to verify rigging before return to service and explain what proper rigging means.", keySkills:["rigging definition","alignment check","seal inspection","return to service"], seedMessages:[{user:"Lead Tech",role:"senior",avatar:"LT",color:C.orange,text:"Panel is back on. Before sign-off — what does rigging mean here and how do you know it's properly rigged?"},{user:"Airman West",role:"peer",avatar:"AW",color:C.blue,text:"I know rigging is about alignment but I'm not sure what out-of-rig actually looks like."},{user:"Lead Tech",role:"senior",avatar:"LT",color:C.orange,text:"Why does alignment matter? What happens to a slightly out-of-rig panel over time in flight?"}], rubric:{causal:["aerodynamic load","vibration","seal failure","fatigue","airflow"],sequence:["visual gap check","latch function","seal contact","flush with skin","document"],risk:["pressurization loss","water ingress","structural fatigue"],platform:["access panel","door","hinge","latch","seal"],terminology:["rigging","alignment","flush","gap tolerance","sign-off"]} },
  // HYDRAULICS
  { id:"hyd-01", trade:"aviation", cat:"hydraulics", title:"Hydraulic Fluid Level Check", tier:1, scenario:"Pre-flight hydraulic fluid check. Flight Chief asks you to explain safety precautions and why each one exists before you open anything.", keySkills:["fluid types","pressure hazards","safety sequence","contamination prevention"], seedMessages:[{user:"Flight Chief",role:"senior",avatar:"FC",color:C.orange,text:"Hydraulic fluid check before you touch anything. Walk me through the safety precautions and why they exist."},{user:"Airman Patel",role:"peer",avatar:"AP",color:C.blue,text:"I know it's under pressure but I'm not sure exactly what hazards I'm dealing with opening that reservoir."},{user:"Flight Chief",role:"senior",avatar:"FC",color:C.orange,text:"Pressure is one hazard. What else do we need to consider with hydraulic fluid specifically?"}], rubric:{causal:["system pressure","fluid toxicity","skin absorption","fire hazard","contamination"],sequence:["depressurize","PPE","identify fluid type","check level","cap","document"],risk:["injection injury","skin irritation","contamination","fire"],platform:["hydraulic reservoir","system pressure","PPE","fluid level"],terminology:["MIL-PRF-5606","MIL-PRF-83282","depressurize","PPE","contamination"]} },
  { id:"hyd-02", trade:"aviation", cat:"hydraulics", title:"Hydraulic Leak Identification", tier:1, scenario:"Wet spot under aircraft near main gear well post-flight. Maintenance Chief asks what it is, where it comes from, and next steps before touching anything.", keySkills:["fluid identification","leak source tracing","reporting","safety"], seedMessages:[{user:"Maintenance Chief",role:"senior",avatar:"MC",color:C.orange,text:"Wet spot under the gear well. Before you touch it — what do you think it is and how do you figure out the source?"},{user:"Airman Brooks",role:"peer",avatar:"AB",color:C.blue,text:"Could be hydraulic fluid or oil. Not sure how to tell the difference or what to do first."},{user:"Maintenance Chief",role:"senior",avatar:"MC",color:C.orange,text:"Identifying fluid type comes first. How do you differentiate hydraulic fluid, oil, and fuel on the ground?"}], rubric:{causal:["line fitting","seal failure","actuator","pressure cycle","wear"],sequence:["identify fluid","trace to source","do not operate","notify supervisor","document"],risk:["system failure","fire","loss of flight control"],platform:["gear well","hydraulic line","fitting","actuator","seal"],terminology:["trace","origin","fitting","seal","actuator","discrepancy"]} },
  { id:"hyd-03", trade:"aviation", cat:"hydraulics", title:"Pressurized System Ground Safety", tier:1, scenario:"New airman about to work near possibly pressurized hydraulic system. Safety NCO asks you to brief him on hazards before anyone gets near it.", keySkills:["pressure hazards","depressurization","PPE","safe work zone"], seedMessages:[{user:"Safety NCO",role:"senior",avatar:"SN",color:C.orange,text:"Brief Airman Jenkins on pressurized system hazards before either of you gets near that system."},{user:"Airman Jenkins",role:"peer",avatar:"AJ",color:C.blue,text:"I know pressure is dangerous but what specifically should I watch for and what PPE do I need?"},{user:"Safety NCO",role:"senior",avatar:"SN",color:C.orange,text:"Start with what a high-pressure hydraulic injection injury actually is — that context changes how seriously people take the precautions."}], rubric:{causal:["residual pressure","pressure injection","accumulator","stored energy"],sequence:["verify depressurized","PPE first","stand clear of line path","use tech data"],risk:["pressure injection","fluid fire","system energization"],platform:["accumulator","relief valve","hydraulic line"],terminology:["depressurize","accumulator","pressure injection","PPE"]} },
  // ELECTRICAL
  { id:"el-01", trade:"aviation", cat:"electrical", title:"Grounding & Bonding Basics", tier:1, scenario:"Before electrical work begins. Electrical Chief asks you to brief the team on grounding and bonding — not what to do, but why it matters.", keySkills:["grounding purpose","bonding procedure","static discharge","safety sequence"], seedMessages:[{user:"Electrical Chief",role:"senior",avatar:"EC",color:C.orange,text:"Before we start any electrical work — explain grounding and bonding. Not the procedure. Why it matters."},{user:"Airman Shaw",role:"peer",avatar:"AS",color:C.blue,text:"I know we ground to prevent static but I'm not clear on the difference between grounding and bonding."},{user:"Electrical Chief",role:"senior",avatar:"EC",color:C.orange,text:"What does a static discharge actually do to aircraft systems and to the person working on them?"}], rubric:{causal:["static buildup","discharge path","potential difference","ESD damage","fire ignition"],sequence:["bond aircraft first","ground cable","verify continuity","then begin work"],risk:["ESD damage","avionics failure","fuel ignition","personal injury"],platform:["ground cable","bonding strap","avionics","fuel system"],terminology:["ESD","bonding","grounding","equipotential","continuity"]} },
  { id:"el-02", trade:"aviation", cat:"electrical", title:"Circuit Breaker Fundamentals", tier:1, scenario:"CB has tripped on ground. Pilot wants to reset and fly. Maintenance Officer asks you to explain why that is not the correct procedure.", keySkills:["CB function","reset procedure","fault investigation","airworthiness decision"], seedMessages:[{user:"Maintenance Officer",role:"senior",avatar:"MO",color:C.orange,text:"Pilot wants to reset the tripped CB and launch. Walk me through why we can't just reset it."},{user:"Airman Cruz",role:"peer",avatar:"AC",color:C.blue,text:"I know CBs protect circuits but why can't we reset it just once if it only tripped once?"},{user:"Maintenance Officer",role:"senior",avatar:"MO",color:C.orange,text:"The CB is a symptom detector. What is it telling us when it trips and what are we ignoring if we reset without investigation?"}], rubric:{causal:["overcurrent","short circuit","fault condition","thermal protection","wiring failure"],sequence:["do not reset","identify cause","inspect circuit","document","QA notification"],risk:["wiring fire","system damage","in-flight failure","electrical arc"],platform:["circuit breaker","wiring","bus","load","avionics"],terminology:["overcurrent","short circuit","fault","trip","reset protocol"]} },
  { id:"el-03", trade:"aviation", cat:"electrical", title:"Wire Bundle Chafing", tier:1, scenario:"Access panel reveals wire bundle chafing against structural member. Avionics Chief asks you to explain what you see and why it matters before you write it up.", keySkills:["chafing identification","arc fault risk","reporting","documentation"], seedMessages:[{user:"Avionics Chief",role:"senior",avatar:"AVC",color:C.orange,text:"Explain to Airman Bell what chafing is and why a wire touching metal is a grounding-aircraft issue."},{user:"Airman Bell",role:"peer",avatar:"AB",color:C.blue,text:"I can see the worn insulation but I'm not sure how serious it is or what it leads to in flight."},{user:"Avionics Chief",role:"senior",avatar:"AVC",color:C.orange,text:"Walk him from worn insulation to what happens when that bare wire contacts structure under the right conditions."}], rubric:{causal:["insulation wear","vibration","arc fault","short circuit","heat generation"],sequence:["identify","do not flex wire","document location","photograph","write discrepancy"],risk:["arc fault","fire","avionics failure","in-flight failure"],platform:["wire bundle","insulation","structure","chafe point"],terminology:["chafing","arc fault","insulation","discrepancy"]} },
  // SAFETY
  { id:"sf-01", trade:"aviation", cat:"safety", title:"Tool Control Program", tier:1, scenario:"Issuing tools for maintenance evolution. Tool Room Chief asks you to explain the tool control program to a new team member — not the rules, the reason.", keySkills:["tool accountability","shadow board","inventory protocol","FOD consequences"], seedMessages:[{user:"Tool Room Chief",role:"senior",avatar:"TC",color:C.orange,text:"Explain the tool control program to Airman Nguyen. Not the rules — the reason it exists."},{user:"Airman Nguyen",role:"peer",avatar:"AN",color:C.blue,text:"I know we sign tools in and out but why do we count before and after every job?"},{user:"Tool Room Chief",role:"senior",avatar:"TC",color:C.orange,text:"Tell him what a missing tool in an aircraft actually means and where it ends up if nobody catches it before flight."}], rubric:{causal:["FOD source","tool ingestion","engine damage","flight control jamming"],sequence:["sign out","inventory before","inventory after","sign in","report missing"],risk:["engine ingestion","flight control interference","aircraft loss"],platform:["shadow board","tool control","inventory","sign-out log"],terminology:["tool accountability","FOD","inventory","shadow board"]} },
  { id:"sf-02", trade:"aviation", cat:"safety", title:"PPE Selection — Fuel Servicing", tier:1, scenario:"New airman grabs only safety glasses for fuel servicing. Safety Officer stops him and asks you to explain what PPE is required and why each piece is necessary.", keySkills:["PPE selection","hazard identification","fuel hazards","compliance"], seedMessages:[{user:"Safety Officer",role:"senior",avatar:"SO",color:C.orange,text:"He only grabbed glasses for a fuel servicing job. Walk him through full PPE requirements and why each piece exists for this task."},{user:"Airman Lee",role:"peer",avatar:"AL",color:C.blue,text:"I didn't realize there was more than glasses needed. What other hazards am I missing with fuel servicing?"},{user:"Safety Officer",role:"senior",avatar:"SO",color:C.orange,text:"What does fuel do to skin on prolonged exposure and what PPE does that require?"}], rubric:{causal:["fuel absorption","vapor inhalation","static ignition","splash risk","fire"],sequence:["identify task hazards","select PPE","don before starting","inspect PPE first"],risk:["chemical burn","vapor inhalation","static discharge ignition"],platform:["fuel servicing","flight deck","fuel point"],terminology:["PPE","flash point","vapor","static","fuel resistant gloves"]} },
  { id:"sf-03", trade:"aviation", cat:"safety", title:"Mishap Reporting Basics", tier:1, scenario:"Tool dropped, strikes aircraft skin, leaves a mark. No injuries. Airman wants to inspect and move on. Safety NCO asks you to explain correct procedure and why reporting matters.", keySkills:["mishap definition","reporting requirement","scene preservation","notification chain"], seedMessages:[{user:"Safety NCO",role:"senior",avatar:"SN",color:C.orange,text:"Tool hit the aircraft. Nobody hurt. Walk Airman Price through what happens next and why we can't just inspect and move on."},{user:"Airman Price",role:"peer",avatar:"APC",color:C.blue,text:"I thought if nobody got hurt it wasn't a mishap. How do I know when something needs to be reported?"},{user:"Safety NCO",role:"senior",avatar:"SN",color:C.orange,text:"What is a mishap by definition and what does reporting it do for the next crew?"}], rubric:{causal:["property damage","near miss","safety trend","systemic failure"],sequence:["stop work","secure scene","notify supervisor","notify safety","document"],risk:["hidden damage","unreported trend","repeat incident"],platform:["aircraft skin","tool","maintenance area"],terminology:["mishap","near miss","property damage","reporting chain"]} },
  // AVIONICS
  { id:"av-01", trade:"aviation", cat:"avionics", title:"Avionics Power-Up Sequence", tier:1, scenario:"Before powering up avionics for ground check. Avionics Chief asks you to explain the correct power-up sequence and why sequence matters.", keySkills:["power sequence","bus priority","system initialization","ESD precautions"], seedMessages:[{user:"Avionics Chief",role:"senior",avatar:"AVC",color:C.orange,text:"Before you hit any switch — explain why avionics have a specific power-up sequence and what happens if you skip it."},{user:"Airman Park",role:"peer",avatar:"APK",color:C.blue,text:"I didn't realize order mattered. I thought you just power up and systems come online."},{user:"Avionics Chief",role:"senior",avatar:"AVC",color:C.orange,text:"Why would a navigation system care whether it gets power before or after the data bus?"}], rubric:{causal:["initialization sequence","bus arbitration","power surge","data corruption"],sequence:["main power first","data bus","navigation","comms","sensor systems"],risk:["data corruption","system fault","BIT failure","avionics damage"],platform:["avionics bus","navigation","comm systems","power bus"],terminology:["initialization","BIT","data bus","power sequence"]} },
  { id:"av-02", trade:"aviation", cat:"avionics", title:"Antenna Inspection", tier:1, scenario:"Pre-flight antenna check. Comm Tech asks you to explain what you look for on each antenna and what damage means for the aircraft in flight.", keySkills:["antenna types","damage identification","system effects","reporting"], seedMessages:[{user:"Comm Tech",role:"senior",avatar:"CT",color:C.orange,text:"Walk Airman Flores through antenna inspection — what each antenna does and why damage matters in flight."},{user:"Airman Flores",role:"peer",avatar:"AF",color:C.blue,text:"I know there are different antennas but I'm not sure what each one does or how a small crack changes anything."},{user:"Comm Tech",role:"senior",avatar:"CT",color:C.orange,text:"Pick one antenna type. Tell him what it does, what damage looks like, and what the crew loses if it fails in flight."}], rubric:{causal:["signal degradation","impedance mismatch","water ingress","delamination"],sequence:["identify type","visual inspection","check mount","check radome","document"],risk:["comm loss","nav failure","IFF failure","crew safety"],platform:["antenna","radome","mount","fuselage skin"],terminology:["radome","delamination","impedance","signal loss","IFF"]} },
  { id:"av-03", trade:"aviation", cat:"avionics", title:"Built-In Test (BIT) Fault", tier:1, scenario:"BIT shows nav system fault code but pilot says system worked fine in flight. Avionics Lead asks you to explain what BIT is and why these two things aren't contradictory.", keySkills:["BIT function","fault isolation","intermittent faults","documentation"], seedMessages:[{user:"Avionics Lead",role:"senior",avatar:"AVL",color:C.orange,text:"BIT shows nav fault but pilot says it flew fine. Explain what BIT is and why these two things aren't contradictory."},{user:"Airman Santos",role:"peer",avatar:"AS",color:C.blue,text:"If the pilot said it was fine in flight, doesn't that mean the BIT is wrong? Which one do we trust?"},{user:"Avionics Lead",role:"senior",avatar:"AVL",color:C.orange,text:"What is BIT actually testing and when does it run? That answers why a fault can exist that the pilot never noticed."}], rubric:{causal:["intermittent fault","thermal variation","vibration","BIT test cycle","marginal component"],sequence:["document BIT code","cross-reference fault manual","functional check","inspect LRU","document"],risk:["latent fault","in-flight failure","mission loss"],platform:["BIT","LRU","navigation system","fault code"],terminology:["BIT","LRU","fault code","intermittent","functional check"]} },
  // QA
  { id:"qa-01", trade:"aviation", cat:"qa", title:"What QA Actually Does", tier:1, scenario:"New airman thinks QA exists to catch and punish mistakes. QA Chief asks you to correct that understanding.", keySkills:["QA role","process vs person","trend identification","continuous improvement"], seedMessages:[{user:"QA Chief",role:"senior",avatar:"QC",color:C.orange,text:"Airman Morton thinks QA is the punishment division. Correct that — explain what quality assurance actually does."},{user:"Airman Morton",role:"peer",avatar:"AM",color:C.blue,text:"I thought QA was just there to write people up when they make mistakes. Isn't that what you do?"},{user:"QA Chief",role:"senior",avatar:"QC",color:C.orange,text:"What's the difference between inspecting a person versus inspecting a process? That distinction is everything in QA."}], rubric:{causal:["process failure","systemic issue","human factors","training gap","procedure flaw"],sequence:["observe","document","identify trend","recommend corrective action","verify fix"],risk:["repeated errors","systemic failure","safety trend ignored"],platform:["maintenance process","inspection","documentation","trend data"],terminology:["QA","trend analysis","corrective action","process audit","human factors"]} },
  { id:"qa-02", trade:"aviation", cat:"qa", title:"Documenting a Discrepancy", tier:1, scenario:"Airman writes 'engine leaking oil — fixed.' Maintenance Chief flags it and asks you to explain what's wrong and what correct documentation looks like.", keySkills:["discrepancy write-up","corrective action","traceability","sign-off requirements"], seedMessages:[{user:"Maintenance Chief",role:"senior",avatar:"MCH",color:C.orange,text:"This discrepancy says 'engine leaking oil — fixed.' Tell me everything wrong with it and what it should say."},{user:"Airman Tran",role:"peer",avatar:"ATV",color:C.blue,text:"I thought if you fixed the problem and wrote it down that was enough. What else needs to be in there?"},{user:"Maintenance Chief",role:"senior",avatar:"MCH",color:C.orange,text:"Someone reads that write-up six months from now during an investigation. What do they need to know and what does this tell them?"}], rubric:{causal:["traceability","accountability","investigation trail","repeat discrepancy detection"],sequence:["describe finding specifically","corrective action","part numbers","tech data reference","sign-off"],risk:["untracked defect","repeat failure","legal liability"],platform:["maintenance log","VIDS","discrepancy form"],terminology:["discrepancy","corrective action","tech data reference","traceability","sign-off"]} },
  { id:"qa-03", trade:"aviation", cat:"qa", title:"Inspection Authority — Supervised vs Independent", tier:1, scenario:"Apprentice wants to sign off his own work. QA Inspector stops him and asks you to explain the difference between inspection authority levels.", keySkills:["inspection authority","qualification requirements","two-person concept","airworthiness"], seedMessages:[{user:"QA Inspector",role:"senior",avatar:"QI",color:C.orange,text:"He wants to sign his own work off. Explain the difference between supervised and independent inspection authority."},{user:"Airman Webb",role:"peer",avatar:"AW",color:C.blue,text:"I did the work correctly so why can't I sign it? I know what I did and it was right."},{user:"QA Inspector",role:"senior",avatar:"QI",color:C.orange,text:"Why does a second set of eyes exist in maintenance regardless of how good the first person is?"}], rubric:{causal:["human error","self-verification bias","independent check","systemic safety"],sequence:["complete task","request inspection","inspector verifies","inspector signs","return to service"],risk:["undetected error","single point failure","airworthiness risk"],platform:["maintenance log","inspection authority","sign-off"],terminology:["inspection authority","CDI","two-person rule","sign-off"]} },
  // TOOLS
  { id:"tl-01", trade:"aviation", cat:"tools", title:"Torque Wrench Calibration", tier:1, scenario:"Airman about to use an out-of-calibration torque wrench. Tool Room Chief asks you to explain why calibration isn't just a paperwork requirement.", keySkills:["calibration purpose","torque values","under/over torque effects","documentation"], seedMessages:[{user:"Tool Room Chief",role:"senior",avatar:"TRC",color:C.orange,text:"That torque wrench is out of calibration. Explain to Airman Green why calibration isn't just paperwork."},{user:"Airman Green",role:"peer",avatar:"AG",color:C.blue,text:"I thought a torque wrench is a torque wrench. If it clicks at the right number how does calibration change anything?"},{user:"Tool Room Chief",role:"senior",avatar:"TRC",color:C.orange,text:"What is the torque wrench actually measuring and how does it know when to click?"}], rubric:{causal:["spring tension","internal mechanism","drift over time","measurement error"],sequence:["check calibration date","select correct range","set value","apply smoothly","document"],risk:["under-torque loosening","over-torque cracking","fastener failure"],platform:["torque wrench","calibration sticker","fastener","tech data"],terminology:["calibration","torque spec","in-lb","ft-lb","click-type"]} },
  { id:"tl-02", trade:"aviation", cat:"tools", title:"Multimeter Safety & Use", tier:1, scenario:"Airman about to probe a live circuit with an under-rated multimeter. Electrical Lead asks you to explain CAT ratings and what using the wrong meter means.", keySkills:["meter ratings","CAT ratings","probe technique","safe measurement"], seedMessages:[{user:"Electrical Lead",role:"senior",avatar:"EL",color:C.orange,text:"He's about to probe that circuit without checking the meter rating. Explain what CAT ratings mean before he touches anything."},{user:"Airman Byrd",role:"peer",avatar:"ABD",color:C.blue,text:"I didn't know meters had different ratings. Can't any meter measure any circuit in the right range?"},{user:"Electrical Lead",role:"senior",avatar:"EL",color:C.orange,text:"What does a CAT rating actually protect against and what happens to an under-rated meter on a high-energy circuit?"}], rubric:{causal:["transient voltage","arc flash","meter failure","energy rating"],sequence:["check CAT rating","inspect probes","set correct function","measure safely","document"],risk:["arc flash","meter explosion","personnel injury"],platform:["multimeter","electrical circuit","aircraft bus","probe"],terminology:["CAT rating","transient voltage","arc flash","impedance"]} },
  { id:"tl-03", trade:"aviation", cat:"tools", title:"Special Tools — Why They Exist", tier:1, scenario:"Airman wants to substitute a standard wrench for the special tool called out in tech manual because special tool isn't available. Explain why that substitution isn't authorized.", keySkills:["special tool purpose","tech data authority","substitution consequences","tool request process"], seedMessages:[{user:"Maintenance Chief",role:"senior",avatar:"MCT",color:C.orange,text:"He wants to substitute a standard wrench for the special tool. Walk him through why the tech manual calls for a special tool."},{user:"Airman Ortiz",role:"peer",avatar:"AO",color:C.blue,text:"It looks like it should fit. If it fits the fitting why do I need a special tool that does the same thing?"},{user:"Maintenance Chief",role:"senior",avatar:"MCT",color:C.orange,text:"The key word is 'looks.' What specific purpose does a special tool serve that a standard tool can't replicate even when it appears to fit?"}], rubric:{causal:["load distribution","torque path","component geometry","clearance requirement"],sequence:["verify tool requirement","order special tool","do not substitute","document delay","await tool"],risk:["component damage","stripped fitting","incorrect load"],platform:["special tool","tech manual","fitting","component"],terminology:["special tool","tech data","authorized substitute","tool requisition"]} },
  // PLANNING
  { id:"pl-01", trade:"aviation", cat:"planning", title:"Understanding Maintenance Intervals", tier:1, scenario:"New airman asks why some maintenance is calendar-based and some flight-hour based. Explain the engineering logic behind how intervals are set.", keySkills:["calendar vs flight hour","why intervals exist","scheduled vs unscheduled","MRC cards"], seedMessages:[{user:"Plans & Scheduling",role:"senior",avatar:"PS",color:C.orange,text:"Airman Hoffman wants to know why some maintenance is calendar-based and some flight-hour based. Explain the logic — not the schedule, the reasoning."},{user:"Airman Hoffman",role:"peer",avatar:"AH",color:C.blue,text:"Why does calendar time matter if the aircraft is flying? Shouldn't flight hours be the better measure?"},{user:"Plans & Scheduling",role:"senior",avatar:"PS",color:C.orange,text:"What degrades on an aircraft that has nothing to do with how many hours it flies? Give me some examples."}], rubric:{causal:["material degradation","seal aging","corrosion","fluid breakdown","fatigue cycles"],sequence:["calendar interval","flight hour interval","cycle-based","MRC card","scheduling"],risk:["missed inspection","degraded component","undetected failure"],platform:["MRC card","maintenance schedule","aircraft","inspection"],terminology:["MRC","calendar interval","flight hour","scheduled","unscheduled"]} },
  { id:"pl-02", trade:"aviation", cat:"planning", title:"Work Order Priority", tier:1, scenario:"Three discrepancies on aircraft that needs to fly at 0600. Maintenance Control asks you to walk through how you prioritize which gets worked first.", keySkills:["mission impact","safety of flight","parts availability","time estimation"], seedMessages:[{user:"Maintenance Control",role:"senior",avatar:"MCO",color:C.orange,text:"Three open discrepancies, aircraft flies at 0600. Walk me through how you prioritize which gets worked first."},{user:"Airman Rivera",role:"peer",avatar:"AR",color:C.blue,text:"I'd start with whatever seems easiest and work up to harder ones. Is that the right approach?"},{user:"Maintenance Control",role:"senior",avatar:"MCO",color:C.orange,text:"Easiest first is a common instinct and it's often wrong. What should actually drive the order?"}], rubric:{causal:["safety of flight","mission impact","parts availability","man-hour estimate"],sequence:["safety of flight first","mission essential second","parts check","time estimate","assign work"],risk:["incorrect priority","safety item missed","aircraft not ready"],platform:["maintenance control","work order","discrepancy log"],terminology:["safety of flight","mission essential","priority","work order","ETC"]} },
  { id:"pl-03", trade:"aviation", cat:"planning", title:"Estimating Job Time", tier:1, scenario:"Airman gives a one-hour estimate for a four-hour job. Production Control asks you to explain why accurate time estimation is critical and what a bad estimate costs.", keySkills:["time estimation factors","scheduling impact","parts lead time","manpower planning"], seedMessages:[{user:"Production Control",role:"senior",avatar:"PC",color:C.orange,text:"That job will take four hours not one. Walk Airman Mason through why accurate estimates matter and what a bad estimate costs."},{user:"Airman Mason",role:"peer",avatar:"AMN",color:C.blue,text:"I figured I'd be optimistic. Isn't it better to aim for one hour and see how fast you can get it done?"},{user:"Production Control",role:"senior",avatar:"PC",color:C.orange,text:"Tell him who else in the maintenance chain was counting on that one-hour estimate and what they did based on it."}], rubric:{causal:["downstream planning","manpower allocation","parts staging","flight schedule impact"],sequence:["review tech data","account for access","parts check","add contingency","communicate estimate"],risk:["schedule failure","unprepared workforce","parts not staged"],platform:["production control","maintenance schedule","work center"],terminology:["ETC","contingency","production control","scheduling"]} },
  // SUPPORT
  { id:"ms-01", trade:"aviation", cat:"support", title:"Supply System Basics", tier:1, scenario:"Airman wants to walk to supply and grab the part himself. Supply Liaison asks you to explain how the aviation supply system actually works.", keySkills:["supply request process","requisition","NSN","parts tracking"], seedMessages:[{user:"Supply Liaison",role:"senior",avatar:"SL",color:C.orange,text:"He wants to walk to supply and grab the part. Explain how the supply system works and why he can't just show up and ask."},{user:"Airman Quinn",role:"peer",avatar:"AQ",color:C.blue,text:"Why is there so much process just to get a part? If supply has it in stock why can't maintenance just pick it up?"},{user:"Supply Liaison",role:"senior",avatar:"SL",color:C.orange,text:"What happens to accountability and inventory when people just walk in and take parts?"}], rubric:{causal:["accountability","inventory accuracy","cost tracking","part traceability"],sequence:["identify NSN","submit requisition","supply checks stock","issue with documentation","receive and verify"],risk:["lost accountability","wrong part","supply imbalance"],platform:["supply system","requisition","NSN","stock record"],terminology:["NSN","requisition","stock number","issue document"]} },
  { id:"ms-02", trade:"aviation", cat:"support", title:"Technical Manual Authority", tier:1, scenario:"Airman working from memory on a task he's done dozens of times. Maintenance Chief stops him and asks you to explain why the tech manual must be on the bench every time.", keySkills:["tech manual authority","change incorporation","memory vs document","procedure compliance"], seedMessages:[{user:"Maintenance Chief",role:"senior",avatar:"MCH",color:C.orange,text:"He's working from memory on a task he says he's done a hundred times. Explain why the tech manual still has to be on the bench every single time."},{user:"Airman Ford",role:"peer",avatar:"AFD",color:C.blue,text:"If I've done this job dozens of times and I know it perfectly why do I need to keep referencing the manual?"},{user:"Maintenance Chief",role:"senior",avatar:"MCH",color:C.orange,text:"How do you know the procedure you memorized is still the current procedure?"}], rubric:{causal:["technical change","revision incorporation","procedure update","memory drift"],sequence:["pull current tech manual","verify revision","open to correct procedure","follow step by step","document"],risk:["outdated procedure","missed change","incorrect torque","wrong sequence"],platform:["technical manual","MRC card","maintenance procedure"],terminology:["technical directive","change incorporated","revision","current procedure"]} },
  { id:"ms-03", trade:"aviation", cat:"support", title:"Maintenance Control Communication", tier:1, scenario:"Airman completes a job but doesn't update maintenance control on status, parts, or time. Maintenance Control Officer asks you to explain why that communication is mandatory.", keySkills:["status reporting","maintenance control function","information flow","operational impact"], seedMessages:[{user:"Maintenance Control Officer",role:"senior",avatar:"MCO",color:C.orange,text:"He finished the job and didn't call it in. Walk him through why updating maintenance control is a requirement not a courtesy."},{user:"Airman Chen",role:"peer",avatar:"ACH",color:C.blue,text:"I figured maintenance control would find out when I turned in paperwork. Why do I need to call in real time?"},{user:"Maintenance Control Officer",role:"senior",avatar:"MCO",color:C.orange,text:"What is maintenance control doing with the real-time status of every job on deck and who is making decisions based on that information right now?"}], rubric:{causal:["real-time status","flight schedule decisions","manpower reallocation","parts staging"],sequence:["job complete","call maintenance control","report status parts time","update board","document"],risk:["scheduling error","delayed aircraft","duplicate work"],platform:["maintenance control","status board","flight schedule"],terminology:["status report","ETC","maintenance control","job complete"]} },

  // ── ELECTRICIAN ──────────────────────────────────────────────────────────────
  { id:"el-w-01", trade:"electrical", cat:"wiring", title:"Reading a Voltage Drop", tier:1, scenario:"Customer says lights dim when the AC kicks on. You measure voltage at the panel and at the outlet. Master Electrician asks you to explain what's happening before you touch anything.", keySkills:["voltage drop causes","wire sizing","load calculation","diagnostic sequence"], seedMessages:[{user:"Master Electrician",role:"senior",avatar:"ME",color:C.orange,text:"Lights dim when the AC kicks on. You've got readings from the panel and the outlet. Walk me through what's actually happening before you grab any tools."},{user:"Apprentice Diaz",role:"peer",avatar:"AD",color:C.blue,text:"I think it's a loose connection somewhere but I'm not sure how to confirm that from just the voltage numbers."},{user:"Master Electrician",role:"senior",avatar:"ME",color:C.orange,text:"Loose connection is one possibility. What does the voltage drop number itself tell you about wire size and distance?"}], rubric:{causal:["resistance","wire gauge","distance","inrush current","impedance"],sequence:["measure at source","measure at load","calculate drop","check wire size","check connections"],risk:["overheating","fire hazard","equipment damage","nuisance tripping"],platform:["panel","branch circuit","conductor","load"],terminology:["voltage drop","ampacity","conductor gauge","inrush current"]} },
  { id:"el-w-02", trade:"electrical", cat:"wiring", title:"Identifying a Shared Neutral", tier:1, scenario:"Two circuits in an older home share a neutral wire. New apprentice doesn't see the problem. Journeyman asks you to explain the danger before any work begins.", keySkills:["shared neutral risk","multiwire branch circuit","overload danger","code requirements"], seedMessages:[{user:"Journeyman Park",role:"senior",avatar:"JP",color:C.orange,text:"He doesn't see why a shared neutral is a problem. Explain what actually happens electrically when that neutral gets disrupted."},{user:"Apprentice Lee",role:"peer",avatar:"AL",color:C.blue,text:"If both circuits are working fine right now, what's the actual risk with the shared neutral setup?"},{user:"Journeyman Park",role:"senior",avatar:"JP",color:C.orange,text:"What happens to the neutral current if someone disconnects that neutral while both circuits are still energized?"}], rubric:{causal:["multiwire branch circuit","neutral current","overvoltage","phase imbalance"],sequence:["identify shared neutral","verify opposite phases","check breaker handle tie","test before work"],risk:["overvoltage","equipment destruction","fire","shock hazard"],platform:["multiwire branch circuit","neutral conductor","panel"],terminology:["MWBC","shared neutral","handle tie","phase"]} },
  { id:"el-c-01", trade:"electrical", cat:"code", title:"GFCI Requirements — Why, Not Just Where", tier:1, scenario:"Apprentice installed a regular outlet within 6 feet of a kitchen sink. Inspector flagged it. Explain the actual electrical reasoning behind GFCI requirements, not just the rule.", keySkills:["GFCI function","ground fault detection","code rationale","wet location risk"], seedMessages:[{user:"Inspector Reyes",role:"senior",avatar:"IR",color:C.orange,text:"This outlet near the sink isn't GFCI protected. Before we talk about the code section — explain what a GFCI actually does and why it matters here specifically."},{user:"Apprentice Nash",role:"peer",avatar:"AN",color:C.blue,text:"I know GFCI is for safety near water but I don't actually know how the device tells the difference between normal current and a fault."},{user:"Inspector Reyes",role:"senior",avatar:"IR",color:C.orange,text:"What is the GFCI measuring, and what threshold makes it trip?"}], rubric:{causal:["ground fault","current imbalance","body as path","shock physiology"],sequence:["identify wet location","verify GFCI protection","test trip function","document"],risk:["electrocution","ground fault undetected","code violation"],platform:["GFCI receptacle","wet location","kitchen circuit"],terminology:["ground fault","milliamp threshold","wet location","GFCI"]} },
  { id:"el-c-02", trade:"electrical", cat:"code", title:"Why Romex Can't Run Exposed", tier:1, scenario:"Apprentice ran NM cable exposed along a garage wall, no conduit. Master Electrician stops the job and asks for the actual engineering reason behind the requirement.", keySkills:["NM cable limitations","physical protection","code rationale","conduit requirements"], seedMessages:[{user:"Master Electrician",role:"senior",avatar:"MEL",color:C.orange,text:"That Romex can't stay exposed like that. Before I tell you to add conduit — tell me why NM cable needs physical protection in the first place."},{user:"Apprentice Boyd",role:"peer",avatar:"AB",color:C.blue,text:"I know it's a code rule but I don't actually know what could go wrong with it just running exposed like that."},{user:"Master Electrician",role:"senior",avatar:"MEL",color:C.orange,text:"What's different about the jacket on NM cable compared to something rated for exposed or wet locations?"}], rubric:{causal:["mechanical damage","UV degradation","insulation rating","jacket material"],sequence:["identify exposure risk","determine conduit need","select conduit type","install per code"],risk:["physical damage","insulation breakdown","fire","shock"],platform:["NM cable","conduit","garage wiring"],terminology:["NM-B","physical protection","conduit fill","exposed wiring"]} },
  { id:"el-p-01", trade:"electrical", cat:"panels", title:"Panel Load Calculation Basics", tier:1, scenario:"Homeowner wants to add a hot tub circuit. Apprentice says the panel has open slots so it should be fine. Master Electrician asks you to explain why open slots don't answer the real question.", keySkills:["load calculation","panel capacity","demand factors","service sizing"], seedMessages:[{user:"Master Electrician",role:"senior",avatar:"MEC",color:C.orange,text:"He's saying open slots mean we're good to add the hot tub. Explain why that's not actually the question we need to answer."},{user:"Apprentice Cole",role:"peer",avatar:"ACL",color:C.blue,text:"If there's physical room in the panel, what else would stop us from adding another circuit?"},{user:"Master Electrician",role:"senior",avatar:"MEC",color:C.orange,text:"What's the difference between physical space in the panel and the electrical capacity of the service feeding it?"}], rubric:{causal:["service capacity","demand factor","total connected load","ampacity limit"],sequence:["calculate existing load","apply demand factors","add new load","compare to service rating"],risk:["overloaded service","nuisance tripping","fire hazard","main breaker failure"],platform:["panel","service entrance","main breaker"],terminology:["load calculation","demand factor","service rating","connected load"]} },
  { id:"el-ctl-01", trade:"electrical", cat:"controls", title:"Troubleshooting a 3-Way Switch", tier:1, scenario:"Homeowner says a 3-way switch setup stopped working after they tried to add a smart switch themselves. Walk the apprentice through how to diagnose it.", keySkills:["3-way switch logic","traveler wires","troubleshooting sequence","smart switch compatibility"], seedMessages:[{user:"Journeyman Reed",role:"senior",avatar:"JR",color:C.orange,text:"Homeowner's 3-way broke after a smart switch install. Before we touch anything — explain how a 3-way circuit actually works electrically."},{user:"Apprentice Vance",role:"peer",avatar:"AV",color:C.blue,text:"I know there are two switches but I don't fully understand what the traveler wires are doing between them."},{user:"Journeyman Reed",role:"senior",avatar:"JR",color:C.orange,text:"What happens at each switch position that lets current complete the circuit to the light?"}], rubric:{causal:["traveler wire function","switch position logic","common terminal","circuit completion"],sequence:["identify wire roles","test continuity","check switch compatibility","verify neutral availability"],risk:["miswired circuit","smart switch damage","no neutral present"],platform:["3-way switch","traveler wire","smart switch","junction box"],terminology:["traveler","common terminal","3-way","line and load"]} },

  // ── HVAC ──────────────────────────────────────────────────────────────────────
  { id:"hv-r-01", trade:"hvac", cat:"refrig", title:"Low Refrigerant or Bad Airflow?", tier:1, scenario:"Customer's AC is running but barely cooling. Suction line has light frost on it. New tech wants to add refrigerant immediately. Lead tech stops him and asks you to explain why that's premature.", keySkills:["frost diagnosis","superheat/subcooling","airflow vs charge","diagnostic sequence"], seedMessages:[{user:"Lead Tech Ramos",role:"senior",avatar:"LR",color:C.orange,text:"He wants to add refrigerant because the suction line is frosted. Before he touches a gauge — explain why frost doesn't automatically mean low charge."},{user:"Tech Whitfield",role:"peer",avatar:"TW",color:C.blue,text:"I always thought frost on the suction line meant the system was low and needed a top-off. What else would cause that?"},{user:"Lead Tech Ramos",role:"senior",avatar:"LR",color:C.orange,text:"What happens to evaporator coil temperature when airflow across it drops — and what does that do to the suction line?"}], rubric:{causal:["airflow restriction","evaporator temp drop","superheat reading","dirty filter or coil"],sequence:["check airflow first","measure superheat","measure subcooling","then evaluate charge"],risk:["overcharging system","compressor damage","misdiagnosis costing customer money"],platform:["evaporator coil","suction line","superheat","airflow"],terminology:["superheat","subcooling","frost vs ice","charge verification"]} },
  { id:"hv-a-01", trade:"hvac", cat:"airflow", title:"Short Cycling Furnace — Heat Exchanger Risk", tier:1, scenario:"Furnace turns on, runs 90 seconds, shuts off, repeats all night. Homeowner says it's been getting worse. Safety implications first — explain to the apprentice why you check the heat exchanger before anything else.", keySkills:["short cycling causes","heat exchanger safety","limit switch function","CO risk awareness"], seedMessages:[{user:"Senior Tech Boyle",role:"senior",avatar:"SB",color:C.orange,text:"Furnace short cycling all night. Before you touch the thermostat — why does short cycling make heat exchanger inspection the first move, not the last?"},{user:"Apprentice Ng",role:"peer",avatar:"AN",color:C.blue,text:"I figured it was probably a thermostat or filter issue. Why would short cycling point toward the heat exchanger specifically?"},{user:"Senior Tech Boyle",role:"senior",avatar:"SB",color:C.orange,text:"What does the limit switch do when it senses an overheating heat exchanger, and what does that look like from the homeowner's side?"}], rubric:{causal:["limit switch trip","overheating exchanger","restricted airflow","cracked exchanger risk"],sequence:["inspect heat exchanger","check airflow","check limit switch","then address cycling"],risk:["carbon monoxide leak","cracked heat exchanger","fire hazard"],platform:["heat exchanger","limit switch","furnace","airflow"],terminology:["short cycling","limit switch","heat exchanger","CO risk"]} },

  // ── AUTOMOTIVE ───────────────────────────────────────────────────────────────
  { id:"au-d-01", trade:"automotive", cat:"diagnostics", title:"Check Engine Light — Code Isn't the Diagnosis", tier:1, scenario:"Customer pulls in with a check engine light. Scan tool shows P0420 — catalyst efficiency below threshold. Apprentice wants to quote a new catalytic converter immediately. Explain why that's jumping the gun.", keySkills:["code interpretation","root cause vs symptom","catalyst efficiency causes","diagnostic sequence"], seedMessages:[{user:"Master Tech Alvarez",role:"senior",avatar:"MA",color:C.orange,text:"He wants to quote a new cat based on one code. Before any parts get ordered — what does a P0420 actually tell us, and what doesn't it tell us?"},{user:"Tech Dunbar",role:"peer",avatar:"TD",color:C.blue,text:"The code literally says catalyst efficiency, so isn't that telling us the cat is bad?"},{user:"Master Tech Alvarez",role:"senior",avatar:"MA",color:C.orange,text:"What upstream problems could make a perfectly good catalytic converter read as inefficient to the O2 sensors?"}], rubric:{causal:["upstream misfire","oxygen sensor accuracy","exhaust leak","fuel trim issues"],sequence:["check upstream codes","inspect for leaks","verify O2 sensor function","then evaluate cat itself"],risk:["unnecessary repair cost","customer distrust","root cause unaddressed"],platform:["catalytic converter","O2 sensor","scan tool","exhaust system"],terminology:["P0420","catalyst efficiency","upstream/downstream sensor","fuel trim"]} },
  { id:"au-e-01", trade:"automotive", cat:"engine", title:"Diagnosing a Knock Before Teardown", tier:1, scenario:"Customer reports a knocking sound under acceleration. Apprentice assumes rod knock and wants to recommend an engine rebuild quote. Walk through why that conclusion is premature without further diagnosis.", keySkills:["knock source isolation","rod knock vs other causes","listening diagnostics","customer cost implications"], seedMessages:[{user:"Shop Foreman Castillo",role:"senior",avatar:"FC",color:C.orange,text:"He's ready to quote a full rebuild off a knocking sound. Before we tell a customer they need a new engine — what else makes a knocking noise under acceleration?"},{user:"Tech Reyes",role:"peer",avatar:"TR",color:C.blue,text:"I figured knocking under load almost always means rod bearings. What else would sound similar?"},{user:"Shop Foreman Castillo",role:"senior",avatar:"FC",color:C.orange,text:"What's the difference in sound and timing between a rod knock, a loose heat shield, and pre-ignition detonation?"}], rubric:{causal:["rod bearing wear","detonation/pre-ignition","loose exhaust component","carbon buildup"],sequence:["isolate sound location","check under load vs idle","inspect exhaust components","then consider internal causes"],risk:["unnecessary engine replacement","customer overcharged","missed actual cause"],platform:["engine block","rod bearings","exhaust heat shield","ignition timing"],terminology:["rod knock","detonation","pre-ignition","heat shield rattle"]} },

  // ── PLUMBING ─────────────────────────────────────────────────────────────────
  { id:"pl-p-01", trade:"plumbing", cat:"piping", title:"Why Slope Matters More Than Pipe Size", tier:1, scenario:"New apprentice installed a drain line that's technically the right diameter but the customer keeps getting slow drainage. Explain why pipe size alone doesn't guarantee proper drainage.", keySkills:["drain slope requirements","flow velocity","self-cleaning velocity","code minimums"], seedMessages:[{user:"Master Plumber Hayes",role:"senior",avatar:"MH",color:C.orange,text:"Pipe size is correct per code but it's still draining slow. Before you second-guess the diameter — what role does slope play that size alone doesn't cover?"},{user:"Apprentice Brooks",role:"peer",avatar:"AB",color:C.blue,text:"I figured if the pipe diameter matches code, drainage should be fine regardless of the exact slope, as long as it's pitched at all."},{user:"Master Plumber Hayes",role:"senior",avatar:"MH",color:C.orange,text:"What happens to solids in the waste stream if the slope is too shallow — and what happens if it's too steep?"}], rubric:{causal:["self-cleaning velocity","solids separation from liquid","insufficient or excessive slope"],sequence:["verify slope with level","check against code minimum","inspect for bellies in line","correct if needed"],risk:["repeated clogs","sewer gas issues","code violation","callback costs"],platform:["drain line","slope","waste pipe","cleanout"],terminology:["self-cleaning velocity","slope ratio","belly in line","code minimum pitch"]} },
  { id:"pl-d-01", trade:"plumbing", cat:"drainage", title:"Gurgling Drain — Why It's a Venting Problem", tier:1, scenario:"Customer says their sink gurgles every time the washing machine drains nearby. Apprentice assumes it's just a clog in the sink. Explain why this points to venting, not a simple blockage.", keySkills:["venting function","trap siphoning","negative pressure","system-wide diagnosis"], seedMessages:[{user:"Journeyman Patel",role:"senior",avatar:"JP",color:C.orange,text:"He wants to snake the sink for a gurgle that only happens when the washer drains. Before he grabs a snake — why does that pattern point away from a simple clog?"},{user:"Apprentice Singh",role:"peer",avatar:"AS",color:C.blue,text:"If the sink is gurgling, isn't that the fixture with the problem? Why would the washing machine matter?"},{user:"Journeyman Patel",role:"senior",avatar:"JP",color:C.orange,text:"What is the vent stack actually doing when a large volume of water drains fast, and what happens to nearby traps if venting is inadequate?"}], rubric:{causal:["negative pressure","trap siphoning","inadequate venting","shared drain line"],sequence:["identify pattern triggers","inspect vent stack","check trap seal","address venting not just fixture"],risk:["sewer gas entering home","repeated trap siphoning","missed root cause"],platform:["vent stack","P-trap","drain line","fixture"],terminology:["venting","trap siphon","negative pressure","air admittance valve"]} },

  // ── WELDING ──────────────────────────────────────────────────────────────────
  { id:"wd-p-01", trade:"welding", cat:"weldproc", title:"Porosity in the Weld — Before You Blame the Welder", tier:1, scenario:"Inspector rejects a weld for porosity. Apprentice welder insists his technique was correct and wants to argue the call. Walk through what actually causes porosity before assigning blame.", keySkills:["porosity causes","shielding gas contamination","base metal cleanliness","inspection standards"], seedMessages:[{user:"Certified Welding Inspector Cho",role:"senior",avatar:"WC",color:C.orange,text:"He's arguing his technique was fine so the rejection must be wrong. Before this goes further — what actually causes porosity in a weld, beyond just technique?"},{user:"Welder Jensen",role:"peer",avatar:"WJ",color:C.blue,text:"I ran consistent travel speed and angle the whole time. If my technique was right, what else could cause porosity?"},{user:"Certified Welding Inspector Cho",role:"senior",avatar:"WC",color:C.orange,text:"What happens to the shielding gas envelope if there's wind, contamination, or the wrong flow rate — even with perfect technique?"}], rubric:{causal:["shielding gas contamination","moisture or rust on base metal","incorrect gas flow rate","wind disturbance"],sequence:["check shielding gas integrity","inspect base metal cleanliness","verify flow rate","then evaluate technique"],risk:["structural weld failure","repeated rejections","wasted material and time"],platform:["shielding gas","base metal","weld puddle","gas flow regulator"],terminology:["porosity","shielding gas envelope","flow rate","base metal contamination"]} },
  { id:"wd-m-01", trade:"welding", cat:"metallurgy", title:"Why Preheat Isn't Optional on Thick Steel", tier:1, scenario:"Apprentice wants to skip preheating a thick structural steel joint to save time. Senior welder stops the job and asks you to explain what happens metallurgically if preheat is skipped.", keySkills:["preheat purpose","thermal gradient cracking","hydrogen cracking risk","material thickness considerations"], seedMessages:[{user:"Senior Welder Okafor",role:"senior",avatar:"SO",color:C.orange,text:"He wants to skip preheat to save time on thick steel. Before that torch comes out — what is preheat actually preventing at the metallurgical level?"},{user:"Apprentice Lacroix",role:"peer",avatar:"AL",color:C.blue,text:"I figured preheat was mostly about helping the weld look cleaner. Why would skipping it on thick steel specifically be a problem?"},{user:"Senior Welder Okafor",role:"senior",avatar:"SO",color:C.orange,text:"What happens to the cooling rate of thick steel without preheat, and how does that relate to hydrogen cracking?"}], rubric:{causal:["rapid cooling rate","hydrogen-induced cracking","thermal gradient stress","material thickness heat sink effect"],sequence:["determine required preheat temp","verify with temp stick or gauge","maintain interpass temp","then weld"],risk:["delayed cracking","structural failure","costly rework"],platform:["structural steel","preheat torch","interpass temperature","temperature indicator"],terminology:["preheat","hydrogen cracking","interpass temperature","thermal gradient"]} },
];

// ─── API CALLS ────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userContent) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, system:systemPrompt, messages:[{role:"user",content:userContent}] })
    });
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch { return ""; }
}

async function scoreMessage(text, topic, history) {
  // Full conversation context — not just the last few messages.
  // Scoring should reflect the technician's full demonstrated pattern, not a snapshot.
  const ctx = history.map(m=>`${m.user}: ${m.text}`).join("\n");
  const result = await callClaude(
    `You are an expert aviation maintenance competency evaluator running passive detection. You have the FULL conversation history — use it. If the technician has shown understanding earlier that they're now building on, factor that in. If they're contradicting something they said earlier, that matters too. Score this contribution across 5 markers (0-100 each). Respond ONLY in JSON: {"causal":0,"sequence":0,"risk":0,"platform":0,"terminology":0,"overall":0,"signal":"weak","insight":"12 words max","flag":false}. signal="strong"|"moderate"|"weak"|"concerning". flag=true if dangerous misinformation.`,
    `Topic: ${topic.title}\nScenario: ${topic.scenario}\nFull conversation so far:\n${ctx}\nLatest contribution to score: "${text}"`
  );
  try { return JSON.parse(result.replace(/```json|```/g,"")); }
  catch { const w=text.split(/\s+/).length; const b=Math.min(40+w*2,70); return {causal:b,sequence:b,risk:b-5,platform:b-10,terminology:b,overall:b,signal:"moderate",insight:"Offline scoring",flag:false}; }
}

async function getPeerResponse(text, topic, history, responder) {
  // Carry the entire thread so the character stays consistent — remembers what was
  // already said, doesn't repeat itself, doesn't contradict earlier responses.
  // This matters until real people are in these discussions alongside the worker.
  const ctx = history.map(m=>`${m.user} (${m.role}): ${m.text}`).join("\n");
  const result = await callClaude(
    `You are ${responder.user}, a ${responder.role} in an ongoing aviation maintenance discussion. You have the FULL conversation history below — stay consistent with everything you and others have already said. Do not repeat a point you already made. Build on the thread like a real person would remember it. Stay in character throughout. ${responder.role==="senior"?"Challenge them to go deeper or flag what they missed — reference earlier parts of the conversation when relevant.":"React as a peer — agree, build on, or respectfully push back, referencing what's already been said when it fits."} Under 35 words. Stay technical. No filler.`,
    `Topic: ${topic.title}\nFull conversation so far:\n${ctx}\nThey just said: "${text}"`
  );
  return result.trim() || "Good point — what else?";
}

async function getTutorResponse(text, topic, history, depth) {
  // Full session history — the tutor needs to remember the entire arc of questioning,
  // not just the last exchange, to genuinely progress the Socratic sequence.
  const ctx = history.map(m=>`${m.role==="user"?"Technician":"Tutor"}: ${m.text}`).join("\n");
  const result = await callClaude(
    `You are an expert aviation maintenance tutor running a self-directed learning session. You have the FULL session history — use it to avoid re-asking something already covered and to build genuinely on what the technician has already demonstrated. Your job is to progressively deepen understanding through Socratic questioning. ${depth<2?"Start fundamental — verify they understand the basics.":depth<4?"Push deeper — ask about edge cases, failure modes, sequence dependencies not yet covered.":"Go expert-level — test their ability to teach it back, find their limits."} Ask ONE focused follow-up question that builds on the full conversation. Under 40 words. Technical and direct.`,
    `Topic: ${topic.title}\nScenario: ${topic.scenario}\nFull conversation so far:\n${ctx}\nTechnician just said: "${text}"`
  );
  return result.trim() || "Walk me through the next step in more detail.";
}

async function benchmarkScore(text, benchmark, question) {
  const result = await callClaude(
    `You are evaluating a ${benchmark.label} benchmark response. Score accuracy 0-100. Respond ONLY in JSON: {"score":0,"correct":false,"feedback":"one sentence"}`,
    `Question: "${question}"\nResponse: "${text}"`
  );
  try { return JSON.parse(result.replace(/```json|```/g,"")); }
  catch { return {score:50,correct:false,feedback:"Unable to score — try again"}; }
}

// ── DISCOVERY PATH — conversational trade-fit mapping, the ASVAB replacement.
// Not a test. A natural conversation where the AI passively reads how someone
// thinks — problem-solving style, what energizes/frustrates them, pressure
// response — and maps those signals to trade fit, the same way discussions
// are passively scored for competency. ──────────────────────────────────────
async function getDiscoveryResponse(text, history, depth) {
  const ctx = history.map(m=>`${m.role==="user"?"Person":"Guide"}: ${m.text}`).join("\n");
  const lastGuideMsg = [...history].reverse().find(m=>m.role==="guide")?.text || "";
  const stage = depth<2
      ? "warm-up — stay easy and human, ask about everyday life, what they're doing now, what they spend their time on. Nothing analytical yet. This should feel like small talk that's actually going somewhere."
    : depth<4
      ? "narrowing — now naturally bring it toward work and problem-solving: something they've fixed, built, organized, or figured out, what they liked or hated about a job, how they handle pressure or people. Lead them there, don't make them generate the topic themselves."
      : "closing — you have enough now. Ask one last grounding question, or transition toward wrapping up.";
  const result = await callClaude(
    `You are a warm, sharp career guidance counselor leading a real conversation — not a chatbot waiting for the person to generate insight on their own. Many people you talk to don't know what they want and feel a little lost, so YOU drive this. Never make them do analytical work like "think of a time you felt satisfied" — that's homework, not conversation. Meet them where they are with easy, human questions, and let the conversation naturally walk toward what matters.

This must read like a real counselor's turn, not a Q&A bot:
- React first to what they specifically just said — reference a detail, a word they used. Never skip straight to a generic next question.
- Most turns should NOT end in a question mark. Sometimes reflect back what you heard. Sometimes make a short warm observation. Ask a direct question when it earns one, roughly half the time.
- Keep early questions concrete and easy — "what's your day look like," "what do you do for work right now," "what did you want to be as a kid" — not abstract self-reflection prompts.
- Never use clinical or scripted phrasing ("Tell me more about that") — talk the way a real, warm person talks.
- CRITICAL: never repeat or closely rephrase your own previous message. Your last message was: "${lastGuideMsg}" — if their answer was vague or general, push for a SPECIFIC concrete example instead ("give me an example from this week" / "like what, specifically?") rather than re-asking the same broad question.
- You have the FULL conversation history — build on it, callback to something said earlier if it fits, don't repeat ground already covered.

Stage: ${stage}. Keep it under 30 words. Warm, leading, conversational.`,
    `Full conversation so far:\n${ctx}\nThey just said: "${text}"`
  );
  const reply = result.trim();
  // Guard against the model accidentally echoing its own last line, and against
  // empty responses defaulting to something that duplicates the prior turn.
  if (!reply || reply.toLowerCase() === lastGuideMsg.toLowerCase()) {
    return "Give me a specific example — like, what's one thing you did this week?";
  }
  return reply;
}

async function getDiscoveryResult(history) {
  const ctx = history.map(m=>`${m.role==="user"?"Person":"Guide"}: ${m.text}`).join("\n");
  const tradeList = TRADES.filter(t=>t.id!=="general").map(t=>`${t.id} (${t.label})`).join(", ");
  const result = await callClaude(
    `You are analyzing a full discovery conversation to map this person's natural thinking style, problem-solving approach, and energy patterns to real career/trade fits. Available trades in our system: ${tradeList}. You can also recommend paths outside skilled trades (e.g. "operations management," "logistics," "general management," "technical sales") if that's a stronger fit — not everyone belongs in a trade, and forcing a trade-fit when someone is clearly people/systems-oriented does them a disservice.

Respond ONLY with valid JSON:
{"primaryFit":"trade id from list OR a free-text role title","primaryLabel":"human readable title","confidence":"high|moderate|exploratory","reasoning":"2-3 sentences explaining WHY based on what they actually said — reference specific things they mentioned","secondaryFit":"second option label or null","traits":["3-4 short trait observations, e.g. 'Thrives under pressure', 'Detail-oriented', 'Prefers hands-on problem solving'"],"militaryNote":"one sentence on how this profile could translate to military occupational fields, framed as one possible path not the only path"}`,
    `Full discovery conversation:\n${ctx}`
  );
  try { return JSON.parse(result.replace(/```json|```/g,"")); }
  catch { return {primaryFit:"general",primaryLabel:"General Trade Exploration",confidence:"exploratory",reasoning:"We need a bit more conversation to map this clearly — let's keep exploring.",secondaryFit:null,traits:["Curious","Open to exploring"],militaryNote:"Many paths translate across military and civilian trades."}; }
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Badge({children,color,small}){
  return <span style={{display:"inline-block",background:color+"22",border:`1px solid ${color}55`,borderRadius:5,padding:small?"2px 7px":"3px 10px",fontSize:small?10:11,fontWeight:700,color,letterSpacing:1}}>{children}</span>;
}
function Avatar({initials,color,size=36}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:900,color,flexShrink:0}}>{initials}</div>;
}
function SignalDot({signal}){
  const map={strong:C.green,moderate:C.yellow,weak:C.muted,concerning:C.red};
  const color=map[signal]||C.muted;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color}}><span style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block"}}/>{signal.charAt(0).toUpperCase()+signal.slice(1)}</span>;
}

// ─── VOICE HOOKS ──────────────────────────────────────────────────────────────
// STT: hold-to-speak (Chrome/Edge only — sandbox limited)
function useVoice(onResult) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setUnavailable(true); setErrorMsg("Voice input isn't supported in this browser. Try Chrome."); return; }
    setErrorMsg(null);
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (e) => { const t = e.results[0][0].transcript; onResult(t); };
      rec.onend = () => setListening(false);
      rec.onerror = (e) => {
        setListening(false);
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          setErrorMsg("Mic permission was blocked. Check your browser's site settings and allow microphone access, then try again.");
        } else if (e.error === "no-speech") {
          setErrorMsg("Didn't catch that — tap the mic and try again.");
        } else if (e.error === "network") {
          setErrorMsg("Voice recognition needs an internet connection — check your connection and try again.");
        } else {
          setErrorMsg(`Voice input error: ${e.error}. Try again, or just type instead.`);
        }
      };
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setUnavailable(true);
      setListening(false);
      setErrorMsg("Couldn't start voice input. Try again, or type instead.");
    }
  }, [onResult]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);
  // Tap-to-toggle — avoids the first-use bug where the permission prompt's async
  // delay causes a hold-to-speak release to fire stop() before capture begins.
  const toggle = useCallback(() => { listening ? stop() : start(); }, [listening, start, stop]);

  return { listening, start, stop, toggle, unavailable, errorMsg };
}

// TTS: read text aloud using browser speech synthesis
function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95; utt.pitch = 1.0; utt.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const eng = voices.find(v => v.lang.startsWith("en") && v.localService);
    if (eng) utt.voice = eng;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);
  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(false); }, []);
  return { speaking, speak, stop };
}

// ─── SIDEBAR — persistent left nav, dropdown sections, keeps center clear ─────
function Sidebar({ view, activeTopicId, sidebarOpen, setSidebarOpen, filterCat, setFilterCat, completed, onHome, onPickTopic, onPickMode, onBenchmarks, onPickBenchmark, onMilitary, onEmployer, authed, plan, onAuth, onboardingDone, onMyPath, onLogout }) {
  const catCounts = {};
  CATEGORIES.forEach(c=>{ catCounts[c.id] = TOPICS.filter(t=>t.cat===c.id).length; });

  const toggle = (key) => setSidebarOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const sectionHeader = (key, label, icon, count) => (
    <button onClick={()=>toggle(key)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"transparent",border:"none",padding:"10px 14px",cursor:"pointer",textAlign:"left"}}>
      <span style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:800,color:C.text}}>{icon} {label}</span>
      <span style={{display:"flex",alignItems:"center",gap:6}}>
        {count!=null && <span style={{fontSize:11,color:C.muted,background:C.raised,borderRadius:5,padding:"1px 7px"}}>{count}</span>}
        <span style={{fontSize:11,color:C.muted,transform:sidebarOpen[key]?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.15s"}}>▸</span>
      </span>
    </button>
  );

  return (
    <div style={{width:268,flexShrink:0,height:"100vh",overflowY:"auto",background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
      {/* LOGO */}
      <div style={{padding:"16px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={onHome}>
        <div style={{width:24,height:24,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,borderRadius:6,flexShrink:0}}/>
        <span style={{fontSize:16,fontWeight:900,letterSpacing:"-0.5px"}}>APMAC<span style={{color:C.blue,fontWeight:400}}>™</span></span>
      </div>

      <div style={{flex:1,padding:"10px 0"}}>
        {/* MY PATH — always reachable once onboarded */}
        {onboardingDone && (
          <button onClick={onMyPath} style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",background:view==="mypath"?C.blue+"12":"transparent",border:"none",borderRadius:8,padding:"9px 14px",cursor:"pointer",fontSize:13,fontWeight:800,color:view==="mypath"?C.blue:C.text,marginBottom:6}}>
            🎯 My Path
          </button>
        )}
        {onboardingDone && (
          <button onClick={()=>onPickMode("credential")} style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",background:view==="credential"?C.blue+"12":"transparent",border:"none",borderRadius:8,padding:"9px 14px",cursor:"pointer",fontSize:13,fontWeight:800,color:view==="credential"?C.blue:C.text,marginBottom:6}}>
            🪪 My Credential
          </button>
        )}

        {/* DISCUSSIONS — expandable category list */}
        <div style={{marginBottom:4}}>
          {sectionHeader("discussions","Discussions","💬",TOPICS.length)}
          {sidebarOpen.discussions && (
            <div style={{padding:"2px 8px 10px"}}>
              <button onClick={()=>{ setFilterCat("all"); onPickMode("catalog"); }}
                style={{display:"block",width:"100%",textAlign:"left",background:filterCat==="all"&&view==="catalog"?C.blue+"15":"transparent",border:"none",borderRadius:7,padding:"7px 10px",cursor:"pointer",fontSize:12.5,fontWeight:600,color:filterCat==="all"&&view==="catalog"?C.blue:C.dim,marginBottom:1}}>
                All Topics
              </button>
              {CATEGORIES.map(cat=>(
                <button key={cat.id} onClick={()=>{ setFilterCat(cat.id); onPickMode("catalog"); }}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",textAlign:"left",background:filterCat===cat.id&&view==="catalog"?cat.color+"15":"transparent",border:"none",borderRadius:7,padding:"7px 10px",cursor:"pointer",fontSize:12.5,fontWeight:filterCat===cat.id?700:500,color:filterCat===cat.id&&view==="catalog"?cat.color:C.dim,marginBottom:1}}>
                  <span>{cat.icon} {cat.label}</span>
                  <span style={{fontSize:10.5,color:C.muted}}>{catCounts[cat.id]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BENCHMARKS */}
        <div style={{marginBottom:4}}>
          {sectionHeader("benchmarks","Benchmarks","📊",BENCHMARKS.length)}
          {sidebarOpen.benchmarks && (
            <div style={{padding:"2px 8px 10px"}}>
              {BENCHMARKS.map(bm=>(
                <button key={bm.id} onClick={()=>onPickBenchmark(bm)}
                  style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",borderRadius:7,padding:"7px 10px",cursor:"pointer",fontSize:12.5,fontWeight:600,color:C.dim,marginBottom:1}}>
                  <span style={{color:bm.color}}>●</span> {bm.body} — {bm.label.split("—")[1]?.trim()||bm.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MILITARY */}
        <div style={{marginBottom:4}}>
          {sectionHeader("military","Military Path","🎖",null)}
          {sidebarOpen.military && (
            <div style={{padding:"2px 8px 10px"}}>
              <button onClick={onMilitary}
                style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",borderRadius:7,padding:"7px 10px",cursor:"pointer",fontSize:12.5,fontWeight:600,color:C.dim}}>
                🎖 Classification Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACCOUNT STATUS */}
      <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 14px"}}>
        {authed ? (
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:`${C.blue}18`,border:`1px solid ${C.blue}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:C.blue,flexShrink:0}}>ME</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:700,color:C.text}}>Worker Account</div>
              <div style={{fontSize:11,color:plan==="paid"?C.green:C.orange,fontWeight:600}}>{plan==="paid"?"✓ Full Access":"Free Tier"}</div>
            </div>
            <button onClick={onLogout} title="Log out" style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:11,padding:"4px 6px"}}>Log out</button>
          </div>
        ) : (
          <button onClick={onAuth} style={{width:"100%",background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",borderRadius:8,padding:"9px 0",cursor:"pointer",fontSize:12.5,fontWeight:700}}>
            Sign Up / Log In
          </button>
        )}
      </div>

      {/* BOTTOM LINKS */}
      <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 8px"}}>
        <button onClick={onEmployer} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",borderRadius:7,padding:"8px 10px",cursor:"pointer",fontSize:12.5,fontWeight:600,color:C.dim}}>👔 Employer Portal</button>
        <button onClick={()=>onPickMode("admin")} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",borderRadius:7,padding:"8px 10px",cursor:"pointer",fontSize:12.5,fontWeight:600,color:C.muted}}>⚙ Admin</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function APMAC() {
  const [view, setView]             = useState("home");
  // ── Real auth/plan state — backed by Supabase ────────────────────────────────
  const [authed, setAuthed]         = useState(false);
  const [userId, setUserId]         = useState(null);
  const [plan, setPlan]             = useState(null); // null | "free" | "paid"
  const [freeUsed, setFreeUsed]     = useState(false); // free tier = 1 topic, then gated
  const [pendingTopic, setPendingTopic] = useState(null); // topic user tried to open while gated
  const [authMode, setAuthMode]     = useState("login"); // login | signup
  const [employerAuthed, setEmployerAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // checking for existing session on load
  const [authBusy, setAuthBusy]     = useState(false);  // submitting login/signup form
  const [authError, setAuthError]   = useState(null);
  const [authEmail, setAuthEmail]   = useState("");
  const [authPassword, setAuthPassword] = useState("");
  // ── Path / journey state ────────────────────────────────────────────────────
  const [selectedTrade, setSelectedTrade] = useState(null);   // trade id once chosen
  const [onboardingDone, setOnboardingDone] = useState(false); // has user completed entry routing
  const [journeyLog, setJourneyLog]         = useState([]);    // {date, type, label, score, tier}
  const [credentialTab, setCredentialTab]   = useState("credential"); // credential | history | trades
  const [discoveryMsgs, setDiscoveryMsgs]   = useState([]);
  const [discoveryDepth, setDiscoveryDepth] = useState(0);
  const [discoveryResult, setDiscoveryResult] = useState(null); // {trade, reasoning, signals}
  const [discoverySending, setDiscoverySending] = useState(false);
  const [activeTopic, setTopic]     = useState(null);
  const [mode, setMode]             = useState("discuss"); // discuss | self | benchmark | military
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [sending, setSending]       = useState(false);
  const [scores, setScores]         = useState([]);
  const [cumScore, setCum]          = useState(null);
  const [completed, setCompleted]   = useState({});
  const [selfDepth, setSelfDepth]   = useState(0);
  const [selBenchmark, setSelBM]    = useState(null);
  const [bmQuestions, setBmQ]       = useState([]);
  const [bmIdx, setBmIdx]           = useState(0);
  const [bmResults, setBmResults]   = useState([]);
  const [filterCat, setFilterCat]   = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState({ discussions: true, benchmarks: false, military: false });
  const [sessionState, setSessionState] = useState("active"); // active | closed
  const [idleNudges, setIdleNudges] = useState(0);
  const idleTimerRef = useRef(null);
  const [profile] = useState({ name:"James D.", platform:"H-60 / T700", history:[{task:"Engine Oil Servicing",date:"Jun 10",score:82},{task:"FOD Walk",date:"Jun 8",score:76},{task:"BIT Fault",date:"Jun 5",score:89},{task:"Corrosion ID",date:"Jun 1",score:71}] });
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const voice = useVoice((text) => { setInput(prev => prev + (prev?" ":"") + text); });
  const tts   = useTTS();

  const base = {background:C.bg,minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",color:C.text};
  const nav  = {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 28px",borderBottom:`1px solid ${C.border}`};

  const avgHistory = Math.round(profile.history.reduce((s,h)=>s+h.score,0)/profile.history.length);
  const workerTier = getTier(avgHistory);

  // ── Real auth handlers — backed by Supabase ──────────────────────────────────

  // Load a user's profile + journey log + completed topics from the database
  // and hydrate local state so the rest of the app works exactly as before.
  async function loadUserData(uid) {
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (profileData) {
      setPlan(profileData.plan);
      setFreeUsed(!!profileData.free_topic_used);
      setSelectedTrade(profileData.selected_trade);
      setOnboardingDone(!!profileData.onboarding_done);
      setCum(profileData.cum_score);
    }
    const { data: logData } = await supabase.from("journey_log").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    if (logData) {
      setJourneyLog(logData.map(e => ({ date: e.created_at, type: e.type, label: e.label, score: e.score, tier: e.tier })));
    }
    const { data: completedData } = await supabase.from("completed_topics").select("*").eq("user_id", uid);
    if (completedData) {
      const map = {};
      completedData.forEach(c => { map[c.topic_key] = c.score; });
      setCompleted(map);
    }
  }

  // On mount: restore an existing session if one exists, so closing the tab
  // and coming back doesn't lose anything.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setAuthed(true);
        setUserId(session.user.id);
        await loadUserData(session.user.id);
      }
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAuthed(false); setUserId(null); setPlan(null); setJourneyLog([]); setCompleted({});
        setSelectedTrade(null); setOnboardingDone(false); setCum(null);
      }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function handleSignup(email, password) {
    setAuthBusy(true); setAuthError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setAuthBusy(false);
    if (error) { setAuthError(error.message); return; }
    if (data.user) {
      setAuthed(true);
      setUserId(data.user.id);
      setPlan("free");
      finishLogin();
    } else {
      setAuthError("Check your email to confirm your account, then log in.");
    }
  }

  async function handleLoginSubmit(email, password) {
    setAuthBusy(true); setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) { setAuthError(error.message); return; }
    if (data.user) {
      setAuthed(true);
      setUserId(data.user.id);
      await loadUserData(data.user.id);
      finishLogin();
    }
  }

  function finishLogin() {
    if (pendingTopic) {
      const { topic, m } = pendingTopic;
      setPendingTopic(null);
      setOnboardingDone(true);
      setTimeout(()=>startDiscussion(topic, m), 50);
      return;
    }
    setView(onboardingDone ? "catalog" : "route");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setView("home");
  }

  // ── Persist a journey log entry both locally and to the database ────────────
  async function logJourneyEntry(entry) {
    setJourneyLog(prev=>[...prev, entry]);
    if (userId) {
      await supabase.from("journey_log").insert({
        user_id: userId, type: entry.type, label: entry.label, score: entry.score, tier: entry.tier,
      });
    }
  }
  // ── Persist a completed topic both locally and to the database ──────────────
  async function logCompletedTopic(topicKey, score) {
    setCompleted(prev=>({...prev, [topicKey]: score}));
    if (userId) {
      await supabase.from("completed_topics").upsert({ user_id: userId, topic_key: topicKey, score }, { onConflict: "user_id,topic_key" });
    }
  }

  function mockEmployerLogin() {
    setEmployerAuthed(true);
    setView("employer");
  }
  function goEmployer() {
    if (employerAuthed) { setView("employer"); return; }
    setView("employer-auth");
  }

  // ── "I know my path" — pick a trade, go straight to My Path for it ──────────
  async function pickTrade(tradeId) {
    setSelectedTrade(tradeId);
    setOnboardingDone(true);
    setFilterCat("all");
    setView("mypath");
    if (userId) {
      await supabase.from("profiles").update({ selected_trade: tradeId, onboarding_done: true }).eq("id", userId);
    }
  }

  // ── Discovery conversation — passive trade-fit mapping ──────────────────────
  function startDiscovery() {
    setDiscoveryMsgs([{id:0,role:"guide",text:"Hey — I'm glad you're here. Let's just talk for a few minutes, no pressure at all. So tell me a little about yourself — what's your day-to-day look like right now?"}]);
    setDiscoveryDepth(0);
    setDiscoveryResult(null);
    setView("discovery");
  }
  async function sendDiscoveryMsg(text) {
    if (!text.trim() || discoverySending) return;
    setDiscoverySending(true);
    const userMsg = {id:discoveryMsgs.length,role:"user",text:text.trim()};
    const updated = [...discoveryMsgs, userMsg];
    setDiscoveryMsgs(updated);
    setInput("");

    const newDepth = discoveryDepth + 1;
    setDiscoveryDepth(newDepth);

    if (newDepth >= 5) {
      // Enough signal collected — generate the result
      const result = await getDiscoveryResult(updated);
      setDiscoveryResult(result);
      setDiscoverySending(false);
      return;
    }

    const reply = await getDiscoveryResponse(text, updated, newDepth);
    setDiscoveryMsgs(prev=>[...prev,{id:prev.length,role:"guide",text:reply}]);
    setDiscoverySending(false);
  }
  function acceptDiscoveryResult() {
    if (!discoveryResult) return;
    const matchedTrade = TRADES.find(t=>t.id===discoveryResult.primaryFit);
    if (matchedTrade) {
      setSelectedTrade(matchedTrade.id);
      setOnboardingDone(true);
      logJourneyEntry({date:new Date().toISOString(),type:"Discovery",label:`Mapped to ${discoveryResult.primaryLabel}`,score:null,tier:null});
      setView("mypath");
    } else {
      setOnboardingDone(true);
      setView("route");
    }
  }

  function startDiscussion(topic, m="discuss") {
    // ── Access gate ──────────────────────────────────────────────────────────
    if (!authed) { setPendingTopic({topic,m}); setAuthMode("signup"); setView("auth"); return; }
    if (plan==="free" && freeUsed && m!=="military") { setPendingTopic({topic,m}); setView("paywall"); return; }

    setTopic(topic);
    setMode(m);
    setScores([]);
    setCum(null);
    setInput("");
    setSelfDepth(0);
    setSessionState("active");
    setIdleNudges(0);
    if (plan==="free" && m!=="military") setFreeUsed(true);
    if (m === "discuss") {
      setMessages(topic.seedMessages.map((msg,i)=>({...msg,id:i})));
    } else if (m === "self") {
      setMessages([{id:0,user:"Tutor",role:"tutor",avatar:"AI",color:C.cyan,text:`Let's explore "${topic.title}" together. To start — walk me through what you already know about this topic. Don't hold back, even if it's basic. Tell me what's happening technically and why it matters.`}]);
    } else if (m === "military") {
      setMessages([{id:0,user:"Classification AI",role:"tutor",avatar:"ML",color:C.purple,text:`This isn't a test — there are no wrong answers. I want to understand how you think. Tell me: if you had to explain how an engine works to someone who has never seen one, where would you start and why?`}]);
    }
    setView("discuss");
  }

  // ── Session keep-alive: if nobody types for a while, AI nudges the room forward.
  // Stands in for a live moderator until real people are in these discussions. ──
  useEffect(() => {
    if (view !== "discuss" || sessionState !== "active" || sending) return;
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(async () => {
      if (idleNudges >= 3) return; // cap auto-nudges so it doesn't run forever unattended
      const last = messages[messages.length - 1];
      if (!last || last.role === "worker") return; // don't nudge right after the worker just spoke
      setSending(true);
      let nudgeText = "";
      if (mode === "discuss") {
        const peers = activeTopic.seedMessages.filter(m=>m.role!=="moderator");
        const responder = peers[idleNudges % peers.length];
        nudgeText = await getPeerResponse("(quiet in the room — keep the discussion moving)", activeTopic, messages, responder);
        setMessages(prev=>[...prev,{id:prev.length,user:responder.user,role:responder.role,avatar:responder.avatar,color:responder.color,text:nudgeText}]);
      } else {
        nudgeText = await getTutorResponse("(taking a moment to think)", activeTopic, messages.map(m=>({role:m.role==="worker"?"user":"assistant",text:m.text})), selfDepth);
        setMessages(prev=>[...prev,{id:prev.length,user:mode==="military"?"Classification AI":"Tutor",role:"tutor",avatar:mode==="military"?"ML":"AI",color:mode==="military"?C.purple:C.cyan,text:nudgeText}]);
      }
      setIdleNudges(n=>n+1);
      setSending(false);
    }, 25000); // 25s of silence triggers a nudge
    return () => clearTimeout(idleTimerRef.current);
  }, [messages, view, sessionState, sending, mode, idleNudges, activeTopic, selfDepth]);

  function endSession() {
    clearTimeout(idleTimerRef.current);
    setSessionState("closed");
  }

  async function handleSend() {
    if (!input.trim() || sending || sessionState==="closed") return;
    setSending(true);
    setIdleNudges(0);
    const text = input.trim();
    setInput("");
    const userMsg = {id:messages.length,user:"You",role:"worker",avatar:"ME",color:C.blue,text,scoring:true};
    setMessages(prev=>[...prev,userMsg]);

    if (mode === "discuss") {
      const s = await scoreMessage(text, activeTopic, messages);
      setMessages(prev=>prev.map(m=>m.id===userMsg.id?{...m,scoring:false,score:s}:m));
      const ns = [...scores,s];
      setScores(ns);
      const avg = Math.round(ns.reduce((a,r)=>a+r.overall,0)/ns.length);
      setCum(avg);
      if (ns.length>=3) {
        logCompletedTopic(activeTopic.id, avg);
        logJourneyEntry({date:new Date().toISOString(),type:"Guided Discussion",label:activeTopic.title,score:avg,tier:getTier(avg).name});
        // Free tier gets exactly one real discussion before the paywall.
        if (plan==="free" && !freeUsed && userId) {
          setFreeUsed(true);
          supabase.from("profiles").update({ free_topic_used: true, cum_score: avg }).eq("id", userId);
        } else if (userId) {
          supabase.from("profiles").update({ cum_score: avg }).eq("id", userId);
        }
      }
      await new Promise(r=>setTimeout(r,900));
      const peers = activeTopic.seedMessages.filter(m=>m.role!=="moderator");
      if (peers.length) {
        const responder = peers[ns.length % peers.length];
        const reply = await getPeerResponse(text, activeTopic, [...messages,userMsg], responder);
        setMessages(prev=>[...prev,{id:prev.length,user:responder.user,role:responder.role,avatar:responder.avatar,color:responder.color,text:reply}]);
      }
    } else if (mode === "self" || mode === "military") {
      const s = await scoreMessage(text, activeTopic, messages);
      setMessages(prev=>prev.map(m=>m.id===userMsg.id?{...m,scoring:false,score:s}:m));
      const ns = [...scores,s];
      setScores(ns);
      const avg = Math.round(ns.reduce((a,r)=>a+r.overall,0)/ns.length);
      setCum(avg);
      const newDepth = selfDepth + 1;
      setSelfDepth(newDepth);
      if (ns.length>=3) {
        logCompletedTopic(activeTopic.id+"_"+mode, avg);
        logJourneyEntry({date:new Date().toISOString(),type:mode==="military"?"Classification":"Self-Study",label:activeTopic.title,score:avg,tier:getTier(avg).name});
        if (userId) supabase.from("profiles").update({ cum_score: avg }).eq("id", userId);
      }
      await new Promise(r=>setTimeout(r,900));
      const reply = await getTutorResponse(text, activeTopic, [...messages,userMsg].map(m=>({role:m.role==="worker"?"user":"assistant",text:m.text})), newDepth);
      setMessages(prev=>[...prev,{id:prev.length,user:mode==="military"?"Classification AI":"Tutor",role:"tutor",avatar:mode==="military"?"ML":"AI",color:mode==="military"?C.purple:C.cyan,text:reply}]);
    }
    setSending(false);
  }

  // ─── BENCHMARK FLOW ──────────────────────────────────────────────────────────
  const BM_QUESTIONS = {
    ap: [
      "Explain the function of a magneto in a reciprocating engine and what would cause it to fail during operation.",
      "What is the purpose of a fuel-air mixture control and what are the risks of running excessively lean?",
      "Describe what an annual inspection requires and who is authorized to return the aircraft to service.",
      "What does a green arc on an airspeed indicator represent and what is its engineering basis?",
      "Explain hydraulic lock in a radial engine and the correct pre-start procedure to prevent it.",
    ],
    asvab: [
      "A gear with 20 teeth meshes with a gear with 40 teeth. If the small gear turns at 100 RPM, how fast does the large gear turn and in which direction?",
      "An electrical circuit has a 12V battery and a 4-ohm resistor. What is the current flowing through the circuit?",
      "A lever is 10 feet long with the fulcrum 2 feet from the load. If the load weighs 400 lbs, how much force is needed at the other end?",
      "Water flows through a pipe that narrows from 4 inches to 2 inches in diameter. What happens to the water pressure and velocity at the narrow section?",
      "A hydraulic press has a 1-inch input piston and a 10-inch output piston. If you apply 50 lbs of force to the input, what force does the output generate?",
    ],
    epa: [
      "What is the maximum allowable leak rate for a refrigerant system before service is required under EPA Section 608?",
      "Explain the difference between recovery, recycling, and reclaiming refrigerant and when each applies.",
      "What are the technician certification requirements before purchasing refrigerant containing CFCs or HCFCs?",
      "Describe the correct procedure for disposing of refrigerant-containing appliances.",
      "What refrigerants fall under the venting prohibition and what are the penalties for illegal venting?",
    ],
  };

  function startBenchmark(bm) {
    setSelBM(bm);
    setBmQ(BM_QUESTIONS[bm.id] || BM_QUESTIONS.ap);
    setBmIdx(0);
    setBmResults([]);
    setInput("");
    setView("benchmark");
  }

  async function handleBenchmarkSubmit() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    const result = await benchmarkScore(text, selBenchmark, bmQuestions[bmIdx]);
    const nr = [...bmResults, {question:bmQuestions[bmIdx], answer:text, ...result}];
    setBmResults(nr);
    setBmIdx(bmIdx+1);
    setSending(false);
  }

  const bmComplete = bmIdx >= (bmQuestions?.length || 0) && bmResults.length > 0;
  const bmAvgScore = bmResults.length ? Math.round(bmResults.reduce((s,r)=>s+r.score,0)/bmResults.length) : 0;

  // TOPIC COUNTS
  const catCounts = {};
  CATEGORIES.forEach(c=>{ catCounts[c.id] = TOPICS.filter(t=>t.cat===c.id).length; });
  const doneCount = Object.keys(completed).length;
  const filteredTopics = filterCat==="all" ? TOPICS : TOPICS.filter(t=>t.cat===filterCat);
  const currentTier = cumScore!==null ? getTier(cumScore) : null;

  // ══════════════════════════════════════════════════════════════════════════════
  // HOME
  // ══════════════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════════════
  // AUTH — mock login/signup, demo only, no real backend
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="auth") return (
    <div style={{...base,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{display:"flex",alignItems:"center",gap:9,justifyContent:"center",marginBottom:8}}>
          <div style={{width:26,height:26,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,borderRadius:6}}/>
          <span style={{fontSize:19,fontWeight:900,letterSpacing:"-0.5px"}}>APMAC<span style={{color:C.blue,fontWeight:400}}>™</span></span>
        </div>
        <p style={{textAlign:"center",fontSize:12.5,color:C.muted,fontStyle:"italic",marginBottom:24}}>Championing the prestige of craftsmanship — by MATCEDI™</p>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
          <div style={{display:"flex",gap:6,marginBottom:22,background:C.bg,borderRadius:9,padding:4}}>
            <button onClick={()=>setAuthMode("signup")} style={{flex:1,background:authMode==="signup"?C.surface:"transparent",border:"none",borderRadius:7,padding:"8px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:authMode==="signup"?C.blue:C.dim,boxShadow:authMode==="signup"?"0 1px 3px rgba(20,30,60,0.08)":"none"}}>Sign Up</button>
            <button onClick={()=>setAuthMode("login")} style={{flex:1,background:authMode==="login"?C.surface:"transparent",border:"none",borderRadius:7,padding:"8px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:authMode==="login"?C.blue:C.dim,boxShadow:authMode==="login"?"0 1px 3px rgba(20,30,60,0.08)":"none"}}>Log In</button>
          </div>

          {pendingTopic && (
            <div style={{background:`${C.blue}10`,border:`1px solid ${C.blue}33`,borderRadius:9,padding:"10px 12px",marginBottom:18,fontSize:12.5,color:C.dim}}>
              Sign up to start <strong style={{color:C.text}}>{pendingTopic.topic.title}</strong> — your first discussion is free.
            </div>
          )}

          {authError && (
            <div style={{background:`${C.red}10`,border:`1px solid ${C.red}33`,borderRadius:9,padding:"10px 12px",marginBottom:18,fontSize:12.5,color:C.red}}>
              {authError}
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:700,color:C.dim,display:"block",marginBottom:5}}>Email</label>
            <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,color:C.text,outline:"none"}}/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{fontSize:12,fontWeight:700,color:C.dim,display:"block",marginBottom:5}}>Password</label>
            <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")authMode==="signup"?handleSignup(authEmail,authPassword):handleLoginSubmit(authEmail,authPassword);}} placeholder="At least 6 characters" style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,color:C.text,outline:"none"}}/>
          </div>

          <button onClick={()=>authMode==="signup"?handleSignup(authEmail,authPassword):handleLoginSubmit(authEmail,authPassword)} disabled={authBusy||!authEmail||authPassword.length<6}
            style={{width:"100%",background:authBusy||!authEmail||authPassword.length<6?C.border:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:authBusy||!authEmail||authPassword.length<6?C.muted:"#fff",padding:"13px",borderRadius:10,cursor:authBusy?"wait":"pointer",fontSize:14,fontWeight:700,marginBottom:10}}>
            {authBusy ? "···" : authMode==="signup"?"Create Free Account":"Log In"}
          </button>
          <div style={{textAlign:"center",fontSize:11.5,color:C.muted}}>Real account — your progress is saved and follows you everywhere</div>
        </div>
        <div style={{textAlign:"center",marginTop:16}}>
          <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:13}}>← Back to home</button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // ROUTE — the low-friction entry routing screen, shown once after signup
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="route") return (
    <div style={{...base,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
      <div style={{width:"100%",maxWidth:620}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <Badge color={C.blue}>Welcome to APMAC</Badge>
          <h1 style={{fontSize:30,fontWeight:900,margin:"16px 0 8px",letterSpacing:"-1px"}}>Where do you want to start?</h1>
          <p style={{color:C.dim,fontSize:14.5}}>Pick whichever fits — you can always explore more later.</p>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* I know my path */}
          <button onClick={()=>setView("pickTrade")}
            style={{textAlign:"left",background:C.surface,border:`2px solid ${C.border}`,borderRadius:16,padding:"20px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{fontSize:30,flexShrink:0}}>🎯</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:16,marginBottom:3}}>I know my path</div>
              <div style={{fontSize:13,color:C.dim,lineHeight:1.5}}>Pick your trade and go straight to your personal training plan and progress.</div>
            </div>
            <div style={{color:C.blue,fontSize:18,flexShrink:0}}>→</div>
          </button>

          {/* Already doing the work */}
          <button onClick={()=>setView("pickTrade")}
            style={{textAlign:"left",background:C.surface,border:`2px solid ${C.border}`,borderRadius:16,padding:"20px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.green} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{fontSize:30,flexShrink:0}}>📊</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:16,marginBottom:3}}>I already work in the trade — show me where I stand</div>
              <div style={{fontSize:13,color:C.dim,lineHeight:1.5}}>Compare yourself against what a Master in your craft looks like today.</div>
            </div>
            <div style={{color:C.green,fontSize:18,flexShrink:0}}>→</div>
          </button>

          {/* Discovery */}
          <button onClick={startDiscovery}
            style={{textAlign:"left",background:C.surface,border:`2px solid ${C.border}`,borderRadius:16,padding:"20px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.purple} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{fontSize:30,flexShrink:0}}>🧭</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:16,marginBottom:3}}>I'm not sure yet — help me find it</div>
              <div style={{fontSize:13,color:C.dim,lineHeight:1.5}}>A real conversation, not a test. We'll figure out where you'd genuinely thrive.</div>
            </div>
            <div style={{color:C.purple,fontSize:18,flexShrink:0}}>→</div>
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // PICK TRADE — simple trade selection grid
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="pickTrade") return (
    <div style={{...base,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
      <div style={{width:"100%",maxWidth:640}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <h2 style={{fontSize:24,fontWeight:800,marginBottom:6}}>What's your trade?</h2>
          <p style={{color:C.dim,fontSize:14}}>This sets up your path — you can explore others anytime.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
          {TRADES.map(t=>(
            <button key={t.id} onClick={()=>pickTrade(t.id)}
              style={{textAlign:"left",background:C.surface,border:`2px solid ${C.border}`,borderRadius:14,padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=t.color} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <span style={{fontSize:24,flexShrink:0}}>{t.icon}</span>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{t.label}</div>
                <div style={{fontSize:11.5,color:C.muted}}>{t.tagline}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:20}}>
          <button onClick={()=>setView("route")} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:13}}>← Back</button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // DISCOVERY — conversational trade-fit mapping. ASVAB replacement, not framed
  // as military or as a test. Passive signal detection through real conversation.
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="discovery") return (
    <div style={{...base,display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{borderBottom:`1px solid ${C.border}`,background:C.surface,padding:"14px 20px"}}>
        <button onClick={()=>setView("route")} style={{background:"transparent",border:"none",color:C.purple,cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:8}}>← Back</button>
        <div style={{fontWeight:800,fontSize:17}}>🧭 Finding Your Path</div>
        <div style={{fontSize:12.5,color:C.dim,marginTop:2}}>Just a conversation — no wrong answers, no score you'll see.</div>
        {!discoveryResult && (
          <div style={{display:"flex",gap:4,marginTop:12}}>
            {[0,1,2,3,4].map(i=>(<div key={i} style={{flex:1,height:3,borderRadius:3,background:i<discoveryDepth?C.purple:C.border}}/>))}
          </div>
        )}
      </div>

      {!discoveryResult ? (
        <>
          <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:16}}>
            {discoveryMsgs.map(msg=>{
              const isMe = msg.role==="user";
              return (
                <div key={msg.id} style={{display:"flex",gap:10,flexDirection:isMe?"row-reverse":"row",alignItems:"flex-start"}}>
                  <Avatar initials={isMe?"ME":"🧭"} color={isMe?C.blue:C.purple} size={36}/>
                  <div style={{maxWidth:"82%",background:isMe?C.blue+"14":C.surface,border:`1.5px solid ${isMe?C.blue+"55":C.border}`,borderRadius:isMe?"16px 4px 16px 16px":"4px 16px 16px 16px",padding:"12px 15px",fontSize:15.5,lineHeight:1.6,color:C.text}}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {discoverySending && (
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:C.surface,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.muted,fontSize:13}}>···</span></div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"4px 16px 16px 16px",padding:"11px 15px",fontSize:14,color:C.muted}}>{discoveryDepth>=4?"Putting your profile together...":"thinking..."}</div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px",background:C.surface}}>
            <div style={{display:"flex",gap:8}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendDiscoveryMsg(input);}}}
                placeholder="Type your answer here, or tap the mic to talk..."
                rows={2} style={{flex:1,background:C.bg,border:`1.5px solid ${input.length>5?C.purple:C.border}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:15,lineHeight:1.5,outline:"none",resize:"none",fontFamily:"inherit"}}/>
              <button onClick={voice.toggle}
                style={{background:voice.listening?`${C.red}33`:`${C.purple}15`,border:`2px solid ${voice.listening?C.red:C.purple+"55"}`,color:voice.listening?C.red:C.purple,padding:"0 16px",borderRadius:10,cursor:"pointer",fontSize:19,flexShrink:0}}>
                {voice.listening?"🔴":"🎙"}
              </button>
              <button onClick={()=>sendDiscoveryMsg(input)} disabled={!input.trim()||discoverySending}
                style={{background:input.trim()&&!discoverySending?`linear-gradient(135deg,${C.purple},${C.blue})`:C.border,border:"none",color:input.trim()&&!discoverySending?"#fff":C.muted,padding:"0 18px",borderRadius:10,cursor:input.trim()&&!discoverySending?"pointer":"not-allowed",fontSize:14,fontWeight:700,flexShrink:0}}>
                {discoverySending?"···":"Send"}
              </button>
            </div>
            {voice.listening && (
              <div style={{marginTop:8,fontSize:12,color:C.red,textAlign:"center",fontWeight:600}}>
                🔴 Listening — tap the mic again when you're done talking
              </div>
            )}
            {voice.errorMsg && (
              <div style={{marginTop:8,fontSize:12,color:C.orange,textAlign:"center"}}>
                🎙 {voice.errorMsg}
              </div>
            )}
          </div>
        </>
      ) : (
        /* RESULT */
        <div style={{flex:1,overflowY:"auto",padding:24,display:"flex",justifyContent:"center"}}>
          <div style={{width:"100%",maxWidth:520}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:40,marginBottom:10}}>✨</div>
              <Badge color={discoveryResult.confidence==="high"?C.green:discoveryResult.confidence==="moderate"?C.orange:C.muted}>
                {discoveryResult.confidence==="high"?"Strong Match":discoveryResult.confidence==="moderate"?"Good Match":"Worth Exploring"}
              </Badge>
              <h2 style={{fontSize:26,fontWeight:900,margin:"14px 0 6px"}}>{discoveryResult.primaryLabel}</h2>
            </div>

            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,marginBottom:16}}>
              <p style={{fontSize:14.5,lineHeight:1.75,color:C.text,marginBottom:18}}>{discoveryResult.reasoning}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:discoveryResult.secondaryFit?16:0}}>
                {discoveryResult.traits?.map((t,i)=>(
                  <span key={i} style={{background:`${C.purple}12`,border:`1px solid ${C.purple}33`,borderRadius:7,padding:"5px 11px",fontSize:12.5,color:C.purple,fontWeight:600}}>{t}</span>
                ))}
              </div>
              {discoveryResult.secondaryFit && (
                <div style={{fontSize:13,color:C.dim,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                  <strong style={{color:C.text}}>Also worth a look:</strong> {discoveryResult.secondaryFit}
                </div>
              )}
            </div>

            {discoveryResult.militaryNote && (
              <div style={{background:`${C.blue}0c`,border:`1px solid ${C.blue}28`,borderRadius:12,padding:"14px 16px",marginBottom:20,fontSize:13,color:C.dim,lineHeight:1.6}}>
                <span style={{color:C.blue,fontWeight:700}}>🎖 One more thing — </span>{discoveryResult.militaryNote}
              </div>
            )}

            <div style={{display:"flex",gap:10}}>
              <button onClick={acceptDiscoveryResult} style={{flex:1,background:`linear-gradient(135deg,${C.purple},${C.blue})`,border:"none",color:"#fff",padding:14,borderRadius:11,cursor:"pointer",fontSize:14.5,fontWeight:700}}>
                Start My Path →
              </button>
              <button onClick={()=>setView("pickTrade")} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.dim,padding:"14px 18px",borderRadius:11,cursor:"pointer",fontSize:13.5}}>
                Pick Different Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // MY PATH — personal home base, the default landing spot once a trade is set
  // ══════════════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════════════
  // CREDENTIAL — the official, portable record of standing. Header identity bar,
  // status card, tabbed sections (Credential / History / Trades).
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="credential") {
    const trade = TRADES.find(t=>t.id===selectedTrade) || TRADES[0];
    const tier = currentTier || TIERS[0];
    const tierProgress = currentTier ? Math.round(((cumScore||0)-currentTier.min)/(currentTier.max-currentTier.min)*100) : 0;
    const sortedLog = [...journeyLog].reverse();
    const tradesWithActivity = TRADES.filter(t=>t.id!=="general").map(t=>{
      const topicsForTrade = TOPICS.filter(x=>x.trade===t.id);
      const doneForTrade = topicsForTrade.filter(x=>completed[x.id]||completed[x.id+"_self"]).length;
      return { ...t, topicsTotal: topicsForTrade.length, topicsDone: doneForTrade };
    }).filter(t=>t.topicsTotal>0);

    return (
      <div style={{display:"flex"}}>
        <Sidebar view={view} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} filterCat={filterCat} setFilterCat={setFilterCat} completed={completed}
          onHome={()=>setView(onboardingDone?"mypath":"home")} onPickMode={(v)=>setView(v)} onBenchmarks={()=>setView("benchmarks")}
          onPickBenchmark={(bm)=>startBenchmark(bm)} onMilitary={()=>setView("military")} onEmployer={goEmployer} authed={authed} plan={plan} onAuth={()=>{setAuthMode("signup");setView("auth");}} onboardingDone={onboardingDone} onMyPath={()=>setView("mypath")} onLogout={handleLogout}/>
        <div style={{...base,flex:1,height:"100vh",overflowY:"auto"}}>

          {/* IDENTITY HEADER BAR */}
          <div style={{background:`linear-gradient(135deg,${C.blue},${C.cyan})`,padding:"24px 32px",color:"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,0.2)",border:"2px solid rgba(255,255,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900}}>ME</div>
                <div>
                  <div style={{fontSize:19,fontWeight:800}}>Worker Profile</div>
                  <div style={{fontSize:13,opacity:0.85}}>{trade.icon} {trade.label} · {plan==="paid"?"Full Access":"Free Tier"}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,opacity:0.8,marginBottom:2}}>APMAC ID</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:"monospace"}}>AP-{(journeyLog.length*317+1042).toString().padStart(6,"0")}</div>
              </div>
            </div>
          </div>

          {/* STATUS CARD */}
          <div style={{padding:"20px 32px"}}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:22,display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:`${tier.color}18`,border:`3px solid ${tier.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:tier.color,flexShrink:0}}>{tier.level}</div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Current Standing</div>
                <div style={{fontSize:20,fontWeight:900,color:tier.color}}>{tier.name}</div>
                <div style={{fontSize:12.5,color:C.dim,marginTop:2}}>{cumScore!=null ? `${cumScore}% verified competency score` : "No verification activity yet"}</div>
              </div>
              {cumScore!=null && (
                <div style={{minWidth:140}}>
                  <div style={{background:C.bg,borderRadius:4,height:7}}>
                    <div style={{background:tier.color,borderRadius:4,height:7,width:`${Math.min(tierProgress,100)}%`}}/>
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:5}}>{tierProgress}% to next tier</div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
                <Badge color={C.green} small>✓ Verified by APMAC</Badge>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{padding:"0 32px"}}>
            <div style={{display:"flex",gap:2,borderBottom:`1px solid ${C.border}`}}>
              {[
                {id:"credential",label:"Credential"},
                {id:"history",label:"History"},
                {id:"trades",label:"Trades"},
              ].map(t=>(
                <button key={t.id} onClick={()=>setCredentialTab(t.id)}
                  style={{background:credentialTab===t.id?C.surface:"transparent",border:"none",borderBottom:credentialTab===t.id?`2px solid ${C.blue}`:"2px solid transparent",color:credentialTab===t.id?C.blue:C.dim,padding:"12px 20px",cursor:"pointer",fontSize:13.5,fontWeight:700}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{maxWidth:780,padding:"24px 32px"}}>

            {/* CREDENTIAL TAB */}
            {credentialTab==="credential" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}>
                  <div style={{fontSize:12,color:C.muted,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:14}}>Tier Requirements</div>
                  {TIERS.filter(t=>t.level>0).map(t=>{
                    const achieved = tier.level >= t.level;
                    return (
                      <div key={t.level} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:t.level<4?`1px solid ${C.border}`:"none"}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:achieved?`${t.color}22`:C.bg,border:`2px solid ${achieved?t.color:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:achieved?t.color:C.muted}}>{achieved?"✓":t.level}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13.5,fontWeight:700,color:achieved?C.text:C.muted}}>{t.name}</div>
                          <div style={{fontSize:11.5,color:C.muted}}>{t.min}–{t.max}% verified score</div>
                        </div>
                        {achieved && <Badge color={t.color} small>Achieved</Badge>}
                      </div>
                    );
                  })}
                </div>
                <div style={{background:`${C.blue}08`,border:`1px solid ${C.blue}28`,borderRadius:12,padding:"16px 18px",fontSize:13,color:C.dim,lineHeight:1.6}}>
                  This credential is built from continuous, verified conversation — not a single test. It updates as you complete more discussions, self-study, and benchmarks.
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {credentialTab==="history" && (
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}>
                <div style={{fontSize:12,color:C.muted,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:14}}>Full Activity Log</div>
                {sortedLog.length===0 ? (
                  <div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontSize:13.5}}>No activity yet — your first session will appear here.</div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {sortedLog.map((entry,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:12,paddingBottom:10,borderBottom:i<sortedLog.length-1?`1px solid ${C.border}`:"none"}}>
                        <div style={{width:34,height:34,borderRadius:9,background:`${trade.color}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                          {entry.type==="Discovery"?"🧭":entry.type==="Self-Study"?"🎯":entry.type==="Classification"?"🎖":"💬"}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13.5,fontWeight:600,color:C.text}}>{entry.label}</div>
                          <div style={{fontSize:11.5,color:C.muted}}>{entry.type} · {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                        {entry.score!=null && <div style={{fontWeight:800,fontSize:15,color:trade.color}}>{entry.score}%</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TRADES TAB */}
            {credentialTab==="trades" && (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {tradesWithActivity.length===0 ? (
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:30,textAlign:"center",color:C.muted,fontSize:13.5}}>
                    No trade activity recorded yet.
                  </div>
                ) : tradesWithActivity.map(t=>(
                  <div key={t.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,display:"flex",alignItems:"center",gap:16}}>
                    <span style={{fontSize:24}}>{t.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14.5}}>{t.label}</div>
                      <div style={{fontSize:12,color:C.muted}}>{t.topicsDone} of {t.topicsTotal} topics completed</div>
                    </div>
                    <div style={{width:80}}>
                      <div style={{background:C.bg,borderRadius:4,height:6}}>
                        <div style={{background:t.color,borderRadius:4,height:6,width:`${Math.round((t.topicsDone/t.topicsTotal)*100)}%`}}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view==="mypath") {
    const trade = TRADES.find(t=>t.id===selectedTrade) || TRADES[0];
    const tradeTopics = selectedTrade==="general"
      ? TOPICS.filter(t=>t.tier===1).slice(0,8) // curated cross-trade sample for exploration, not a content dump
      : TOPICS.filter(t=>t.trade===selectedTrade);
    const tradeCats = [...new Set(tradeTopics.map(t=>t.cat))].map(id=>CATEGORIES.find(c=>c.id===id)).filter(Boolean);
    const tradeCompleted = Object.keys(completed).filter(k=>tradeTopics.some(t=>k.startsWith(t.id)));
    const nextTopic = tradeTopics.find(t=>!completed[t.id] && !completed[t.id+"_self"]) || tradeTopics[0];
    const tierProgress = currentTier ? Math.round(((cumScore||0)-currentTier.min)/(currentTier.max-currentTier.min)*100) : 0;
    const recentLog = [...journeyLog].reverse().slice(0,6);

    return (
      <div style={{display:"flex"}}>
        <Sidebar view={view} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} filterCat={filterCat} setFilterCat={setFilterCat} completed={completed}
          onHome={()=>setView("mypath")} onPickMode={(v)=>setView(v)} onBenchmarks={()=>setView("benchmarks")}
          onPickBenchmark={(bm)=>startBenchmark(bm)} onMilitary={()=>setView("military")} onEmployer={goEmployer} authed={authed} plan={plan} onAuth={()=>{setAuthMode("signup");setView("auth");}} onboardingDone={onboardingDone} onMyPath={()=>setView("mypath")} onLogout={handleLogout}/>
        <div style={{...base,flex:1,height:"100vh",overflowY:"auto"}}>

          {/* HEADER */}
          <div style={{padding:"22px 32px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:26}}>{trade.icon}</span>
              <div>
                <div style={{fontWeight:800,fontSize:19}}>My Path — {trade.label}</div>
                <button onClick={()=>setView("pickTrade")} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",padding:0}}>Switch trade</button>
              </div>
            </div>
            <Badge color={(currentTier||TIERS[0]).color}>{(currentTier||TIERS[0]).name}</Badge>
          </div>

          <div style={{maxWidth:780,padding:"24px 32px"}}>

            {/* PROGRESS CARD */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                <div>
                  <div style={{fontSize:12,color:C.muted,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:4}}>Current Tier</div>
                  <div style={{fontSize:22,fontWeight:900,color:(currentTier||TIERS[0]).color}}>{(currentTier||TIERS[0]).name}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,color:C.muted,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:4}}>Score</div>
                  <div style={{fontSize:22,fontWeight:900,color:C.text}}>{cumScore ?? "—"}{cumScore!=null?"%":""}</div>
                </div>
              </div>
              {cumScore!=null && (
                <div style={{marginBottom:6}}>
                  <div style={{background:C.bg,borderRadius:4,height:8}}>
                    <div style={{background:`linear-gradient(90deg,${(currentTier||TIERS[0]).color},${C.cyan})`,borderRadius:4,height:8,width:`${Math.min(tierProgress,100)}%`,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{fontSize:11.5,color:C.muted,marginTop:5}}>{tierProgress}% toward next tier</div>
                </div>
              )}
              <div style={{display:"flex",gap:20,marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                <div><div style={{fontSize:11,color:C.muted}}>Topics Completed</div><div style={{fontWeight:800,fontSize:16}}>{tradeCompleted.length} / {tradeTopics.length}</div></div>
                <div><div style={{fontSize:11,color:C.muted}}>Sessions Logged</div><div style={{fontWeight:800,fontSize:16}}>{journeyLog.length}</div></div>
              </div>
            </div>

            {/* RECOMMENDED NEXT */}
            {nextTopic && (
              <div style={{background:`linear-gradient(135deg,${trade.color}10,${C.cyan}08)`,border:`1.5px solid ${trade.color}33`,borderRadius:16,padding:22,marginBottom:20}}>
                <div style={{fontSize:11.5,color:trade.color,fontWeight:800,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>🎯 Recommended Next</div>
                <div style={{fontWeight:800,fontSize:17,marginBottom:6}}>{nextTopic.title}</div>
                <p style={{fontSize:13.5,color:C.dim,lineHeight:1.6,marginBottom:16}}>{nextTopic.scenario.substring(0,140)}...</p>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>startDiscussion(nextTopic,"discuss")} style={{background:trade.color,border:"none",color:"#fff",padding:"10px 18px",borderRadius:9,cursor:"pointer",fontSize:13.5,fontWeight:700}}>💬 Start Discussion</button>
                  <button onClick={()=>startDiscussion(nextTopic,"self")} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,padding:"10px 18px",borderRadius:9,cursor:"pointer",fontSize:13.5,fontWeight:600}}>🎯 Self-Study Instead</button>
                </div>
              </div>
            )}

            {/* CATEGORIES FOR THIS TRADE */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:800,color:C.dim,letterSpacing:0.5,textTransform:"uppercase",marginBottom:12}}>Your Training Areas</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {tradeCats.map(cat=>(
                  <button key={cat.id} onClick={()=>{setFilterCat(cat.id);setView("catalog");}}
                    style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 14px",cursor:"pointer",fontSize:12.5,fontWeight:600,color:C.dim,display:"flex",alignItems:"center",gap:6}}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* JOURNEY LOG */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <div style={{fontSize:13,fontWeight:800,color:C.dim,letterSpacing:0.5,textTransform:"uppercase",marginBottom:14}}>Your Journey</div>
              {recentLog.length===0 ? (
                <div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:13.5}}>Nothing logged yet — your first session starts your journey here.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {recentLog.map((entry,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:12,paddingBottom:10,borderBottom:i<recentLog.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{width:34,height:34,borderRadius:9,background:`${trade.color}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                        {entry.type==="Discovery"?"🧭":entry.type==="Self-Study"?"🎯":entry.type==="Classification"?"🎖":"💬"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13.5,fontWeight:600,color:C.text}}>{entry.label}</div>
                        <div style={{fontSize:11.5,color:C.muted}}>{entry.type} · {new Date(entry.date).toLocaleDateString()}</div>
                      </div>
                      {entry.score!=null && <div style={{fontWeight:800,fontSize:15,color:trade.color}}>{entry.score}%</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PAYWALL — shown when a free-tier user has used their one free topic
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="paywall") return (
    <div style={{...base,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
      <div style={{width:"100%",maxWidth:460,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:14}}>🔒</div>
        <h2 style={{fontSize:24,fontWeight:800,marginBottom:8}}>You've used your free discussion</h2>
        <p style={{color:C.dim,fontSize:14,lineHeight:1.7,marginBottom:28}}>
          {pendingTopic ? <>You tried to start <strong style={{color:C.text}}>{pendingTopic.topic.title}</strong>. </> : null}
          Upgrade to unlock all 30 discussion topics, every category, self-directed learning, and full voice input across the platform.
        </p>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:26,marginBottom:18,textAlign:"left"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:16}}>Full Access</div>
            <div><span style={{fontSize:24,fontWeight:900,color:C.blue}}>$29</span><span style={{fontSize:13,color:C.muted}}>/mo</span></div>
          </div>
          {["All 30 discussion topics, every category","Self-directed learning, unlimited depth","Voice input everywhere — type or talk","Full APMAC tier profile + benchmark tracking","Portable score visible to employers"].map(f=>(
            <div key={f} style={{display:"flex",gap:8,marginBottom:9,fontSize:13.5,color:C.dim}}><span style={{color:C.green}}>✓</span>{f}</div>
          ))}
          <button onClick={async ()=>{
              if (userId) { await supabase.from("profiles").update({ plan: "paid" }).eq("id", userId); }
              setPlan("paid");
              setView(pendingTopic ? "catalog" : (onboardingDone ? "mypath" : "route"));
              if (pendingTopic) { const {topic,m}=pendingTopic; setPendingTopic(null); setTimeout(()=>startDiscussion(topic,m),50); }
            }} style={{width:"100%",background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",padding:"13px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,marginTop:18}}>
            Upgrade Now
          </button>
          <div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:10}}>Payment processing not yet connected — this unlocks your account without charging a card.</div>
        </div>
        <button onClick={()=>setView("catalog")} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:13}}>← Back to free content</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // EMPLOYER AUTH — separate gate, never reachable from worker session
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="employer-auth") return (
    <div style={{...base,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{display:"flex",alignItems:"center",gap:9,justifyContent:"center",marginBottom:10}}>
          <div style={{width:26,height:26,background:C.blue,borderRadius:6}}/>
          <span style={{fontSize:19,fontWeight:900}}>APMAC<span style={{color:C.blue,fontWeight:400}}>™</span> <span style={{color:C.dim,fontWeight:600,fontSize:14}}>for Business</span></span>
        </div>
        <p style={{textAlign:"center",color:C.dim,fontSize:13,marginBottom:24}}>Employer accounts are separate from worker accounts and require organization verification.</p>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:700,color:C.dim,display:"block",marginBottom:5}}>Work Email</label>
            <input type="email" placeholder="you@company.com" style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,color:C.text,outline:"none"}}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:700,color:C.dim,display:"block",marginBottom:5}}>Organization</label>
            <input type="text" placeholder="Company or unit name" style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,color:C.text,outline:"none"}}/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{fontSize:12,fontWeight:700,color:C.dim,display:"block",marginBottom:5}}>Password</label>
            <input type="password" placeholder="••••••••" style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,color:C.text,outline:"none"}}/>
          </div>
          <button onClick={mockEmployerLogin} style={{width:"100%",background:C.blue,border:"none",color:"#fff",padding:"13px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,marginBottom:10}}>
            Access Employer Portal
          </button>
          <div style={{textAlign:"center",fontSize:11.5,color:C.muted}}>Demo mode — any credentials work · No real account created</div>
        </div>
        <div style={{textAlign:"center",marginTop:16}}>
          <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:13}}>← Back to home</button>
        </div>
      </div>
    </div>
  );

  // ── Loading screen while checking for an existing session on first load ─────
  if (authLoading) return (
    <div style={{...base,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:32,height:32,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,borderRadius:8,margin:"0 auto 14px"}}/>
        <div style={{color:C.muted,fontSize:13}}>Loading APMAC...</div>
      </div>
    </div>
  );

  if (view==="home") return (
    <div style={base}>
      {/* TOP NAV */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 32px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,borderRadius:7}}/>
          <span style={{fontSize:19,fontWeight:900,letterSpacing:"-0.5px"}}>APMAC<span style={{color:C.blue,fontWeight:400}}>™</span></span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {authed ? (
            <button onClick={()=>setView(onboardingDone?"mypath":"route")} style={{background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",padding:"9px 18px",borderRadius:8,cursor:"pointer",fontSize:13.5,fontWeight:700}}>Go to My Path →</button>
          ) : (
            <>
              <button onClick={()=>{setAuthMode("login");setView("auth");}} style={{background:"transparent",border:"none",color:C.dim,padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:13.5,fontWeight:600}}>Log In</button>
              <button onClick={()=>{setAuthMode("signup");setView("auth");}} style={{background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",padding:"9px 18px",borderRadius:8,cursor:"pointer",fontSize:13.5,fontWeight:700}}>Sign Up Free</button>
            </>
          )}
        </div>
      </div>

      {/* HERO */}
      <div style={{maxWidth:800,margin:"0 auto",padding:"64px 28px 48px",textAlign:"center"}}>
        <Badge color={C.blue}>Adaptive Profiling of Mastery and Competency · by MATCEDI™</Badge>
        <h1 style={{fontSize:46,fontWeight:900,lineHeight:1.05,letterSpacing:"-2px",margin:"20px 0 16px"}}>
          Craftsmanship deserves<br/>
          <span style={{background:`linear-gradient(90deg,${C.blue},${C.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>more than a credential.</span>
        </h1>
        <p style={{fontSize:17,color:C.dim,lineHeight:1.75,maxWidth:540,margin:"0 auto 32px"}}>
          Licenses prove you passed a test once. APMAC proves what you actually know — right now, continuously, through how you think and talk about your craft.
        </p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:28,fontSize:12.5,color:C.dim}}>
          <span>🎙</span><span>Type or talk — voice works everywhere, every time</span>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>{setAuthMode("signup");setView("auth");}} style={{background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",padding:"13px 28px",borderRadius:9,cursor:"pointer",fontSize:14.5,fontWeight:700}}>Get Started Free</button>
          <button onClick={()=>goEmployer()} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,padding:"13px 28px",borderRadius:9,cursor:"pointer",fontSize:14.5}}>👔 For Employers</button>
        </div>
      </div>

      {/* WHY — MATCEDI's mission, stated plainly */}
      <div style={{background:C.raised,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"48px 28px"}}>
        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center"}}>
          <p style={{fontSize:11,color:C.blue,letterSpacing:2,textTransform:"uppercase",fontWeight:800,marginBottom:14}}>Why We Exist</p>
          <h2 style={{fontSize:26,fontWeight:900,lineHeight:1.3,marginBottom:16,color:C.text}}>
            We believe craftsmanship is one of humanity's greatest forces for progress.
          </h2>
          <p style={{fontSize:15,color:C.dim,lineHeight:1.8,maxWidth:560,margin:"0 auto"}}>
            Whether it's a skilled trade, technical expertise, leadership, or problem-solving — craftsmanship is the pursuit of excellence and pride in your work. It deserves recognition regardless of your title, your degree, or the industry you practice it in. That's what we're here to champion.
          </p>
          <p style={{fontSize:13,color:C.muted,marginTop:18,fontWeight:600}}>— MATCEDI™</p>
        </div>
      </div>

      {/* WHAT IT DOES */}
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 28px 56px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {[
            {icon:"💬",label:"Guided Discussions",desc:"Real scenarios, scored live as you talk through them — not multiple choice"},
            {icon:"🎯",label:"Self-Directed Learning",desc:"An AI tutor that adapts to your trade and builds your own training plan"},
            {icon:"🧭",label:"Find Your Path",desc:"Not sure what trade fits you? A real conversation maps it — not a test"},
          ].map(item=>(
            <div key={item.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 16px"}}>
              <div style={{fontSize:26,marginBottom:10}}>{item.icon}</div>
              <div style={{fontWeight:700,fontSize:14.5,marginBottom:5}}>{item.label}</div>
              <div style={{fontSize:12.5,color:C.dim,lineHeight:1.5}}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TIER SYSTEM */}
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 28px 56px"}}>
        <p style={{textAlign:"center",color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginBottom:18}}>The Standard Everyone Measures Against</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {TIERS.filter(t=>t.level>0).map(t=>(
            <div key={t.level} style={{background:C.surface,border:`1px solid ${t.color}22`,borderRadius:10,padding:18,textAlign:"center"}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:`${t.color}22`,border:`2px solid ${t.color}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:15,fontWeight:900,color:t.color}}>{t.level}</div>
              <div style={{fontWeight:700,fontSize:13}}>{t.name}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{t.min}–{t.max}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* TRADES SUPPORTED */}
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 28px 56px"}}>
        <p style={{textAlign:"center",color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginBottom:18}}>Built For Every Craft</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {TRADES.filter(t=>t.id!=="general").map(t=>(
            <div key={t.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:600,color:C.dim,display:"flex",alignItems:"center",gap:7}}>
              <span>{t.icon}</span>{t.label}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{maxWidth:600,margin:"0 auto",padding:"0 28px 64px",textAlign:"center"}}>
        <div style={{background:`linear-gradient(135deg,${C.blue}0a,${C.cyan}0a)`,border:`1px solid ${C.border}`,borderRadius:18,padding:"32px 28px"}}>
          <div style={{fontWeight:800,fontSize:19,marginBottom:8}}>Your first discussion is free.</div>
          <p style={{fontSize:13.5,color:C.dim,marginBottom:18}}>No credit card. See your first verified score in minutes.</p>
          <button onClick={()=>{setAuthMode("signup");setView("auth");}} style={{background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",padding:"12px 28px",borderRadius:9,cursor:"pointer",fontSize:14,fontWeight:700}}>Sign Up Free</button>
        </div>
      </div>

      <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <span style={{color:C.muted,fontSize:12}}>© 2026 MATCEDI, LLC — APMAC Platform</span>
        <span style={{color:C.muted,fontSize:11.5,fontStyle:"italic"}}>Championing the prestige of craftsmanship</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // CATALOG
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="catalog") return (
    <div style={{display:"flex"}}>
      <Sidebar view={view} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} filterCat={filterCat} setFilterCat={setFilterCat} completed={completed}
        onHome={()=>setView(onboardingDone?"mypath":"home")} onPickMode={(v)=>setView(v)} onBenchmarks={()=>setView("benchmarks")}
        onPickBenchmark={(bm)=>startBenchmark(bm)} onMilitary={()=>setView("military")} onEmployer={goEmployer} authed={authed} plan={plan} onAuth={()=>{setAuthMode("signup");setView("auth");}} onboardingDone={onboardingDone} onMyPath={()=>setView("mypath")} onLogout={handleLogout}/>
      <div style={{...base,flex:1,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"20px 32px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{fontSize:21,fontWeight:800,marginBottom:3}}>{filterCat==="all"?"All Discussions":CATEGORIES.find(c=>c.id===filterCat)?.label}</h2>
            <p style={{color:C.dim,fontSize:13}}>{filteredTopics.length} topics · Scored passively through real conversation</p>
          </div>
          <Badge color={C.orange}>TIER 1 — APPRENTICE</Badge>
        </div>

        <div style={{maxWidth:760,padding:"24px 32px"}}>
          {/* TOPIC LIST */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filteredTopics.map(topic=>{
              const cat = CATEGORIES.find(c=>c.id===topic.cat);
              const doneD = completed[topic.id];
              const doneS = completed[topic.id+"_self"];
              const locked = !authed || (plan==="free" && freeUsed);
              return (
                <div key={topic.id} style={{background:C.surface,border:`1px solid ${doneD||doneS?C.green+"33":C.border}`,borderRadius:12,padding:20,opacity:locked?0.72:1}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                    <span style={{fontSize:20,flexShrink:0}}>{cat?.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:15}}>{doneD||doneS?"✓ ":""}{topic.title}</span>
                        <Badge color={cat?.color||C.blue} small>{cat?.label}</Badge>
                        {doneD && <Badge color={C.green} small>Guided {doneD}%</Badge>}
                        {doneS && <Badge color={C.cyan} small>Self {doneS}%</Badge>}
                        {locked && <Badge color={C.orange} small>🔒 {!authed?"Sign in":"Upgrade"}</Badge>}
                      </div>
                      <p style={{fontSize:13,color:C.dim,marginBottom:10,lineHeight:1.6}}>{topic.scenario.substring(0,120)}...</p>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {topic.keySkills.map(s=><span key={s} style={{fontSize:11,color:C.muted,background:C.bg,borderRadius:4,padding:"2px 7px",border:`1px solid ${C.border}`}}>{s}</span>)}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                      <button onClick={()=>startDiscussion(topic,"discuss")} style={{background:`${C.blue}22`,border:`1px solid ${C.blue}55`,color:C.blue,padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{locked?"🔒 ":"💬 "}Discuss</button>
                      <button onClick={()=>startDiscussion(topic,"self")} style={{background:`${C.cyan}22`,border:`1px solid ${C.cyan}55`,color:C.cyan,padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{locked?"🔒 ":"🎯 "}Self-Study</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // DISCUSSION / SELF-STUDY / MILITARY
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="discuss" && activeTopic) {
    const modeColor = mode==="self"?C.cyan:mode==="military"?C.purple:C.blue;
    const modeLabel = mode==="self"?"Self-Study":mode==="military"?"Military Classification":"Guided Discussion";
    const closed = sessionState==="closed";
    return (
      <div style={{display:"flex"}}>
        <Sidebar view={view} activeTopicId={activeTopic.id} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} filterCat={filterCat} setFilterCat={setFilterCat} completed={completed}
          onHome={()=>setView(onboardingDone?"mypath":"home")} onPickMode={(v)=>setView(v)} onBenchmarks={()=>setView("benchmarks")}
          onPickBenchmark={(bm)=>startBenchmark(bm)} onMilitary={()=>setView("military")} onEmployer={goEmployer} authed={authed} plan={plan} onAuth={()=>{setAuthMode("signup");setView("auth");}} onboardingDone={onboardingDone} onMyPath={()=>setView("mypath")} onLogout={handleLogout}/>
      <div style={{...base,flex:1,display:"flex",flexDirection:"column",height:"100vh"}}>
        {/* NAV — stacked and larger for mobile legibility */}
        <div style={{borderBottom:`1px solid ${C.border}`,background:C.surface}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 8px"}}>
            <button onClick={()=>setView(mode==="military"?"military":"catalog")} style={{background:"transparent",border:"none",color:modeColor,cursor:"pointer",fontSize:14,fontWeight:600,padding:"4px 0"}}>← Back</button>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:closed?C.muted:C.green,boxShadow:closed?"none":`0 0 6px ${C.green}`}}/>
              <span style={{fontSize:11,fontWeight:700,color:closed?C.muted:C.green,letterSpacing:0.5}}>{closed?"SESSION CLOSED":"SESSION ACTIVE"}</span>
            </div>
          </div>
          <div style={{padding:"0 16px 12px"}}>
            <div style={{fontWeight:800,fontSize:17,lineHeight:1.3,marginBottom:6}}>{activeTopic.title}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <Badge color={modeColor} small>{modeLabel}</Badge>
              {cumScore!==null && <Badge color={currentTier?.color||C.muted} small>{currentTier?.name} · {cumScore}%</Badge>}
            </div>
          </div>
          {/* Action row — big enough to tap cleanly on a phone */}
          <div style={{display:"flex",gap:8,padding:"0 16px 12px"}}>
            <button onClick={()=>tts.speaking?tts.stop():tts.speak(activeTopic.scenario)}
              style={{flex:1,background:tts.speaking?`${C.orange}15`:C.bg,border:`1px solid ${tts.speaking?C.orange:C.border}`,color:tts.speaking?C.orange:C.dim,padding:"9px 0",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>
              {tts.speaking?"⏹ Stop":"🔊 Listen to scenario"}
            </button>
            {!closed && (
              <button onClick={endSession}
                style={{flex:1,background:C.bg,border:`1px solid ${C.red}44`,color:C.red,padding:"9px 0",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>
                End Session
              </button>
            )}
          </div>
        </div>

        {/* SCENARIO */}
        <div style={{background:C.raised,borderBottom:`1px solid ${C.border}`,padding:"10px 16px"}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:0.5,marginBottom:2,textTransform:"uppercase"}}>🚪 In the Room</div>
          <div style={{fontSize:13.5,color:C.text,lineHeight:1.55}}>{activeTopic.scenario}</div>
        </div>

        {/* MESSAGES — one continuous rolling thread, like a real conversation */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 16px",display:"flex",flexDirection:"column",gap:4,WebkitOverflowScrolling:"touch"}}>
          {messages.map((msg,i)=>{
            const isMe = msg.role==="worker";
            const bubbleColor = msg.role==="tutor"?C.cyan:isMe?C.blue:msg.color;
            const prevMsg = messages[i-1];
            const sameSpeakerAsPrev = prevMsg && prevMsg.user===msg.user;
            return (
              <div key={msg.id} style={{display:"flex",gap:10,flexDirection:isMe?"row-reverse":"row",alignItems:"flex-start",marginTop:sameSpeakerAsPrev?2:16}}>
                {sameSpeakerAsPrev ? <div style={{width:36,flexShrink:0}}/> : <Avatar initials={msg.avatar} color={bubbleColor} size={36}/>}
                <div style={{maxWidth:"82%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
                  {!sameSpeakerAsPrev && (
                    <div style={{display:"flex",gap:7,alignItems:"baseline",marginBottom:4,flexDirection:isMe?"row-reverse":"row"}}>
                      <span style={{fontSize:13.5,fontWeight:800,color:bubbleColor}}>{msg.user}</span>
                      {msg.role && msg.role!=="worker" && <span style={{fontSize:10.5,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.3}}>{msg.role}</span>}
                    </div>
                  )}
                  <div style={{background:isMe?modeColor+"14":C.surface,border:`1.5px solid ${isMe?modeColor+"55":C.border}`,borderRadius:isMe?"16px 4px 16px 16px":"4px 16px 16px 16px",padding:"12px 15px",fontSize:15.5,lineHeight:1.6,color:C.text,boxShadow:"0 1px 3px rgba(20,30,60,0.05)"}}>
                    {msg.text}
                    {msg.scoring && <span style={{color:C.muted,fontSize:12,marginLeft:8,fontStyle:"italic"}}>analyzing...</span>}
                  </div>
                  {isMe && msg.score && !msg.scoring && (
                    <div style={{marginTop:5}}><SignalDot signal={msg.score.signal}/></div>
                  )}
                  {msg.score?.flag && <div style={{marginTop:5,fontSize:12,color:C.red,fontWeight:700}}>⚠ Flagged for review</div>}
                </div>
              </div>
            );
          })}
          {sending && (
            <div style={{display:"flex",gap:10,alignItems:"center",marginTop:16}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:C.surface,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.muted,fontSize:13}}>···</span></div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"4px 16px 16px 16px",padding:"11px 15px",fontSize:14,color:C.muted}}>responding...</div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* CLOSED STATE */}
        {closed ? (
          <div style={{borderTop:`1px solid ${C.border}`,padding:"20px 16px",background:C.surface,textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Session closed</div>
            <div style={{fontSize:13,color:C.dim,marginBottom:14}}>
              {scores.length>0 ? `${scores.length} contributions scored · Final tier: ${currentTier?.name} (${cumScore}%)` : "No contributions were scored this session."}
            </div>
            <button onClick={()=>setView("catalog")} style={{background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",padding:"12px 28px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700}}>
              Back to Discussions
            </button>
          </div>
        ) : (
          /* INPUT */
          <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px",background:C.surface}}>
            {scores.length>0 && (
              <div style={{display:"flex",gap:12,marginBottom:10,padding:"9px 12px",background:C.bg,borderRadius:9,border:`1px solid ${C.border}`,alignItems:"center",flexWrap:"wrap"}}>
                <div><div style={{fontSize:10,color:C.muted}}>Contributions</div><div style={{fontWeight:800,fontSize:14}}>{scores.length}</div></div>
                <div style={{width:1,background:C.border,height:24}}/>
                <div><div style={{fontSize:10,color:C.muted}}>Score</div><div style={{fontWeight:800,fontSize:14,color:currentTier?.color}}>{cumScore}%</div></div>
                <div style={{width:1,background:C.border,height:24}}/>
                <div><div style={{fontSize:10,color:C.muted}}>Tier</div><div style={{fontWeight:700,fontSize:12,color:currentTier?.color}}>{currentTier?.name}</div></div>
                <div style={{marginLeft:"auto"}}><SignalDot signal={scores[scores.length-1]?.signal}/></div>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
                placeholder={mode==="military"?"Type or tap 🎙 to talk — think out loud, no wrong answers...":mode==="self"?"Type or tap 🎙 to talk — explain your understanding...":"Type or tap 🎙 to talk — add to the discussion..."}
                rows={2} style={{flex:1,background:C.bg,border:`1.5px solid ${input.length>10?modeColor:C.border}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:15,lineHeight:1.5,outline:"none",resize:"none",fontFamily:"inherit",transition:"border 0.2s"}}/>
              <button onClick={voice.toggle}
                title="Tap to speak"
                style={{background:voice.listening?`${C.red}33`:`${modeColor}15`,border:`2px solid ${voice.listening?C.red:modeColor+"55"}`,color:voice.listening?C.red:modeColor,padding:"0 16px",borderRadius:10,cursor:"pointer",fontSize:19,flexShrink:0,transition:"all 0.15s"}}>
                {voice.listening?"🔴":"🎙"}
              </button>
              <button onClick={handleSend} disabled={!input.trim()||sending}
                style={{background:input.trim()&&!sending?`linear-gradient(135deg,${modeColor},${modeColor===C.blue?C.cyan:C.purple})`:C.border,border:"none",color:input.trim()&&!sending?"#fff":C.muted,padding:"0 18px",borderRadius:10,cursor:input.trim()&&!sending?"pointer":"not-allowed",fontSize:14,fontWeight:700,flexShrink:0}}>
                {sending?"···":"Send"}
              </button>
            </div>
            <div style={{fontSize:11,color:voice.listening?C.red:voice.errorMsg?C.orange:C.muted,marginTop:7,textAlign:"center",fontWeight:voice.listening?600:400}}>
              {voice.listening ? "🔴 Listening — tap the mic again when you're done" : voice.errorMsg ? `🎙 ${voice.errorMsg}` : "Type your answer, or tap 🎙 to speak it instead"}
            </div>
          </div>
        )}
      </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // BENCHMARKS
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="benchmarks") return (
    <div style={{display:"flex"}}>
      <Sidebar view={view} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} filterCat={filterCat} setFilterCat={setFilterCat} completed={completed}
        onHome={()=>setView(onboardingDone?"mypath":"home")} onPickMode={(v)=>setView(v)} onBenchmarks={()=>setView("benchmarks")}
        onPickBenchmark={(bm)=>startBenchmark(bm)} onMilitary={()=>setView("military")} onEmployer={goEmployer} authed={authed} plan={plan} onAuth={()=>{setAuthMode("signup");setView("auth");}} onboardingDone={onboardingDone} onMyPath={()=>setView("mypath")} onLogout={handleLogout}/>
      <div style={{...base,flex:1,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"20px 32px",borderBottom:`1px solid ${C.border}`}}>
          <h2 style={{fontSize:21,fontWeight:800,marginBottom:3}}>Official Benchmark Standards</h2>
          <p style={{color:C.dim,fontSize:13}}>Your benchmark score is the floor. APMAC tier is what you build above it.</p>
        </div>
        <div style={{maxWidth:680,padding:"24px 32px"}}>
          <div style={{background:`${C.orange}11`,border:`1px solid ${C.orange}33`,borderRadius:10,padding:"12px 16px",marginBottom:24,fontSize:13,color:C.dim}}>
            <strong style={{color:C.orange}}>How benchmarks work:</strong> Official tests verify you meet minimum licensing standards. APMAC discussions verify you actually understand the craft. Employers see both — the license and the real competency built on top of it.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {BENCHMARKS.map(bm=>(
              <div key={bm.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20,display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:48,height:48,borderRadius:10,background:`${bm.color}22`,border:`1px solid ${bm.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:bm.color,flexShrink:0}}>{bm.body}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{bm.label}</div>
                  <div style={{fontSize:13,color:C.dim}}>Pass threshold: {bm.passScore}% · {bm.categories.length} skill categories</div>
                </div>
                <button onClick={()=>startBenchmark(bm)} style={{background:`${bm.color}22`,border:`1px solid ${bm.color}55`,color:bm.color,padding:"9px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0}}>Take Test →</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,fontSize:13,color:C.dim}}>
            <div style={{fontWeight:700,color:C.text,marginBottom:6}}>Coming soon: API Integration</div>
            Upload your own benchmark content or connect directly to official testing body APIs. Your organization's internal standards can also be imported as custom benchmarks.
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // BENCHMARK TEST
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="benchmark" && selBenchmark) {
    if (bmComplete) {
      const passed = bmAvgScore >= selBenchmark.passScore;
      return (
        <div style={base}>
          <div style={nav}>
            <button onClick={()=>setView("benchmarks")} style={{background:"transparent",border:"none",color:C.blue,cursor:"pointer",fontSize:13}}>← Benchmarks</button>
            <span style={{color:C.muted,fontSize:13}}>{selBenchmark.label}</span>
          </div>
          <div style={{maxWidth:640,margin:"0 auto",padding:"36px 28px",textAlign:"center"}}>
            <div style={{fontSize:56,fontWeight:900,color:passed?C.green:C.red,marginBottom:8}}>{bmAvgScore}%</div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{passed?"Benchmark Passed":"Below Pass Threshold"}</div>
            <Badge color={selBenchmark.color}>{selBenchmark.label}</Badge>
            <p style={{color:C.dim,fontSize:14,margin:"16px 0 24px",lineHeight:1.7}}>
              {passed
                ? `This benchmark score has been added to your profile as a verified baseline. Now build your APMAC tier above it through guided discussions and self-directed learning.`
                : `Your benchmark score is below the ${selBenchmark.passScore}% pass threshold. Use APMAC self-directed learning to strengthen these areas and retake when ready.`}
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {bmResults.map((r,i)=>(
                <div key={i} style={{background:C.surface,border:`1px solid ${r.correct?C.green+"44":C.red+"44"}`,borderRadius:10,padding:"12px 16px",textAlign:"left"}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Q{i+1}: {r.question.substring(0,80)}...</div>
                  <div style={{fontSize:13,color:C.dim,marginBottom:6,fontStyle:"italic"}}>"{r.answer.substring(0,100)}{r.answer.length>100?"...":""}"</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:C.dim}}>{r.feedback}</span>
                    <span style={{fontWeight:800,fontSize:16,color:r.score>=70?C.green:C.red}}>{r.score}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setView("catalog")} style={{background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",padding:"12px 22px",borderRadius:9,cursor:"pointer",fontSize:14,fontWeight:700}}>Build Skill Above Baseline</button>
              <button onClick={()=>startBenchmark(selBenchmark)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.dim,padding:"12px 22px",borderRadius:9,cursor:"pointer",fontSize:13}}>Retake</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={base}>
        <div style={nav}>
          <button onClick={()=>setView("benchmarks")} style={{background:"transparent",border:"none",color:C.blue,cursor:"pointer",fontSize:13}}>← Benchmarks</button>
          <span style={{color:C.muted,fontSize:13}}>{selBenchmark.label}</span>
          <span style={{color:C.dim,fontSize:13}}>{bmIdx+1} / {bmQuestions.length}</span>
        </div>
        <div style={{maxWidth:660,margin:"0 auto",padding:"32px 28px"}}>
          <div style={{display:"flex",gap:4,marginBottom:24}}>
            {bmQuestions.map((_,i)=>(
              <div key={i} style={{flex:1,height:4,borderRadius:3,background:i<bmIdx?C.green:i===bmIdx?selBenchmark.color:C.border}}/>
            ))}
          </div>
          <Badge color={selBenchmark.color}>{selBenchmark.body} Benchmark</Badge>
          <p style={{fontSize:16,lineHeight:1.7,margin:"16px 0 20px",color:C.text}}>{bmQuestions[bmIdx]}</p>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Type or tap 🎙 to talk — be specific and technical."
            rows={5} style={{width:"100%",background:C.surface,border:`1px solid ${input.length>15?selBenchmark.color:C.border}`,borderRadius:10,padding:"13px 16px",color:C.text,fontSize:14,lineHeight:1.6,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
          {(voice.listening || voice.errorMsg) && (
            <div style={{fontSize:11,color:voice.listening?C.red:C.orange,marginTop:6,fontWeight:voice.listening?600:400}}>
              {voice.listening ? "🔴 Listening — tap the mic again when you're done" : `🎙 ${voice.errorMsg}`}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,gap:10}}>
            <span style={{fontSize:12,color:C.muted}}>{input.trim().split(/\s+/).filter(Boolean).length} words</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={voice.toggle}
                title="Tap to speak"
                style={{background:voice.listening?`${C.red}33`:`${selBenchmark.color}15`,border:`2px solid ${voice.listening?C.red:selBenchmark.color+"55"}`,color:voice.listening?C.red:selBenchmark.color,padding:"0 14px",borderRadius:9,cursor:"pointer",fontSize:17,flexShrink:0}}>
                {voice.listening?"🔴":"🎙"}
              </button>
              <button onClick={handleBenchmarkSubmit} disabled={input.trim().length<15||sending}
                style={{background:input.trim().length>=15&&!sending?`linear-gradient(135deg,${selBenchmark.color},${selBenchmark.color}aa)`:C.border,border:"none",color:input.trim().length>=15&&!sending?"#fff":C.muted,padding:"11px 24px",borderRadius:9,cursor:input.trim().length>=15&&!sending?"pointer":"not-allowed",fontSize:14,fontWeight:700}}>
                {sending?"Scoring...":bmIdx<bmQuestions.length-1?"Submit → Next":"Submit Final"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MILITARY CLASSIFICATION
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="military") return (
    <div style={{display:"flex"}}>
      <Sidebar view={view} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} filterCat={filterCat} setFilterCat={setFilterCat} completed={completed}
        onHome={()=>setView(onboardingDone?"mypath":"home")} onPickMode={(v)=>setView(v)} onBenchmarks={()=>setView("benchmarks")}
        onPickBenchmark={(bm)=>startBenchmark(bm)} onMilitary={()=>setView("military")} onEmployer={goEmployer} authed={authed} plan={plan} onAuth={()=>{setAuthMode("signup");setView("auth");}} onboardingDone={onboardingDone} onMyPath={()=>setView("mypath")} onLogout={handleLogout}/>
      <div style={{...base,flex:1,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"20px 32px",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontWeight:800,fontSize:18}}>Military Classification Mode</span>
          <div style={{marginTop:6}}><Badge color={C.purple} small>ASR-Level Assessment</Badge></div>
        </div>
        <div style={{maxWidth:680,padding:"24px 32px"}}>
        <div style={{background:`${C.purple}11`,border:`1px solid ${C.purple}33`,borderRadius:12,padding:"20px 22px",marginBottom:28}}>
          <div style={{fontSize:16,fontWeight:800,color:C.purple,marginBottom:8}}>How Military Classification Works</div>
          <p style={{fontSize:14,color:C.dim,lineHeight:1.75,marginBottom:12}}>
            This is not a test. There are no right or wrong answers. You have conversations across different topic areas and the AI identifies where your natural reasoning strengths are — mechanical, electrical, systems thinking, spatial, procedural — and maps them to military occupational fields.
          </p>
          <p style={{fontSize:14,color:C.dim,lineHeight:1.75,marginBottom:0}}>
            When complete, your strength profile replaces the ASVAB as a classification tool. It shows <em>how</em> you think, not just <em>what</em> you memorized.
          </p>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Choose a Classification Discussion</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {id:"pp-01",label:"Mechanical Reasoning",desc:"How do you explain why an engine system works the way it does?",icon:"⚙️"},
              {id:"el-01",label:"Electrical & Systems Thinking",desc:"How do you think through circuits, power flow, and cause-effect chains?",icon:"⚡"},
              {id:"sf-01",label:"Safety & Risk Awareness",desc:"How do you naturally identify what could go wrong before it does?",icon:"🛡️"},
              {id:"pl-01",label:"Planning & Sequencing",desc:"How do you organize complex tasks with multiple dependencies?",icon:"📋"},
              {id:"av-01",label:"Technical Communication",desc:"How do you explain complex systems clearly to someone who doesn't know them?",icon:"📡"},
            ].map(item=>{
              const topic = TOPICS.find(t=>t.id===item.id);
              return (
                <div key={item.id} onClick={()=>{ if(topic) startDiscussion(topic,"military"); }}
                  style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.purple}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{item.label}</div>
                    <div style={{fontSize:13,color:C.dim}}>{item.desc}</div>
                  </div>
                  <div style={{color:C.purple,fontSize:13,fontWeight:600,flexShrink:0}}>Start →</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,fontSize:13,color:C.dim}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:6}}>Validation Protocol</div>
          Remote classification discussions establish your initial profile. In-person validation at MEPS or recruiting station confirms the profile is genuine. Video recording option available for remote validation. Your profile maps directly to military occupational fields and A-school recommendations.
        </div>
      </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // EMPLOYER
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="employer") {
    if (!employerAuthed) { setView("employer-auth"); return null; }
    const WORKERS = [
      {id:1,name:"Marcus T.",tier:3,score:91,platform:"H-60",years:12,guided:47,selfStudy:62,peer:15,signal:"strong",benchmark:"FAA A&P"},
      {id:2,name:"Darnell W.",tier:2,score:79,platform:"F-18",years:6,guided:31,selfStudy:12,peer:8,signal:"moderate",benchmark:"FAA A&P"},
      {id:3,name:"James R.",tier:4,score:97,platform:"T700",years:18,guided:89,selfStudy:120,peer:34,signal:"strong",benchmark:"FAA A&P"},
      {id:4,name:"Sarah K.",tier:2,score:75,platform:"H-60",years:4,guided:22,selfStudy:8,peer:5,signal:"moderate",benchmark:"FAA A&P"},
      {id:5,name:"Victor M.",tier:1,score:62,platform:"General",years:1,guided:8,selfStudy:2,peer:1,signal:"weak",benchmark:"None"},
    ];
    return (
      <div style={base}>
        <div style={nav}>
          <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:C.blue,cursor:"pointer",fontSize:13}}>← APMAC</button>
          <span style={{color:C.muted,fontSize:13}}>Employer Portal</span>
        </div>
        <div style={{maxWidth:860,margin:"0 auto",padding:"28px"}}>
          <h2 style={{fontSize:22,fontWeight:800,marginBottom:6}}>Verified Talent Pool</h2>
          <p style={{color:C.dim,fontSize:14,marginBottom:24}}>Every score built passively from real discussions. Benchmark shows licensing. APMAC shows actual competency and learning behavior.</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {WORKERS.map(w=>{
              const t = getTier(w.score);
              const total = w.guided + w.selfStudy + w.peer;
              return (
                <div key={w.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:13,padding:22}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                    <Avatar initials={w.name.split(" ").map(n=>n[0]).join("")} color={t.color} size={46}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5,flexWrap:"wrap"}}>
                        <span style={{fontSize:16,fontWeight:700}}>{w.name}</span>
                        <Badge color={t.color} small>Tier {w.tier} — {t.name}</Badge>
                        {w.benchmark!=="None" && <Badge color={C.green} small>✓ {w.benchmark}</Badge>}
                      </div>
                      <div style={{color:C.dim,fontSize:13,marginBottom:12}}>Aviation Maintenance · {w.platform} · {w.years} yrs experience</div>
                      {/* LEARNING BEHAVIOR — employer insight */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                        {[
                          {label:"Guided Discussions",val:`${w.guided}hrs`,color:C.blue},
                          {label:"Self-Directed",val:`${w.selfStudy}hrs`,color:C.cyan,note:w.selfStudy>50?"High initiative":""},
                          {label:"Peer Sessions",val:`${w.peer}`,color:C.green},
                          {label:"Total Learning",val:`${total}hrs`,color:t.color},
                        ].map(item=>(
                          <div key={item.label} style={{background:C.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{item.label}</div>
                            <div style={{fontWeight:800,fontSize:15,color:item.color}}>{item.val}</div>
                            {item.note && <div style={{fontSize:10,color:item.color,marginTop:2}}>{item.note}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:28,fontWeight:900,color:t.color}}>{w.score}%</div>
                      <SignalDot signal={w.signal}/>
                      <div style={{marginTop:8}}>
                        <button style={{background:`${C.blue}22`,border:`1px solid ${C.blue}55`,color:C.blue,padding:"8px 14px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600}}>Request Profile</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ADMIN
  // ══════════════════════════════════════════════════════════════════════════════
  if (view==="admin") return (
    <div style={base}>
      <div style={nav}>
        <button onClick={()=>setView("home")} style={{background:"transparent",border:"none",color:C.blue,cursor:"pointer",fontSize:13}}>← APMAC</button>
        <span style={{color:C.muted,fontSize:13}}>Admin — MATCEDI</span>
      </div>
      <div style={{maxWidth:820,margin:"0 auto",padding:"28px"}}>
        <h2 style={{fontSize:22,fontWeight:800,marginBottom:24}}>Platform Overview</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[["Workers","5"],["Topics Live","30"],["Benchmarks","5"],["Avg Score","81%"]].map(([l,v])=>(
            <div key={l} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:18,textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:900,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{v}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div style={{fontSize:13,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>Proprietary Scoring Engine</div>
            <Badge color={C.orange}>CONFIDENTIAL — MATCEDI, LLC IP</Badge>
          </div>
          {[{label:"Causal Reasoning",icon:"🔗",color:C.blue},{label:"Sequence Awareness",icon:"📋",color:C.green},{label:"Risk Identification",icon:"⚠",color:C.orange},{label:"Platform Specificity",icon:"✈",color:C.purple},{label:"Terminology Precision",icon:"🎯",color:C.yellow}].map(item=>(
            <div key={item.label} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:16}}>{item.icon}</span>
              <span style={{flex:1,fontWeight:600,fontSize:14,color:item.color}}>{item.label}</span>
              <span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Weight confidential</span>
            </div>
          ))}
          <div style={{marginTop:14,fontSize:12,color:C.muted,fontStyle:"italic"}}>Scoring methodology proprietary to MATCEDI, LLC. Patent pending.</div>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{fontSize:13,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:18}}>Learning Pathway Breakdown</div>
          {[{label:"Guided Discussions",pct:45,color:C.blue},{label:"Self-Directed Learning",pct:35,color:C.cyan},{label:"Military Classification",pct:12,color:C.purple},{label:"Benchmark Tests",pct:8,color:C.green}].map(item=>(
            <div key={item.label} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:item.color,fontWeight:600,fontSize:13}}>{item.label}</span>
                <span style={{color:C.muted,fontSize:12}}>{item.pct}% of activity</span>
              </div>
              <div style={{background:C.border,borderRadius:3,height:6}}>
                <div style={{background:item.color,borderRadius:3,height:6,width:`${item.pct}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // VOICE CHANNEL
  // ══════════════════════════════════════════════════════════════════════════════
  // Note: voice is no longer a separate destination. It's a property of every
  // text input across Discuss, Self-Study, Military, and Benchmark — see the
  // 🎙 hold-to-speak button built into each input row.

  return null;
}
