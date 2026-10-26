const {
  getPortfolioWithValue,
  getAvailableBalance,
  getRealizedPnl
} = require('../services/portfolioService');
const { getPreviousSnapshot } = require('../services/snapshotService');

// GET /api/pnl
async function getPnl(req, res, next) {
  try {
    const userId = req.user.id;
    const { portfolioValue, unrealizedPnl } = await getPortfolioWithValue(userId);
    const availableBalance = await getAvailableBalance(userId);
    const totalAccountValue = portfolioValue + availableBalance;

    const realizedPnl = await getRealizedPnl(userId);
    const overallPnl = realizedPnl + unrealizedPnl;

    const previousSnapshot = await getPreviousSnapshot(userId);
    const todaysPnl = previousSnapshot
      ? totalAccountValue - Number(previousSnapshot.total_account_value)
      : 0;

    res.json({
      todaysPnl,
      overallPnl,
      realizedPnl,
      unrealizedPnl,
      totalAccountValue,
      portfolioValue,
      availableBalance
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPnl };
