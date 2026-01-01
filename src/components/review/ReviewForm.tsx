import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormProps {
    restaurantId: string;
    restaurantName: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const QUICK_TAGS = ['好吃', '实惠', '排队长', '辣', '量大', '清淡', '卫生', '服务好'];

export function ReviewForm({ restaurantId, restaurantName, onSuccess, onCancel }: ReviewFormProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                user_id: user.id,
                restaurant_id: restaurantId,
                rating,
                content: content.trim() || null,
                tags: selectedTags,
            });

            if (error) throw error;
            onSuccess();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('提交失败，请稍后重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
                <h3 className="font-bold text-lg text-gray-800">{restaurantName}</h3>
                <p className="text-sm text-gray-500">分享你的用餐体验</p>
            </div>

            {/* 评分 */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-3xl transition-transform hover:scale-110"
                        >
                            {star <= rating ? '⭐' : '☆'}
                        </button>
                    ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">{rating}/5</p>
            </div>

            {/* 快捷标签 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    快捷标签
                </label>
                <div className="flex flex-wrap gap-2">
                    {QUICK_TAGS.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-sm transition ${selectedTags.includes(tag)
                                    ? 'bg-ecnu-blue text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* 评价内容 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    写点什么（可选）
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="分享你的用餐体验..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-ecnu-blue focus:outline-none resize-none"
                />
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition"
                >
                    取消
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary disabled:opacity-50"
                >
                    {isSubmitting ? '提交中...' : '提交评价'}
                </button>
            </div>
        </form>
    );
}
