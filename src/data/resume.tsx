import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon } from "lucide-react";

export const DATA = {
  name: "Vaibhav Srivastava",
  initials: "VS",
  url: "https://github.com/VaibhavJeet",
  location: "Ranchi, India",
  locationLink: "https://www.google.com/maps/place/ranchi",
  description: "Full Stack Software Engineer",
  summary:
    "Proficient in designing and developing scalable web and mobile applications, with expertise in backend, frontend, and database management. Skilled in integrating third-party APIs and ensuring optimized performance.",
  avatarUrl: "/me.jpeg",
  skills: [
    "PHP",
    "Python",
    "JavaScript",
    "Laravel",
    "React.js",
    "Node.js",
    "Next.js",
    "Django",
    "FastAPI",
    "MySQL",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "Bootstrap",
    "WebSockets",
    "Payment Gateway Integration",
    "API Development",
    "Mobile App Development",
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
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
      company: "Raneso",
      location: "Ranchi, India",
      title: "Software Engineer",
      start: "Jan 2024",
      end: "Nov 2024",
      description:
        "Reduced website load and big data upload time by 30% through stack optimization and Python RESTful API development. Implemented new features and conducted maintenance to ensure high project performance and reliability.",
      href: "",
      logoUrl: "/raneso.png"
    },
    {
      company: "366Pi Technologies",
      location: "Ranchi, Jharkhand",
      title: "Frontend Developer",
      start: "Dec 2022",
      end: "Jul 2023",
      description:
        "Maintained and enhanced the frontend of the company’s website, ensuring a seamless user experience. Collaborated with team members to develop new features and resolve bugs to improve functionality.",
      href: "",
      logoUrl: "/pitech.png"
    },
    {
      company: "STC ACORP JV",
      location: "Maharashtra, India",
      title: "Network Engineer",
      start: "Aug 2021",
      end: "Nov 2022",
      description:
        "Participated in network design and implementation projects, contributing to upgrades and expansions. Provided user support by resolving connectivity issues and answering network-related queries.",
      href: "",
      logoUrl: ""
    },
  ],
  education: [
    {
      school: "Indira Gandhi National Open University",
      degree: "Master's Degree in Computer Applications and Computer Science",
      start: "2023",
      end: "2024",
      href: "https://www.ignou.ac.in/",
      logoUrl: "/ignou.png"
    },
    {
      school: "Usha Martin University",
      degree: "Bachelor's Degree in Computer Applications and Computer Science",
      start: "2018",
      end: "2021",
      href: "https://www.ushamartinuniversity.com/",
      logoUrl: "/umu.jpeg"
    },
    {
      school: "ATDC India",
      degree: "AMT in Apparel Manufacturing and Technology",
      start: "2017",
      end: "2018",
      href: "https://atdcindia.co.in/",
      logoUrl: "/atdc.png"
    },
    {
      school: "Sanjay Gandhi Memorial College",
      degree: "Intermediate in Business/Commerce, General",
      start: "2014",
      end: "2016",
      href: "https://www.sgmcranchi.com/",
      logoUrl: "/sanjaygandhi.jpeg"
    },
  ],
  projects: [
    {
      title: "GPS-based Tracking Mobile App",
      href: "https://www.smartbus360.com/",
      description:
        "Developed backend APIs and WebSockets using Node.js with Express.js. Built an admin panel with React.js styled with Tailwind CSS and created a mobile app using Kotlin (Android) and Swift (iOS). Deployed on VPS.",
      technologies: ["Node.js", "React.js", "Tailwind CSS", "MySQL", "HTML", "CSS", "JavaScript"],
      image: "/smart.png"
    },
    {
      title: "Complete Holiday Package Website",
      href: "https://skyseaholidays.co.uk/",
      description:
        "Developed backend and admin panel using Laravel. Implemented frontend with React.js and Tailwind CSS. Integrated payment gateways and supplier APIs. Deployed on VPS.",
      technologies: ["Laravel", "React.js", "Tailwind CSS", "MySQL", "HTML", "CSS", "JavaScript"],
      image: "/sky.png"
    },
    {
      title: "Hospital Services Website",
      href: "https://pioneeracademyindia.com/",
      description:
        "Full-stack development using Laravel for both backend and frontend. Deployed on shared hosting.",
      technologies: ["Laravel", "MySQL", "HTML", "CSS", "JavaScript"],
      image: "/pioneer.png"
    },
  ],
  certifications: [
    {
      title: "Microsoft Certified: Azure Fundamentals",
      provider: "Microsoft",
      links: "https://www.credly.com/badges/f445cdf2-287b-460b-ae2e-6b54ed29b583/linked_in_profile",
      dates: "January 21, 2023",
      description: "This certification covers core concepts of cloud computing and provides foundational knowledge of Microsoft Azure services, architecture, management tools, and security. It emphasizes practical understanding for implementing and managing Azure-based cloud solutions.",
      location: "Remote",
      image: "/azure.png"
    },
    {
      title: "JavaScript Course - Mastering the Fundamentals",
      provider: "Scaler",
      links: "https://moonshot.scaler.com/s/sl/FOGqxAVabB?_gl=1*1ym0hag*_ga*MTMxMTAzMDI2MS4xNjkwMzcwMTQ4*_ga_53S71ZZG1X*MTY5MDQzNzI4Ny42LjEuMTY5MDQ0Mzc5NS4wLjAuMA..",
      dates: "July 27, 2023",
      description: "Comprehensive course covering the foundational concepts of JavaScript, including syntax, data structures, DOM manipulation, asynchronous programming, and best practices for building scalable applications. Emphasized hands-on learning through projects and real-world use cases.",
      location: "Remote",
      image: "/ScalerTopics.svg"

    }
  ],
} as const;
