# TODO

## Done in this round

- Simplified top navigation so users enter through the portfolio flow first.
- Moved analysis-specific access into portfolio detail tabs.
- Added duplicate-submit protection for stock save.
- Simplified stock add dialog to manual input only.
- Added refresh flow for holding price/insight updates.
- Added FX rate API wiring for USD/KRW conversion.
- Updated portfolio summary and stock list to show KRW-based totals for overseas holdings.
- Updated analysis view to show USD values together with KRW converted values for overseas holdings.
- Reworked several UI files to reduce Korean text corruption risk.

## Issues under verification

- Some UI files still need a full pass for Korean text consistency.
- Need to verify overseas quote + FX timing behavior with real daily market data.
- Need to verify that all overseas holdings refresh correctly after add/edit and full portfolio refresh.
- Need to verify that mixed KR + US portfolios keep summary/profit values aligned across list and analysis tabs.

## Next steps

- Run a focused pass on remaining mojibake-prone files such as prompt/login related screens.
- Verify overseas stock add/edit/refresh scenarios with several real symbols.
- Confirm same-day FX rate caching/update policy and make it explicit in UI if needed.
- Revisit stock search as a separate task with a real market search API and clear UX scope.
- Add a lightweight encoding/check script so non-UTF-8 UI files are caught before build/commit.
