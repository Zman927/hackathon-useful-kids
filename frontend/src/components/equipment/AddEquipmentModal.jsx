import { useState } from "react";
import { addEquipment } from "../../api/equipmentApi";
import { DEPARTMENTS } from "./DepartmentSelect";

const CATEGORIES = [
  "카메라/영상",
  "오디오",
  "IT 기기",
  "계측기",
  "드론/로보틱스",
  "마이크로컨트롤러",
  "기타",
];

function AddEquipmentModal({ onClose, onSuccess, initialDepartmentId }) {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState(
    initialDepartmentId ? String(initialDepartmentId) : "1",
  );
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleImageChange(event) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("기자재 이름을 입력해 주세요.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const added = await addEquipment({
        name,
        departmentId,
        category,
        totalQuantity,
        imageFile,
        description: description.trim(),
      });
      onSuccess(added);
      onClose();
    } catch (err) {
      setError("기자재 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <i className="fa-solid fa-plus text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                기자재 신규 등록 (조교 전용)
              </h2>
              <p className="text-xs text-gray-500">
                학과 기자재 목록에 수량 및 정보를 등록합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              기자재명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: Sony A7M4 카메라"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                담당 학과 <span className="text-red-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              보유/입고 수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              사진 (선택)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="미리보기"
                className="mt-2 h-24 w-24 rounded-lg border border-gray-200 object-cover"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              기자재 상세 설명
            </label>
            <textarea
              rows="3"
              placeholder="기자재 특징, 구성품, 유의사항 등을 작성해 주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y"
            />
          </div>

          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

          <div className="mt-2 flex justify-end gap-2.5 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <i className="fa-solid fa-plus text-xs" />
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEquipmentModal;
