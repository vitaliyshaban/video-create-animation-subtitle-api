"use strict";
// const admin = require("firebase-admin");
// import { PubSub } from 'graphql-subscriptions';
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
exports.resolvers = void 0;
// const db = admin.firestore();
// const pubsub = new PubSub();
const init_1 = require("../lib/init");
// const MESSAGE_ADDED = 'MESSAGE_ADDED';
exports.resolvers = {
    Query: {
        hello: () => 'Hello world!',
    },
    Mutation: {
        addMessage: (_, { content }, context) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(content);
            // const docRef = await firestore.collection('messages').add(newMessage);
            const docRef = yield init_1.firestore.collection('cities').doc('LA').set({
                name: content,
                state: "CA",
                country: "USA"
            });
            console.log(docRef);
            // const docRef = await setDoc(doc(firestore, "cities", "LA"), {
            //   name: newMessage,
            //   state: "CA",
            //   country: "USA"
            // });
            const message = {
                id: '11',
                content: content,
                createdAt: '12'
            };
            // pubsub.publish(MESSAGE_ADDED, { messageAdded: message });
            return message;
        })
    },
    // Subscription: {
    //   messageAdded: {
    //     subscribe: () => pubsub.asyncIterator([MESSAGE_ADDED]),
    //   },
    // },
};
