import type { SVGProps } from "react";

export type Z365IconName =
  | "home"
  | "learn"
  | "practice"
  | "projects"
  | "labs"
  | "agents"
  | "profile"
  | "java"
  | "database"
  | "network"
  | "debug";
type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "width" | "height"> & {
  size?: number;
};

/** Z365's own geometric glyphs, drawn on a shared 24px grid. */
export function Z365Icon({
  name,
  size = 20,
  ...props
}: IconProps & { name: Z365IconName }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {name === "home" && (
        <>
          <rect
            x="3"
            y="3"
            width="7"
            height="11"
            rx="2"
            fill="currentColor"
            fillOpacity=".08"
          />
          <rect x="14" y="3" width="7" height="6" rx="2" />
          <rect x="3" y="18" width="7" height="3" rx="1.5" />
          <rect
            x="14"
            y="13"
            width="7"
            height="8"
            rx="2"
            fill="currentColor"
            fillOpacity=".08"
          />
        </>
      )}
      {name === "learn" && (
        <>
          <path
            d="M4 5.5 10.5 3 20 6.5 13.5 9 4 5.5Z"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path d="M4 5.5v11L13.5 21 20 18V6.5M13.5 9v12M7.5 10l2.5 1M7.5 13.5l2.5 1" />
          <path d="m17 8 0 5-1.5-1" strokeOpacity=".5" />
        </>
      )}
      {name === "practice" && (
        <>
          <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" />
          <path d="m7 14 3-5 4 6 3-5" />
          <circle cx="7" cy="14" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="17" cy="10" r="1.3" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "projects" && (
        <>
          <path
            d="m12 2 9 5-9 5-9-5 9-5Z"
            fill="currentColor"
            fillOpacity=".1"
          />
          <path d="M3 7v10l9 5 9-5V7M12 12v10M7.5 4.5l9 5v4" />
          <path d="m7 14 2 1m6 1 2-1" strokeOpacity=".5" />
        </>
      )}
      {name === "labs" && (
        <>
          <path d="M8 3h8M9 3v6.5L4.5 17a2.6 2.6 0 0 0 2.3 4h10.4a2.6 2.6 0 0 0 2.3-4L15 9.5V3" />
          <path
            d="M6 15h12l1.5 2.5a2.3 2.3 0 0 1-2 3.5h-11a2.3 2.3 0 0 1-2-3.5L6 15Z"
            fill="currentColor"
            fillOpacity=".1"
            stroke="none"
          />
          <path d="m7.5 15 2.5-.7 4 1.4 2.5-.7" />
          <circle cx="11" cy="11.5" r=".8" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="18" r=".8" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "agents" && (
        <>
          <path
            d="m12 7 5 5-5 5-5-5 5-5Z"
            fill="currentColor"
            fillOpacity=".1"
          />
          <path d="M10 3a9 9 0 0 1 11 9m-7 9a9 9 0 0 1-11-9M5.5 5.5l2 2m9 9 2 2" />
          <circle cx="4" cy="5" r="1.8" fill="currentColor" fillOpacity=".12" />
          <circle
            cx="20"
            cy="19"
            r="1.8"
            fill="currentColor"
            fillOpacity=".12"
          />
        </>
      )}
      {name === "profile" && (
        <>
          <path d="M14 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7" />
          <circle
            cx="12"
            cy="9"
            r="2.5"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path d="M7 17a5.2 5.2 0 0 1 10 0m2-1 3 3-3 3-3-3 3-3Z" />
        </>
      )}
      {name === "java" && (
        <>
          <path
            d="M6 10h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-6Z"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2M4 22h15M9 7c-2-2 2-2 0-5m4 5c-2-2 2-2 0-5" />
        </>
      )}
      {name === "database" && (
        <>
          <rect
            x="4"
            y="3"
            width="16"
            height="7"
            rx="2"
            fill="currentColor"
            fillOpacity=".08"
          />
          <rect x="4" y="14" width="16" height="7" rx="2" />
          <path d="M8 6.5h5M8 17.5h5m-1-7.5v4" />
          <circle cx="16.5" cy="6.5" r=".7" fill="currentColor" stroke="none" />
          <circle
            cx="16.5"
            cy="17.5"
            r=".7"
            fill="currentColor"
            stroke="none"
          />
        </>
      )}
      {name === "network" && (
        <>
          <path
            d="m12 2 3 3-3 3-3-3 3-3Z"
            fill="currentColor"
            fillOpacity=".1"
          />
          <path d="M12 8v4M5 15v-3h14v3m-7-3v3" />
          <rect x="2" y="16" width="6" height="5" rx="1.5" />
          <rect
            x="9"
            y="16"
            width="6"
            height="5"
            rx="1.5"
            fill="currentColor"
            fillOpacity=".08"
          />
          <rect x="16" y="16" width="6" height="5" rx="1.5" />
        </>
      )}
      {name === "debug" && (
        <>
          <rect
            x="5"
            y="5"
            width="14"
            height="14"
            rx="4"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3m-7-13v5m-3 3h6" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export const HomeIcon = (props: IconProps) => (
  <Z365Icon name="home" {...props} />
);
export const LearnIcon = (props: IconProps) => (
  <Z365Icon name="learn" {...props} />
);
export const PracticeIcon = (props: IconProps) => (
  <Z365Icon name="practice" {...props} />
);
export const ProjectIcon = (props: IconProps) => (
  <Z365Icon name="projects" {...props} />
);
export const LabIcon = (props: IconProps) => (
  <Z365Icon name="labs" {...props} />
);
export const AgentIcon = (props: IconProps) => (
  <Z365Icon name="agents" {...props} />
);
export const ProfileIcon = (props: IconProps) => (
  <Z365Icon name="profile" {...props} />
);
