const Badge = ({ text }) => {
  const statusStyles = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-orange-100 text-orange-700",
    SICK: "bg-blue-100 text-blue-700",
    CASUAL: "bg-amber-100 text-amber-700",
    EARNED: "bg-green-100 text-green-700",
    HOLIDAY: "bg-purple-100 text-purple-700",
    WEEKEND: "bg-gray-100 text-gray-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const style =
    statusStyles[text?.toUpperCase()] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${style}`}
    >
      {text}
    </span>
  );
};

export default Badge;
