import { Badge } from "../ui/badge";
import { getCountdown, isOverdue } from "../../lib/utils";

interface CountdownProps {
  date: Date;
  label?: string;
}

export function Countdown({ date, label }: CountdownProps) {
  const countdown = getCountdown(date);
  const overdue = isOverdue(date);

  return (
    <Badge variant={overdue ? "destructive" : "secondary"}>
      {label && `${label}: `}
      {countdown}
    </Badge>
  );
}
