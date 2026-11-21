/**
 * QuestLingo – Nội dung + giao diện tiếng Anh (1 file duy nhất)
 * Nhóm 2 – Nhập môn CNTT_CS_02
 *
 * Dùng trên trang web (Vercel / GitHub Pages):
 *   <script src="questlingo-content.js"></script>
 *   - Mở game dạng cửa sổ phủ: thêm data-questlingo-open vào nút bất kỳ, ví dụ
 *       <button data-questlingo-open>Chơi ngay</button>
 *       (tuỳ chọn: data-topic="football" data-level="B1")
 *   - Hoặc nhúng trực tiếp: <div id="questlingo-app"></div>
 *   - Hoặc gọi trong JS: QuestLingoContent.openGame() / QuestLingoContent.mountApp(phanTu)
 *
 * Bật AI tự tạo câu hỏi (chỉ cần trên Vercel):
 *   1) Tạo file api/generate-questions.js gồm đúng 1 dòng:
 *        module.exports = require("../questlingo-content.js").aiHandler;
 *   2) Vercel -> Settings -> Environment Variables: ANTHROPIC_API_KEY
 *   Không bật AI thì mọi tính năng khác vẫn chạy bình thường.
 *
 * Dùng với Node (kiểm thử): const QL = require("./questlingo-content.js");
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
   * 10. XỬ LÝ AI CHO VERCEL (chạy phía server, trình duyệt không dùng)
   *    Xuất ra api.aiHandler. Trên Vercel tạo file api/generate-questions.js
   *    chỉ gồm 1 dòng:  module.exports = require("../questlingo-content.js").aiHandler;
   *    và đặt biến môi trường ANTHROPIC_API_KEY (Project -> Settings -> Environment Variables).
   * ------------------------------------------------------------------ */

  const AI_SYSTEM =
    "Bạn là giáo viên tiếng Anh biên soạn câu hỏi cho ứng dụng học tập. " +
    "Chỉ trả về một mảng JSON hợp lệ, không thêm văn bản nào ngoài JSON. " +
    "Nếu chủ đề không phù hợp với học sinh (bạo lực, nội dung người lớn, thù ghét…) " +
    "hoặc không liên quan đến việc học tiếng Anh, trả về mảng rỗng [].";

  // Giới hạn tạm 10 yêu cầu/phút/IP. Bộ nhớ này chỉ tồn tại trong từng instance serverless
  // nên chỉ giảm lạm dụng chứ không chặn tuyệt đối.
  const aiHits = new Map();
  function aiTooMany(ip) {
    const now = Date.now();
    const arr = (aiHits.get(ip) || []).filter((t) => now - t < 60000);
    arr.push(now);
    aiHits.set(ip, arr);
    return arr.length > 10;
  }

  /** Handler (req, res) kiểu Node/Vercel: POST { topic, level, count } -> { text }. */
  async function aiHandler(req, res) {
    const env = (typeof process !== "undefined" && process.env) || {};
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Chỉ hỗ trợ POST" });
    }
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Server chưa có ANTHROPIC_API_KEY" });

    const ip = String((req.headers && req.headers["x-forwarded-for"]) || "").split(",")[0].trim() || "unknown";
    if (aiTooMany(ip)) return res.status(429).json({ error: "Gửi quá nhanh, thử lại sau 1 phút" });

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) { body = null; }
    }
    if (!body || typeof body !== "object") return res.status(400).json({ error: "Dữ liệu không hợp lệ" });

    const topic = String(body.topic || "").replace(/[\r\n"]/g, " ").trim().slice(0, 60);
    const level = String(body.level || "").toUpperCase();
    if (!topic) return res.status(400).json({ error: "Thiếu chủ đề" });
    if (!LEVELS.includes(level)) return res.status(400).json({ error: "Cấp độ không hợp lệ" });
    const count = Math.min(Math.max(parseInt(body.count, 10) || LEVEL_CONFIG[level].count, 1), 30);

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: env.QUESTLINGO_MODEL || "claude-sonnet-5-5",
          max_tokens: 8000,
          system: AI_SYSTEM,
          messages: [{ role: "user", content: buildAIPrompt(topic, level, count) }],
        }),
      });
      if (!r.ok) throw new Error("Anthropic API trả lỗi " + r.status);
      const data = await r.json();
      const text = (data.content || []).map((b) => b.text || "").join("");
      return res.status(200).json({ text });
    } catch (err) {
      console.error(err.message);
      return res.status(502).json({ error: "Không tạo được câu hỏi" });
    }
  }

  /* ------------------------------------------------------------------ *
   * 11. XUẤT RA NGOÀI
   * ------------------------------------------------------------------ */

  const api = {
    LEVELS, LEVEL_CONFIG, DIFFICULTIES, DIFFICULTY_LABEL_VI, DEFAULT_POINTS, QUESTION_TYPES,
    BANK,
    listTopics: () => Object.keys(BANK).map((k) => ({ key: k, label: BANK[k].label })),
    buildQuiz, checkAnswer, calcResult,
    registerQuestions, buildAIPrompt, aiHandler,
    importQuestions, importFromFile, requestAIQuestions, buildQuizWithAI,
    exportTopic, getCSVTemplate, parseCSV, extractJSON,
    buildFlashcards, buildFlashcardsWithAI, createDeck, cardFromQuestion,
    validateQuestion, validateBank,
    normalizeAnswer, normalizeKey, shuffle,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.QuestLingoContent = api;

  /* ------------------------------------------------------------------ *
   * 12. GIAO DIỆN TRÌNH DUYỆT (tự chạy khi file được nạp bằng <script>)
   *     - Mở dạng cửa sổ phủ: thêm thuộc tính data-questlingo-open vào nút bất kỳ
   *       (tuỳ chọn data-topic="football" data-level="B1"), hoặc gọi QuestLingoContent.openGame().
   *     - Nhúng trực tiếp trong trang: <div id="questlingo-app"></div>
   *       hoặc QuestLingoContent.mountApp(phanTu).
   *     Mọi class CSS đều có tiền tố "ql-" để không đụng giao diện sẵn có của trang.
   * ------------------------------------------------------------------ */
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    (function initBrowserUI(QL) {
      var CSS = `
.ql-root{--bg:#f5f7fb;--card:#ffffff;--text:#1d2433;--muted:#5f6b80;--line:#dde3ee;--brand:#4f46e5;--brand-ink:#ffffff;--ok:#15803d;--ok-bg:#e7f6ec;--bad:#b91c1c;--bad-bg:#fdecec;color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}
.ql-root *{box-sizing:border-box}
.ql-root h2{margin:0 0 12px;font-size:22px;color:var(--text)}
.ql-root label{display:block;margin:14px 0 6px;font-weight:600;font-size:14px;color:var(--text)}
.ql-root input[type=text],.ql-root textarea{width:100%;padding:10px 12px;font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--line);border-radius:10px}
.ql-root textarea{min-height:140px;resize:vertical;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}
.ql-root ul{padding-left:20px}
.ql-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 2px 10px rgba(20,30,60,.07);margin-bottom:16px}
.ql-pills{display:flex;flex-wrap:wrap;gap:8px}
.ql-pill{padding:8px 16px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--text);font:inherit;cursor:pointer}
.ql-pill.is-on{background:var(--brand);color:var(--brand-ink);border-color:var(--brand);font-weight:700}
.ql-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;align-items:center}
.ql-row>input{flex:1;min-width:160px;margin:0}
.ql-btn{padding:10px 16px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--text);font:inherit;cursor:pointer}
.ql-btn:hover:not(:disabled){border-color:var(--brand)}
.ql-btn.ql-primary{background:var(--brand);color:var(--brand-ink);border-color:var(--brand);font-weight:600}
.ql-btn.ql-ghost{background:transparent}
.ql-btn:disabled{opacity:.5;cursor:not-allowed}
.ql-hidden{display:none!important}
.ql-hint,.ql-muted{color:var(--muted);font-size:14px}
.ql-meta{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:14px;flex-wrap:wrap}
.ql-bar{height:8px;background:var(--line);border-radius:99px;overflow:hidden;margin:8px 0 16px}
.ql-bar>i{display:block;height:100%;background:var(--brand)}
.ql-q{font-size:20px;margin:8px 0 16px}
.ql-opts{display:grid;gap:10px}
.ql-opt{text-align:left;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--text);font:inherit;cursor:pointer}
.ql-opt:hover:not(:disabled){border-color:var(--brand)}
.ql-opt.is-right{background:var(--ok-bg);border-color:var(--ok)}
.ql-opt.is-wrong{background:var(--bad-bg);border-color:var(--bad)}
.ql-feedback{margin-top:14px}
.ql-feedback.is-ok,.ql-feedback.is-bad{padding:12px 14px;border-radius:12px}
.ql-feedback.is-ok{background:var(--ok-bg);color:var(--ok)}
.ql-feedback.is-bad{background:var(--bad-bg);color:var(--bad)}
.ql-feedback p{margin:6px 0 0;color:var(--text)}
.ql-notice{background:var(--bad-bg);color:var(--text);border:1px solid var(--bad);border-radius:12px;padding:10px 14px;margin-bottom:16px;font-size:14px}
.ql-badtext{color:var(--bad)}
.ql-score{font-size:40px;font-weight:800;color:var(--brand);margin:4px 0}
.ql-review{list-style:none;padding:0!important;margin:12px 0 0;display:grid;gap:10px}
.ql-review li{border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:14px}
.ql-review li.is-ok{border-left:5px solid var(--ok)}
.ql-review li.is-bad{border-left:5px solid var(--bad)}
.ql-flip{perspective:1000px;cursor:pointer;margin:8px 0 16px}
.ql-flip-inner{position:relative;min-height:300px;transition:transform .5s;transform-style:preserve-3d}
.ql-flip.is-flipped .ql-flip-inner{transform:rotateY(180deg)}
.ql-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:1px solid var(--line);border-radius:16px;background:var(--card);padding:20px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:8px;overflow:auto;box-shadow:0 2px 10px rgba(20,30,60,.07)}
.ql-face.ql-back{transform:rotateY(180deg)}
.ql-big{font-size:22px;font-weight:600}
.ql-ex{font-style:italic;margin:0}
.ql-face p{margin:0}
.ql-badge{font-size:12px;padding:2px 10px;border-radius:99px;background:var(--bg);border:1px solid var(--line);color:var(--muted)}
.ql-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d2433;color:#fff;padding:10px 16px;border-radius:10px;z-index:100000;max-width:90%;font:14px system-ui,sans-serif}
.ql-overlay{position:fixed;inset:0;z-index:99999;background:rgba(15,20,40,.6);overflow:auto;padding:16px;display:flex;justify-content:center;align-items:flex-start}
.ql-panel{background:#f5f7fb;border-radius:20px;max-width:760px;width:100%;margin:auto;padding:16px;position:relative}
.ql-close{display:block;margin:0 0 12px auto;padding:6px 14px;border-radius:10px;border:1px solid #dde3ee;background:#fff;color:#1d2433;font:14px system-ui,sans-serif;cursor:pointer}
`;

      /* ---------- Tiện ích dựng giao diện (dùng textContent nên an toàn với dữ liệu nhập/AI) ---------- */
      function h(tag, props) {
        var e = document.createElement(tag);
        var p = props || {};
        Object.keys(p).forEach(function (k) {
          var v = p[k];
          if (v === false || v == null) return;
          if (k === "class") e.className = v;
          else if (k === "value") e.value = v;
          else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), v);
          else e.setAttribute(k, v === true ? "" : v);
        });
        Array.prototype.slice.call(arguments, 2).forEach(function add(c) {
          if (c == null || c === false) return;
          if (Array.isArray(c)) { c.forEach(add); return; }
          e.append(c.nodeType ? c : document.createTextNode(String(c)));
        });
        return e;
      }
      var toastTimer = null;
      function flash(msg) {
        var old = document.querySelector(".ql-toast");
        if (old) old.remove();
        var t = h("div", { class: "ql-toast" }, msg);
        document.body.append(t);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.remove(); }, 3200);
      }
      function download(name, text, type) {
        var url = URL.createObjectURL(new Blob([text], { type: type }));
        var a = h("a", { href: url, download: name });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }

      /* ---------- Lưu câu hỏi nhập tay / AI vào trình duyệt ---------- */
      var LS_KEY = "questlingo.custom.v1";
      function saveCustom() {
        try {
          var out = {};
          Object.keys(QL.BANK).forEach(function (key) {
            var t = QL.BANK[key];
            var qs = t.questions.filter(function (q) { return q.source; });
            if (qs.length) out[key] = { label: t.label, questions: qs };
          });
          localStorage.setItem(LS_KEY, JSON.stringify(out));
        } catch (e) { /* trình duyệt chặn lưu trữ thì bỏ qua */ }
      }
      function loadCustom() {
        try {
          var raw = localStorage.getItem(LS_KEY);
          if (!raw) return;
          var data = JSON.parse(raw);
          Object.keys(data).forEach(function (key) {
            QL.registerQuestions(data[key].label, data[key].questions, data[key].label);
          });
        } catch (e) { /* dữ liệu lưu bị hỏng thì bỏ qua */ }
      }

      function findKey(topic) {
        var k = QL.normalizeKey(topic);
        if (!k) return null;
        var keys = Object.keys(QL.BANK);
        for (var i = 0; i < keys.length; i++) {
          var t = QL.BANK[keys[i]];
          if (keys[i] === k || QL.normalizeKey(t.label) === k ||
              (t.aliases || []).some(function (a) { return QL.normalizeKey(a) === k; })) return keys[i];
        }
        return null;
      }
      function countFor(topic, level) {
        var key = findKey(topic);
        if (!key) return 0;
        return QL.BANK[key].questions.filter(function (q) { return q.level === level; }).length;
      }
      function refreshTopicList() {
        var dl = document.getElementById("ql-topics");
        if (!dl) { dl = h("datalist", { id: "ql-topics" }); document.body.append(dl); }
        dl.replaceChildren.apply(dl, QL.listTopics().map(function (t) { return h("option", { value: t.label }); }));
      }
      function aiHelp(err) {
        return "Không gọi được AI (" + err + "). Tính năng này cần hàm /api/generate-questions trên Vercel " +
               "và biến môi trường ANTHROPIC_API_KEY.";
      }

      /* ---------- Ứng dụng: gắn vào một phần tử bất kỳ ---------- */
      function createApp(container, opts) {
        opts = opts || {};
        container.classList.add("ql-root");
        var lv = String(opts.level || "").toUpperCase();
        var state = {
          topic: opts.topic || "Du lịch (Travel)",
          level: QL.LEVELS.indexOf(lv) >= 0 ? lv : "A1",
        };
        var keyHandler = null;

        function setKeys(fn) {
          if (keyHandler) document.removeEventListener("keydown", keyHandler);
          keyHandler = fn;
          if (fn) document.addEventListener("keydown", fn);
        }
        function toTop() {
          var ov = container.closest(".ql-overlay");
          if (ov) ov.scrollTop = 0;
          else if (container.getBoundingClientRect().top < 0) container.scrollIntoView();
        }
        function mount() {
          container.replaceChildren.apply(container, arguments);
          toTop();
        }
        function destroy() { setKeys(null); container.replaceChildren(); }

        function topicInput(onChange) {
          return h("input", {
            type: "text", list: "ql-topics", value: state.topic, autocomplete: "off",
            placeholder: "Ví dụ: Du lịch, football, technology…",
            oninput: function (e) { state.topic = e.target.value; if (onChange) onChange(); },
          });
        }
        function levelPicker(onChange) {
          var wrap = h("div", { class: "ql-pills" });
          QL.LEVELS.forEach(function (l) {
            wrap.append(h("button", {
              type: "button", "data-l": l, title: QL.LEVEL_CONFIG[l].count + " câu",
              class: "ql-pill" + (state.level === l ? " is-on" : ""),
              onclick: function () {
                state.level = l;
                Array.prototype.forEach.call(wrap.children, function (c) { c.classList.toggle("is-on", c.getAttribute("data-l") === l); });
                if (onChange) onChange();
              },
            }, l));
          });
          return wrap;
        }
        function loading(text) {
          mount(h("section", { class: "ql-card" }, h("h2", null, "⏳ " + text), h("p", { class: "ql-muted" }, "Vui lòng chờ trong giây lát…")));
        }
        function needTopic() {
          if (!state.topic.trim()) { flash("Hãy nhập chủ đề trước."); return false; }
          return true;
        }
        function emptyScreen(reason) {
          mount(h("section", { class: "ql-card" },
            h("h2", null, "Chưa có câu hỏi cho lựa chọn này"),
            h("p", null, reason || "Chủ đề này chưa có câu hỏi ở mức " + state.level + "."),
            h("p", { class: "ql-muted" }, "Bạn có thể nhập câu hỏi bằng CSV/JSON, hoặc bật AI để tự tạo."),
            h("div", { class: "ql-row" },
              h("button", { class: "ql-btn ql-primary", onclick: importScreen }, "📥 Nhập câu hỏi"),
              h("button", { class: "ql-btn", onclick: home }, "← Về trang chủ"))
          ));
        }

        /* ----- Trang chủ ----- */
        function home() {
          setKeys(null);
          var hint = h("p", { class: "ql-hint" });
          function update() {
            var n = countFor(state.topic, state.level), need = QL.LEVEL_CONFIG[state.level].count;
            hint.textContent = "Chủ đề này hiện có " + n + "/" + need + " câu ở mức " + state.level + "." +
              (n < need ? " Nếu thiếu, hệ thống sẽ thử nhờ AI bổ sung (khi đã bật AI)." : "");
          }
          mount(
            h("section", { class: "ql-card" },
              h("h2", null, "Bắt đầu"),
              h("label", null, "Chủ đề (nhập tùy ý)"), topicInput(update),
              h("label", null, "Trình độ"), levelPicker(update),
              hint,
              h("div", { class: "ql-row" },
                h("button", { class: "ql-btn ql-primary", onclick: startQuiz }, "📝 Làm bài"),
                h("button", { class: "ql-btn", onclick: startCards }, "🃏 Flashcard"),
                h("button", { class: "ql-btn ql-ghost", onclick: importScreen }, "📥 Nhập / xuất câu hỏi")
              )
            )
          );
          update();
        }

        /* ----- Làm bài trắc nghiệm ----- */
        async function startQuiz() {
          setKeys(null);
          if (!needTopic()) return;
          loading("Đang chuẩn bị câu hỏi");
          var quiz = await QL.buildQuizWithAI(state.topic.trim(), state.level);
          saveCustom();
          refreshTopicList();
          if (!quiz.questions.length) { emptyScreen(quiz.aiError ? aiHelp(quiz.aiError) : null); return; }
          var notice = null;
          if (quiz.shortage > 0) {
            notice = "Chỉ có " + quiz.available + "/" + quiz.requested + " câu." + (quiz.aiError ? " " + aiHelp(quiz.aiError) : "");
          }
          runQuiz(quiz, notice);
        }

        function runQuiz(quiz, notice) {
          var i = 0, score = 0, answers = {};
          var total = quiz.questions.length;

          function show() {
            var q = quiz.questions[i];
            var done = false;
            var fb = h("div", { class: "ql-feedback" });
            var nextBtn = h("button", { class: "ql-btn ql-primary ql-hidden", onclick: function () { i++; if (i < total) show(); else finish(); } },
              i === total - 1 ? "Xem kết quả" : "Câu tiếp →");

            function submit(value) {
              done = true;
              answers[q.id] = value;
              var r = QL.checkAnswer(q, value);
              score += r.points;
              fb.className = "ql-feedback " + (r.correct ? "is-ok" : "is-bad");
              fb.replaceChildren(
                h("strong", null, r.correct ? "✓ Chính xác! +" + r.points + " điểm" : "✗ Chưa đúng. Đáp án: " + r.correctAnswer),
                h("p", null, r.explanation)
              );
              nextBtn.classList.remove("ql-hidden");
              nextBtn.focus();
              return r;
            }

            var body;
            if (q.type === "mcq") {
              var btns = q.options.map(function (opt) {
                return h("button", {
                  type: "button", class: "ql-opt",
                  onclick: function (e) {
                    if (done) return;
                    var clicked = e.currentTarget;
                    var r = submit(opt);
                    btns.forEach(function (b) {
                      b.disabled = true;
                      if (b.textContent === q.answer) b.classList.add("is-right");
                      else if (b === clicked && !r.correct) b.classList.add("is-wrong");
                    });
                  },
                }, opt);
              });
              body = h("div", { class: "ql-opts" }, btns);
            } else {
              var inp = h("input", { type: "text", placeholder: "Nhập đáp án…", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
              var goBtn = h("button", { class: "ql-btn ql-primary", onclick: function () { go(); } }, "Kiểm tra");
              var go = function () {
                if (done || !inp.value.trim()) return;
                submit(inp.value);
                inp.disabled = true;
                goBtn.disabled = true;
              };
              inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
              body = h("div", { class: "ql-row" }, inp, goBtn);
              setTimeout(function () { inp.focus(); }, 0);
            }

            mount(
              notice ? h("div", { class: "ql-notice" }, notice) : null,
              h("section", { class: "ql-card" },
                h("div", { class: "ql-meta" },
                  h("span", null, quiz.topic + " · " + quiz.level),
                  h("span", null, "Câu " + (i + 1) + "/" + total + " · " + q.difficultyLabel + " · " + q.points + " điểm"),
                  h("span", null, "Điểm: " + score + "/" + quiz.maxScore)),
                h("div", { class: "ql-bar" }, h("i", { style: "width:" + Math.round((i / total) * 100) + "%" })),
                h("p", { class: "ql-q" }, q.question),
                body, fb,
                h("div", { class: "ql-row" }, nextBtn)
              )
            );
          }

          function finish() {
            var res = QL.calcResult(quiz, answers);
            var items = res.details.map(function (d) {
              var q = quiz.questions.filter(function (x) { return x.id === d.id; })[0];
              return h("li", { class: d.correct ? "is-ok" : "is-bad" },
                h("div", null, h("strong", null, (d.correct ? "✓ " : "✗ ") + q.question)),
                h("div", null, "Bạn trả lời: " + (d.userAnswer || "(bỏ trống)") + " · Đáp án: " + d.correctAnswer + " · +" + d.points + " điểm"),
                h("div", { class: "ql-muted" }, d.explanation));
            });
            mount(
              h("section", { class: "ql-card" },
                h("h2", null, "Kết quả"),
                h("div", { class: "ql-score" }, res.score + "/" + res.maxScore + " điểm (" + res.percent + "%)"),
                h("p", null, "Đúng " + res.correctCount + "/" + res.total + " câu."),
                h("div", { class: "ql-row" },
                  h("button", { class: "ql-btn ql-primary", onclick: startQuiz }, "🔁 Chơi lại"),
                  h("button", { class: "ql-btn", onclick: startCards }, "🃏 Học flashcard"),
                  h("button", { class: "ql-btn ql-ghost", onclick: home }, "← Trang chủ")),
                h("ul", { class: "ql-review" }, items)
              )
            );
          }
          show();
        }

        /* ----- Flashcard ----- */
        async function startCards() {
          setKeys(null);
          if (!needTopic()) return;
          loading("Đang chuẩn bị flashcard");
          var fc = await QL.buildFlashcardsWithAI(state.topic.trim(), state.level);
          saveCustom();
          refreshTopicList();
          if (!fc.total) { emptyScreen(fc.aiError ? aiHelp(fc.aiError) : null); return; }
          runCards(fc, fc.aiError ? aiHelp(fc.aiError) : null);
        }

        function runCards(fc, notice) {
          var deck = fc.deck;

          function render() {
            var c = deck.current();
            var p = deck.progress();
            var card;
            function flip() { deck.flip(); card.classList.toggle("is-flipped"); }
            card = h("div", { class: "ql-flip" + (deck.isFlipped() ? " is-flipped" : ""), tabindex: "0", onclick: flip },
              h("div", { class: "ql-flip-inner" },
                h("div", { class: "ql-face ql-front" },
                  h("span", { class: "ql-badge" }, c.level + " · " + c.difficultyLabel),
                  h("div", { class: "ql-big" }, c.front),
                  h("small", { class: "ql-muted" }, "Chạm hoặc nhấn Space để lật")),
                h("div", { class: "ql-face ql-back" },
                  h("span", { class: "ql-badge" }, "Đáp án"),
                  h("div", { class: "ql-big" }, c.back),
                  c.example ? h("p", { class: "ql-ex" }, c.example) : null,
                  h("p", null, c.explanation))));

            function step(fn) { fn(); render(); }
            function markAndNext(known) { deck.mark(known); deck.next(); render(); }

            mount(
              notice ? h("div", { class: "ql-notice" }, notice) : null,
              h("section", { class: "ql-card" },
                h("div", { class: "ql-meta" },
                  h("span", null, fc.topic),
                  h("span", null, "Thẻ " + p.position + "/" + p.total),
                  h("span", null, "Đã thuộc " + p.known + " · Chưa thuộc " + p.unknown + " · Chưa xem " + p.unmarked)),
                h("div", { class: "ql-bar" }, h("i", { style: "width:" + Math.round((p.position / p.total) * 100) + "%" })),
                card,
                h("div", { class: "ql-row" },
                  h("button", { class: "ql-btn", onclick: function () { step(function () { deck.prev(); }); } }, "◀ Trước"),
                  h("button", { class: "ql-btn", onclick: flip }, "🔄 Lật"),
                  h("button", { class: "ql-btn", onclick: function () { step(function () { deck.next(); }); } }, "Sau ▶")),
                h("div", { class: "ql-row" },
                  h("button", { class: "ql-btn", onclick: function () { markAndNext(false); } }, "😕 Chưa thuộc"),
                  h("button", { class: "ql-btn ql-primary", onclick: function () { markAndNext(true); } }, "✅ Đã thuộc")),
                h("div", { class: "ql-row" },
                  h("button", { class: "ql-btn", onclick: function () { step(function () { deck.shuffle(); }); flash("Đã xáo trộn toàn bộ thẻ"); } }, "🔀 Xáo trộn tất cả"),
                  h("button", { class: "ql-btn", onclick: function () { step(function () { deck.shuffleRemaining(); }); flash("Đã xáo trộn các thẻ chưa học"); } }, "🔀 Xáo phần còn lại"),
                  h("button", { class: "ql-btn", disabled: p.unknown === 0, onclick: function () {
                    var d2 = deck.reviewUnknown();
                    runCards({ topic: fc.topic, level: fc.level, total: d2.size(), deck: d2 }, null);
                  } }, "🔁 Ôn thẻ chưa thuộc"),
                  h("button", { class: "ql-btn", onclick: function () { step(function () { deck.reset(true); }); } }, "↺ Làm lại"),
                  h("button", { class: "ql-btn ql-ghost", onclick: home }, "← Trang chủ"))
              )
            );
          }

          setKeys(function (e) {
            var tag = (e.target && e.target.tagName) || "";
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            if (e.key === "ArrowRight") { deck.next(); render(); }
            else if (e.key === "ArrowLeft") { deck.prev(); render(); }
            else if (e.key === " ") {
              e.preventDefault();
              deck.flip();
              var el = container.querySelector(".ql-flip");
              if (el) el.classList.toggle("is-flipped");
            }
          });
          render();
        }

        /* ----- Nhập / xuất câu hỏi ----- */
        function showImportResult(box, res) {
          box.replaceChildren();
          if (res.parseError) { box.append(h("p", { class: "ql-badtext" }, "Lỗi đọc dữ liệu: " + res.parseError)); return; }
          box.append(h("p", null,
            "Đã thêm " + res.added + "/" + res.total + " câu" +
            (res.duplicates ? ", bỏ " + res.duplicates + " câu trùng" : "") +
            (res.rejected.length ? ", loại " + res.rejected.length + " câu lỗi" : "") + "."));
          if (res.rejected.length) {
            box.append(h("ul", null, res.rejected.slice(0, 10).map(function (r) {
              return h("li", null, r.id + ": " + r.errors.join("; "));
            })));
          }
        }

        function importScreen() {
          setKeys(null);
          var box = h("div");
          var ta = h("textarea", { placeholder: "Dán nội dung CSV, TSV (copy từ Google Sheets) hoặc JSON vào đây…" });
          var file = h("input", { type: "file", accept: ".csv,.tsv,.txt,.json" });
          var aiBtn = h("button", { class: "ql-btn", onclick: askAI }, "🤖 Nhờ AI tạo thêm câu hỏi");

          function done(res) { saveCustom(); refreshTopicList(); showImportResult(box, res); }

          function doPaste() {
            if (!needTopic()) return;
            if (!ta.value.trim()) { flash("Ô dán đang trống."); return; }
            done(QL.importQuestions(state.topic.trim(), ta.value, { source: "manual" }));
          }
          file.addEventListener("change", async function () {
            var f = file.files[0];
            if (!f || !needTopic()) { file.value = ""; return; }
            try { done(await QL.importFromFile(state.topic.trim(), f, { source: "manual" })); }
            catch (e) { box.textContent = "Lỗi: " + e.message; }
            file.value = "";
          });
          async function askAI() {
            if (!needTopic()) return;
            aiBtn.disabled = true;
            box.textContent = "Đang nhờ AI tạo câu hỏi…";
            try { done(await QL.requestAIQuestions(state.topic.trim(), state.level)); }
            catch (e) { box.replaceChildren(h("p", { class: "ql-badtext" }, aiHelp(e.message))); }
            aiBtn.disabled = false;
          }
          function exportTopic(fmt) {
            if (!needTopic()) return;
            try {
              var text = QL.exportTopic(state.topic.trim(), fmt);
              if (fmt === "csv") download("questlingo-cau-hoi.csv", "﻿" + text, "text/csv;charset=utf-8");
              else download("questlingo-cau-hoi.json", text, "application/json");
            } catch (e) { flash(e.message); }
          }

          mount(
            h("section", { class: "ql-card" },
              h("h2", null, "Nhập / xuất câu hỏi"),
              h("label", null, "Chủ đề sẽ nhận câu hỏi"), topicInput(),
              h("label", null, "Trình độ (dùng cho nút nhờ AI)"), levelPicker(),
              h("p", { class: "ql-hint" }, "Các cột CSV: level, type (mcq/fill/type), difficulty (easy/medium/hard), question, optionA–D, answer, accepted, explanation, points. " +
                "Với câu trắc nghiệm, cột answer có thể ghi A/B/C/D."),
              h("div", { class: "ql-row" },
                h("button", { class: "ql-btn", onclick: function () { download("questlingo-mau.csv", "﻿" + QL.getCSVTemplate(), "text/csv;charset=utf-8"); } }, "⬇ Tải CSV mẫu"),
                h("button", { class: "ql-btn", onclick: function () { exportTopic("csv"); } }, "⬇ Xuất CSV"),
                h("button", { class: "ql-btn", onclick: function () { exportTopic("json"); } }, "⬇ Xuất JSON"))
            ),
            h("section", { class: "ql-card" },
              h("h2", null, "Nhập dữ liệu"),
              ta,
              h("div", { class: "ql-row" }, h("button", { class: "ql-btn ql-primary", onclick: doPaste }, "Nhập từ ô dán"), file),
              h("div", { class: "ql-row" }, aiBtn),
              box
            ),
            h("section", { class: "ql-card" },
              h("div", { class: "ql-row" },
                h("button", { class: "ql-btn ql-ghost", onclick: home }, "← Về trang chủ"),
                h("button", { class: "ql-btn ql-ghost", onclick: function () {
                  if (confirm("Xóa toàn bộ câu hỏi đã nhập hoặc do AI tạo, lưu trên trình duyệt này?")) { localStorage.removeItem(LS_KEY); location.reload(); }
                } }, "🗑 Xóa câu hỏi đã nhập"))
            )
          );
        }

        refreshTopicList();
        home();
        return { destroy: destroy, home: home };
      }

      /* ---------- Cửa sổ phủ (mở từ nút "Chơi ngay") ---------- */
      var openOverlay = null;
      function openGame(opts) {
        if (openOverlay) return;
        var prevOverflow = document.body.style.overflow;
        var holder = h("div");
        var instance;
        function onEsc(e) { if (e.key === "Escape") close(); }
        function close() {
          if (!openOverlay) return;
          document.removeEventListener("keydown", onEsc);
          if (instance) instance.destroy();
          openOverlay.remove();
          openOverlay = null;
          document.body.style.overflow = prevOverflow;
        }
        var overlay = h("div", {
          class: "ql-overlay", role: "dialog", "aria-modal": "true", "aria-label": "QuestLingo",
          onclick: function (e) { if (e.target === overlay) close(); },
        }, h("div", { class: "ql-panel" },
             h("button", { class: "ql-close", type: "button", onclick: close }, "✕ Đóng"),
             holder));
        document.body.append(overlay);
        openOverlay = overlay;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onEsc);
        instance = createApp(holder, opts);
      }

      /* ---------- Khởi động ---------- */
      function init() {
        if (!document.getElementById("ql-style")) {
          var st = document.createElement("style");
          st.id = "ql-style";
          st.textContent = CSS;
          document.head.appendChild(st);
        }
        loadCustom();
        var el = document.getElementById("questlingo-app");
        if (el && !el.getAttribute("data-ql-ready")) {
          el.setAttribute("data-ql-ready", "1");
          createApp(el, { topic: el.getAttribute("data-topic"), level: el.getAttribute("data-level") });
        }
      }
      document.addEventListener("click", function (e) {
        var t = e.target && e.target.closest && e.target.closest("[data-questlingo-open]");
        if (!t) return;
        e.preventDefault();
        openGame({ topic: t.getAttribute("data-topic"), level: t.getAttribute("data-level") });
      });
      QL.mountApp = function (el, opts) { return createApp(el, opts || {}); };
      QL.openGame = openGame;
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
      else init();
    })(api);
  }
})(typeof window !== "undefined" ? window : globalThis);

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

// 5) Giao diện
QL.openGame({ topic: "football", level: "B1" });   // cửa sổ phủ
// QL.mountApp(document.getElementById("khung-game"));      // nhúng vào phần tử

// 6) Kiểm tra ngân hàng còn thiếu bao nhiêu câu
console.log(QL.validateBank());
------------------------------------------------- */
