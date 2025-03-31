"use strict";
// init.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.pubsub = exports.firestore = void 0;
const firestore_1 = require("firebase-admin/firestore");
const pubsub_1 = require("@google-cloud/pubsub");
exports.firestore = new firestore_1.Firestore();
exports.pubsub = new pubsub_1.PubSub();
