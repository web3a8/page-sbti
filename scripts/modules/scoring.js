export function shuffle(array) {
  const copied = [...array];
  for (let index = copied.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]];
  }
  return copied;
}

export function getVisibleQuestions(shuffledQuestions, answers, specialQuestions) {
  const visible = [...shuffledQuestions];
  const gateIndex = visible.findIndex((question) => question.id === specialQuestions[0].id);
  if (gateIndex !== -1 && answers[specialQuestions[0].id] === 3) {
    visible.splice(gateIndex + 1, 0, specialQuestions[1]);
  }
  return visible;
}

export function getQuestionMetaLabel(question, previewMode, dimensionMeta) {
  if (question.special) {
    return "补充题";
  }
  return previewMode ? dimensionMeta[question.dim].name : "维度已隐藏";
}

export function updateProgressState(visibleQuestions, answers) {
  const total = visibleQuestions.length;
  const done = visibleQuestions.filter((question) => answers[question.id] !== undefined).length;
  return {
    total,
    done,
    percent: total ? (done / total) * 100 : 0,
    complete: done === total && total > 0
  };
}

function sumToLevel(score) {
  if (score <= 3) {
    return "L";
  }
  if (score === 4) {
    return "M";
  }
  return "H";
}

function levelNum(level) {
  return { L: 1, M: 2, H: 3 }[level];
}

function parsePattern(pattern) {
  return pattern.replaceAll("-", "").split("");
}

export function computeResult({
  answers,
  questions,
  dimensionMeta,
  dimensionOrder,
  normalTypes,
  typeLibrary,
  drinkTriggerQuestionId
}) {
  const rawScores = {};
  const levels = {};
  Object.keys(dimensionMeta).forEach((dimension) => {
    rawScores[dimension] = 0;
  });

  questions.forEach((question) => {
    rawScores[question.dim] += Number(answers[question.id] || 0);
  });

  Object.entries(rawScores).forEach(([dimension, score]) => {
    levels[dimension] = sumToLevel(score);
  });

  const userVector = dimensionOrder.map((dimension) => levelNum(levels[dimension]));
  const ranked = normalTypes
    .map((type) => {
      const vector = parsePattern(type.pattern).map(levelNum);
      let distance = 0;
      let exact = 0;
      for (let index = 0; index < vector.length; index += 1) {
        const diff = Math.abs(userVector[index] - vector[index]);
        distance += diff;
        if (diff === 0) {
          exact += 1;
        }
      }

      const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
      return { ...type, ...typeLibrary[type.code], distance, exact, similarity };
    })
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }
      if (right.exact !== left.exact) {
        return right.exact - left.exact;
      }
      return right.similarity - left.similarity;
    });

  const bestNormal = ranked[0];
  const drunkTriggered = answers[drinkTriggerQuestionId] === 2;

  let finalType;
  let modeKicker = "你的主类型";
  let badge = `匹配度 ${bestNormal.similarity}% · 精准命中 ${bestNormal.exact}/15 维`;
  let sub = "维度命中度较高，当前结果可视为你的第一人格画像。";
  let special = false;
  let secondaryType = null;

  if (drunkTriggered) {
    finalType = typeLibrary.DRUNK;
    secondaryType = bestNormal;
    modeKicker = "隐藏人格已激活";
    badge = "匹配度 100% · 酒精异常因子已接管";
    sub = "乙醇亲和性过强，系统已直接跳过常规人格审判。";
    special = true;
  } else if (bestNormal.similarity < 60) {
    finalType = typeLibrary.HHHH;
    modeKicker = "系统强制兜底";
    badge = `标准人格库最高匹配仅 ${bestNormal.similarity}%`;
    sub = "标准人格库对你的脑回路集体罢工了，于是系统把你强制分配给了 HHHH。";
    special = true;
  } else {
    finalType = bestNormal;
  }

  return {
    rawScores,
    levels,
    ranked,
    bestNormal,
    finalType,
    modeKicker,
    badge,
    sub,
    special,
    secondaryType
  };
}
