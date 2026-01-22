import { Badge } from "../ui/badge";
import { QuestionState } from "../../lib/types";

interface StateBadgeProps {
  state: QuestionState;
}

export function StateBadge({ state }: StateBadgeProps) {
  const variants: Record<QuestionState, { variant: any; label: string }> = {
    pending: { variant: "outline", label: "Pending Review" },
    approved: { variant: "default", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
    draft: { variant: "secondary", label: "Draft" },
    awaiting_review: { variant: "outline", label: "Awaiting Review" },
    published: { variant: "default", label: "Published" },
    answering_closed: { variant: "secondary", label: "Closed" },
    awaiting_resolution: { variant: "outline", label: "Awaiting Resolution" },
    resolved: { variant: "default", label: "Resolved" },
    invalid: { variant: "destructive", label: "Invalid" },
    paused: { variant: "secondary", label: "Paused" },
  };

  const { variant, label } = variants[state];

  return <Badge variant={variant}>{label}</Badge>;
}
