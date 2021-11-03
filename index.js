require('dotenv').config()
const { VK } = require('vk-io')
const { HearManager } = require('@vk-io/hear')
const sequelize = require('./db')
const { User, Manga } = require('./db/models')

const TOKEN = ''

const ADMINS = [11386271, 26498791]

const vk = new VK({
    token: process.env.TOKEN || TOKEN,
})

const hearManager = new HearManager()

vk.updates.on('message_new', async (context, next) => {
    let [user, created] = await User.findOrCreate({
        where: { vkid: context.senderId },
    })

    return next()
})

vk.updates.on('message_new', hearManager.middleware)

hearManager.hear(/^[/]?(команды|старт)/i, async (context) => {
    let content = `
    Команды чат-бота BoxRecap:

    "список" - список доступных для подписки тайтлов
    "подписки" - список тайтлов на которые вы подписаны

    "подписаться манга" - подписаться на мангу с кратким названием "манга", краткое название находится в скобках перед полным названием при просмотре списка тайтлов
    "отписаться манга" - отписаться от указанной манги

    "подписаться все" - подписаться на все новые релизы
    "отписаться все" - отписаться от всех обновлений
    `

    await context.send(content)

    let adminContent = `
    😎 Админ-команды: 😎

    "add 'сокращение' 'полное название'" - добавляет в бота новый тайтл для отслеживания.

    Параметры:
    'сокращение' - хештег/сокращение, слитно, запрещено использовать пробелы.
    'полное название' - полное название манги
    Пример: add гпг Главный приз гарем

    "rem сокращение" - удаляет тайтл из бота.
    `
    
    if (ADMINS.includes(context.senderId)) {
        await context.send(adminContent)
    }
})

hearManager.hear(/[/]?add\s(\S+)\s(.+)/i, async (context) => {
    if (!ADMINS.includes(context.senderId)) return

    try {
        let hashtag = context.$match[1]
        let title = context.$match[2]
        let newmanga = await Manga.create({ title, hashtag })
        await context.send(`
        Успешно!

        Новый тайтл добавлен в бота:
        - (${newmanga.hashtag}) ${title}
        `)
        console.log(
            `[admin add] new title succesfully added: \n`,
            `- (${newmanga.hashtag}) ${title}`
        )
    } catch (error) {
        await context.send(`
        Ошибка при добавлении нового тайтла в базу:

        ${error}
        `)
        console.error(`[admin add] error adding new title:`, error)
    }
})

hearManager.hear(/[/]?rem\s(\S+)/i, async (context) => {
    if (!ADMINS.includes(context.senderId)) return

    

    try {
        let hashtag = context.$match[1]
        let toRemove = await Manga.findOne({ where: { hashtag } })
        let title = toRemove.title
        await toRemove.destroy()
        await context.send(`
        Успешно!

        Тайтл "${title}" удален
        `)
        console.log(
            `[admin rem] title succesfully removed: \n`,
            `- (${hashtag}) ${title}`
        )
    } catch (error) {
        await context.send(`
        Ошибка при удалении тайтла из базы:

        ${error}
        `)
        console.error(`[admin add] error removing title:`, error)
    }
})

hearManager.hear(/[/]?stats/i, async (context) => {
    if (!ADMINS.includes(context.senderId)) return

    try {
        let users = await User.count()
        let usersDisabledMessages = await User.count({where: {disabledMessages: true}})
        
        await context.send(`
        Статистика:

        - Всего пользователей в базе: ${users}
        - Запретили сообщения от бота: ${usersDisabledMessages}
        `)
    } catch (error) {
        console.error(`[admin add] error removing title:`, error)
    }
})

hearManager.hear(/^[/]?список/i, async (context) => {
    let mangas = await Manga.findAll()
    let content = `Список доступных для подписки тайтлов: \n\n`

    if (mangas) {
        mangas.forEach((manga, i) => {
            content += `${i + 1}. (${manga.hashtag}) ${manga.title} \n`
        })
    } else {
        content = `[Ошибка] Похоже манги еще не добавили в бота`
    }

    await context.send(content)
})

hearManager.hear(/^[/]?подписки/i, async (context) => {
    let [user, created] = await User.findOrCreate({
        where: { vkid: context.senderId },
    })

    let subscriptions = await user.getMangas()

    if (subscriptions.length) {
        let content = `Вы подписаны на следующие тайтлы: \n\n`

        subscriptions.forEach((manga) => {
            content += `- (${manga.hashtag}) ${manga.title}\n`
        })

        content += `
        Чтобы отписаться от определенной манги, напишите "отписаться манга".
        Чтобы отписаться от всех тайтлов, напишите "отписаться все".
        `

        await context.send(content)
    } else {
        await context.send(`
        Кажется вы еще не подписались ни на одну из наших манг!

        Напишите "список", чтобы взглянуть на список доступных манг. В списке манг в скобках указано краткое название манги.

        Используйте "подписаться манга", чтобы подписаться на мангу с кратким названием "манга".
        `)
    }
})

hearManager.hear(/^[/]?подписаться\s?(.+)?/i, async (context) => {
    let param = context.$match[1]
    if (!param) {
        await Promise.all([
            context.send(`
            Упс! Вы не указали мангу на которую хотите подписаться!

            Чтобы просмотреть список всех манг, введите "список"
            `),
        ])
    } else {
        let manga

        //проверяем юзер хочет всю мангу или определенную
        if (param == 'все') {
            manga = await Manga.findAll()
        } else {
            manga = await Manga.findOne({
                where: { hashtag: param.toLowerCase() },
            })
        }

        //если манги нашлись
        if (manga) {
            let [user, created] = await User.findOrCreate({
                where: { vkid: context.senderId },
            })

            if (!manga.length) {
                await user.addManga(manga)
                await context.send(
                    `Отлично! Вы успешно подписались на мангу: \n\n${manga.title}!`
                )
            } else {
                await user.addMangas(manga)
                await context.send(
                    `Отлично! Вы успешно подписались на все наши релизы!`
                )
            }
        } else {
            await context.send(
                `Не удалось найти мангу с названием "${param.toLowerCase()}"!`
            )
        }
    }
})

hearManager.hear(/^[/]?отписаться\s?(.+)?/i, async (context) => {
    let param = context.$match[1]
    if (!param) {
        await Promise.all([
            context.send(`
            Упс! Вы не указали мангу от которой хотите отписаться!

            Чтобы просмотреть список ваших подписок, введите "подписки"!
            Чтобы отписаться от всех тайтлов, используйте "отписаться все".
            `),
        ])
    } else {
        let manga

        //проверяем юзер хочет удалить всю мангу или определенную
        if (param == 'все') {
            manga = await Manga.findAll()
        } else {
            manga = await Manga.findOne({
                where: { hashtag: param.toLowerCase() },
            })
        }

        //если манги нашлись
        if (manga) {
            let [user, created] = await User.findOrCreate({
                where: { vkid: context.senderId },
            })

            if (!manga.length) {
                await user.removeManga(manga)
                await context.send(
                    `Отлично! Вы успешно отписались от: \n${manga.title}!`
                )
            } else {
                await user.removeMangas(manga)
                await context.send(
                    `Отлично! Вы успешно отписались от всех обновлений!`
                )
            }
        } else {
            await context.send(
                `Не удалось найти мангу с названием "${param.toLowerCase()}"!`
            )
        }
    }
})

vk.updates.on('message_deny', async (context) => {
    let [user, created] = await User.findOrCreate({
        where: { vkid: context.userId },
    })

    user.disabledMessages = true
    await user.save()

    console.log(`User ${context.userId} disabled messages from bot :(`)
})

vk.updates.on('message_allow', async (context) => {
    let [user, created] = await User.findOrCreate({
        where: { vkid: context.userId },
    })

    user.disabledMessages = false
    await user.save()

    console.log(`User ${context.userId} enabled messages from bot again :)`)
})

vk.updates.on('wall_post_new', handleNewPost)

async function handleNewPost(context) {
    console.log(`Handling new post`)

    //getting all mangas
    let mangas = await Manga.findAll()

    //creating all hashtags array
    let allHashtags = []
    mangas.forEach((manga) => allHashtags.push(manga.hashtag))

    //building regex out of every manga hashtag we have
    let regex = new RegExp(
        '[#](' + allHashtags.join('|') + ')[@]box.recap',
        'i'
    )

    //getting post from context
    let post = context.wall

    //checking posts body for our hashtags presence
    let match = post.text.match(regex)

    //if no hashtag found we exit
    if (!match) return

    //if something found we gettin needed manga from db
    let manga = await Manga.findOne({
        where: { hashtag: match[1] },
        include: [
            {
                model: User,
                where: {
                    disabledMessages: false,
                },
            },
        ],
    })

    //getting users whom subscribed to manga
    //quitting if no subscribers for this manga
    //manga will be null if there is no users subscribed to it
    if (manga == null) return
    let users = manga.Users
    let userIds = []

    //generating userid list
    users.forEach((user) => {
        userIds.push(user.vkid)
    })

    //generating announce message
    let message = `
        Привет!

        Вышла новая глава манги 
        "${manga.title}"!

        Читай уже сейчас: https://vk.com/wall${post.ownerId}_${post.id}
    `

    //sending message to all users
    try {
        vk.api.messages.send({
            message,
            peer_ids: userIds,
            random_id: Math.round(Math.random() * 99999999999),
            attachment: `wall${post.ownerId}_${post.id}`,
        })

        console.log(`Sending announce message to users:`, userIds)
    } catch (error) {
        console.error(error)
    }
}

//starting
(async () => {
    console.log('[BoxRecap Announcer] Connecting to DB...')
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('[BoxRecap Announcer] Connection has been established successfully!')
    console.log(`[BoxRecap Announcer] Starting VK updates listener...`)
    await vk.updates.start()
    console.log(`[BoxRecap Announcer] Listening to VK updates!`)
})()
