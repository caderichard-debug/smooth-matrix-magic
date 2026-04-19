type Props = {
  label?: string;
  className?: string;
  height?: string;
};

export function AdSlot({ label = "Advertisement", className = "", height = "h-24" }: Props) {
  return (
    <div
      className={`ad-slot flex items-center justify-center w-full ${height} text-xs uppercase tracking-[0.2em] ${className}`}
      aria-label="Advertisement placeholder"
    >
      {label}
    </div>
  );
}
