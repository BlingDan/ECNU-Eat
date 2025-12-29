import { DecisionSession } from '@/types';

interface ResultScreenProps {
  session: DecisionSession;
  onVeto: () => void;
  onConfirm: () => void;
  onRestart: () => void;
}

/**
 * 决策结果组件
 */
export function ResultScreen({ session, onVeto, onConfirm, onRestart }: ResultScreenProps) {
  const { result, vetoUsed, retryCount, maxRetries } = session;

  if (!result) {
    return null;
  }

  const canVeto = !vetoUsed && retryCount < maxRetries;
  const remainingRetries = maxRetries - retryCount;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* 结果卡片 */}
      <div className="card text-center animate-result-bounce">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-ecnu-blue mb-2">食神的旨意</h2>
        <p className="text-gray-600 mb-6">就是这里了！</p>

        {/* 餐厅信息 */}
        <div className="bg-gradient-to-r from-ecnu-red/10 to-ecnu-blue/10 rounded-xl p-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{result.name}</h3>
          <p className="text-gray-600 mb-3">{result.location.name}</p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {result.cuisine.map((c) => (
              <span key={c} className="px-2 py-1 bg-white rounded-full text-sm">
                {c}
              </span>
            ))}
          </div>

          {/* 额外信息 */}
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <span>{'¥'.repeat(result.priceLevel)}</span>
            {result.spicyLevel !== undefined && result.spicyLevel > 0 && (
              <span>{'🌶️'.repeat(result.spicyLevel)}</span>
            )}
            {result.estimatedCalories && (
              <span>≈{result.estimatedCalories} kcal</span>
            )}
          </div>
        </div>

        {/* 状态信息 */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>第 {retryCount} 次抽取</p>
          {vetoUsed && <p className="text-ecnu-red">已使用否决权</p>}
          {!canVeto && retryCount >= maxRetries && (
            <p className="text-ecnu-red">已达到最大重试次数</p>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        {/* 确认按钮 */}
        <button onClick={onConfirm} className="btn-primary w-full text-lg">
          接受安排，去吃饭！
        </button>

        {/* 否决按钮 */}
        {canVeto && (
          <button
            onClick={onVeto}
            className="btn-secondary w-full"
          >
            使用否决权重抽 (剩余 {remainingRetries} 次)
          </button>
        )}

        {/* 重新开始 */}
        <button
          onClick={onRestart}
          className="w-full text-center text-gray-500 hover:text-ecnu-blue transition"
        >
          重新开始
        </button>
      </div>

      {/* 规则说明 */}
      <div className="card bg-gray-50">
        <h4 className="font-bold text-gray-800 mb-2 text-sm">规则说明</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 每局最多可以使用 1 次否决权</li>
          <li>• 总共最多重抽 3 次</li>
          <li>• 最终结果具有约束力，请遵守食神的旨意！</li>
        </ul>
      </div>
    </div>
  );
}
