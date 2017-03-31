const MongoClient = require("mongodb").MongoClient;
const fs = require('fs');
const DB_USER = 'admin';
const DB_PASSWORD = 'adminEscapeBot';
const DB_URL= 'ds145220.mlab.com';
const DB_PORT = '45220';
const DB_NAME = 'escapebot';

/**
 * Fonction qui permet de se connecter a la base de donnees MongoDB
 * Elle va jouer le role de fonction main
 */
function connect() {
    MongoClient.connect("mongodb://"+DB_USER+":"+DB_PASSWORD+"@"+DB_URL+":"+DB_PORT+"/"+DB_NAME, function (error, db) {
        if (error) return console.log(error);
        console.log("Connecté à la base de données '"+DB_NAME+"'");

        let collectionName = 'escape';
        let jsonPath = '../scraper/escapes.json';
        deleteData(db,collectionName);
        readAsync(jsonPath)
        .then((data) => {
            insertData(db,collectionName,data)
        })
        .catch((err) => {
            console.log(err);
        });
    });
}

/**
 * Fonction qui permet de lire et de recuperer les informations contenu dans un fichier JSON
 * On effectue une promesse afin de pouvoir recuperer les donnees en dehors de la fonction
 * @param jsonPath : chemin relatif/absolu vers le fichier JSON
 * @returns {*} : data : l'objet contenu l'ensemble des donnees JSON | err : l'objet lance en cas d'erreur
 */
function readAsync(jsonPath) {
    return new Promise((resolve, reject) => {
            fs.readFile(jsonPath, 'utf8', (err, data) => {
            if (err) return reject(err);
                return resolve(JSON.parse(data));
            })
    });
}

/**
 * Fonction qui permet d'inserer des donnees json dans une collection de la base MongoDB
 * @param db : l'objet contenant la connexion a la base de donnees
 * @param collectionName : le nom de la collection dans laquelle on souhaite inserer les donnes
 * @param json : l'ensemble des donnes json a inserer
 */
function insertData(db,collectionName,json){
    let collection = db.collection(collectionName);
    collection.insert(json, function (err, doc) {
        if (err) throw err;
    });
}

/**
 * Fonction qui permet de supprimer l'ensemble des données contenu dans une collection de la base MongoDb
 * @param db : l'objet contenant la connexion a la base de donnees
 * @param collectionName  : le nom de la collection dans laquelle on souhaite inserer les donnes
 */
function deleteData(db,collectionName){
    let collection = db.collection(collectionName);
    collection.remove();
}

connect();

