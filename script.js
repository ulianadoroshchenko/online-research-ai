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

// отслеживаем последний вопрос
let lastQuestion = null;
document.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('change', () => {
    lastQuestion = el.name;
  });
});

// переходы между блоками
document.getElementById('to-main').addEventListener('click', () => {
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
  document.getElementById('main-questions').style.display = 'none';
  document.getElementById('demographic-block').style.display = 'block';
  document.getElementById('demographic-block').scrollIntoView({ behavior: 'smooth' });
});

// отправка формы
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // 🔥 Вот сюда вставляешь универсальную очистку:
  Object.keys(data).forEach(key => {
    if (data[key] === "") {
      delete data[key]; // или data[key] = null;
    }
  });
  const payload = {
   ...data,
   ip: userIp || null,
   created_at: new Date().toISOString(),
   time_and: lastQuestion || null,
   user_agent: navigator.userAgent
  // minutes: ... ← удалить
};

  console.log('Финальный payload:', payload);
  delete data.minutes;
  const { error } = await supabaseClient.from('responses').insert([payload]);

  if (error) {
    console.error('Ошибка при отправке:', error.message || JSON.stringify(error));
    alert('Что-то пошло не так...');
  } else {
    alert('Анкета успешно отправлена!');
    e.target.reset();
  }
});