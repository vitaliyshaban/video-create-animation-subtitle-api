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
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const functions = __importStar(require("firebase-functions"));
const apollo_server_cloud_functions_1 = require("apollo-server-cloud-functions");
const schema_1 = require("./schema");
const resolvers_1 = require("./resolvers");
const schema_2 = require("@graphql-tools/schema");
const schema = (0, schema_2.makeExecutableSchema)({ typeDefs: schema_1.typeDefs, resolvers: resolvers_1.resolvers });
exports.server = new apollo_server_cloud_functions_1.ApolloServer({
    schema,
    // introspection: true,
    context: ({ req, res }) => {
        var _a;
        const token = (_a = req.headers["authorization"]) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
        if (!token) {
            throw new functions.https.HttpsError('permission-denied', 'Must be an administrative user to set roles.');
        }
    },
});
