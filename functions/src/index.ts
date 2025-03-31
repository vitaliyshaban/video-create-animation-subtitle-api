
import { initializeApp, cert } from "firebase-admin/app";
import * as functions from "firebase-functions";
import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import { UserRecord } from "firebase-admin/auth";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { firestore, pubsub } from "./lib/init"


let serviceAccount = require("../serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

var admin = require("firebase-admin");


exports.helloWorld = functions.https.onRequest((request, response) => {
  console.log(request.body)
  response.send("Hello from Firebase!");
});


exports.scheduledFunctionCrontab = onSchedule("* * * * *", async (event) => {
  console.log('The answer to life, the universe, and everything!');
});

// export const handler = functions.https.onRequest(server.createHandler());

exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Проверка аутентификации администратора
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be an administrative user to set roles.'
    );
  }
  
  const email = data.email;
  const role = data.role;
  try {
    const user: Promise<UserRecord> = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims((await user).uid, { role });
    return { message: `Success! ${email} has been assigned the role of ${role}` };
  } catch (error: any) {
    throw new functions.https.HttpsError('unknown', error.message, error);
  }
});

export const createUser = functions.auth.user().onCreate(async user => {
  const userInfo = {
    userId: user.uid,
    email: user.email,
    name: user.displayName,
    photoUrl: user.photoURL,
    role: "user"
  };
  const role = userInfo.role;
  // console.log(user.uid, role)
  await admin.auth().setCustomUserClaims(user.uid, { role });
  // await auth.setCustomUserClaims(user.uid, { role });
  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User created: ${JSON.stringify(userInfo)}`);
});

export const getUserAuthFunction = onCall(
  { maxInstances: 1 },
  async request => {
    const { data } = request;
    if (data.token) {
      try {
        const res = await admin.auth().verifyIdToken(data.token);
        // const email = res.email;
        // const user: Promise<UserRecord> = await admin.auth().getUserByEmail(email);

        return { ...res };
      } catch (error: any) {
        return {
          success: false,
          message: error.message
        };
      }
    }
    return false;
  }
)

// Обработчик Pub/Sub
// export const helloPubSub = functions.pubsub.topic('my-topic').onPublish((message) => {
//   const data = message.json;
//   console.log(`Received message: ${JSON.stringify(data)}`);
//   return true;
// });

// Функция для подписки на топик Pub/Sub
export const subscribeToTopic = functions.pubsub.topic('my-topic').onPublish((message) => {
  const data = message.json;
  console.log(`Received message: ${JSON.stringify(data)}`);
  return true;
});

export const publishMessage = onCall(
  { maxInstances: 1 },
  async request => {
    const { auth, data } = request;
    if (!data.message) {

    }
    if (!auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Only authenticated users can upload videos"
      );
    }
    const uid = auth.uid;

    // Теперь вы можете использовать `uid` для проверки прав доступа пользователя или выполнения другой логики
    console.log(`User with UID ${uid} accessed the function`);

    // Пример: проверка, является ли пользователь администратором
    const userRecord = await admin.auth().getUser(uid);
    const isAdmin = userRecord.customClaims?.role === 'admin';
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
      await pubsub.topic('my-topic').publishMessage({ data: dataBuffer });
      // Возвращаем успешный результат
      return { success: true, message: `Message "${message}" published to Pub/Sub topic` };
    } catch (error) {
      console.error('Error publishing message:', error);
      throw new functions.https.HttpsError('internal', 'Internal Server Error');
    }
  });

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