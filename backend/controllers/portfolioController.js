const { getPortfolioWithValue, getAvailableBalance } = require('../services/portfolioService');

// GET /api/portfolio -> list of holdings with live values
async function getPortfolio(req, res, next) {
  try {
    const { holdings } = await getPortfolioWithValue(req.user.id);
    res.json(holdings);
  } catch (err) {
    next(err);
  }
}

// GET /api/portfolio/summary -> totals + allocation %
async function getPortfolioSummary(req, res, next) {
  try {
    const { holdings, portfolioValue, investedValue, unrealizedPnl } =
      await getPortfolioWithValue(req.user.id);
    const availableBalance = await getAvailableBalance(req.user.id);

    const allocation = holdings.map((h) => ({
      symbol: h.symbol,
      companyName: h.companyName,
      value: h.currentValue,
      // Dynamically calculated allocation percentage — never hard-coded.
      percentage: portfolioValue > 0 ? (h.currentValue / portfolioValue) * 100 : 0
    }));

    res.json({
      availableBalance,
      investedValue,
      portfolioValue,
      totalAccountValue: availableBalance + portfolioValue,
      unrealizedPnl,
      allocation
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPortfolio, getPortfolioSummary };
