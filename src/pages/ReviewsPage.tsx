import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { restaurants } from '@/data/restaurants';
import type { Review } from '@/types/database';
import { ReviewCard } from '@/components/review/ReviewCard';

export default function ReviewsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchReviews();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const fetchReviews = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('确定要删除这条评价吗？')) return;

        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;
            setReviews(reviews.filter((r) => r.id !== reviewId));
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('删除失败，请稍后重试');
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">⭐</div>
                <h1 className="text-xl font-bold text-gray-800 mb-2">请先登录</h1>
                <p className="text-gray-500 mb-4">登录后即可查看你的评价</p>
                <a href="/login" className="btn-primary">
                    去登录
                </a>
            </div>
        );
    }

    // 获取餐厅名称的辅助函数
    const getRestaurantName = (restaurantId: string) => {
        const restaurant = restaurants.find((r) => r.id === restaurantId);
        return restaurant?.name || restaurantId;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">⭐ 我的评价</h1>
                <span className="text-gray-500">{reviews.length} 条</span>
            </div>

            {reviews.length === 0 ? (
                <div className="card text-center py-10">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">还没有评价</h2>
                    <p className="text-gray-500 mb-4">
                        在决策完成后可以为餐厅留下评价
                    </p>
                    <a href="/" className="btn-primary">
                        开始决策
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            restaurantName={getRestaurantName(review.restaurant_id)}
                            onDelete={() => handleDelete(review.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
