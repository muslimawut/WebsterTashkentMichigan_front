export const knowledgeBase = [
    {
        intent: 'greeting',
        keywords: {
            en: ['hello', 'hi', 'hey', 'start', 'greet'],
            uz: ['salom', 'assalomu alaykum', 'start', 'boshlash'],
            ru: ['привет', 'здравствуйте', 'start', 'старт', 'добрый день']
        },
        response: {
            en: "Hello! I'm the Webster Exam Bot. How can I help you today? You can ask me about exam dates, registration, price, or location.",
            uz: "Assalomu alaykum! Men Webster Test Markazi yordamchisi botiman. Sizga qanday yordam bera olaman? Mendan imtihon sanalari, ro'yxatdan o'tish, narx yoki manzil haqida so'rashingiz mumkin.",
            ru: "Здравствуйте! Я бот Экзаменационного центра Вебстера. Чем могу помочь? Вы можете спросить меня о датах экзаменов, регистрации, ценах или местоположении."
        }
    },
    {
        intent: 'dates',
        keywords: {
            en: ['when', 'date', 'schedule', 'time', 'calendar', 'next exam'],
            uz: ['qachon', 'sana', 'vaqt', 'kalendar', 'kun', 'keyingi imtihon', 'jadval'],
            ru: ['когда', 'дата', 'время', 'расписание', 'календарь', 'следующий экзамен']
        },
        response: {
            en: "Our exams are held regularly. You can check the exact dates and available spots in the 'Upcoming Test Dates' section on our homepage. Click 'View All Test Dates' for the full schedule.",
            uz: "Imtihonlarimiz muntazam ravishda o'tkaziladi. Aniq sanalar va bo'sh joylarni bosh sahifamizdagi 'Upcoming Test Dates' bo'limida ko'rishingiz mumkin. To'liq jadval uchun 'View All Test Dates' tugmasini bosing.",
            ru: "Наши экзамены проводятся регулярно. Вы можете проверить точные даты и наличие мест в разделе 'Upcoming Test Dates' на нашей главной странице. Нажмите 'View All Test Dates' для просмотра полного расписания."
        }
    },
    {
        intent: 'register',
        keywords: {
            en: ['register', 'sign up', 'apply', 'join', 'account'],
            uz: ['royxatdan otish', "ro'yxatdan o'tish", 'yozilish', 'akkaunt', 'kirish'],
            ru: ['регистрация', 'записаться', 'аккаунт', 'подать заявку', 'создать']
        },
        response: {
            en: "To register, please click the 'Sign Up' button in the top right corner. You'll need to create an account, verify your email, and then you can book an exam date.",
            uz: "Ro'yxatdan o'tish uchun yuqori o'ng burchakdagi 'Sign Up' tugmasini bosing. Akkaunt yaratib, elektron pochtangizni tasdiqlaganingizdan so'ng imtihon sanasini band qilishingiz mumkin.",
            ru: "Для регистрации нажмите кнопку 'Sign Up' в правом верхнем углу. Вам нужно будет создать аккаунт, подтвердить электронную почту, и затем вы сможете забронировать дату экзамена."
        }
    },
    {
        intent: 'price',
        keywords: {
            en: ['price', 'cost', 'fee', 'how much', 'pay'],
            uz: ['narx', 'pul', "to'lov", 'qancha', 'summa'],
            ru: ['цена', 'стоимость', 'плата', 'сколько стоит', 'оплата']
        },
        response: {
            en: "The exam fee is displayed during the booking process. We accept various payment methods including credit cards (Uzcard, Humo, Visa/Mastercard).",
            uz: "Imtihon narxi sanani band qilish jarayonida ko'rsatiladi. Biz Uzcard, Humo va Visa/Mastercard orqali to'lovlarni qabul qilamiz.",
            ru: "Стоимость экзамена отображается в процессе бронирования. Мы принимаем различные способы оплаты, включая карты Uzcard, Humo и Visa/Mastercard."
        }
    },
    {
        intent: 'location',
        keywords: {
            en: ['where', 'location', 'address', 'place', 'map'],
            uz: ['qayerda', 'manzil', 'joy', 'xarita', 'lokatsiya'],
            ru: ['где', 'адрес', 'место', 'карта', 'локация']
        },
        response: {
            en: "We are located at Webster University in Tashkent. Address: 13 Navoi Avenue, Tashkent, Uzbekistan.",
            uz: "Biz Toshkent shahridagi Webster universitetida joylashganmiz. Manzil: Navoiy shoh ko'chasi, 13-uy, Toshkent, O'zbekiston.",
            ru: "Мы находимся в Университете Вебстер в Ташкенте. Адрес: проспект Навои, 13, Ташкент, Узбекистан."
        }
    },
    {
        intent: 'contact',
        keywords: {
            en: ['contact', 'email', 'phone', 'support', 'help'],
            uz: ['aloqa', 'email', 'telefon', 'yordam', 'boglanish', "bog'lanish"],
            ru: ['контакт', 'почта', 'телефон', 'поддержка', 'помощь']
        },
        response: {
            en: "You can contact our support team via email at skuzimurod@webster.edu.",
            uz: "Qo'llab-quvvatlash xizmatimizga skuzimurod@webster.edu elektron pochtasi orqali murojaat qilishingiz mumkin.",
            ru: "Вы можете связаться с нашей службой поддержки по электронной почте skuzimurod@webster.edu."
        }
    },
    {
        intent: 'results',
        keywords: {
            en: ['result', 'score', 'check', 'grade'],
            uz: ['natija', 'baho', 'tekshirish', 'javob'],
            ru: ['результат', 'балл', 'оценка', 'проверить']
        },
        response: {
            en: "Results are usually available a few days after the exam. You can check them in your personal profile under the 'Results' section.",
            uz: "Natijalar odatda imtihondan bir necha kun o'tgach e'lon qilinadi. Ularni shaxsiy profilingizdagi 'Results' bo'limida tekshirishingiz mumkin.",
            ru: "Результаты обычно доступны через несколько дней после экзамена. Вы можете проверить их в своем личном профиле в разделе 'Results'."
        }
    }
];

export const detectLanguage = (text) => {
    const lowerText = text.toLowerCase();

    // 1. Check for specific common words (Patterns)
    const uzPatterns = [
        'salom', 'qachon', 'qanday', 'nima', 'kim', 'qayerda', 'narx', 'bormi', 'kerak', 'mumkin', 'rahmat', 'aka', 'opa',
        'kere', 'qancha', 'bomi', 'qatta', 'qanaqa', 'menga', 'mnaga', 'man', 'san', 'siz', 'biz', 'ular', 'shu', 'bu',
        'imtihon', 'yaqin', 'kun', 'oy', 'yil', 'test', 'olish', 'topshirish'
    ];
    const ruPatterns = [
        'привет', 'как', 'что', 'где', 'когда', 'сколько', 'почему', 'можно', 'спасибо', 'здравствуйте',
        'цена', 'стоимость', 'есть', 'ли', 'это', 'то', 'я', 'мы', 'они', 'вы',
        'экзамен', 'тест', 'сдать', 'пройти', 'ближайший'
    ];

    let uzCount = 0;
    let ruCount = 0;

    uzPatterns.forEach(p => { if (lowerText.includes(p)) uzCount++; });
    ruPatterns.forEach(p => { if (lowerText.includes(p)) ruCount++; });

    // 2. Aggregate keywords from Knowledge Base
    knowledgeBase.forEach(item => {
        if (item.keywords.uz && item.keywords.uz.some(kw => lowerText.includes(kw))) uzCount += 2; // Weight KB matches higher
        if (item.keywords.ru && item.keywords.ru.some(kw => lowerText.includes(kw))) ruCount += 2;
        // English keywords might be common (like 'test'), so we valid them but give less weight if needed
        // But usually input is distinct.
    });

    if (uzCount > ruCount) return 'uz';
    if (ruCount > uzCount) return 'ru';

    // 3. Fallback: Cyrillic check
    if (/[а-яА-ЯёЁ]/.test(text)) return 'ru';

    return 'en'; // Default to English
};

export const getResponse = (text) => {
    // Detect Language
    const lang = detectLanguage(text);
    const lowerText = text.toLowerCase();

    // Find matching intent
    for (const item of knowledgeBase) {
        // Collect all keywords for the detected language
        const keywords = item.keywords[lang] || [];

        // Also check if any other language keywords match, just in case detection was off but intent is clear
        // But we must prioritize the response in the DETECTED language.

        // Extended logic: Check ALL keywords to find the INTENT first.
        const allKeywords = [
            ...(item.keywords.uz || []),
            ...(item.keywords.ru || []),
            ...(item.keywords.en || [])
        ];

        if (allKeywords.some(keyword => lowerText.includes(keyword))) {
            return item.response[lang];
        }
    }

    // Default fallbacks
    const fallbacks = {
        en: "I'm sorry, I didn't quite understand that. Could you please ask about exam dates, registration, or location?",
        uz: "Uzr, tushunmadim. Iltimos, imtihon sanalari, ro'yxatdan o'tish yoki manzil haqida so'rasangiz bo'ladimi?",
        ru: "Извините, я не совсем понял. Вы могли бы спросить о датах экзамена, регистрации или местоположении?"
    };

    return fallbacks[lang];
};
