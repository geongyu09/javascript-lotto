(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const LottoList = (lottos) => {
  return `
    <p class="lotto-list__info">총 ${lottos.length}개를 구매하였습니다.</p>
    <ul class="lotto-list__items">
      ${lottos.map((lotto) => `<li class="lotto-list__item"><img src="${"/javascript-lotto/"}assets/Lotto.png" alt="로또" width="34px" /> ${lotto.parseNumbers().join(", ")}</li>`).join("")}
    </ul>
  `;
};
class LottoRankCalculator {
  static calculateLottoRanks({ lottos, winningNumbers, bonusNumber }) {
    const ranks = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    lottos.forEach((lotto) => {
      const rank = LottoRankCalculator.calculateLottoRank({
        lotto,
        winningNumbers,
        bonusNumber
      });
      ranks[rank] += 1;
    });
    return ranks;
  }
  static calculateLottoRank({ lotto, winningNumbers, bonusNumber }) {
    const matchCount = lotto.matchCount(winningNumbers);
    if (matchCount === 6) {
      return 1;
    } else if (matchCount === 5 && lotto.includes(bonusNumber)) {
      return 2;
    } else if (matchCount === 5) {
      return 3;
    } else if (matchCount === 4) {
      return 4;
    } else if (matchCount === 3) {
      return 5;
    }
    return 6;
  }
}
const RETURN_AMOUNT_BY_RANK = {
  1: 2e9,
  2: 3e7,
  3: 15e5,
  4: 5e4,
  5: 5e3,
  6: 0
};
class LottoReturnCalculator {
  static calculateReturnAmount(rank) {
    return Object.entries(rank).reduce((sum, [r, c]) => {
      const returnAmount = c * RETURN_AMOUNT_BY_RANK[r];
      return sum + returnAmount;
    }, 0);
  }
  static calculateReturnRate(returnAmount, purchaseAmount) {
    return returnAmount / purchaseAmount * 100;
  }
}
const ERROR_MESSAGE = {
  AMOUNT: {
    POSITIVE: "구입 금액은 양수여야 합니다.",
    UNIT: "구입 금액은 1,000원 단위여야 합니다."
  },
  LOTTO: {
    INTEGER: "로또 번호는 정수여야 합니다.",
    RANGE: "로또 번호는 1부터 45 사이여야 합니다.",
    DUPLICATE: "로또 번호는 중복될 수 없습니다."
  },
  WINNING_NUMBERS: {
    INTEGER: "당첨 번호는 정수여야 합니다.",
    RANGE: "당첨 번호는 1부터 45 사이여야 합니다.",
    DUPLICATE: "당첨 번호는 중복될 수 없습니다.",
    LENGTH: "당첨 번호는 6개여야 합니다."
  },
  BONUS_NUMBER: {
    NUMBER: "보너스 번호는 숫자여야 합니다.",
    INTEGER: "보너스 번호는 정수여야 합니다.",
    RANGE: "보너스 번호는 1부터 45 사이여야 합니다.",
    DUPLICATE: "당첨 번호와 보너스 번호는 중복될 수 없습니다."
  }
};
const LOTTO = {
  UNIT: 1e3,
  MAX: 45,
  MIN: 1,
  LENGTH: 6
};
class LottoNumber {
  #number;
  constructor(number) {
    this.validateNumber(number);
    this.#number = number;
  }
  equals(other) {
    return this.#number === other.valueOf();
  }
  valueOf() {
    return this.#number;
  }
  validateNumber(number) {
    if (!Number.isInteger(number)) {
      throw new Error(ERROR_MESSAGE.LOTTO.INTEGER);
    }
    if (number < 1 || number > 45) {
      throw new Error(ERROR_MESSAGE.LOTTO.RANGE);
    }
  }
}
class WinningNumbersAndBonusNumberBuilder {
  #winningNumbers;
  #bonusNumber;
  setWinningNumbers(winningNumbers) {
    this.validateWinningNumbers(winningNumbers);
    this.#winningNumbers = winningNumbers.map(
      (number) => new LottoNumber(number)
    );
    return this;
  }
  setBonusNumber(bonusNumber) {
    this.validateBonusNumber(bonusNumber);
    this.#bonusNumber = new LottoNumber(bonusNumber);
    return this;
  }
  build() {
    return {
      winningNumbers: this.#winningNumbers,
      bonusNumber: this.#bonusNumber
    };
  }
  validateWinningNumbers(winningNumbers) {
    const uniqueNumbers = new Set(winningNumbers);
    if (uniqueNumbers.size !== winningNumbers.length) {
      throw new Error(ERROR_MESSAGE.WINNING_NUMBERS.DUPLICATE);
    }
    if (winningNumbers.some(
      (number) => Number.isNaN(number) || !Number.isInteger(number)
    )) {
      throw new Error(ERROR_MESSAGE.WINNING_NUMBERS.INTEGER);
    }
    if (winningNumbers.length !== 6) {
      throw new Error(ERROR_MESSAGE.WINNING_NUMBERS.LENGTH);
    }
    if (winningNumbers.some((number) => number < 1 || number > 45)) {
      throw new Error(ERROR_MESSAGE.WINNING_NUMBERS.RANGE);
    }
  }
  validateBonusNumber(bonusNumber) {
    if (Number.isNaN(bonusNumber)) {
      throw new Error(ERROR_MESSAGE.BONUS_NUMBER.NUMBER);
    }
    if (parseInt(bonusNumber) !== bonusNumber) {
      throw new Error(ERROR_MESSAGE.BONUS_NUMBER.INTEGER);
    }
    if (bonusNumber < LOTTO.MIN || bonusNumber > LOTTO.MAX) {
      throw new Error(ERROR_MESSAGE.BONUS_NUMBER.RANGE);
    }
    if (this.#winningNumbers.some(
      (winningNumber) => winningNumber.equals(bonusNumber)
    )) {
      throw new Error(ERROR_MESSAGE.BONUS_NUMBER.DUPLICATE);
    }
  }
}
function registerHandler(selector, eventType, handler) {
  document.addEventListener(eventType, (event) => {
    if (event.target.closest(selector)) {
      handler(event);
    }
  });
}
const render = (selector, content) => {
  const element = document.querySelector(selector);
  element.innerHTML = content;
};
const LottoResult = (rank, returnRate) => {
  registerHandler(".lotto-result__close-button", "click", () => {
    document.querySelector(".lotto-result").remove();
  });
  registerHandler(".lotto-result__retry-button", "click", () => {
    document.querySelector(".lotto-result").remove();
    location.reload();
  });
  return `
    <div class="lotto-result-container">
      <div class="lotto-result__dimmed"></div>
      <div class="lotto-result__content">
        <button class="lotto-result__close-button">
          <img src="${"/javascript-lotto/"}assets/Close.png" alt="닫기" width="14px" />
        </button>
        <div class="lotto-result__title-wrapper">
          <h2 class="lotto-result__title">🏆 당첨 통계 🏆</h2>
        </div>
        <table class="lotto-result__table">
          <thead class="lotto-result__table-header">
            <tr>
              <th>일치 갯수</th>
              <th>당첨금</th>
              <th>당첨 갯수</th>
            </tr>
          </thead>
          <tbody class="lotto-result__table-body">
            <tr>
              <td>3개</td>
              <td>5,000</td>
              <td>${rank[5] || 0}개</td>
            </tr>
            <tr>
              <td>4개</td>
              <td>50,000</td>
              <td>${rank[4] || 0}개</td>
            </tr>
            <tr>
              <td>5개</td>
              <td>1,500,000</td>
              <td>${rank[3] || 0}개</td>
            </tr>
            <tr>
              <td>5개+보너스볼</td>
              <td>30,000,000</td>
              <td>${rank[2] || 0}개</td>
            </tr>
            <tr>
              <td>6개</td>
              <td>2,000,000,000</td>
              <td>${rank[1] || 0}개</td>
            </tr>
          </tbody>
        </table>
        <p class="lotto-result__return-rate">당신의 총 수익률은 ${returnRate}%입니다.</p>
        <button class="lotto-result__retry-button">다시 시작하기</button>
      </div>
    </div>
  `;
};
function WinningNumbersAndBonusNumber(lottos, purchaseAmount) {
  const disableForm = (form) => {
    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => input.disabled = true);
    const button = form.querySelector("button");
    button.disabled = true;
  };
  registerHandler(".lotto-winning-bonus-number__form", "submit", (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.target);
      const builder = new WinningNumbersAndBonusNumberBuilder();
      builder.setWinningNumbers(form.getAll("winning-number").map(Number));
      builder.setBonusNumber(Number(form.get("bonus-number")));
      const { winningNumbers, bonusNumber } = builder.build();
      const rank = LottoRankCalculator.calculateLottoRanks({
        lottos,
        winningNumbers,
        bonusNumber
      });
      const returnAmount = LottoReturnCalculator.calculateReturnAmount(rank);
      const returnRate = LottoReturnCalculator.calculateReturnRate(
        returnAmount,
        purchaseAmount
      );
      disableForm(event.target);
      render(".lotto-result", LottoResult(rank, returnRate));
    } catch (error) {
      alert(error.message);
    }
  });
  return `
  <section>
    <p>지난 주 당첨번호 6개와 보너스 번호 1개를 입력해주세요.</p>
    <form class="lotto-winning-bonus-number__form">
    <div class="lotto-winning-bonus-number__inputs">
      <div class="lotto-winning-bonus-number__winning">
        <label for="">당첨 번호</label>
        <div class="lotto-winning-bonus-number__winning-inputs">
          <input type="number" name="winning-number" min="1" max="45" class="lotto-winning-bonus-number__input" />
          <input type="number" name="winning-number" min="1" max="45" class="lotto-winning-bonus-number__input" />
          <input type="number" name="winning-number" min="1" max="45" class="lotto-winning-bonus-number__input" />
          <input type="number" name="winning-number" min="1" max="45" class="lotto-winning-bonus-number__input" />
          <input type="number" name="winning-number" min="1" max="45" class="lotto-winning-bonus-number__input" />
          <input type="number" name="winning-number" min="1" max="45" class="lotto-winning-bonus-number__input" />
        </div>
      </div>
      <div class="lotto-winning-bonus-number__bonus">
        <label for="">보너스 번호</label>
        <input type="number" name="bonus-number" min="1" max="45" class="lotto-winning-bonus-number__input" />
      </div>
      </div>
      <button class="lotto-winning-bonus-number__button">결과 확인하기</button>
    </form>
    </section>
  `;
}
class Lotto {
  #numbers;
  constructor(numbers) {
    this.validateLotto(numbers);
    const lottoNumbers = numbers.sort((a, b) => a - b).map((number) => new LottoNumber(number));
    this.#numbers = lottoNumbers;
  }
  validateLotto(numbers) {
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== numbers.length) {
      throw new Error(ERROR_MESSAGE.LOTTO.DUPLICATE);
    }
    if (numbers.some(
      (number) => Number.isNaN(number) || !Number.isInteger(number)
    )) {
      throw new Error(ERROR_MESSAGE.LOTTO.INTEGER);
    }
    if (numbers.length !== 6) {
      throw new Error(ERROR_MESSAGE.LOTTO.LENGTH);
    }
    if (numbers.some((number) => number < 1 || number > 45)) {
      throw new Error(ERROR_MESSAGE.LOTTO.RANGE);
    }
  }
  getNumbers() {
    return [...this.#numbers];
  }
  parseNumbers() {
    return [...this.#numbers.map(Number)];
  }
  includes(number) {
    return this.#numbers.some((lottoNumber) => lottoNumber.equals(number));
  }
  matchCount(winningNumbers) {
    const numbersSet = /* @__PURE__ */ new Set([
      ...winningNumbers.map(Number),
      ...this.#numbers.map(Number)
    ]);
    return this.#numbers.length + winningNumbers.length - numbersSet.size;
  }
}
const generateRandomNumber = (to) => {
  return Math.floor(Math.random() * to) + 1;
};
const generateUniqueRandomNumbers = (to, length) => {
  const result = /* @__PURE__ */ new Set();
  while (result.size !== length) {
    const randomNumber = generateRandomNumber(to);
    result.add(randomNumber);
  }
  return Array.from(result);
};
class LottoStore {
  static purchaseLottos(amount) {
    if (Number.isNaN(amount) || amount <= 0) {
      throw new Error(ERROR_MESSAGE.AMOUNT.POSITIVE);
    }
    if (amount % LOTTO.UNIT !== 0) {
      throw new Error(ERROR_MESSAGE.AMOUNT.UNIT);
    }
    const lottoCount = amount / LOTTO.UNIT;
    const result = Array.from({ length: lottoCount }).map(
      () => LottoStore.createRandomLotto()
    );
    return result;
  }
  static createRandomLotto() {
    const numbers = generateUniqueRandomNumbers(LOTTO.MAX, LOTTO.LENGTH);
    return new Lotto(numbers);
  }
}
const App = () => {
  const disablePurchaseForm = (form) => {
    form.querySelector(".lotto-purchase-form__input").disabled = true;
    form.querySelector(".lotto-purchase-form__button").disabled = true;
  };
  registerHandler(".lotto-purchase-form", "submit", (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.target);
      const purchaseAmount = parseInt(formData.get("purchase-amount"), 10);
      const lottos = LottoStore.purchaseLottos(purchaseAmount);
      disablePurchaseForm(event.target);
      render(".lotto-list", LottoList(lottos));
      render(
        ".lotto-winning-bonus-number",
        WinningNumbersAndBonusNumber(lottos, purchaseAmount)
      );
    } catch (error) {
      alert(error.message);
    }
  });
  return `
    <header class="lotto-header">
      <h1 class="lotto-header__title">🎱 행운의 로또</h1>
    </header>
    <main class="lotto-main">
      <div class="lotto-content">
        <h2 class="lotto-content-header__title">🎱 내 번호 당첨 확인 🎱</h2>
        <section class="lotto-purchase">
          <form class="lotto-purchase-form">
            <label for="purchase-amount">구입할 금액을 입력해주세요.</label>
            <div class="lotto-purchase-form__input-group">
              <input
                type="number"
                name="purchase-amount"
                id="purchase-amount"
                placeholder="금액"
                class="lotto-purchase-form__input"
                min="1000"
                step="1000"
              />
              <button type="submit" class="lotto-purchase-form__button">
                구입
              </button>
            </div>
          </form>
        </section>
        <section class="lotto-list"></section>
        <section class="lotto-winning-bonus-number"></section>
        <section class="lotto-result"></section>
      </div>
    </main>
    <footer class="lotto-footer">
      <p>Copyright 2026. woowacourse</p>
    </footer>
  `;
};
render("#app", App());
