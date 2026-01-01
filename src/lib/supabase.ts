import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 调试日志
console.log('🔧 Supabase 配置:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase 配置缺失！请在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
    );
}

// 自定义 storage 适配器，确保 session 正确持久化
const customStorage = {
    getItem: (key: string) => {
        const value = localStorage.getItem(key);
        console.log('🔑 Storage getItem:', key, value ? '(有值)' : '(空)');
        return value;
    },
    setItem: (key: string, value: string) => {
        console.log('💾 Storage setItem:', key);
        localStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        console.log('🗑️ Storage removeItem:', key);
        localStorage.removeItem(key);
    },
};

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: true,
            storage: customStorage,
            storageKey: 'sb-auth-token',
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    }
);

/**
 * 检查 Supabase 是否已正确配置
 */
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * 验证邮箱是否为 ECNU 学生邮箱
 */
export function isValidEcnuEmail(email: string): boolean {
    return email.endsWith('@stu.ecnu.edu.cn');
}

/**
 * 发送 Magic Link 登录邮件
 * @param email 必须以 @stu.ecnu.edu.cn 结尾
 */
export async function sendMagicLink(email: string) {
    if (!isValidEcnuEmail(email)) {
        throw new Error('请使用华师大学生邮箱 (@stu.ecnu.edu.cn)');
    }

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/`,
        },
    });

    if (error) {
        throw error;
    }

    return true;
}

/**
 * 登出
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}
