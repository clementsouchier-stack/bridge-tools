"use client";

import { useMemo, useRef, useState } from "react";

type Stage = "idle" | "analyzing" | "complete";

const demo = {
  genre: ["Alternative Pop", "Dream Pop", "Indie Pop"],
  mood: ["Dreamy", "Intimate", "Nostalgic", "Hopeful", "Ethereal"],
  vocals: ["Female Lead", "Soft", "Melodic", "English"],
  movement: ["Building", "Floating", "Linear"],
  instruments: ["Analog Synth", "Electric Guitar", "Bass", "Drum Machine"],
  sound: ["Sounds 80s", "Modern Production"],
  themes: ["Love", "Separation", "Youth", "Nostalgia"],
  bpm: "118 BPM",
  key: "D minor",
};

const groups = [
  ["Genre", demo.genre],
  ["Mood", demo.mood],
  ["Vocals", demo.vocals],
  ["Movement", demo.movement],
  ["Instruments", demo.instruments],
  ["Sound & Era", demo.sound],
  ["Lyrics & Themes", demo.themes],
] as const;

export default function MusicAnalyzerPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = useMemo(
    () => fileName.replace(/\.[^/.]+$/, "") || "Your track",
    [fileName],
  );

  function analyze(file?: File) {
    if (file) setFileName(file.name);
    setStage("analyzing");
    window.setTimeout(() => setStage("complete"), 1800);
  }

  return (
    <main>
      <header className="shell header">
        <a className="brand" href="https://bridge.audio" aria-label="Bridge.audio">
          Bridge<span>.audio</span>
        </a>
        <div className="headerMeta">Music Analyzer</div>
        <button className="textButton">Sign in</button>
      </header>

      <section className={`hero shell ${stage !== "idle" ? "heroCompact" : ""}`}>
        <div className="eyebrow">BRIDGE MUSIC ANALYZER</div>
        <h1>Understand your music.<br />Really.</h1>
        <p className="lede">
          Drop a track. Bridge listens, understands and describes what makes it unique.
        </p>

        {stage === "idle" && (
          <>
            <button
              className="dropzone"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                analyze(event.dataTransfer.files[0]);
              }}
            >
              <span className="dropTitle">Drop a track here</span>
              <span className="dropSub">or choose a file</span>
              <span className="formats">WAV · MP3 · AIFF</span>
            </button>
            <input
              ref={inputRef}
              className="hiddenInput"
              type="file"
              accept="audio/*,.wav,.aiff"
              onChange={(event) => analyze(event.target.files?.[0])}
            />
            <button className="demoButton" onClick={() => analyze()}>
              Try with a demo track
            </button>
          </>
        )}
      </section>

      {stage === "analyzing" && (
        <section className="analysisState shell narrow">
          <div className="trackLine">
            <span>{displayName}</span><span>Analyzing</span>
          </div>
          <div className="wave" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, index) => (
              <i key={index} style={{ height: `${18 + ((index * 17) % 62)}%` }} />
            ))}
          </div>
          <h2>Listening.</h2>
          <div className="progressList">
            {['Genre', 'Mood', 'Vocals', 'Instruments', 'Movement', 'Sound'].map((item, index) => (
              <span key={item} style={{ animationDelay: `${index * 150}ms` }}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {stage === "complete" && (
        <>
          <section className="results shell narrow">
            <div className="resultHeader">
              <div>
                <div className="eyebrow">UNDERSTOOD</div>
                <h2>{displayName}</h2>
              </div>
              <button className="circleButton" aria-label="Play">▶</button>
            </div>

            {groups.map(([label, values]) => (
              <div className="resultRow" key={label}>
                <h3>{label}</h3>
                <div className="tags">
                  {values.map((value, index) => (
                    <span className={index === 0 ? "primaryTag" : ""} key={value}>{value}</span>
                  ))}
                </div>
              </div>
            ))}

            <div className="resultRow metrics">
              <div><h3>Tempo</h3><strong>{demo.bpm}</strong></div>
              <div><h3>Key</h3><strong>{demo.key}</strong></div>
            </div>
          </section>

          <section className="statement shell narrow">
            <div className="eyebrow">IN A NUTSHELL</div>
            <p>
              A dreamy, nostalgic indie-pop track carried by intimate vocals, atmospheric synths and a gradual cinematic build.
            </p>
          </section>

          <section className="continue shell narrow">
            <div className="eyebrow">NOW PUT IT TO WORK</div>
            <h2>Do more with this track.</h2>
            <div className="actions">
              <button className="primaryButton">Create a pitch</button>
              <button className="secondaryButton">Save to Bridge</button>
              <button className="secondaryButton" onClick={() => setStage("idle")}>Analyze another</button>
            </div>
          </section>
        </>
      )}

      <footer className="shell footer">Bridge.audio — Simplify. Amplify.</footer>
    </main>
  );
}
