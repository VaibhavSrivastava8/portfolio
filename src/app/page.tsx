"use client";

import { Badge } from "@/components/ui/badge";
import { DATA } from "@/data/resume";
import { AnimatePresence, motion, useInView, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ===== CUSTOM CURSOR (RAF-based for zero lag) =====
function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if ('ontouchstart' in window) { setIsTouch(true); return; }

    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { if (ringRef.current) ringRef.current.style.opacity = '0'; if (dotRef.current) dotRef.current.style.opacity = '0'; };
    const onEnter = () => { if (ringRef.current) ringRef.current.style.opacity = '1'; if (dotRef.current) dotRef.current.style.opacity = '1'; };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    let raf: number;
    const animate = () => {
      // Lerp ring toward mouse (smooth follow)
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 10}px, ${ringPos.current.y - 10}px)`;
      }
      // Dot snaps instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 2}px, ${mouse.current.y - 2}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div ref={ringRef} className="custom-cursor" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}

// ===== SCROLL PROGRESS INDICATOR =====
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(pct);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div className="scroll-progress" style={{ width: `${progress}%` }} />;
}

// ===== STAR FIELD BACKGROUND WITH METEORS =====
function StarField() {
  const [stars, setStars] = useState<Array<{id:number;x:number;y:number;delay:number;duration:number;opacity:number}>>([]);
  const [meteors, setMeteors] = useState<Array<{id:number;x:number;y:number;delay:number;duration:number}>>([]);
  useEffect(() => {
    setStars(Array.from({length:80},(_,i)=>({
      id:i, x:Math.random()*100, y:Math.random()*100,
      delay:Math.random()*5, duration:Math.random()*4+2, opacity:Math.random()*0.6+0.2
    })));
    setMeteors(Array.from({length:4},(_,i)=>({
      id:i, x:Math.random()*80+10, y:Math.random()*30,
      delay:Math.random()*12+i*5, duration:Math.random()*4+8
    })));
  },[]);
  return (
    <div className="starfield">
      {stars.map(s=>(
        <div key={s.id} className="star" style={{
          left:`${s.x}%`, top:`${s.y}%`,
          '--delay':`${s.delay}s`, '--duration':`${s.duration}s`, '--max-opacity':s.opacity
        } as React.CSSProperties} />
      ))}
      {meteors.map(m=>(
        <div key={`meteor-${m.id}`} className="meteor" style={{
          left:`${m.x}%`, top:`${m.y}%`,
          '--delay':`${m.delay}s`, '--duration':`${m.duration}s`
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ===== BOOT SEQUENCE INTRO =====
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const bootLines = [
    { text: "> INITIALIZING SYSTEM...", delay: 400 },
    { text: "> LOADING NEURAL CORES............ OK", delay: 600 },
    { text: "> ESTABLISHING SECURE CONNECTION.. OK", delay: 500 },
    { text: "> MOUNTING AI AGENTS.............. OK", delay: 700 },
    { text: "> SCANNING KNOWLEDGE BASE......... OK", delay: 500 },
    { text: "> COMPILING PORTFOLIO DATA........ OK", delay: 400 },
    { text: "> RENDERING INTERFACE............. OK", delay: 600 },
    { text: "> LOADING PROFILE: VAIBHAV SRIVASTAVA", delay: 500 },
    { text: "> STATUS: ALL SYSTEMS OPERATIONAL", delay: 400 },
    { text: "", delay: 300 },
    { text: "  WELCOME TO THE GRID.", delay: 0 },
  ];

  useEffect(() => {
    let i = 0;
    let cancelled = false;

    const showNext = () => {
      if (cancelled || i >= bootLines.length) {
        if (!cancelled) {
          setProgress(100);
          setTimeout(() => { setDone(true); setTimeout(onComplete, 600); }, 800);
        }
        return;
      }
      const entry = bootLines[i];
      i++;
      setLines(prev => [...prev, entry.text]);
      setProgress(Math.round((i / bootLines.length) * 100));
      setTimeout(showNext, entry.delay);
    };

    // Small initial pause so the screen is visible
    setTimeout(showNext, 500);
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[hsl(220,15%,3%)] flex items-center justify-center"
      animate={done ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="font-mono text-sm max-w-lg w-full px-8">
        <div className="mb-6">
          <span className="text-[10px] tracking-[0.3em] text-[hsl(var(--muted-foreground))]/50">VAIBHAV SRIVASTAVA // PORTFOLIO v2.0</span>
        </div>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.1 }}
            className={
              line && line.includes("WELCOME") ? "neon-text text-lg font-bold" :
              line && line.includes("STATUS") ? "text-[var(--neon-cyan)] mt-2" :
              "text-[hsl(var(--muted-foreground))]"
            }
          >
            {line}
          </motion.div>
        ))}
        {!done && (
          <motion.span
            className="inline-block w-2 h-4 bg-[var(--neon-cyan)] cursor-blink mt-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
        {/* Boot progress bar */}
        <div className="mt-8 boot-progress-track">
          <motion.div
            className="boot-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]/50 font-mono">LOADING SYSTEMS</span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--neon-cyan)' }}>{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}

// ===== ANIMATED SECTION =====
function Section({ children, id, className = "", delay = 0 }: { children: React.ReactNode; id: string; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      id={id} ref={ref} className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.section>
  );
}

// ===== SECTION HEADER (HUD style) =====
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="status-dot" />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--neon-cyan)]">{label}</span>
        <div className="flex-1 gradient-line" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}

// ===== GLITCH TEXT =====
function GlitchText({ text, className }: { text: string; className?: string }) {
  const [glitching, setGlitching] = useState(false);
  return (
    <span
      className={`relative inline-block ${className || ""}`}
      onMouseEnter={() => { setGlitching(true); setTimeout(() => setGlitching(false), 300); }}
    >
      <span className={glitching ? "glitch-active" : ""}>{text}</span>
      {glitching && (
        <>
          <span className="absolute inset-0 text-red-500/50 animate-glitch-1" aria-hidden="true">{text}</span>
          <span className="absolute inset-0 text-blue-500/50 animate-glitch-2" aria-hidden="true">{text}</span>
        </>
      )}
    </span>
  );
}

// ===== TYPING TEXT =====
function TypeWriter({ text, className, speed = 30 }: { text: string; className?: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (isInView && !started) {
      setStarted(true);
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
        else clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }
  }, [isInView, text, started, speed]);
  return (
    <span ref={ref} className={className}>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-[var(--neon-cyan)] ml-0.5 align-text-bottom cursor-blink" />
      )}
    </span>
  );
}

// ===== ANIMATED COUNTER =====
function AnimatedCounter({ value, suffix = "", duration = 1.5 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (isInView && !started) {
      setStarted(true);
      const startTime = Date.now();
      const durationMs = duration * 1000;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * value));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, value, started, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ===== SYSTEM STATUS PANEL (replaces emoji stat cards) =====
function SystemStatus() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(t);
    }
  }, [isInView]);

  const entries = [
    { key: "EXPERIENCE", val: "4+ years", color: "var(--neon-cyan)" },
    { key: "PROJECTS", val: `${DATA.projects.length} deployed`, color: "var(--neon-purple)" },
    { key: "TECH_STACK", val: `${DATA.skills.length} tools`, color: "var(--neon-blue)" },
    { key: "ROLE", val: "IT Head", color: "var(--neon-pink)" },
    { key: "LOCATION", val: "Ranchi, India", color: "var(--neon-cyan)" },
    { key: "STATUS", val: "Available for work", color: "#22c55e" },
  ];

  return (
    <div ref={ref} className="neon-border rounded-lg bg-[hsl(var(--card))] overflow-hidden hud-corners">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[hsl(var(--border))]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]/50 ml-2">system_status.sh</span>
      </div>
      {/* Terminal body */}
      <div className="p-4 font-mono text-xs space-y-1">
        <div className="text-[hsl(var(--muted-foreground))]/50 mb-2">$ cat /sys/profile/status</div>
        {entries.map((e, i) => (
          <motion.div
            key={e.key}
            initial={{ opacity: 0, x: -10 }}
            animate={visible ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.2 }}
            className="flex gap-2"
          >
            <span className="text-[hsl(var(--muted-foreground))]/40 select-none">&gt;</span>
            <span className="text-[hsl(var(--muted-foreground))]">{e.key}:</span>
            <span style={{ color: e.color }} className="neon-text-subtle">{e.val}</span>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-2 flex items-center gap-1"
        >
          <span className="text-[hsl(var(--muted-foreground))]/40">$</span>
          <span className="inline-block w-[6px] h-3 bg-[var(--neon-cyan)] cursor-blink" />
        </motion.div>
      </div>
    </div>
  );
}

// ===== RADAR COMPONENT =====
function Radar() {
  const blips = [
    { x: 30, y: 25, label: "AI" },
    { x: 70, y: 35, label: "Backend" },
    { x: 45, y: 70, label: "Frontend" },
    { x: 75, y: 65, label: "Infra" },
  ];
  return (
    <div className="radar flex-shrink-0">
      {/* Concentric rings */}
      <div className="radar-ring" style={{ width: '80%', height: '80%', top: '10%', left: '10%' }} />
      <div className="radar-ring" style={{ width: '50%', height: '50%', top: '25%', left: '25%' }} />
      {/* Crosshairs */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[rgba(0,255,204,0.08)]" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-[rgba(0,255,204,0.08)]" />
      {/* Blips */}
      {blips.map((b, i) => (
        <div
          key={i}
          className="radar-blip"
          style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${i * 1}s` }}
          title={b.label}
        />
      ))}
    </div>
  );
}

// ===== PROJECT CARD (Mission style) =====
function MissionCard({ project, index }: { project: typeof DATA.projects[number]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={project.href} target={project.href.startsWith("http") ? "_blank" : undefined}>
        <motion.div
          className="neon-border rounded-lg overflow-hidden bg-[hsl(var(--card))] card-hover cursor-none group"
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{ scale: 1.01 }}
        >
          {project.image && (
            <div className="relative h-44 overflow-hidden">
              <Image src={project.image} alt={project.title} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--card))] via-transparent to-transparent" />
              <motion.div
                className="absolute top-3 right-3 font-mono text-xs px-2 py-1 rounded bg-black/60 border border-[var(--neon-cyan)]/30"
                style={{ color: 'var(--neon-cyan)' }}
                animate={hovered ? { opacity: 1 } : { opacity: 0.7 }}
              >
                MISSION #{String(index + 1).padStart(2, '0')}
              </motion.div>
            </div>
          )}
          {!project.image && (
            <div className="h-20 flex items-center justify-center border-b border-[hsl(var(--border))]">
              <span className="font-mono text-xs" style={{color: 'var(--neon-cyan)', opacity: 0.5}}>
                [ MISSION #{String(index + 1).padStart(2, '0')} ]
              </span>
            </div>
          )}
          <div className="p-4">
            <h3 className="font-bold text-base mb-2 group-hover:text-[var(--neon-cyan)] transition-colors">{project.title}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed mb-3">{project.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map(tech => (
                <span key={tech} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] group-hover:border-[var(--neon-cyan)]/30 group-hover:text-[var(--neon-cyan)]/70 transition-colors">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ===== FEATURED PROJECT CARD =====
function FeaturedMissionCard({ project }: { project: typeof DATA.projects[number] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="sm:col-span-2"
    >
      <Link href={project.href} target={project.href.startsWith("http") ? "_blank" : undefined}>
        <div className="featured-border rounded-lg">
          <motion.div
            className="neon-border rounded-lg overflow-hidden bg-[hsl(var(--card))] card-hover cursor-none group"
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileHover={{ scale: 1.005 }}
          >
            {project.image && (
              <div className="relative h-64 overflow-hidden">
                <Image src={project.image} alt={project.title} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--card))] via-transparent to-transparent" />
                <motion.div
                  className="absolute top-3 right-3 font-mono text-xs px-2 py-1 rounded bg-black/60 border border-[var(--neon-cyan)]/30"
                  style={{ color: 'var(--neon-cyan)' }}
                  animate={hovered ? { opacity: 1 } : { opacity: 0.7 }}
                >
                  MISSION #01
                </motion.div>
                <div className="absolute top-3 left-3 font-mono text-[10px] px-3 py-1 rounded featured-badge border border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] uppercase tracking-widest font-bold">
                  Featured
                </div>
              </div>
            )}
            {!project.image && (
              <div className="h-32 flex items-center justify-center border-b border-[hsl(var(--border))] relative">
                <span className="font-mono text-xs" style={{color: 'var(--neon-cyan)', opacity: 0.5}}>
                  [ MISSION #01 ]
                </span>
                <div className="absolute top-3 left-3 font-mono text-[10px] px-3 py-1 rounded featured-badge border border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] uppercase tracking-widest font-bold">
                  Featured
                </div>
              </div>
            )}
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 group-hover:text-[var(--neon-cyan)] transition-colors">{project.title}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map(tech => (
                  <span key={tech} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] group-hover:border-[var(--neon-cyan)]/30 group-hover:text-[var(--neon-cyan)]/70 transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

// ===== EXPERIENCE CARD =====
function XPCard({ work, index }: { work: typeof DATA.work[number]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline line */}
      <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gradient-to-b from-[var(--neon-cyan)]/30 to-transparent" />

      <div className="flex gap-4">
        {/* Timeline dot */}
        <div className="relative z-10 mt-1.5">
          <motion.div
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: index === 0 ? 'var(--neon-cyan)' : 'hsl(var(--border))' }}
            whileHover={{ scale: 1.2 }}
          >
            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]' : 'bg-[hsl(var(--muted-foreground))]'}`} />
          </motion.div>
        </div>

        <div className="flex-1 pb-8">
          <button onClick={() => setOpen(!open)} className="w-full text-left">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm">{work.company}</h3>
                <p className="text-xs text-[var(--neon-cyan)]/70 font-mono">{work.title}</p>
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono whitespace-nowrap">
                {work.start} — {work.end}
              </span>
            </div>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">{work.description}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]/60 font-mono mt-1">{work.location}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ===== SKILL CATEGORY =====
function SkillGroup({ title, skills, color }: { title: string; skills: string[]; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="font-mono text-xs uppercase tracking-wider" style={{ color }}>{title}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, i) => (
          <motion.div
            key={skill}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ scale: 1.08, boxShadow: `0 0 12px ${color}33` }}
            className="text-xs font-mono px-3 py-1 rounded border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-foreground transition-all cursor-default"
          >
            {skill}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function Page() {
  const [booted, setBooted] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Skip boot if user has visited before in this session
    const visited = sessionStorage.getItem("portfolio-booted");
    if (visited) {
      setBooted(true);
      setShowContent(true);
    }
  }, []);

  const handleBootComplete = () => {
    setBooted(true);
    setShowContent(true);
    sessionStorage.setItem("portfolio-booted", "true");
  };

  return (
    <div className="noise-overlay">
      <AnimatePresence>
        {!booted && <BootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>

      <CustomCursor />
      <ScrollProgress />
      <StarField />
      <div className="grid-floor" />

      {showContent && (
        <main className="flex flex-col min-h-[100dvh] space-y-16 relative z-10">

          {/* ===== HERO ===== */}
          <section id="hero" className="pt-8">
            <div className="mx-auto w-full max-w-2xl">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Status bar */}
                <motion.div
                  className="flex items-center gap-2 font-mono text-xs text-[hsl(var(--muted-foreground))]"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="status-dot" />
                  <span>SYSTEM ONLINE</span>
                  <span className="mx-2 opacity-30">|</span>
                  <span>RANCHI, INDIA</span>
                  <span className="mx-2 opacity-30">|</span>
                  <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </motion.div>

                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-3">
                    <motion.h1
                      className="text-4xl sm:text-5xl font-bold tracking-tighter"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      <GlitchText text={DATA.name.split(" ")[0]} className="neon-text" />{" "}
                      <span className="text-foreground">{DATA.name.split(" ")[1]}</span>
                    </motion.h1>
                    <motion.div
                      className="text-lg text-[hsl(var(--muted-foreground))]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <TypeWriter text={DATA.description} speed={40} />
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="relative flex-shrink-0"
                  >
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-purple)]/20 blur-md" />
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--neon-cyan)]/30">
                      <Image src={DATA.avatarUrl} alt={DATA.name} fill className="object-cover" />
                    </div>
                  </motion.div>
                </div>

                {/* System Status Terminal */}
                <motion.div
                  className="pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <SystemStatus />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ===== ABOUT ===== */}
          <Section id="about">
            <div className="mx-auto w-full max-w-2xl">
              <SectionHeader label="PROFILE" title="About" />
              <div className="neon-border rounded-lg p-5 bg-[hsl(var(--card))] flex gap-5 items-start">
                <div className="flex-1">
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {DATA.summary.replace(/\*\*/g, '')}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <Radar />
                </div>
              </div>
            </div>
          </Section>

          {/* ===== EXPERIENCE ===== */}
          <Section id="work">
            <div className="mx-auto w-full max-w-2xl">
              <SectionHeader label="EXPERIENCE LOG" title="Work History" />
              <div className="space-y-0">
                {DATA.work.map((work, i) => (
                  <XPCard key={work.company} work={work} index={i} />
                ))}
              </div>
            </div>
          </Section>

          {/* ===== EDUCATION ===== */}
          <Section id="education">
            <div className="mx-auto w-full max-w-2xl">
              <SectionHeader label="TRAINING" title="Education" />
              <div className="space-y-3">
                {DATA.education.map((edu, i) => (
                  <motion.div
                    key={edu.school}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="neon-border rounded-lg p-4 bg-[hsl(var(--card))] flex items-center gap-4"
                  >
                    {edu.logoUrl && (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[hsl(var(--border))] flex-shrink-0 bg-white">
                        <Image src={edu.logoUrl} alt={edu.school} width={40} height={40} className="object-contain" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{edu.school}</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{edu.degree}</p>
                    </div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{edu.start}–{edu.end}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ===== SKILLS ===== */}
          <Section id="skills">
            <div className="mx-auto w-full max-w-2xl">
              <SectionHeader label="TECH TREE" title="Skills & Arsenal" />
              <div className="neon-border rounded-lg p-5 bg-[hsl(var(--card))] hex-pattern">
                <SkillGroup title="AI / LLM" skills={["LangChain", "RAG", "MCP", "LLM Orchestration", "AI Agents"]} color="var(--neon-cyan)" />
                <SkillGroup title="Backend" skills={["Python", "FastAPI", "Node.js", "NestJS", "Prisma", "SQLAlchemy"]} color="var(--neon-purple)" />
                <SkillGroup title="Frontend" skills={["TypeScript", "Next.js", "React.js", "Tailwind CSS"]} color="var(--neon-blue)" />
                <SkillGroup title="Mobile & Infra" skills={["Flutter", "PostgreSQL", "Redis", "Docker", "WebSockets", "Firebase", "Azure"]} color="var(--neon-pink)" />
              </div>
            </div>
          </Section>

          {/* ===== PROJECTS ===== */}
          <Section id="projects">
            <div className="mx-auto w-full max-w-2xl">
              <SectionHeader label="MISSIONS" title="Featured Projects" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DATA.projects.map((project, i) => (
                  i === 0 ? (
                    <FeaturedMissionCard key={project.title} project={project} />
                  ) : (
                    <MissionCard key={project.title} project={project} index={i} />
                  )
                ))}
              </div>
            </div>
          </Section>

          {/* ===== CERTIFICATIONS ===== */}
          <Section id="certs">
            <div className="mx-auto w-full max-w-2xl">
              <SectionHeader label="ACHIEVEMENTS" title="Certifications" />
              <div className="space-y-4">
                {DATA.certifications.map((cert, i) => (
                  <motion.div
                    key={cert.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={cert.links} target="_blank">
                      <div className="neon-border rounded-lg p-4 bg-[hsl(var(--card))] card-hover flex items-start gap-4 group">
                        {cert.image && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-[hsl(var(--border))] flex-shrink-0 bg-white p-1">
                            <Image src={cert.image} alt={cert.title} width={48} height={48} className="object-contain w-full h-full" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-sm group-hover:text-[var(--neon-cyan)] transition-colors">{cert.title}</h3>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{cert.provider} &middot; {cert.dates}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]/70 mt-1">{cert.description}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ===== CONTACT ===== */}
          <Section id="contact">
            <div className="mx-auto w-full max-w-2xl pb-24">
              <SectionHeader label="COMMS" title="Get In Touch" />
              <div className="neon-border rounded-lg p-8 bg-[hsl(var(--card))] text-center">
                <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">
                  Want to connect? Send me a direct message on LinkedIn.
                </p>
                <Link href={DATA.contact.social.LinkedIn.url} target="_blank">
                  <motion.button
                    className="font-mono text-sm px-6 py-2.5 rounded-lg border border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 transition-all neon-pulse-btn"
                    whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(0,255,204,0.15)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    OPEN CHANNEL &rarr;
                  </motion.button>
                </Link>
                <div className="flex items-center justify-center gap-4 mt-6">
                  {Object.entries(DATA.contact.social).map(([name, social]) => (
                    <Link key={name} href={social.url} target="_blank" className="text-[hsl(var(--muted-foreground))] hover:text-[var(--neon-cyan)] transition-colors">
                      <social.icon className="w-5 h-5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </main>
      )}
    </div>
  );
}
