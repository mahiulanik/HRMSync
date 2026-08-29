export default function Avatar({ name, profilePic, size = "md" }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-16 h-16 text-lg",
    lg: "w-20 h-20 text-xl",
  };

  if (profilePic) {
    return (
      <img
        src={profilePic}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold`}
    >
      {initials}
    </div>
  );
}
