function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-sm py-xl text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl text-outline">
        inventory_2
      </span>
      <p className="text-body-lg font-body-lg">{message}</p>
    </div>
  );
}

export default EmptyState;
