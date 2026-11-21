/**
 * QuestLingo – Nội dung tiếng Anh (dữ liệu + hàm hỗ trợ)
 * Nhóm 2 – Nhập môn CNTT_CS_02
 *
 * Cách dùng trên trình duyệt:
 *   <script src="questlingo-content.js"></script>
 *   const quiz = QuestLingoContent.buildQuiz("travel", "B1");
 *
 * Chạy server tích hợp AI (chỉ 1 file này, không cần cài thêm gói; cần Node.js 18+):
 *   export ANTHROPIC_API_KEY="sk-ant-..."     (Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-...")
 *   node questlingo-content.js                -> mở http://localhost:3000
 *
 * Cách dùng với Node / module bundler:
 *   const QL = require("./questlingo-content.js");
 */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. CẤU HÌNH CẤP ĐỘ, SỐ CÂU, ĐIỂM, TỈ LỆ ĐỘ KHÓ
   * ------------------------------------------------------------------ */

  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // Giả định: A1–A2 = 10 câu, B1–B2 = 20 câu, C1–C2 = 25 câu
  // (đổi số ở đây nếu nhóm hiểu khác).
  // mix = tỉ lệ [dễ, vừa, khó] – tổng bằng 1.
  const LEVEL_CONFIG = {
    A1: { count: 10, mix: { easy: 0.7, medium: 0.3, hard: 0.0 } },
    A2: { count: 10, mix: { easy: 0.5, medium: 0.4, hard: 0.1 } },
    B1: { count: 20, mix: { easy: 0.3, medium: 0.5, hard: 0.2 } },
    B2: { count: 20, mix: { easy: 0.2, medium: 0.5, hard: 0.3 } },
    C1: { count: 25, mix: { easy: 0.1, medium: 0.5, hard: 0.4 } },
    C2: { count: 25, mix: { easy: 0.0, medium: 0.4, hard: 0.6 } },
  };

  const DIFFICULTIES = ["easy", "medium", "hard"];
  const DIFFICULTY_LABEL_VI = { easy: "Dễ", medium: "Vừa", hard: "Khó" };

  // Điểm cơ bản theo độ khó (mỗi câu có thể ghi đè bằng trường `points`).
  const DEFAULT_POINTS = { easy: 10, medium: 20, hard: 30 };

  // Dạng câu hỏi:
  //  - "mcq"  : trắc nghiệm 4 phương án  -> options (4), answer = nội dung đáp án đúng
  //  - "fill" : điền vào chỗ trống ___    -> answer (+ accepted: các đáp án chấp nhận)
  //  - "type" : gõ từ theo gợi ý          -> answer (+ accepted)
  const QUESTION_TYPES = ["mcq", "fill", "type"];

  /* ------------------------------------------------------------------ *
   * 2. NGÂN HÀNG CÂU HỎI
   *    Cấu trúc: BANK[topicKey] = { label, aliases, questions: [...] }
   *    Mỗi câu: { id, level, type, difficulty, question, options?,
   *               answer, accepted?, explanation, points? }
   * ------------------------------------------------------------------ */

  const BANK = {
    travel: {
      label: "Du lịch (Travel)",
      aliases: ["travel", "du lich", "du lịch", "trip", "holiday"],
      questions: [
        /* ---------- A1 ---------- */
        {
          id: "travel-a1-01", level: "A1", type: "mcq", difficulty: "easy",
          question: "We go to the ___ to take a plane.",
          options: ["airport", "school", "kitchen", "market"],
          answer: "airport",
          explanation: "airport = sân bay. Nơi lên máy bay là sân bay.",
        },
        {
          id: "travel-a1-02", level: "A1", type: "fill", difficulty: "medium",
          question: "I have a ___ to Da Nang. (vé)",
          answer: "ticket",
          explanation: "ticket = vé. 'a ticket to…' = một tấm vé đi…",
        },
        {
          id: "travel-a1-03", level: "A1", type: "type", difficulty: "easy",
          question: "Gõ từ tiếng Anh có nghĩa: 'khách sạn'",
          answer: "hotel",
          explanation: "hotel = khách sạn.",
        },

        /* ---------- A2 ---------- */
        {
          id: "travel-a2-01", level: "A2", type: "mcq", difficulty: "easy",
          question: "Last summer, we ___ to Nha Trang.",
          options: ["go", "went", "goes", "going"],
          answer: "went",
          explanation: "'Last summer' là quá khứ nên dùng 'went' (quá khứ của go).",
        },
        {
          id: "travel-a2-02", level: "A2", type: "fill", difficulty: "medium",
          question: "The train ___ at 8 o'clock every morning. (leave)",
          answer: "leaves",
          explanation: "Lịch trình lặp lại -> hiện tại đơn; chủ ngữ 'The train' số ít nên thêm -s.",
        },
        {
          id: "travel-a2-03", level: "A2", type: "type", difficulty: "medium",
          question: "Gõ từ tiếng Anh có nghĩa: 'hộ chiếu'",
          answer: "passport",
          explanation: "passport = hộ chiếu, giấy tờ cần khi đi nước ngoài.",
        },

        /* ---------- B1 ---------- */
        {
          id: "travel-b1-01", level: "B1", type: "mcq", difficulty: "medium",
          question: "If it rains tomorrow, we ___ the trip.",
          options: ["will cancel", "cancel", "would cancel", "cancelled"],
          answer: "will cancel",
          explanation: "Câu điều kiện loại 1: If + hiện tại đơn, S + will + V.",
        },
        {
          id: "travel-b1-02", level: "B1", type: "fill", difficulty: "medium",
          question: "I have never ___ to Japan before. (be)",
          answer: "been",
          explanation: "Hiện tại hoàn thành: have/has + V3. 'be' -> 'been'.",
        },
        {
          id: "travel-b1-03", level: "B1", type: "type", difficulty: "hard",
          question: "Our flight was ___ because of the storm. (bị hoãn, dạng V-ed)",
          answer: "delayed",
          explanation: "delay = hoãn/trễ. Bị động ở quá khứ: was + delayed.",
        },

        /* ---------- B2 ---------- */
        {
          id: "travel-b2-01", level: "B2", type: "mcq", difficulty: "medium",
          question: "By the time we arrived, the tour ___.",
          options: ["had already started", "has already started", "already started now", "was already starting"],
          answer: "had already started",
          explanation: "Hành động xảy ra trước một mốc quá khứ -> quá khứ hoàn thành (had + V3).",
        },
        {
          id: "travel-b2-02", level: "B2", type: "mcq", difficulty: "hard",
          question: "Not only ___ the museum, but we also explored the old town.",
          options: ["did we visit", "we did visit", "we visited", "visited we"],
          answer: "did we visit",
          explanation: "Đảo ngữ sau 'Not only': Not only + trợ động từ + S + V.",
        },
        {
          id: "travel-b2-03", level: "B2", type: "fill", difficulty: "hard",
          question: "She suggested ___ the sights by bike. (explore)",
          answer: "exploring",
          explanation: "'suggest' + V-ing.",
        },

        /* ---------- C1 ---------- */
        {
          id: "travel-c1-01", level: "C1", type: "mcq", difficulty: "medium",
          question: "The resort is ___ the beaten track, so it is wonderfully quiet.",
          options: ["off", "on", "beyond", "out"],
          answer: "off",
          explanation: "'off the beaten track' = hẻo lánh, ít người đến.",
        },
        {
          id: "travel-c1-02", level: "C1", type: "mcq", difficulty: "hard",
          question: "Had I known about the strike, I ___ my flight.",
          options: ["would have rebooked", "would rebook", "will have rebooked", "had rebooked"],
          answer: "would have rebooked",
          explanation: "Điều kiện loại 3 đảo ngữ: Had + S + V3, S + would have + V3.",
        },
        {
          id: "travel-c1-03", level: "C1", type: "type", difficulty: "hard",
          question: "Tourism is the island's main source of ___. (doanh thu, 7 chữ cái, bắt đầu bằng 'r')",
          answer: "revenue",
          explanation: "revenue = doanh thu/nguồn thu.",
        },

        /* ---------- C2 ---------- */
        {
          id: "travel-c2-01", level: "C2", type: "mcq", difficulty: "hard",
          question: "The guidebook's description was somewhat ___; the village was nothing like the idyllic picture it painted.",
          options: ["embellished", "understated", "impartial", "meticulous"],
          answer: "embellished",
          explanation: "embellish = thêm thắt, tô vẽ cho đẹp hơn thực tế.",
        },
        {
          id: "travel-c2-02", level: "C2", type: "fill", difficulty: "hard",
          question: "Little did we ___ that the trip would change our lives.",
          answer: "know",
          accepted: ["know", "realize", "realise", "suspect"],
          explanation: "Đảo ngữ sau 'Little did…': Little did + S + V (nguyên mẫu). Nghĩa: nào ngờ/không hề biết.",
        },
        {
          id: "travel-c2-03", level: "C2", type: "type", difficulty: "hard",
          question: "Gõ từ: (n) niềm khao khát được đi đây đó, khám phá thế giới (từ mượn tiếng Đức, ghép từ 'wander' + 'lust')",
          answer: "wanderlust",
          explanation: "wanderlust = niềm đam mê du lịch, thích xê dịch.",
        },
      ],
    },
    // Thêm chủ đề mới: copy khối ở trên (vd. food, technology, school...)
    // hoặc dùng registerQuestions() ở bên dưới.
  };

  /* ------------------------------------------------------------------ *
   * 3. TIỆN ÍCH
   * ------------------------------------------------------------------ */

  /** Bỏ dấu, chữ thường, bỏ khoảng trắng thừa -> dùng để so khớp chủ đề. */
  function normalizeKey(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  /** Chuẩn hoá câu trả lời người chơi gõ (không phân biệt hoa/thường, dấu câu). */
  function normalizeAnswer(text) {
    return String(text == null ? "" : text)
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:"']+$/g, "")
      .replace(/\s+/g, " ");
  }

  /** Xáo trộn Fisher–Yates (không làm thay đổi mảng gốc). */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Tìm chủ đề trong ngân hàng theo tên/alias. Trả về key hoặc null. */
  function findTopicKey(topic) {
    const k = normalizeKey(topic);
    for (const key of Object.keys(BANK)) {
      const t = BANK[key];
      if (key === k || normalizeKey(t.label) === k) return key;
      if ((t.aliases || []).some((a) => normalizeKey(a) === k)) return key;
    }
    return null;
  }

  function pointsOf(q) {
    return typeof q.points === "number" ? q.points : DEFAULT_POINTS[q.difficulty];
  }

  /* ------------------------------------------------------------------ *
   * 4. KIỂM TRA DỮ LIỆU CÂU HỎI
   * ------------------------------------------------------------------ */

  /** Trả về mảng lỗi (rỗng = hợp lệ). */
  function validateQuestion(q) {
    const errs = [];
    if (!q || typeof q !== "object") return ["Câu hỏi không phải object"];
    if (!q.id) errs.push("thiếu id");
    if (!LEVELS.includes(q.level)) errs.push("level không hợp lệ: " + q.level);
    if (!QUESTION_TYPES.includes(q.type)) errs.push("type không hợp lệ: " + q.type);
    if (!DIFFICULTIES.includes(q.difficulty)) errs.push("difficulty không hợp lệ: " + q.difficulty);
    if (!q.question) errs.push("thiếu nội dung question");
    if (!q.answer) errs.push("thiếu answer");
    if (!q.explanation) errs.push("thiếu explanation (giải thích tiếng Việt)");
    if (q.type === "mcq") {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errs.push("mcq phải có đúng 4 options");
      } else {
        if (new Set(q.options).size !== 4) errs.push("options bị trùng nhau");
        if (!q.options.includes(q.answer)) errs.push("answer phải trùng một trong các options");
      }
    }
    return errs;
  }

  /** Kiểm tra cả ngân hàng: lỗi từng câu + thống kê số câu theo cấp độ. */
  function validateBank() {
    const report = { errors: [], coverage: {} };
    const seen = new Set();
    for (const key of Object.keys(BANK)) {
      report.coverage[key] = {};
      for (const lv of LEVELS) report.coverage[key][lv] = { have: 0, need: LEVEL_CONFIG[lv].count };
      for (const q of BANK[key].questions) {
        const errs = validateQuestion(q);
        if (seen.has(q.id)) errs.push("id bị trùng");
        seen.add(q.id);
        if (errs.length) report.errors.push({ id: q.id, errors: errs });
        if (report.coverage[key][q.level]) report.coverage[key][q.level].have++;
      }
    }
    return report;
  }

  /* ------------------------------------------------------------------ *
   * 5. THÊM CÂU HỎI (do nhóm viết hoặc do AI sinh ra cho chủ đề tùy ý)
   * ------------------------------------------------------------------ */

  /**
   * Đăng ký câu hỏi cho một chủ đề (tạo mới nếu chưa có).
   * Chỉ nhận các câu hợp lệ; trả về { added, rejected }.
   */
  function registerQuestions(topic, questions, label) {
    let key = findTopicKey(topic);
    if (!key) {
      key = normalizeKey(topic).replace(/\s+/g, "-") || "custom";
      BANK[key] = { label: label || topic, aliases: [topic], questions: [] };
    }
    const existing = new Set(BANK[key].questions.map((q) => q.id));
    const result = { added: 0, rejected: [] };
    (questions || []).forEach((q, i) => {
      const item = Object.assign({}, q);
      if (!item.id) item.id = key + "-" + (item.level || "x").toLowerCase() + "-" + (BANK[key].questions.length + i + 1);
      const errs = validateQuestion(item);
      if (existing.has(item.id)) errs.push("id đã tồn tại");
      if (errs.length) {
        result.rejected.push({ id: item.id, errors: errs });
      } else {
        BANK[key].questions.push(item);
        existing.add(item.id);
        result.added++;
      }
    });
    return result;
  }

  /**
   * Tạo prompt để gọi AI (vd. Claude API) sinh câu hỏi cho chủ đề tùy ý.
   * Kết quả AI trả về (JSON) đưa vào registerQuestions().
   */
  function buildAIPrompt(topic, level, count) {
    const cfg = LEVEL_CONFIG[level];
    if (!cfg) throw new Error("Cấp độ không hợp lệ: " + level);
    const n = count || cfg.count;
    const mix = cfg.mix;
    const nEasy = Math.round(n * mix.easy);
    const nHard = Math.round(n * mix.hard);
    const nMedium = n - nEasy - nHard;
    return [
      `Hãy tạo ${n} câu hỏi tiếng Anh cho người học trình độ CEFR ${level}, chủ đề "${topic}".`,
      `Phân bố độ khó: ${nEasy} easy, ${nMedium} medium, ${nHard} hard.`,
      `Dạng câu hỏi: trộn "mcq" (4 phương án), "fill" (điền vào chỗ trống ___), "type" (gõ từ theo gợi ý tiếng Việt).`,
      `Yêu cầu: từ vựng/ngữ pháp đúng trình độ ${level}; mcq có đúng 4 options khác nhau và answer trùng một option; mỗi câu có "explanation" bằng tiếng Việt, ngắn gọn (1–2 câu); không lặp câu.`,
      `Chỉ trả về một mảng JSON, mỗi phần tử có dạng:`,
      `{"level":"${level}","type":"mcq|fill|type","difficulty":"easy|medium|hard","question":"...","options":["..","..","..",".."],"answer":"...","accepted":["..."],"explanation":"..."}`,
      `(Bỏ "options" nếu không phải mcq; "accepted" là tuỳ chọn khi có nhiều đáp án đúng.)`,
    ].join("\n");
  }

  /* ------------------------------------------------------------------ *
   * 6. DỰNG BỘ CÂU HỎI CHO MỘT LƯỢT CHƠI
   * ------------------------------------------------------------------ */

  /** Chọn `count` câu từ `pool` theo tỉ lệ độ khó; thiếu thì lấy bù từ câu còn lại. */
  function pickByMix(pool, count, mix) {
    const byDiff = { easy: [], medium: [], hard: [] };
    shuffle(pool).forEach((q) => byDiff[q.difficulty].push(q));

    const target = {
      easy: Math.round(count * mix.easy),
      hard: Math.round(count * mix.hard),
    };
    target.medium = count - target.easy - target.hard;

    const picked = [];
    for (const d of DIFFICULTIES) picked.push(...byDiff[d].splice(0, target[d]));

    if (picked.length < count) {
      const rest = shuffle([].concat(byDiff.easy, byDiff.medium, byDiff.hard));
      picked.push(...rest.slice(0, count - picked.length));
    }
    return picked.slice(0, count);
  }

  /**
   * Dựng bộ câu hỏi cho người chơi.
   * @param {string} topic  chủ đề người chơi chọn (tuỳ ý)
   * @param {string} level  "A1" … "C2"
   * @param {object} opts   { shuffleOptions: true, sortByDifficulty: true }
   * @returns {object} { topic, level, requested, available, shortage, needsGeneration,
   *                     aiPrompt, questions, maxScore }
   */
  function buildQuiz(topic, level, opts) {
    const o = Object.assign({ shuffleOptions: true, sortByDifficulty: true }, opts);
    const cfg = LEVEL_CONFIG[level];
    if (!cfg) throw new Error("Cấp độ không hợp lệ: " + level + " (chọn " + LEVELS.join(", ") + ")");

    const key = findTopicKey(topic);
    const pool = key ? BANK[key].questions.filter((q) => q.level === level) : [];
    let questions = pickByMix(pool, cfg.count, cfg.mix);

    if (o.sortByDifficulty) {
      questions.sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty));
    }

    // Trả về bản sao để không làm hỏng dữ liệu gốc.
    questions = questions.map((q) => {
      const c = Object.assign({}, q, { points: pointsOf(q), difficultyLabel: DIFFICULTY_LABEL_VI[q.difficulty] });
      if (q.type === "mcq" && o.shuffleOptions) c.options = shuffle(q.options);
      return c;
    });

    const shortage = cfg.count - questions.length;
    return {
      topic: key ? BANK[key].label : topic,
      level,
      requested: cfg.count,
      available: questions.length,
      shortage,
      // true -> giao diện nên gọi AI sinh thêm bằng aiPrompt rồi registerQuestions()
      needsGeneration: shortage > 0,
      aiPrompt: shortage > 0 ? buildAIPrompt(topic, level, shortage) : null,
      questions,
      maxScore: questions.reduce((s, q) => s + q.points, 0),
    };
  }

  /* ------------------------------------------------------------------ *
   * 7. CHẤM ĐIỂM
   * ------------------------------------------------------------------ */

  /**
   * Chấm một câu.
   * @returns {{correct:boolean, points:number, correctAnswer:string, explanation:string}}
   */
  function checkAnswer(question, userAnswer) {
    const given = normalizeAnswer(userAnswer);
    const valid = [question.answer].concat(question.accepted || []).map(normalizeAnswer);
    const correct = given !== "" && valid.includes(given);
    return {
      correct,
      points: correct ? pointsOf(question) : 0,
      correctAnswer: question.answer,
      explanation: question.explanation,
    };
  }

  /**
   * Tổng kết lượt chơi.
   * @param {object} quiz     kết quả của buildQuiz()
   * @param {object} answers  { [questionId]: câu trả lời của người chơi }
   */
  function calcResult(quiz, answers) {
    const details = quiz.questions.map((q) => {
      const r = checkAnswer(q, answers[q.id]);
      return Object.assign({ id: q.id, difficulty: q.difficulty, userAnswer: answers[q.id] || "" }, r);
    });
    const score = details.reduce((s, d) => s + d.points, 0);
    const correctCount = details.filter((d) => d.correct).length;
    return {
      score,
      maxScore: quiz.maxScore,
      percent: quiz.maxScore ? Math.round((score / quiz.maxScore) * 100) : 0,
      correctCount,
      total: quiz.questions.length,
      details,
    };
  }

  /* ------------------------------------------------------------------ *
   * 8. NHẬP DỮ LIỆU TỪ BÊN NGOÀI (người đánh máy / AI hỗ trợ)
   *    - Người đánh máy: file CSV/TSV (Excel, Google Sheets) hoặc JSON
   *    - AI: gọi server trung gian -> nhận JSON -> kiểm tra -> thêm vào ngân hàng
   * ------------------------------------------------------------------ */

  const DIFF_ALIASES = { easy: "easy", de: "easy", medium: "medium", vua: "medium", hard: "hard", kho: "hard" };
  const TYPE_ALIASES = {
    mcq: "mcq", "trac nghiem": "mcq",
    fill: "fill", dien: "fill", "dien tu": "fill",
    type: "type", "go tu": "type", go: "type",
  };

  /** Lấy mảng câu hỏi từ văn bản JSON (chấp nhận AI bọc trong ```json ... ``` hoặc có lời dẫn). */
  function extractJSON(text) {
    let t = String(text == null ? "" : text).replace(/^\uFEFF/, "").trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    let parsed;
    try {
      parsed = JSON.parse(t);
    } catch (_) {
      const s = t.indexOf("[");
      const e = t.lastIndexOf("]");
      if (s === -1 || e <= s) throw new Error("Không tìm thấy JSON hợp lệ");
      parsed = JSON.parse(t.slice(s, e + 1));
    }
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    throw new Error("JSON phải là một mảng câu hỏi hoặc {\"questions\": [...]}");
  }

  /** Đọc CSV/TSV (tự nhận dấu phân cách , ; hoặc Tab; hỗ trợ ô có dấu ngoặc kép). Trả về mảng object theo tiêu đề cột. */
  function parseCSV(text) {
    text = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    const first = text.split(/\r?\n/)[0] || "";
    const delim = first.includes("\t") ? "\t" : first.split(";").length > first.split(",").length ? ";" : ",";
    const rows = [];
    let row = [], cell = "", inQ = false;
    const pushRow = () => {
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
        } else cell += c;
      } else if (c === '"') inQ = true;
      else if (c === delim) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; pushRow(); }
      else cell += c;
    }
    pushRow();
    if (!rows.length) return [];
    const headers = rows[0].map((h) => normalizeKey(h).replace(/[\s_]/g, ""));
    return rows.slice(1).map((r) => {
      const o = {};
      headers.forEach((h, i) => (o[h] = (r[i] || "").trim()));
      return o;
    });
  }

  /** Chuẩn hoá một câu thô (từ CSV/JSON/AI) về đúng định dạng của ngân hàng. */
  function cleanQuestion(raw, o) {
    const r = {};
    Object.keys(raw || {}).forEach((k) => (r[normalizeKey(k).replace(/[\s_]/g, "")] = raw[k]));

    let options = Array.isArray(r.options) ? r.options.map((x) => String(x).trim()) : null;
    if (!options) {
      const cols = [r.optiona || r.a, r.optionb || r.b, r.optionc || r.c, r.optiond || r.d];
      if (cols.some(Boolean)) options = cols.map((x) => String(x || "").trim());
    }

    let type = TYPE_ALIASES[normalizeKey(r.type)] || (options ? "mcq" : "");
    let answer = String(r.answer == null ? "" : r.answer).trim();
    // Người đánh máy có thể ghi đáp án là chữ A/B/C/D
    if (type === "mcq" && options && !options.includes(answer) && /^[a-d]$/i.test(answer)) {
      answer = options["abcd".indexOf(answer.toLowerCase())] || answer;
    }

    let accepted = r.accepted;
    if (typeof accepted === "string") accepted = accepted.split(/[|;]/).map((s) => s.trim()).filter(Boolean);
    if (!Array.isArray(accepted) || !accepted.length) accepted = undefined;

    const q = {
      level: String(r.level || (o && o.defaultLevel) || "").trim().toUpperCase(),
      type,
      difficulty: DIFF_ALIASES[normalizeKey(r.difficulty)] || "",
      question: String(r.question || "").trim(),
      answer,
      explanation: String(r.explanation || r.explain || "").trim(),
      source: (o && o.source) || "manual",
    };
    if (type === "mcq") q.options = options;
    if (accepted) q.accepted = accepted;
    if (r.id) q.id = String(r.id).trim();
    if (r.points !== undefined && r.points !== "" && !isNaN(Number(r.points))) q.points = Number(r.points);
    return q;
  }

  /**
   * Nhập câu hỏi từ văn bản (CSV/TSV hoặc JSON) vào một chủ đề.
   * @param {string} topic
   * @param {string} input  nội dung dán vào hoặc đọc từ file
   * @param {object} opts   { format: "auto"|"json"|"csv", source: "manual"|"ai", defaultLevel }
   * @returns {{added, rejected, duplicates, total, parseError}}
   */
  function importQuestions(topic, input, opts) {
    const o = Object.assign({ format: "auto", source: "manual", defaultLevel: null }, opts);
    const text = String(input == null ? "" : input).trim();
    let rawList;
    try {
      const looksJSON = /^[\[{]/.test(text) || text.includes("```") || /\[\s*\{/.test(text);
      rawList = o.format === "json" || (o.format === "auto" && looksJSON) ? extractJSON(text) : parseCSV(text);
    } catch (err) {
      return { added: 0, rejected: [], duplicates: 0, total: 0, parseError: err.message };
    }

    // Bỏ câu trùng nội dung với câu đã có trong cùng chủ đề
    const key = findTopicKey(topic);
    const seen = new Set(key ? BANK[key].questions.map((q) => normalizeAnswer(q.question)) : []);
    let duplicates = 0;
    const cleaned = rawList
      .map((r) => cleanQuestion(r, o))
      .filter((q) => {
        const t = normalizeAnswer(q.question);
        if (t && seen.has(t)) { duplicates++; return false; }
        seen.add(t);
        return true;
      });

    const res = registerQuestions(topic, cleaned);
    res.duplicates = duplicates;
    res.total = rawList.length;
    res.parseError = null;
    return res;
  }

  /** (Trình duyệt) Nhập từ file người dùng chọn: .csv .tsv .txt .json. Trả về Promise. */
  function importFromFile(topic, file, opts) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Không đọc được file"));
      reader.onload = () => {
        const isJSON = /\.json$/i.test(file.name);
        resolve(importQuestions(topic, reader.result, Object.assign({ format: isJSON ? "json" : "csv" }, opts)));
      };
      reader.readAsText(file, "utf-8");
    });
  }

  /**
   * (Trình duyệt) Nhờ AI sinh câu hỏi qua server trung gian rồi nhập vào ngân hàng.
   * KHÔNG đặt API key trong code front-end: server (chạy bằng: node questlingo-content.js) giữ key.
   * Server nhận POST { topic, level, count } và trả { text } (văn bản JSON do AI sinh).
   */
  async function requestAIQuestions(topic, level, opts) {
    const o = Object.assign({ endpoint: "/api/generate-questions", count: null }, opts);
    const safeTopic = String(topic).replace(/[\r\n"]/g, " ").trim().slice(0, 60);
    // Server tự dựng prompt từ topic/level/count (client không gửi prompt tùy ý).
    const resp = await fetch(o.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: safeTopic, level, count: o.count }),
    });
    if (!resp.ok) throw new Error("Server AI trả lỗi " + resp.status);
    const data = await resp.json();
    const text = typeof data.text === "string" ? data.text : JSON.stringify(data.questions || data);
    return importQuestions(topic, text, { format: "json", source: "ai", defaultLevel: level });
  }

  /** buildQuiz + tự gọi AI bổ sung khi chủ đề/cấp độ còn thiếu câu. */
  async function buildQuizWithAI(topic, level, opts) {
    let quiz = buildQuiz(topic, level, opts);
    if (quiz.needsGeneration && !(opts && opts.endpoint === false)) {
      try {
        await requestAIQuestions(topic, level, { endpoint: opts && opts.endpoint, count: quiz.shortage });
        quiz = buildQuiz(topic, level, opts);
      } catch (err) {
        quiz.aiError = err.message; // giao diện có thể báo "không tạo thêm được câu hỏi"
      }
    }
    return quiz;
  }

  /* ---------- Xuất dữ liệu để người khác kiểm tra / dùng lại ---------- */

  const CSV_HEADERS = ["level", "type", "difficulty", "question", "optionA", "optionB", "optionC", "optionD", "answer", "accepted", "explanation", "points"];

  function csvCell(v) {
    const s = v == null ? "" : String(v);
    return /[",;\t\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  /** File CSV mẫu cho người đánh máy (mở bằng Excel/Google Sheets). */
  function getCSVTemplate() {
    const rows = [
      CSV_HEADERS,
      ["A1", "mcq", "easy", "We go to the ___ to take a plane.", "airport", "school", "kitchen", "market", "airport", "", "airport = sân bay.", ""],
      ["A2", "fill", "medium", "The train ___ at 8 every morning. (leave)", "", "", "", "", "leaves", "", "Hiện tại đơn, chủ ngữ số ít thêm -s.", ""],
      ["A1", "type", "easy", "Gõ từ tiếng Anh: 'khách sạn'", "", "", "", "", "hotel", "", "hotel = khách sạn.", ""],
    ];
    return rows.map((r) => r.map(csvCell).join(",")).join("\n");
  }

  /** Xuất toàn bộ câu hỏi của một chủ đề dưới dạng "json" hoặc "csv". */
  function exportTopic(topic, format) {
    const key = findTopicKey(topic);
    if (!key) throw new Error("Chưa có chủ đề: " + topic);
    const list = BANK[key].questions;
    if (format === "csv") {
      const lines = list.map((q) => {
        const op = q.options || [];
        return [q.level, q.type, q.difficulty, q.question, op[0], op[1], op[2], op[3], q.answer, (q.accepted || []).join("|"), q.explanation, q.points]
          .map(csvCell).join(",");
      });
      return [CSV_HEADERS.join(",")].concat(lines).join("\n");
    }
    return JSON.stringify(list, null, 2);
  }

  /* ------------------------------------------------------------------ *
   * 9. FLASHCARD + XÁO TRỘN THẺ
   *    Thẻ được tạo từ chính ngân hàng câu hỏi (kể cả câu nhập tay / AI):
   *    mặt trước = câu hỏi, mặt sau = đáp án + ví dụ + giải thích tiếng Việt.
   * ------------------------------------------------------------------ */

  /** Chuyển một câu hỏi thành thẻ flashcard. */
  function cardFromQuestion(q, topicLabel) {
    const hasBlank = typeof q.question === "string" && q.question.includes("___");
    return {
      id: q.id,
      topic: topicLabel,
      level: q.level,
      type: q.type,
      difficulty: q.difficulty,
      difficultyLabel: DIFFICULTY_LABEL_VI[q.difficulty],
      front: q.question,
      back: q.answer,
      example: hasBlank ? q.question.replace("___", q.answer) : null, // câu hoàn chỉnh
      explanation: q.explanation,
    };
  }

  function resolveLevels(level) {
    if (!level || level === "all") return LEVELS.slice();
    const arr = (Array.isArray(level) ? level : [level]).map((l) => String(l).toUpperCase());
    const bad = arr.filter((l) => !LEVELS.includes(l));
    if (bad.length) throw new Error("Cấp độ không hợp lệ: " + bad.join(", "));
    return arr;
  }

  /**
   * Bộ thẻ để học: lật thẻ, chuyển thẻ, xáo trộn, đánh dấu đã thuộc / chưa thuộc.
   * @param {object[]} cards  mảng thẻ (từ cardFromQuestion)
   * @param {object} opts     { shuffle: true } – xáo trộn ngay khi tạo bộ thẻ
   */
  function createDeck(cards, opts) {
    const o = Object.assign({ shuffle: true }, opts);
    let list = o.shuffle ? shuffle(cards) : cards.slice();
    let index = 0;
    let flipped = false;
    const status = {}; // id -> "known" | "unknown"

    const deck = {
      size: () => list.length,
      cards: () => list.slice(),
      current: () => list[index] || null,
      isFlipped: () => flipped,

      /** Lật thẻ hiện tại; trả về true nếu đang xem mặt sau. */
      flip() { flipped = !flipped; return flipped; },

      next() { if (index < list.length - 1) { index++; flipped = false; } return deck.current(); },
      prev() { if (index > 0) { index--; flipped = false; } return deck.current(); },
      goTo(i) { if (i >= 0 && i < list.length) { index = i; flipped = false; } return deck.current(); },

      /** Xáo trộn toàn bộ bộ thẻ và quay về thẻ đầu tiên. */
      shuffle() { list = shuffle(list); index = 0; flipped = false; return deck.current(); },

      /** Chỉ xáo trộn các thẻ chưa học (sau thẻ hiện tại), giữ nguyên thẻ đã qua. */
      shuffleRemaining() {
        list = list.slice(0, index + 1).concat(shuffle(list.slice(index + 1)));
        return deck.current();
      },

      /** Đánh dấu thẻ hiện tại: true = đã thuộc, false = chưa thuộc. */
      mark(known) {
        const c = deck.current();
        if (c) status[c.id] = known ? "known" : "unknown";
        return deck.progress();
      },

      progress() {
        const known = list.filter((c) => status[c.id] === "known").length;
        const unknown = list.filter((c) => status[c.id] === "unknown").length;
        return {
          position: list.length ? index + 1 : 0,
          total: list.length,
          known,
          unknown,
          unmarked: list.length - known - unknown,
        };
      },

      unknownCards: () => list.filter((c) => status[c.id] === "unknown"),

      /** Bộ thẻ mới chỉ gồm các thẻ chưa thuộc (đã xáo trộn) để ôn lại. */
      reviewUnknown() { return createDeck(deck.unknownCards(), { shuffle: true }); },

      /** Xoá đánh dấu, quay về đầu bộ thẻ (có thể xáo trộn lại). */
      reset(reshuffle) {
        Object.keys(status).forEach((k) => delete status[k]);
        if (reshuffle) list = shuffle(list);
        index = 0;
        flipped = false;
        return deck.current();
      },
    };
    return deck;
  }

  /**
   * Tạo bộ flashcard cho một chủ đề.
   * @param {string} topic
   * @param {string|string[]|null} level  "A1", ["A1","A2"] hoặc null/"all" = mọi cấp độ
   * @param {object} opts  { difficulty: "easy"|"medium"|"hard"|[..], types: ["mcq","fill","type"],
   *                         limit: số thẻ tối đa, shuffle: true }
   * @returns {{topic, level, total, needsGeneration, deck}}
   */
  function buildFlashcards(topic, level, opts) {
    const o = Object.assign({ difficulty: null, types: null, limit: null, shuffle: true }, opts);
    const levels = resolveLevels(level);
    const diffs = o.difficulty ? [].concat(o.difficulty) : null;
    const key = findTopicKey(topic);

    let pool = key
      ? BANK[key].questions.filter(
          (q) => levels.includes(q.level) &&
                 (!diffs || diffs.includes(q.difficulty)) &&
                 (!o.types || o.types.includes(q.type))
        )
      : [];
    if (o.shuffle) pool = shuffle(pool);
    if (o.limit) pool = pool.slice(0, o.limit);

    const label = key ? BANK[key].label : topic;
    const cards = pool.map((q) => cardFromQuestion(q, label));
    return {
      topic: label,
      level: levels.length === 1 ? levels[0] : levels,
      total: cards.length,
      needsGeneration: cards.length === 0,
      deck: createDeck(cards, { shuffle: false }), // đã xáo ở trên; deck.shuffle() để xáo lại
    };
  }

  /** Như buildFlashcards, nhưng nếu chủ đề còn quá ít thẻ thì nhờ AI bổ sung (cần 1 cấp độ cụ thể). */
  async function buildFlashcardsWithAI(topic, level, opts) {
    const minCards = (opts && opts.minCards) || 5;
    let result = buildFlashcards(topic, level, opts);
    const single = typeof level === "string" && LEVEL_CONFIG[level.toUpperCase()];
    if (result.total < minCards && single && !(opts && opts.endpoint === false)) {
      try {
        await requestAIQuestions(topic, level.toUpperCase(), { endpoint: opts && opts.endpoint });
        result = buildFlashcards(topic, level, opts);
      } catch (err) {
        result.aiError = err.message;
      }
    }
    return result;
  }

  /* ------------------------------------------------------------------ *
   * 10. XUẤT RA NGOÀI
   * ------------------------------------------------------------------ */

  const api = {
    LEVELS, LEVEL_CONFIG, DIFFICULTIES, DIFFICULTY_LABEL_VI, DEFAULT_POINTS, QUESTION_TYPES,
    BANK,
    listTopics: () => Object.keys(BANK).map((k) => ({ key: k, label: BANK[k].label })),
    buildQuiz, checkAnswer, calcResult,
    registerQuestions, buildAIPrompt,
    importQuestions, importFromFile, requestAIQuestions, buildQuizWithAI,
    exportTopic, getCSVTemplate, parseCSV, extractJSON,
    buildFlashcards, buildFlashcardsWithAI, createDeck, cardFromQuestion,
    validateQuestion, validateBank,
    normalizeAnswer, normalizeKey, shuffle,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.QuestLingoContent = api;
})(typeof window !== "undefined" ? window : globalThis);

/* ====================================================================
 * CHẾ ĐỘ SERVER – AI TỰ TẠO CÂU HỎI (chỉ chạy khi gõ: node questlingo-content.js)
 *
 * - Không ảnh hưởng khi file được nạp bằng <script> hoặc require().
 * - Giữ API key ở phía server; trình duyệt chỉ gọi POST /api/generate-questions
 *   với { topic, level, count }. Server tự dựng prompt, nên client không thể
 *   dùng server như một "chatbot miễn phí".
 * - Tự phục vụ các file web tĩnh (index.html, css, js, ảnh) trong cùng thư mục.
 * - Không cần cài thêm gói npm (dùng http có sẵn + fetch của Node 18+).
 * ==================================================================== */
if (typeof module !== "undefined" && typeof require !== "undefined" && require.main === module) {
  (function startQuestLingoServer() {
    const http = require("http");
    const fs = require("fs");
    const path = require("path");
    const QL = module.exports;

    const PORT = Number(process.env.PORT) || 3000;
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    const MODEL = process.env.QUESTLINGO_MODEL || "claude-sonnet-5-5";
    const ROOT = __dirname;
    const MIME = {
      ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp",
    };
    const SYSTEM =
      "Bạn là giáo viên tiếng Anh biên soạn câu hỏi cho ứng dụng học tập. " +
      "Chỉ trả về một mảng JSON hợp lệ, không thêm văn bản nào ngoài JSON. " +
      "Nếu chủ đề không phù hợp với học sinh (bạo lực, nội dung người lớn, thù ghét…) " +
      "hoặc không liên quan đến việc học tiếng Anh, trả về mảng rỗng [].";

    // Giới hạn 10 yêu cầu / phút / địa chỉ IP để tránh bị lạm dụng và tốn tiền API.
    const hits = new Map();
    function tooMany(ip) {
      const now = Date.now();
      const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
      arr.push(now);
      hits.set(ip, arr);
      return arr.length > 10;
    }

    function sendJSON(res, status, obj) {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(obj));
    }

    function readBody(req) {
      return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on("data", (c) => {
          size += c.length;
          if (size > 20000) { reject(new Error("Dữ liệu gửi lên quá lớn")); req.destroy(); return; }
          chunks.push(c);
        });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        req.on("error", reject);
      });
    }

    async function callClaude(prompt) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 8000, system: SYSTEM, messages: [{ role: "user", content: prompt }] }),
      });
      if (!r.ok) throw new Error("Anthropic API trả lỗi " + r.status);
      const data = await r.json();
      return (data.content || []).map((b) => b.text || "").join("");
    }

    async function handleGenerate(req, res) {
      if (!API_KEY) return sendJSON(res, 503, { error: "Server chưa có ANTHROPIC_API_KEY" });
      if (tooMany(req.socket.remoteAddress)) return sendJSON(res, 429, { error: "Gửi quá nhanh, thử lại sau 1 phút" });

      let body;
      try { body = JSON.parse(await readBody(req)); }
      catch (e) { return sendJSON(res, 400, { error: "Dữ liệu không hợp lệ" }); }

      const topic = String(body.topic || "").replace(/[\r\n"]/g, " ").trim().slice(0, 60);
      const level = String(body.level || "").toUpperCase();
      if (!topic) return sendJSON(res, 400, { error: "Thiếu chủ đề" });
      if (!QL.LEVELS.includes(level)) return sendJSON(res, 400, { error: "Cấp độ không hợp lệ" });
      const count = Math.min(Math.max(parseInt(body.count, 10) || QL.LEVEL_CONFIG[level].count, 1), 30);

      try {
        const text = await callClaude(QL.buildAIPrompt(topic, level, count));
        sendJSON(res, 200, { text });
      } catch (err) {
        console.error(err.message);
        sendJSON(res, 502, { error: "Không tạo được câu hỏi" });
      }
    }

    function serveStatic(req, res) {
      let rel;
      try { rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
      catch (e) { res.writeHead(400); return res.end("Bad request"); }
      if (rel === "/") rel = "/index.html";
      const file = path.join(ROOT, path.normalize(rel));
      // Chặn thoát khỏi thư mục, file ẩn (.env…) và loại file không nằm trong danh sách cho phép.
      if (!file.startsWith(ROOT + path.sep) || path.basename(file).startsWith(".") || !MIME[path.extname(file).toLowerCase()]) {
        res.writeHead(404); return res.end("Not found");
      }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end("Not found"); }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] });
        res.end(data);
      });
    }

    http.createServer((req, res) => {
      const pathname = req.url.split("?")[0];
      if (req.method === "POST" && pathname === "/api/generate-questions") return handleGenerate(req, res);
      if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res);
      res.writeHead(405); res.end("Method not allowed");
    }).listen(PORT, () => {
      console.log("QuestLingo chạy tại http://localhost:" + PORT);
      if (!API_KEY) console.warn("Chưa đặt ANTHROPIC_API_KEY: tính năng AI tạo câu hỏi sẽ không hoạt động.");
    });
  })();
}

/* ---------------- Ví dụ sử dụng ----------------
const QL = QuestLingoContent;

// 1) Dựng bài chơi
const quiz = QL.buildQuiz("du lịch", "B1");
console.log(quiz.questions, quiz.maxScore);

// 2) Chủ đề chưa có -> lấy prompt để gọi AI sinh câu hỏi
const q2 = QL.buildQuiz("football", "A2");
if (q2.needsGeneration) {
  // gửi q2.aiPrompt tới AI, nhận mảng JSON -> QL.registerQuestions("football", jsonArray);
}

// 3) Chấm bài
const result = QL.calcResult(quiz, { "travel-b1-01": "will cancel", "travel-b1-02": "been" });
console.log(result.score, result.percent + "%");

// 4) Flashcard + xáo trộn thẻ
const fc = QL.buildFlashcards("travel", ["A1", "A2"], { difficulty: ["easy", "medium"] });
const deck = fc.deck;
deck.current();        // thẻ hiện tại: { front, back, example, explanation, ... }
deck.flip();           // lật thẻ
deck.mark(true);       // đã thuộc (false = chưa thuộc)
deck.next();           // thẻ kế tiếp
deck.shuffleRemaining(); // xáo trộn các thẻ chưa học
deck.shuffle();        // xáo trộn toàn bộ, quay về thẻ đầu
const review = deck.reviewUnknown(); // bộ thẻ mới chỉ gồm thẻ chưa thuộc

// 5) Kiểm tra ngân hàng còn thiếu bao nhiêu câu
console.log(QL.validateBank());
------------------------------------------------- */
