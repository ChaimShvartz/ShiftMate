import { ObjectId } from "mongodb";
import { throwHttpError } from "../utils/errors.js";

function toObjectId(id) {
    try {
        return new ObjectId(id);
    } catch {
        throwHttpError(400, "Invalid ID format");
    }
}

function formatId(doc) {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return {
        _id,
        id: _id ? _id.toString() : undefined,
        ...rest,
    };
}

export function createMongoRepo(getCollection) {
    async function getAllDocs(filter = {}, options = {}) {
        const allDocs = await getCollection().find(filter, options).toArray();
        return allDocs.map(formatId);
    }

    async function getDocById(id) {
        const doc = await getCollection().findOne({ _id: toObjectId(id) });
        return formatId(doc);
    }

    async function getDocByField(field, value) {
        const doc = await getCollection().findOne({ [field]: value });
        return formatId(doc);
    }

    async function findOne(filter = {}, options = {}) {
        const doc = await getCollection().findOne(filter, options);
        return formatId(doc);
    }

    async function countDocs(filter = {}) {
        return await getCollection().countDocuments(filter);
    }

    async function createDoc(doc) {
        const result = await getCollection().insertOne(doc);
        return result.insertedId.toString();
    }

    async function updateMany(filter, updateQuery) {
        const result = await getCollection().updateMany(filter, updateQuery);
        return result.modifiedCount;
    }

    async function deleteMany(filter) {
        const result = await getCollection().deleteMany(filter);
        return result.deletedCount;
    }

    async function createMany(docs) {
        if (!docs.length) return [];
        const result = await getCollection().insertMany(docs);
        return Object.values(result.insertedIds).map((id) => id.toString());
    }

    async function deleteDoc(id) {
        const result = await getCollection().deleteOne({
            _id: toObjectId(id),
        });
        return result.deletedCount;
    }

    async function updateDoc(id, updates) {
        const result = await getCollection().updateOne(
            { _id: toObjectId(id) },
            { $set: updates },
        );
        return result.matchedCount;
    }

    async function updateOne(filter, updateQuery, options = {}) {
        const result = await getCollection().updateOne(
            filter,
            updateQuery,
            options,
        );
        return result.modifiedCount;
    }

    return {
        getAllDocs,
        getDocById,
        getDocByField,
        findOne,
        countDocs,
        createDoc,
        createMany,
        updateMany,
        deleteMany,
        deleteDoc,
        updateDoc,
        updateOne,
    };
}
