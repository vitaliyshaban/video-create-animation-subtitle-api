// init.ts

import { Firestore } from "firebase-admin/firestore";
import { PubSub } from '@google-cloud/pubsub';


export const firestore = new Firestore();
export const pubsub = new PubSub();

