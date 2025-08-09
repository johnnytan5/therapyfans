import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VibeTag as VibeTagType } from "@/types";

interface VibeTagProps {
  tag: VibeTagType | string;
  variant?: "default" | "outline" | "minimal";
  className?: string;
}

const categoryColors = {
  style: "bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50",
  specialty: "bg-green-500/10 text-green-300 border-green-500/30 hover:bg-green-500/20 hover:border-green-400/50", 
  approach: "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50",
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
        className={cn(
          "text-xs transition-all duration-200 hover:scale-105 cursor-default",
          "bg-background/50 hover:bg-primary/10 border-border hover:border-primary/30",
          className
        )}
      >
        {tagName}
      </Badge>
    );
  }
  
  return (
    <Badge 
      className={cn(
        "text-xs border transition-all duration-200 hover:scale-105 cursor-default",
        colorClass,
        className
      )}
    >
      {tagName}
    </Badge>
  );
}