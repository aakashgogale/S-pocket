import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  elevated?: boolean;
}

export function Card({
  className,
  accent = false,
  elevated = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded p-5 transition-smooth",
        accent && "border-l-2 border-l-primary pl-[18px]",
        elevated && "shadow-elevated hover:shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-display font-semibold text-foreground text-base",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div className={cn("text-muted-foreground text-sm", className)} {...props}>
      {children}
    </div>
  );
}
