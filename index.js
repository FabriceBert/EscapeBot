const
    builder = require('botbuilder'),
    request = require('request'),
    restify = require('restify');

class ApiAiRecognizer {
    constructor(token) { this._token = token; }

    recognize(context, done) {
        const opts = {
            url: 'https://api.api.ai/v1/query?v=20150910',
            headers: { Authorization: `Bearer ${this._token}` },
            json: {
                query: context.message.text,
                lang: 'en',
                sessionId: '0000',
            },
        };

        request.post(opts, (err, res, body) => {
            if (err) return done(err);

        return done(null, {
            score: body.result.score,
            intent: body.result.metadata.intentName,
            entities: body.result.parameters,
        });
    });
    }
}

const recognizer = new   ApiAiRecognizer('');
const intents = new builder.IntentDialog({
    recognizers: [recognizer],
});

const server = restify.createServer();
server.listen(3978, () => {
    console.log('Listening on port 3978');
});

const connector = new builder.ChatConnector({
        appId:'',
    appPassword:''
});

const bot = new builder.UniversalBot(connector);
server.post('/', connector.listen());

bot.dialog('/', intents);

intents.onDefault([
    (session) => {
        session.send(
            'Hi Dude !'
        );
    }
]);

intents.matches('order_playing', [
        (session) => {
            builder.Prompts.text(session,
                'I feel like you want to change your ideas or move with your friends ;) What do you want to do ?'
            );
        }
]);


intents.matches('order_escape', [
        (session, args) => {
            session.send(
                'You want to play an %s ! Okay !!',
                args.entities.game_type
            );
        builder.Prompts.confirm(session, 'Do you know the escape name ?')
        },
        (session, results) =>
        {
            if (results.response) {
                builder.Prompts.text(session,
                    'Ok I would find a escape room'
                );
                session.reset(results);
            } else {
                builder.Prompts.text(session,
                    'Ok I shut up'
                );
                session.reset(results);
                builder.Prompts.confirm(session, 'For 10h ?')
            }
        },
        (session, results) =>
        {
            if (results.response) {
                builder.Prompts.text(session,
                    'Ok I would find a escape room at 10h'
                );
            } else {
                builder.Prompts.text(session,
                    'Ok I shut up'
                );
                session.reset(results)
            }
        }

]);