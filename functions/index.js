// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')({ origin: true });
const app = express();
const cron = express();


const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();



const validateFirebaseIdToken = (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        res.status(403).send('Unauthorized');
        return;
    }

    const idToken = req.headers.authorization.split('Bearer ')[1];

    admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
        console.log('ID Token correctly decoded', decodedIdToken);
        req.user = decodedIdToken;
        return next();
    }).catch((error) => {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).send('Unauthorized');
    });
};


const aceessGuard = (req, res, next) => {
    if (req.user.uid !== 'DUNhX52t0eR0rWrzeRX4Q0W6Aml1') {
        res.status(403).send('Access denied');
        return;
    }
    return next();
};


const uploadVacansies = (vacancies) => {
    const collRef = db.collection("vacancies");
    const idsRef = db.doc("ids/active");
    // Get a new write batch
    const batch = db.batch();

    const timestamp = admin.database.ServerValue.TIMESTAMP;

    const ids = {};
    vacancies.forEach((vacancy) => {
        vacancy.createdAt = timestamp;
        vacancy.updatedAt = timestamp;

        ids[vacancy.id] = true;
        const nycRef = collRef.doc(vacancy.id);
        batch.set(nycRef, vacancy);
    });

    batch.set(idsRef, ids, { merge: true });
    return batch.commit();
};

cron.use(cors);
cron.use(bodyParser.json())
cron.get('/trigger_tick', (req, res) => {
    console.log('trigger_tick');
    return res.json({ tick: new Date });
});

app.use(cors);
app.use(bodyParser.json())
app.use(validateFirebaseIdToken);
app.use(aceessGuard);
app.post('/vacancies', (req, res) => {
    const vacancies = req.body;
    const vss = _.chunk(vacancies, 10);
    const results = [];

    const logResults = (writeResult) => results.push(writeResult);
    vss.reduce((acc, vs) => {
        const call = () => uploadVacansies(vs).then(logResults);
        return acc ? acc.then(call) : call();
    }, null).then(() => {
        return res.json({ results: results });
    }).catch((err) => {
        return res.json({ err: err });
    })
});

app.get('/vacancies_active_ids', (req, res) => {
    db.doc("ids/active")
        .get().then((docSnapshot) => {
            const data = docSnapshot.data();
            return res.json(data);
        });
});

app.get('/vacancies_tocheck', (req, res) => {
    const timestamp = admin.database.ServerValue.TIMESTAMP - 24 * 1000;

    db.collection("vacancies")
        // .where('createdAt', '<', )
        .get().then((querySnapshot) => {
            const companies = {};
            querySnapshot.forEach((t) => {
                const vacancy = t.data();
                if (!companies[vacancy.company]) {
                    companies[vacancy.company] = [];
                }
                companies[vacancy.company].push(vacancy.id);
            });
            return res.json({ companies });
        }).catch((err) => {
            return res.json({ err: err });
        });
});


// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.app = functions.https.onRequest(app);
exports.cron = functions.https.onRequest(cron);



// exports.hourly_job =
//     functions.pubsub.topic('hourly-tick').onPublish((event) => {
//         console.log("This job is ran every hour!")
//     });
