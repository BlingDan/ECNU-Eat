import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isValidEcnuEmail } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'register';
type LoginStep = 'input' | 'sent' | 'error';

export default function LoginPage() {
    const navigate = useNavigate();
    const { isConfigured, user } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<LoginStep>('input');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 如果已登录，重定向到首页
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const validateForm = (): boolean => {
        setError('');

        if (!email.trim()) {
            setError('请输入邮箱地址');
            return false;
        }

        if (!isValidEcnuEmail(email)) {
            setError('请使用华师大学生邮箱 (@stu.ecnu.edu.cn)');
            return false;
        }

        if (!password) {
            setError('请输入密码');
            return false;
        }

        if (password.length < 6) {
            setError('密码至少需要 6 位');
            return false;
        }

        if (mode === 'register' && password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }

        return true;
    };

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('邮箱或密码错误');
            }
            throw error;
        }
    };

    const handleRegister = async () => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
            },
        });

        if (error) {
            if (error.message.includes('already registered')) {
                throw new Error('该邮箱已被注册，请直接登录');
            }
            throw error;
        }

        // 注册成功，显示确认邮件提示
        setStep('sent');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            if (mode === 'login') {
                await handleLogin();
                // 登录成功会通过 useEffect 自动跳转
            } else {
                await handleRegister();
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err instanceof Error ? err.message : '操作失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConfigured) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card max-w-md w-full text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">后端未配置</h1>
                    <p className="text-gray-600">
                        请在 <code className="bg-gray-100 px-2 py-1 rounded">.env</code> 文件中配置 Supabase 凭据
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🍜</div>
                    <h1 className="text-2xl font-bold text-ecnu-blue">
                        {mode === 'login' ? '登录 ECNU Eat' : '注册 ECNU Eat'}
                    </h1>
                    <p className="text-gray-500 mt-2">使用华师大学生邮箱</p>
                </div>

                {step === 'input' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                学生邮箱
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="学号@stu.ecnu.edu.cn"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-ecnu-blue focus:outline-none transition"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                密码
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="输入密码"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-ecnu-blue focus:outline-none transition"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Confirm Password (Register only) */}
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    确认密码
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="再次输入密码"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-ecnu-blue focus:outline-none transition"
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    处理中...
                                </>
                            ) : mode === 'login' ? (
                                <>
                                    <span>🔐</span>
                                    登录
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    注册
                                </>
                            )}
                        </button>

                        {/* Toggle Mode */}
                        <div className="text-center text-sm">
                            {mode === 'login' ? (
                                <p className="text-gray-600">
                                    还没有账号？{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('register');
                                            setError('');
                                        }}
                                        className="text-ecnu-blue hover:underline font-medium"
                                    >
                                        立即注册
                                    </button>
                                </p>
                            ) : (
                                <p className="text-gray-600">
                                    已有账号？{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('login');
                                            setError('');
                                        }}
                                        className="text-ecnu-blue hover:underline font-medium"
                                    >
                                        去登录
                                    </button>
                                </p>
                            )}
                        </div>
                    </form>
                )}

                {step === 'sent' && (
                    <div className="text-center space-y-4">
                        <div className="text-6xl">✉️</div>
                        <h2 className="text-xl font-bold text-gray-800">验证邮件已发送！</h2>
                        <p className="text-gray-600">
                            请查看您的邮箱 <strong>{email}</strong>，点击邮件中的链接完成验证
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                            <p>💡 小提示：</p>
                            <ul className="list-disc list-inside mt-2 text-left">
                                <li>邮件可能在垃圾邮件文件夹中</li>
                                <li>验证后即可使用邮箱和密码登录</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => {
                                setStep('input');
                                setMode('login');
                            }}
                            className="text-ecnu-blue hover:underline"
                        >
                            ← 返回登录
                        </button>
                    </div>
                )}

                {/* Back to home */}
                <div className="mt-8 text-center">
                    <a href="/" className="text-gray-500 hover:text-ecnu-blue transition">
                        ← 返回首页
                    </a>
                </div>
            </div>
        </div>
    );
}
