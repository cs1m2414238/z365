"use client";

import { useEffect, useState } from "react";
import Link from "@/components/ui/link";
import { useRouter, useSearchParams } from "@/lib/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock3,
  Flame,
  Search,
} from "lucide-react";
import {
  LearnIcon as BookOpen,
  PracticeIcon as CodeXml,
  ProjectIcon as Layers3,
  LabIcon as FlaskConical,
  AgentIcon as Sparkles,
} from "@/components/ui/z365-icon";
import {
  resources,
  sectionNames,
  type Resource,
  type Section,
} from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useWorkspace } from "@/lib/workspace-context";

const icons = {
  learn: BookOpen,
  practice: CodeXml,
  projects: Layers3,
  labs: FlaskConical,
  agents: Sparkles,
};
const introductions = {
  home: {
    title: "Good things take practice.",
    description:
      "Pick up where you left off, or follow a new spark of curiosity.",
  },
  learn: {
    title: "Learn it. Understand it. Make it yours.",
    description:
      "Thoughtful learning paths for skills that go beyond the next interview.",
  },
  practice: {
    title: "One problem closer to your next breakthrough.",
    description:
      "Explore challenges that sharpen your thinking and stretch your skills.",
  },
  projects: {
    title: "Ideas look better in the real world.",
    description:
      "Build, experiment, and give your engineering skills something to show for.",
  },
  labs: {
    title: "Every bug has a story. Find it.",
    description:
      "Practice the art of debugging with real-world engineering scenarios.",
  },
  agents: {
    title: "A little intelligence. A lot of possibility.",
    description:
      "Explore agents that review, document, and help you build better software.",
  },
};

export function LibraryPage({ section }: { section: Section }) {
  const { profile, notify } = useWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<Record<string, number[]>>({});
  const selected = resources.find(
    (resource) =>
      resource.id === searchParams.get("resource") &&
      (section === "home" || resource.section === section),
  );

  useEffect(() => {
    setFilter("All");
    setQuery("");
  }, [section]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("z365.progress.v1") || "{}",
      );
      if (saved && typeof saved === "object") {
        const checked = Object.fromEntries(
          Object.entries(saved).filter(
            ([key, value]) =>
              resources.some((resource) => resource.id === key) &&
              Array.isArray(value) &&
              value.every(
                (index) => Number.isInteger(index) && index >= 0 && index < 4,
              ),
          ),
        );
        setProgress(checked);
      }
    } catch {
      /* Fall back to the sample progress. */
    }
  }, []);

  function stepsFor(resource: Resource) {
    return (
      progress[resource.id] ??
      resource.steps
        .map((_, index) => index)
        .filter((index) => index < Math.floor(resource.progress / 25))
    );
  }
  function percentFor(resource: Resource) {
    return progress[resource.id]
      ? Math.round((stepsFor(resource).length / resource.steps.length) * 100)
      : resource.progress;
  }
  function toggleStep(resource: Resource, index: number) {
    const current = stepsFor(resource);
    const next = {
      ...progress,
      [resource.id]: current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    };
    setProgress(next);
    try {
      localStorage.setItem("z365.progress.v1", JSON.stringify(next));
    } catch {
      notify(
        "Progress updated for this session. Browser storage is unavailable.",
      );
    }
    if (next[resource.id].length === resource.steps.length)
      notify("One more milestone. Nice work!");
  }
  function openResource(resource: Resource) {
    router.push(`/${section}?resource=${resource.id}`, { scroll: false });
  }
  function closeResource() {
    router.replace(`/${section}`, { scroll: false });
  }

  const allResources = resources.filter((resource) =>
    section === "home"
      ? percentFor(resource) > 0 && percentFor(resource) < 100
      : resource.section === section,
  );
  const filtered = allResources.filter(
    (resource) =>
      (filter === "All" ||
        (filter === "In progress"
          ? percentFor(resource) > 0 && percentFor(resource) < 100
          : percentFor(resource) === 100)) &&
      `${resource.title} ${resource.description} ${resource.meta} ${resource.tag}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const introduction = introductions[section];

  return (
    <div className="library-page">
      <Card className={`library-banner ${section}`}>
        <div>
          <span className="eyebrow">
            {section === "home"
              ? `WELCOME BACK, ${profile.name.split(" ")[0].toUpperCase()}`
              : "A LITTLE BETTER, EVERY DAY"}
          </span>
          <h2>{introduction.title}</h2>
          <p>{introduction.description}</p>
          {section === "home" && (
            <Button asChild>
              <Link href="/practice">
                Find today’s challenge <ArrowRight size={16} />
              </Link>
            </Button>
          )}
        </div>
        <span className="library-banner-icon" aria-hidden="true">
          {section === "home" ? (
            <Flame size={75} />
          ) : (
            (() => {
              const Icon = icons[section];
              return <Icon size={75} strokeWidth={1.2} />;
            })()
          )}
          <i />
          <i />
        </span>
      </Card>
      {section === "home" && (
        <div className="overview-stats">
          {[
            {
              label: "Learning streak",
              value: "18 days",
              icon: Flame,
              color: "orange",
            },
            {
              label: "Active projects",
              value: "2",
              icon: Layers3,
              color: "blue",
            },
            {
              label: "Engineering rating",
              value: "1,842",
              icon: ArrowUpRight,
              color: "purple",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <span className={`round-icon ${color}`}>
                <Icon size={22} />
              </span>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="library-section-heading">
        <div>
          <h2>
            {section === "home"
              ? "Pick up where you left off"
              : sectionNames[section]}
            <span>{allResources.length}</span>
          </h2>
          <p>
            {section === "home"
              ? "Your next small step is right here."
              : "A space to explore, practice, and make progress."}
          </p>
        </div>
        <div className="library-controls">
          <div className="filter-tabs" aria-label="Filter resources">
            {["All", "In progress", "Completed"].map((item) => (
              <button
                key={item}
                aria-pressed={filter === item}
                className={filter === item ? "selected" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="library-search">
            <Search size={16} />
            <span className="sr-only">Search {sectionNames[section]}</span>
            <input
              placeholder="Find something..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="resource-grid">
        {filtered.map((resource) => {
          const Icon = icons[resource.section];
          const percent = percentFor(resource);
          return (
            <Card className="resource-card" key={resource.id}>
              <div className="resource-card-top">
                <span className={`round-icon ${resource.color}`}>
                  <Icon size={25} />
                </span>
                <span
                  className={`resource-tag ${percent === 100 ? "complete" : ""}`}
                >
                  {percent === 100 ? (
                    <>
                      <Check size={12} />
                      Completed
                    </>
                  ) : (
                    resource.tag
                  )}
                </span>
              </div>
              <span className="resource-category">
                {sectionNames[resource.section]}
              </span>
              <h3>
                <button onClick={() => openResource(resource)}>
                  {resource.title}
                </button>
              </h3>
              <p>{resource.description}</p>
              <span className="resource-meta">
                <Clock3 size={13} />
                {resource.meta}
              </span>
              <div className="resource-progress-label">
                <span>
                  {percent === 100
                    ? "All steps complete"
                    : percent > 0
                      ? "Keep the momentum going"
                      : "A new possibility"}
                </span>
                <strong>{percent}%</strong>
              </div>
              <div className="resource-track">
                <span style={{ width: `${percent}%` }} />
              </div>
              <button
                className="resource-continue"
                onClick={() => openResource(resource)}
              >
                {percent === 100
                  ? "Review checklist"
                  : percent > 0
                    ? "Continue exploring"
                    : "Take a look"}
                <ArrowRight size={16} />
              </button>
            </Card>
          );
        })}
      </div>
      {!filtered.length && (
        <Card className="library-empty">
          <Search size={30} />
          <h3>
            {query ? "No matches just yet" : "A fresh page of possibilities"}
          </h3>
          <p>
            {query
              ? "Try a different search, or explore everything in this section."
              : "There aren’t any resources in this filter yet. Your next small step is waiting in All."}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("");
              setFilter("All");
            }}
          >
            Explore all
          </Button>
        </Card>
      )}
      {selected && (
        <Modal
          title={selected.title}
          description={selected.description}
          onClose={closeResource}
        >
          <div className="resource-detail-meta">
            <span
              className={`resource-tag ${percentFor(selected) === 100 ? "complete" : ""}`}
            >
              {selected.tag}
            </span>
            <span>{selected.meta}</span>
          </div>
          <div className="checklist-heading">
            <h3>Your exploration checklist</h3>
            <span>
              {stepsFor(selected).length}/{selected.steps.length} complete
            </span>
          </div>
          <div className="resource-checklist">
            {selected.steps.map((step, index) => (
              <label
                key={step}
                className={stepsFor(selected).includes(index) ? "checked" : ""}
              >
                <input
                  type="checkbox"
                  checked={stepsFor(selected).includes(index)}
                  onChange={() => toggleStep(selected, index)}
                />
                <span className="custom-checkbox">
                  <Check size={14} />
                </span>
                <span>{step}</span>
              </label>
            ))}
          </div>
          <div className="checklist-note">
            <CheckCheck size={17} />
            <span>
              This demo checklist tracks your exploration in this browser.
              Verified completions and assessments will come from Z365 activity.
            </span>
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={closeResource}>
              Back to {sectionNames[section].toLowerCase()}
            </Button>
            <Link className="button button-primary" href="/">
              See your profile <ArrowRight size={15} />
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
}
