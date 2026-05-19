interface BadgeProps {
  children: React.ReactNode;
  colour?: "green" | "red" | "amber" | "accent" | "neutral";
}

const colourMap = {
  green: "bg-green-light text-green",
  red: "bg-red-light text-red",
  amber: "bg-amber-light text-amber",
  accent: "bg-accent-light text-ink2",
  neutral: "bg-cream2 text-ink3",
};

export function Badge({ children, colour = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[20px] text-[10px] font-[500] tracking-[0.06em] uppercase ${colourMap[colour]}`}
    >
      {children}
    </span>
  );
}
