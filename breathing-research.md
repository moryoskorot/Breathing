# 10–12 Breathing Exercises for a Breathing App: Phase Timings, Benefits, and Cautions

**TL;DR**
- Twelve well-established, app-ready techniques are profiled below with exact phase-timing ratios suitable for a programmable timer — including the equal 4-4-4-4 of Box Breathing, the 4-7-8 Relaxing Breath, Wim Hof's 30-power-breaths-plus-retention protocol, and slow Coherent Breathing at ~5.5 breaths/min.
- The single biggest implementation note: app phases fall into three categories — fixed-count cycles (Box, 4-7-8, Coherent, Surya Bhedana), paced rapid breathing measured in breaths-per-minute or breaths-per-round (Kapalabhati, Bhastrika, Wim Hof), and free-duration practices measured in minutes (Ujjayi, Sitali, Bhramari, Lion's, Diaphragmatic). Build three timer modes, not one.
- Several of these techniques are genuinely contraindicated for users with hypertension, cardiovascular disease, pregnancy, glaucoma, seizure disorders, or panic disorder; the app should surface a one-tap "Safety" screen before first use of Kapalabhati, Bhastrika, Wim Hof, 4-7-8 (advanced), and Surya Bhedana.

## Key Findings

- The four "equal-ratio" techniques (Box, Coherent, Sama Vritti, Diaphragmatic 4:4 or 4:6) are the safest defaults and the easiest to program — a single repeating cycle with no escalation logic.
- The exhale-dominant techniques (4-7-8, Physiological Sigh, Bhramari, Sitali) consistently downregulate arousal and are best mapped to "calm/sleep" modes.
- The hyperventilation-then-retention techniques (Wim Hof, Bhastrika, Kapalabhati) are powerful but high-risk; they require seated/supine posture warnings and explicit "do not practice in water, while driving, or standing" guards.
- Coherent Breathing at ~5.5 breaths/minute is the technique with the strongest published HRV evidence and pairs naturally with biofeedback if your app supports wearable integration.
- Cyclic Sighing (physiological sigh practiced for 5 minutes/day) was tested in Balban et al. (*Cell Reports Medicine*, Jan 17 2023, doi:10.1016/j.xcrm.2022.100895), which enrolled 108 participants (30 cyclic sighing, 21 box breathing, 33 cyclic hyperventilation, 24 mindfulness meditation) and reported cyclic sighing "produces greater improvement in mood (p<0.05) and reduction in respiratory rate (p<0.05) compared with mindfulness meditation," with cyclic sighing yielding the largest daily increase in PANAS positive affect of all four groups — strong evidence to feature it prominently.

## Details

### 1. Box Breathing (Sama Vritti Pranayama, "Square Breathing," Navy SEAL / Tactical Breathing)
- **Description:** A four-equal-phases technique popularized by former Navy SEAL Commander Mark Divine: inhale, hold full, exhale, hold empty — each for the same count. Quiet nasal breathing throughout.
- **Phase breakdown (timer-ready):**
  - Beginner / standard: **Inhale 4s, Hold 4s, Exhale 4s, Hold 4s — repeat.**
  - Advanced: Inhale 5–6s, Hold 5–6s, Exhale 5–6s, Hold 5–6s — repeat. Some traditions extend up to 8-8-8-8.
  - One cycle = 16 seconds at the standard pace.
- **Benefits:** Activates parasympathetic nervous system; lowers heart rate and cortisol; sharpens focus without sedation ("alert calm"); used pre-mission by SEALs and clinically for acute anxiety.
- **Difficulty:** Beginner.
- **Session length:** 1–5 minutes for an acute reset; Mark Divine recommends 10–20 minutes daily; the often-cited "16-second" round means even one cycle has measurable effect.
- **Cautions:** Generally very safe. If the holds cause tightness or lightheadedness, shorten to 3s or remove the empty-hold. Avoid forcing back-pressure during holds.

### 2. 4-7-8 Breathing (Relaxing Breath)
- **Description:** Codified by Dr. Andrew Weil of the Arizona Center for Integrative Medicine, drawn from pranayama. Tongue rests on the ridge behind the upper front teeth throughout; inhale silently through the nose, exhale audibly through the mouth around the tongue with a "whoosh."
- **Phase breakdown (timer-ready):**
  - **Inhale (nose) 4s, Hold 7s, Exhale (mouth, audible) 8s — repeat.**
  - The 4:7:8 *ratio* is what matters; if 7s and 8s feel too long, speed up while preserving the ratio.
- **Benefits:** Strong vagal/parasympathetic activation; reduces sleep-onset latency; calms acute anxiety, food cravings, and pre-reactive tension. Weil calls it "a natural tranquilizer for the nervous system."
- **Difficulty:** Beginner technique, intermediate dose (the long hold and exhale challenge beginners).
- **Session length:** **4 cycles per session, twice daily** for the first month; can extend to 8 cycles after one month of practice. Do not exceed 4 cycles in the first month.
- **Cautions:** Lightheadedness on early attempts is normal and harmless. Caution for users with COPD or low blood pressure due to the 7-second hold; pregnancy practitioners should use shorter holds.

### 3. Wim Hof Method Breathing
- **Description:** A three-phase round developed by Dutch athlete Wim Hof: controlled hyperventilation (30–40 deep breaths), retention on empty lungs, then a 15-second recovery hold on a full inhale. Repeated for 3–4 rounds. Always practiced seated or lying down.
- **Phase breakdown (timer-ready, one round):**
  1. **30–40 "power breaths"** — deep inhale through nose or mouth, passive/relaxed exhale through mouth, no pause between. Roughly 2 seconds per breath.
  2. **Retention on empty:** after the final exhale (released to ~90%), hold breath out as long as comfortable — typically 60–90s for beginners, up to 2–3 minutes with practice.
  3. **Recovery hold:** one full deep inhale, hold for **15 seconds**, then release.
  - **Repeat for 3–4 rounds.** Full session = 10–20 minutes.
- **Benefits:** Documented effects in Kox et al. (PNAS 2014, 111[20]:7379–84), as tabulated in the PLOS ONE systematic review (doi:10.1371/journal.pone.0286933): "interleukin-10 levels were 194% higher…TNF-α, interleukin-6, and interleukin-8 levels were 53%, 57%, and 51% lower respectively" in WHM-trained versus control participants. Also: adrenaline surge, transient respiratory alkalosis, improved cold tolerance, perceived energy and focus.
- **Difficulty:** Intermediate to advanced.
- **Session length:** 3–4 rounds, ~15–20 minutes, once daily, ideally on an empty stomach in the morning.
- **Cautions:** **Never practice in or near water, while driving, or standing** — controlled hyperventilation can cause syncope. Contraindicated in pregnancy, epilepsy, cardiovascular disease, severe hypertension, and panic disorder. Tingling and lightheadedness are expected but should resolve quickly.

### 4. Bhastrika Pranayama (Bellows Breath)
- **Description:** A vigorous, heating pranayama in which the diaphragm acts like a blacksmith's bellows — forceful, equal inhalations and exhalations through the nose, driven by the belly. Distinct from Kapalabhati: in Bhastrika, **both inhale and exhale are active and equal**; in Kapalabhati only the exhale is forceful.
- **Phase breakdown (timer-ready):**
  - **Beginner:** Inhale 1s + Exhale 1s (forceful, equal, through nose) × 10 breaths = 1 round. Rest with normal breathing 15–30s. Repeat for 3 rounds.
  - **Advanced:** Up to 2 breaths/second (one inhale-exhale cycle per 0.5s), 30–120 breaths per round, 3 rounds. Many teachers finish each round with one deep inhalation, a comfortable retention, and a slow exhale.
- **Benefits:** Increases oxygenation and circulation; stokes "digestive fire" (agni); clears nasal passages; energizing — counters lethargy and afternoon slump. Novaes et al. (Frontiers in Psychiatry 2020, doi:10.3389/fpsyt.2020.00467) found that 4 weeks of Bhastrika in 30 healthy adults "significantly reduce the levels of anxiety and negative affect, and that these changes are associated with the modulation of activity and connectivity in brain areas involved in emotion processing" — specifically the amygdala, anterior cingulate cortex, anterior insula, and prefrontal cortex.
- **Difficulty:** Intermediate to advanced (requires diaphragmatic-breathing competence first).
- **Session length:** 3 rounds × 10–30 breaths for beginners; up to 3 rounds × 60–120 breaths with mastery. Practice on empty stomach, morning preferred.
- **Cautions:** Avoid in pregnancy, menstruation, hypertension, cardiovascular disease, hernia, vertigo, recent abdominal surgery, glaucoma, retinal detachment, and epilepsy. Stop if dizzy.

### 5. Kapalabhati Pranayama (Skull-Shining Breath, Frontal Brain Cleansing Breath)
- **Description:** A classified shatkarma (cleansing kriya) in hatha yoga: short, sharp, forceful **exhales** driven by abdominal contraction, with passive inhales between. The opposite emphasis to normal breathing.
- **Phase breakdown (timer-ready):**
  - **Beginner:** Forceful exhale 0.5s, passive inhale 1–1.5s — repeat at ~1 breath every 1–2 seconds (40 breaths/minute). 20–30 breaths per round, 3 rounds, with 30–60s normal breathing between rounds.
  - **Advanced:** Up to 2 cycles/second (~120 breaths/min), 60–108 breaths per round, 3 rounds.
- **Benefits:** Strengthens diaphragm and abdominal muscles; clears nasal passages and sinuses; energizes and clears mental fog; said in Ayurveda to be tridoshically balancing.
- **Difficulty:** Intermediate.
- **Session length:** 3 rounds × 20–108 breaths. Begin with shorter rounds and lower BPM.
- **Cautions:** Contraindicated in pregnancy, menstruation, high or low blood pressure, heart disease, hernia, gastric ulcer, epilepsy, vertigo, migraine, detached retina, glaucoma, recent abdominal surgery, and history of stroke (per Banyan Botanicals and corroborating yoga clinical sources).

### 6. Sitali / Sitkari Pranayama (Cooling Breath)
- **Description:** Inhale through a curled tongue (Sitali) or through the teeth with lips parted (Sitkari, for those who cannot curl their tongue — it is a heritable trait); exhale through the nose. The air is moistened and cooled across the tongue/teeth.
- **Phase breakdown (timer-ready):**
  - **Beginner:** Inhale through curled tongue/teeth 4s, Exhale through nose 4–6s — repeat. (1:1 ratio is traditional baseline.)
  - **Advanced:** Inhale 4s, Hold 4s, Exhale 8s (1:1:2 or 1:2:2 ratios with optional retention).
- **Benefits:** Cools body temperature; soothes pitta imbalance; reduces irritation, anger, hot flashes; lowers blood pressure; calms hunger and thirst; supports sleep when overheated.
- **Difficulty:** Beginner.
- **Session length:** Start with 2–3 minutes; build to 10 minutes. Multiple times daily in hot weather acceptable.
- **Cautions:** Avoid in cold weather, in polluted air, and in users with asthma, chronic bronchitis, cough/cold, chronic constipation, or low blood pressure (since cool air is drawn through the mouth, bypassing nasal warming).

### 7. Ujjayi Pranayama (Ocean Breath, Victorious Breath)
- **Description:** Slow nasal breathing with a gentle constriction of the glottis at the back of the throat, producing a soft oceanic/whisper sound on both inhale and exhale. The signature breath of Ashtanga and Vinyasa yoga, used to synchronize movement and breath.
- **Phase breakdown (timer-ready):**
  - **Standard:** Inhale (nose, throat constricted) 4–6s, Exhale (nose, throat constricted) 6–8s — repeat. A 4:6 or 5:5 ratio is common; the exhale is often slightly longer to deepen parasympathetic activation.
  - **No holds** in the basic practice.
- **Benefits:** Builds internal heat (tapas); slows respiratory rate into the 5–6 breaths/min range; lowers cortisol; improves focus and emotional regulation; deepens meditation and asana practice. Ray et al. (*Explore (NY)*, 2023 May-Jun;19(3):362-370, doi:10.1016/j.explore.2022.07.005) concluded "a single session of low-to-moderate intensity yoga with, or without slow breathing, reduces state anxiety" — both the Ujjayi and no-Ujjayi yoga groups showed similar reductions, indicating yoga drove the effect rather than the breath cue alone.
- **Difficulty:** Beginner (technique) to intermediate (sustained).
- **Session length:** 5 minutes seated for the standalone practice; full duration of a yoga class when integrated; up to 15 minutes for deeper meditation.
- **Cautions:** Avoid forcing the throat constriction (a soft whisper, not Darth Vader). Caution in hypertension, pregnancy, sore throat, and active respiratory infection.

### 8. Coherent / Resonant Breathing (Resonance-Frequency Breathing, HRV Biofeedback Breathing)
- **Description:** Slow, smooth, equal-ratio nasal breathing at approximately **5.5 breaths per minute**, which is the cardiopulmonary resonance frequency at which heart rate variability, baroreflex, and blood-pressure oscillations synchronize. The label "Coherent Breathing" was coined by Stephen Elliott in 2005 in *The New Science of Breath*; the underlying physiology was established by Lehrer and Vaschillo's HRV biofeedback research.
- **Phase breakdown (timer-ready):**
  - **Standard:** Inhale 5.5s, Exhale 5.5s — repeat (≈5.5 breaths/min).
  - **Range:** Anywhere from 5s in / 5s out (6 bpm) to 6s in / 6s out (5 bpm) works; individual resonance frequencies vary 4.5–6.5 bpm.
  - **No holds.** Nasal only.
- **Benefits:** Maximal HRV amplitude during practice; reduces stress, blood pressure, and resting respiratory rate; improves mood and emotional regulation. Reviews show immediate increases in HRV and baroreflex markers at ~5–6 bpm.
- **Difficulty:** Beginner.
- **Session length:** **10–20 minutes daily** is the canonical dose; benefits are dose-dependent — a recent self-experiment by clinicians (highlighted in the Brizzy app blog) noted noticeably larger HRV jumps at 20 min vs. 10 min.
- **Cautions:** Very safe; one of the few techniques with no significant contraindications. May initially feel like "not enough air" — this is the body adapting to lower CO₂ clearance.

### 9. Bhramari Pranayama (Humming Bee Breath)
- **Description:** Inhale through the nose, then exhale slowly with a steady, low-pitched humming sound (like a bee) at the back of the throat. Often practiced with Shanmukhi mudra (index fingers gently on the tragus to seal the ears, amplifying the internal vibration).
- **Phase breakdown (timer-ready):**
  - **Standard:** Inhale (nose) 4–5s, Exhale with humming (nose, mouth closed) 12–15s — repeat. Traditional ratio is **1:3 inhale-to-exhale** (per the literature review in the Indian Journal of Physiology and Pharmacology, 2024: I:E ~1:3, ~3–6 breaths/min, exhale ~15s).
  - **Beginner-friendly:** Inhale 4s, Exhale with hum 8s — repeat.
- **Benefits:** Strong vagal stimulation via vocal-cord vibration (a branch of the vagus innervates the larynx); rapidly induces parasympathetic state; reduces blood pressure, tinnitus symptoms, and anxiety; improves sleep latency; said in EEG studies to increase alpha and theta wave power.
- **Difficulty:** Beginner.
- **Session length:** **5–10 repetitions** is the typical prescription (Banyan Botanicals recommends starting at 7 repetitions and building to 17). Practice 3–4 times daily as needed.
- **Cautions:** Do not practice lying down (per traditional teaching). Avoid with active ear infection, extremely high blood pressure, epilepsy, chest pain, or in pregnancy.

### 10. Lion's Breath (Simhasana Pranayama, Simha Mudra)
- **Description:** Inhale through the nose; exhale forcefully through a wide-open mouth with the tongue extended toward the chin, making a "haaa" sound like a lion's roar. Traditionally performed kneeling (Vajrasana) or in Hero pose with hands on knees, fingers spread.
- **Phase breakdown (timer-ready):**
  - **Inhale (nose) 4s, Exhale (mouth, tongue out, audible "haa") 4–6s — repeat 4–7 times.**
  - Some traditions hold the inhale briefly (1–2s) before the roaring exhale.
- **Benefits:** Releases jaw, throat, and facial tension; tones the platysma muscle (anti-aging effect on the neck); stimulates throat chakra (Vishuddha); releases pent-up anger and inhibition; energizing.
- **Difficulty:** Beginner.
- **Session length:** 4–7 repetitions per session, 1–2 sessions daily; can also be done as a 1-minute reset.
- **Cautions:** A 2020 study (cited by Cleveland Clinic) found Lion's Breath was "excessively stimulating and disorienting" for some users with chronic pain. Avoid with severe jaw/TMJ issues. Practice somewhere private — most users feel self-conscious.

### 11. Physiological Sigh / Cyclic Sighing
- **Description:** A double nasal inhale (one full inhale, then a second shorter inhale layered on top to maximally inflate the alveoli) followed by a long, slow, extended exhale through the mouth. The pattern mimics the body's spontaneous sigh reflex. Per Li et al. (Nature 530:293–297, 2016), the sigh circuit involves NMB- and GRP-receptor-expressing cells in the preBötzinger Complex (the respiratory rhythm generator), with upstream peptide-releasing neurons in the retrotrapezoid nucleus/parafacial respiratory group projecting to "NMB and GRP receptors in overlapping subsets of ~200 neurons" (Nature abstract verbatim). Popularized as a stress tool by Stanford neuroscientist Andrew Huberman.
- **Phase breakdown (timer-ready):**
  - **Acute reset (1–3 breaths):** Inhale (nose) 3s, Second inhale (nose, sharp top-up) 1s, Exhale (mouth, extended) 8s — repeat 1–3 times.
  - **Cyclic sighing (daily practice):** Same pattern repeated continuously for **5 minutes**, ~5.5 breaths/min, inhale:exhale ratio ≈1:2 (per the Balban et al. 2023 protocol in *Cell Reports Medicine*).
- **Benefits:** Fastest known voluntary technique to reduce acute stress; reinflates collapsed alveoli; offloads CO₂. Balban et al. (*Cell Reports Medicine*, Jan 17 2023, doi:10.1016/j.xcrm.2022.100895) randomized 108 participants (30 cyclic sighing, 21 box breathing, 33 cyclic hyperventilation, 24 mindfulness meditation) and reported cyclic sighing "produces greater improvement in mood (p<0.05) and reduction in respiratory rate (p<0.05) compared with mindfulness meditation," yielding the largest daily increase in PANAS positive affect of all four groups.
- **Difficulty:** Beginner.
- **Session length:** 1–3 sighs for acute relief; **5 minutes daily** for the evidence-based cyclic-sighing protocol.
- **Cautions:** Very safe. Mild lightheadedness possible if exhales become forceful. Avoid forcing if congested.

### 12. Diaphragmatic Breathing (Belly Breathing, Abdominal Breathing)
- **Description:** The foundational breath retraining technique taught by Cleveland Clinic, American Lung Association, and clinical psychology programs. Breathe so the belly rises on inhalation (diaphragm descending) and falls on exhalation, with minimal chest movement. One hand on chest, one on belly for biofeedback.
- **Phase breakdown (timer-ready):**
  - **Standard clinical (Cleveland Clinic):** Inhale (nose) 4s, Exhale (pursed lips) 6s — repeat. Exhale 1.5–2× the inhale.
  - **Equal-pace variant:** Inhale 4s, Exhale 4s — repeat.
- **Benefits:** Strengthens the diaphragm (80% of normal breathing work); reduces work of breathing; lowers heart rate and blood pressure; improves oxygenation; foundation for asthma and COPD self-management; activates parasympathetic / vagal tone.
- **Difficulty:** Beginner.
- **Session length:** **5–10 minutes, 3–4 times per day** (Cleveland Clinic guideline); ramp duration as the diaphragm strengthens. Many clinicians recommend twice-daily 10-minute sessions for habit formation.
- **Cautions:** Essentially none. Users with COPD should consult their pulmonologist before extended practice. Some anxiety-prone users may feel paradoxically more anxious when focusing on the breath — switch to a different anchor in that case.

## Recommendations

**Phase 1 — Launch with a "Foundations" tier (do these first):**
1. Box Breathing (4-4-4-4) — universal default.
2. Coherent Breathing (5.5s in / 5.5s out) — best evidence base.
3. 4-7-8 Breathing — sleep / anxiety hero feature.
4. Diaphragmatic Breathing — foundational skill builder.
5. Physiological Sigh / Cyclic Sighing — fastest acute reset + 5-min daily mode.

**Phase 2 — Add the yoga/pranayama tier:**

6. Ujjayi (4-6 or 5-5 nasal with throat sound).
7. Bhramari (4s in / 12–15s humming exhale).
8. Lion's Breath (4s in / 4–6s roar).
9. Sitali / Sitkari with both tongue-curl and teeth variants.

**Phase 3 — Advanced/gated tier (requires safety screen + onboarding):**

10. Wim Hof (30–40 power breaths + retention + 15s recovery × 3–4 rounds).
11. Kapalabhati (3 rounds × 20–108 breaths, paced 40–120 bpm).
12. Bhastrika (3 rounds × 10–60 equal-force breaths, paced 30–120 bpm).

**Implementation specifics:**
- **Build three timer engines:** (a) fixed-cycle counter for Box / 4-7-8 / Coherent / Diaphragmatic / Sitali / Bhramari; (b) breaths-per-minute metronome with round counter for Kapalabhati / Bhastrika / Wim Hof power-breaths; (c) free-duration timer for Ujjayi / Lion's / Diaphragmatic-extended.
- **Default cycle counts:** Box = 5–10 cycles or 1–5 min; 4-7-8 = exactly 4 cycles (lock to 4 for first 30 days, then unlock up to 8); Coherent = 10 min default, 20 min stretch; Bhramari = 5–7 cycles; Wim Hof = 3 rounds default, 4 rounds advanced.
- **Safety gating thresholds:** Require a first-time safety acknowledgement for Wim Hof, Kapalabhati, Bhastrika, and 4-7-8 at counts above 4 cycles. Add a "Pregnant?" and "High blood pressure?" filter that hides incompatible techniques from the default carousel.
- **Pair with biofeedback (if applicable):** Coherent Breathing is the natural integration point — pull HRV from Apple Watch / Whoop / Oura and visualize peak HRV during exhales.

**Thresholds that would change these recommendations:**
- If you target a clinical/medical population (cardiac rehab, asthma, anxiety disorders), drop Wim Hof, Kapalabhati, and Bhastrika entirely from the default library and lead with Diaphragmatic + Coherent + Pursed-Lip + 4-7-8.
- If your user base skews athletic/performance, promote Wim Hof and Bhastrika and add a "CO₂ tolerance" feature based on the Buteyko Control Pause (40+ seconds = healthy, <20 = over-breathing pattern).
- If onboarding analytics show >30% of users abandon at the first hold-phase, default new users to Coherent Breathing (no holds) rather than Box.

## Caveats

- **Phase-timing precision varies by lineage.** For pranayama techniques (Bhastrika, Kapalabhati, Bhramari, Ujjayi, Sitali), traditional texts (Hatha Yoga Pradipika, Gheranda Samhita) prescribe ratios rather than absolute counts. The seconds given here are practical defaults consistent with major modern sources (Banyan Botanicals, Yoga International, Art of Living, Sivananda lineage), but a yoga teacher in your user's tradition may use slightly different counts.
- **Wim Hof "30–40 breaths" is approximate.** Wim Hof's own current guidance (wimhofmethod.com) says "30 such breaths" per round; some sources say 30–40. Build the app to allow user-set values from 25 to 50.
- **Kapalabhati pace ranges widely.** Sources cite 40 bpm (beginner) to 120 bpm (advanced). The app should expose pace as a user-tunable parameter rather than locking a single rate.
- **Coherent Breathing's "5.5 bpm" is a population average.** Individual resonance frequency varies between 4.5 and 6.5 bpm; an advanced version of the app could include a 1-minute calibration session.
- **The Cyclic Sighing protocol's exact timing was audio-guided.** Balban et al. 2023 did not publish exact second-counts for inhale 1 / inhale 2 / exhale; the 3s + 1s + 8s decomposition here is derived from independent summaries and Huberman Lab podcast descriptions, not a verbatim methods quote. Treat as best-practice approximation.
- **The Ujjayi anxiety finding is not breath-specific.** Ray et al. 2023 in *Explore* found yoga reduced anxiety with or without the Ujjayi cue — credit the practice context, not the throat sound alone, when explaining benefits to users.
- **Contraindication lists vary by source.** The lists above pool conservative warnings from Banyan Botanicals, Art of Living, Cleveland Clinic, and Healthline. When in doubt, gate the technique behind a safety acknowledgement.
- **No technique here is a substitute for medical care.** Surface a brief in-app disclaimer for any user with diagnosed cardiovascular, respiratory, neurological, or psychiatric conditions to consult a clinician before regular practice of the advanced tier.