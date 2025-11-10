import { supabaseClient } from './supabase-config.js';

console.log('Supabase клиент:', supabaseClient);

// фиксируем время начала
const startTime = Date.now();
let lastBlockVisited = 'intro-question';

// получаем IP
let userIp = null;
(async () => {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    userIp = ipData.ip;
  } catch (err) {
    console.error('Не удалось получить IP:', err);
  }
})();

// универсальная проверка блока
function validateBlock(selector) {
  const requiredFields = document.querySelectorAll(`${selector} [required]`);
  let missing = [];

  requiredFields.forEach(field => {
    if (field.type === 'radio') {
      const groupChecked = document.querySelector(`input[name="${field.name}"]:checked`);
      if (!groupChecked) {
        missing.push(field.name);
        document.querySelectorAll(`input[name="${field.name}"]`).forEach(radio => {
          radio.classList.add('missing-answer');
        });
      } else {
        document.querySelectorAll(`input[name="${field.name}"]`).forEach(radio => {
          radio.classList.remove('missing-answer');
        });
      }
    } else {
      if (!field.value) {
        missing.push(field.name);
        field.classList.add('missing-answer');
      } else {
        field.classList.remove('missing-answer');
      }
    }
  });

  return missing;
}

// переходы между блоками
document.getElementById('to-main').addEventListener('click', () => {
  const missing = validateBlock('#intro-question');
  if (missing.length > 0) {
    alert("Необходимо ответить на все обязательные вопросы перед переходом.");
    return;
  }

  const selected = document.querySelector('input[name="v1"]:checked');
  if (!selected) {
    alert("Пожалуйста, выбери вариант.");
    return;
  }

  const value = selected.value;
  document.getElementById('intro-question').style.display = 'none';

  if (value === "1" || value === "2") {
    document.getElementById('main-questions').style.display = 'block';
    document.getElementById('main-questions').scrollIntoView({ behavior: 'smooth' });
    lastBlockVisited = 'main-questions';
  } else {
    document.getElementById('demographic-block').style.display = 'block';
    document.getElementById('demographic-block').scrollIntoView({ behavior: 'smooth' });
    lastBlockVisited = 'demographic-block';

    document.querySelectorAll('#main-questions [required]').forEach(field => {
      field.removeAttribute('required');
    });
  }
});

document.getElementById('to-demographic').addEventListener('click', () => {
  const missing = validateBlock('#main-questions');
  if (missing.length > 0) {
    alert("Необходимо ответить на все обязательные вопросы перед переходом.");
    return;
  }

  document.getElementById('main-questions').style.display = 'none';
  document.getElementById('demographic-block').style.display = 'block';
  document.getElementById('demographic-block').scrollIntoView({ behavior: 'smooth' });
  lastBlockVisited = 'demographic-block';
});

// отправка формы
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const missing = validateBlock('form');
  if (missing.length > 0) {
    alert("Необходимо ответить на все обязательные вопросы перед отправкой.");
    return;
  }

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  Object.keys(data).forEach(key => {
    if (data[key] === "") {
      delete data[key];
    }
  });

  const endTime = Date.now();
  const durationSeconds = Math.floor((endTime - startTime) / 1000);
  lastBlockVisited = 'form-submitted';

  const payload = {
    ...data,
    ip: userIp || null,
    created_at: new Date().toISOString(),
    user_agent: navigator.userAgent,
    seconds: durationSeconds,
    completed: true,
    exited_at_block: lastBlockVisited
  };

  console.log('Финальный payload:', payload);

  const { error } = await supabaseClient.from('responses').insert([payload]);

  if (error) {
    console.error('Ошибка при отправке:', error.message || JSON.stringify(error));
    alert('Что-то пошло не так...');
  } else {
    alert(`Спасибо за участие! Твои ответы уже обрабатываются нашими нейронами... ну, почти.`);
    e.target.reset();
  }
});

// параданные при выходе
window.addEventListener('beforeunload', async () => {
  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

  const payload = {
    ip: userIp || null,
    created_at: new Date().toISOString(),
    user_agent: navigator.userAgent,
    seconds: durationSeconds,
    completed: false,
    exited_at_block: lastBlockVisited
  };

  // URL REST API Supabase
  const url = 'https://kyewynzyetmjrhxcuvrw.supabase.co/rest/v1/responses';

  // Заголовки для REST API
  const headers = {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZXd5bnp5ZXRtanJoeGN1dnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjEzNjMsImV4cCI6MjA3NzgzNzM2M30.6rkx_snJPvvzCmDw0LsCLtRzQmlNLPp66damJsB283o',
    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZXd5bnp5ZXRtanJoeGN1dnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjEzNjMsImV4cCI6MjA3NzgzNzM2M30.6rkx_snJPvvzCmDw0LsCLtRzQmlNLPp66damJsB283o`
  };

  // Формируем тело запроса
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

  // Отправляем через sendBeacon
  navigator.sendBeacon(url, blob);
});
