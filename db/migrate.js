require('dotenv').config()
const sequelize = require('./connect')
const {User, Manga} = require ('./models')

async function migrate(){
    try {
        console.log('connecting to db')
        await sequelize.authenticate()
        console.log('syncing')
        await sequelize.sync({force: true})
        console.log('populating db')
        await Promise.all([
            Manga.create({
                title: "Подъём уровня с помощью еды",
                hashtag: "еда"
            }),
            Manga.create({
                title: "Банщик: Я И Она В Женской Бане?!",
                hashtag: "банщик"
            }),
            Manga.create({
                title: "Хотите Стать Вором?",
                hashtag: "вор"
            }),
            Manga.create({
                title: "Боевой Петух",
                hashtag: "петушок"
            }),
            Manga.create({
                title: "Дочь Короля Демонов Слишком Простодушна",
                hashtag: "демонесса"
            }),
            Manga.create({
                title: "Главный Приз Лотереи: Несравненный Гарем",
                hashtag: "гпг"
            }),
            Manga.create({
                title: "Единственная Из Десяти",
                hashtag: "1/10"
            }),
            Manga.create({
                title: "Мой Дом - Это Место Волшебной Силы",
                hashtag: "дом"
            }),
            Manga.create({
                title: "Моя Девушка - Учитель",
                hashtag: "учитель"
            }),
            Manga.create({
                title: "Снимаем Видео Для Взрослых В Другом Мире",
                hashtag: "видео"
            }),
            Manga.create({
                title: "Никому Не Верю",
                hashtag: "никому"
            }),
            Manga.create({
                title: "Заброшенный Геройский Дар",
                hashtag: "дар"
            }),
            Manga.create({
                title: "Что Скрывается Под Бумажным Пакетом Камиямы",
                hashtag: "пакет"
            }),
            Manga.create({
                title: "Договор С Левиафаном",
                hashtag: "левиафан"
            }),
            Manga.create({
                title: "Тот Случай, Когда Люди Оказались Сильнейшей Расой",
                hashtag: "люди"
            }),
            Manga.create({
                title: "Бывший Герой, Проживающий В Подземелье",
                hashtag: "подземка"
            }),
            Manga.create({
                title: "Бесклассовый Герой: Да Мне Все Равно Не Нужны Эти Ваши Умения",
                hashtag: "герой"
            })
        ])
        console.log('done')
    } catch (error) {
        console.log(error)
    }
    
    
}

migrate()