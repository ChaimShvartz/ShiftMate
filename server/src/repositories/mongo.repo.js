import { ObjectId } from "mongodb";

function formatId(doc) {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return {
        id: _id.toString(),
        ...rest,
    };
}

export function createMongoRepo(getCollection) {
    async function getAllDocs(filter = {}) {
        const allDocs = await getCollection().find(filter).toArray();
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
        createDoc,
        deleteDoc,
        updateDoc,
        updateOne,
    };
}
