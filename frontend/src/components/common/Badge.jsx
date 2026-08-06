const VARIANT_STYLES = {
  available: { background: "#e6f4ea", color: "#1e7e34" },
  unavailable: { background: "#fdecea", color: "#c0392b" },
  pending: { background: "#fff8e1", color: "#b58105" },
  rented: { background: "#e8f0fe", color: "#1a56db" },
  returned: { background: "#eceff1", color: "#546e7a" },
};

function Badge({ label, variant }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.pending;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

export default Badge;
