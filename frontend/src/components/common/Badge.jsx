const VARIANT_CLASSES = {
  available: "bg-badge-active-bg text-badge-active-text",
  unavailable: "bg-badge-pending-bg text-badge-pending-text",
  pending: "bg-badge-pending-bg text-badge-pending-text",
  rented: "bg-badge-active-bg text-badge-active-text",
  returned: "bg-badge-completed-bg text-badge-completed-text",
};

function Badge({ label, variant }) {
  const classes = VARIANT_CLASSES[variant] || VARIANT_CLASSES.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full px-sm py-xs text-label-sm font-label-sm whitespace-nowrap ${classes}`}
    >
      {label}
    </span>
  );
}

export default Badge;
