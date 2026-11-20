// Dữ liệu trò chơi phong phú có kèm hình ảnh minh họa (dùng link ảnh Unsplash chất lượng cao)
const questions = [
    {
        question: "Từ nào mô tả chính xác quả táo trong tiếng Anh?",
        image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60",
        options: ["Banana", "Apple", "Orange"],
        correct: 1
    },
    {
        question: "Con vật đáng yêu trong hình có tên tiếng Anh là gì?",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60",
        options: ["Dog", "Cat", "Rabbit"],
        correct: 1
    },
    {
        question: "Vật dụng học tập này được gọi là gì?",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
        options: ["Book", "Pen", "Eraser"],
        correct: 0
    },
    {
        question: "Loài hoa rực rỡ này trong tiếng Anh là gì?",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60",
        options: ["Tree", "Flower", "Grass"],
        correct: 1
    }
];

let currentQuestionIndex = 0;
let score = 0;

const gameHubSection = document.getElementById('game-hub');
const activeGameSection = document.getElementById('active-game-section');
const backToHubBtn = document.getElementById('back-to-hub');
const quizImage = document.getElementById('quiz-image');
const questionText = document.getElementById('question-text');
const optionBtns = document.querySelectorAll('.option-btn');
const scoreDisplay = document.getElementById('score-display');
const totalStars = document.getElementById('total-stars');

// Hàm tạo âm thanh vui nhộn trực tiếp bằng code (Không cần tải file âm thanh)
function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'correct') {
            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        } else {
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch (e) {
        console.log("Audio not supported");
    }
}

// Bắt đầu trò chơi số 1
function startMiniGame(gameId) {
    if (gameId !== 1) {
        alert('Trò chơi này đang được cập nhật, hãy thử Thử Thách Từ Vựng nhé! 🚀');
        return;
    }
    gameHubSection.style.display = 'none';
    activeGameSection.style.display = 'flex';
    currentQuestionIndex = 0;
    score = 0;
    updateScoreUI();
    loadQuestion();
}

// Quay lại kho game
backToHubBtn.addEventListener('click', function() {
    activeGameSection.style.display = 'none';
    gameHubSection.style.display = 'block';
});

function loadQuestion() {
    let q = questions[currentQuestionIndex];
    quizImage.src = q.image;
    questionText.textContent = q.question;
    
    optionBtns.forEach((btn, index) => {
        btn.textContent = q.options[index];
        btn.style.backgroundColor = '#f1f2f6';
        btn.style.color = '#2d3436';
        btn.onclick = function() {
            checkAnswer(index, btn);
        };
    });
}

function checkAnswer(selectedChoice, clickedBtn) {
    let q = questions[currentQuestionIndex];
    
    // Khóa không cho bấm nhiều lần trong 1 câu
    optionBtns.forEach(btn => btn.onclick = null);

    if (selectedChoice === q.correct) {
        score += 20;
        playSound('correct');
        clickedBtn.style.backgroundColor = '#00b894';
        clickedBtn.style.color = 'white';
    } else {
        playSound('wrong');
        clickedBtn.style.backgroundColor = '#ff7675';
        clickedBtn.style.color = 'white';
        // Tô sáng đáp án đúng cho người chơi biết
        optionBtns[q.correct].style.backgroundColor = '#00b894';
        optionBtns[q.correct].style.color = 'white';
    }

    updateScoreUI();

    // Chuyển câu hỏi sau 1 giây
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            alert(`🎉 Chúc mừng bạn đã hoàn thành thử thách! Tổng điểm: ${score}`);
            totalStars.textContent = parseInt(totalStars.textContent) + score;
            activeGameSection.style.display = 'none';
            gameHubSection.style.display = 'block';
        }
    }, 1200);
}

function updateScoreUI() {
    scoreDisplay.innerHTML = `<i class="fa-solid fa-star"></i> Điểm: ${score}`;
}