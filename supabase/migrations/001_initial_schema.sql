-- ============================================================
-- ECNU Eat Phase 2 数据库迁移脚本
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============== 1. 用户资料表 ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 策略：公开读取，所有者写入
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 创建用户时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== 2. 美食集邮表 ==============
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  eaten_count INT DEFAULT 1 NOT NULL,
  last_eaten_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, restaurant_id)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections are viewable by owner" 
  ON public.collections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections" 
  ON public.collections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
  ON public.collections FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============== 3. 评价表 ==============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" 
  ON public.reviews FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own reviews" 
  ON public.reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
  ON public.reviews FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
  ON public.reviews FOR DELETE 
  USING (auth.uid() = user_id);

-- ============== 4. 房间表 ==============
CREATE TYPE room_status AS ENUM ('waiting', 'spinning', 'showing_result', 'closed');

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status room_status DEFAULT 'waiting' NOT NULL,
  settings JSONB DEFAULT '{"allowVeto": true, "mode": "wheel"}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by anyone with code" 
  ON public.rooms FOR SELECT 
  USING (true);

CREATE POLICY "Users can create rooms" 
  ON public.rooms FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update room" 
  ON public.rooms FOR UPDATE 
  USING (auth.uid() = host_id);

-- ============== 5. 房间参与者表 ==============
CREATE TABLE public.room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  is_ready BOOLEAN DEFAULT false NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by room members" 
  ON public.room_participants FOR SELECT 
  USING (true);

CREATE POLICY "Users can join rooms" 
  ON public.room_participants FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own participation" 
  ON public.room_participants FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" 
  ON public.room_participants FOR DELETE 
  USING (auth.uid() = user_id);

-- ============== 6. 房间选项表 ==============
CREATE TABLE public.room_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  restaurant_id TEXT NOT NULL,
  weight INT DEFAULT 1 NOT NULL
);

ALTER TABLE public.room_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room options are viewable by everyone" 
  ON public.room_options FOR SELECT 
  USING (true);

CREATE POLICY "Participants can add options" 
  ON public.room_options FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_participants 
      WHERE room_id = room_options.room_id AND user_id = auth.uid()
    )
  );

-- ============== 7. 房间事件表 ==============
CREATE TYPE room_event_type AS ENUM ('spin_start', 'veto_used', 'result_accepted');

CREATE TABLE public.room_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  type room_event_type NOT NULL,
  payload JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.room_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room events are viewable by everyone" 
  ON public.room_events FOR SELECT 
  USING (true);

CREATE POLICY "Participants can insert events" 
  ON public.room_events FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_participants 
      WHERE room_id = room_events.room_id AND user_id = auth.uid()
    )
  );

-- ============== 8. 用户偏好表 ==============
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  weights JSONB DEFAULT '{}' NOT NULL,
  excluded TEXT[] DEFAULT '{}' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============== 9. 决策历史表 ==============
CREATE TYPE decision_mode AS ENUM ('wheel', 'gacha', 'slot');

CREATE TABLE public.decision_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  decision_mode decision_mode NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.decision_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history" 
  ON public.decision_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" 
  ON public.decision_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============== 10. 成就表 ==============
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by owner" 
  ON public.achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" 
  ON public.achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============== 11. 餐厅统计视图 ==============
CREATE VIEW public.restaurant_stats AS
SELECT 
  restaurant_id,
  ROUND(AVG(rating)::numeric, 1) as avg_rating,
  COUNT(*) as review_count,
  (
    SELECT ARRAY_AGG(tag) 
    FROM (
      SELECT UNNEST(tags) as tag 
      FROM public.reviews r2 
      WHERE r2.restaurant_id = r.restaurant_id 
      GROUP BY UNNEST(tags) 
      ORDER BY COUNT(*) DESC 
      LIMIT 5
    ) t
  ) as popular_tags
FROM public.reviews r
GROUP BY restaurant_id;

-- ============== 12. 启用 Realtime ==============
-- 在 Supabase Dashboard 中启用以下表的 Realtime:
-- - rooms
-- - room_participants
-- - room_options
-- - room_events

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_events;

-- ============== 完成 ==============
-- 迁移脚本执行完毕！
