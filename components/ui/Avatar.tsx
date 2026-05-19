import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string;
  accentColour?: string;
  size?: number;
  className?: string;
}

export function Avatar({
  src,
  name = "?",
  accentColour = "#C4A882",
  size = 36,
  className = "",
}: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-[500] text-ink ${className}`}
      style={{ width: size, height: size, backgroundColor: accentColour + "40" }}
    >
      {initials}
    </div>
  );
}
