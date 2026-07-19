import React, { useState, useEffect } from "react";
import { Calculator, Heart, Brain, Flame, FileText, RefreshCw } from "lucide-react";

export default function MedicalQRF() {
  // LBS to KG
  const [lbs, setLbs] = useState<string>("");
  const [kg, setKg] = useState<string>("0.00");

  useEffect(() => {
    const val = parseFloat(lbs);
    if (!isNaN(val) && val > 0) {
      setKg((val * 0.45359237).toFixed(2));
    } else {
      setKg("0.00");
    }
  }, [lbs]);

  // FT to IN
  const [feet, setFeet] = useState<string>("");
  const [inchesInput, setInchesInput] = useState<string>("");
  const [totalInches, setTotalInches] = useState<number>(0);
  const [cm, setCm] = useState<string>("0.00");

  useEffect(() => {
    const f = parseInt(feet) || 0;
    const i = parseInt(inchesInput) || 0;
    const total = f * 12 + i;
    setTotalInches(total);
    if (total > 0) {
      setCm((total * 2.54).toFixed(1));
    } else {
      setCm("0.00");
    }
  }, [feet, inchesInput]);

  // APGAR Scale
  const [apgar, setApgar] = useState({
    appearance: 2,
    pulse: 2,
    grimace: 2,
    activity: 2,
    respiration: 2,
  });

  const getApgarScore = () => {
    return apgar.appearance + apgar.pulse + apgar.grimace + apgar.activity + apgar.respiration;
  };

  const getApgarInterpretation = (score: number) => {
    if (score >= 7) return { text: "Normal / Excellent condition", color: "text-emerald-800 bg-emerald-50 border-emerald-200" };
    if (score >= 4) return { text: "Moderately Depressed - requires stimulation/oxygen", color: "text-amber-800 bg-amber-50 border-amber-200" };
    return { text: "Severely Depressed / Critical - Immediate resuscitation required", color: "text-red-800 bg-red-50 border-red-200" };
  };

  // GCS Scale
  const [gcs, setGcs] = useState({
    eye: 4,
    verbal: 5,
    motor: 6,
  });

  const getGcsScore = () => {
    return gcs.eye + gcs.verbal + gcs.motor;
  };

  const getGcsInterpretation = (score: number) => {
    if (score >= 13) return { text: "Mild Head Injury / Fully Oriented", color: "text-emerald-800 bg-emerald-50 border-emerald-200" };
    if (score >= 9) return { text: "Moderate Head Injury", color: "text-amber-800 bg-amber-50 border-amber-200" };
    return { text: "Severe Head Injury / Coma (GCS ≤ 8 Intubate!)", color: "text-red-800 bg-red-50 border-red-200" };
  };

  // RACE Scale (Stroke)
  const [race, setRace] = useState({
    facialPalsy: 0,
    armMotor: 0,
    legMotor: 0,
    gazeDev: 0,
    aphasiaAgnosia: 0, // Aphasia or Agnosia based on weakness side
  });

  const getRaceScore = () => {
    return race.facialPalsy + race.armMotor + race.legMotor + race.gazeDev + race.aphasiaAgnosia;
  };

  const getRaceInterpretation = (score: number) => {
    if (score >= 5) return { text: "RACE Score ≥ 5: High suspicion of Large Vessel Occlusion (LVO). Bypass to Endovascular Stroke Center.", color: "text-red-800 bg-red-50 border-red-200" };
    return { text: "RACE Score < 5: Lower risk of LVO. Transport to nearest primary stroke center.", color: "text-blue-800 bg-blue-50 border-blue-200" };
  };

  // Rule of 9s
  const [burnRegions, setBurnRegions] = useState<{ [key: string]: { name: string; pct: number; active: boolean } }>({
    head: { name: "Head & Neck", pct: 9, active: false },
    chest: { name: "Anterior Torso (Chest)", pct: 9, active: false },
    abdomen: { name: "Anterior Torso (Abdomen)", pct: 9, active: false },
    upperBack: { name: "Posterior Torso (Upper Back)", pct: 9, active: false },
    lowerBack: { name: "Posterior Torso (Lower Back)", pct: 9, active: false },
    leftArm: { name: "Left Arm (Entire)", pct: 9, active: false },
    rightArm: { name: "Right Arm (Entire)", pct: 9, active: false },
    leftLegAnt: { name: "Left Leg (Anterior)", pct: 9, active: false },
    leftLegPost: { name: "Left Leg (Posterior)", pct: 9, active: false },
    rightLegAnt: { name: "Right Leg (Anterior)", pct: 9, active: false },
    rightLegPost: { name: "Right Leg (Posterior)", pct: 9, active: false },
    perineum: { name: "Perineum / Genitals", pct: 1, active: false },
  });

  const toggleBurnRegion = (key: string) => {
    setBurnRegions((prev) => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active },
    }));
  };

  const getBurnTotal = () => {
    return Object.keys(burnRegions)
      .filter((key) => burnRegions[key].active)
      .reduce((sum, key) => sum + burnRegions[key].pct, 0);
  };

  const resetBurnRegions = () => {
    setBurnRegions((prev) => {
      const reset = { ...prev };
      Object.keys(reset).forEach((k) => (reset[k].active = false));
      return reset;
    });
  };

  // Notepad State
  const [notepad, setNotepad] = useState<string>(() => {
    return localStorage.getItem("sfga_ems_notepad") || "";
  });

  useEffect(() => {
    localStorage.setItem("sfga_ems_notepad", notepad);
  }, [notepad]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title block */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-red-650" />
          Clinical QRF (Quick Reference Guide)
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Interactive calculations, trauma scores, and on-the-fly pediatric vitals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - Quick Calculators & Scales (GCS, APGAR, RACE) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Unit Converter Widget */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-900" />
              Weight & Length Converters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LBS to KG */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded">
                <span className="text-xs text-slate-500 font-mono block mb-2 uppercase font-semibold">Pounds (lbs) to Kilograms (kg)</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={lbs}
                    onChange={(e) => setLbs(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-1/2 px-3 py-2 bg-white border border-slate-200 text-slate-850 rounded font-mono focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  />
                  <span className="text-slate-400 font-bold">&rarr;</span>
                  <div className="w-1/2 bg-slate-100 px-3 py-2 border border-slate-200 text-slate-900 font-mono font-bold rounded">
                    {kg} <span className="text-xs text-slate-500 font-normal">kg</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-2">Dosing formula: (lbs ÷ 2.2046) = kg</p>
              </div>

              {/* FT to IN */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded">
                <span className="text-xs text-slate-500 font-mono block mb-2 uppercase font-semibold">Height: Feet & Inches to Cm</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Ft"
                    value={feet}
                    onChange={(e) => setFeet(e.target.value)}
                    className="w-1/4 px-2 py-2 bg-white border border-slate-200 text-slate-850 rounded font-mono text-center focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  />
                  <span className="text-xs text-slate-400 font-mono">ft</span>
                  <input
                    type="number"
                    placeholder="In"
                    value={inchesInput}
                    onChange={(e) => setInchesInput(e.target.value)}
                    className="w-1/4 px-2 py-2 bg-white border border-slate-200 text-slate-850 rounded font-mono text-center focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  />
                  <span className="text-xs text-slate-400 font-mono">in</span>
                  <span className="text-slate-400 font-bold">&rarr;</span>
                  <div className="w-1/3 bg-slate-100 px-3 py-2 border border-slate-200 text-slate-900 font-mono font-bold rounded text-center">
                    {cm} <span className="text-[10px] text-slate-550 font-normal">cm</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-2">Total: {totalInches} inches | 1 inch = 2.54 cm</p>
              </div>
            </div>
          </div>

          {/* GCS Calculator */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-900" />
                Glasgow Coma Scale (GCS)
              </h3>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded text-blue-900 font-mono font-bold text-lg">
                Score: {getGcsScore()}
              </div>
            </div>

            <div className={`border p-3 rounded text-xs font-semibold mb-5 transition-all ${getGcsInterpretation(getGcsScore()).color}`}>
              {getGcsInterpretation(getGcsScore()).text}
            </div>

            <div className="space-y-4">
              {/* Eye Opening */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-2">Eye Opening (E)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 4, name: "Spontaneous (4)" },
                    { val: 3, name: "To Voice (3)" },
                    { val: 2, name: "To Pain (2)" },
                    { val: 1, name: "None (1)" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setGcs((prev) => ({ ...prev, eye: o.val }))}
                      className={`py-2 px-1 text-center rounded text-xs border cursor-pointer font-mono transition-all ${
                        gcs.eye === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verbal Response */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-2">Verbal Response (V)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { val: 5, name: "Oriented (5)" },
                    { val: 4, name: "Confused (4)" },
                    { val: 3, name: "Inapprop. (3)" },
                    { val: 2, name: "Incompreh. (2)" },
                    { val: 1, name: "None (1)" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setGcs((prev) => ({ ...prev, verbal: o.val }))}
                      className={`py-2 px-1 text-center rounded text-xs border cursor-pointer font-mono transition-all ${
                        gcs.verbal === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motor Response */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-2">Motor Response (M)</span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                  {[
                    { val: 6, name: "Obeys (6)" },
                    { val: 5, name: "Localizes (5)" },
                    { val: 4, name: "Withdraws (4)" },
                    { val: 3, name: "Flexion (3)" },
                    { val: 2, name: "Extension (2)" },
                    { val: 1, name: "None (1)" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setGcs((prev) => ({ ...prev, motor: o.val }))}
                      className={`py-2 px-1 text-center rounded text-[10px] border cursor-pointer font-mono transition-all ${
                        gcs.motor === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* APGAR Scale Calculator */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-650" />
                APGAR Newborn Assessment Scale
              </h3>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded text-blue-900 font-mono font-bold text-lg">
                Score: {getApgarScore()} / 10
              </div>
            </div>

            <div className={`border p-3 rounded text-xs font-semibold mb-5 transition-all ${getApgarInterpretation(getApgarScore()).color}`}>
              {getApgarInterpretation(getApgarScore()).text}
            </div>

            <div className="space-y-4">
              {/* Appearance */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1.5">Appearance (Skin Color)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: 0, name: "0: Completely Blue or Pale" },
                    { val: 1, name: "1: Pink body, Blue hands/feet" },
                    { val: 2, name: "2: Completely Pink / Normal" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setApgar((prev) => ({ ...prev, appearance: o.val }))}
                      className={`p-2 rounded text-xs border cursor-pointer font-mono text-left transition-all ${
                        apgar.appearance === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pulse */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1.5">Pulse (Heart Rate)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: 0, name: "0: Absent / No pulse" },
                    { val: 1, name: "1: Slow (<100 bpm)" },
                    { val: 2, name: "2: Normal (≥100 bpm)" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setApgar((prev) => ({ ...prev, pulse: o.val }))}
                      className={`p-2 rounded text-xs border cursor-pointer font-mono text-left transition-all ${
                        apgar.pulse === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grimace */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1.5">Grimace (Reflex Irritability)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: 0, name: "0: No Response to stimulation" },
                    { val: 1, name: "1: Grimace / Feeble response" },
                    { val: 2, name: "2: Cry, Sneeze, Cough, Pull-away" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setApgar((prev) => ({ ...prev, grimace: o.val }))}
                      className={`p-2 rounded text-xs border cursor-pointer font-mono text-left transition-all ${
                        apgar.grimace === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1.5">Activity (Muscle Tone)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: 0, name: "0: Flaccid / Limp" },
                    { val: 1, name: "1: Some flexion of extremities" },
                    { val: 2, name: "2: Active motion" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setApgar((prev) => ({ ...prev, activity: o.val }))}
                      className={`p-2 rounded text-xs border cursor-pointer font-mono text-left transition-all ${
                        apgar.activity === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Respiration */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1.5">Respiration (Breathing Effort)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: 0, name: "0: Absent / Not breathing" },
                    { val: 1, name: "1: Weak, slow, irregular" },
                    { val: 2, name: "2: Strong / Vigorous Cry" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      onClick={() => setApgar((prev) => ({ ...prev, respiration: o.val }))}
                      className={`p-2 rounded text-xs border cursor-pointer font-mono text-left transition-all ${
                        apgar.respiration === o.val
                          ? "bg-blue-900 border-blue-900 text-white font-bold shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RACE Scale (Stroke Severity) */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-900" />
                RACE Stroke Scale
              </h3>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded text-blue-900 font-mono font-bold text-lg">
                Score: {getRaceScore()} / 9
              </div>
            </div>

            <div className={`border p-3 rounded text-xs font-semibold mb-5 transition-all ${getRaceInterpretation(getRaceScore()).color}`}>
              {getRaceInterpretation(getRaceScore()).text}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Facial Palsy */}
                <div>
                  <span className="text-xs text-slate-500 font-mono font-semibold block mb-1.5">Facial Palsy (0-2)</span>
                  <select
                    value={race.facialPalsy}
                    onChange={(e) => setRace(p => ({ ...p, facialPalsy: parseInt(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                  >
                    <option value="0">0: Normal / Symmetrical</option>
                    <option value="1">1: Mild / Slight asymmetry</option>
                    <option value="2">2: Moderate to Severe / Complete paralysis</option>
                  </select>
                </div>

                {/* Arm Motor Impairment */}
                <div>
                  <span className="text-xs text-slate-500 font-mono font-semibold block mb-1.5">Arm Motor Drift (0-2)</span>
                  <select
                    value={race.armMotor}
                    onChange={(e) => setRace(p => ({ ...p, armMotor: parseInt(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                  >
                    <option value="0">0: Holds arm for 10 seconds without drift</option>
                    <option value="1">1: Drifts down before 10 seconds</option>
                    <option value="2">2: Immediate drift, falls, or no effort</option>
                  </select>
                </div>

                {/* Leg Motor Impairment */}
                <div>
                  <span className="text-xs text-slate-500 font-mono font-semibold block mb-1.5">Leg Motor Drift (0-2)</span>
                  <select
                    value={race.legMotor}
                    onChange={(e) => setRace(p => ({ ...p, legMotor: parseInt(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                  >
                    <option value="0">0: Holds leg for 5 seconds without drift</option>
                    <option value="1">1: Drifts down before 5 seconds</option>
                    <option value="2">2: Immediate drift, falls, or no effort</option>
                  </select>
                </div>

                {/* Gaze Deviation */}
                <div>
                  <span className="text-xs text-slate-500 font-mono font-semibold block mb-1.5">Gaze Deviation (0-1)</span>
                  <select
                    value={race.gazeDev}
                    onChange={(e) => setRace(p => ({ ...p, gazeDev: parseInt(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                  >
                    <option value="0">0: Absent / Normal eye movement</option>
                    <option value="1">1: Present / Eyes deviated to one side</option>
                  </select>
                </div>
              </div>

              {/* Aphasia / Agnosia */}
              <div>
                <span className="text-xs text-slate-500 font-mono font-semibold block mb-1.5">Cortical Symptoms (0-2)</span>
                <p className="text-[10px] text-slate-500 mb-1">
                  - If Right-side weakness: test Aphasia (cannot follow simple commands: "Close eyes", "Make fist").<br />
                  - If Left-side weakness: test Agnosia (ask "Whose arm is this?" or "Can you clap?").
                </p>
                <select
                  value={race.aphasiaAgnosia}
                  onChange={(e) => setRace(p => ({ ...p, aphasiaAgnosia: parseInt(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                >
                  <option value="0">0: Normal / No deficits</option>
                  <option value="1">1: Moderate / Performs 1 of 2 commands, or ignores 1 side</option>
                  <option value="2">2: Severe / Performs 0 commands, or completely denies own limb</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Rule of 9s, Pediatric Vitals, Shift Notes */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Rule of 9s Burn Estimation */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                Rule of 9s Burn Area
              </h3>
              <div className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded text-blue-900 font-mono font-bold">
                TBSA: {getBurnTotal()}%
              </div>
            </div>

            <div className="text-[11px] text-slate-500 mb-4 leading-normal font-medium">
              Click body sections to tally the estimated Total Body Surface Area (TBSA) burned. Useful for Parkland Fluid Resuscitation calculations.
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {Object.keys(burnRegions).map((key) => {
                const item = burnRegions[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleBurnRegion(key)}
                    className={`w-full flex justify-between items-center px-3 py-2 text-xs rounded border transition-all cursor-pointer ${
                      item.active
                        ? "bg-blue-900 border-blue-900 text-white font-semibold"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="font-sans">{item.name}</span>
                    <span className="font-mono font-bold text-xs">+{item.pct}%</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={resetBurnRegions}
              className="mt-4 w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs py-2 rounded transition-colors font-semibold cursor-pointer"
            >
              Clear Tally
            </button>
          </div>

          {/* Pediatric Vital Signs */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Heart className="w-4.5 h-4.5 text-red-650 animate-pulse" />
              Pediatric Vital Signs Reference
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono font-semibold">
                    <th className="pb-1.5 font-bold">Age Group</th>
                    <th className="pb-1.5 font-bold">HR (BPM)</th>
                    <th className="pb-1.5 font-bold">RR (BPM)</th>
                    <th className="pb-1.5 font-bold">SBP (mmHg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  <tr>
                    <td className="py-2 text-slate-800 font-sans font-semibold">Neonate (0-28 d)</td>
                    <td className="py-2">100 - 205</td>
                    <td className="py-2">30 - 60</td>
                    <td className="py-2">60 - 80</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-800 font-sans font-semibold">Infant (1-12 m)</td>
                    <td className="py-2">100 - 180</td>
                    <td className="py-2">30 - 53</td>
                    <td className="py-2">72 - 104</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-800 font-sans font-semibold">Toddler (1-2 y)</td>
                    <td className="py-2">98 - 140</td>
                    <td className="py-2">22 - 37</td>
                    <td className="py-2">86 - 106</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-800 font-sans font-semibold">Preschool (3-5 y)</td>
                    <td className="py-2">80 - 120</td>
                    <td className="py-2">20 - 28</td>
                    <td className="py-2">89 - 112</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-800 font-sans font-semibold">School Age (6-11 y)</td>
                    <td className="py-2">75 - 118</td>
                    <td className="py-2">18 - 25</td>
                    <td className="py-2">97 - 115</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-800 font-sans font-semibold">Adolescent (12+ y)</td>
                    <td className="py-2">60 - 100</td>
                    <td className="py-2">12 - 20</td>
                    <td className="py-2">110 - 131</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Persistent Notepad */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
            <h3 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-blue-900" />
              Scratchpad (Shift Notes)
            </h3>
            <textarea
              value={notepad}
              onChange={(e) => setNotepad(e.target.value)}
              placeholder="Write down patient vitals, shift reports, or codes to remember. This data will persist in your local browser storage."
              rows={6}
              className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-sans leading-relaxed shadow-inner"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-slate-500 font-mono">Autosaved to LocalStorage</span>
              <button
                onClick={() => setNotepad("")}
                className="text-[10px] text-red-650 hover:text-red-550 transition-colors uppercase font-bold font-mono cursor-pointer"
              >
                Clear Notes
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
