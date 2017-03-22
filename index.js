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

const recognizer = new   ApiAiRecognizer('69c06ee86020433f90e0edeb298f9433');
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

intents.matches(/play/i, [
        (session) => {
        session.beginDialog('/order_escape');
}
]);

intents.matches(/do/i, [
        (session) => {
        session.beginDialog('/order_escape');
}
]);

intents.matches('order_escape', [
        (session, args) => {
        session.send(
        'Hi Dude ! You want to play an %s ! Okay !!',
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
    } else {
        builder.Prompts.text(session,
            'Ok I shut up'
        );
    }
}
]);