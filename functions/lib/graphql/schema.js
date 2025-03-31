"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const apollo_server_1 = require("apollo-server");
exports.typeDefs = (0, apollo_server_1.gql) `
  type Query {
    hello: String
  }

  type Mutation {
    addMessage(content: String!): Message
  }
  type Subscription {
    messageAdded: Message
  }
  type Message {
    id: ID!
    content: String!
    createdAt: String!
  }
`;
