const TelegramApi = require('node-telegram-bot-api'); // Импорт в проект nodemon для автоматической перезагрузки сервера.
const { messageTypes } = require('node-telegram-bot-api/src/telegram'); // Импорт в проект файла для работы с разными типами сообщений: текстом, аудио, документами и т.п.
const sequelize = require('./db'); // импорт объекта Sequelize
const { QueryTypes } = require('@sequelize/core');
const { Op } = require('@sequelize/core');

/* 
const path = require('path');
const basename = path.basename(__filename);

var request = require('request');
var http = require("http");
var fs = require('fs');
 */



const UsersModel = require('./models/users'); // импорт модели пользователей
const ProposalModel = require('./models/proposal'); // импорт модели с таблицей для предложений
const DocThemesModel = require('./models/doc_themes'); // импорт модели тем документации
const RolesModel = require('./models/roles'); // импорт модели с ролями


const token = '5230486458:AAEuqT2ONIpA6blhjqN8BiNA4HXwjr80qFw'; // Токен созданного бота.

/* новый TelegramBot(токен, [параметры]) - метод запроса для получения сообщений: 
- Чтобы использовать стандартный опрос, нужно установить для параметров polling:true. 
- Стоит обратить внимание, что webHook потребуется сертификат SSL. 
- Выдает сообщение, когда приходит сообщение. */
const bot = new TelegramApi(token, { polling: true });

// Добавление слушателя событий на обработку полученных сообщений.
// Вторым параметрам данная функция принимает callback.
bot.on('message', async msg => {
  console.log(msg)

  const text = msg.text;
  const commandLog = text;
  const chatId = msg.chat.id;
  const userName = `${msg.from.username}`;
  const fullName = `${msg.from.first_name} ${msg.from.last_name}`;

  /* Создание команд при обращении к приложению. Представляет из себя функцию, принимающую
массив объектов, которые содержат поля команды и её описания.*/
  const COMMANDS = [
    {
      command: 'start',
      description: 'Начало использования. Старт.'
    },
    {
      command: 'help',
      description: 'Помощь по командам',
    },
    {
      command: 'info',
      description: 'Просмотр тем',
    }
    /*       ,
          {
            command: 'add',
            description: 'Предложить тему',
          }
    */
  ]

  // Установка для бота на использование данных команд
  bot.setMyCommands(COMMANDS);
  // Написание логики для каждой команды. Ключевое слово await необходимо для организации асинхронности функций.
  try {

    await sequelize.authenticate(); // открытие и одновременная проверка на успешность соединения к БД.
    await sequelize.sync(); // данная функция нужна для синхронизации моделей, указанных в коде, с таблицами в БД.

    // Добавление обработки сообщения запроса на вывод всех доступных команд
    let helpText = `*Дока* к Вашим услугам (･ิᴗ･ิ๑)\n \n*Доступные команды:*\n`;
    helpText += COMMANDS.map(
      (command) => `*\n/${command.command}* — ${command.description}`
    ).join(`\n`);
    /* 
        if (text === '/start' || text === 'старт') {
          try {
            await UsersModel.create({ chatId, userName, fullName, commandLog }); // При первом подключении к приложению информация о пользователе сразу сохранится в базу данных.
            await bot.sendMessage(chatId, `Добро пожаловать, *${fullName}*`, { parse_mode: "Markdown" });
            return bot.sendMessage(chatId, helpText, {
              parse_mode: "Markdown", // нужно указать для включения поддержки синтаксиса .md - для редактирования текста.
            });
          }
          catch (e) {
            return bot.sendMessage(chatId, 'Вы уже были зарегистрированы в системе, либо у Вас проблемы с интернет-соединением, и поэтому связь с Базой данных отсутствует.');
          }
        }
         */

    if (text === '/start' || text === 'Старт' || text === 'старт' || text === 'привет' || text === 'Дока' || text === 'дока') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // При первом подключении к приложению информация о пользователе сразу сохранится в базу данных.
        const lastUser = await UsersModel.findOne({
          where: { commandLog: '/start' },
          order: [['createdAt', 'DESC']]
        })
        const chatIdStart = lastUser.chatId;
        return bot.sendMessage(chatIdStart, `Добро пожаловать, *${lastUser.fullName}* \n ${helpText}`, { parse_mode: "Markdown" });
      }
      catch (e) {
        return bot.sendMessage(chatId, 'Вы уже были зарегистрированы в системе, либо у Вас проблемы с интернет-соединением, и поэтому связь с Базой данных отсутствует.');
      }
    }


    if (text === '/help' || text === 'команды') {
      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
      await bot.sendMessage(chatId, `*${fullName},*`, { parse_mode: "Markdown" });

      return bot.sendMessage(chatId, `${helpText}\n \nДля добавления темы используйте ключевое слово *Тема*.`, {
        parse_mode: "Markdown", // нужно указать для включения поддержки синтаксиса .md - для редактирования текста.
      });
    }

    if (text === '/info' || text === 'Информация о темах') {
      //    await bot.sendMessage(chatId, 'Внесите файл');
      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
      bot.sendMessage(chatId, `\n*/topicsList* — Темы на просмотр из подсистемы "N"\n    */topicsLast_25* — Последние 25 тем из подсистемы "N".\n  \n*/proposedThemesList* — Предложенные темы.\n    */proposedThemesLast_10* — Последние 10 предложенных тем.\n`, { parse_mode: "Markdown" });
      //  await UsersModel.create({  }); // При первом подключении к приложению информация о пользователе сразу сохранится в базу данных.
    }

    if (text === '/proposedThemesList' || text === 'Все предложенные темы') {
      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.

      bot.sendMessage(chatId, `*Были предложены следующие темы:*`, { parse_mode: "Markdown" });
/*      
      for (let i = 1; i <= 9999999; i++) {
        const theme = await ProposalModel.findByPk(`${i}`)
        bot.sendMessage(chatId, `*${theme.id}) ${theme.fullName} (@${theme.userName}) предложил(а):\n* \n${theme.proposedTheme}`, { parse_mode: "Markdown" });
      }
 */
      const proposedThemes = await ProposalModel.findAll({
        attributes: ['id', 'proposedTheme', 'fullName', 'userName', 'createdAt']
      });

      const str = JSON.stringify(proposedThemes, null, 2); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
      const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
      const strModificationIteration2 = strModificationIteration1.replace(new RegExp("id", "g"), 'Id темы');
      const strModificationIteration3 = strModificationIteration2.replace(new RegExp("proposedTheme", "g"), 'Название');
      const strModificationIteration4 = strModificationIteration3.replace(new RegExp("fullName", "g"), 'Добавлено пользователем');
      const strModificationIteration5 = strModificationIteration4.replace(new RegExp("userName: ", "g"), 'Контакт которого: @');
      const strModificationIteration6 = strModificationIteration5.replace(new RegExp("createdAt", "g"), 'Дата добавления');

      bot.sendMessage(chatId, strModificationIteration6);

    }

    // /proposedThemesLast_10
    if (text === '/proposedThemesLast_10' || text === '10 последних предложенных тем') {
      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.

      bot.sendMessage(chatId, `*Были предложены следующие темы:*`, { parse_mode: "Markdown" });

      const proposedThemes = await ProposalModel.findAll({
        limit: 10, // Если значение установленного лимита будет больше кол-ва записей, то просто выведутся все имеющиеся записи. (Т.е. это эквивалентно выведению всех записей)
        order: [
          ['createdAt', 'DESC'], // последние записи
        ],
        attributes: ['id', 'proposedTheme', 'fullName', 'userName', 'createdAt']
      });

      const str = JSON.stringify(proposedThemes, null, 2); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
      const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
      const strModificationIteration2 = strModificationIteration1.replace(new RegExp("id", "g"), 'Id темы');
      const strModificationIteration3 = strModificationIteration2.replace(new RegExp("proposedTheme", "g"), 'Название');
      const strModificationIteration4 = strModificationIteration3.replace(new RegExp("fullName", "g"), 'Добавлено пользователем');
      const strModificationIteration5 = strModificationIteration4.replace(new RegExp("userName: ", "g"), 'Контакт которого: @');
      const strModificationIteration6 = strModificationIteration5.replace(new RegExp("createdAt", "g"), 'Дата добавления');

      bot.sendMessage(chatId, strModificationIteration6);

    }












    if (text === '/AlloUsersToProposeThemes_byAdmin') {
      const roles = await RolesModel.findOne({ chatId });
      const adminChatId = roles.chatId;
      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.

      bot.sendMessage(adminChatId, 'Добавление тем активировано.');
      bot.on('message', async proposedTheme => {
        const theme = proposedTheme.text;
        const chatId = proposedTheme.chat.id;
        const userName = `${proposedTheme.from.username}`;
        const fullName = `${proposedTheme.from.first_name} ${proposedTheme.from.last_name}`;
        if (typeof theme === 'string') { // Если сообщение пользователя состоит из строки, то выполнить
          // При внесении пользователем темы:
          if (theme.includes('тема')) {
            // Метод includes() проверяет, содержит ли строка заданную подстроку, и возвращает, соответственно true или false. Является регистрозависимым.
            const commandLog = theme;
            await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.

            const lastThemeCommand = theme.includes('тема');
            ProposalModel.create({ proposedTheme: `${theme}`, chatId: `${chatId}`, userName: `${userName}`, fullName: `${fullName}` });
            const lastTheme = await UsersModel.findOne({ // Найти последнего пользователя, ввёдшего команду, которая не равна перечисленным: '/add', '/help', '/start', '/info'
              where: {
                commandLog,
                [Op.not]: [
                  { commandLog: ['/add', '/help', '/start', '/info'] },
                ]
              },
              order: [['createdAt', 'DESC']]
            })
            return bot.sendMessage(chatId, `Тема отправлена на предложение.\n \nСмотреть последние 10 предложенных тем: /proposedThemesLast_10`); // Оповещение пользователя о добавлении темы (появлении в списке предложенных)
          }
        }
        else {
          bot.sendMessage(chatId, 'В чат можно отправлять только текстовые сообщения!');
        }
      })
    }







    if (text === '/topicsList' || text === 'см темы') {

      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.

      bot.sendMessage(chatId, `*На данный момент доступны следующие темы для просмотра:*`, { parse_mode: "Markdown" });

      try {
        for (let i = 1; i <= 99999999; i++) {
          const theme = await DocThemesModel.findByPk(`${i}`)
          if (theme.themeName === null || theme.themeName === undefined) {
            bot.sendMessage(chatId, `Тема не дополнена: название отсутствует. Обратитесь к руководству проекта.`);
          }
          else if (theme.description === null || theme.description === undefined) {
            bot.sendMessage(chatId, `\` \` \`${theme.id}\`\`\` *)  ${theme.themeName}* (нет описания)`, { parse_mode: "Markdown" });
          } else {
            bot.sendMessage(chatId, `\` \` \`${theme.id}\`\`\` *)  ${theme.themeName}* — ${theme.description}`, { parse_mode: "Markdown" });
          }
        }
      }
      catch (e) {
        //  return bot.sendMessage(chatId, 'В таблице больше нет записей');
      }
    }

    // /topicsLast_25




    if (!isNaN(parseFloat(msg.text)) && isFinite(msg.text)) { // Если введённое сообщение является числом (причём конечным), то
      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
      // Попробовать найти в бд, в таблице doc_types запись с ключом, номер которого был введён пользователем
      try {
        const data = await DocThemesModel.findByPk(id = msg.text)

        if (data.themeName === null || data.themeName === undefined) {
          bot.sendMessage(chatId, `Тема не дополнена: название отсутствует. Обратитесь к руководству проекта.`);
        } else if (data.description === null || data.description === undefined) {
          bot.sendMessage(chatId, `${data.themeName} — У темы нет описания`);
        }
        else {
          bot.sendMessage(chatId, `\n*${data.themeName}* — ${data.description}`, { parse_mode: "Markdown" });
        }
        if (data.documentation === null || data.documentation === undefined) {
          bot.sendMessage(chatId, `\nДокументация отсутствует`);
        } else {
          bot.sendMessage(chatId, `\n*Документация: ${data.documentation}*`, { parse_mode: "Markdown" });
        }
        if (data.image === null || data.image === undefined) {
          bot.sendMessage(chatId, `\Представление отсутствует`);
        } else {
          bot.sendMessage(chatId, `\*Представление: ${data.image}*, { parse_mode: "Markdown" }`);
        }
        if (data.ethalonFile === null || data.ethalonFile === undefined) {
          bot.sendMessage(chatId, `\Эталонный файл отсутствует`);
        } else {
          bot.sendMessage(chatId, `\*Эталонный файл: ${data.ethalonFile}*, { parse_mode: "Markdown" }`);
        }

      }
      catch (e) {
        return bot.sendMessage(chatId, 'Такой темы ещё нет, или она была удалена');
      }
    }



    //////////////////////////////////////////////////////////////// ВРЕМЕННО ////////////////////////////////////////////////////////////////

    if (text === '[' || text === ']' || text === 'х' || text === 'ъ') {
      bot.sendMessage(chatId, 'Таблицы удалены',
        sequelize
          .sync() // create the database table for our model(s)
          .then(function () {
            return sequelize.drop(); // drop all tables in the db
          })
      )
    }

    //////////////////////////////////////////////////////////////// ВРЕМЕННО ////////////////////////////////////////////////////////////////

  } catch (e) {
    // Если введена незнакомая приложению команда (не из массива обозначенных комманд)
    // return bot.sendMessage(chatId, 'Команда некорректна, введите команду заново. ');
  }

})


// Данные команды также явно доступны только администратору.
bot.on('message', async msg => {
  console.log(msg)

  const text = msg.text;
  const commandLog = text;
  const chatId = msg.chat.id;
  const userName = `${msg.from.username}`;
  const fullName = `${msg.from.first_name} ${msg.from.last_name}`;

  try {
    await sequelize.authenticate();
    await sequelize.sync();


    /* 
        // Данная команда вводится администратором после перезапуска приложения, тем самым, открывая поток сообщений для добавления тем по ключевому слову.
        if (text === '/add' || text === 'предложить') {
          const roles = await RolesModel.findOne({ chatId });
          const adminChatId = roles.chatId;
    
          bot.sendMessage(adminChatId, 'Добавление тем активировано');
          bot.on('message', async proposedTheme => {
            const theme = proposedTheme.text;
            if (typeof theme === 'string') { // Если сообщение пользователя состоит из строки, то выполнить
              // При внесении пользователем темы:
              if (theme.includes('Тема')) { // Метод includes() проверяет, содержит ли строка заданную подстроку, и возвращает, соответственно true или false. Является регистрозависимым.
                await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
    
                const userProposal = await UsersModel.findOne({ chatId });
                const proposedTheme = ProposalModel.build({ proposedTheme: `${theme}`, chatId: `${chatId}`, userName: `${userName}`, fullName: `${fullName}` });
                bot.sendMessage(chatId, `Новая тема предложена пользователем:\n    ${fullName} (@${userName})\n \nСмотреть последние 10 предложенных тем:\n    /proposedThemesLast_10`); // Оповещение пользователя о добавлении темы (появлении в списке предложенных)
                return proposedTheme.save();
              }
            }
            else {
              bot.sendMessage(chatId, 'В чат можно отправлять только текстовые сообщения!');
            }
          })
        }
     */






    if (text === '/админ' || text === 'админ' || text === '/admin' || text === 'admin') {
      const roles = await RolesModel.findOne({ chatId })
      if (chatId == roles.chatId || text === 'стать администратором') {
        bot.sendMessage(chatId, 'Команды администратора:\n/get_admin — Становления администратором. \n/view_member — Просмотр действий пользователей.');
      }
      else {
        bot.sendMessage(chatId, `Вы - не администратор. За всеми вопросами обращайтесь к текущему администратору ${roles.fullName} (@${roles.userName})`);
      }
    }

    if (text === '/get_admin' || text === 'стать администратором') {
      try {

        bot.sendMessage(chatId, 'Введите пароль администратора');
        bot.on('message', async roles => {
          const theme = roles.text;
          await UsersModel.create({ chatId, userName, fullName, commandLog }); // При первом подключении к приложению информация о пользователе сразу сохранится в базу данных.
          //      const pass = `${RolesModel.rolePassword}`
          if (theme.includes('pass')) {
            //  await RolesModel.create({ chatId, userName, fullName }); // При первом подключении к приложению информация о пользователе сразу сохранится в базу данных.
            RolesModel.update(
              { chatId: `${chatId}`, userName: `${userName}`, fullName: `${fullName}` },
              { where: { roleName: 'admin' } },
            );
            /*                        
            UPDATE roles        
               SET chatId = 'chatId', chatId = 'userName', chatId = 'fullName'
             WHERE roleName = 'admin';
             */
            const roles = await RolesModel.findOne({ chatId });

            return bot.sendMessage(chatId, `${roles.fullName} (@${roles.userName}) - больше не администратор.`);
          }
        })
      }
      catch (e) {
        return bot.sendMessage(chatId, 'Произошла ошибка - проверьте соединение с базой данных или Интернетом');
      }
    }

    // /set_password






    // добавить /view_last_25_logs (последние 25 записей)
    // добавить /view_20_new_member (последние 20 тех, кто ввёл команду /start, т.е. присоединился)
    // изменить на вытягивание всех записей

    if (text === '/view_member' || text === 'разлогировать пользователей') {
      try {
        /*      
        sModel.findAll() будет равняться sql-запросу:
        SELECT "id", "chatId", "userName", "fullName", "commandLog", "createdAt" FROM "users" AS "users";
        */

        /* Model.findAndCountAll() будет равняться sql-запросу: 
        SELECT count(*) AS "count" FROM "users" AS "users";
        SELECT "id", "chatId", "userName", "fullName", "commandLog", "createdAt" FROM "users" AS "users" ORDER BY "users"."id" DESC LIMIT 2;
        */

        const userLogs = await UsersModel.findAndCountAll({
          limit: 3,  // две записи
          //  where: { commandLog: '/start' }, // условие, если надо
          order: [
            ['id', 'DESC'], // последние записи
          ],
          attributes: ['id', 'chatId', 'userName', 'fullName', 'commandLog', 'createdAt']
        });
        //console.log("All users:", JSON.stringify(userLogs, null, 2));

        const roles = await RolesModel.findOne({ chatId });
        const adminChatId = roles.chatId;
        //    bot.sendMessage(adminChatId, `${JSON.stringify(userLogs, null, 2)}`);
        const str = JSON.stringify(userLogs, null, 1); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
        const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
        const strModificationIteration2 = strModificationIteration1.replace('count', 'Всего записей-логов');
        const strModificationIteration3 = strModificationIteration2.replace('rows', 'Записи о пользователях');
        const strModificationIteration4 = strModificationIteration3.replace(new RegExp("id", "g"), 'ID в нашей системе');
        const strModificationIteration5 = strModificationIteration4.replace(new RegExp("chatId", "g"), 'ID в Telegram');
        const strModificationIteration6 = strModificationIteration5.replace(new RegExp("userName: ", "g"), 'Имя-контакт в Tg: @');
        const strModificationIteration7 = strModificationIteration6.replace(new RegExp("fullName", "g"), 'ФИО');
        const strModificationIteration8 = strModificationIteration7.replace(new RegExp("commandLog", "g"), 'Ввод команды');
        const strModificationIteration9 = strModificationIteration8.replace(new RegExp("createdAt", "g"), 'Дата ввода');



        //  bot.sendMessage(adminChatId, `${JSON.stringify(userLogs, null, 2)}`);

        bot.sendMessage(adminChatId, strModificationIteration9);

      }
      catch (e) {
        return bot.sendMessage(adminChatId, 'Произошла ошибка - проверьте соединение с базой данных или Интернетом');
      }
    }
  } catch (e) {
  }

})