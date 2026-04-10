import { dimensionMeta, dimensionOrder, specialQuestions } from "./data/meta.js";
import { questions } from "./data/questions.js";
import {
  typeImages,
  normalTypes,
  typeLibrary,
  dimExplanations,
  drinkTriggerQuestionId
} from "./data/types.js";
import {
  computeResult,
  getVisibleQuestions,
  getQuestionMetaLabel,
  shuffle,
  updateProgressState
} from "./modules/scoring.js";

const app = {
  shuffledQuestions: [],
  answers: {},
  previewMode: false
};

const screens = {
  intro: document.getElementById("intro"),
  test: document.getElementById("test"),
  result: document.getElementById("result")
};

const questionList = document.getElementById("questionList");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const submitBtn = document.getElementById("submitBtn");
const testHint = document.getElementById("testHint");

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => {
    element.classList.toggle("active", key === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderQuestions() {
  const visibleQuestions = getVisibleQuestions(
    app.shuffledQuestions,
    app.answers,
    specialQuestions
  );

  questionList.innerHTML = "";
  visibleQuestions.forEach((question, index) => {
    const card = document.createElement("article");
    card.className = "question";
    card.innerHTML = `
      <div class="question-meta">
        <div class="badge">第 ${index + 1} 题</div>
        <div>${getQuestionMetaLabel(question, app.previewMode, dimensionMeta)}</div>
      </div>
      <div class="question-title">${question.text}</div>
      <div class="options">
        ${question.options
          .map((option, optionIndex) => {
            const code = ["A", "B", "C", "D"][optionIndex] || String(optionIndex + 1);
            const checked = app.answers[question.id] === option.value ? "checked" : "";
            return `
              <label class="option">
                <input type="radio" name="${question.id}" value="${option.value}" ${checked} />
                <div class="option-code">${code}</div>
                <div>${option.label}</div>
              </label>
            `;
          })
          .join("")}
      </div>
    `;
    questionList.appendChild(card);
  });

  questionList.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      const { name, value } = event.target;
      app.answers[name] = Number(value);

      if (name === specialQuestions[0].id) {
        if (Number(value) !== 3) {
          delete app.answers[drinkTriggerQuestionId];
        }
        renderQuestions();
        return;
      }

      syncProgress();
    });
  });

  syncProgress();
}

function syncProgress() {
  const progressState = updateProgressState(
    getVisibleQuestions(app.shuffledQuestions, app.answers, specialQuestions),
    app.answers
  );

  progressBar.style.width = `${progressState.percent}%`;
  progressText.textContent = `${progressState.done} / ${progressState.total}`;
  submitBtn.disabled = !progressState.complete;
  testHint.textContent = progressState.complete
    ? "都做完了。现在可以把你的电子魂魄交给结果页审判。"
    : "全选完才会放行。世界已经够乱了，起码把题做完整。";
}

function renderDimList(result) {
  const dimList = document.getElementById("dimList");
  dimList.innerHTML = dimensionOrder
    .map((dimension) => {
      const level = result.levels[dimension];
      const explanation = dimExplanations[dimension][level];
      return `
        <div class="dim-item">
          <div class="dim-item-top">
            <div class="dim-item-name">${dimensionMeta[dimension].name}</div>
            <div class="dim-item-score">${level} / ${result.rawScores[dimension]}分</div>
          </div>
          <p>${explanation}</p>
        </div>
      `;
    })
    .join("");
}

function renderResult() {
  const result = computeResult({
    answers: app.answers,
    questions,
    dimensionMeta,
    dimensionOrder,
    normalTypes,
    typeLibrary,
    drinkTriggerQuestionId
  });

  const type = result.finalType;
  document.getElementById("resultModeKicker").textContent = result.modeKicker;
  document.getElementById("resultTypeName").textContent = `${type.code}（${type.cn}）`;
  document.getElementById("matchBadge").textContent = result.badge;
  document.getElementById("resultTypeSub").textContent = result.sub;
  document.getElementById("resultDesc").textContent = type.desc;
  document.getElementById("posterCaption").textContent = type.intro;
  document.getElementById("funNote").textContent = result.special
    ? "本测试仅供娱乐。隐藏人格和兜底人格都属于作者故意埋的趣味设定，请勿当成医学、心理学或人生判决依据。"
    : "本测试仅供娱乐，别把它当诊断、面试、相亲或人生判决书。笑一笑可以，别太当真。";

  const posterBox = document.getElementById("posterBox");
  const posterImage = document.getElementById("posterImage");
  const imageSrc = typeImages[type.code];
  if (imageSrc) {
    posterImage.src = imageSrc;
    posterImage.alt = `${type.code}（${type.cn}）`;
    posterBox.classList.remove("no-image");
  } else {
    posterImage.removeAttribute("src");
    posterImage.alt = "";
    posterBox.classList.add("no-image");
  }

  renderDimList(result);
  showScreen("result");
}

function startTest(preview = false) {
  app.previewMode = preview;
  app.answers = {};
  const shuffledRegular = shuffle(questions);
  const insertIndex = Math.floor(Math.random() * shuffledRegular.length) + 1;
  app.shuffledQuestions = [
    ...shuffledRegular.slice(0, insertIndex),
    specialQuestions[0],
    ...shuffledRegular.slice(insertIndex)
  ];
  renderQuestions();
  showScreen("test");
}

document.getElementById("startBtn").addEventListener("click", () => startTest(false));
document.getElementById("backIntroBtn").addEventListener("click", () => showScreen("intro"));
document.getElementById("submitBtn").addEventListener("click", renderResult);
document.getElementById("restartBtn").addEventListener("click", () => startTest(false));
document.getElementById("toTopBtn").addEventListener("click", () => showScreen("intro"));
