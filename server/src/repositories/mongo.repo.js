import { ObjectId } from "mongodb";

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
        const doc = await getCollection().findOne({ _id: new ObjectId(id) });
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

    async function deleteDoc(id) {
        const result = await getCollection().deleteOne({
            _id: new ObjectId(id),
        });
        return result.deletedCount;
    }

    async function updateDoc(id, updates) {
        const result = await getCollection().updateOne(
            { _id: new ObjectId(id) },
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
        deleteDoc,
        updateDoc,
        updateOne,
    };
}
