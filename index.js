const
    builder = require('botbuilder'),
    restify = require('restify');


const connector = new builder.ConsoleConnector()
    .listen();

const bot = new builder.UniversalBot(connector);

const intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.onDefault([
        (session) => {
        session.send(
        'Hello! Do you want to play an escape game'
        );
        builder.Prompts.confirm(session, "Test?");
        }
]);
