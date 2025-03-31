"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishMessage = exports.subscribeToTopic = exports.getUserAuthFunction = exports.createUser = void 0;
const app_1 = require("firebase-admin/app");
const functions = __importStar(require("firebase-functions"));
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const init_1 = require("./lib/init");
let serviceAccount = require("../serviceAccountKey.json");
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)(serviceAccount)
});
var admin = require("firebase-admin");
exports.helloWorld = functions.https.onRequest((request, response) => {
    console.log(request.body);
    response.send("Hello from Firebase!");
});
exports.scheduledFunctionCrontab = (0, scheduler_1.onSchedule)("* * * * *", (event) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('The answer to life, the universe, and everything!');
}));
// export const handler = functions.https.onRequest(server.createHandler());
exports.setUserRole = functions.https.onCall((data, context) => __awaiter(void 0, void 0, void 0, function* () {
    // Проверка аутентификации администратора
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an administrative user to set roles.');
    }
    const email = data.email;
    const role = data.role;
    try {
        const user = yield admin.auth().getUserByEmail(email);
        yield admin.auth().setCustomUserClaims((yield user).uid, { role });
        return { message: `Success! ${email} has been assigned the role of ${role}` };
    }
    catch (error) {
        throw new functions.https.HttpsError('unknown', error.message, error);
    }
}));
exports.createUser = functions.auth.user().onCreate((user) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = {
        userId: user.uid,
        email: user.email,
        name: user.displayName,
        photoUrl: user.photoURL,
        role: "user"
    };
    const role = userInfo.role;
    // console.log(user.uid, role)
    yield admin.auth().setCustomUserClaims(user.uid, { role });
    // await auth.setCustomUserClaims(user.uid, { role });
    init_1.firestore.collection("users").doc(user.uid).set(userInfo);
    firebase_functions_1.logger.info(`User created: ${JSON.stringify(userInfo)}`);
}));
exports.getUserAuthFunction = (0, https_1.onCall)({ maxInstances: 1 }, (request) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = request;
    if (data.token) {
        try {
            const res = yield admin.auth().verifyIdToken(data.token);
            // const email = res.email;
            // const user: Promise<UserRecord> = await admin.auth().getUserByEmail(email);
            return Object.assign({}, res);
        }
        catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    return false;
}));
// Обработчик Pub/Sub
// export const helloPubSub = functions.pubsub.topic('my-topic').onPublish((message) => {
//   const data = message.json;
//   console.log(`Received message: ${JSON.stringify(data)}`);
//   return true;
// });
// Функция для подписки на топик Pub/Sub
exports.subscribeToTopic = functions.pubsub.topic('my-topic').onPublish((message) => {
    const data = message.json;
    console.log(`Received message: ${JSON.stringify(data)}`);
    return true;
});
exports.publishMessage = (0, https_1.onCall)({ maxInstances: 1 }, (request) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { auth, data } = request;
    if (!data.message) {
    }
    if (!auth) {
        throw new functions.https.HttpsError("unauthenticated", "Only authenticated users can upload videos");
    }
    const uid = auth.uid;
    // Теперь вы можете использовать `uid` для проверки прав доступа пользователя или выполнения другой логики
    console.log(`User with UID ${uid} accessed the function`);
    // Пример: проверка, является ли пользователь администратором
    const userRecord = yield admin.auth().getUser(uid);
    const isAdmin = ((_a = userRecord.customClaims) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'User is not an admin');
    }
    console.log(`User is Admin ${uid} successful`);
    try {
        // Проверяем наличие параметра сообщения
        const message = data.message;
        if (!message) {
            return { success: false, message: `Message is required` };
            // throw new functions.https.HttpsError('invalid-argument', 'Message is required');
        }
        // Публикуем сообщение в топик Pub/Sub
        const dataBuffer = Buffer.from(JSON.stringify({ message }));
        yield init_1.pubsub.topic('my-topic').publishMessage({ data: dataBuffer });
        // Возвращаем успешный результат
        return { success: true, message: `Message "${message}" published to Pub/Sub topic` };
    }
    catch (error) {
        console.error('Error publishing message:', error);
        throw new functions.https.HttpsError('internal', 'Internal Server Error');
    }
}));
// export const publishMessage = functions.https.onRequest(async (req, res) => {
//   const message = req.body.message;
//   if (!message) {
//     res.status(400).send('Message is required');
//     return;
//   }
//   const dataBuffer = Buffer.from(JSON.stringify({ message }));
//   try {
//     await pubsub.topic('my-topic').publishMessage({ data: dataBuffer });
//     console.log(`publishMessage: ${JSON.stringify(message)}`);
//     res.status(200).send({ data: message });
//   } catch (error) {
//     console.error('Error publishing message:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });
// export const generateSignedUploadUrlForRawVideos = onCall(
//   { maxInstances: 1 },
//   async request => {
//     // check if user is authenticated
//     if (!request.auth) {
//       throw new functions.https.HttpsError(
//         "unauthenticated",
//         "Only authenticated users can upload videos"
//       );
//     }
//     const { auth, data } = request;
//     const bucket = storage.bucket(rawVideoBucketName);
//     const fileName = `${auth.uid}-${Date.now()}.${data?.fileExtension}`;
//     const fileGet = bucket.file(fileName);
//     const [url] = await fileGet.getSignedUrl({
//       version: "v4",
//       action: "write",
//       expires: Date.now() + 15 * 60 * 1000 // 15 minutes
//     });
//     logger.info(`Generated signed URL for ${fileName}`);
//     return { url, fileName };
//   }
// );
// export const getVideos = onCall({ maxInstances: 1 }, async () => {
//   const snapshot = await firestore
//     .collection(videoCollectionId)
//     .limit(100)
//     .get();
//   const videos = snapshot.docs.map(doc => doc.data());
//   logger.info(`Retrieved videos: ${JSON.stringify(videos)}`);
//   return videos;
// });
// export const pushMessage = onCall({ maxInstances: 1 }, async request => {
//   if (!request.auth) {
//     throw new functions.https.HttpsError(
//       "unauthenticated",
//       "Only authenticated users can upload videos"
//     );
//   }
//   const { data } = request;
//   const dataBuffer = Buffer.from(`{"name": "${data?.fileExtension}"}`);
//   const messageId = await pubSubClient
//     .topic(topicNameOrId)
//     .publishMessage({ data: dataBuffer });
//   logger.info(`Message ${messageId} published.`);
//   return messageId;
// });
