from textwrap import dedent


def render_entry_page(app_name: str) -> str:
    return dedent(
        f"""
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{app_name}</title>
          <style>
            :root {{
              --bg: #f5efe4;
              --panel: #f9f5ee;
              --line: #d5c6b0;
              --text: #1f1a16;
              --muted: #6f5d4c;
              --brand: #176f63;
              --danger: #b5482f;
              --shadow: 0 24px 60px rgba(68, 43, 16, 0.12);
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              font-family: "Segoe UI", "Malgun Gothic", sans-serif;
              color: var(--text);
              background:
                radial-gradient(circle at top left, rgba(255,255,255,0.7), transparent 30%),
                linear-gradient(135deg, #f8f2e7 0%, var(--bg) 100%);
              min-height: 100vh;
              display: grid;
              place-items: center;
              padding: 24px;
            }}
            .card {{
              width: min(100%, 640px);
              background: rgba(249, 245, 238, 0.95);
              border: 1px solid var(--line);
              border-radius: 32px;
              padding: 42px 40px;
              box-shadow: var(--shadow);
            }}
            h1 {{ margin: 0 0 14px; font-size: clamp(2.5rem, 5vw, 4rem); line-height: 0.95; }}
            p {{ margin: 0 0 28px; color: var(--muted); font-size: 1.1rem; line-height: 1.7; }}
            label {{ display: block; margin: 0 0 10px; font-size: 1rem; font-weight: 700; }}
            input {{
              width: 100%;
              padding: 18px 20px;
              border-radius: 20px;
              border: 1px solid var(--line);
              background: #fffdf9;
              font-size: 1.05rem;
              margin-bottom: 20px;
            }}
            .actions {{ display: flex; gap: 12px; flex-wrap: wrap; }}
            button {{
              border: 1px solid var(--line);
              border-radius: 999px;
              padding: 14px 22px;
              font-size: 1rem;
              font-weight: 700;
              cursor: pointer;
            }}
            .primary {{ background: var(--brand); color: white; border-color: var(--brand); }}
            .secondary {{ background: transparent; color: var(--brand); }}
            .message {{ min-height: 28px; margin-top: 18px; font-size: 0.98rem; color: var(--danger); }}
          </style>
        </head>
        <body>
          <main class="card">
            <h1>Portfolio Monitor</h1>
            <p>이름과 생년월일을 입력해 주세요. 처음 이용하는 경우에는 사용자 생성을 눌러주세요.</p>
            <form id="entry-form">
              <label for="name">이름</label>
              <input id="name" name="name" placeholder="예: 홍길동" autocomplete="name" required />
              <label for="birth-date">생년월일</label>
              <input id="birth-date" name="birth-date" placeholder="YYYY-MM-DD" inputmode="numeric" maxlength="10" required />
              <div class="actions">
                <button type="submit" class="primary">입장</button>
                <button type="button" id="create-user" class="secondary">사용자 생성</button>
              </div>
              <div id="message" class="message"></div>
            </form>
          </main>
          <script>
            const nameInput = document.getElementById("name");
            const birthInput = document.getElementById("birth-date");
            const message = document.getElementById("message");
            const form = document.getElementById("entry-form");
            const createButton = document.getElementById("create-user");

            function formatBirthDate(value) {{
              const digits = value.replace(/\\D/g, "").slice(0, 8);
              if (digits.length <= 4) return digits;
              if (digits.length <= 6) return `${{digits.slice(0, 4)}}-${{digits.slice(4)}}`;
              return `${{digits.slice(0, 4)}}-${{digits.slice(4, 6)}}-${{digits.slice(6)}}`;
            }}

            function isValidBirthDate(value) {{
              return /^\\d{{4}}-\\d{{2}}-\\d{{2}}$/.test(value);
            }}

            async function submitProfile(url) {{
              const payload = {{
                name: nameInput.value.trim(),
                birth_date: birthInput.value.trim(),
              }};
              message.textContent = "";
              if (!payload.name) {{
                message.textContent = "이름을 입력해 주세요.";
                return;
              }}
              if (!isValidBirthDate(payload.birth_date)) {{
                message.textContent = "생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.";
                return;
              }}
              const response = await fetch(url, {{
                method: "POST",
                headers: {{ "Content-Type": "application/json" }},
                body: JSON.stringify(payload),
              }});
              const data = await response.json().catch(() => ({{}}));
              if (!response.ok) {{
                const detail = data.detail || "처리 중 오류가 발생했습니다.";
                message.textContent = typeof detail === "string" ? detail : JSON.stringify(detail);
                return;
              }}
              window.location.href = `/main/${{data.id}}`;
            }}

            birthInput.addEventListener("input", () => {{
              const digitsBefore = (birthInput.value || "").replace(/\\D/g, "").length;
              birthInput.value = formatBirthDate(birthInput.value);
              const next = birthInput.value.length >= digitsBefore + 1 ? birthInput.value.length : digitsBefore;
              birthInput.setSelectionRange(next, next);
            }});

            form.addEventListener("submit", async (event) => {{
              event.preventDefault();
              await submitProfile("/api/v1/users/enter");
            }});
            createButton.addEventListener("click", async () => {{
              await submitProfile("/api/v1/users");
            }});
          </script>
        </body>
        </html>
        """
    )


def render_user_page(app_name: str, user_id: int) -> str:
    return dedent(
        f"""
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{app_name}</title>
          <style>
            :root {{
              --bg: #f4ecdf;
              --panel: rgba(251, 247, 240, 0.92);
              --panel-strong: #fffdfa;
              --line: #d7c5aa;
              --text: #1f1a16;
              --muted: #6e5c49;
              --brand: #176f63;
              --brand-dark: #12564d;
              --danger: #b44a32;
              --warn: #b57a13;
              --shadow: 0 20px 48px rgba(55, 35, 10, 0.12);
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              font-family: "Segoe UI", "Malgun Gothic", sans-serif;
              color: var(--text);
              background:
                radial-gradient(circle at top left, rgba(255,255,255,0.75), transparent 30%),
                linear-gradient(180deg, #f9f2e7 0%, var(--bg) 100%);
            }}
            .shell {{ max-width: 1400px; margin: 0 auto; padding: 28px 20px 48px; }}
            .hero {{ display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 20px; }}
            .hero h1 {{ margin: 0; font-size: clamp(2rem, 4vw, 3.4rem); }}
            .hero p {{ margin: 8px 0 0; color: var(--muted); font-size: 1rem; }}
            .summary {{
              min-width: 280px; background: var(--panel); border: 1px solid var(--line);
              border-radius: 24px; padding: 16px 18px; box-shadow: var(--shadow);
            }}
            .summary strong {{ display: block; margin-bottom: 6px; }}
            .tabs {{
              display: inline-flex; gap: 10px; background: rgba(255,255,255,0.55); padding: 8px;
              border-radius: 999px; border: 1px solid var(--line); margin-bottom: 18px;
            }}
            .tab {{ border: 0; background: transparent; color: var(--muted); border-radius: 999px; padding: 12px 18px; font-weight: 800; cursor: pointer; }}
            .tab.active {{ background: var(--brand); color: white; }}
            .panel {{ display: none; }}
            .panel.active {{ display: block; }}
            .grid {{ display: grid; grid-template-columns: 1.05fr 1.4fr; gap: 18px; }}
            .card {{
              background: var(--panel); border: 1px solid var(--line); border-radius: 28px;
              padding: 22px; box-shadow: var(--shadow);
            }}
            .card h2, .card h3 {{ margin: 0 0 12px; }}
            .subtext {{ color: var(--muted); line-height: 1.6; margin-bottom: 16px; }}
            .field-grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }}
            .field {{ margin-bottom: 12px; }}
            .field.full {{ grid-column: 1 / -1; }}
            label {{ display: block; margin-bottom: 8px; font-weight: 700; }}
            input, select {{
              width: 100%; border: 1px solid var(--line); border-radius: 18px;
              padding: 14px 16px; background: var(--panel-strong); font-size: 0.98rem;
            }}
            button {{
              border: 1px solid var(--line); border-radius: 999px; padding: 12px 18px;
              background: white; font-weight: 700; cursor: pointer;
            }}
            .button-row {{ display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }}
            .primary {{ background: var(--brand); border-color: var(--brand); color: white; }}
            .danger {{ color: var(--danger); }}
            .muted {{ color: var(--muted); }}
            .stack {{ display: grid; gap: 14px; max-height: 60vh; overflow: auto; padding-right: 4px; }}
            .item {{ border: 1px solid var(--line); border-radius: 22px; background: rgba(255,255,255,0.5); padding: 16px; }}
            .item.active {{ border-color: var(--brand); box-shadow: inset 0 0 0 1px rgba(23,111,99,0.2); }}
            .item-title {{ display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; align-items: start; }}
            .meta {{ color: var(--muted); font-size: 0.95rem; line-height: 1.6; }}
            .work-layout {{ display: grid; grid-template-columns: minmax(360px, 460px) minmax(0, 1fr); gap: 18px; }}
            .metric-grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }}
            .metric {{ border: 1px solid var(--line); border-radius: 18px; padding: 14px; background: rgba(255,255,255,0.52); }}
            .metric strong {{ display: block; font-size: 1.25rem; margin-top: 6px; }}
            .section-title {{ margin: 18px 0 10px; font-size: 1rem; }}
            .list {{ display: grid; gap: 10px; }}
            .list-item {{ border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px; background: rgba(255,255,255,0.52); }}
            .chart {{ margin: 10px 0 18px; border: 1px solid var(--line); border-radius: 18px; padding: 12px; background: rgba(255,255,255,0.55); }}
            .message {{ min-height: 24px; margin-top: 12px; color: var(--danger); font-size: 0.95rem; }}
            .empty {{ padding: 26px; border: 1px dashed var(--line); border-radius: 20px; color: var(--muted); background: rgba(255,255,255,0.35); }}
            @media (max-width: 1100px) {{
              .grid, .work-layout {{ grid-template-columns: 1fr; }}
              .hero {{ flex-direction: column; align-items: stretch; }}
            }}
            @media (max-width: 720px) {{
              .field-grid, .metric-grid {{ grid-template-columns: 1fr; }}
              .shell {{ padding: 18px 14px 40px; }}
              .card {{ padding: 18px; border-radius: 22px; }}
            }}
          </style>
        </head>
        <body>
          <div class="shell">
            <section class="hero">
              <div>
                <h1>포트폴리오 워크스페이스</h1>
                <p>설정에서 포트폴리오를 관리하고, 포트폴리오 작업에서 종목과 대시보드를 함께 관리합니다.</p>
              </div>
              <div class="summary">
                <strong>현재 선택 상태</strong>
                <div id="selection-summary" class="meta">포트폴리오와 종목을 선택해 주세요.</div>
              </div>
            </section>

            <div class="tabs">
              <button id="tab-settings" class="tab active" type="button">설정</button>
              <button id="tab-work" class="tab" type="button">포트폴리오 작업</button>
            </div>

            <section id="panel-settings" class="panel active">
              <div class="grid">
                <article class="card">
                  <h2>포트폴리오 설정</h2>
                  <div class="subtext">여기서는 포트폴리오 추가, 수정, 삭제만 처리합니다. 배당 포트는 이후 단계에서 확장합니다.</div>
                  <form id="portfolio-form">
                    <div class="field-grid">
                      <div class="field full">
                        <label for="portfolio-name">포트폴리오 이름</label>
                        <input id="portfolio-name" placeholder="예: 한국 주식 장기투자" required />
                      </div>
                      <div class="field">
                        <label for="portfolio-type">포트 유형</label>
                        <select id="portfolio-type">
                          <option value="general">일반 포트</option>
                          <option value="dividend" disabled>배당 포트 (추후 지원)</option>
                        </select>
                      </div>
                      <div class="field">
                        <label for="portfolio-currency">기준 통화</label>
                        <select id="portfolio-currency">
                          <option value="KRW">KRW</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div class="field">
                        <label for="portfolio-budget">월 예산</label>
                        <input id="portfolio-budget" type="number" min="0" step="0.01" placeholder="선택 입력" />
                      </div>
                      <div class="field">
                        <label for="portfolio-weight">목표 비중</label>
                        <input id="portfolio-weight" type="number" min="0" step="0.01" placeholder="선택 입력" />
                      </div>
                    </div>
                    <div class="button-row">
                      <button id="save-portfolio" class="primary" type="submit">포트폴리오 저장</button>
                      <button id="reset-portfolio" type="button">입력 초기화</button>
                    </div>
                    <div id="portfolio-message" class="message"></div>
                  </form>
                </article>

                <article class="card">
                  <h2>등록된 포트폴리오</h2>
                  <div class="subtext">포트를 선택하면 해당 포트 기준으로 종목 작업 탭이 열립니다.</div>
                  <div id="portfolio-list" class="stack"></div>
                </article>
              </div>
            </section>

            <section id="panel-work" class="panel">
              <div class="work-layout">
                <div class="stack">
                  <article class="card">
                    <h2>포트폴리오 작업</h2>
                    <div class="field">
                      <label for="active-portfolio">작업할 포트폴리오</label>
                      <select id="active-portfolio"></select>
                    </div>
                    <div class="subtext">포트폴리오를 선택하면 아래에 종목 목록이 나오고, 종목을 고르면 오른쪽에 가격, 이벤트, 뉴스, 차트가 함께 표시됩니다.</div>
                  </article>

                  <article class="card">
                    <h3>종목 추가 / 수정</h3>
                    <form id="holding-form">
                      <div class="field-grid">
                        <div class="field">
                          <label for="holding-symbol">종목 코드</label>
                          <input id="holding-symbol" placeholder="예: 005930 또는 AAPL" required />
                        </div>
                        <div class="field">
                          <label for="holding-name">종목명</label>
                          <input id="holding-name" placeholder="예: 삼성전자" required />
                        </div>
                        <div class="field">
                          <label for="holding-market">시장</label>
                          <select id="holding-market">
                            <option value="KR">KR</option>
                            <option value="US">US</option>
                          </select>
                        </div>
                        <div class="field">
                          <label for="holding-currency">통화</label>
                          <select id="holding-currency">
                            <option value="KRW">KRW</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                        <div class="field">
                          <label for="holding-quantity">수량</label>
                          <input id="holding-quantity" type="number" min="0.0001" step="0.0001" required />
                        </div>
                        <div class="field">
                          <label for="holding-avg-price">평균단가</label>
                          <input id="holding-avg-price" type="number" min="0.0001" step="0.0001" required />
                        </div>
                      </div>
                      <div class="button-row">
                        <button id="save-holding" class="primary" type="submit">종목 저장</button>
                        <button id="reset-holding" type="button">입력 초기화</button>
                      </div>
                      <div id="holding-message" class="message"></div>
                    </form>
                  </article>

                  <article class="card">
                    <h3>종목 리스트</h3>
                    <div id="holding-list" class="stack"></div>
                  </article>
                </div>

                <article class="card">
                  <h2>종목 대시보드</h2>
                  <div id="insights-panel" class="empty">왼쪽에서 포트폴리오와 종목을 선택해 주세요.</div>
                </article>
              </div>
            </section>
          </div>

          <script>
            const userId = {user_id};
            let portfoliosCache = [];
            let holdingsCache = [];
            let activePortfolioId = null;
            let editingPortfolioId = null;
            let editingHoldingId = null;
            let selectedHoldingId = null;

            const els = {{
              tabSettings: document.getElementById("tab-settings"),
              tabWork: document.getElementById("tab-work"),
              panelSettings: document.getElementById("panel-settings"),
              panelWork: document.getElementById("panel-work"),
              selectionSummary: document.getElementById("selection-summary"),
              portfolioList: document.getElementById("portfolio-list"),
              portfolioForm: document.getElementById("portfolio-form"),
              portfolioName: document.getElementById("portfolio-name"),
              portfolioType: document.getElementById("portfolio-type"),
              portfolioCurrency: document.getElementById("portfolio-currency"),
              portfolioBudget: document.getElementById("portfolio-budget"),
              portfolioWeight: document.getElementById("portfolio-weight"),
              portfolioMessage: document.getElementById("portfolio-message"),
              resetPortfolio: document.getElementById("reset-portfolio"),
              activePortfolio: document.getElementById("active-portfolio"),
              holdingForm: document.getElementById("holding-form"),
              holdingSymbol: document.getElementById("holding-symbol"),
              holdingName: document.getElementById("holding-name"),
              holdingMarket: document.getElementById("holding-market"),
              holdingCurrency: document.getElementById("holding-currency"),
              holdingQuantity: document.getElementById("holding-quantity"),
              holdingAvgPrice: document.getElementById("holding-avg-price"),
              holdingMessage: document.getElementById("holding-message"),
              resetHolding: document.getElementById("reset-holding"),
              holdingList: document.getElementById("holding-list"),
              insightsPanel: document.getElementById("insights-panel"),
            }};

            function setMessage(node, text, tone = "error") {{
              node.textContent = text || "";
              node.style.color = tone === "success" ? "var(--brand)" : tone === "warn" ? "var(--warn)" : "var(--danger)";
            }}

            function money(value, currency = "") {{
              if (value === null || value === undefined || value === "") return "-";
              const number = Number(value);
              if (Number.isNaN(number)) return String(value);
              return `${{number.toLocaleString("ko-KR", {{ maximumFractionDigits: 2 }})}}${{currency ? ` ${{currency}}` : ""}}`;
            }}

            function formatDate(value) {{
              if (!value) return "-";
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) return value;
              return date.toLocaleString("ko-KR");
            }}

            function getActivePortfolio() {{
              return portfoliosCache.find((item) => item.id === activePortfolioId) || null;
            }}

            function getSelectedHolding() {{
              return holdingsCache.find((item) => item.id === selectedHoldingId) || null;
            }}

            function updateSelectionSummary() {{
              const portfolio = getActivePortfolio();
              const holding = getSelectedHolding();
              const parts = [];
              parts.push(`선택 포트: ${{portfolio ? portfolio.name : "없음"}}`);
              parts.push(`선택 종목: ${{holding ? `${{holding.symbol}} / ${{holding.name}}` : "없음"}}`);
              els.selectionSummary.textContent = parts.join(" / ");
            }}

            function switchTab(name) {{
              const settings = name === "settings";
              els.tabSettings.classList.toggle("active", settings);
              els.tabWork.classList.toggle("active", !settings);
              els.panelSettings.classList.toggle("active", settings);
              els.panelWork.classList.toggle("active", !settings);
            }}

            function resetPortfolioForm() {{
              editingPortfolioId = null;
              els.portfolioForm.reset();
              els.portfolioType.value = "general";
              els.portfolioCurrency.value = "KRW";
              document.getElementById("save-portfolio").textContent = "포트폴리오 저장";
              setMessage(els.portfolioMessage, "");
            }}

            function resetHoldingForm() {{
              editingHoldingId = null;
              els.holdingForm.reset();
              els.holdingMarket.value = "KR";
              els.holdingCurrency.value = "KRW";
              document.getElementById("save-holding").textContent = "종목 저장";
              setMessage(els.holdingMessage, "");
            }}

            function renderInsightsEmpty(text) {{
              els.insightsPanel.className = "empty";
              els.insightsPanel.innerHTML = text;
            }}

            function renderSimpleChart(avgPrice, currentPrice, currency) {{
              if (!avgPrice && !currentPrice) return "";
              const maxValue = Math.max(avgPrice || 0, currentPrice || 0, 1);
              const avgX = (Number(avgPrice || 0) / maxValue) * 260 + 20;
              const currentX = (Number(currentPrice || 0) / maxValue) * 260 + 20;
              return `
                <div class="chart">
                  <svg viewBox="0 0 320 120" width="100%" height="120" role="img" aria-label="가격 비교 차트">
                    <line x1="20" y1="90" x2="300" y2="90" stroke="#c8b89f" stroke-width="2"></line>
                    <line x1="20" y1="30" x2="${{avgX}}" y2="30" stroke="#b57a13" stroke-width="10" stroke-linecap="round"></line>
                    <line x1="20" y1="70" x2="${{currentX}}" y2="70" stroke="#176f63" stroke-width="10" stroke-linecap="round"></line>
                    <text x="20" y="20" fill="#6e5c49" font-size="12">평균단가 ${{money(avgPrice, currency)}}</text>
                    <text x="20" y="108" fill="#6e5c49" font-size="12">현재가 ${{money(currentPrice, currency)}}</text>
                  </svg>
                </div>
              `;
            }}

            function renderPortfolioOptions() {{
              if (!portfoliosCache.length) {{
                els.activePortfolio.innerHTML = '<option value="">포트폴리오를 먼저 만들어 주세요</option>';
                activePortfolioId = null;
                updateSelectionSummary();
                return;
              }}
              els.activePortfolio.innerHTML = portfoliosCache.map((item) => `
                <option value="${{item.id}}">${{item.name}} (일반 포트)</option>
              `).join("");
              if (!activePortfolioId || !portfoliosCache.some((item) => item.id === activePortfolioId)) {{
                activePortfolioId = portfoliosCache[0].id;
              }}
              els.activePortfolio.value = String(activePortfolioId);
              updateSelectionSummary();
            }}

            function renderPortfolios() {{
              if (!portfoliosCache.length) {{
                els.portfolioList.innerHTML = '<div class="empty">아직 등록된 일반 포트폴리오가 없습니다.</div>';
                return;
              }}
              els.portfolioList.innerHTML = portfoliosCache.map((item) => `
                <div class="item ${{item.id === activePortfolioId ? "active" : ""}}">
                  <div class="item-title">
                    <div>
                      <strong>${{item.name}}</strong>
                      <div class="meta">유형: 일반 포트 / 통화: ${{item.base_currency}}</div>
                    </div>
                  </div>
                  <div class="meta">월 예산: ${{money(item.monthly_budget, item.base_currency)}} / 목표 비중: ${{item.target_weight ?? "-"}}</div>
                  <div class="button-row">
                    <button type="button" onclick="openPortfolioWork(${{item.id}})">이 포트 작업</button>
                    <button type="button" onclick="editPortfolio(${{item.id}})">수정</button>
                    <button type="button" class="danger" onclick="deletePortfolio(${{item.id}})">삭제</button>
                  </div>
                </div>
              `).join("");
            }}

            function renderHoldings() {{
              if (!activePortfolioId) {{
                els.holdingList.innerHTML = '<div class="empty">작업할 포트폴리오를 먼저 선택해 주세요.</div>';
                return;
              }}
              if (!holdingsCache.length) {{
                els.holdingList.innerHTML = '<div class="empty">이 포트폴리오에는 아직 종목이 없습니다.</div>';
                return;
              }}
              els.holdingList.innerHTML = holdingsCache.map((item) => `
                <div class="item ${{item.id === selectedHoldingId ? "active" : ""}}">
                  <div class="item-title">
                    <div>
                      <strong>${{item.symbol}} / ${{item.name}}</strong>
                      <div class="meta">시장: ${{item.market}} / 통화: ${{item.currency}}</div>
                    </div>
                  </div>
                  <div class="meta">수량: ${{money(item.quantity)}} / 평균단가: ${{money(item.avg_price, item.currency)}}</div>
                  <div class="button-row">
                    <button type="button" onclick="selectHolding(${{item.id}})">대시보드 보기</button>
                    <button type="button" onclick="editHolding(${{item.id}})">수정</button>
                    <button type="button" class="danger" onclick="deleteHolding(${{item.id}})">삭제</button>
                  </div>
                </div>
              `).join("");
            }}

            async function loadPortfolios() {{
              const response = await fetch(`/api/v1/users/${{userId}}/portfolios`);
              if (!response.ok) {{
                renderInsightsEmpty("포트폴리오 정보를 불러오지 못했습니다.");
                return;
              }}
              portfoliosCache = await response.json();
              portfoliosCache = portfoliosCache.filter((item) => item.portfolio_type === "general");
              renderPortfolioOptions();
              renderPortfolios();
              if (activePortfolioId) {{
                await loadHoldings();
              }} else {{
                holdingsCache = [];
                renderHoldings();
                renderInsightsEmpty("일반 포트폴리오를 먼저 만들어 주세요.");
              }}
            }}

            async function loadHoldings() {{
              if (!activePortfolioId) {{
                holdingsCache = [];
                renderHoldings();
                renderInsightsEmpty("작업할 포트폴리오를 선택해 주세요.");
                return;
              }}
              const response = await fetch(`/api/v1/users/${{userId}}/holdings?portfolio_id=${{activePortfolioId}}`);
              if (!response.ok) {{
                setMessage(els.holdingMessage, "종목 목록을 불러오지 못했습니다.");
                return;
              }}
              holdingsCache = await response.json();
              if (!holdingsCache.some((item) => item.id === selectedHoldingId)) {{
                selectedHoldingId = holdingsCache[0]?.id ?? null;
              }}
              renderHoldings();
              updateSelectionSummary();
              if (selectedHoldingId) {{
                await loadHoldingInsights(selectedHoldingId);
              }} else {{
                renderInsightsEmpty("이 포트폴리오에는 아직 종목이 없습니다.");
              }}
            }}

            async function loadHoldingInsights(holdingId) {{
              selectedHoldingId = holdingId;
              updateSelectionSummary();
              renderHoldings();
              els.insightsPanel.className = "";
              els.insightsPanel.innerHTML = "데이터를 불러오는 중입니다.";

              await fetch(`/api/v1/users/${{userId}}/holdings/${{holdingId}}/refresh`, {{ method: "POST" }}).catch(() => null);
              const response = await fetch(`/api/v1/users/${{userId}}/holdings/${{holdingId}}/insights`);
              if (!response.ok) {{
                renderInsightsEmpty("종목 대시보드를 불러오지 못했습니다.");
                return;
              }}
              const data = await response.json();
              const holding = data.holding;
              const latest = data.latest_price;
              const currentPrice = latest ? Number(latest.price) : null;
              const avgPrice = Number(holding.avg_price);
              const quantity = Number(holding.quantity);
              const cost = avgPrice * quantity;
              const value = currentPrice !== null ? currentPrice * quantity : null;
              const pnl = value !== null ? value - cost : null;
              const pnlPercent = pnl !== null && cost ? (pnl / cost) * 100 : null;

              els.insightsPanel.className = "";
              els.insightsPanel.innerHTML = `
                <div class="metric-grid">
                  <div class="metric"><div class="muted">종목</div><strong>${{holding.symbol}} / ${{holding.name}}</strong></div>
                  <div class="metric"><div class="muted">현재가</div><strong>${{latest ? money(latest.price, latest.currency) : "데이터 없음"}}</strong></div>
                  <div class="metric"><div class="muted">평가손익</div><strong>${{pnl === null ? "-" : money(pnl, holding.currency)}}</strong></div>
                  <div class="metric"><div class="muted">수익률</div><strong>${{pnlPercent === null ? "-" : `${{pnlPercent.toFixed(2)}}%`}}</strong></div>
                </div>
                ${{renderSimpleChart(avgPrice, currentPrice, holding.currency)}}
                <div class="meta">보유 수량: ${{money(holding.quantity)}} / 평균단가: ${{money(holding.avg_price, holding.currency)}} / 최근 가격 시각: ${{latest ? formatDate(latest.as_of) : "-"}}</div>
                <h3 class="section-title">실적 / 이벤트</h3>
                <div class="list">
                  ${{data.earnings_events.length
                    ? data.earnings_events.map((event) => `<div class="list-item"><strong>${{event.event_type}}</strong><div class="meta">${{formatDate(event.event_date)}} / 출처: ${{event.source || "-"}}</div></div>`).join("")
                    : '<div class="empty">등록된 이벤트가 없습니다.</div>'}}
                </div>
                <h3 class="section-title">뉴스</h3>
                <div class="list">
                  ${{data.news_headlines.length
                    ? data.news_headlines.map((news) => `<div class="list-item"><strong><a href="${{news.url}}" target="_blank" rel="noreferrer">${{news.headline}}</a></strong><div class="meta">${{formatDate(news.published_at)}} / 출처: ${{news.source || "-"}}</div></div>`).join("")
                    : '<div class="empty">등록된 뉴스가 없습니다.</div>'}}
                </div>
              `;
            }}

            async function savePortfolio(event) {{
              event.preventDefault();
              const isEdit = editingPortfolioId !== null;
              const payload = {{
                name: els.portfolioName.value.trim(),
                portfolio_type: "general",
                base_currency: els.portfolioCurrency.value,
                monthly_budget: els.portfolioBudget.value ? Number(els.portfolioBudget.value) : null,
                target_weight: els.portfolioWeight.value ? Number(els.portfolioWeight.value) : null,
              }};
              if (!payload.name) {{
                setMessage(els.portfolioMessage, "포트폴리오 이름을 입력해 주세요.");
                return;
              }}
              const url = isEdit
                ? `/api/v1/users/${{userId}}/portfolios/${{editingPortfolioId}}`
                : `/api/v1/users/${{userId}}/portfolios`;
              const method = isEdit ? "PUT" : "POST";
              const response = await fetch(url, {{
                method,
                headers: {{ "Content-Type": "application/json" }},
                body: JSON.stringify(payload),
              }});
              const data = await response.json().catch(() => ({{}}));
              if (!response.ok) {{
                setMessage(els.portfolioMessage, data.detail || "포트폴리오 저장에 실패했습니다.");
                return;
              }}
              activePortfolioId = data.id;
              resetPortfolioForm();
              setMessage(els.portfolioMessage, isEdit ? "포트폴리오를 수정했습니다." : "포트폴리오를 추가했습니다.", "success");
              await loadPortfolios();
            }}

            async function saveHolding(event) {{
              event.preventDefault();
              if (!activePortfolioId) {{
                setMessage(els.holdingMessage, "먼저 작업할 포트폴리오를 선택해 주세요.");
                return;
              }}
              const isEdit = editingHoldingId !== null;
              const payload = {{
                portfolio_id: activePortfolioId,
                symbol: els.holdingSymbol.value.trim(),
                name: els.holdingName.value.trim(),
                market: els.holdingMarket.value,
                currency: els.holdingCurrency.value,
                quantity: Number(els.holdingQuantity.value),
                avg_price: Number(els.holdingAvgPrice.value),
              }};
              if (!payload.symbol || !payload.name || !payload.quantity || !payload.avg_price) {{
                setMessage(els.holdingMessage, "종목 입력값을 모두 확인해 주세요.");
                return;
              }}
              const url = isEdit
                ? `/api/v1/users/${{userId}}/holdings/${{editingHoldingId}}`
                : `/api/v1/users/${{userId}}/holdings`;
              const method = isEdit ? "PUT" : "POST";
              const response = await fetch(url, {{
                method,
                headers: {{ "Content-Type": "application/json" }},
                body: JSON.stringify(payload),
              }});
              const data = await response.json().catch(() => ({{}}));
              if (!response.ok) {{
                setMessage(els.holdingMessage, data.detail || "종목 저장에 실패했습니다.");
                return;
              }}
              selectedHoldingId = data.id;
              resetHoldingForm();
              setMessage(els.holdingMessage, isEdit ? "종목을 수정했습니다." : "종목을 추가했습니다.", "success");
              await loadHoldings();
            }}

            window.openPortfolioWork = async function(portfolioId) {{
              activePortfolioId = portfolioId;
              renderPortfolioOptions();
              renderPortfolios();
              switchTab("work");
              await loadHoldings();
            }};

            window.editPortfolio = function(portfolioId) {{
              const item = portfoliosCache.find((portfolio) => portfolio.id === portfolioId);
              if (!item) return;
              editingPortfolioId = item.id;
              els.portfolioName.value = item.name;
              els.portfolioType.value = "general";
              els.portfolioCurrency.value = item.base_currency;
              els.portfolioBudget.value = item.monthly_budget ?? "";
              els.portfolioWeight.value = item.target_weight ?? "";
              document.getElementById("save-portfolio").textContent = "포트폴리오 수정";
              setMessage(els.portfolioMessage, "수정 모드입니다.", "warn");
              switchTab("settings");
            }};

            window.deletePortfolio = async function(portfolioId) {{
              if (!confirm("이 포트폴리오와 연결된 종목을 삭제할까요?")) return;
              const response = await fetch(`/api/v1/users/${{userId}}/portfolios/${{portfolioId}}`, {{ method: "DELETE" }});
              if (!response.ok) {{
                setMessage(els.portfolioMessage, "포트폴리오 삭제에 실패했습니다.");
                return;
              }}
              if (activePortfolioId === portfolioId) {{
                activePortfolioId = null;
                selectedHoldingId = null;
              }}
              resetPortfolioForm();
              await loadPortfolios();
            }};

            window.selectHolding = async function(holdingId) {{
              await loadHoldingInsights(holdingId);
            }};

            window.editHolding = function(holdingId) {{
              const item = holdingsCache.find((holding) => holding.id === holdingId);
              if (!item) return;
              editingHoldingId = item.id;
              els.holdingSymbol.value = item.symbol;
              els.holdingName.value = item.name;
              els.holdingMarket.value = item.market;
              els.holdingCurrency.value = item.currency;
              els.holdingQuantity.value = item.quantity;
              els.holdingAvgPrice.value = item.avg_price;
              document.getElementById("save-holding").textContent = "종목 수정";
              setMessage(els.holdingMessage, "수정 모드입니다.", "warn");
            }};

            window.deleteHolding = async function(holdingId) {{
              if (!confirm("이 종목을 삭제할까요?")) return;
              const response = await fetch(`/api/v1/users/${{userId}}/holdings/${{holdingId}}`, {{ method: "DELETE" }});
              if (!response.ok) {{
                setMessage(els.holdingMessage, "종목 삭제에 실패했습니다.");
                return;
              }}
              if (selectedHoldingId === holdingId) {{
                selectedHoldingId = null;
              }}
              resetHoldingForm();
              await loadHoldings();
            }};

            els.tabSettings.addEventListener("click", () => switchTab("settings"));
            els.tabWork.addEventListener("click", () => switchTab("work"));
            els.portfolioForm.addEventListener("submit", savePortfolio);
            els.holdingForm.addEventListener("submit", saveHolding);
            els.resetPortfolio.addEventListener("click", resetPortfolioForm);
            els.resetHolding.addEventListener("click", resetHoldingForm);
            els.activePortfolio.addEventListener("change", async (event) => {{
              activePortfolioId = Number(event.target.value) || null;
              selectedHoldingId = null;
              renderPortfolios();
              await loadHoldings();
            }});

            resetPortfolioForm();
            resetHoldingForm();
            loadPortfolios();
          </script>
        </body>
        </html>
        """
    )
