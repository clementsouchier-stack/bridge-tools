"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisStatus, AnalysisTag, MusicAnalysis } from "@bridge-tools/music-analysis";
import { analyzeMusicFile, isLiveAnalysisConfigured } from "../lib/music-analyzer-client";
import { demoAnalysis } from "../lib/demo-analysis";

type PitchChoice = "GENERAL" | "DSP" | "SUPERVISOR";

const accountUrl = process.env.NEXT_PUBLIC_BRIDGE_ACCOUNT_URL || "https://account.bridge.audio";

const processingCopy: Record<AnalysisStatus, string> = {
  idle: "Ready",
  uploading: "Uploading",
  queued: "Getting ready",
  analyzing: "Listening",
  complete: "Understood",
  error: "Something went wrong",
};

function names(tags?: AnalysisTag[]) {
  return (tags || []).map((tag) => tag.name);
}

function joinVocalAnalysis(analysis: MusicAnalysis) {
  return [
    ...names(analysis.vocals.type),
    ...names(analysis.vocals.dynamics),
    ...(analysis.vocals.language || []),
  ];
}

function buildGroups(analysis: MusicAnalysis) {
  const groups = [
    ["Genre", names(analysis.genre)],
    ["Mood", names(analysis.mood)],
    ["Vocals", joinVocalAnalysis(analysis)],
    ["Movement", names(analysis.movement)],
    ["Instruments", names(analysis.instruments)],
    ["Sound & Era", [...names(analysis.soundslike), ...names(analysis.fx)]],
    [
      "Lyrics & Themes",
      [...names(analysis.lyrics?.themes), ...names(analysis.lyrics?.imagery)],
    ],
  ] as const;

  return groups.filter(([, values]) => values.length > 0);
}

function Waveform({ active = false }: { active?: boolean }) {
  return (
    <div className={`waveform ${active ? "waveformActive" : ""}`} aria-hidden="true">
      {Array.from({ length: 72 }).map((_, index) => (
        <i key={index} style={{ height: `${16 + ((index * 29 + 11) % 70)}%` }} />
      ))}
    </div>
  );
}

export default function MusicAnalyzerPage() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [pitchOpen, setPitchOpen] = useState(false);
  const [pitchChoice, setPitchChoice] = useState<PitchChoice>("DSP");

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const displayName = useMemo(
    () => analysis?.track?.title || fileName.replace(/\.[^/.]+$/, "") || "Your track",
    [analysis?.track?.title, fileName],
  );

  const groups = useMemo(() => (analysis ? buildGroups(analysis) : []), [analysis]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  function setLocalAudio(file: File) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  }

  async function analyze(file?: File) {
    if (!file) return;

    setError("");
    setAnalysis(null);
    setFileName(file.name);
    setUploadProgress(0);
    setLocalAudio(file);

    try {
      const result = await analyzeMusicFile(file, {
        onStatus: setStatus,
        onUploadProgress: setUploadProgress,
      });
      setAnalysis(result);
      setStatus("complete");
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "Bridge could not analyze this track.");
    }
  }

  async function runDemo() {
    setError("");
    setFileName("Midnight Polaroid.wav");
    setAudioUrl(null);
    setAnalysis(null);
    setUploadProgress(1);
    setStatus("queued");
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setStatus("analyzing");
    await new Promise((resolve) => window.setTimeout(resolve, 1450));
    setAnalysis({
      ...demoAnalysis,
      track: { title: "Midnight Polaroid", artist: "Demo Artist" },
    });
    setStatus("complete");
  }

  function reset() {
    setStatus("idle");
    setAnalysis(null);
    setFileName("");
    setUploadProgress(0);
    setError("");
    setPitchOpen(false);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  async function togglePlayback() {
    if (!audioRef.current || !audioUrl) return;
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  const isProcessing = ["uploading", "queued", "analyzing"].includes(status);
  const progressPercent = status === "uploading" ? Math.round(uploadProgress * 100) : undefined;

  return (
    <main>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      <header className="shell header">
        <a className="brand" href="https://www.bridge.audio" aria-label="Bridge.audio home">
          <span className="brandMark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brandWord">Bridge.audio</span>
        </a>
        <div className="headerMeta">Music Analyzer</div>
        <a className="textButton" href={accountUrl}>Sign in</a>
      </header>

      <section className={`hero shell ${status !== "idle" ? "heroCompact" : ""}`}>
        <div className="eyebrow">BRIDGE MUSIC ANALYZER</div>
        <h1>Understand your music.<br />Really.</h1>
        <p className="lede">
          Drop a track. Bridge listens, understands and describes what makes it distinctive.
        </p>

        {status === "idle" && (
          <>
            <button
              className="dropzone"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void analyze(file);
              }}
            >
              <span className="uploadIcon" aria-hidden="true">＋</span>
              <span className="dropTitle">Drop an audio track</span>
              <span className="dropSub">or choose a file</span>
              <span className="formats">WAV · MP3 · AIFF</span>
            </button>
            <input
              ref={inputRef}
              className="hiddenInput"
              type="file"
              accept="audio/*,.wav,.mp3,.aiff,.aif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void analyze(file);
              }}
            />
            <button className="demoButton" onClick={() => void runDemo()}>
              No track nearby? Try a demo
            </button>
            <p className="privacyNote">Your first analysis is free. No account required.</p>
          </>
        )}
      </section>

      {isProcessing && (
        <section className="analysisState shell narrow" aria-live="polite">
          <div className="trackBar">
            <div className="trackIdentity">
              <span className="miniArtwork" aria-hidden="true" />
              <div>
                <strong>{displayName}</strong>
                <span>{processingCopy[status]}</span>
              </div>
            </div>
            <span className="statusValue">
              {progressPercent !== undefined ? `${progressPercent}%` : "Bridge AI"}
            </span>
          </div>
          <Waveform active />
          <div className="analysisNarrative">
            <div className="eyebrow">ANALYSIS IN PROGRESS</div>
            <h2>{status === "analyzing" ? "Listening." : processingCopy[status] + "."}</h2>
            <div className="progressList">
              {["Genre", "Mood", "Vocals", "Instruments", "Movement", "Sound"].map((item, index) => (
                <span key={item} style={{ animationDelay: `${index * 140}ms` }}>{item}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {status === "error" && (
        <section className="errorState shell narrow">
          <div className="eyebrow">WE COULDN'T FINISH THE ANALYSIS</div>
          <h2>Try another file.</h2>
          <p>{error}</p>
          <button className="primaryButton" onClick={reset}>Choose another track</button>
        </section>
      )}

      {status === "complete" && analysis && (
        <>
          <section className="results shell narrow">
            <div className="resultHeader">
              <div>
                <div className="eyebrow">UNDERSTOOD</div>
                <h2>{displayName}</h2>
                {analysis.track?.artist && <p className="artistName">{analysis.track.artist}</p>}
              </div>
              <button
                className="playButton"
                aria-label={isPlaying ? "Pause track" : "Play track"}
                onClick={() => void togglePlayback()}
                disabled={!audioUrl}
              >
                {isPlaying ? "Ⅱ" : "▶"}
              </button>
            </div>

            {audioUrl && <Waveform active={isPlaying} />}

            <div className="analysisGrid">
              {groups.map(([label, values]) => (
                <div className="resultRow" key={label}>
                  <h3>{label}</h3>
                  <div className="tags">
                    {values.map((value, index) => (
                      <span className={index === 0 ? "primaryTag" : ""} key={`${label}-${value}`}>
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {(analysis.musicalFeatures?.bpm || analysis.musicalFeatures?.key) && (
              <div className="metrics">
                {analysis.musicalFeatures?.bpm && (
                  <div><span>Tempo</span><strong>{analysis.musicalFeatures.bpm} BPM</strong></div>
                )}
                {analysis.musicalFeatures?.key && (
                  <div><span>Key</span><strong>{analysis.musicalFeatures.key}</strong></div>
                )}
              </div>
            )}
          </section>

          {analysis.summary && (
            <section className="statement shell narrow">
              <div className="eyebrow">IN A NUTSHELL</div>
              <p>{analysis.summary}</p>
            </section>
          )}

          <section className="continue shell narrow">
            <div className="eyebrow">NOW PUT IT TO WORK</div>
            <h2>Do more with this track.</h2>
            <p className="continueCopy">
              Turn the analysis into useful writing, keep it in your workspace, or keep exploring.
            </p>
            <div className="actions">
              <button className="primaryButton" onClick={() => setPitchOpen(true)}>Create a pitch</button>
              <a className="secondaryButton" href={accountUrl}>Save to Bridge</a>
              <button className="secondaryButton" onClick={reset}>Analyze another</button>
            </div>
          </section>
        </>
      )}

      <section className="seoIntro shell narrow">
        <div className="eyebrow">WHAT BRIDGE HEARS</div>
        <div className="seoColumns">
          <h2>More than a genre detector.</h2>
          <p>
            Bridge analyzes musical identity, mood, vocals, language, instruments, movement, sonic era,
            effects, lyrical themes and other descriptive signals — so a track becomes easier to understand,
            find and pitch.
          </p>
        </div>
      </section>

      <footer className="shell footer">
        <span>Bridge.audio</span>
        <span>Simplify. Amplify.</span>
      </footer>

      {pitchOpen && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setPitchOpen(false)}>
          <section
            className="pitchPanel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pitch-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="closeButton" aria-label="Close" onClick={() => setPitchOpen(false)}>×</button>
            <div className="eyebrow">CREATE A PITCH</div>
            <h2 id="pitch-title">Who is it for?</h2>
            <p>Bridge will reinterpret the same analysis for the right audience.</p>

            <div className="pitchChoices">
              {([
                ["DSP", "DSP", "Editorial positioning for streaming platforms."],
                ["SUPERVISOR", "Sync", "Emotion, scene and narrative function."],
                ["GENERAL", "General", "A sharp all-purpose description."],
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  className={pitchChoice === value ? "pitchChoice pitchChoiceActive" : "pitchChoice"}
                  onClick={() => setPitchChoice(value)}
                >
                  <span>{label}</span>
                  <small>{description}</small>
                </button>
              ))}
            </div>

            <div className="pitchGate">
              <p><strong>Your analysis is already done.</strong><br />Create a free Bridge account to generate, edit and save the pitch.</p>
              <a className="primaryButton" href={accountUrl}>Continue free with Bridge</a>
              <span>No credit card required.</span>
            </div>
          </section>
        </div>
      )}

      {!isLiveAnalysisConfigured && status === "complete" && (
        <div className="devBadge" title="Set NEXT_PUBLIC_MUSIC_ANALYZER_API_BASE_URL to use the Bridge backend">
          Prototype · simulated analysis
        </div>
      )}
    </main>
  );
}
