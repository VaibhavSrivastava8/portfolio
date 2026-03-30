import { Icons } from "@/components/icons";
import { HomeIcon } from "lucide-react";

export const DATA = {
  name: "Vaibhav Srivastava",
  initials: "VS",
  url: "https://vaibhav-srivastava.vercel.app",
  location: "Ranchi, India",
  locationLink: "https://www.google.com/maps/place/ranchi",
  description: "AI/LLM Engineer & Full Stack Developer",
  summary:
    "I build intelligent systems that think, adapt, and scale. From architecting **AI agent pipelines** with LangChain and RAG to designing **emergent digital civilizations** powered by LLMs — I work at the intersection of artificial intelligence and full-stack engineering. Currently leading IT & software infrastructure at The Guardian Chronicle, with 4+ years of experience shipping production systems across **Python, TypeScript, Flutter, and cloud platforms**.",
  avatarUrl: "/me.jpeg",
  skills: [
    "LangChain",
    "RAG",
    "MCP",
    "LLM Orchestration",
    "AI Agents",
    "Python",
    "TypeScript",
    "FastAPI",
    "Next.js",
    "React.js",
    "Node.js",
    "Flutter",
    "PostgreSQL",
    "Redis",
    "Docker",
    "WebSockets",
    "SQLAlchemy",
    "Tailwind CSS",
    "Firebase",
    "Azure",
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
  ],
  contact: {
    email: "vaibhavjeet19@gmail.com",
    tel: "+917903274032",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/VaibhavJeet",
        icon: Icons.github,
        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/vaibhavjeet",
        icon: Icons.linkedin,
        navbar: true,
      },
    },
  },
  work: [
    {
      company: "The Guardian Chronicle",
      location: "Remote",
      title: "IT Head — Software, Infrastructure & Admin",
      start: "2025",
      end: "Present",
      description:
        "Managing complete IT operations including software development, infrastructure, and administration. Overseeing tech strategy, system architecture, and team workflows across the organization.",
      href: "",
      logoUrl: "",
    },
    {
      company: "Jaiinfoway",
      location: "Ranchi, India",
      title: "Software Development Engineer",
      start: "Oct 2025",
      end: "Dec 2025",
      description:
        "Built AI-driven applications using LangChain, RAG, MCP, and Strands Agents. Created Node.js microservices, integrated LLM workflows, and automated pipelines with custom agent architectures.",
      href: "",
      logoUrl: "",
    },
    {
      company: "Techborn IT Solutions",
      location: "Bangalore, India",
      title: "Software Development Engineer",
      start: "Mar 2022",
      end: "May 2025",
      description:
        "Developed full-stack web applications using PHP (Laravel/Yii) and React.js with RESTful APIs. Built scalable backend services in Node.js/Express, transitioning to Nest.js for modular architecture. Led frontend-backend integration across multiple client projects.",
      href: "",
      logoUrl: "",
    },
    {
      company: "STC ACORP JV",
      location: "Maharashtra, India",
      title: "Network Engineer",
      start: "Aug 2021",
      end: "Jan 2022",
      description:
        "Designed and implemented network infrastructure. Managed upgrades, expansions, and user support for connectivity across the organization.",
      href: "",
      logoUrl: "",
    },
  ],
  education: [
    {
      school: "Usha Martin University",
      degree: "Bachelor's Degree in Computer Applications & Computer Science",
      start: "2018",
      end: "2021",
      href: "https://www.ushamartinuniversity.com/",
      logoUrl: "/umu.jpeg",
    },
    {
      school: "ATDC India",
      degree: "AMT in Apparel Manufacturing & Technology",
      start: "2017",
      end: "2018",
      href: "https://atdcindia.co.in/",
      logoUrl: "/atdc.png",
    },
    {
      school: "Sanjay Gandhi Memorial College",
      degree: "Intermediate in Business/Commerce",
      start: "2014",
      end: "2016",
      href: "https://www.sgmcranchi.com/",
      logoUrl: "/sanjaygandhi.jpeg",
    },
  ],
  projects: [
    {
      title: "Hive — Digital Civilization",
      href: "https://github.com/VaibhavJeet/hive",
      description:
        "A living digital civilization where AI beings are born, age, die, form relationships, and create emergent culture. Full-stack monorepo with FastAPI backend, Next.js observation portal, and Flutter mobile app. Features genetic inheritance, collective memory, emergent rituals, and real-time WebSocket visualization.",
      technologies: [
        "Python",
        "FastAPI",
        "Next.js",
        "Flutter",
        "PostgreSQL",
        "Redis",
        "LLM",
        "WebSockets",
        "D3.js",
      ],
      image: "",
    },
    {
      title: "TrustVault — KYC AI Service",
      href: "https://github.com/VaibhavJeet/kyc-ai-service",
      description:
        "AI-powered identity verification platform with face recognition (ArcFace), liveness detection, document OCR, and trust scoring. Multi-tenant architecture with webhook support and Docker deployment.",
      technologies: [
        "Python",
        "FastAPI",
        "InsightFace",
        "Tesseract OCR",
        "Docker",
        "PostgreSQL",
      ],
      image: "",
    },
    {
      title: "AI Guardrails — Automotive Agent",
      href: "https://github.com/VaibhavJeet/ai-guardrails-automotive-service-agent",
      description:
        "Multi-layer AI safety system with gRPC microservices for content filtering, PII detection, and attack prevention. Features LangGraph agent workflows with real-time monitoring dashboard.",
      technologies: [
        "TypeScript",
        "Python",
        "gRPC",
        "LangGraph",
        "Next.js",
        "Microservices",
      ],
      image: "",
    },
    {
      title: "Contract Analysis Agent",
      href: "https://github.com/VaibhavJeet/contract-analysis-agent",
      description:
        "AI-powered legal document analysis with clause extraction, risk identification, compliance checking, and amendment drafting. Built with LangChain and MCP integrations.",
      technologies: [
        "Python",
        "LangChain",
        "MCP",
        "Next.js",
        "ChromaDB",
        "FastAPI",
      ],
      image: "",
    },
    {
      title: "Phoenix Dash",
      href: "https://github.com/VaibhavJeet/phoenix-dash",
      description:
        "Endless runner platformer game built with Flutter and the Flame engine. Features procedural level generation, particle effects, audio management, and cross-platform support.",
      technologies: [
        "Flutter",
        "Dart",
        "Flame Engine",
        "Game Dev",
      ],
      image: "",
    },
  ],
  certifications: [
    {
      title: "Microsoft Certified: Azure Fundamentals",
      provider: "Microsoft",
      links:
        "https://www.credly.com/badges/f445cdf2-287b-460b-ae2e-6b54ed29b583/linked_in_profile",
      dates: "January 21, 2023",
      description:
        "Cloud computing core concepts, Microsoft Azure services, architecture, management tools, and security. Practical understanding for implementing and managing Azure-based cloud solutions.",
      location: "Remote",
      image: "/azure.png",
    },
    {
      title: "JavaScript — Mastering the Fundamentals",
      provider: "Scaler",
      links:
        "https://moonshot.scaler.com/s/sl/FOGqxAVabB",
      dates: "July 27, 2023",
      description:
        "Comprehensive course covering JavaScript fundamentals, data structures, DOM manipulation, asynchronous programming, and best practices for scalable applications.",
      location: "Remote",
      image: "/ScalerTopics.svg",
    },
  ],
} as const;
