const
    builder = require('botbuilder'),
    request = require('request'),
    restify = require('restify');

const tab_jour = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const tab_month = ["Janvier", "Février", "mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

let dbMongo;
let MongoClient = require("mongodb").MongoClient;
MongoClient.connect("mongodb://admin:adminEscapeBot@ds145220.mlab.com:45220/escapebot", function(error, db) {
    if (error) return console.log(error);
    dbMongo = db;
    console.log("Connecté à la base de données 'escapebot'");
});

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
            intent: body.result.metadata.intentName || body.result.action,
            entities: body.result.parameters,
            response: body.result.fulfillment.speech,
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

intents.onDefault([
    (session, args) => {
        session.send(args.response);
    }
]);

intents.matches('smalltalk.greetings', [
    (session, args) => {
        session.send(args.response);
        session.send('What can I do for you ?');
    }
]);


bot.dialog('/return_begin', [
    (session) => {
        builder.Prompts.confirm(session,
            'Fine, Do you want to consult other escape room ?'
        );
    },
    (session, results) =>
    {
        if (results.response) {
            session.beginDialog('/know_escape');
        } else {
            session.beginDialog('/return_byebye');
        }
    }

]);

bot.dialog('/return_byebye', [
    (session) => {
        session.send(
            'Ok !! Bye Bye !!'
        );
        session.endDialog();
    }
]);

intents.matches('order_playing', [
    (session) => {
        builder.Prompts.confirm(session, 'I feel like you want to change your ideas or move with your friends ;) Do you want to do an escape game ?')
    },
    (session, results) =>
    {
        if (results.response) {
            session.beginDialog('/know_escape');

        } else {
            session.beginDialog('/return_byebye');
        }
    }
]);

intents.matches('order_escape', [
    (session) => {
        session.beginDialog('/know_escape');
    }
]);

bot.dialog('/know_escape',[
    (session) => {
        session.send(
            'You want to do an escape ! Good :D'
        );
        builder.Prompts.confirm(session, 'Do you know the escape name ?')
    },
    (session, results) =>
    {
        if (results.response) {
            session.beginDialog('/find_name_escape');

        } else {
            session.beginDialog('/find_escape');
        }
    }
]);

bot.dialog('/find_escape',[
    (session) => {
        builder.Prompts.choice(session, "Which level do you want ?", "Debutant|Normale|Expert");
    },
    (session, results) => {
        console.log(results.response);
        session.userData.escapeLevel = results.response.entity;
        findByLevel(dbMongo, "escape", session.userData.escapeLevel).then((data) =>{
            let display = "";
            for(let i = 0 ; i < data.length ; ++i){
                display += "Room : "+ data[i].room +" - Category : "+ data[i].category+"\n\r";
            }
            session.send("%s", display);
            session.beginDialog('/find_name_escape');
        }).catch((err) => {
            console.log(err);
        });
    }
]);

bot.dialog('/find_name_escape',[
    (session) => {
        builder.Prompts.text(session,
            'Give me your escape name.'
        );
    },
    (session, results) => {
        session.userData.escapeName = results.response;
        let now = new Date();
        session.userData.escapeDay = tab_jour[now.getDay()];
        session.userData.escapeDayNumber = now.getDate();
        session.userData.escapeMonth = tab_month[now.getMonth()];
        session.userData.escapeDate = session.userData.escapeDay +" "+ session.userData.escapeDayNumber +" "+ session.userData.escapeMonth;
        findByRoom(dbMongo,"escape",session.userData.escapeName).then((data) => {
            console.log(data);
            let listDispo = findDispoByDate(data[0], session.userData.escapeDate);
            if(listDispo.length === 0){
                listDispo.push("No availabilities");
            }
            session.send(
                'For %s, Here\'s the planning for %s :  \n\r %s \n\r Reservation link : %s',
                session.userData.escapeName,
                session.userData.escapeDate,
                listDispo,
                data[0].urlEscape
            );
            session.beginDialog('/disp_escape');
        }).catch((err) => {
            console.log(err);
        });
    },

]);


bot.dialog('/disp_escape', [
    (session) => {
        builder.Prompts.confirm(session, 'Do you want the availabilities for another day ?');
    },
    (session, results) =>
    {
        if (results.response) {
            session.beginDialog('/other_disp');
        } else {
            session.beginDialog('/return_begin');
        }
    }
]);

bot.dialog('/other_disp', [
    (session) => {
        findByRoom(dbMongo,"escape",session.userData.escapeName).then((data) => {
            let listDate = findAnotherDate(data[0], session.userData.escapeDate);
            if (listDate.length !== 0){
                builder.Prompts.choice(session, "Which date do you want ?", listDate);
            }
            else {
                session.send('No availabilities for this escape game');
                session.beginDialog('/return_begin');
            }
        }).catch((err) => {
            console.log(err);
        });
    },
    (session, results) => {
        console.log(results.response);
        if(results.response !== true){
            console.log(results.response.entity);
            session.userData.escapeDate = results.response.entity;
            findByRoom(dbMongo,"escape",session.userData.escapeName).then((data) => {
                console.log(data);
                session.send(
                    'For %s, Here\'s the planning for %s : \n\r %s \n\r Reservation link : %s',
                    session.userData.escapeName,
                    session.userData.escapeDate,
                    findDispoByDate(data[0], session.userData.escapeDate),
                    data[0].urlEscape
                );
                session.beginDialog('/disp_escape');
            }).catch((err) => {
            console.log(err);
            });
        } else {
            session.endDialog();
        }
     }
]);

/**
 * Fonction renvoie les disponibilites pour un escape avec une date donnee
 * Renvoie rien s'il n'y a pas de disponibilite
 * @param oneEscape
 * @param date
 * @returns {*}
 */
function findDispoByDate(oneEscape,date){
    for (let i = 0; i < oneEscape.availabilities.length; ++i) {
        const a = oneEscape.availabilities[i];
        if (a.dayName && a.dayName.toLowerCase() === date.toLowerCase()
            && a.hours.length !== 0
            && !a.hours[0].startsWith("Plus")) {
            return a.hours;
        }
    }
    return [];
}

/**
 * Fonction qui permet de trouver les escapes disponibles en fonction de la date passee en parametre
 * @param listEscape
 * @param date
 * @returns {Array}
 */
function findAvailableRoomByDate(listEscape,date){
    let listEscapeAvailable = [];
    for (let i = 0; i < listEscape.length; ++i) {
        for (let j = 0; j < listEscape[i].availabilities.length; ++j) {
            const a = listEscape[i].availabilities[j];
            if (a.dayName && a.dayName.toLowerCase() === date.toLowerCase()
                && a.hours.length !== 0
                && !a.hours[0].startsWith("Plus")) {
                listEscapeAvailable.push(listEscape[i]);
            }
        }
    }
    return listEscapeAvailable
}

/**
 * Fonction qui permet de recuperer l'ensemble des escapes
 * @param db
 * @param collectionName
 * @returns {*}
 */
function findAllRoom(db,collectionName){
    var objectToFind = {};
    return find(db,collectionName,objectToFind)
}

/**
 * Fonction qui permet de trouver les autres dates disponibles pour un escape donnee
 * La data en parametre permet d'eviter de redonner la date choisit par l'utilisateur precedement
 * @param oneEscape
 * @param date
 * @returns {Array}
 */
function findAnotherDate(oneEscape,date){
    let listDate = []
    for (let i = 0; i < oneEscape.availabilities.length; ++i) {
        const a = oneEscape.availabilities[i];
        if (a.dayName && a.dayName.toLowerCase() !== date.toLowerCase()
            && a.hours.length !== 0
            && !a.hours[0].startsWith("Plus")) {
            listDate.push(a.dayName);
        }
    }
    return listDate
}

/**
 * Fonction qui retourne l'ensemble des escapes par rapport a un niveau donne
 * @param db
 * @param collectionName
 * @param levelToFind
 * @returns {*}
 */
function findByLevel(db,collectionName,levelToFind){
    var objectToFind = { level: new RegExp(levelToFind,'i')};
    return find(db,collectionName,objectToFind)
}

/**
 * Fonction qui retourne l'ensemble des escapes par rapport a un nom donne
 * @param db
 * @param collectionName
 * @param roomToFind
 * @returns {*}
 */
function findByRoom(db,collectionName,roomToFind){
    var objectToFind = { room: new RegExp(roomToFind,'i')};
    return find(db,collectionName,objectToFind)
}
/**
 * Fonction generale qui permet de recherche dans la base de donnee
 * L'objet passe en parametre permet de determiner les clauses "WHERE" a appliquer
 * @param db
 * @param collectionName
 * @param objectToFind
 * @returns {*}
 */
function find(db,collectionName,objectToFind){
    var collection = db.collection(collectionName);
    return collection.find(objectToFind).toArray();
}

/*
    findByRoom(db,collectionName,"Un crime presque parfait").then((data) => {
        //console.log(data)
        return findByRoom(db,collectionName,"Normale");
    }).then((data) => {
        // console.log(data);
        return findByRoom(db,collectionName,"Un crime presque parfait");
    }).then((data) => {
        if(data)
            console.log(findDispoByDate(data[0],"Vendredi 31 mars"));
    }).catch((err) => {
        console.log(err);
    });
    */