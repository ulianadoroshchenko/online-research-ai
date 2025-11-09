import { supabaseClient } from './supabase-config.js';

console.log('Supabase клиент:', supabaseClient);

// фиксируем время начала
const startTime = Date.now();

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

// переходы между блоками
document.getElementById('to-main').addEventListener('click', () => {
  const requiredFields = document.querySelectorAll('#intro-question [required]');
  let missing = [];
  requiredFields.forEach(field => {
    if (!field.value || (field.type === 'radio' && !document.querySelector(`input[name="${field.name}"]:checked`))) {
      missing.push(field.name);
      field.classList.add('missing-answer'); // подсветка
    } else {
      field.classList.remove('missing-answer');
    }
  });

  if (missing.length > 0) {
    alert("Необходимо ответить на все обязательные вопросы перед переходом.");
    return; // прерываем переход
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
  } else {
    document.getElementById('demographic-block').style.display = 'block';
    document.getElementById('demographic-block').scrollIntoView({ behavior: 'smooth' });

    document.querySelectorAll('#main-questions [required]').forEach(field => {
      field.removeAttribute('required');
    });
  }
});

document.getElementById('to-demographic').addEventListener('click', () => {
  // проверка обязательных полей в main-questions
  const requiredFields = document.querySelectorAll('#main-questions [required]');
  let missing = [];
  requiredFields.forEach(field => {
    if (!field.value || (field.type === 'radio' && !document.querySelector(`input[name="${field.name}"]:checked`))) {
      missing.push(field.name);
      field.classList.add('missing-answer'); // подсветка
    } else {
      field.classList.remove('missing-answer');
    }
  });

  if (missing.length > 0) {
    alert("Необходимо ответить на все обязательные вопросы перед переходом.");
    return; // прерываем переход
  }

  document.getElementById('main-questions').style.display = 'none';
  document.getElementById('demographic-block').style.display = 'block';
  document.getElementById('demographic-block').scrollIntoView({ behavior: 'smooth' });
});

// отправка формы
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // очистка пустых значений
  Object.keys(data).forEach(key => {
    if (data[key] === "") {
      delete data[key];
    }
  });

  // считаем время прохождения
  const endTime = Date.now();
  const durationSeconds = Math.floor((endTime - startTime) / 1000);

  const payload = {
    ...data,
    ip: userIp || null,
    created_at: new Date().toISOString(),
    user_agent: navigator.userAgent,
    seconds: durationSeconds
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




