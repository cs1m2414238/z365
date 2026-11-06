/** Frontend-facing profile model. Backend mapping belongs in the API adapter. */
export interface Profile {
  name: string;
  handle: string;
  bio: string;
  location: string;
  role: string;
  college: string;
  github: string;
  linkedin: string;
  isPublic?: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  skills?: string[];
}

/** Existing Spring Boot response envelope. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  starterCode: string;
  createdAt: string;
  updatedAt: string;
}
