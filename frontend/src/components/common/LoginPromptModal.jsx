function LoginPromptModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <i className="fa-solid fa-lock text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              로그인이 필요합니다
            </h2>
            <p className="text-xs text-gray-500">
              기자재 대여 서비스 이용 안내
            </p>
          </div>
        </div>
        <p className="mb-6 text-sm text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
          기자재 대여 신청은 로그인 후 이용하실 수 있습니다.<br />
          로그인 페이지로 이동하시겠습니까?
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            <i className="fa-solid fa-right-to-bracket text-xs" />
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPromptModal;
