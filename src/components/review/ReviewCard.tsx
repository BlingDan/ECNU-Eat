import type { Review } from '@/types/database';

interface ReviewCardProps {
    review: Review;
    restaurantName: string;
    onDelete?: () => void;
}

export function ReviewCard({ review, restaurantName, onDelete }: ReviewCardProps) {
    const formattedDate = new Date(review.created_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div className="card">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h3 className="font-bold text-gray-800">{restaurantName}</h3>
                    <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < review.rating ? '⭐' : '☆'}</span>
                        ))}
                        <span className="text-gray-500 text-sm ml-1">{review.rating}/5</span>
                    </div>
                </div>
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="text-gray-400 hover:text-red-500 transition"
                        title="删除评价"
                    >
                        🗑️
                    </button>
                )}
            </div>

            {review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {review.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-ecnu-blue/10 text-ecnu-blue text-xs"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {review.content && (
                <p className="text-gray-600 text-sm">{review.content}</p>
            )}

            <div className="mt-3 text-xs text-gray-400">{formattedDate}</div>
        </div>
    );
}
