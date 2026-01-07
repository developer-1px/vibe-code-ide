/**
 * CustomJsonModal - 커스텀 JSON 입력 모달
 * 사용자가 직접 JSON 텍스트를 입력하여 데이터를 로드할 수 있음
 */

import { X, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface CustomJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>[]) => void;
}

export function CustomJsonModal({ isOpen, onClose, onSubmit }: CustomJsonModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setError(null);

    // JSON 파싱 시도
    try {
      const parsed = JSON.parse(jsonText);

      let dataArray: Record<string, unknown>[];

      // 단일 객체인 경우 배열로 감싸기
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        dataArray = [parsed];
      } else if (Array.isArray(parsed)) {
        dataArray = parsed;
      } else {
        setError('JSON must be an object or array of objects');
        return;
      }

      // 빈 배열 체크
      if (dataArray.length === 0) {
        setError('JSON array cannot be empty');
        return;
      }

      // 모든 요소가 객체인지 확인
      const allObjects = dataArray.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item));
      if (!allObjects) {
        setError('All array elements must be objects');
        return;
      }

      // 성공
      onSubmit(dataArray);
      setJsonText('');
      setError(null);
      onClose();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON: ${err.message}`);
      } else {
        setError('Failed to parse JSON');
      }
    }
  };

  const handleCancel = () => {
    setJsonText('');
    setError(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-elevated border border-border-DEFAULT rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-DEFAULT bg-bg-deep">
            <h2 className="text-sm font-semibold text-text-primary">Custom JSON Input</h2>
            <button onClick={handleCancel} className="p-1 hover:bg-bg-elevated rounded transition-colors" aria-label="Close">
              <X size={16} className="text-text-tertiary" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col p-4">
            {/* Instructions */}
            <p className="text-2xs text-text-secondary mb-2">
              Enter a JSON array of objects. Example:{' '}
              <code className="font-mono text-warm-400">[{`{"id": 1, "name": "Item"}`}, ...]</code>
            </p>

            {/* Textarea */}
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`[\n  {\n    "id": 1,\n    "name": "Sample Item",\n    "value": 100\n  },\n  {\n    "id": 2,\n    "name": "Another Item",\n    "value": 200\n  }\n]`}
              className="flex-1 w-full p-3 bg-bg-deep border border-border-DEFAULT rounded font-mono text-2xs text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-warm-400"
              spellCheck={false}
            />

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-2xs text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-DEFAULT bg-bg-deep">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-2xs font-medium text-text-secondary bg-bg-elevated border border-border-DEFAULT rounded hover:bg-bg-deep transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-2xs font-medium text-bg-deep bg-warm-400 rounded hover:bg-warm-500 transition-colors"
            >
              <Check size={12} />
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
