"use client";

import { Badge } from "@/components/ui/badge";
import { DATA } from "@/data/resume";
import { AnimatePresence, motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ===== STAR FIELD BACKGROUND =====
function StarField() {
  const [stars, setStars] = useState<Array<{id:number;x:number;y:number;delay:number;duration:number;opacity:number}>>([]);
  useEffect(() => {
    setStars(Array.from({length:80},(_,i)=>({
      id:i, x:Math.random()*100, y:Math.random()*100,
      delay:Math.random()*5, duration:Math.random()*4+2, opacity:Math.random()*0.6+0.2
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
    </div>
  );
}

// ===== BOOT SEQUENCE INTRO =====
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const bootLines = [
    "> INITIALIZING SYSTEM...",
    "> LOADING NEURAL CORES... OK",
    "> CONNECTING TO LLM NETWORK... OK",
    "> MOUNTING AI AGENTS... OK",
    "> LOADING PROFILE: VAIBHAV SRIVASTAVA",
    "> STATUS: ONLINE",
    "> WELCOME.",
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => { setDone(true); setTimeout(onComplete, 500); }, 600);
      }
    }, 200);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[hsl(220,15%,3%)] flex items-center justify-center"
      animate={done ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="font-mono text-sm max-w-lg w-full px-8">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className={line.includes("WELCOME") ? "neon-text mt-4 text-lg font-bold" : "text-[hsl(var(--muted-foreground))]"}
          >
            {line}
          </motion.div>
        ))}
        <motion.span
          className="inline-block w-2 h-4 bg-[var(--neon-cyan)] cursor-blink mt-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
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

// ===== STAT CARD (RPG style) =====
function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <motion.div
      className="neon-border rounded-lg p-4 bg-[hsl(var(--card))] hud-corners"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold neon-text-subtle" style={{color: 'var(--neon-cyan)'}}>{value}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground))] font-mono uppercase tracking-wider">{label}</div>
    </motion.div>
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
          className="neon-border rounded-lg overflow-hidden bg-[hsl(var(--card))] card-hover cursor-pointer group"
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
    <>
      <AnimatePresence>
        {!booted && <BootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>

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
                      <span className="neon-text">{DATA.name.split(" ")[0]}</span>{" "}
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

                {/* Stats row */}
                <motion.div
                  className="grid grid-cols-4 gap-3 pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <StatCard icon="&#x1f9e0;" label="Experience" value="4+ YRS" />
                  <StatCard icon="&#x1f680;" label="Projects" value={`${DATA.projects.length}+`} />
                  <StatCard icon="&#x2699;&#xfe0f;" label="Tech Stack" value={`${DATA.skills.length}+`} />
                  <StatCard icon="&#x1f3af;" label="Current Role" value="IT HEAD" />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ===== ABOUT ===== */}
          <Section id="about">
            <div className="mx-auto w-full max-w-2xl">
              <SectionHeader label="PROFILE" title="About" />
              <div className="neon-border rounded-lg p-5 bg-[hsl(var(--card))]">
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {DATA.summary.replace(/\*\*/g, '')}
                </p>
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
              <div className="neon-border rounded-lg p-5 bg-[hsl(var(--card))]">
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
                  <MissionCard key={project.title} project={project} index={i} />
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
                    className="font-mono text-sm px-6 py-2.5 rounded-lg border border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 transition-all"
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
    </>
  );
}
