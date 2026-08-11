const styles = {
  APPROVED: 'bg-green-50 text-green-600 border border-green-200',
  PENDING: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  REJECTED: 'bg-red-50 text-red-600 border border-red-200',
  LATE: 'bg-orange-50 text-orange-600 border border-orange-200',
  DELETED: 'bg-red-50 text-red-600 border border-red-200',
  SICK: 'bg-blue-50 text-blue-600 border border-blue-200',
  CASUAL: 'bg-purple-50 text-purple-600 border border-purple-200',
  EARNED: 'bg-teal-50 text-teal-600 border border-teal-200',
};

export default function Badge({ text }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${styles[text] || 'bg-gray-50 text-gray-600'}`}>
      {text}
    </span>
  );
}
