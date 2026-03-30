"use client";

import { HackathonCard } from "@/components/hackathon-card";
import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { ProjectCard } from "@/components/project-card";
import { ResumeCard } from "@/components/resume-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DATA } from "@/data/resume";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

const BLUR_FADE_DELAY = 0.04;

// Floating particles background for the hero section
function FloatingParticles() {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>
  >([]);

  useEffect(() => {
    const generated = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 8,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="particle-dot"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Animated section wrapper with scroll-triggered entrance
function AnimatedSection({
  children,
  id,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  id: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      id={id}
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.section>
  );
}

// Typing effect component
function TypingText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && !started) {
      setStarted(true);
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 25);
      return () => clearInterval(interval);
    }
  }, [isInView, text, started]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] bg-foreground ml-0.5 align-text-bottom"
        />
      )}
    </span>
  );
}

export default function Page() {
  return (
    <main className="flex flex-col min-h-[100dvh] space-y-10 relative z-10">
      {/* Hero Section */}
      <section id="hero" className="relative">
        <FloatingParticles />
        <div className="mx-auto w-full max-w-2xl space-y-8 relative z-10">
          <div className="gap-2 flex justify-between">
            <div className="flex-col flex flex-1 space-y-1.5">
              <BlurFade delay={BLUR_FADE_DELAY}>
                <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none gradient-text">
                  Hi, I&apos;m {DATA.name.split(" ")[0]}
                </h1>
              </BlurFade>
              <BlurFade delay={BLUR_FADE_DELAY * 2}>
                <div className="max-w-[600px] md:text-xl text-muted-foreground">
                  <TypingText text={DATA.description} />
                </div>
              </BlurFade>
            </div>
            <BlurFade delay={BLUR_FADE_DELAY}>
              <motion.div
                className="animate-float"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full glow-ring animate-glow-pulse opacity-60" />
                  <Avatar className="size-28 border relative">
                    <AvatarImage alt={DATA.name} src={DATA.avatarUrl} />
                    <AvatarFallback>{DATA.initials}</AvatarFallback>
                  </Avatar>
                </div>
              </motion.div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* About Section */}
      <AnimatedSection id="about" delay={0.1}>
        <BlurFade delay={BLUR_FADE_DELAY * 3}>
          <h2 className="text-xl font-bold">About</h2>
        </BlurFade>
        <BlurFade delay={BLUR_FADE_DELAY * 4}>
          <motion.div
            className="glass rounded-lg p-4 mt-2 gradient-border"
            whileHover={{ scale: 1.005 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Markdown className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
              {DATA.summary}
            </Markdown>
          </motion.div>
        </BlurFade>
      </AnimatedSection>

      {/* Work Experience Section */}
      <AnimatedSection id="work" delay={0.1}>
        <div className="flex min-h-0 flex-col gap-y-3">
          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <h2 className="text-xl font-bold">Work Experience</h2>
          </BlurFade>
          {DATA.work.map((work, id) => (
            <BlurFade
              key={work.company}
              delay={BLUR_FADE_DELAY * 6 + id * 0.05}
            >
              <ResumeCard
                key={work.company}
                logoUrl={work.logoUrl}
                altText={work.company}
                title={work.company}
                subtitle={work.title}
                href={work.href}
                period={`${work.start} - ${work.end ?? "Present"}`}
                description={work.description}
              />
            </BlurFade>
          ))}
        </div>
      </AnimatedSection>

      {/* Education Section */}
      <AnimatedSection id="education" delay={0.1}>
        <div className="flex min-h-0 flex-col gap-y-3">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <h2 className="text-xl font-bold">Education</h2>
          </BlurFade>
          {DATA.education.map((education, id) => (
            <BlurFade
              key={education.school}
              delay={BLUR_FADE_DELAY * 8 + id * 0.05}
            >
              <ResumeCard
                key={education.school}
                href={education.href}
                logoUrl={education.logoUrl}
                altText={education.school}
                title={education.school}
                subtitle={education.degree}
                period={`${education.start} - ${education.end}`}
              />
            </BlurFade>
          ))}
        </div>
      </AnimatedSection>

      {/* Skills Section */}
      <AnimatedSection id="skills" delay={0.1}>
        <div className="flex min-h-0 flex-col gap-y-3">
          <BlurFade delay={BLUR_FADE_DELAY * 9}>
            <h2 className="text-xl font-bold">Skills</h2>
          </BlurFade>
          <div className="flex flex-wrap gap-1">
            {DATA.skills.map((skill, id) => (
              <BlurFade key={skill} delay={BLUR_FADE_DELAY * 10 + id * 0.05}>
                <motion.div
                  whileHover={{
                    scale: 1.1,
                    boxShadow: "0 0 12px hsl(var(--ring) / 0.2)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Badge
                    key={skill}
                    className="cursor-default transition-colors duration-200"
                  >
                    {skill}
                  </Badge>
                </motion.div>
              </BlurFade>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Projects Section */}
      <AnimatedSection id="projects" delay={0.1}>
        <div className="space-y-12 w-full py-12">
          <BlurFade delay={BLUR_FADE_DELAY * 11}>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <motion.div
                  className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  My Projects
                </motion.div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Check out my latest work
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI agents to digital civilizations — here&apos;s what
                  I&apos;ve been building.
                </p>
              </div>
            </div>
          </BlurFade>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
            {DATA.projects.map((project, id) => (
              <BlurFade
                key={project.title}
                delay={BLUR_FADE_DELAY * 12 + id * 0.05}
              >
                <ProjectCard
                  href={project.href}
                  link={project.href}
                  key={project.title}
                  title={project.title}
                  description={project.description}
                  tags={project.technologies}
                  image={project.image}
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Certifications Section */}
      <AnimatedSection id="hackathons" delay={0.1}>
        <div className="space-y-12 w-full py-12">
          <BlurFade delay={BLUR_FADE_DELAY * 13}>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                  Certifications
                </div>
              </div>
            </div>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 14}>
            <ul className="mb-4 ml-4 divide-y divide-dashed border-l">
              {DATA.certifications.map((project, id) => (
                <BlurFade
                  key={project.title + project.dates}
                  delay={BLUR_FADE_DELAY * 15 + id * 0.05}
                >
                  <HackathonCard
                    title={project.title}
                    description={project.description}
                    location={project.location}
                    dates={project.dates}
                    image={project.image}
                    links={project.links}
                  />
                </BlurFade>
              ))}
            </ul>
          </BlurFade>
        </div>
      </AnimatedSection>

      {/* Contact Section */}
      <AnimatedSection id="contact" delay={0.1}>
        <div className="grid items-center justify-center gap-4 px-4 text-center md:px-6 w-full py-12">
          <BlurFade delay={BLUR_FADE_DELAY * 16}>
            <motion.div
              className="space-y-3 gradient-border rounded-xl p-6 glass"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                Contact
              </div>
              <h2 className="text-2xl font-bold tracking-tighter sm:text-4xl">
                Get in Touch
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Want to connect? Feel free to send me a direct message{" "}
                <Link
                  href={DATA.contact.social.LinkedIn.url}
                  className="text-blue-500 animated-underline"
                >
                  on LinkedIn
                </Link>
                {" "}and I&apos;ll get back to you as soon as possible.
              </p>
            </motion.div>
          </BlurFade>
        </div>
      </AnimatedSection>
    </main>
  );
}
