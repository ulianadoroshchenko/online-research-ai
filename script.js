import { supabaseClient } from './supabase-config.js';
window.supabaseClient = supabaseClient;

console.log('Supabase клиент:', supabaseClient);

const startTime = Date.now();
let userIp = null;
let responseId = null;
let lastBlockVisited = 'intro-question';

// получаем IP и создаём запись при заходе
(async () => {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    userIp = ipData.ip;

    const { data, error } = await supabaseClient.from('responses').insert([{
      ip: userIp,
      created_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      seconds: 0,
      completed: false,
      exited_at_block: 'intro-question'
    }]).select();
    
    if (error) {
      console.error('Ошибка при создании параданных:', error);
    } else {
      responseId = data[0].id;
      console.log('Создана запись параданных:', responseId);
    }
  } catch (err) {
    console.error('Не удалось получить IP:', err);
  }
})();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data, error } = await supabaseClient.from('responses').insert([{
      ip: 'debug-ip',
      created_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      seconds: 0,
      completed: false,
      exited_at_block: 'intro-question'
    }]).select();

    if (error) {
      console.error('Ошибка при создании параданных:', error);
    } else {
      console.log('Параданные успешно созданы:', data);
    }
  } catch (err) {
    console.error('Фатальная ошибка:', err);
  }
});

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

// обновление параданных
async function updateParadata(blockId, completed=false, extraData={}) {
  if (!responseId) return;
  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

  const payload = {
    seconds: durationSeconds,
    exited_at_block: blockId,
    completed,
    ...extraData
  };

  const { error } = await supabaseClient.from('responses')
    .update(payload)
    .eq('id', responseId);

  if (error) {
    console.error('Ошибка при обновлении параданных:', error);
  } else {
    console.log('Обновлены параданные:', payload);
  }
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
    updateParadata(lastBlockVisited);
  } else {
    document.getElementById('demographic-block').style.display = 'block';
    document.getElementById('demographic-block').scrollIntoView({ behavior: 'smooth' });
    lastBlockVisited = 'demographic-block';
    updateParadata(lastBlockVisited);

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
  updateParadata(lastBlockVisited);
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
    if (data[key] === "") delete data[key];
  });

  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
  lastBlockVisited = 'form-submitted';

  const payload = {
    ...data,
    seconds: durationSeconds,
    completed: true,
    exited_at_block: lastBlockVisited
  };

  if (responseId) {
    const { error } = await supabaseClient.from('responses')
      .update(payload)
      .eq('id', responseId);

    if (error) {
      console.error('Ошибка при обновлении:', error);
      alert('Что-то пошло не так...');
    } else {
      alert('Спасибо за участие! Твои ответы сохранены.');
      e.target.reset();
    }
  }
});



