// phases.js — PHASES array, STRUGGLING data, helpers
// v3.0.0 — no deps

export const PHASES = [
  { id:0, h0:0,   h1:12,       color:'#55556a', icon:'🔋', range:'0 – 12h',  name:'Fuel Transition',
    bullets:['Glucose & glycogen still primary fuel','Insulin falling, glucagon rising','Fat mobilisation beginning — lipolysis warming up'],
    desc:'Body running on glucose and glycogen. Fat metabolism is warming up as insulin falls.',
    mot:{ title:'The Countdown Has Begun',
      body:'Your glycogen stores — roughly 400 calories of sugar packed into your liver and muscles — are being drawn down right now. Every passing hour edges you closer to the metabolic threshold that changes everything. This is where most people stop. You\'re already different.',
      sci:'📚 Hepatic glycogen ~80–100g depleting. Glucagon rising, insulin falling. Lipolysis warming up. Growth hormone beginning to elevate (muscle-protective).' } },
  { id:1, h0:12,  h1:24,       color:'#ffd740', icon:'🔥', range:'12 – 24h', name:'Ketosis Ignition',
    bullets:['Liver has switched to ketone production','Brain receiving BHB as clean alternative fuel','Growth hormone surging up to 5× baseline'],
    desc:'Glycogen depleted. Liver converts fatty acids to ketones. Early ketosis begins.',
    mot:{ title:'🔥 The Metabolic Switch Has Flipped',
      body:'Something extraordinary just happened. Your liver has pivoted from burning glucose to manufacturing ketone bodies from fat. Beta-hydroxybutyrate is entering your bloodstream. Your brain — which can\'t run on fat directly — now has a premium alternative fuel. You\'ve crossed the threshold.',
      sci:'📚 Blood ketones rising toward 0.3–0.5 mmol/L. Growth hormone surging (up to 5× baseline) to protect lean mass. AMPK activated. mTOR suppression beginning — the cellular cleanup signal is live.' } },
  { id:2, h0:24,  h1:48,       color:'#ff7043', icon:'⚡', range:'24 – 48h', name:'Deep Ketosis',
    bullets:['Fat oxidation running at maximum rate','Blood ketones 0.5–3.0 mmol/L — measurable','Mental clarity typically peaks around now'],
    desc:'Peak fat oxidation. Ketone levels measurably high. Mental clarity typically sharpens.',
    mot:{ title:'⚡ Fat-Burning Furnace — ACTIVE',
      body:'You are now running almost entirely on fat. Ketone levels in your blood are significant and measurable. Many people experience striking clarity of mind around this point — that\'s your brain thriving on BHB, a cleaner fuel than glucose. Your adipose tissue is being systematically mobilized.',
      sci:'📚 Blood ketones 0.5–3.0 mmol/L typical. Adiponectin rising (anti-inflammatory). Norepinephrine-driven thermogenesis elevated. mTOR deeply suppressed — autophagy is meaningfully active. Free fatty acid oxidation at maximum.' } },
  { id:3, h0:48,  h1:72,       color:'#00d4ff', icon:'🔬', range:'48 – 72h', name:'Peak Autophagy',
    bullets:['Cellular self-cleaning (autophagy) at full power','Damaged proteins & organelles being recycled','mTOR suppressed, AMPK active — Nobel Prize science'],
    desc:'Cellular self-cleaning at maximum. Damaged proteins and organelles recycled and rebuilt.',
    mot:{ title:'🔬 Your Cells Are Self-Repairing',
      body:'This is elite territory. Autophagy — the process Yoshinori Ohsumi won the 2016 Nobel Prize in Medicine for discovering — is now at full operation in every cell of your body. Damaged proteins, misfolded molecules, worn-out mitochondria: all being systematically disassembled and recycled into fresh cellular components.',
      sci:'📚 Autophagy flux at peak. Beclin-1, ULK1, and LC3-II highly active. Associated with: reduced senescent cell burden, improved insulin sensitivity, neuronal regeneration markers, measurable reduction in inflammatory cytokines.' } },
  { id:4, h0:72,  h1:120,      color:'#8b5cf6', icon:'🧬', range:'72 – 120h',name:'Immune Regeneration',
    bullets:['Aged immune cells systematically cleared','Haematopoietic stem cells producing fresh replacements','IGF-1 drop triggers deep regeneration signal'],
    desc:'Old immune cells cleared. Hematopoietic stem cells activated to rebuild immunity.',
    mot:{ title:'🧬 Your Immune System Is Rebooting',
      body:'You\'ve reached territory most people never access. Your body is now actively clearing damaged, aged immune cells and triggering hematopoietic stem cells to produce fresh replacements. Valter Longo\'s research at USC demonstrated that 72h+ fasting essentially regenerates the immune system.',
      sci:'📚 IGF-1 significantly reduced → hematopoietic stem cell proliferation. FOXO3 transcription factor activated (longevity gene). Significant regeneration of lymphocytes and myeloid cells. Gut microbiome diversity improving.' } },
  { id:5, h0:120, h1:Infinity,  color:'#00e676', icon:'🌟', range:'120h+',   name:'Deep Metabolic Reset',
    bullets:['BDNF elevated — brain building new neural connections','Sirtuins (longevity proteins) running at full capacity','Stem cell mobilisation across multiple tissue types'],
    desc:'Profound regeneration. Sirtuins active. BDNF elevated. Metabolic age declining.',
    mot:{ title:'🌟 You Are in Legendary Territory',
      body:'BDNF — brain-derived neurotrophic factor — is significantly elevated, meaning your brain is literally building new neural connections. Sirtuins, the proteins most associated with longevity, are running at full capacity. You are operating in a biological state that humans rarely access in the modern world.',
      sci:'📚 BDNF elevation promotes neurogenesis and synaptic plasticity. SIRT1/SIRT3 highly active → mitochondrial biogenesis, telomere protection. Stem cell mobilization continuing across multiple tissue types.' } },
];

export const STRUGGLING = {
  hunger:{ label:'🍽️ Hunger', msgs:[
    { msg:"Most hunger waves last 15–20 minutes and pass on their own. Drink 500ml of water, walk for 10 minutes, then reassess. The wave will have passed.",
      sci:"🔬 Ghrelin (hunger hormone) pulses every 90–120 min and subsides without food. Water activates stomach mechanoreceptors, blunting the signal." },
    { msg:"That hunger feeling is your body realising it needs to switch fuel sources — not a signal that you are in danger. You have weeks of stored energy available.",
      sci:"🔬 Average body stores 40,000–100,000+ kcal as fat. The discomfort is hormonal transition, not a caloric deficit crisis." },
    { msg:"Add electrolytes. Seriously. A pinch of salt or electrolyte mix resolves a large percentage of fasting discomfort. Hunger and electrolyte depletion feel identical.",
      sci:"🔬 Sodium depletion during fasting mimics hunger signals. Electrolytes resolve most perceived 'hunger' within 15–20 minutes." },
    { msg:"Hunger during fasting is mostly learned pattern recognition — your body is used to eating at certain times. This is that pattern asking to be fed. It passes if you let it.",
      sci:"🔬 Conditioned meal-time hunger: ghrelin peaks at habitual eating times, then subsides within 30–60 min without food. It is a clock response, not a deficit response." },
  ]},
  cravings:{ label:'🧠 Cravings', msgs:[
    { msg:"Cravings peak and pass. Your brain is running on ketones now — that craving is neurological noise from dopamine pathways, not a real metabolic need.",
      sci:"🔬 Food cravings originate in reward circuits (nucleus accumbens), not hunger centres. Peak craving intensity averages 3–5 minutes." },
    { msg:"Name the specific food you're craving. Then wait 5 minutes. The craving is a memory pattern, not a biological need. Your body does not require that food right now.",
      sci:"🔬 Mindful delay (5–10 min) significantly reduces craving intensity. Prefrontal engagement with the craving weakens its salience." },
    { msg:"Go do something physical with your hands for 20 minutes — make, fix, or clean something. Cravings cannot compete with genuine engagement.",
      sci:"🔬 Motor activity redirects dopamine circuits away from food anticipation. Physical tasks reduce craving intensity by ~40% in studies." },
    { msg:"This craving is your brain predicting your next move based on past patterns. You're interrupting the pattern. The discomfort you feel is the pattern breaking.",
      sci:"🔬 Habit loops: cue → routine → reward. Fasting interrupts the routine. The craving signal weakens with each non-response over time." },
  ]},
  energy:{ label:'⚡ Low Energy', msgs:[
    { msg:"Hours 20–36 are the energy valley. ATP production is shifting from glucose to ketone-based metabolism. This dip is temporary — and it is followed by noticeable clarity.",
      sci:"🔬 Metabolic transition dip: hepatic glucose output drops before ketone availability peaks. Duration: 4–12h typically. Mitochondrial adaptation ongoing." },
    { msg:"Lie down for 20 minutes — not to sleep, just to rest with your eyes closed. Your body is burning resources on metabolic reconfiguration. Give it stillness.",
      sci:"🔬 Non-sleep rest (NSDR) reduces cortisol and allows metabolic processes to run more efficiently. 20 min rest equals significant cellular recovery time." },
    { msg:"This low energy is not weakness. It is your liver mid-construction of an entirely new fuel delivery system. You are not getting worse — you are being upgraded.",
      sci:"🔬 Hepatic ketogenesis requires enzyme upregulation, mitochondrial biogenesis, and fatty acid transport adjustment. Transient fatigue is expected and normal." },
    { msg:"Try a slow 15-minute walk. Light movement at this intensity actively accelerates fatty acid mobilisation — and within 30 minutes, most people feel a real energy lift.",
      sci:"🔬 Low-intensity exercise (≤50% VO2max) during fasting enhances free fatty acid mobilisation and ketone production without depleting remaining glycogen." },
  ]},
  boredom:{ label:'😐 Boredom', msgs:[
    { msg:"You are not hungry. You are bored — and your brain has learned that boredom equals eating. These are not the same thing, and distinguishing them is valuable.",
      sci:"🔬 Boredom eating is driven by dopamine-seeking, not energy deficit. The orbitofrontal cortex conflates under-stimulation with reward-seeking behaviour." },
    { msg:"Go do something with your hands for 20 minutes. Make, fix, or clean something. Boredom cannot survive genuine physical engagement.",
      sci:"🔬 Occupying the motor cortex with task-focused work suppresses the default mode network — where boredom and food thoughts originate." },
    { msg:"Drink sparkling water or tea, change your physical location, and set a 20-minute timer. If you still feel a real need after that, reassess. Most people don't.",
      sci:"🔬 Environmental cues drive 65%+ of non-hungry eating. Changing location removes visual triggers. Time delay confirms whether this is hormonal or behavioural." },
    { msg:"Notice what this moment is telling you: eating has been filling time, not just fuelling your body. That insight alone is worth something — it changes how you'll eat later.",
      sci:"🔬 30–40% of eating occasions in developed countries are driven by non-hunger cues. Recognising this pattern is the first step to changing it." },
  ]},
  social:{ label:'👥 Social Pressure', msgs:[
    { msg:"Food is social currency — you can decline it gracefully. 'I'm not hungry right now' is complete, polite, and entirely true. You do not owe anyone a longer explanation.",
      sci:"🔬 Social facilitation of eating: people eat 35–96% more in groups. The pressure you feel is social norm enforcement, not genuine concern for your health." },
    { msg:"If someone pushes back: 'I'm doing intermittent fasting, I'll eat later.' This closes the topic, is widely understood, and has the advantage of being true.",
      sci:"🔬 Intermittent fasting is mainstream enough that social resistance has dropped significantly. One clear sentence is almost always sufficient." },
    { msg:"The discomfort you feel is other people being uncomfortable. Their discomfort is real — but it is not your responsibility to resolve it by eating.",
      sci:"🔬 Social conformity pressure (Asch-type): recognising that the pressure is social, not medical, is the primary tool for resisting it without conflict." },
    { msg:"You can sit at a table, drink water or coffee, and participate fully in a meal without eating. Billions of people with dietary restrictions do exactly this daily.",
      sci:"🔬 Presence, not consumption, is the actual social requirement. Studies on religious fasters show full social integration maintained without eating." },
  ]},
  quit:{ label:'🔥 Want to Quit', msgs:[
    { msg:"The version of you who started this fast knew something. That version was right. Nothing has actually changed since then — except that you have more hours behind you.",
      sci:"🔬 'Want to quit' impulse peaks at biological stress points (glucose transition, cortisol spikes) and typically passes within 20–30 min without action." },
    { msg:"Write down three reasons you started. Not reasons to continue — reasons you chose to begin. Those reasons have not changed. They are still true right now.",
      sci:"🔬 Value reconnection is one of the highest-efficacy strategies for impulse override. Reconnecting with original intent reduces quit rates significantly." },
    { msg:"You are not at the end of your strength — you are at the part where it feels like the end. Every person who has done this has been exactly where you are right now.",
      sci:"🔬 Perceived exertion vs. actual capacity: peak 'want to quit' typically occurs at 60–80% of actual capacity, not near the real limit." },
    { msg:"End the fast if you need to — but wait 30 minutes first. Set a timer. Do not decide right now. The version of you in 30 minutes will have better information.",
      sci:"🔬 Temporal self-discounting: decisions made under acute discomfort over-weight immediate relief. A 20–30 min delay corrects for this bias reliably." },
  ]},
};

export function getPhase(hrs) {
  let cur = PHASES[0];
  for (const p of PHASES) if (hrs >= p.h0) cur = p;
  return cur;
}

export function phaseProgress(hrs, phase) {
  if (phase.h1 === Infinity) return 1;
  return Math.min(1, Math.max(0, (hrs - phase.h0) / (phase.h1 - phase.h0)));
}
