import type { Profile } from "@z365/contracts";
export type { Profile } from "@z365/contracts";

export const defaultProfile: Profile = {
  name: "Aarav Mehta",
  handle: "aaravm",
  bio: "Building, debugging, and learning real software systems.",
  location: "India",
  role: "Student",
  college: "IIT Bombay",
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/",
};

export const sectionNames = {
  home: "Overview",
  learn: "My learning",
  practice: "Practice",
  projects: "Projects",
  labs: "Debugging labs",
  agents: "AI agents",
} as const;
export type Section = keyof typeof sectionNames;

export const skills = [
  { name: "Java", value: 92, icon: "coffee" },
  { name: "Backend", value: 88, icon: "layers" },
  { name: "SQL", value: 85, icon: "database" },
  { name: "System Design", value: 78, icon: "network" },
  { name: "Debugging", value: 91, icon: "bug" },
  { name: "TypeScript", value: 83, icon: "code" },
  { name: "React", value: 80, icon: "code" },
  { name: "Python", value: 72, icon: "code" },
];

export const platforms = [
  {
    name: "LeetCode",
    score: "1,842",
    rank: "3,921",
    color: "orange",
    mark: "code",
    url: "https://leetcode.com/",
  },
  {
    name: "Codeforces",
    score: "1,681",
    rank: "7,306",
    color: "blue",
    mark: "chart",
    url: "https://codeforces.com/",
  },
  {
    name: "GeeksforGeeks",
    score: "1,726",
    rank: "5,138",
    color: "green",
    mark: "braces",
    url: "https://www.geeksforgeeks.org/",
  },
  {
    name: "CodeChef",
    score: "1,575",
    rank: "12,670",
    color: "brown",
    mark: "chef",
    url: "https://www.codechef.com/",
  },
  {
    name: "HackerRank",
    score: "1,592",
    rank: "21,480",
    color: "emerald",
    mark: "hexagon",
    url: "https://www.hackerrank.com/",
  },
];

export const activities = [
  {
    verb: "Solved",
    title: "Rotated Binary Search",
    detail: "LeetCode · Medium · +25 points",
    time: "2h ago",
    icon: "check",
    color: "green",
    section: "practice",
  },
  {
    verb: "Completed",
    title: "Payment Service Debugging Lab",
    detail: "Debugging labs · 3 bugs found · +80 points",
    time: "5h ago",
    icon: "flask",
    color: "pink",
    section: "labs",
  },
  {
    verb: "Published",
    title: "URL Shortener",
    detail: "Projects · Spring Boot · PostgreSQL",
    time: "1d ago",
    icon: "layers",
    color: "blue",
    section: "projects",
  },
  {
    verb: "Created",
    title: "Code Review Agent",
    detail: "AI agents · Version 1 · Ready to use",
    time: "2d ago",
    icon: "sparkles",
    color: "purple",
    section: "agents",
  },
  {
    verb: "Completed",
    title: "Advanced Java Collections",
    detail: "Learning · Java mastery path · +40 points",
    time: "3d ago",
    icon: "book",
    color: "orange",
    section: "learn",
  },
  {
    verb: "Solved",
    title: "Merge K Sorted Lists",
    detail: "LeetCode · Hard · +50 points",
    time: "4d ago",
    icon: "check",
    color: "green",
    section: "practice",
  },
];

export const achievements = [
  {
    name: "Problem Solver",
    subtitle: "500 solved",
    icon: "code",
    color: "purple",
    description:
      "Earned for solving 500 coding problems. A testament to showing up and finding a way, one problem at a time.",
    date: "September 12, 2026",
  },
  {
    name: "Debugger Pro",
    subtitle: "10 labs cleared",
    icon: "bug",
    color: "slate",
    description:
      "Earned for completing 10 debugging labs and tracking down the bugs that others missed.",
    date: "October 3, 2026",
  },
  {
    name: "Project Builder",
    subtitle: "25 shipped",
    icon: "layers",
    color: "blue",
    description:
      "Earned for shipping 25 projects. Turning an idea into working software is your superpower.",
    date: "October 16, 2026",
  },
  {
    name: "Agent Creator",
    subtitle: "First AI agent",
    icon: "zap",
    color: "green",
    description:
      "Earned for creating your first AI agent. A new way to build, automate, and explore.",
    date: "October 31, 2026",
  },
  {
    name: "On Fire",
    subtitle: "30-day streak",
    icon: "flame",
    color: "orange",
    description:
      "Earned for practicing 30 days in a row. Small steps become big things.",
    date: "October 27, 2026",
  },
  {
    name: "Early Explorer",
    subtitle: "Joined in 2025",
    icon: "compass",
    color: "pink",
    description:
      "One of the first learners to join Z365. Thank you for growing with us.",
    date: "March 15, 2025",
  },
];

export interface Resource {
  id: string;
  section: Exclude<Section, "home">;
  title: string;
  description: string;
  tag: string;
  meta: string;
  progress: number;
  color: string;
  steps: string[];
}

export const resources: Resource[] = [
  {
    id: "java",
    section: "learn",
    title: "Java, beyond the basics",
    description:
      "Build a deep understanding of collections, concurrency, and clean Java code.",
    tag: "Learning path",
    meta: "12 lessons · Intermediate",
    progress: 67,
    color: "orange",
    steps: [
      "Collections and generics",
      "Streams and functional interfaces",
      "Concurrency fundamentals",
      "Build a thread-safe cache",
    ],
  },
  {
    id: "system-design",
    section: "learn",
    title: "Think in systems",
    description:
      "From load balancers to distributed databases. Design for the real world.",
    tag: "Learning path",
    meta: "18 lessons · Advanced",
    progress: 33,
    color: "purple",
    steps: [
      "Scalability and trade-offs",
      "Caching strategies",
      "Database partitioning",
      "Design a notification service",
    ],
  },
  {
    id: "sql",
    section: "learn",
    title: "The art of SQL",
    description:
      "Write expressive queries and make your database work smarter.",
    tag: "Course",
    meta: "8 lessons · Intermediate",
    progress: 100,
    color: "blue",
    steps: [
      "Joins and subqueries",
      "Window functions",
      "Indexes and query plans",
      "Optimize a slow query",
    ],
  },
  {
    id: "react",
    section: "learn",
    title: "Modern React patterns",
    description:
      "Thoughtful components, reliable state, and interfaces people love.",
    tag: "Course",
    meta: "10 lessons · Intermediate",
    progress: 0,
    color: "green",
    steps: [
      "Component composition",
      "State and effects",
      "Server and client boundaries",
      "Build a dashboard",
    ],
  },
  {
    id: "binary-search",
    section: "practice",
    title: "Rotated Binary Search",
    description:
      "Find a target in a rotated sorted array with logarithmic time complexity.",
    tag: "Medium",
    meta: "Arrays · Binary search · 25 points",
    progress: 100,
    color: "orange",
    steps: [
      "Identify the sorted half of the array",
      "Narrow the search boundaries",
      "Handle empty and single-item inputs",
      "Target complexity: O(log n)",
    ],
  },
  {
    id: "merge-lists",
    section: "practice",
    title: "Merge K Sorted Lists",
    description:
      "Combine sorted linked lists into a single sorted list efficiently.",
    tag: "Hard",
    meta: "Linked lists · Heaps · 50 points",
    progress: 0,
    color: "pink",
    steps: [
      "Compare a heap and divide-and-conquer approach",
      "Initialize a min-heap",
      "Merge nodes while preserving order",
      "Target complexity: O(n log k)",
    ],
  },
  {
    id: "two-sum",
    section: "practice",
    title: "Two Sum",
    description:
      "Find the two numbers that add up to a target. A classic for a reason.",
    tag: "Easy",
    meta: "Arrays · Hash maps · 10 points",
    progress: 0,
    color: "green",
    steps: [
      "Consider a brute-force solution",
      "Use a map to store seen values",
      "Return the matching indices",
      "Target complexity: O(n)",
    ],
  },
  {
    id: "lru-cache",
    section: "practice",
    title: "Design an LRU Cache",
    description: "Implement a cache that evicts the least recently used item.",
    tag: "Medium",
    meta: "Design · Hash maps · 25 points",
    progress: 25,
    color: "purple",
    steps: [
      "Define get and put operations",
      "Combine a hash map and linked list",
      "Move accessed items to the front",
      "Keep each operation O(1)",
    ],
  },
  {
    id: "url-shortener",
    section: "projects",
    title: "URL Shortener",
    description:
      "Short links, click analytics, and a scalable Spring Boot backend.",
    tag: "Published",
    meta: "Spring Boot · PostgreSQL",
    progress: 100,
    color: "blue",
    steps: [
      "Design the short-link schema",
      "Implement Base62 encoding",
      "Add redirect and analytics endpoints",
      "Document and publish the API",
    ],
  },
  {
    id: "task-manager",
    section: "projects",
    title: "Taskflow",
    description:
      "A small, thoughtful task manager built with Next.js and TypeScript.",
    tag: "In progress",
    meta: "Next.js · TypeScript",
    progress: 72,
    color: "purple",
    steps: [
      "Build the project workspace",
      "Add task creation and editing",
      "Implement drag-and-drop boards",
      "Add keyboard shortcuts",
    ],
  },
  {
    id: "chat-app",
    section: "projects",
    title: "Realtime Chat",
    description:
      "Bring people together with live messaging and presence indicators.",
    tag: "In progress",
    meta: "WebSockets · React",
    progress: 35,
    color: "green",
    steps: [
      "Create a WebSocket connection",
      "Build chat rooms",
      "Add typing and presence events",
      "Handle reconnects gracefully",
    ],
  },
  {
    id: "payment-lab",
    section: "labs",
    title: "The missing payment",
    description:
      "Trace a payment service failure across logs, transactions, and retries.",
    tag: "Intermediate",
    meta: "3 bugs · Java · 80 points",
    progress: 100,
    color: "pink",
    steps: [
      "Inspect the failed transaction logs",
      "Find the missing rollback",
      "Fix the retry idempotency key",
      "Verify the payment lifecycle",
    ],
  },
  {
    id: "memory-lab",
    section: "labs",
    title: "Where did the memory go?",
    description:
      "Track down a memory leak before it brings the service to a halt.",
    tag: "Advanced",
    meta: "2 bugs · Java · 100 points",
    progress: 0,
    color: "purple",
    steps: [
      "Inspect the heap allocation report",
      "Identify retained object references",
      "Bound the application cache",
      "Verify stable memory under load",
    ],
  },
  {
    id: "race-lab",
    section: "labs",
    title: "A race against threads",
    description:
      "Untangle a subtle concurrency bug in a shared inventory service.",
    tag: "Advanced",
    meta: "3 bugs · Concurrency · 100 points",
    progress: 40,
    color: "blue",
    steps: [
      "Reproduce the lost-update scenario",
      "Inspect shared mutable state",
      "Introduce atomic operations",
      "Verify with concurrent requests",
    ],
  },
  {
    id: "review-agent",
    section: "agents",
    title: "Code Review Agent",
    description:
      "Your second pair of eyes for cleaner, more thoughtful pull requests.",
    tag: "Ready",
    meta: "Code quality · Version 1",
    progress: 100,
    color: "purple",
    steps: [
      "Define review instructions",
      "Choose code quality criteria",
      "Add example review inputs",
      "Review the agent configuration",
    ],
  },
  {
    id: "docs-agent",
    section: "agents",
    title: "Documentation Buddy",
    description:
      "Turn code and ideas into documentation that is easy to follow.",
    tag: "In progress",
    meta: "Documentation · Draft",
    progress: 50,
    color: "blue",
    steps: [
      "Define the documentation style",
      "Add repository context",
      "Create output templates",
      "Review the agent configuration",
    ],
  },
  {
    id: "test-agent",
    section: "agents",
    title: "Test Case Explorer",
    description:
      "Find edge cases and plan meaningful tests for your next feature.",
    tag: "New idea",
    meta: "Testing · Draft",
    progress: 0,
    color: "green",
    steps: [
      "Describe the feature under test",
      "List expected behaviors",
      "Explore boundary conditions",
      "Review the test plan",
    ],
  },
];
