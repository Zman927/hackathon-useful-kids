function LoginPromptModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md">
      <div className="w-full max-w-sm rounded-xl bg-surface-container-lowest p-lg shadow-xl">
        <h2 className="mb-sm text-headline-md font-headline-md text-on-surface">
          로그인이 필요합니다
        </h2>
        <p className="mb-lg text-body-md font-body-md text-on-surface-variant">
          기자재 대여 신청은 로그인 후 이용할 수 있습니다.
        </p>
        <div className="flex justify-end gap-sm">
          <button
            onClick={onCancel}
            className="rounded-lg px-lg py-sm text-label-lg font-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-primary-container px-lg py-sm text-label-lg font-label-lg text-on-primary transition-colors hover:bg-primary"
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPromptModal;
