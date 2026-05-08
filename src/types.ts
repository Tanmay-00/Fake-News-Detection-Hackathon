export interface User {
  id: string;
  name: string;
  avatar?: string;
  role: "Researcher" | "Expert" | "Admin";
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
  upvotes: number;
  parentId?: string;
  replies?: Comment[];
}

export interface Thread {
  id: string;
  title: string;
  description: string;
  category: "Analysis Review" | "General" | "Methodology" | "Intelligence Report";
  author: User;
  timestamp: string;
  upvotes: number;
  commentCount: number;
  tags: string[];
  comments: Comment[];
}
