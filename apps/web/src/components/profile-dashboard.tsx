import { platformMeta } from "@/lib/platform-meta";
("use client");

import { lazy, Suspense, useEffect, useState } from "react";
import Image from "@/components/ui/avatar-image";
import Link from "@/components/ui/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  ExternalLink,
  GraduationCap,
  Info,
  MapPin,
  Pencil,
} from "lucide-react";
import {
  PracticeIcon as CodeXml,
  ProjectIcon as Layers3,
  LabIcon as FlaskConical,
  AgentIcon as Sparkles,
} from "@/components/ui/z365-icon";
import { Github, Linkedin } from "@/components/ui/social-icons";
import {
  achievements as sampleAchievements,
  activities as sampleActivities,
  skills as sampleSkills,
} from "@/lib/data";
import { useDashboard } from "@/lib/dashboard-context";
import {
  PanelStatus,
  ProfileConnectionNotice,
} from "@/components/profile-connection";
import { PlatformConnections } from "@/components/platform-connections";
import type { ProfileStats } from "@/lib/api/schemas";
import { useWorkspace } from "@/lib/workspace-context";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataIcon } from "@/components/ui/data-icon";
import { Modal } from "@/components/ui/modal";
import { safeLink } from "@/lib/utils";

const RatingChart = lazy(() =>
  import("@/components/rating-chart").then((module) => ({
    default: module.RatingChart,
  })),
);

const stats = [
  {
    value: "1,248",
    label: "Problems solved",
    change: "+12%",
    icon: CodeXml,
    color: "purple",
    href: "/practice",
    field: "problemsSolved",
  },
  {
    value: "36",
    label: "Projects built",
    change: "+3",
    icon: Layers3,
    color: "blue",
    href: "/projects",
    field: "projectsBuilt",
  },
  {
    value: "12",
    label: "Debugging labs",
    change: "+2",
    icon: FlaskConical,
    color: "purple",
    href: "/labs",
    field: "labsCompleted",
  },
  {
    value: "5",
    label: "Agents created",
    change: "+1",
    icon: Sparkles,
    color: "purple",
    href: "/agents",
    field: "agentsCreated",
  },
];

export function ProfileDashboard() {
  const { profile, openEdit } = useWorkspace();
  const dashboard = useDashboard();
  const isDemo = dashboard.source === "demo";
  const skills =
    dashboard.skills.data?.map((skill) => ({ ...skill, value: skill.score })) ||
    [];
  const activities = isDemo
    ? sampleActivities.map((activity, index) => ({
        ...activity,
        id: `demo-${index}`,
      }))
    : (dashboard.activity.data?.recent || []).map((activity) => ({
        ...activity,
        time: relativeTime(activity.occurredAt),
      }));
  const achievements = (dashboard.achievements.data?.items || []).map(
    (achievement) => ({
      ...achievement,
      date: new Date(achievement.earnedAt).toLocaleDateString("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    }),
  );
  const platforms = dashboard.connections.map((connection) => ({
    ...platformMeta[connection.platform],
    ...connection,
    score:
      connection.status === "verified"
        ? connection.rating?.toLocaleString("en-US") || "—"
        : "—",
    rank:
      connection.status === "verified"
        ? connection.rank?.toLocaleString("en-US") || "—"
        : "—",
  }));
  const statCards = stats.map((stat) => ({
    ...stat,
    value:
      dashboard.stats.data?.[stat.field as keyof ProfileStats]?.toLocaleString(
        "en-US",
      ) ?? "—",
    change: isDemo ? stat.change : "",
  }));
  const totalMilestones = dashboard.achievements.data?.totalAvailable || 0;
  const [modal, setModal] = useState<
    "skills" | "platforms" | "activity" | "achievements" | "rank" | null
  >(null);
  const [achievementIndex, setAchievementIndex] = useState<number | null>(null);
  const [rankScope, setRankScope] = useState("Z365");
  useEffect(() => {
    setRankScope("Z365");
    setModal(null);
    setAchievementIndex(null);
  }, [dashboard.source, dashboard.username]);
  const rankData = dashboard.ratings.data?.rankings.find(
    (item) => item.scope === (rankScope === "India" ? "Country" : rankScope),
  );
  const ranking = {
    rank: rankData?.rank?.toLocaleString("en-US"),
    percent:
      rankData?.percentile !== null && rankData?.percentile !== undefined
        ? `${rankData.percentile}%`
        : null,
    total: rankData?.participants.toLocaleString("en-US"),
    label: rankData?.label,
  };

  if (!isDemo && !dashboard.identity.isSuccess)
    return <ProfileConnectionNotice />;

  return (
    <div className="profile-dashboard">
      <ProfileConnectionNotice />
      <div className="profile-top-grid">
        <div className="profile-top-left">
          <Card className="profile-hero">
            {dashboard.record?.bannerUrl && (
              <img
                className="hero-banner"
                src={dashboard.record.bannerUrl}
                alt=""
                referrerPolicy="no-referrer"
              />
            )}
            <svg
              className="hero-waves"
              viewBox="0 0 700 210"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M180 210C280 160 300 235 390 174S465 186 535 124S637 162 700 95V210Z"
                fill="#cfc4fb"
                opacity=".22"
              />
              <path
                d="M290 210C365 160 390 222 475 167S540 196 605 145S670 153 700 130V210Z"
                fill="#c2b2fb"
                opacity=".23"
              />
            </svg>
            <div className="profile-hero-main">
              <div className="profile-avatar">
                <Image
                  src={dashboard.record?.avatarUrl || undefined}
                  alt={`${profile.name}'s profile picture`}
                  width={126}
                  height={126}
                  priority
                  referrerPolicy="no-referrer"
                />
                {dashboard.record?.active && (
                  <span className="online-dot" title="Active learner" />
                )}
              </div>
              <div className="profile-identity">
                <div className="profile-name">
                  <h2>{profile.name}</h2>
                  {dashboard.record?.verified && (
                    <BadgeCheck
                      className="verified-icon"
                      size={23}
                      fill="currentColor"
                      strokeWidth={2}
                      aria-label={
                        isDemo ? "Demo verified profile" : "Verified profile"
                      }
                    />
                  )}
                </div>
                <div className="profile-handle">
                  <span>@{profile.handle}</span>
                  {profile.role && (
                    <span className="role-badge">{profile.role}</span>
                  )}
                </div>
                <p>{profile.bio}</p>
                <div className="profile-meta">
                  <span>
                    <CalendarDays size={13} />
                    {dashboard.record?.joinedAt
                      ? `Joined ${new Date(dashboard.record.joinedAt).toLocaleDateString("en", { month: "short", year: "numeric" })}`
                      : "Joined —"}
                  </span>
                  {profile.location && (
                    <span>
                      <MapPin size={13} />
                      {profile.location}
                    </span>
                  )}
                  {profile.college && (
                    <span className="profile-college">
                      <GraduationCap size={14} />
                      {profile.college}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="profile-hero-actions">
              {dashboard.canEdit && (
                <Button variant="secondary" size="sm" onClick={openEdit}>
                  <Pencil size={14} />
                  Edit profile
                </Button>
              )}
              <div className="social-links">
                {safeLink(profile.github) && (
                  <a
                    href={safeLink(profile.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open GitHub link"
                  >
                    <Github size={17} />
                  </a>
                )}
                {safeLink(profile.linkedin) && (
                  <a
                    href={safeLink(profile.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open LinkedIn link"
                  >
                    <Linkedin size={17} />
                  </a>
                )}
              </div>
            </div>
          </Card>
          <div className="stats-grid">
            {statCards.map(
              ({ value, label, change, icon: Icon, color, href, field }) => (
                <Link
                  className="glass stat-card"
                  data-metric={field}
                  key={label}
                  href={href}
                >
                  <div className="stat-top">
                    <span className={`round-icon ${color}`}>
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    {change && (
                      <span className="growth-pill">
                        <ArrowUpRight size={12} />
                        {change}
                      </span>
                    )}
                  </div>
                  <strong className="stat-value">{value}</strong>
                  <span className="stat-label">
                    {label}
                    <ArrowUpRight size={13} />
                  </span>
                </Link>
              ),
            )}
          </div>
          {dashboard.stats.isError && (
            <PanelStatus error={dashboard.stats.error} />
          )}
        </div>
        <div className="profile-top-right">
          <Card className="rank-card">
            <div className="rank-content">
              <div className="card-heading">
                <h2>
                  {rankScope === "Z365" ? "Z365 rank" : `${rankScope} rank`}
                  <button
                    className="info-button"
                    aria-label="How rankings work"
                    onClick={() => setModal("rank")}
                  >
                    <Info size={14} />
                  </button>
                </h2>
                <label className="select-wrap select-quiet">
                  <span className="sr-only">Ranking scope</span>
                  <select
                    aria-label="Ranking scope"
                    value={rankScope}
                    onChange={(event) => setRankScope(event.target.value)}
                  >
                    <option>Z365</option>
                    <option>College</option>
                    <option>{isDemo ? "India" : "Country"}</option>
                  </select>
                  <ChevronDown size={12} />
                </label>
              </div>
              <div className="rank-number">
                {ranking.rank ? (
                  <>
                    <span>#</span>
                    {ranking.rank}
                  </>
                ) : (
                  "—"
                )}
              </div>
              <p>
                {ranking.rank ? (
                  <>
                    {ranking.percent !== null && (
                      <>
                        Top <strong>{ranking.percent}</strong> of{" "}
                      </>
                    )}
                    {ranking.total} {ranking.label}
                  </>
                ) : dashboard.ratings.isSuccess ? (
                  "No Z365 rank has been assigned."
                ) : (
                  "Connect to load your Z365 ranking."
                )}
              </p>
            </div>
            <div className="rank-emblem" aria-hidden="true">
              <span className="laurel laurel-left">❧</span>
              <div className="rank-hex">
                <Crown size={35} fill="currentColor" strokeWidth={1.3} />
                <span>{dashboard.ratings.data?.level || "Z365"}</span>
              </div>
              <span className="laurel laurel-right">❧</span>
              <i />
            </div>
          </Card>
          <Suspense
            fallback={
              <Card className="rating-card">
                <div className="card-heading">
                  <h2>Engineering rating</h2>
                </div>
                <PanelStatus pending />
              </Card>
            }
          >
            <RatingChart />
          </Suspense>
        </div>
      </div>
      <div className="profile-middle-grid">
        <ActivityHeatmap />
        <Card className="skills-card">
          <div className="card-heading">
            <h2>Skill proficiency</h2>
            <ViewAll onClick={() => setModal("skills")} />
          </div>
          <p className="card-description">Growing your engineering toolkit.</p>
          {Boolean(profile.skills?.length) && (
            <p className="card-description">
              Profile skills · {profile.skills?.join(", ")}
            </p>
          )}
          <PanelStatus
            pending={dashboard.skills.isPending}
            error={dashboard.skills.error}
            empty={!skills.length}
          >
            Your assessment-backed skills will appear here.
          </PanelStatus>
          <div className="skill-list">
            {skills.slice(0, 5).map((skill) => (
              <SkillRow key={skill.name} skill={skill} />
            ))}
          </div>
          <div className="card-footnote">
            <BadgeCheck size={12} />
            {isDemo
              ? "Sample assessment-based scores"
              : "Server-reported skill evidence"}
          </div>
        </Card>
      </div>
      <div className="profile-bottom-grid">
        <Card className="platform-card">
          <div className="card-heading">
            <h2>Platform rankings</h2>
            <ViewAll onClick={() => setModal("platforms")} />
          </div>
          <div className="platform-table-heading">
            <span>PLATFORM</span>
            <span>RATING</span>
            <span>RANK</span>
          </div>
          <div className="platform-list">
            <PanelStatus
              pending={dashboard.platforms.isPending}
              error={dashboard.platforms.error}
              empty={!platforms.length}
            >
              Link a coding platform to bring your progress together.
            </PanelStatus>
            {platforms.map((platform) => (
              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                key={platform.id}
                className="platform-row"
              >
                <span className={`platform-mark ${platform.color}`}>
                  <DataIcon name={platform.mark} size={22} />
                </span>
                <strong>{platform.name}</strong>
                <span className="platform-score">{platform.score}</span>
                <span className="platform-rank">
                  {platform.rank === "—" ? "—" : `#${platform.rank}`}
                </span>
              </a>
            ))}
          </div>
        </Card>
        <Card className="recent-card">
          <div className="card-heading">
            <h2>Recent activity</h2>
            <ViewAll onClick={() => setModal("activity")} />
          </div>
          <div className="activity-list">
            <PanelStatus
              pending={dashboard.activity.isPending}
              error={dashboard.activity.error}
              empty={!activities.length}
            >
              Your verified activity will appear here.
            </PanelStatus>
            {activities.slice(0, 4).map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
          <div className="activity-footer">
            <span className="tiny-green-dot" />A little progress, every day.
          </div>
        </Card>
        <Card className="achievements-card">
          <div className="card-heading">
            <h2>Achievements</h2>
            <ViewAll onClick={() => setModal("achievements")} />
          </div>
          <p className="card-description">
            Milestones worth a little celebration.
          </p>
          <div className="achievement-list">
            {!achievements.length && (
              <PanelStatus
                pending={dashboard.achievements.isPending}
                error={dashboard.achievements.error}
                empty
              >
                Milestones earned through verified work will appear here.
              </PanelStatus>
            )}
            {achievements.slice(0, 4).map((achievement, index) => (
              <button
                key={achievement.name}
                className="achievement"
                onClick={() => setAchievementIndex(index)}
                aria-label={`View ${achievement.name} achievement`}
              >
                <AchievementBadge achievement={achievement} />
                <strong>{achievement.name}</strong>
                <span>{achievement.subtitle}</span>
              </button>
            ))}
          </div>
          <div className="achievement-footer">
            <span>
              <Check size={12} />
              {dashboard.achievements.isSuccess
                ? `${achievements.length} of ${totalMilestones} milestones unlocked`
                : "Milestones await your next step"}
            </span>
            <div className="milestone-dots">
              {Array.from(
                { length: Math.min(totalMilestones, 12) },
                (_, index) => (
                  <i
                    key={index}
                    className={
                      index <
                      (totalMilestones
                        ? (achievements.length / totalMilestones) *
                          Math.min(totalMilestones, 12)
                        : 0)
                        ? "unlocked"
                        : ""
                    }
                  />
                ),
              )}
            </div>
          </div>
        </Card>
      </div>
      {modal === "skills" && (
        <Modal
          title="Your engineering toolkit"
          description={
            isDemo
              ? "Sample proficiency across eight skill areas. Live scores come from verified assessments and completed work."
              : "Your skill scores and supporting evidence are reported by Z365."
          }
          onClose={() => setModal(null)}
        >
          <div className="all-skills">
            {skills.map((skill) => (
              <SkillRow key={skill.name} skill={skill} />
            ))}
          </div>
          <Link className="button button-primary full-width" href="/learn">
            Keep growing <ArrowRight size={16} />
          </Link>
        </Modal>
      )}
      {modal === "platforms" && (
        <Modal
          title="A bigger picture of your progress"
          description={
            isDemo
              ? "Sample platform ratings, displayed separately from your Z365 score. Preview links stay in this browser."
              : "Manage your coding profiles. Ratings appear only when verification is reported by Z365."
          }
          onClose={() => setModal(null)}
        >
          <PlatformConnections />
        </Modal>
      )}
      {modal === "activity" && (
        <Modal
          title="Small steps, real momentum"
          description={
            isDemo
              ? "Your recent demo workspace activity."
              : "Recent activity reported by your Z365 account."
          }
          onClose={() => setModal(null)}
        >
          <div className="expanded-activity">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} expanded />
            ))}
          </div>
        </Modal>
      )}
      {modal === "achievements" && (
        <Modal
          title="Your milestone collection"
          description={
            isDemo
              ? "A preview of badges earned through demonstrated engineering work."
              : "Milestones reported by your Z365 account."
          }
          onClose={() => setModal(null)}
        >
          <div className="all-achievements">
            {achievements.map((achievement, index) => (
              <button
                className="achievement"
                key={achievement.name}
                onClick={() => {
                  setModal(null);
                  setAchievementIndex(index);
                }}
              >
                <AchievementBadge achievement={achievement} />
                <strong>{achievement.name}</strong>
                <span>{achievement.subtitle}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === "rank" && (
        <Modal
          title="Progress with perspective"
          description="Z365 measures more than problems solved."
          onClose={() => setModal(null)}
        >
          <div className="rank-explainer">
            <span className="round-icon purple">
              <Crown size={27} />
            </span>
            <p>
              {isDemo
                ? "This preview illustrates an engineering rating and ranking filters."
                : dashboard.ratings.data?.methodology ?? "Z365 scoring information is unavailable."}
            </p>
            <div className="info-note">
              <Info size={19} />
              <span>
                {isDemo
                  ? "All ranks and ratings in this preview are sample data. Production ranks must come from verified Z365 responses."
                  : dashboard.ratings.data?.methodology ||
                    "Z365 supplies the rating methodology with your profile data."}
              </span>
            </div>
          </div>
        </Modal>
      )}
      {achievementIndex !== null && achievements[achievementIndex] && (
        <Modal
          title={achievements[achievementIndex].name}
          description="A milestone in your engineering journey."
          onClose={() => setAchievementIndex(null)}
        >
          <div className="achievement-detail">
            <AchievementBadge achievement={achievements[achievementIndex]} />
            <p>{achievements[achievementIndex].description}</p>
            <span>
              <BadgeCheck size={15} />
              {isDemo ? "Sample earned date" : "Earned"} ·{" "}
              {achievements[achievementIndex].date}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}

function relativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 60_000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function ViewAll({ onClick }: { onClick: () => void }) {
  return (
    <button className="view-all" onClick={onClick}>
      View all
      <ArrowRight size={14} />
    </button>
  );
}

function SkillRow({ skill }: { skill: (typeof sampleSkills)[number] }) {
  const dashboard = useDashboard();
  return (
    <div className="skill-row" data-skill={skill.icon}>
      <span className="skill-icon">
        <DataIcon name={skill.icon} size={18} />
      </span>
      <span className="skill-name">{skill.name}</span>
      <div
        className="skill-track"
        role="progressbar"
        aria-label={`${skill.name} ${dashboard.source === "demo" ? "sample" : "server-reported"} proficiency`}
        aria-valuenow={skill.value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${skill.value}%` }} />
      </div>
      <strong>
        {skill.value}
        <span>%</span>
      </strong>
    </div>
  );
}

function ActivityRow({
  activity,
  expanded = false,
}: {
  activity: (typeof sampleActivities)[number] & { url?: string | null };
  expanded?: boolean;
}) {
  const source = safeLink(activity.url || "");
  return (
    <Link
      href={source || `/${activity.section}`}
      target={source ? "_blank" : undefined}
      rel={source ? "noopener noreferrer" : undefined}
      className={`activity-row ${expanded ? "activity-expanded" : ""}`}
    >
      <span className={`round-icon ${activity.color}`}>
        <DataIcon name={activity.icon} size={17} />
      </span>
      <div>
        <p>
          <strong>{activity.verb}</strong> {activity.title}
        </p>
        <span>
          {expanded
            ? activity.detail
            : activity.detail.split(" · ").slice(0, 2).join(" · ")}
        </span>
      </div>
      <time>{activity.time}</time>
    </Link>
  );
}

function AchievementBadge({
  achievement,
}: {
  achievement: (typeof sampleAchievements)[number];
}) {
  return (
    <span className={`achievement-badge ${achievement.color}`}>
      <span className="badge-outline">
        <span className="badge-inner">
          <DataIcon name={achievement.icon} size={29} />
        </span>
      </span>
      <span className="badge-sparkle" aria-hidden="true">
        ✦
      </span>
    </span>
  );
}
