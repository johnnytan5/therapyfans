import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VibeTag as VibeTagType } from "@/types";

interface VibeTagProps {
  tag: VibeTagType | string;
  variant?: "default" | "outline" | "minimal";
  className?: string;
}

const categoryColors = {
  style: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  specialty: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", 
  approach: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export function VibeTag({ tag, variant = "default", className }: VibeTagProps) {
  const tagName = typeof tag === 'string' ? tag : tag.name;
  const category = typeof tag === 'string' ? 'style' : tag.category;
  
  const colorClass = categoryColors[category] || categoryColors.style;
  
  if (variant === "minimal") {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {tagName}
      </span>
    );
  }
  
  if (variant === "outline") {
    return (
      <Badge 
        variant="outline" 
        className={cn("text-xs", className)}
      >
        {tagName}
      </Badge>
    );
  }
  
  return (
    <Badge 
      className={cn(
        "text-xs border-0",
        colorClass,
        className
      )}
    >
      {tagName}
    </Badge>
  );
}