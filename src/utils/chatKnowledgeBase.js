export const knowledgeBase = [
    {
        intent: 'greeting',
        keywords: {
            en: ['hello', 'hi', 'hey', 'start', 'greet'],
            uz: ['salom', 'assalomu alaykum', 'start', 'boshlash'],
            ru: ['привет', 'здравствуйте', 'start', 'старт', 'добрый день']
        },
        response: {
            en: "Hello! I'm the Webster MEPT Assistant Bot. How can I help you today? You can ask me about the MEPT exam, registration, payment, exam structure, scoring, or results.",
            uz: "Assalomu alaykum! Men Webster MEPT yordamchi botiman. Sizga qanday yordam bera olaman? Mendan MEPT imtihoni, ro'yxatdan o'tish, to'lov, imtihon tuzilmasi, ballash yoki natijalar haqida so'rashingiz mumkin.",
            ru: "Здравствуйте! Я бот-помощник Webster MEPT. Чем могу помочь? Вы можете спросить меня об экзамене MEPT, регистрации, оплате, структуре экзамена, оценках или результатах."
        }
    },
    {
        intent: 'what_is_mept',
        keywords: {
            en: ['what is mept', 'what is the mept', 'mept exam', 'about mept', 'explain mept', 'michigan english placement', 'placement test'],
            uz: ['mept nima', 'mept imtihoni nima', 'mept haqida', 'michigan english placement', 'joylashtiruv testi'],
            ru: ['что такое mept', 'что такое экзамен mept', 'о mept', 'michigan english placement', 'тест на размещение']
        },
        response: {
            en: "The MEPT (Michigan English Placement Test) is an English proficiency exam used to assess applicants' academic English skills for admission and placement purposes. It evaluates Listening, Reading, Grammar, Vocabulary, and Writing.",
            uz: "MEPT (Michigan English Placement Test) — bu abituriyentlarning akademik ingliz tili ko'nikmalarini qabul qilish va joylashtirish maqsadida baholash uchun ishlatiladigan ingliz tili imtihoni. U Tinglash, O'qish, Grammatika, Lug'at va Yozish bo'limlarini baholaydi.",
            ru: "MEPT (Michigan English Placement Test) — это экзамен по английскому языку, используемый для оценки академических навыков английского языка абитуриентов в целях поступления и распределения. Он оценивает Аудирование, Чтение, Грамматику, Словарный запас и Письмо."
        }
    },
    {
        intent: 'who_needs_mept',
        keywords: {
            en: ['who needs', 'who must', 'who should take', 'required to take', 'need to take mept', 'must take'],
            uz: ['kim topshirishi kerak', 'kimlar uchun', 'kim uchun majburiy', 'mept topshirish kerakmi'],
            ru: ['кто должен', 'кому нужно', 'кто обязан', 'нужно ли сдавать', 'кто сдаёт mept']
        },
        response: {
            en: "Applicants who do not have a valid international English proficiency certificate (such as IELTS, TOEFL, or Duolingo) or whose scores do not meet admission requirements may be required to take the MEPT.",
            uz: "Xalqaro ingliz tili sertifikati (IELTS, TOEFL yoki Duolingo) bo'lmagan yoki ballari qabul talablariga mos kelmaydigan abituriyentlar MEPT topshirishi shart bo'lishi mumkin.",
            ru: "Абитуриенты, не имеющие действующего международного сертификата по английскому языку (IELTS, TOEFL или Duolingo) или чьи баллы не соответствуют требованиям для поступления, могут быть обязаны пройти MEPT."
        }
    },
    {
        intent: 'mept_vs_met',
        keywords: {
            en: ['mept vs met', 'difference mept met', 'mept or met', 'same as met', 'is mept met'],
            uz: ['mept va met farqi', 'mept met', 'mept met farq'],
            ru: ['mept и met', 'разница mept met', 'mept или met', 'то же самое что met']
        },
        response: {
            en: "No, MEPT and MET are different. MEPT (Michigan English Placement Test) is mainly used for placement and internal admission decisions. MET (Michigan English Test) is a standardized external exam.",
            uz: "Yo'q, MEPT va MET turli xil testlar. MEPT asosan joylashtirish va ichki qabul qarorlari uchun ishlatiladi. MET (Michigan English Test) esa standartlashtirilgan tashqi imtihon.",
            ru: "Нет, MEPT и MET — разные тесты. MEPT в основном используется для распределения и внутренних решений о приёме. MET (Michigan English Test) — это стандартизированный внешний экзамен."
        }
    },
    {
        intent: 'register',
        keywords: {
            en: ['register', 'sign up', 'apply', 'join', 'account', 'how to register', 'registration'],
            uz: ['royxatdan otish', "ro'yxatdan o'tish", 'yozilish', 'akkaunt', 'qanday royxatdan', 'qanday yozilish'],
            ru: ['регистрация', 'записаться', 'аккаунт', 'подать заявку', 'создать', 'как зарегистрироваться']
        },
        response: {
            en: "To register, you must first complete your online application and upload all required documents. Only applicants with a submitted application can register for the exam. Click 'Sign Up' in the top right corner to create your account.",
            uz: "Ro'yxatdan o'tish uchun avval onlayn arizangizni to'ldirib, barcha kerakli hujjatlarni yuklashingiz kerak. Faqat ariza topshirgan abituriyentlar imtihonga ro'yxatdan o'tishi mumkin. Akkaunt yaratish uchun yuqori o'ng burchakdagi 'Sign Up' tugmasini bosing.",
            ru: "Для регистрации вы должны сначала заполнить онлайн-заявку и загрузить все необходимые документы. Только абитуриенты с поданной заявкой могут зарегистрироваться на экзамен. Нажмите 'Sign Up' в правом верхнем углу, чтобы создать аккаунт."
        }
    },
    {
        intent: 'price',
        keywords: {
            en: ['price', 'cost', 'fee', 'how much', 'pay', 'exam fee', '650'],
            uz: ['narx', 'pul', "to'lov", 'qancha', 'summa', 'imtihon narxi'],
            ru: ['цена', 'стоимость', 'плата', 'сколько стоит', 'оплата', 'стоимость экзамена']
        },
        response: {
            en: "The MEPT exam fee is 650,000 UZS. Payment can be made online via Click, Payme, Xazna, or at any bank.",
            uz: "MEPT imtihon to'lovi 650 000 so'm. To'lov Click, Payme, Xazna orqali onlayn yoki istalgan bankda amalga oshirilishi mumkin.",
            ru: "Стоимость экзамена MEPT составляет 650 000 сум. Оплата может производиться онлайн через Click, Payme, Xazna или в любом банке."
        }
    },
    {
        intent: 'payment_methods',
        keywords: {
            en: ['payment method', 'how to pay', 'click', 'payme', 'xazna', 'bank payment', 'online payment'],
            uz: ["to'lov usuli", 'qanday tolanadi', 'click orqali', 'payme', 'xazna', 'bank orqali'],
            ru: ['способ оплаты', 'как оплатить', 'через click', 'через payme', 'через xazna', 'банк', 'онлайн оплата']
        },
        response: {
            en: "Payment can be made online via Click, Payme, Xazna, or at any bank. Detailed payment instructions are available on the website.",
            uz: "To'lov Click, Payme, Xazna orqali onlayn yoki istalgan bankda amalga oshirilishi mumkin. Batafsil to'lov ko'rsatmalari veb-saytda mavjud.",
            ru: "Оплата может производиться онлайн через Click, Payme, Xazna или в любом банке. Подробные инструкции по оплате доступны на сайте."
        }
    },
    {
        intent: 'payment_deadline',
        keywords: {
            en: ['when to pay', 'payment deadline', 'days to pay', 'payment time', 'late payment'],
            uz: ["to'lov muddati", 'qachon tolash', 'kechiktirilgan tolov', '2 kun', '6 ish kuni'],
            ru: ['срок оплаты', 'когда платить', 'опоздать с оплатой', '2 дня', '6 рабочих дней']
        },
        response: {
            en: "Payment must be completed within 2 days after registration and at least 6 business days before the exam date. Late payment may result in cancellation of your registration.",
            uz: "To'lov ro'yxatdan o'tgandan keyin 2 kun ichida va imtihon sanasidan kamida 6 ish kuni oldin amalga oshirilishi kerak. Kechiktirilgan to'lov ro'yxatdan o'tishingizni bekor qilishiga olib kelishi mumkin.",
            ru: "Оплата должна быть произведена в течение 2 дней после регистрации и не позднее чем за 6 рабочих дней до даты экзамена. Задержка оплаты может привести к отмене вашей регистрации."
        }
    },
    {
        intent: 'capacity',
        keywords: {
            en: ['how many', 'spots', 'capacity', 'applicants per day', 'limit', 'first come', '40'],
            uz: ['nechta joy', 'qancha odam', 'sig\'im', 'birinchi kelgan', '40 nafar'],
            ru: ['сколько мест', 'количество мест', 'вместимость', 'первый пришёл', '40 человек']
        },
        response: {
            en: "Only 40 applicants are allowed per test day. Registration is first-come, first-served, so register early to secure your spot.",
            uz: "Har bir imtihon kuniga faqat 40 nafar abituriyent qabul qilinadi. Ro'yxatdan o'tish birinchi kelgan — birinchi xizmat qilinadi asosida amalga oshiriladi, shuning uchun joyingizni band qilish uchun erta ro'yxatdan o'ting.",
            ru: "На каждый день тестирования принимается только 40 абитуриентов. Регистрация осуществляется в порядке живой очереди, поэтому зарегистрируйтесь заранее, чтобы занять своё место."
        }
    },
    {
        intent: 'invitation_letter',
        keywords: {
            en: ['invitation letter', 'confirmation', 'email confirmation', 'receipt', 'proof of payment', 'after payment'],
            uz: ['taklif xati', 'tasdiqlash', 'email tasdiqlash', 'tolovdan keyin', 'tasdiqnoma'],
            ru: ['пригласительное письмо', 'подтверждение', 'подтверждение по email', 'после оплаты', 'квитанция']
        },
        response: {
            en: "Once your payment is confirmed, you will receive an Invitation Letter by email within two business days. You are allowed to attend the exam only after receiving this letter.",
            uz: "To'lovingiz tasdiqlangandan so'ng, ikki ish kuni ichida elektron pochtangizga Taklif xati yuboriladi. Imtihonga faqat ushbu xatni olgandan keyin kirishga ruxsat beriladi.",
            ru: "После подтверждения оплаты вы получите Пригласительное письмо по электронной почте в течение двух рабочих дней. Вы допускаетесь к экзамену только после получения этого письма."
        }
    },
    {
        intent: 'passport',
        keywords: {
            en: ['passport', 'document', 'id', 'bring', 'identification', 'original passport'],
            uz: ['pasport', 'hujjat', 'id', 'olib kelish', 'asl pasport', 'nima olib borish'],
            ru: ['паспорт', 'документ', 'удостоверение', 'принести', 'оригинал паспорта', 'что взять']
        },
        response: {
            en: "You must bring your original passport to the exam. Electronic or photocopied versions are not accepted. Without an original passport, you will not be allowed to take the exam.",
            uz: "Imtihonga asl pasportingizni olib kelishingiz shart. Elektron yoki nusxa ko'chirish qabul qilinmaydi. Asl pasportsiz imtihonga kirishga ruxsat berilmaydi.",
            ru: "На экзамен вы должны принести оригинал паспорта. Электронные копии или ксерокопии не принимаются. Без оригинала паспорта вас не допустят к экзамену."
        }
    },
    {
        intent: 'arrival_time',
        keywords: {
            en: ['arrive', 'when to come', 'arrival', 'how early', 'late arrival', '30 minutes', 'before exam'],
            uz: ['qachon kelish', 'qancha oldin kelish', 'kechikish', '30 daqiqa', 'imtihon oldidan'],
            ru: ['когда прийти', 'приход', 'опоздать', 'за 30 минут', 'до экзамена', 'сколько раньше']
        },
        response: {
            en: "Registration usually starts 30 minutes before the exam time. It is strongly advised to arrive early. Late arrivals may not be admitted.",
            uz: "Ro'yxatdan o'tish odatda imtihon vaqtidan 30 daqiqa oldin boshlanadi. Erta kelish tavsiya etiladi. Kechikib kelganlar qabul qilinmasligi mumkin.",
            ru: "Регистрация обычно начинается за 30 минут до времени экзамена. Настоятельно рекомендуется приходить заранее. Опоздавшие могут не быть допущены."
        }
    },
    {
        intent: 'phone_items',
        keywords: {
            en: ['phone', 'mobile', 'personal items', 'bring phone', 'electronic devices', 'hand in'],
            uz: ['telefon', 'mobil', 'shaxsiy narsalar', 'elektron qurilmalar', 'topshirish'],
            ru: ['телефон', 'мобильный', 'личные вещи', 'электронные устройства', 'сдать телефон']
        },
        response: {
            en: "All phones must be switched off and handed in before the exam. Personal electronic devices are not allowed. Any suspicious behavior may result in immediate disqualification.",
            uz: "Barcha telefonlar imtihondan oldin o'chirilishi va topshirilishi kerak. Shaxsiy elektron qurilmalarga ruxsat berilmaydi. Har qanday shubhali xatti-harakat darhol malakasizlikka olib kelishi mumkin.",
            ru: "Все телефоны должны быть выключены и сданы перед экзаменом. Личные электронные устройства не разрешены. Любое подозрительное поведение может привести к немедленной дисквалификации."
        }
    },
    {
        intent: 'exam_structure',
        keywords: {
            en: ['exam structure', 'parts of exam', 'how many parts', 'exam format', 'what is in exam', 'sections'],
            uz: ['imtihon tuzilmasi', 'imtihon qismlar', 'nechta qism', 'imtihon formati', 'imtihonda nima bor', 'bo\'limlar'],
            ru: ['структура экзамена', 'части экзамена', 'сколько частей', 'формат экзамена', 'что входит в экзамен', 'разделы']
        },
        response: {
            en: "The MEPT has two parts. Part 1 is computer-based (1 hour): Listening — 25 questions (25 min) and GVR Grammar, Vocabulary, Reading — 55 questions (35 min). Part 2 is a computer-based Writing task: read a printed text and write a summary and analysis of at least 300 words within 1 hour.",
            uz: "MEPT ikki qismdan iborat. 1-qism kompyuter orqali (1 soat): Tinglash — 25 savol (25 daqiqa) va GVR Grammatika, Lug'at, O'qish — 55 savol (35 daqiqa). 2-qism kompyuter orqali yozma topshiriq: bosilgan matnni o'qib, 1 soat ichida kamida 300 so'zdan iborat xulosa va tahlil yozish.",
            ru: "MEPT состоит из двух частей. Часть 1 — компьютерная (1 час): Аудирование — 25 вопросов (25 мин) и GVR Грамматика, Словарный запас, Чтение — 55 вопросов (35 мин). Часть 2 — компьютерное письменное задание: прочитать печатный текст и написать резюме и анализ объёмом не менее 300 слов в течение 1 часа."
        }
    },
    {
        intent: 'part1',
        keywords: {
            en: ['part 1', 'first part', 'part one', 'computer based', 'listening grammar'],
            uz: ['1-qism', 'birinchi qism', 'kompyuter qism', 'tinglash grammatika'],
            ru: ['часть 1', 'первая часть', 'компьютерная часть', 'аудирование грамматика']
        },
        response: {
            en: "Part 1 is computer-based and lasts 1 hour. It includes two sections: Listening (25 questions, 25 minutes) and GVR — Grammar, Vocabulary, and Reading (55 questions, 35 minutes). Total: 80 points.",
            uz: "1-qism kompyuter orqali o'tkaziladi va 1 soat davom etadi. U ikki bo'limni o'z ichiga oladi: Tinglash (25 savol, 25 daqiqa) va GVR — Grammatika, Lug'at va O'qish (55 savol, 35 daqiqa). Jami: 80 ball.",
            ru: "Часть 1 проводится на компьютере и длится 1 час. Она включает два раздела: Аудирование (25 вопросов, 25 минут) и GVR — Грамматика, Словарный запас и Чтение (55 вопросов, 35 минут). Итого: 80 баллов."
        }
    },
    {
        intent: 'listening',
        keywords: {
            en: ['listening', 'audio', 'listen', 'go back listening', 'replay', 'hearing'],
            uz: ['tinglash', 'audio', 'eshitish', 'orqaga qaytish tinglash', 'qayta eshitish'],
            ru: ['аудирование', 'аудио', 'слушать', 'вернуться аудирование', 'переслушать']
        },
        response: {
            en: "The Listening section has 25 questions and lasts 25 minutes. Each audio is played only once — you cannot go back to previous questions, so listen carefully.",
            uz: "Tinglash bo'limida 25 savol bo'lib, 25 daqiqa davom etadi. Har bir audio faqat bir marta ijro etiladi — oldingi savollarga qayta o'tish mumkin emas, shuning uchun diqqat bilan tinglang.",
            ru: "Раздел Аудирования содержит 25 вопросов и длится 25 минут. Каждая аудиозапись воспроизводится только один раз — вернуться к предыдущим вопросам нельзя, поэтому слушайте внимательно."
        }
    },
    {
        intent: 'gvr',
        keywords: {
            en: ['gvr', 'grammar', 'vocabulary', 'reading', 'grammar vocabulary reading', 'part 1 reading'],
            uz: ['gvr', 'grammatika', 'lug\'at', 'o\'qish', 'grammatika lugat oqish'],
            ru: ['gvr', 'грамматика', 'словарный запас', 'чтение', 'грамматика словарный запас чтение']
        },
        response: {
            en: "The GVR section (Grammar, Vocabulary, and Reading) has 55 questions and lasts 35 minutes. It is part of Part 1 and is computer-based.",
            uz: "GVR bo'limi (Grammatika, Lug'at va O'qish) 55 savoldan iborat bo'lib, 35 daqiqa davom etadi. U 1-qismning bir bo'lagi bo'lib, kompyuter orqali o'tkaziladi.",
            ru: "Раздел GVR (Грамматика, Словарный запас и Чтение) содержит 55 вопросов и длится 35 минут. Это часть Части 1 и проводится на компьютере."
        }
    },
    {
        intent: 'writing',
        keywords: {
            en: ['writing', 'write', 'part 2', 'essay', 'summary', 'analysis', '300 words', 'second part'],
            uz: ['yozish', 'yozma', '2-qism', 'esse', 'xulosa', 'tahlil', '300 so\'z', 'ikkinchi qism'],
            ru: ['письмо', 'написать', 'часть 2', 'эссе', 'резюме', 'анализ', '300 слов', 'вторая часть']
        },
        response: {
            en: "Part 2 is a computer-based writing task. You will read a printed text and write a summary and analysis of at least 300 words within 1 hour. Writing is assessed separately based on level and quality.",
            uz: "2-qism kompyuter orqali yozma topshiriq. Siz bosilgan matnni o'qib, 1 soat ichida kamida 300 so'zdan iborat xulosa va tahlil yozasiz. Yozish darajasi va sifatiga ko'ra alohida baholanadi.",
            ru: "Часть 2 — компьютерное письменное задание. Вы прочитаете печатный текст и напишете резюме и анализ объёмом не менее 300 слов в течение 1 часа. Письмо оценивается отдельно по уровню и качеству."
        }
    },
    {
        intent: 'scoring',
        keywords: {
            en: ['scoring', 'how scored', 'total score', 'out of 80', 'points', 'grading', 'marks'],
            uz: ['ballash', 'qanday baholanadi', 'umumiy ball', '80 dan', 'baholar', 'ball tizimi'],
            ru: ['подсчёт баллов', 'как оценивается', 'общий балл', 'из 80', 'система оценки', 'баллы']
        },
        response: {
            en: "Part 1 (Listening + GVR) is scored out of 80 points. Writing (Part 2) is assessed separately based on level and quality (B1 or B2). Both scores are considered for admission.",
            uz: "1-qism (Tinglash + GVR) 80 ball ustidan baholanadi. Yozish (2-qism) darajasi (B1 yoki B2) va sifatiga ko'ra alohida baholanadi. Qabul uchun ikkala ball ham hisobga olinadi.",
            ru: "Часть 1 (Аудирование + GVR) оценивается из 80 баллов. Письмо (Часть 2) оценивается отдельно по уровню (B1 или B2) и качеству. Оба результата учитываются при поступлении."
        }
    },
    {
        intent: 'passing_score',
        keywords: {
            en: ['passing score', 'minimum score', 'pass mark', 'pass score', 'undergraduate score', 'graduate score', 'bachelor', 'master', 'b1', 'b2', '53', '58'],
            uz: ['o\'tish bali', 'minimal ball', 'o\'tish bali necha', 'bakalavr bali', 'magistratura bali', 'b1', 'b2', '53', '58'],
            ru: ['проходной балл', 'минимальный балл', 'балл для поступления', 'балл бакалавра', 'балл магистра', 'b1', 'b2', '53', '58']
        },
        response: {
            en: "Undergraduate applicants need a minimum score of 53/80 with B1 Writing level. Graduate (Master's) applicants need a minimum score of 58/80 with B2 Writing level.",
            uz: "Bakalavr abituriyentlari uchun minimal o'tish bali 80 dan 53 ball, Yozish darajasi B1. Magistratura abituriyentlari uchun minimal o'tish bali 80 dan 58 ball, Yozish darajasi B2.",
            ru: "Абитуриентам бакалавриата необходим минимальный балл 53 из 80 с уровнем письма B1. Абитуриентам магистратуры необходим минимальный балл 58 из 80 с уровнем письма B2."
        }
    },
    {
        intent: 'results',
        keywords: {
            en: ['result', 'score', 'check', 'grade', 'when results', 'results announcement', 'one week'],
            uz: ['natija', 'baho', 'tekshirish', 'javob', 'natija qachon', 'natijalar e\'lon', 'bir hafta'],
            ru: ['результат', 'балл', 'оценка', 'проверить', 'когда результаты', 'объявление результатов', 'неделя']
        },
        response: {
            en: "Results are announced by email within one week after the test date. You can also check them in your personal profile on the website.",
            uz: "Natijalar imtihon sanasidan keyin bir hafta ichida elektron pochta orqali e'lon qilinadi. Ularni veb-saytdagi shaxsiy profilingizda ham tekshirishingiz mumkin.",
            ru: "Результаты объявляются по электронной почте в течение одной недели после даты тестирования. Вы также можете проверить их в своём личном профиле на сайте."
        }
    },
    {
        intent: 'failed',
        keywords: {
            en: ['fail', 'failed', 'not pass', 'did not pass', 'retake', 'what if fail', 'fail mept'],
            uz: ['muvaffaqiyatsiz', 'o\'tmagan', 'qayta topshirish', 'topshira olmasam', 'rad etilish'],
            ru: ['не сдал', 'провалил', 'не прошёл', 'пересдача', 'что если не сдам', 'провал mept']
        },
        response: {
            en: "If you do not pass the MEPT, you may either retake the MEPT or submit results from another recognized English proficiency exam (IELTS, TOEFL, Duolingo, etc.) provided the scores meet admission requirements. Failing does not necessarily mean rejection.",
            uz: "MEPT dan o'ta olmasangiz, MEPT ni qayta topshirishingiz yoki qabul talablariga mos keladigan boshqa tan olingan ingliz tili imtihoni natijalarini (IELTS, TOEFL, Duolingo va boshqalar) taqdim etishingiz mumkin. Muvaffaqiyatsizlik rad etilishni anglatmaydi.",
            ru: "Если вы не прошли MEPT, вы можете либо пересдать MEPT, либо предоставить результаты другого признанного экзамена по английскому языку (IELTS, TOEFL, Duolingo и т.д.) при условии, что баллы соответствуют требованиям для поступления. Провал не обязательно означает отказ."
        }
    },
    {
        intent: 'esl_programs',
        keywords: {
            en: ['esl', 'english program', 'bridge esl', 'full esl', 'placement program', 'rejection', 'rejected'],
            uz: ['esl', 'ingliz tili dasturi', 'bridge esl', 'full esl', 'rad etish', 'rad etilgan'],
            ru: ['esl', 'программа английского', 'bridge esl', 'full esl', 'отказ', 'отказано']
        },
        response: {
            en: "Failing the MEPT does not necessarily mean rejection. Undergraduate applicants may be placed into Full ESL or Bridge ESL programs based on their results, allowing them to improve their English before full enrollment.",
            uz: "MEPT dan muvaffaqiyatsiz o'tish rad etilishni anglatmaydi. Bakalavr abituriyentlari natijalari asosida to'liq ESL yoki Bridge ESL dasturlariga joylashtirilishi mumkin, bu esa ularga to'liq o'qishga kirishdan oldin ingliz tilini yaxshilash imkonini beradi.",
            ru: "Провал MEPT не обязательно означает отказ. Абитуриенты бакалавриата могут быть зачислены в программы Full ESL или Bridge ESL по результатам, что позволит им улучшить свой английский перед полным зачислением."
        }
    },
    {
        intent: 'technical_problems',
        keywords: {
            en: ['technical problem', 'computer problem', 'issue during exam', 'technical issue', 'computer crash', 'help during exam'],
            uz: ['texnik muammo', 'kompyuter muammo', 'imtihon paytida muammo', 'texnik nosozlik'],
            ru: ['технические проблемы', 'проблема с компьютером', 'проблема во время экзамена', 'технический сбой']
        },
        response: {
            en: "If you face technical problems during the exam, raise your hand immediately. Do not attempt to fix the issue yourself — an exam supervisor will assist you.",
            uz: "Imtihon davomida texnik muammolarga duch kelsangiz, darhol qo'lingizni ko'taring. Muammoni o'zingiz hal qilishga urinmang — imtihon nazoratchi sizga yordam beradi.",
            ru: "Если во время экзамена у вас возникнут технические проблемы, немедленно поднимите руку. Не пытайтесь устранить проблему самостоятельно — вам поможет экзаменационный надзиратель."
        }
    },
    {
        intent: 'disqualification',
        keywords: {
            en: ['disqualification', 'cheating', 'cheat', 'unauthorized', 'suspicious', 'kicked out', 'banned', 'misconduct'],
            uz: ['malakasizlik', 'aldash', 'ruxsatsiz materiallar', 'shubhali xatti-harakat', 'chiqarib yuborish'],
            ru: ['дисквалификация', 'мошенничество', 'нарушение', 'несанкционированные материалы', 'подозрительное поведение', 'удаление с экзамена']
        },
        response: {
            en: "Cheating, using unauthorized materials, using a phone, or any suspicious behavior will result in immediate disqualification without warning.",
            uz: "Aldash, ruxsatsiz materiallardan foydalanish, telefon ishlatish yoki har qanday shubhali xatti-harakat ogohlantirishsiz darhol malakasizlikka olib keladi.",
            ru: "Мошенничество, использование несанкционированных материалов, использование телефона или любое подозрительное поведение приведёт к немедленной дисквалификации без предупреждения."
        }
    },
    {
        intent: 'dates',
        keywords: {
            en: ['when', 'date', 'schedule', 'time', 'calendar', 'next exam', 'upcoming'],
            uz: ['qachon', 'sana', 'vaqt', 'kalendar', 'kun', 'keyingi imtihon', 'jadval'],
            ru: ['когда', 'дата', 'время', 'расписание', 'календарь', 'следующий экзамен', 'ближайший']
        },
        response: {
            en: "Exam dates are listed in the 'Upcoming Test Dates' section on our homepage. Only 40 spots are available per date, so register early. Click 'View All Test Dates' for the full schedule.",
            uz: "Imtihon sanalari bosh sahifamizdagi 'Upcoming Test Dates' bo'limida ko'rsatilgan. Har bir sana uchun faqat 40 joy mavjud, shuning uchun erta ro'yxatdan o'ting. To'liq jadval uchun 'View All Test Dates' tugmasini bosing.",
            ru: "Даты экзаменов перечислены в разделе 'Upcoming Test Dates' на нашей главной странице. На каждую дату доступно только 40 мест, поэтому регистрируйтесь заранее. Нажмите 'View All Test Dates' для просмотра полного расписания."
        }
    },
    {
        intent: 'location',
        keywords: {
            en: ['where', 'location', 'address', 'place', 'map', 'test center'],
            uz: ['qayerda', 'manzil', 'joy', 'xarita', 'lokatsiya', 'test markazi'],
            ru: ['где', 'адрес', 'место', 'карта', 'локация', 'тест центр']
        },
        response: {
            en: "The MEPT is held at Webster University in Tashkent. Address: 13 Navoi Avenue, Tashkent, Uzbekistan.",
            uz: "MEPT Toshkent shahridagi Webster universitetida o'tkaziladi. Manzil: Navoiy shoh ko'chasi, 13-uy, Toshkent, O'zbekiston.",
            ru: "MEPT проводится в Университете Вебстер в Ташкенте. Адрес: проспект Навои, 13, Ташкент, Узбекистан."
        }
    },
    {
        intent: 'contact',
        keywords: {
            en: ['contact', 'email', 'phone', 'support', 'help', 'reach', 'admissions'],
            uz: ['aloqa', 'email', 'telefon', 'yordam', 'boglanish', "bog'lanish", 'qabul bo\'limi'],
            ru: ['контакт', 'почта', 'телефон', 'поддержка', 'помощь', 'связаться', 'приёмная комиссия']
        },
        response: {
            en: "For questions about the MEPT, please contact the admissions or testing office via the official email provided on the MEPT website. You can also reach out via email at skuzimurod@webster.edu.",
            uz: "MEPT bo'yicha savollar uchun MEPT veb-saytida ko'rsatilgan rasmiy elektron pochta orqali qabul yoki test bo'limi bilan bog'laning. Shuningdek, skuzimurod@webster.edu elektron pochtasi orqali murojaat qilishingiz mumkin.",
            ru: "По вопросам о MEPT свяжитесь с приёмной комиссией или отделом тестирования по официальной электронной почте, указанной на сайте MEPT. Также можно написать на skuzimurod@webster.edu."
        }
    }
];

export const detectLanguage = (text) => {
    const lowerText = text.toLowerCase();

    const uzPatterns = [
        'salom', 'qachon', 'qanday', 'nima', 'kim', 'qayerda', 'narx', 'bormi', 'kerak', 'mumkin', 'rahmat', 'aka', 'opa',
        'kere', 'qancha', 'bomi', 'qatta', 'qanaqa', 'menga', 'mnaga', 'man', 'san', 'siz', 'biz', 'ular', 'shu', 'bu',
        'imtihon', 'yaqin', 'kun', 'oy', 'yil', 'test', 'olish', 'topshirish', 'mept', 'ball', 'natija', 'to\'lov',
        'ro\'yxat', 'pasport', 'tinglash', 'yozish', 'grammatika', 'taklif'
    ];
    const ruPatterns = [
        'привет', 'как', 'что', 'где', 'когда', 'сколько', 'почему', 'можно', 'спасибо', 'здравствуйте',
        'цена', 'стоимость', 'есть', 'ли', 'это', 'то', 'я', 'мы', 'они', 'вы',
        'экзамен', 'тест', 'сдать', 'пройти', 'ближайший', 'балл', 'результат', 'оплата', 'паспорт',
        'аудирование', 'письмо', 'грамматика', 'регистрация'
    ];

    let uzCount = 0;
    let ruCount = 0;

    uzPatterns.forEach(p => { if (lowerText.includes(p)) uzCount++; });
    ruPatterns.forEach(p => { if (lowerText.includes(p)) ruCount++; });

    knowledgeBase.forEach(item => {
        if (item.keywords.uz && item.keywords.uz.some(kw => lowerText.includes(kw))) uzCount += 2;
        if (item.keywords.ru && item.keywords.ru.some(kw => lowerText.includes(kw))) ruCount += 2;
    });

    if (uzCount > ruCount) return 'uz';
    if (ruCount > uzCount) return 'ru';

    if (/[а-яА-ЯёЁ]/.test(text)) return 'ru';

    return 'en';
};

export const getResponse = (text) => {
    const lang = detectLanguage(text);
    const lowerText = text.toLowerCase();

    for (const item of knowledgeBase) {
        const allKeywords = [
            ...(item.keywords.uz || []),
            ...(item.keywords.ru || []),
            ...(item.keywords.en || [])
        ];

        if (allKeywords.some(keyword => lowerText.includes(keyword))) {
            return item.response[lang];
        }
    }

    const fallbacks = {
        en: "I'm sorry, I didn't quite understand that. You can ask me about the MEPT exam, registration, payment, exam structure, scoring, results, or contact information.",
        uz: "Uzr, tushunmadim. Mendan MEPT imtihoni, ro'yxatdan o'tish, to'lov, imtihon tuzilmasi, ballash, natijalar yoki aloqa ma'lumotlari haqida so'rasangiz bo'ladimi?",
        ru: "Извините, я не совсем понял. Вы можете спросить меня об экзамене MEPT, регистрации, оплате, структуре экзамена, оценках, результатах или контактной информации."
    };

    return fallbacks[lang];
};
