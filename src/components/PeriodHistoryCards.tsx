import { formatFct, formatRate } from "@/utils/format";
import { useHistoricalPeriods } from "@/hooks/useHistoricalPeriods";

export function PeriodHistoryCards() {
  // Fetch all periods (current + historical) - no parameters needed!
  const { data: allPeriods, isLoading } = useHistoricalPeriods(12);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!allPeriods || allPeriods.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          No period data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {allPeriods.map((period) => (
          <div
            key={period.periodNumber}
            className={`
              relative p-3 sm:p-4 rounded-xl border transition-all duration-200
              ${
                period.isActive
                  ? "bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/40 shadow-lg shadow-orange-500/10"
                  : "bg-purple-900/10 border-purple-800/20 hover:bg-purple-900/20 hover:border-purple-800/30 hover:-translate-y-0.5"
              }
            `}
          >
            {/* Block Number label */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider pr-16">
              Block {period.periodStart.toLocaleString()}
            </div>

            {/* Amount Minted */}
            <div className="mb-1">
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatFct(period.minted, { compactView: true, decimals: 1 })}
              </div>
            </div>

            {/* Mint Rate */}
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {formatRate(period.rate)}
            </div>

            {/* Rate Change Arrow and Percentage */}
            {period.rateChangePct !== undefined &&
              Math.abs(period.rateChangePct) > 1 && (
                <div className="flex items-center justify-center">
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                      (period.rateChangePct || 0) > 0
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}
                  >
                    <span className="text-xs">
                      {(period.rateChangePct || 0) > 0 ? "↗" : "↘"}
                    </span>
                    <span>
                      {Math.abs(period.rateChangePct || 0).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              {period.isActive && (
                <div className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  ACTIVE
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
