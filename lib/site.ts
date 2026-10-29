export const site = {
  name: "SnowSeasonsTech",
  person: "Eric Brooks",
  role: "Security / Software Engineer",
  tagline: "Build it right. Secure it right. Scale it right.",
  description:
    "SnowSeasonsTech designs secure AI infrastructure, software systems, automation, and cloud platforms with a do-it-right-the-first-time engineering mindset.",
};

export const services = [
  {
    slug: "ai-infrastructure",
    number: "01",
    title: "AI Infrastructure",
    short: "Reliable foundations for serious AI workloads.",
    description:
      "Design and operate infrastructure for model development, inference, data pipelines, GPU workloads, and production AI services.",
    bullets: ["GPU and compute architecture", "Cloud and hybrid infrastructure", "Containers and orchestration", "Observability and capacity planning"],
  },
  {
    slug: "software-engineering",
    number: "02",
    title: "Software Engineering",
    short: "Clean systems built for change, not rewrites.",
    description:
      "Full-stack and backend engineering focused on maintainability, correctness, security, and operational simplicity.",
    bullets: ["Python / TypeScript systems", "APIs and backend platforms", "Data-driven applications", "Testing and engineering standards"],
  },
  {
    slug: "security-engineering",
    number: "03",
    title: "Security Engineering",
    short: "Security designed into the architecture.",
    description:
      "Threat-aware architecture, hardening, secrets management, access controls, and secure development practices integrated from day one.",
    bullets: ["Threat modeling", "Identity and access controls", "Application hardening", "Security automation and monitoring"],
  },
  {
    slug: "devops-automation",
    number: "04",
    title: "DevOps & Automation",
    short: "Repeatable delivery without manual heroics.",
    description:
      "Build CI/CD, infrastructure automation, monitoring, deployment workflows, and operational tooling that make reliable delivery routine.",
    bullets: ["Infrastructure as code", "CI/CD pipelines", "Container platforms", "Monitoring and alerting"],
  },
  {
    slug: "data-engineering",
    number: "05",
    title: "Data Engineering",
    short: "Pipelines you can actually trust.",
    description:
      "Design durable data systems that move, validate, transform, and expose information reliably for applications and AI workloads.",
    bullets: ["ETL / ELT pipelines", "SQL and relational systems", "Data quality controls", "Analytics-ready architecture"],
  },
  {
    slug: "architecture-consulting",
    number: "06",
    title: "Architecture & Consulting",
    short: "Make the hard technical decisions before they become expensive.",
    description:
      "Architecture reviews, technical roadmaps, platform assessments, and pragmatic engineering guidance for teams making high-impact decisions.",
    bullets: ["Architecture reviews", "Technology selection", "Technical roadmaps", "Legacy modernization"],
  },
] as const;
