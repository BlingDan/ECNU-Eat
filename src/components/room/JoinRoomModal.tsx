import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JoinRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = code.trim().toUpperCase();

        if (!trimmedCode) {
            setError('请输入房间代码');
            return;
        }

        if (trimmedCode.length !== 4) {
            setError('房间代码应为 4 位');
            return;
        }

        navigate(`/room/${trimmedCode}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 遮罩 */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* 弹窗 */}
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    🚪 加入房间
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            房间代码
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            placeholder="例如：AF3D"
                            maxLength={4}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-ecnu-blue focus:outline-none text-center text-2xl font-bold tracking-widest uppercase"
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
                        )}
                    </div>

                    <button type="submit" className="btn-primary w-full">
                        加入房间
                    </button>
                </form>
            </div>
        </div>
    );
}
